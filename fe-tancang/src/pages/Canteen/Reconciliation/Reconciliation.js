import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, 
  Stack, Divider, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { mealBookingService as canteenService } from '../../../services/mealBookingService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reconciliation = () => {
  const [range, setRange] = useState([dayjs().startOf('week'), dayjs().endOf('week')]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await canteenService.getReconciliation({
          start_date: range[0].format('YYYY-MM-DD'),
          end_date: range[1].format('YYYY-MM-DD')
        });
        if (res.success) setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [range]);

  const chartData = {
    labels: ['Dữ liệu Đối soát'],
    datasets: [
      {
        label: 'Đã đăng ký',
        data: [data?.planned_registrations || 0],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Thực tế Check-in',
        data: [data?.actual_checkins || 0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Số suất ăn báo cáo',
        data: [data?.reported_servings || 0],
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
      },
    ],
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
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
          Đối soát & Báo cáo
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
          So sánh kế hoạch đăng ký và thực tế sử dụng suất ăn
        </Typography>
      </Box>

      <Card sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <DatePicker 
            label="Từ ngày"
            value={range[0]}
            onChange={(val) => setRange([val, range[1]])}
            slotProps={{ textField: { size: 'small', sx: { width: 200 } } }}
          />
          <DatePicker 
            label="Đến ngày"
            value={range[1]}
            onChange={(val) => setRange([range[0], val])}
            slotProps={{ textField: { size: 'small', sx: { width: 200 } } }}
          />
          <Button variant="contained" onClick={() => {}}>Xuất Excel</Button>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <StatCard title="Tổng Đăng ký" value={data?.planned_registrations || 0} color="info.main" />
            <StatCard title="Tổng Check-in" value={data?.actual_checkins || 0} color="success.main" />
            <StatCard title="Tổng Suất ăn báo cáo" value={data?.reported_servings || 0} color="warning.main" />
          </Stack>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, height: '100%', borderRadius: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Biểu đồ so sánh</Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={chartData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

const StatCard = ({ title, value, color }) => (
  <Card sx={{ p: 3, borderRadius: 4, borderLeft: '8px solid', borderColor: color }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h3" sx={{ fontWeight: 800, color }}>
      {value}
    </Typography>
  </Card>
);

export default Reconciliation;
