import { useCallback, useEffect, useMemo, useState } from "react";
import { officeSupplyReportService } from "@services/vppOfficeSupplyReportService";

const DEFAULT_CATEGORIES = [
  { value: "Giấy in", label: "Giấy in" },
  { value: "Bút viết", label: "Bút viết" },
  { value: "Bìa / Cặp", label: "Bìa / Cặp" },
  { value: "Mực in", label: "Mực in" },
];

const mapActiveTabToReportType = (activeTab) => {
  if (activeTab === 1) return "department";
  if (activeTab === 2) return "quota";
  if (activeTab === 3) return "cost";
  return "inventory";
};

const normalizeFilters = (filters = {}) => {
  const normalized = { ...filters };
  const keyword = String(normalized.keyword || "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.department === "All") normalized.department = "";
  if (normalized.category === "All") normalized.category = "";
  normalized.keyword = keyword.slice(0, 100);

  if (normalized.fromDate && normalized.toDate) {
    normalized.periodType = "custom";
  }

  return normalized;
};

export const useReportData = (activeTab, filters) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});

  const reportType = useMemo(
    () => mapActiveTabToReportType(activeTab),
    [activeTab]
  );

  useEffect(() => {
    let mounted = true;

    const fetchFilters = async () => {
      try {
        const filterData = await officeSupplyReportService.getFilters();
        const nextCategories =
          Array.isArray(filterData?.categories) &&
          filterData.categories.length > 0
            ? filterData.categories
            : DEFAULT_CATEGORIES;
        const nextDepartments =
          Array.isArray(filterData?.departments) &&
          filterData.departments.length > 0
            ? filterData.departments
            : [];

        if (mounted) {
          setCategories(nextCategories);
          setDepartments(nextDepartments);
        }
      } catch (fetchError) {
        if (mounted) {
          setCategories(DEFAULT_CATEGORIES);
          setDepartments([]);
        }
      }
    };

    fetchFilters();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await officeSupplyReportService.getReportData(
        reportType,
        normalizeFilters(filters)
      );

      setData(Array.isArray(response?.rows) ? response.rows : []);
      setSummary(
        response?.summary && typeof response.summary === "object"
          ? response.summary
          : {}
      );
    } catch (fetchError) {
      setError(fetchError?.message || "Không thể tải dữ liệu báo cáo.");
      setData([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [filters, reportType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    categories,
    departments,
    summary,
    refresh: fetchData,
  };
};

export default useReportData;
