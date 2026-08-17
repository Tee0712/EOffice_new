import React from 'react';
import { Card, Typography, Grid } from '@mui/material';

const SummaryCards = ({ summary }) => {
  const stats = [
    { label: 'Sáng', value: summary?.breakfast || 0, color: 'warning.main' },
    { label: 'Trưa', value: summary?.lunch || 0, color: 'success.main' },
    { label: 'Tối', value: summary?.dinner || 0, color: 'secondary.main' },
    { label: 'Tổng', value: summary?.total || 0, color: 'primary.main' },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} md={3} key={index}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              borderLeft: '6px solid',
              borderColor: stat.color,
              bgcolor: 'background.paper',
              boxShadow: (theme) => theme.shadows[1],
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {Number(stat.value || 0).toLocaleString('vi-VN')}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
