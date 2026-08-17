import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

const StatusTabs = ({ activeTab, counts, onChange }) => {
  const tabs = [
    { label: 'Tất cả', value: 'all', count: counts?.total || 0, color: '#1a73e8' },
    { label: 'Nháp', value: 'DRAFT', count: counts?.DRAFT || counts?.draft || 0, color: '#64748b' },
    { label: 'Chờ duyệt', value: 'PENDING_APPROVAL', count: counts?.PENDING_APPROVAL || counts?.pending || counts?.pending_approval || ((counts?.pending_dept_approval || 0) + (counts?.pending_hc_approval || 0)), color: '#f59e0b' },
    { label: 'Chờ cấp phát', value: 'APPROVED', count: counts?.APPROVED || counts?.approved || counts?.pending_issue || 0, color: '#3b82f6' },
    { label: 'Từ chối', value: 'REJECTED', count: counts?.REJECTED || counts?.rejected || 0, color: '#ef4444' },
    { label: 'Hoàn thành', value: 'FINISHED', count: counts?.FINISHED || counts?.finished || 0, color: '#10b981' },
  ];

  return (
    <Box 
      sx={{ 
        mb: 3, 
        bgcolor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.value;
        return (
          <Box
            key={tab.value}
            onClick={() => onChange(tab.value)}
            sx={{
              flex: 1,
              py: 1.5,
              px: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              position: 'relative',
              bgcolor: isActive ? '#f0f7ff' : 'transparent',
              borderRight: index < tabs.length - 1 ? '1px solid #e2e8f0' : 'none',
              '&::after': isActive ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                bgcolor: '#1a73e8'
              } : {},
              '&:hover': {
                bgcolor: isActive ? '#f0f7ff' : '#f8fafc'
              }
            }}
          >
            <Box 
              sx={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                bgcolor: tab.color,
                opacity: isActive ? 1 : 0.6
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: isActive ? 700 : 500, 
                color: isActive ? '#1a73e8' : '#64748b' 
              }}
            >
              {tab.label}
            </Typography>
            <Box 
              sx={{ 
                px: 1, 
                py: 0.2, 
                borderRadius: '10px', 
                bgcolor: `${tab.color}15`,
                border: '1px solid',
                borderColor: `${tab.color}30`
              }}
            >
              <Typography sx={{ fontSize: '10px', fontWeight: 800, color: tab.color }}>
                {tab.count}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default StatusTabs;
