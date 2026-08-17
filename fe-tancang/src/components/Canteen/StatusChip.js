import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

/** Cấu hình chip trạng thái theo SRS: upcoming | active | completed | cancelled */
const STATUS_CONFIG = {
  upcoming: { label: 'Sắp tới', color: '#DBEAFE', textColor: '#1D4ED8', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
  active:   { label: 'Đang hoạt động', color: '#D1FAE5', textColor: '#065F46', icon: <PlayCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  completed:{ label: 'Đã hoàn thành', color: '#F0FDF4', textColor: '#15803D', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  cancelled:{ label: 'Đã hủy', color: '#FEE2E2', textColor: '#B91C1C', icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
};

/**
 * Chip hiển thị trạng thái đăng ký
 * @param {{ status: 'upcoming'|'active'|'completed'|'cancelled' }} props
 */
const StatusChip = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.color,
        color: cfg.textColor,
        fontWeight: 600,
        fontSize: 11,
        '& .MuiChip-icon': { color: cfg.textColor, ml: 0.5 },
      }}
    />
  );
};

export default StatusChip;
