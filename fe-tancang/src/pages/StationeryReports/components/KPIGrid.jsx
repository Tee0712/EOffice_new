import React from 'react';
import { Box, Typography, Stack, Grid, useMediaQuery, useTheme } from '@mui/material';
import { 
  TrendingUp as UpIcon, 
  TrendingDown as DownIcon
} from '@mui/icons-material';

const StatItem = ({ label, value, trend, trendValue, color, isLast = false }) => (
  <Stack 
    alignItems="center" 
    sx={{ 
      flex: 1, 
      minWidth: 120,
      borderRight: isLast ? 'none' : '1px solid #f1f5f9',
      px: 2
    }}
  >
    <Stack direction="row" alignItems="baseline" spacing={0.5}>
      <Typography variant="h5" fontWeight={900} sx={{ color: color, fontSize: 26 }}>{value}</Typography>
      {trend && (
        <Stack direction="row" alignItems="center" spacing={0.2} sx={{ ml: 1 }}>
          {trend === 'up' ? <UpIcon sx={{ fontSize: 12, color: '#16a34a' }} /> : <DownIcon sx={{ fontSize: 12, color: '#ef4444' }} />}
          <Typography variant="caption" fontWeight={700} sx={{ color: trend === 'up' ? '#16a34a' : '#ef4444', fontSize: 10 }}>
            {trendValue}
          </Typography>
        </Stack>
      )}
    </Stack>
    <Typography variant="caption" fontWeight={600} sx={{ color: '#64748b', whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
  </Stack>
);

const KPIGrid = ({ activeTab, data = {}, variant = 'row' }) => {
  if (activeTab === 0) {
    return (
      <Box sx={{ py: 3, px: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap', overflowX: 'auto' }}>
        <StatItem label="Tồn đầu kỳ" value="8,452" color="#2563eb" />
        <StatItem label="Tổng nhập" value="+2,680" trend="up" trendValue="18%" color="#16a34a" />
        <StatItem label="Tổng xuất" value="-1,945" trend="down" trendValue="12%" color="#ef4444" />
        <StatItem label="Điều chỉnh" value="-35" color="#f97316" />
        <StatItem label="Tồn cuối kỳ" value="9,152" trend="up" trendValue="8.3%" color="#7c3aed" />
        <StatItem label="Giá trị xuất kho" value="42.8tr" color="#1e293b" isLast={true} />
      </Box>
    );
  }

  // Same logic for other tabs...
  return null;
};

export default KPIGrid;
