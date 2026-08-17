/**
 * Register Modal - Modal đăng ký suất ăn
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';

const SESSION_CONFIG = {
  1: { name: 'Ăn sáng', time: '06:30 - 08:00', price: 25000 },
  2: { name: 'Ăn trưa', time: '11:00 - 13:00', price: 25000 },
  3: { name: 'Ăn tối', time: '17:30 - 19:00', price: 35000 },
};

const RegisterModal = ({ open, onClose, editData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      if (editData) {
        setSelectedDate(editData.date);
        setSelectedSessions(editData.sessions || []);
        setNote(editData.note || '');
      } else {
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setSelectedSessions([]);
        setNote('');
      }
      setError('');
      setSuccess('');
    }
  }, [open, editData]);

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === 3) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions([1, 2, 3]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      setError('Vui lòng chọn ngày');
      return;
    }
    if (selectedSessions.length === 0) {
      setError('Vui lòng chọn ít nhất một ca ăn');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        date: selectedDate,
        meal_session_ids: selectedSessions,
        note: note || undefined,
      };

      // Call API here
      // const res = await mealBookingService.register(payload);

      setSuccess('Đăng ký thành công!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = selectedSessions.reduce(
    (sum, id) => sum + (SESSION_CONFIG[id]?.price || 0),
    0
  );

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {editData ? 'Chỉnh sửa đăng ký' : 'Đăng ký suất ăn'}
        </Typography>
        <Button
          size="small"
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Date Picker */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Chọn ngày
            </Typography>
            <TextField
              type="date"
              fullWidth
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Session Selection */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle2">Chọn ca ăn</Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedSessions.length === 3 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {Object.entries(SESSION_CONFIG).map(([id, config]) => (
                <Box
                  key={id}
                  onClick={() => handleSessionToggle(Number(id))}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: selectedSessions.includes(Number(id))
                      ? 'primary.main'
                      : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: selectedSessions.includes(Number(id))
                      ? 'primary.light'
                      : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Checkbox
                        checked={selectedSessions.includes(Number(id))}
                        onChange={() => handleSessionToggle(Number(id))}
                        sx={{ p: 0 }}
                      />
                      <Box>
                        <Typography fontWeight={600}>{config.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {config.time}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography fontWeight={600}>
                      {new Intl.NumberFormat('vi-VN').format(config.price)} đ
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Note */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Ghi chú (tùy chọn)
            </Typography>
            <TextField
              multiline
              rows={2}
              fullWidth
              placeholder="Nhập ghi chú nếu có..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>

          {/* Total */}
          {selectedSessions.length > 0 && (
            <Box
              sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={600}>Tổng cộng:</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {new Intl.NumberFormat('vi-VN').format(totalPrice)} đ
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || selectedSessions.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Đang xử lý...' : editData ? 'Cập nhật' : 'Đăng ký'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterModal;
