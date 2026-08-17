import React from "react";
import { Box, Typography, Stack } from "@mui/material";

const StatItem = ({
  label,
  value,
  trend,
  trendValue,
  color,
  isLast = false,
}) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      flex: 1,
      minWidth: 140,
      borderRight: isLast ? "none" : "1px solid #e2e8f0",
      py: 2,
      px: 2.5,
    }}
  >
    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 0.5 }}>
      <Typography
        sx={{
          color,
          fontSize: "20px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </Typography>
      {trend && (
        <Box
          sx={{
            ml: 1,
            display: "inline-flex",
            alignItems: "center",
            bgcolor: trend === "up" ? "#dcfce7" : "#fee2e2",
            px: 0.8,
            py: 0.2,
            borderRadius: "10px",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: trend === "up" ? "#16a34a" : "#dc2626",
              fontSize: "10.5px",
            }}
          >
            {trend === "up" ? "↑" : "↓"}{" "}
            {trendValue || (trend === "up" ? "18%" : "12%")}
          </Typography>
        </Box>
      )}
    </Stack>
    <Typography
      variant="caption"
      sx={{
        color: "#475569",
        fontSize: "11.5px",
        fontWeight: 600,
        opacity: 0.9,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Typography>
  </Stack>
);

const KPIGrid = ({ activeTab, summary: data = {}, loading }) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    overflowX: "auto",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
  };

  if (loading) {
    return (
      <Box sx={{ ...containerStyle, py: 3, px: 2 }}>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Đang tính toán...
        </Typography>
      </Box>
    );
  }

  if (activeTab === 0) {
    return (
      <Box sx={containerStyle}>
        <StatItem
          label="Tồn đầu kỳ"
          value={(data.opening || 0).toLocaleString()}
          color="#2563eb"
        />
        <StatItem
          label="Tổng nhập"
          value={`+${(data.import || 0).toLocaleString()}`}
          color="#16a34a"
        />
        <StatItem
          label="Tổng xuất"
          value={`-${Math.abs(Number(data.export || 0)).toLocaleString()}`}
          color="#dc2626"
        />
        <StatItem
          label="Điều chỉnh"
          value={data.adjustment || "0"}
          color="#d97706"
        />
        <StatItem
          label="Tồn cuối kỳ"
          value={(data.closing || 0).toLocaleString()}
          color="#7c3aed"
        />
        <StatItem
          label="Giá trị xuất kho"
          value={`${((data.value || 0) / 1000000).toFixed(1)}tr`}
          color="#0f1a2e"
          isLast
        />
      </Box>
    );
  }

  if (activeTab === 1) {
    return (
      <Box sx={containerStyle}>
        <StatItem
          label="Tổng số phiếu"
          value={`${data.total_requests || 0}`}
          color="#2563eb"
        />
        <StatItem
          label="Tổng VPP đã cấp"
          value={(data.total_items || 0).toLocaleString()}
          color="#d97706"
        />
        <StatItem
          label="Tổng chi phí"
          value={`${((data.total_cost || 0) / 1000000).toFixed(1)}tr`}
          color="#16a34a"
        />
        <StatItem
          label="Phòng ban dùng nhiều nhất"
          value={data.max_dept || "-"}
          color="#7c3aed"
          isLast
        />
      </Box>
    );
  }

  if (activeTab === 2) {
    return null;
  }

  if (activeTab === 3) {
    const hasPrevious = Boolean(data.has_previous);
    const trendNumber = Number(data.trend || 0);
    const trendDirection = hasPrevious
      ? trendNumber > 0
        ? "up"
        : trendNumber < 0
          ? "down"
          : null
      : null;

    return (
      <Box sx={containerStyle}>
        <StatItem
          label="Chi phí hiện tại"
          value={`${((data.total || 0) / 1000000).toFixed(1)}tr`}
          color="#2563eb"
        />
        <StatItem
          label="So với tháng trước"
          value={`${((data.last_month || 0) / 1000000).toFixed(1)}tr`}
          trend={trendDirection}
          trendValue={hasPrevious ? `${trendNumber}%` : ""}
          color="#d97706"
        />
        <StatItem
          label="Tỷ lệ tối ưu chi phí"
          value={`${data.efficiency || 0}%`}
          color="#16a34a"
          isLast
        />
      </Box>
    );
  }

  return null;
};

export default KPIGrid;
