import React, { useState } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, CircularProgress } from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import ChartCard from "./ChartCard";

const AreaDistributionChart = ({ data, loading }) => {
  const [chartType, setChartType] = useState("column");
  const chartColors = ["#2563EB", "#0D9488", "#EA580C", "#7C3AED", "#D97706", "#16A34A", "#DC2626"];

  const formatYAxis = (tickItem) => {
    if (tickItem === 0) return "0 tỷ";
    return `${(tickItem / 1000000000).toFixed(1)} tỷ`;
  };

  const formatTooltip = (value) => {
    return `${(value / 1000000000).toFixed(2)} tỷ VNĐ`;
  };

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const extraToggle = (
    <ToggleButtonGroup
      size="small"
      value={chartType}
      exclusive
      onChange={handleTypeChange}
      sx={{
        height: 32,
        bgcolor: "#F1F5F9",
        p: 0.5,
        borderRadius: "8px",
        border: "none",
        "& .MuiToggleButtonGroup-grouped": {
          border: 0,
          borderRadius: "6px !important",
          mx: 0.1,
          px: 1.5,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.75rem",
          color: "#64748B",
          "&.Mui-selected": {
            bgcolor: "#FFFFFF",
            color: "#0F172A",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
            "&:hover": {
              bgcolor: "#FFFFFF",
            }
          }
        }
      }}
    >
      <ToggleButton value="column">Cột</ToggleButton>
      <ToggleButton value="bar">Ngang</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <ChartCard title="Phân bổ theo khu vực" extra={extraToggle} sx={{ height: "100%", borderRadius: "16px", boxShadow: "0px 4px 20px rgba(0,0,0,0.03)" }}>
      <Box sx={{ width: "100%", height: 340, mt: 2 }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout={chartType === "column" ? "horizontal" : "vertical"} 
              data={data} 
              margin={{ 
                top: 20, 
                right: 30, 
                left: chartType === "bar" ? 40 : 20, 
                bottom: chartType === "column" ? 20 : 0 
              }} 
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                type={chartType === "column" ? "category" : "number"}
                dataKey={chartType === "column" ? "name" : undefined}
                axisLine={false}
                tickLine={false}
                tickFormatter={chartType === "bar" ? formatYAxis : undefined}
                tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                dy={chartType === "column" ? 10 : 0}
              />
              <YAxis
                type={chartType === "column" ? "number" : "category"}
                dataKey={chartType === "bar" ? "name" : undefined}
                axisLine={false}
                tickLine={false}
                tickFormatter={chartType === "column" ? formatYAxis : undefined}
                tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                dx={chartType === "column" ? -10 : 0}
                width={chartType === "bar" ? 80 : 60}
              />
              <Tooltip
                formatter={formatTooltip}
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0px 8px 24px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="value" 
                radius={chartType === "column" ? [6, 6, 0, 0] : [0, 6, 6, 0]} 
                barSize={chartType === "column" ? 48 : 32}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography color="textSecondary" align="center" sx={{ pt: 10 }}>Không có dữ liệu</Typography>
        )}
      </Box>
    </ChartCard>
  );
};

export default AreaDistributionChart;
