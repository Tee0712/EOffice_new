import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '@services/eventManagementService';

const DashboardCard = ({ title, value, color }) => (
  <Card sx={{ bgcolor: color, color: '#fff' }}>
    <CardContent>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h3" fontWeight="bold">{value}</Typography>
    </CardContent>
  </Card>
);

const EventDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getEvents({ page: 0, size: 200 });
      const items = Array.isArray(res?.data) ? res.data : [];
      setEvents(items);
      setTotal(Number(res?.pagination?.total || items.length));
    } catch (error) {
      setEvents([]);
      setTotal(0);
      console.error('Failed to fetch event dashboard data:', error);
    }
  };

  const stats = useMemo(() => {
    const now = Date.now();

    const ongoing = events.filter((e) => {
      const start = new Date(e.startDatetime).getTime();
      const end = new Date(e.endDatetime).getTime();
      return start <= now && now <= end && e.status !== 'CANCELLED';
    }).length;

    const upcoming = events.filter((e) => new Date(e.startDatetime).getTime() > now && e.status !== 'CANCELLED').length;
    const completed = events.filter((e) => e.status === 'COMPLETED').length;

    return { ongoing, upcoming, completed };
  }, [events]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Bảng tin Sự kiện</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Tổng số sự kiện" value={total} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Đang diễn ra" value={stats.ongoing} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Sắp tới" value={stats.upcoming} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Đã kết thúc" value={stats.completed} color="#0288d1" />
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Luồng sử dụng</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/event-management/interaction-stats')}
            >
              Mở thống kê tương tác
            </Button>
          </Stack>
          <Stack spacing={0.5}>
            <Typography>1. Vào `Danh sách Sự kiện` và chọn một sự kiện.</Typography>
            <Typography>2. Từ menu thao tác của sự kiện, chọn `Gửi thông báo sự kiện` hoặc `Xác nhận & Đăng ký khách mời`.</Typography>
            <Typography>3. Trang `Thông báo Sự kiện` hỗ trợ chọn nhanh sự kiện để xem/tạo thông báo.</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventDashboard;
