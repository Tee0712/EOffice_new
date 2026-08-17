import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";

const DonutChartCard = ({ title, data, total }) => {
  const COLORS = {
    "CASH": "#0D9488",
    "IN_KIND": "#EA580C",
    "EDUCATION": "#7C3AED"
  };

  const labelMapping = {
    "CASH": "Bằng tiền",
    "IN_KIND": "Bằng hiện vật",
    "EDUCATION": "Tài trợ giáo dục"
  };

  const chartData = (data || []).map(item => ({
    name: labelMapping[item.funding_type] || item.label,
    value: item.amount,
    percent: item.percentage,
    color: item.color || COLORS[item.funding_type] || "#BDBDBD"
  }));

  const formatTooltip = (value) => `${(value / 1000000000).toFixed(2)} tỷ VNĐ`;

  return (
    <ChartCard title={title || "Phân bổ theo loại hình tài trợ"}>
      <Box sx={{ display: "flex", alignItems: "center", height: 320 }}>
        
        {/* Left: Donut Chart */}
        <Box sx={{ width: "50%", height: "100%", position: "relative" }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={75}
                  outerRadius={105}
                  stroke="none"
                  dataKey="value"
                  paddingAngle={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <Typography align="center" sx={{ pt: 12 }}>Chưa có dữ liệu</Typography>
          )}

          {/* Center Text */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1, fontSize: "1.75rem" }}>
              {total ? (total / 1000000000).toFixed(1) : "0"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.65rem", display: "block", mt: 0.5 }}>
              TỶ VNĐ
            </Typography>
          </Box>
        </Box>

        {/* Right: Legend custom */}
          <Stack spacing={2} sx={{ width: "100%" }}>
            {chartData.map((item, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "3px", backgroundColor: item.color }} />
                  <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.875rem" }}>
                    {item.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem", minWidth: 60, textAlign: "right" }}>
                    {(item.value / 1000000000).toFixed(1)} tỷ
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.8rem", minWidth: 35, textAlign: "right" }}>
                    {item.percent}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>

      </Box>
    </ChartCard>
  );
};

export default DonutChartCard;
