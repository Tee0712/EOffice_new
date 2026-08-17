import React, { useMemo, useState } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import ReportHeader from "./components/ReportHeader";
import ReportTabs from "./components/ReportTabs";
import KPIGrid from "./components/KPIGrid";
import FilterBar from "./components/FilterBar";
import ReportTable from "./components/ReportTable";
import { useReportData } from "../../../hooks/useReportData";
import "./Reports.css";

const formatPeriodLabel = (filters, summary = {}) => {
  if (filters?.period === "last_month") return "Tháng trước";
  if (filters?.period === "quarter") return "Quý hiện tại";
  if (summary?.period_month && summary?.period_year) {
    return `Tháng ${String(summary.period_month).padStart(2, "0")}/${summary.period_year}`;
  }
  return "Tháng hiện tại";
};

const tabIcon = (tab) => {
  if (tab === 0) return "📦";
  if (tab === 1) return "🏢";
  if (tab === 2) return "📊";
  return "💰";
};

const tabTitle = (tab) => {
  if (tab === 0) return "Báo cáo Xuất - Nhập - Tồn kho";
  if (tab === 1) return "Báo cáo sử dụng VPP theo phòng ban";
  if (tab === 2) return "So sánh sử dụng thực tế và định mức";
  return "Báo cáo chi phí tổng hợp";
};

const VppReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const [filters, setFilters] = useState({
    period: "current_month",
    department: "All",
    category: "All",
    keyword: "",
  });

  const { data, loading, categories, departments, summary } = useReportData(
    activeTab,
    filters
  );
  const hasData = Array.isArray(data) && data.length > 0;
  const periodLabel = useMemo(
    () => formatPeriodLabel(filters, summary),
    [filters, summary]
  );

  return (
    <Box sx={{ backgroundColor: "#f1f5f9", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <ReportHeader
          activeTab={activeTab}
          filters={filters}
          loading={loading}
          hasData={hasData}
        />
        <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            mb: 4,
          }}
        >
          <FilterBar
            filters={filters}
            categories={categories}
            departments={departments}
            activeTab={activeTab}
            onFilter={(newFilters) => setFilters(newFilters)}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,26,46,0.06)",
            backgroundColor: "#fff",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 3, py: 2.5, borderBottom: "1px solid #f1f5f9" }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ color: "#2563eb", display: "flex" }}>
                {tabIcon(activeTab)}
              </Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#0f172a", fontSize: "16px" }}
              >
                {tabTitle(activeTab)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  backgroundColor: "#f1f5f9",
                  p: 0.5,
                  borderRadius: "8px",
                  display: "flex",
                }}
              >
                <Box
                  onClick={() => setSubTab(0)}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor: subTab === 0 ? "#2563eb" : "transparent",
                    color: subTab === 0 ? "#fff" : "#64748b",
                    boxShadow:
                      subTab === 0
                        ? "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
                        : "none",
                    transition: "all 0.2s",
                  }}
                >
                  Chi tiết
                </Box>
                <Box
                  onClick={() => setSubTab(1)}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor: subTab === 1 ? "#2563eb" : "transparent",
                    color: subTab === 1 ? "#fff" : "#64748b",
                    boxShadow:
                      subTab === 1
                        ? "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
                        : "none",
                    transition: "all 0.2s",
                  }}
                >
                  Theo nhóm
                </Box>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "#94a3b8", fontSize: "13px", ml: 1 }}
              >
                {periodLabel}
              </Typography>
            </Stack>
          </Stack>

          <KPIGrid activeTab={activeTab} summary={summary} loading={loading} />
          <ReportTable
            activeTab={activeTab}
            subTab={subTab}
            data={data}
            summary={summary}
            loading={loading}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default VppReports;
