import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/vi';
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mealBookingService as canteenService } from '../../../services/mealBookingService';

moment.locale('vi');

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const MEAL_LABEL = {
  breakfast: 'Sáng',
  lunch: 'Trưa',
  dinner: 'Tối',
};

const formatDelta = (value = 0) => (value > 0 ? `+${value}` : `${value}`);

const DashboardCard = ({ title, value, delta, border }) => (
  <Box
    sx={{
      bgcolor: 'white',
      borderRadius: 2,
      p: 2.5,
      borderLeft: `4px solid ${border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      height: '100%',
    }}
  >
    <Stack direction='row' justifyContent='space-between' alignItems='center'>
      <Typography fontSize={42 < String(value).length ? 32 : 38} fontWeight={800}>
        {value}
      </Typography>
      <Typography fontSize={13} fontWeight={700} color={delta >= 0 ? 'success.main' : 'error.main'}>
        {formatDelta(delta)}
      </Typography>
    </Stack>
    <Typography fontSize={13} color='text.secondary'>
      {title}
    </Typography>
  </Box>
);

const CanteenAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('day');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await canteenService.getAdminDashboard({ date, view });
      if (res?.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Fetch canteen dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const trendData = useMemo(
    () =>
      (data?.trend || []).map((item) => ({
        ...item,
        label: moment(item.date).format('DD/MM'),
      })),
    [data],
  );

  const departmentData = data?.departmentDistribution || [];
  const todayRows = data?.todayList || [];

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2.5} flexWrap='wrap' gap={1.5}>
        <Box>
          <Typography fontSize={34} fontWeight={800}>
            Dashboard Tổng hợp Suất ăn
          </Typography>
          <Typography color='text.secondary'>
            Realtime ngày {moment(data?.date || date).format('DD/MM/YYYY')} • Cập nhật {data?.realtime?.updatedAt ? moment(data.realtime.updatedAt).format('HH:mm:ss') : '--'}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1.2}>
          <Select size='small' value={view} onChange={(e) => setView(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value='day'>Hôm nay</MenuItem>
            <MenuItem value='week'>Tuần này</MenuItem>
            <MenuItem value='month'>Tháng này</MenuItem>
          </Select>
          <Button variant='outlined' onClick={() => setDate(moment().format('YYYY-MM-DD'))}>
            Hôm nay
          </Button>
          <Button variant='contained' onClick={() => navigate('/meals/admin/menus')}>
            Quản lý menu
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn sáng' value={data?.cards?.breakfast?.value || 0} delta={data?.cards?.breakfast?.delta || 0} border='#F59E0B' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn trưa' value={data?.cards?.lunch?.value || 0} delta={data?.cards?.lunch?.delta || 0} border='#10B981' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn tối' value={data?.cards?.dinner?.value || 0} delta={data?.cards?.dinner?.delta || 0} border='#8B5CF6' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Tổng suất ăn' value={data?.cards?.total?.value || 0} delta={data?.cards?.total?.delta || 0} border='#3B82F6' />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1}>
              <Typography fontWeight={800} fontSize={22}>Xu hướng</Typography>
              <Chip label={`${data?.range?.startDate || '--'} → ${data?.range?.endDate || '--'}`} size='small' />
            </Stack>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='label' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='total' fill='#3B82F6' radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.2, borderRadius: 2.5, height: '100%' }}>
            <Typography fontWeight={800} fontSize={22} mb={1.2}>Phân bổ theo Bộ phận</Typography>
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={departmentData} dataKey='count' nameKey='name' cx='50%' cy='50%' outerRadius={88}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {(departmentData || []).map((d, idx) => (
              <Stack key={`${d.name}-${idx}`} direction='row' justifyContent='space-between' mb={0.5}>
                <Typography fontSize={13}>{d.name}</Typography>
                <Typography fontSize={13} fontWeight={700}>
                  {d.count} ({d.percent}%)
                </Typography>
              </Stack>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tỷ lệ đăng ký</Typography>
            <Typography fontSize={28} fontWeight={800}>{data?.statusRatio?.registeredRate || 0}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tỷ lệ hủy</Typography>
            <Typography fontSize={28} fontWeight={800} color='warning.main'>{data?.statusRatio?.cancelledRate || 0}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tự động cắt (công tác/nghỉ)</Typography>
            <Typography fontSize={28} fontWeight={800} color='error.main'>{data?.statusRatio?.autoCutRate || 0}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1}>
          <Typography fontWeight={800} fontSize={22}>Danh sách đăng ký hôm nay</Typography>
          <Button variant='contained' onClick={() => navigate('/meals/admin/registrations')}>
            Xem tất cả
          </Button>
        </Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>STT</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Bộ phận</TableCell>
                <TableCell>Bữa ăn</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center'>
                    {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}
                  </TableCell>
                </TableRow>
              ) : (
                todayRows.map((row) => (
                  <TableRow key={`${row.stt}-${row.userName}`}>
                    <TableCell>{row.stt}</TableCell>
                    <TableCell>{row.userName}</TableCell>
                    <TableCell>{row.departmentName || '-'}</TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={0.5} flexWrap='wrap'>
                        {(row.meals || []).map((m, idx) => (
                          <Chip key={`${row.stt}-${idx}`} label={MEAL_LABEL[m.slot] || m.meal_name || 'Bữa ăn'} size='small' />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{row.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Container>
  );
};

export default CanteenAdminDashboardPage;
