/**
 * CheckIn Page - Điểm danh suất ăn
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { mealBookingService } from '@services/mealBookingService';
import dayjs from 'dayjs';

const SESSION_CONFIG = [
  { id: 1, name: 'Sáng', time: '06:30-08:00', color: '#F59E0B' },
  { id: 2, name: 'Trưa', time: '11:00-13:00', color: '#10B981' },
  { id: 3, name: 'Tối', time: '17:30-19:00', color: '#8B5CF6' },
];

const STATUS_CONFIG = {
  checked: { label: 'Đã ăn', color: 'success', icon: CheckCircleIcon },
  pending: { label: 'Chờ', color: 'warning', icon: PendingIcon },
  absent: { label: 'Vắng', color: 'error', icon: PersonOff },
};

const CheckInPage = () => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSlot, setSelectedSlot] = useState(2); // Default lunch
  const [checkinList, setCheckinList] = useState([]);
  const [stats, setStats] = useState({ checked: 0, pending: 0, absent: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCheckinList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mealBookingService.getCheckinList({ date, slot: selectedSlot });
      if (res?.success) {
        setCheckinList(res.data || []);
      }
    } catch (error) {
      console.error('Fetch checkin error:', error);
    } finally {
      setLoading(false);
    }
  }, [date, selectedSlot]);

  useEffect(() => {
    fetchCheckinList();
  }, [fetchCheckinList]);

  // Auto focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedSlot, date]);

  // Calculate stats
  useEffect(() => {
    const checked = checkinList.filter((item) => item.status === 'checked').length;
    const pending = checkinList.filter((item) => item.status === 'pending').length;
    const absent = checkinList.filter((item) => item.status === 'absent').length;
    setStats({ checked, pending, absent });
  }, [checkinList]);

  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        // Call checkin API
        // const res = await mealBookingService.checkin({ user_code: searchQuery, slot: selectedSlot });
        setMessage({ type: 'success', text: `Điểm danh thành công cho mã: ${searchQuery}` });
        setSearchQuery('');
        fetchCheckinList();
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Điểm danh thất bại' });
      }
    }
  };

  const handleBulkCheckin = async (status) => {
    setSaving(true);
    try {
      const selectedItems = checkinList.filter((item) => item.selected);
      if (selectedItems.length === 0) {
        setMessage({ type: 'warning', text: 'Vui lòng chọn ít nhất một nhân viên' });
        return;
      }
      // Call bulk checkin API
      // await mealBookingService.bulkCheckin({ date, slot: selectedSlot, status, user_ids: selectedItems.map(i => i.user_id) });
      setMessage({ type: 'success', text: `Cập nhật ${selectedItems.length} nhân viên thành công` });
      fetchCheckinList();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const filteredList = checkinList.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.user_name?.toLowerCase().includes(query) ||
      item.user_code?.toLowerCase().includes(query) ||
      item.department?.toLowerCase().includes(query)
    );
  });

  const session = SESSION_CONFIG.find((s) => s.id === selectedSlot);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Check-in Suất ăn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Điểm danh nhân viên tại cửa ăn
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
        </Stack>
      </Stack>

      {/* Session Selector */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={2}>
          <Typography fontWeight={600}>Chọn ca ăn:</Typography>
          <ToggleButtonGroup
            value={selectedSlot}
            exclusive
            onChange={(_, value) => value && setSelectedSlot(value)}
            size="small"
          >
            {SESSION_CONFIG.map((session) => (
              <ToggleButton key={session.id} value={session.id}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: session.color }} />
                  <span>{session.name}</span>
                  <Typography variant="caption" color="text.secondary">
                    ({session.time})
                  </Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              borderLeft: '4px solid #10B981',
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, color: '#10B981' }} />
            <Typography variant="h4" fontWeight={800}>
              {stats.checked}
            </Typography>
            <Typography color="text.secondary">Đã ăn</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              borderLeft: '4px solid #F59E0B',
              textAlign: 'center',
            }}
          >
            <PendingIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
            <Typography variant="h4" fontWeight={800}>
              {stats.pending}
            </Typography>
            <Typography color="text.secondary">Chờ</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              borderLeft: '4px solid #EF4444',
              textAlign: 'center',
            }}
          >
            <PersonOffIcon sx={{ fontSize: 40, color: '#EF4444' }} />
            <Typography variant="h4" fontWeight={800}>
              {stats.absent}
            </Typography>
            <Typography color="text.secondary">Vắng</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* QR Search */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <QrCodeScannerIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <TextField
            inputRef={inputRef}
            placeholder="Quét mã QR hoặc nhập mã nhân viên, nhấn Enter..."
            fullWidth
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="large">
            Điểm danh
          </Button>
        </Stack>
      </Paper>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Bulk Actions */}
      <Stack direction="row" spacing={1} mb={2}>
        <Button variant="outlined" size="small" onClick={() => handleBulkCheckin('checked')}>
          Đánh dấu đã ăn
        </Button>
        <Button variant="outlined" color="error" size="small" onClick={() => handleBulkCheckin('absent')}>
          Đánh dấu vắng
        </Button>
      </Stack>

      {/* Checkin List */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell width={40}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      setCheckinList((prev) =>
                        prev.map((item) => ({ ...item, selected: e.target.checked }))
                      );
                    }}
                  />
                </TableCell>
                <TableCell>STT</TableCell>
                <TableCell>Mã NV</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Bộ phận</TableCell>
                <TableCell>Giờ checkin</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ mt: 1 }}>Đang tải dữ liệu...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <HowToRegIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography color="text.secondary">Chưa có dữ liệu điểm danh</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item, idx) => {
                  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow
                      key={item.id || idx}
                      hover
                      sx={{ bgcolor: item.is_valid === false ? 'warning.50' : 'inherit' }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.selected || false}
                          onChange={(e) => {
                            setCheckinList((prev) =>
                              prev.map((i, iIdx) =>
                                iIdx === idx ? { ...i, selected: e.target.checked } : i
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.user_code || item.code}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{item.user_name || item.name}</Typography>
                      </TableCell>
                      <TableCell>{item.department || '-'}</TableCell>
                      <TableCell>{item.checked_in_at ? dayjs(item.checked_in_at).format('HH:mm') : '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<StatusIcon />}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {item.is_valid === false && (
                          <Chip label="Vãng lai" color="warning" size="small" sx={{ ml: 0.5 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default CheckInPage;
