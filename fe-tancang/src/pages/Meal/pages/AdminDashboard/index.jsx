/**
 * Admin Dashboard - Dashboard quản trị suất ăn
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { mealBookingService } from '@services/mealBookingService';
import dayjs from 'dayjs';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const SESSION_CONFIG = {
  breakfast: { label: 'Sáng', color: '#F59E0B' },
  lunch: { label: 'Trưa', color: '#10B981' },
  dinner: { label: 'Tối', color: '#8B5CF6' },
};

const DashboardCard = ({ title, value, borderColor, subtitle }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: 2,
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-2px)' },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography fontSize={36} fontWeight={800} lineHeight={1.1}>
          {value ?? 0}
        </Typography>
        {subtitle && (
          <Typography fontSize={12} color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ color: borderColor, opacity: 0.7 }}>
        <RestaurantIcon fontSize="large" />
      </Box>
    </Stack>
    <Typography fontSize={14} color="text.secondary" mt={1.5}>
      {title}
    </Typography>
  </Paper>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('day');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mealBookingService.getAdminDashboard({ date, view });
      if (res?.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Prepare chart data
  const trendData = (data?.trend || []).map((item) => ({
    ...item,
    label: dayjs(item.date).format('DD/MM'),
  }));

  const departmentData = data?.departmentDistribution || [];
  const todayList = data?.todayList || [];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Dashboard Tổng hợp Suất ăn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cập nhật: {dayjs().format('DD/MM/YYYY HH:mm')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chế độ xem</InputLabel>
            <Select value={view} label="Chế độ xem" onChange={(e) => setView(e.target.value)}>
              <MenuItem value="day">Hôm nay</MenuItem>
              <MenuItem value="week">Tuần này</MenuItem>
              <MenuItem value="month">Tháng này</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            size="small"
            label="Ngày"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Button variant="outlined" onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}>
            Hôm nay
          </Button>
          <Button variant="contained" onClick={() => navigate('/meals/menus')}>
            Quản lý Menu
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={3}>
              <DashboardCard
                title="Suất ăn sáng"
                value={data?.cards?.breakfast?.value || 0}
                borderColor={SESSION_CONFIG.breakfast.color}
                subtitle={data?.cards?.breakfast?.delta ? `+/- ${data.cards.breakfast.delta}` : ''}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <DashboardCard
                title="Suất ăn trưa"
                value={data?.cards?.lunch?.value || 0}
                borderColor={SESSION_CONFIG.lunch.color}
                subtitle={data?.cards?.lunch?.delta ? `+/- ${data.cards.lunch.delta}` : ''}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <DashboardCard
                title="Suất ăn tối"
                value={data?.cards?.dinner?.value || 0}
                borderColor={SESSION_CONFIG.dinner.color}
                subtitle={data?.cards?.dinner?.delta ? `+/- ${data.cards.dinner.delta}` : ''}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <DashboardCard
                title="Tổng suất ăn"
                value={data?.cards?.total?.value || 0}
                borderColor="#3B82F6"
                subtitle={data?.cards?.total?.delta ? `+/- ${data.cards.total.delta}` : ''}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={2} mb={3}>
            {/* Trend Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Xu hướng đăng ký
                  </Typography>
                  <Chip
                    label={`${data?.range?.startDate || '--'} - ${data?.range?.endDate || '--'}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" name="Tổng" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="breakfast" name="Sáng" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lunch" name="Trưa" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dinner" name="Tối" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Pie Chart */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Phân bổ theo Bộ phận
                </Typography>
                <Box sx={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.5} mt={1}>
                  {departmentData.map((item, idx) => (
                    <Stack
                      key={item.name}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        <Typography variant="body2">{item.name}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {item.count} ({item.percent}%)
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Ratio Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ đăng ký
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {data?.statusRatio?.registeredRate || 0}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ hủy
                </Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main">
                  {data?.statusRatio?.cancelledRate || 0}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tự động cắt (Công tác/Nghỉ)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main">
                  {data?.statusRatio?.autoCutRate || 0}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Today's List */}
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Danh sách đăng ký hôm nay
              </Typography>
              <Button variant="text" onClick={() => navigate('/meals/admin/registrations')}>
                Xem tất cả
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Bộ phận</TableCell>
                    <TableCell>Ca ăn</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayList.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{row.stt || idx + 1}</TableCell>
                        <TableCell>{row.userName || row.name}</TableCell>
                        <TableCell>{row.departmentName || '-'}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {(row.meals || []).map((meal, mIdx) => (
                              <Chip
                                key={mIdx}
                                label={meal.slot ? SESSION_CONFIG[meal.slot]?.label || meal.slot : meal.meal_name}
                                size="small"
                                sx={{
                                  bgcolor: SESSION_CONFIG[meal.slot]?.color || '#grey.300',
                                  color: 'white',
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>{row.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;
