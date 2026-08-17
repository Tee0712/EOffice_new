import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

const SummaryCards = ({ summary, loading }) => {
  const cards = [
    {
      label: 'Chờ cấp phát',
      count: summary?.pending || 0,
      icon: <Inventory2OutlinedIcon fontSize="medium" sx={{ color: '#3b82f6' }}/>,
      bgColor: '#eff6ff', // light blue
    },
    {
      label: 'Cấp một phần',
      count: summary?.partial || 0,
      icon: <LocalShippingOutlinedIcon fontSize="medium" sx={{ color: '#a855f7' }}/>,
      bgColor: '#faf5ff', // light purple
    },
    {
      label: 'Đã hoàn tất tháng này', /* Theo design */
      count: summary?.finished || 0,
      icon: <CheckCircleOutlineOutlinedIcon fontSize="medium" sx={{ color: '#22c55e' }}/>,
      bgColor: '#f0fdf4', // light green
    },
    {
      label: 'Quá hạn cấp phát',
      count: summary?.overdue || 0,
      icon: <AccessTimeOutlinedIcon fontSize="medium" sx={{ color: '#f59e0b' }}/>,
      bgColor: '#fffbeb', // light orange
    }
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
      {cards.map((card, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}
        >
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: card.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {card.icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {loading ? '...' : card.count}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
              {card.label}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default SummaryCards;
