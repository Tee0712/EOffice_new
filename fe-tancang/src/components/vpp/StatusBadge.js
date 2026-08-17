import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ label, type }) => {
  const getColors = () => {
    switch (type) {
      case 'urgent':
      case 'overdue':
        return { bg: 'rgba(211, 47, 47, 0.1)', color: 'var(--error-color)' };
      case 'completed':
        return { bg: 'rgba(46, 125, 50, 0.1)', color: 'var(--success-color)' };
      case 'partial':
        return { bg: 'rgba(2, 136, 209, 0.1)', color: 'var(--pending-color)' };
      default:
        return { bg: 'rgba(0, 0, 0, 0.05)', color: '#666' };
    }
  };

  const { bg, color } = getColors();

  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: bg,
        color: color,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: '6px',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
};

export default StatusBadge;
