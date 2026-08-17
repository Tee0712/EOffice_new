import React from "react";
import { Box, Grid, Typography, Stack, Button, CircularProgress, Breadcrumbs, Link } from "@mui/material";
import { SkyTitle } from "@styles/SkyStyles";
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';

import { useDashboardData } from "./hooks/useDashboardData";
import SummaryCard from "./components/SummaryCard";
import TrendChartCard from "./components/TrendChartCard";
import DonutChartCard from "./components/DonutChartCard";
import ProgramsTable from "./components/ProgramsTable";
import AreaDistributionChart from "./components/AreaDistributionChart";
import UpcomingEventsList from "./components/UpcomingEventsList";

// Helper for Filter buttons - Moved outside to prevent re-creation and infinite loops
const TimeFilterButton = ({ label, currentQuarter, onClick }) => {
  const isActive = currentQuarter === label || (label === "Năm" && currentQuarter === "Năm");
  return (
    <Button
      variant={isActive ? "contained" : "text"}
      onClick={() => onClick("quarter", label)}
      sx={{
        borderRadius: "8px",
        color: isActive ? "#FFFFFF" : "#64748B",
        bgcolor: isActive ? "#2563EB" : "transparent",
        boxShadow: isActive ? "0px 2px 4px rgba(37, 99, 235, 0.2)" : "none",
        px: 2,
        minWidth: "60px",
        fontWeight: isActive ? 700 : 500,
        fontSize: "0.85rem",
        textTransform: "none",
        "&:hover": {
          backgroundColor: isActive ? "#1D4ED8" : "rgba(100, 116, 139, 0.08)",
          boxShadow: isActive ? "0px 4px 8px rgba(37, 99, 235, 0.3)" : "none",
        }
      }}
      size="small"
    >
      {label}
    </Button>
  );
};

const DashboardASXH = () => {
  const { filter, isRealtime, setIsRealtime, handleFilterChange, summary, trend, distribution, programs, upcomingEvents, localityDistribution, loading } = useDashboardData();

  if (loading && !summary) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, md: 3, lg: 4 },
      backgroundColor: "#F0F4F9",
      fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
      "& *": { fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif" }
    }}>
      {/* Header & Filters */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            Dashboard An Sinh Xã Hội
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748B",
            }}
          >
            Tổng quan hoạt động an sinh xã hội — Năm 2026
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: isRealtime ? "#DCFCE7" : "#F1F5F9",
              px: 1.75,
              py: 0.75,
              borderRadius: "24px",
              cursor: "pointer",
              transition: "all 0.2s",
              border: `1px solid ${isRealtime ? "#BBF7D0" : "#E2E8F0"}`,
              boxShadow: isRealtime ? "0px 1px 2px rgba(34, 197, 94, 0.1)" : "none",
              "&:hover": {
                opacity: 0.9,
                backgroundColor: isRealtime ? "#BBF7D0" : "#E2E8F0"
              }
            }}
            onClick={setIsRealtime}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isRealtime ? "#22C55E" : "#94A3B8", mr: 1.25 }} />
            <Typography variant="caption" sx={{ color: isRealtime ? "#15803D" : "#64748B", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.02em" }}>
              Dữ liệu realtime
            </Typography>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              backgroundColor: "#FFFFFF",
              p: 0.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            {["Q1", "Q2", "Q3", "Q4", "Năm"].map((label) => (
              <TimeFilterButton key={label} label={label} currentQuarter={filter.quarter} onClick={handleFilterChange} />
            ))}
          </Stack>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={<AccountBalanceWalletOutlinedIcon />}
            title="Tổng ngân sách ASXH"
            value={summary?.total_budget ? (summary.total_budget / 1000000000).toFixed(2) : "0.00"}
            unit="tỷ VNĐ"
            trendText={summary?.total_budget_growth ? `↑ ${summary.total_budget_growth.toFixed(2)}% so với 2025` : "↑ 0.00% so với 2025"}
            topBorderColor="#2563EB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={<ShowChartOutlinedIcon />}
            title="Đã giải ngân"
            value={summary?.disbursed_amount ? (summary.disbursed_amount / 1000000000).toFixed(2) : "0.00"}
            unit="tỷ VNĐ"
            trendText={summary?.disbursed_rate ? `↑ ${summary.disbursed_rate.toFixed(2)}% ngân sách` : ""}
            topBorderColor="#16A34A"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={<StarOutlineIcon />}
            title="Chương trình triển khai"
            value={summary?.total_programs || 0}
            unit="chương trình"
            trendText={summary?.new_programs ? `↑ +${summary.new_programs} chương trình mới` : ""}
            topBorderColor="#EA580C"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={<GroupOutlinedIcon />}
            title="Người thụ hưởng"
            value={summary?.total_beneficiaries ? summary.total_beneficiaries.toLocaleString() : "0"}
            unit="người"
            trendText={summary?.beneficiaries_growth ? `↑ +${summary.beneficiaries_growth.toFixed(2)}% so với 2025` : ""}
            topBorderColor="#7C3AED"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <TrendChartCard data={trend} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <DonutChartCard data={distribution?.items} total={distribution?.total_budget} />
        </Grid>
      </Grid>

      {/* Row 3: Full Width Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <ProgramsTable data={programs?.items} loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <AreaDistributionChart data={localityDistribution} loading={loading} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <UpcomingEventsList data={upcomingEvents?.items} loading={loading} />
        </Grid>
      </Grid>

    </Box>
  );
};

export default DashboardASXH;
