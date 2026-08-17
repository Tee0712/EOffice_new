import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { 
  Inventory2Outlined as InventoryIcon,
  LocalShippingOutlined as ShippingIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmberOutlined as WarningIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, color, icon }) => {
  const getIcon = () => {
    switch (icon) {
      case 'inventory_2': return <InventoryIcon />;
      case 'local_shipping': return <ShippingIcon />;
      case 'check_circle': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      default: return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 4,
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        minWidth: 240,
        flex: 1,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' }
      }}
    >
      <Box
        sx={{
          width: 54,
          height: 54,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}15`,
          color: color,
          '& svg': { fontSize: 28 }
        }}
      >
        {getIcon()}
      </Box>
      <Box>
        <Typography variant="body2" color="textSecondary" fontWeight={600} sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

export default StatCard;
