import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Typography, Grid, Paper, IconButton } from '@mui/material';
import { 
  TrendingUp, Assessment, History, 
  Kitchen, ShoppingCart, Warning 
} from '@mui/icons-material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import cateringService from '../../../services/catering.service';
import CateringStatCard from '../../../components/Catering/CateringStatCard';
import moment from 'moment';

const DashboardContainer = styled(Box)`
  padding: 22px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', 'Roboto', sans-serif;
`;

const muiTheme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  components: {
    MuiTypography: { styleOverrides: { root: { fontFamily: "'Inter', 'Roboto', sans-serif" } } },
    MuiButton: { styleOverrides: { root: { fontFamily: "'Inter', 'Roboto', sans-serif" } } },
    MuiTableCell: { styleOverrides: { root: { fontFamily: "'Inter', 'Roboto', sans-serif" } } },
    MuiInputBase: { styleOverrides: { root: { fontFamily: "'Inter', 'Roboto', sans-serif" } } },
  }
});

const ChartPaper = styled(Paper)`
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

const CateringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = moment().format('YYYY-MM-DD');
        const summaryRes = await cateringService.getSummary(today);
        setSummary(summaryRes.data);
        
        // Mocking trend data as generic API trend might need date range
        // In real app, call cateringService.getReconciliationTrend(from, to)
        const mockTrend = [
          { name: 'Thứ 2', usage: 85, registration: 90 },
          { name: 'Thứ 3', usage: 78, registration: 88 },
          { name: 'Thứ 4', usage: 92, registration: 95 },
          { name: 'Thứ 5', usage: 80, registration: 85 },
          { name: 'Thứ 6', usage: 88, registration: 90 },
        ];
        setTrendData(mockTrend);
      } catch (error) {
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStats = summary?.slots?.reduce((acc, curr) => ({
    reg: acc.reg + curr.total_registered,
    checked: acc.checked + curr.total_checked,
    loss: acc.loss + (curr.loss_amount || 0)
  }), { reg: 0, checked: 0, loss: 0 }) || { reg: 0, checked: 0, loss: 0 };

  return (
    <ThemeProvider theme={muiTheme}>
      <DashboardContainer>
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Bảng tin Suất ăn</Typography>
            <Typography color="textSecondary">Tổng quan hoạt động cung cấp suất ăn hôm nay – {moment().format('DD/MM/YYYY')}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton color="primary"><History /></IconButton>
            <IconButton color="primary"><Assessment /></IconButton>
          </Box>
        </Box>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <CateringStatCard 
              label="Tổng đăng ký" value={totalStats.reg} 
              icon={<Assessment fontSize="small" />} color="#3b82f6" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CateringStatCard 
              label="Thực tế sử dụng" value={totalStats.checked} 
              icon={<TrendingUp fontSize="small" />} color="#10b981" valueColor="#16a34a"
              progress={totalStats.reg > 0 ? (totalStats.checked / totalStats.reg * 100) : 0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CateringStatCard 
              label="Dự kiến chi phí" value={`${(totalStats.reg * 25000).toLocaleString()} ₫`} 
              icon={<Kitchen fontSize="small" />} color="#f59e0b" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CateringStatCard 
              label="Thất thoát (Ước tính)" value={`${totalStats.loss.toLocaleString()} ₫`} 
              icon={<Warning fontSize="small" />} color="#ef4444" valueColor="#dc2626"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <ChartPaper>
              <Typography variant="h6" fontWeight="bold" mb={3}>Xu hướng sử dụng suất ăn (7 ngày gần nhất)</Typography>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Thực tế" />
                    <Line type="monotone" dataKey="registration" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} name="Đăng ký" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartPaper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <ChartPaper>
              <Typography variant="h6" fontWeight="bold" mb={3}>Tỉ lệ theo bữa ăn</Typography>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={summary?.slots || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_registered" fill="#3b82f6" name="Đăng ký" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_checked" fill="#10b981" name="Đã ăn" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPaper>
          </Grid>
        </Grid>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default CateringDashboard;
