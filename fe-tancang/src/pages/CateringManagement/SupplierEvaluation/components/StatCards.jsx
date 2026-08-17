import React from 'react';
import { Grid, Box, Typography, Card, CardContent } from '@mui/material';
import { 
  Assignment as AssignmentIcon, 
  Schedule as ScheduleIcon, 
  Verified as VerifiedIcon, 
  ThumbUp as ThumbUpIcon, 
  ReportProblem as ReportProblemIcon 
} from '@mui/icons-material';

const iconMap = {
  assignment: AssignmentIcon,
  schedule: ScheduleIcon,
  verified: VerifiedIcon,
  thumb_up: ThumbUpIcon,
  report_problem: ReportProblemIcon,
};

const StatCards = ({ stats }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.icon];
        return (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ 
              borderRadius: '24px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: '16px', 
                    bgcolor: stat.bgColor, 
                    color: stat.color,
                    display: 'flex'
                  }}>
                    <Icon />
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#1a3353', fontSize: '24px', fontWeight: 900 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatCards;
