import React from 'react';
import { Box, Typography } from '@mui/material';

const StatusTabs = ({ activeTab, onTabChange, summary = {} }) => {
  const tabs = [
    { id: 'WAITING', label: 'Chờ cấp phát', count: summary.pending || 0, color: '#3b82f6' },
    { id: 'PARTIAL', label: 'Cấp một phần', count: summary.partial || 0, color: '#a855f7' },
    { id: 'COMPLETED', label: 'Đã hoàn tất', count: summary.finished || 0, color: '#22c55e' },
  ];

  return (
    <Box sx={{ width: '100%', mb: 0 }}>
      <Box sx={{ 
        display: 'flex', 
        bgcolor: '#ffffff', 
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        width: '100%'
      }}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Box
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                px: 3,
                py: 2,
                cursor: 'pointer',
                bgcolor: isActive ? '#eff6ff' : 'transparent',
                borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                borderRight: '1px solid #f1f5f9',
                transition: 'all 0.2s ease',
                '&:last-child': { borderRight: 'none' }
              }}
            >
              {/* Colored Dot */}
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: tab.color 
                }} 
              />
              
              {/* Label */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: isActive ? tab.color : '#475569' 
                }}
              >
                {tab.label}
              </Typography>
              
              {/* Count Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '12px',
                  bgcolor: isActive ? '#bfdbfe' : '#e2e8f0',
                  color: isActive ? '#1e3a8a' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  minWidth: 20
                }}
              >
                {tab.count}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StatusTabs;
