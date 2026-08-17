import React, { useState } from "react";
import { ToggleButtonGroup, ToggleButton, Box, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import ChartCard from "./ChartCard";

const formatYAxis = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
  return value;
};

const formatTooltip = (value) => {
  return `${(value / 1000000000).toFixed(2)} tỷ VNĐ`;
};

const TrendChartCard = ({ title, data }) => {
  const [chartType, setChartType] = useState("line");

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const extra = (
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
          px: 2,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8rem",
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
      <ToggleButton value="line">Đường</ToggleButton>
      <ToggleButton value="bar">Cột</ToggleButton>
    </ToggleButtonGroup>
  );

  const chartData = (data || []).map(item => ({
    name: `T${item.month}`,
    cash: item.cash_amount,
    in_kind: item.in_kind_amount,
    education: item.education_amount
  }));

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="colorInKind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="colorEducation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0px 8px 24px rgba(0,0,0,0.12)", padding: "12px" }} 
            formatter={formatTooltip} 
            cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }} 
          />
          <Legend 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '40px', fontWeight: 600, color: "#64748B" }} 
            verticalAlign="bottom" 
            align="center" 
          />
          <Area type="monotone" dataKey="cash" name="Bằng tiền" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" dot={{ r: 4, fill: "#0D9488", stroke: "#FFF", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="in_kind" name="Hiện vật" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorInKind)" dot={{ r: 4, fill: "#EA580C", stroke: "#FFF", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="education" name="Giáo dục" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorEducation)" dot={{ r: 4, fill: "#7C3AED", stroke: "#FFF", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </AreaChart>
      );
    }

    return (
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0px 8px 24px rgba(0,0,0,0.12)" }} formatter={formatTooltip} cursor={{ fill: '#F1F5F9' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '40px', fontWeight: 600, color: "#64748B" }} verticalAlign="bottom" align="center" />
        <Bar dataKey="cash" name="Bằng tiền" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={20} />
        <Bar dataKey="in_kind" name="Hiện vật" fill="#EA580C" radius={[4, 4, 0, 0]} barSize={20} />
        <Bar dataKey="education" name="Giáo dục" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={20} />
      </BarChart>
    );
  };

  return (
    <ChartCard title={title || "Xu hướng giải ngân theo tháng"} extra={extra}>
      <Box sx={{ width: "100%", height: 320 }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <Typography color="textSecondary" align="center" sx={{ pt: 10 }}>Không có dữ liệu</Typography>
        )}
      </Box>
    </ChartCard>
  );
};

export default TrendChartCard;
