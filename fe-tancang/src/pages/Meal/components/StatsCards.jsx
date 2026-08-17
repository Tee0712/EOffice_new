/**
 * Stats Cards Component - Thẻ thống kê
 * Hiển thị số lượng suất ăn theo ca và tổng
 */
import React from 'react';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

const StatCard = ({ title, value, borderColor, icon, delta }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: 2,
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography
          fontSize={String(value).length > 4 ? 28 : 36}
          fontWeight={800}
          lineHeight={1.2}
        >
          {value}
        </Typography>
        {delta !== undefined && delta !== null && (
          <Typography
            fontSize={13}
            fontWeight={600}
            color={delta >= 0 ? 'success.main' : 'error.main'}
          >
            {delta > 0 ? '+' : ''}{delta}
          </Typography>
        )}
      </Box>
      {icon && (
        <Box sx={{ color: borderColor, opacity: 0.8 }}>{icon}</Box>
      )}
    </Stack>
    <Typography fontSize={13} color="text.secondary" mt={1}>
      {title}
    </Typography>
  </Paper>
);

const StatsCards = ({ stats, showMonthly = true }) => {
  const defaultStats = {
    total_registered: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
    total_cost: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  };

  const mergedStats = { ...defaultStats, ...stats };

  if (showMonthly) {
    return (
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Tổng đăng ký"
            value={mergedStats.total_registered}
            borderColor="#3B82F6"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Sắp tới"
            value={mergedStats.upcoming}
            borderColor="#10B981"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Đã hoàn thành"
            value={mergedStats.completed}
            borderColor="#6366F1"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Đã hủy"
            value={mergedStats.cancelled}
            borderColor="#EF4444"
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} mb={3}>
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Suất sáng"
          value={mergedStats.breakfast}
          borderColor="#F59E0B"
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Suất trưa"
          value={mergedStats.lunch}
          borderColor="#10B981"
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Suất tối"
          value={mergedStats.dinner}
          borderColor="#8B5CF6"
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Tổng cộng"
          value={mergedStats.breakfast + mergedStats.lunch + mergedStats.dinner}
          borderColor="#3B82F6"
        />
      </Grid>
    </Grid>
  );
};

export default StatsCards;
