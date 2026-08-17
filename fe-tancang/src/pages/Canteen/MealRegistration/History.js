import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  ArrowBack, 
  Search, 
  FilterList, 
  Cancel, 
  InfoOutlined,
  CalendarToday
} from '@mui/icons-material';
import moment from 'moment';
import { canteenService } from '@services/canteenService';

const MealRegistrationHistory = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(moment().format('YYYY-MM'));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchHistory();
  }, [month]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await canteenService.getMyRegistrations(month);
      setRegistrations(data);
    } catch (error) {
      console.error('Fetch history error:', error);
      showSnackbar('Không thể tải lịch sử', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCancel = async (regId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký này?')) return;
    
    try {
      await canteenService.cancelRegistration(regId, { reason: 'User cancelled via history' });
      showSnackbar('Đã hủy đăng ký thành công');
      fetchHistory();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Không thể hủy đăng ký', 'error');
    }
  };

  const getStatusChip = (status, menu) => {
    const isPast = moment(menu?.menu_date).isBefore(moment(), 'day');
    
    if (status === 'cancelled') return <Chip label="Đã hủy" color="error" size="small" variant="outlined" />;
    if (status === 'auto_cut') return <Chip label="Tự động cắt" color="warning" size="small" variant="outlined" />;
    if (status === 'registered') {
      return isPast ? <Chip label="Đã dùng" color="success" size="small" /> : <Chip label="Đã đăng ký" color="primary" size="small" />;
    }
    return <Chip label={status} size="small" />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => window.location.href = '/canteen/registration'}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">Lịch sử Đăng ký</Typography>
          <Typography variant="body2" color="text.secondary">Xem lại các suất ăn đã đăng ký</Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            label="Chọn tháng"
            type="month"
            size="small"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Lọc">
            <IconButton><FilterList /></IconButton>
          </Tooltip>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Ngày</TableCell>
                <TableCell>Bữa ăn</TableCell>
                <TableCell>Món ăn</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Đăng ký lúc</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                  <TableRow key={reg.id} hover>
                    <TableCell fontWeight="medium">
                      {moment(reg.menu?.menu_date).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {reg.menu?.meal_slot === 'breakfast' ? 'Sáng' : (reg.menu?.meal_slot === 'lunch' ? 'Trưa' : 'Tối')}
                    </TableCell>
                    <TableCell>
                      {reg.menu_item?.dish?.name || 'Suất tiêu chuẩn'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(reg.status, reg.menu)}
                    </TableCell>
                    <TableCell variant="caption" color="text.secondary">
                      {moment(reg.registered_at).format('HH:mm DD/MM')}
                    </TableCell>
                    <TableCell align="right">
                      {reg.status === 'registered' && moment().isBefore(moment(reg.menu?.cancel_deadline_at)) && (
                        <Tooltip title="Hủy đăng ký">
                          <IconButton color="error" onClick={() => handleCancel(reg.id)}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Chi tiết">
                        <IconButton size="small"><InfoOutlined fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">Không có dữ liệu đăng ký cho tháng này</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MealRegistrationHistory;
