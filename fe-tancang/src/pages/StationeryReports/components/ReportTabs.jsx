import React from 'react';
import { Box, Stack, Typography, Grid, useMediaQuery, useTheme } from '@mui/material';

const ReportTabs = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const tabsConfig = [
    { label: "Xuất nhập tồn", icon: "📦", color: "#2563eb", bg: "#eff6ff" },
    { label: "Theo phòng ban", icon: "🏢", color: "#64748b", bg: "#f1f5f9" },
    { label: "Thực tế vs. Định mức", icon: "📊", color: "#64748b", bg: "#f1f5f9" },
    { label: "Chi phí tổng hợp", icon: "💰", color: "#64748b", bg: "#f1f5f9" }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        {tabsConfig.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <Grid item xs={6} sm={3} key={index}>
              <Box
                onClick={() => onTabChange(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  border: '1px solid',
                  borderColor: isActive ? '#2563eb' : '#e2e8f0',
                  boxShadow: isActive ? '0 10px 15px -3px rgba(37, 99, 235, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#2563eb',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                    mr: 1.5,
                    fontSize: 20,
                    border: '1px solid',
                    borderColor: isActive ? '#bfdbfe' : '#f1f5f9'
                  }}
                >
                  {tab.icon}
                </Box>
                <Typography 
                  variant="body2" 
                  fontWeight={isActive ? 700 : 500} 
                  color={isActive ? '#2563eb' : '#475569'}
                  sx={{ fontSize: 13 }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ReportTabs;
