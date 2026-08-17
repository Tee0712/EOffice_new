import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, 
  Tabs, Tab, Button, Stack, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Rating
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import { mealBookingService as canteenService } from '../../../services/mealBookingService';

const SupplierManagement = () => {
  const [tab, setTab] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const res = await canteenService.getSuppliers();
        if (res.success) setSuppliers(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Quản lý Nhà cung cấp
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hợp đồng, Đơn hàng, Giá món ăn và Đánh giá chất lượng
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
          Thêm Nhà cung cấp
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)}>
          <Tab label="Danh sách NCC" sx={{ fontWeight: 600 }} />
          <Tab label="Hợp đồng" sx={{ fontWeight: 600 }} />
          <Tab label="Đơn hàng" sx={{ fontWeight: 600 }} />
          <Tab label="Giá món ăn" sx={{ fontWeight: 600 }} />
          <Tab label="Đánh giá" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {tab === 0 && suppliers.map(s => (
          <Grid item xs={12} md={6} lg={4} key={s.id}>
            <Card sx={{ p: 3, borderRadius: 4, position: 'relative' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Mã: {s.code}</Typography>
                </Box>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" display="block">Đánh giá TB</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Rating value={Number(s.rating_avg_cached) || 0} readOnly size="small" precision={0.5} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.rating_avg_cached || 0}</Typography>
                    </Stack>
                  </Box>
                  <Chip 
                    label={s.contract_status_cached || 'Chưa có HĐ'} 
                    color={s.contract_status_cached === 'active' ? 'success' : 'default'} 
                    size="small" 
                  />
                </Stack>

                <Divider />

                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="outlined" size="small" startIcon={<EditIcon />}>Sửa</Button>
                  <Button fullWidth variant="outlined" size="small" startIcon={<HistoryIcon />}>Lịch sử</Button>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        ))}
        {tab !== 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: 'background.neutral' }}>
              <Typography color="text.secondary">Giao diện chi tiết đang được phát triển...</Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default SupplierManagement;
