import React from "react";
import { Box, Stack, Typography } from "@mui/material";

const ReportTabs = ({ activeTab, onTabChange }) => {
  const tabsConfig = [
    { label: "Xuất nhập tồn", icon: "📦" },
    { label: "Theo phòng ban", icon: "🏢" },
    { label: "Thực tế và Định mức", icon: "📊" },
    { label: "Chi phí tổng hợp", icon: "💰" },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
        {tabsConfig.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <Box
              key={index}
              onClick={() => onTabChange(index)}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2.5,
                py: 1.2,
                borderRadius: "10px",
                cursor: "pointer",
                backgroundColor: isActive ? "#2563eb" : "#ffffff",
                color: isActive ? "#ffffff" : "#64748b",
                border: "1px solid",
                borderColor: isActive ? "#2563eb" : "#e2e8f0",
                boxShadow: isActive
                  ? "0 4px 12px rgba(37, 99, 235, 0.2)"
                  : "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <Box sx={{ mr: 1.2, fontSize: 18 }}>{tab.icon}</Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ fontSize: "14px" }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ReportTabs;
