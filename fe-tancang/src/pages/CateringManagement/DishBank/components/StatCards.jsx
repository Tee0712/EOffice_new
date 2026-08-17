import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';

const StatCard = ({ label, value, icon, color }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2, 
      borderRadius: '16px', 
      border: '1px solid #eef2f6',
      bgcolor: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.3s ease',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }
    }}
  >
    <Box sx={{ 
      width: 44, 
      height: 44, 
      borderRadius: '10px', 
      bgcolor: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '22px',
      flexShrink: 0,
      color: 'white'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a3353', lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>{label}</Typography>
    </Box>
  </Paper>
);

const StatCards = ({ summary }) => (
  <Grid container spacing={2} sx={{ mb: 4 }}>
    {summary.map((stat, index) => (
      <Grid item xs={12} sm={6} md={2.4} key={index}>
        <StatCard {...stat} />
      </Grid>
    ))}
  </Grid>
);

export default StatCards;
