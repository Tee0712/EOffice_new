/**
 * Quick Panel - Panel đăng ký nhanh hàng loạt
 */
import React, { useState } from 'react';
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
  FormGroup,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';

const TEMPLATES = [
  { id: 'sang_trua', label: 'Sáng + Trưa', sessions: [1, 2] },
  { id: 'trua_toi', label: 'Trưa + Tối', sessions: [2, 3] },
  { id: 'ca_3', label: 'Cả 3 ca', sessions: [1, 2, 3] },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ nhật' },
];

const QuickPanel = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('sang_trua');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // T2-T6
  const [dateRange, setDateRange] = useState({
    start: dayjs().format('YYYY-MM-DD'),
    end: dayjs().add(1, 'month').format('YYYY-MM-DD'),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDayToggle = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSelectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleSelectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSubmit = async () => {
    if (selectedDays.length === 0) {
      setError('Vui lòng chọn ít nhất một ngày');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const template = TEMPLATES.find((t) => t.id === selectedTemplate);
      const payload = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        days_of_week: selectedDays,
        meal_session_ids: template?.sessions || [1, 2],
      };

      // Call API
      // const res = await mealBookingService.bulkRegister(payload);

      setSuccess('Đăng ký nhanh thành công!');
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

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6" fontWeight={700}>
          Đăng ký nhanh
        </Typography>
        <Button size="small" onClick={onClose} disabled={loading} sx={{ minWidth: 'auto', p: 0.5 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {/* Template Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Chọn mẫu đăng ký
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  variant={selectedTemplate === t.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Days of Week */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle2">Chọn ngày trong tuần</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleSelectWeekdays}>
                  T2-T6
                </Button>
                <Button size="small" onClick={handleSelectAllDays}>
                  Tất cả
                </Button>
              </Stack>
            </Stack>
            <FormGroup row>
              {DAYS_OF_WEEK.map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      size="small"
                    />
                  }
                  label={day.label}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Date Range */}
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Từ ngày"
              size="small"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              type="date"
              label="Đến ngày"
              size="small"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Summary */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tóm tắt đăng ký
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                <strong>Mẫu:</strong> {template?.label}
              </Typography>
              <Typography variant="body2">
                <strong>Ngày:</strong>{' '}
                {selectedDays
                  .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                  .join(', ')}
              </Typography>
              <Typography variant="body2">
                <strong>Thời gian:</strong> {dateRange.start} - {dateRange.end}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || selectedDays.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickPanel;
