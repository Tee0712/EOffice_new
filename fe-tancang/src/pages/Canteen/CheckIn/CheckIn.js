import React, { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, Card, 
  Grid, Avatar, Stack, Chip, Divider, InputAdornment,
  Alert, Snackbar
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonIcon from '@mui/icons-material/Person';
import moment from 'moment';
import { mealBookingService as canteenService } from '../../../services/mealBookingService';

const CheckIn = () => {
  const [userId, setUserId] = useState('');
  const [lastCheckin, setLastCheckin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const handleCheckIn = async (id = userId) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await canteenService.checkIn({
        user_id: id,
        menu_id: 1, // Dynamically handle this based on current time/slot in real app
        method: 'manual',
        note: 'Manual check-in from browser'
      });
      
      if (res.success || res.id) {
        setLastCheckin(res);
        setAlert({ open: true, message: `Check-in thành công cho ${id}`, severity: 'success' });
        setUserId('');
      } else {
        setAlert({ open: true, message: 'Check-in thất bại. Có thể chưa đăng ký suất ăn.', severity: 'error' });
      }
    } catch (error) {
      setAlert({ open: true, message: 'Lỗi hệ thống khi check-in', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#0f172a', 
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            mb: 0.5
          }}
        >
          Check-in Suất ăn
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#64748b',
            fontWeight: 500,
            maxWidth: '600px',
            lineHeight: 1.6
          }}
        >
          Quét mã QR hoặc nhập mã nhân viên để xác nhận bữa ăn
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Stack spacing={4}>
              <Box sx={{ position: 'relative', height: 200, bgcolor: 'action.hover', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider' }}>
                <QrCodeScannerIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  Chế độ Quét mã QR
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hệ thống đang chờ thiết bị quét...
                </Typography>
              </Box>

              <Divider>HOẶC NHẬP THỦ CÔNG</Divider>

              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  placeholder="Nhập mã nhân viên..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
                >
                  Xác nhận
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {lastCheckin && (
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 4, borderLeft: '6px solid', borderColor: lastCheckin.is_valid ? 'success.main' : 'warning.main', bgcolor: lastCheckin.is_valid ? 'success.lighter' : 'warning.lighter' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 56, height: 56, bgcolor: lastCheckin.is_valid ? 'success.main' : 'warning.main' }}>
                  <HowToRegIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {lastCheckin.is_valid ? 'Check-in Hợp lệ' : 'Vãng lai (Chưa đăng ký)'}
                  </Typography>
                  <Typography variant="body2">
                    Nhân viên: <b>{lastCheckin.user_id}</b> • Giờ: {moment(lastCheckin.checked_in_at).format('HH:mm:ss')}
                  </Typography>
                </Box>
                <Chip 
                  label={lastCheckin.is_valid ? "Có đăng ký" : "Ngoài danh sách"} 
                  color={lastCheckin.is_valid ? "success" : "warning"}
                  variant="filled"
                />
              </Stack>
            </Card>
          </Grid>
        )}
      </Grid>

      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} sx={{ width: '100%', borderRadius: 3 }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CheckIn;
