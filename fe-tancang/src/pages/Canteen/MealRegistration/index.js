import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  CalendarMonth, 
  History, 
  Fastfood, 
  Close,
  CheckCircle,
  CancelOutlined,
  ChevronLeft,
  ChevronRight,
  FlashOn
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { canteenService } from '@services/canteenService';

const MealRegistrationPage = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [currentMonth, setCurrentMonth] = useState(moment().format('YYYY-MM'));
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]); // Standard weekly menus for reference
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null); // The registration object if it exists
  const [availableMenuEntries, setAvailableMenuEntries] = useState([]); // Menus for the selected day
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRegistrations = useCallback(async (month) => {
    setLoading(true);
    try {
      const data = await canteenService.getMyRegistrations(month);
      setRegistrations(data);
    } catch (error) {
      console.error('Fetch registrations error:', error);
      showSnackbar('Không thể tải thông tin đăng ký', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenusDay = useCallback(async (date) => {
    // In a real app, we might fetch a week of menus or all menus for the month
    // For now, let's fetch the weekly menu where this date belongs
    try {
      const weekStart = moment(date).startOf('isoWeek').format('YYYY-MM-DD');
      const data = await canteenService.getWeeklyMenu(weekStart);
      const dayData = data.filter(m => m.menu_date === date.format('YYYY-MM-DD') && m.status === 'published');
      setAvailableMenuEntries(dayData);
    } catch (error) {
      console.error('Fetch menu error:', error);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations(currentMonth);
  }, [currentMonth, fetchRegistrations]);

  const handleMonthChange = (date) => {
    const newMonth = moment(date).format('YYYY-MM');
    if (newMonth !== currentMonth) {
      setCurrentMonth(newMonth);
    }
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    await fetchMenusDay(date);
    setOpenDialog(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleRegister = async (menuId, menuItemId) => {
    setSubmitting(true);
    try {
      await canteenService.registerMeal({ menu_id: menuId, menu_item_id: menuItemId });
      showSnackbar('Đăng ký thành công');
      fetchRegistrations(currentMonth);
      setOpenDialog(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại';
      showSnackbar(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (registrationId) => {
    setSubmitting(true);
    try {
      await canteenService.cancelRegistration(registrationId, { reason: 'User cancelled' });
      showSnackbar('Đã hủy đăng ký');
      fetchRegistrations(currentMonth);
      setOpenDialog(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Hủy thất bại';
      showSnackbar(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayRegistrations = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return registrations.filter(r => r.menu?.menu_date === dateStr);
  };

  const ServerDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dayRegs = getDayRegistrations(day);
    const isRegistered = dayRegs.some(r => r.status === 'registered');
    const isCancelled = dayRegs.some(r => r.status === 'cancelled');
    const isToday = day.isSame(moment(), 'day');

    return (
      <Tooltip title={isRegistered ? "Đã đăng ký" : (isCancelled ? "Đã hủy" : "")}>
        <PickersDay 
          {...other} 
          outsideCurrentMonth={outsideCurrentMonth} 
          day={day} 
          sx={{
            ...(isRegistered && {
              backgroundColor: 'success.light',
              color: 'success.contrastText',
              '&:hover': { backgroundColor: 'success.main' },
              borderRadius: '50%',
            }),
            ...(isCancelled && {
              backgroundColor: 'error.light',
              color: 'error.contrastText',
              borderRadius: '50%',
            }),
            ...(isToday && {
               border: '2px solid',
               borderColor: 'primary.main'
            })
          }}
        />
      </Tooltip>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Đăng ký Suất ăn
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và đăng ký suất ăn của bạn
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<History />}
          onClick={() => window.location.href = '/canteen/history'}
        >
          Lịch sử đăng ký
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarMonth color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">Lịch đăng ký tháng {moment(currentMonth).format('MM/YYYY')}</Typography>
            </Box>
            
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DateCalendar 
                value={selectedDate}
                onMonthChange={handleMonthChange}
                onChange={handleDateSelect}
                slots={{ day: ServerDay }}
                sx={{ width: '100%', height: 'auto' }}
              />
            </LocalizationProvider>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ w: 12, h: 12, borderRadius: '50%', bgcolor: 'success.light', mr: 1 }} />
                <Typography variant="caption">Đã đăng ký</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ w: 12, h: 12, borderRadius: '50%', bgcolor: 'error.light', mr: 1 }} />
                <Typography variant="caption">Đã hủy</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ w: 12, h: 12, borderRadius: '50%', border: '1px solid #ccc', mr: 1 }} />
                <Typography variant="caption">Chưa đăng ký</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Chi tiết ngày {selectedDate.format('DD/MM/YYYY')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1 }}>
                {getDayRegistrations(selectedDate).length > 0 ? (
                  getDayRegistrations(selectedDate).map(reg => (
                    <Paper key={reg.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: reg.status === 'cancelled' ? '#fafafa' : '#f0f7ff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                          {reg.menu?.meal_slot === 'breakfast' ? 'Bữa sáng' : (reg.menu?.meal_slot === 'lunch' ? 'Bữa trưa' : 'Bữa tối')}
                        </Typography>
                        <Chip 
                          label={reg.status === 'registered' ? 'Đã đăng ký' : 'Đã hủy'} 
                          color={reg.status === 'registered' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Món ăn: {reg.menu_item?.dish?.name || 'Theo thực đơn ngày'}
                      </Typography>
                      {reg.status === 'registered' && (
                        <Button 
                          color="error" 
                          size="small" 
                          sx={{ mt: 1 }}
                          onClick={() => handleCancel(reg.id)}
                          disabled={submitting || moment().isAfter(reg.menu?.cancel_deadline_at)}
                        >
                          Hủy đăng ký
                        </Button>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Fastfood sx={{ fontSize: 48, color: 'divider', mb: 1 }} />
                    <Typography color="text.secondary">Chưa có đăng ký cho ngày này</Typography>
                  </Box>
                )}
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<FlashOn />}
                  sx={{ mt: 2 }}
                  onClick={() => setOpenDialog(true)}
                  disabled={submitting}
                >
                  Đăng ký ngay
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Registration Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Đăng ký cho ngày {selectedDate.format('DD/MM/YYYY')}
          <IconButton onClick={() => setOpenDialog(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {availableMenuEntries.length > 0 ? (
            availableMenuEntries.map(menu => {
              const myReg = getDayRegistrations(selectedDate).find(r => r.menu_id === menu.id);
              return (
                <Box key={menu.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize', mb: 1 }}>
                    {menu.meal_slot === 'breakfast' ? 'Bữa sáng' : (menu.meal_slot === 'lunch' ? 'Bữa trưa' : 'Bữa tối')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Hạn đăng ký: {moment(menu.register_deadline_at).format('HH:mm DD/MM')}
                  </Typography>
                  
                  {myReg && myReg.status === 'registered' ? (
                    <Alert severity="success" icon={<CheckCircle />}>Bạn đã đăng ký bữa ăn này</Alert>
                  ) : (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>Chọn món ăn:</Typography>
                      {menu.items && menu.items.length > 0 ? (
                        <Grid container spacing={1}>
                          {menu.items.map(item => (
                            <Grid item xs={12} key={item.id}>
                              <Button 
                                fullWidth 
                                variant="outlined" 
                                size="small"
                                sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                onClick={() => handleRegister(menu.id, item.id)}
                                disabled={submitting || moment().isAfter(menu.register_deadline_at)}
                              >
                                {item.dish?.name}
                              </Button>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Button 
                          fullWidth 
                          variant="contained" 
                          onClick={() => handleRegister(menu.id, null)}
                          disabled={submitting || moment().isAfter(menu.register_deadline_at)}
                        >
                          Đăng ký suất chuẩn
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })
          ) : (
            <Alert severity="info" variant="outlined">
              Chưa có thực đơn được công bố cho ngày này hoặc đã qua hạn đăng ký.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

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

export default MealRegistrationPage;
