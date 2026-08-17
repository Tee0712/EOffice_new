/**
 * Registration Detail Modal - Modal chi tiết đăng ký
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Chip,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HistoryIcon from '@mui/icons-material/History';
import dayjs from 'dayjs';

const SESSION_CONFIG = {
  1: { name: 'Ăn sáng', time: '06:30 - 08:00', color: '#F59E0B' },
  2: { name: 'Ăn trưa', time: '11:00 - 13:00', color: '#10B981' },
  3: { name: 'Ăn tối', time: '17:30 - 19:00', color: '#8B5CF6' },
};

const STATUS_CONFIG = {
  upcoming: { label: 'Sắp tới', color: 'info' },
  active: { label: 'Đang hoạt động', color: 'success' },
  completed: { label: 'Đã hoàn thành', color: 'default' },
  cancelled: { label: 'Đã hủy', color: 'error' },
  auto_cut: { label: 'Tự động cắt', color: 'warning' },
};

const RegistrationDetailModal = ({ open, onClose, registration }) => {
  if (!registration) return null;

  const sessions = (registration.sessions || []).map(
    (id) => SESSION_CONFIG[id]
  ).filter(Boolean);

  const totalPrice = sessions.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  const history = registration.history || [
    {
      action: 'registered',
      time: registration.created_at,
      label: 'Đăng ký suất ăn',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Chi tiết đăng ký
        </Typography>
        <Button size="small" onClick={onClose} sx={{ minWidth: 'auto', p: 0.5 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Status Badge */}
          <Box>
            <Chip
              label={
                STATUS_CONFIG[registration.status]?.label || registration.status
              }
              color={STATUS_CONFIG[registration.status]?.color || 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Date & Sessions */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 2,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon sx={{ color: 'text.secondary' }} />
                <Typography fontWeight={600}>
                  {dayjs(registration.date).format('dddd, DD/MM/YYYY')}
                </Typography>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center">
                <RestaurantIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2">Ca ăn đã đăng ký:</Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {sessions.map((session, idx) => (
                  <Chip
                    key={idx}
                    label={`${session.name} (${session.time})`}
                    sx={{
                      bgcolor: session.color,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>

              <Divider />

              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Tổng tiền:</Typography>
                <Typography fontWeight={800} color="primary.main">
                  {new Intl.NumberFormat('vi-VN').format(
                    registration.total_cost || totalPrice
                  )}{' '}
                  đ
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Note */}
          {registration.note && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Ghi chú:
              </Typography>
              <Typography color="text.secondary">
                {registration.note}
              </Typography>
            </Box>
          )}

          {/* History Timeline */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <HistoryIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle2">Lịch sử thao tác</Typography>
            </Stack>
            <Timeline sx={{ p: 0, m: 0 }}>
              {history.map((item, idx) => (
                <TimelineItem key={idx}>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    {idx < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2" fontWeight={600}>
                      {item.label}
                    </Typography>
                    {item.time && (
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(item.time).format('HH:mm, DD/MM/YYYY')}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationDetailModal;
