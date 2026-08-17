import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { 
  Storefront as StoreIcon, 
  CheckCircle as ActiveIcon, 
  Warning as ExpiringIcon, 
  Error as ExpiredIcon 
} from '@mui/icons-material';

const StatCard = ({ title, count, icon, color, bgColor }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 2, 
      borderRadius: '8px', 
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height: '100%'
    }}
  >
    <Box 
      sx={{ 
        width: 48, 
        height: 48, 
        borderRadius: '8px', 
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
        {count}
      </Typography>
    </Box>
  </Paper>
);

const StatCards = ({ summary }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Tổng Nhà cung cấp" 
          count={summary.total || 0} 
          icon={<StoreIcon size={24} />} 
          color="#1890ff"
          bgColor="#e6f7ff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Đang hoạt động" 
          count={summary.active || 0} 
          icon={<ActiveIcon size={24} />} 
          color="#52c41a"
          bgColor="#f6ffed"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Sắp hết hạn" 
          count={summary.expiringSoon || 0} 
          icon={<ExpiringIcon size={24} />} 
          color="#faad14"
          bgColor="#fffbe6"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Hết hạn" 
          count={summary.expired || 0} 
          icon={<ExpiredIcon size={24} />} 
          color="#f5222d"
          bgColor="#fff1f0"
        />
      </Grid>
    </Grid>
  );
};

export default StatCards;
