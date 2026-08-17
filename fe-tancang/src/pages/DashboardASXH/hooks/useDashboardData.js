import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import dashboardAsxhService from "../../../services/dashboardAsxhService";
import { trackAction } from "../../../utils/trackAction";

// Inlined Schemas to resolve inexplicable ReferenceError
const summarySchema = z.object({
  total_budget: z.number(),
  total_budget_growth: z.number().nullable().optional(),
  disbursed_amount: z.number(),
  disbursed_rate: z.number(),
  total_programs: z.number(),
  new_programs: z.number(),
  total_beneficiaries: z.number(),
  beneficiaries_growth: z.number().nullable().optional(),
});

const trendItemSchema = z.object({
  month: z.number(),
  cash_amount: z.number(),
  in_kind_amount: z.number(),
  education_amount: z.number(),
  total_amount: z.number(),
});
const trendSchema = z.array(trendItemSchema);

const distributionItemSchema = z.object({
  funding_type: z.string(),
  label: z.string(),
  amount: z.number(),
  percentage: z.number(),
  color: z.string(),
});
const distributionSchema = z.object({
  total_budget: z.number(),
  items: z.array(distributionItemSchema),
});

const programItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  funding_type: z.string(),
  funding_type_label: z.string().optional(),
  locality: z.string(),
  budget: z.number(),
  progress: z.number(),
  status: z.string(),
  status_label: z.string().optional(),
});
const programsSchema = z.object({
  total: z.number(),
  items: z.array(programItemSchema),
});

const eventItemSchema = z.object({
  id: z.number(),
  event_date: z.string(),
  title: z.string(),
  description: z.string(),
  badge_label: z.string(),
  badge_color: z.string(),
});
const eventsSchema = z.object({
  items: z.array(eventItemSchema),
});

const localityDistributionSchema = z.array(z.object({
  name: z.string(),
  value: z.number(),
}));

export const useDashboardData = () => {
  const [filter, setFilter] = useState({ year: 2026, quarter: "Năm" });
  const [isRealtime, setIsRealtime] = useState(false);

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [localityDistribution, setLocalityDistribution] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentParams = { 
        year: filter.year,
        quarter: filter.quarter !== "Năm" ? filter.quarter : undefined 
      };

      // Chạy song song 6 requests (Waterfalls eliminated as per Vercel standard)
      const [sumRes, trendRes, distRes, progRes, evtRes, locRes] = await Promise.all([
        dashboardAsxhService.getSummary(currentParams),
        dashboardAsxhService.getDisbursementTrend(currentParams),
        dashboardAsxhService.getFundingDistribution(currentParams),
        dashboardAsxhService.getPrograms({ ...currentParams, page: 1, page_size: 5 }),
        dashboardAsxhService.getUpcomingEvents({ year: filter.year }), // Events usually show upcoming 30 days regardless of Q
        dashboardAsxhService.getLocalityDistribution(currentParams)
      ]);

      // Validate data with Zod (Enterprise Standard)
      // Extract data property if response follows { success, data, message } or use raw response
      const getRawData = (res) => res?.data ?? res;

      setSummary(summarySchema.parse(getRawData(sumRes)));
      setTrend(trendSchema.parse(getRawData(trendRes)));
      setDistribution(distributionSchema.parse(getRawData(distRes)));
      setPrograms(programsSchema.parse(getRawData(progRes)));
      setUpcomingEvents(eventsSchema.parse(getRawData(evtRes)));
      setLocalityDistribution(localityDistributionSchema.parse(getRawData(locRes)));

    } catch (error) {
      console.error("❌ Dashboard Data Error:", error);
      // In a real app, show a toast here: toast.error("Không thể tải dữ liệu dashboard")
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let intervalId;
    if (isRealtime) {
      intervalId = setInterval(() => {
        fetchData();
      }, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRealtime, fetchData]);

  /**
   * Thay đổi bộ lọc và ghi log audit
   */
  const handleFilterChange = useCallback((key, value) => {
    setFilter(prev => {
      const newFilter = { ...prev, [key]: value };
      
      // Audit Logging: trackAction (Enterprise Standard)
      trackAction("CHANGE_DASHBOARD_FILTER", {
        field: key,
        oldValue: prev[key],
        newValue: value,
        fullFilter: newFilter
      });
      
      return newFilter;
    });
  }, []);

  const toggleRealtime = useCallback(() => {
    setIsRealtime(prev => {
      const nextState = !prev;
      trackAction("TOGGLE_DASHBOARD_REALTIME", { enabled: nextState });
      return nextState;
    });
  }, []);

  return {
    filter,
    isRealtime,
    setIsRealtime: toggleRealtime,
    handleFilterChange,
    summary,
    trend,
    distribution,
    programs,
    upcomingEvents,
    localityDistribution,
    loading,
    refetch: fetchData
  };
};
