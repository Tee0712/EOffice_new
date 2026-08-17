/**
 * Reconciliation Page - Đối chiếu suất ăn
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { mealBookingService } from '@services/mealBookingService';
import dayjs from 'dayjs';

const SESSION_CONFIG = {
  1: { name: 'Sáng', color: '#F59E0B' },
  2: { name: 'Trưa', color: '#10B981' },
  3: { name: 'Tối', color: '#8B5CF6' },
};

const ReconciliationPage = () => {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState('day');
  const [data, setData] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mealBookingService.getAdminDashboard({ date, view: viewMode });
      if (res?.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Fetch reconciliation error:', error);
    } finally {
      setLoading(false);
    }
  }, [date, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    // Export to Excel
    console.log('Export to Excel');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewDetail = (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
  };

  // Calculate summary
  const summary = React.useMemo(() => {
    const sessions = data?.summary || {};
    const total = {
      registered: (sessions.breakfast?.registered || 0) + (sessions.lunch?.registered || 0) + (sessions.dinner?.registered || 0),
      checked: (sessions.breakfast?.checked || 0) + (sessions.lunch?.checked || 0) + (sessions.dinner?.checked || 0),
      absent: (sessions.breakfast?.absent || 0) + (sessions.lunch?.absent || 0) + (sessions.dinner?.absent || 0),
    };
    total.loss = total.registered - total.checked;
    total.lossRate = total.registered > 0 ? ((total.loss / total.registered) * 100).toFixed(1) : 0;
    return { sessions, total };
  }, [data]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Đối soát suất ăn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đối chiếu số lượng đăng ký và thực tế
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="day">Ngày</ToggleButton>
            <ToggleButton value="week">Tuần</ToggleButton>
            <ToggleButton value="month">Tháng</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            In
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={3}>
            {Object.entries(summary.sessions).map(([key, session]) => {
              const config = SESSION_CONFIG[key === 'breakfast' ? 1 : key === 'lunch' ? 2 : 3];
              const loss = (session.registered || 0) - (session.checked || 0);
              const lossRate = session.registered > 0 ? ((loss / session.registered) * 100).toFixed(1) : 0;
              
              return (
                <Grid item xs={12} md={4} key={key}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderLeft: `4px solid ${config?.color || '#gray'}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      Ca {config?.name || key}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Đã đăng ký</Typography>
                        <Typography variant="h5" fontWeight={800}>{session.registered || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Đã ăn</Typography>
                        <Typography variant="h5" fontWeight={800} color="success.main">{session.checked || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Vắng</Typography>
                        <Typography variant="h5" fontWeight={800} color="error.main">{session.absent || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Thất thoát</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="h5" fontWeight={800}>{lossRate}%</Typography>
                          {loss > 0 ? (
                            <TrendingDownIcon color="error" fontSize="small" />
                          ) : (
                            <TrendingUpIcon color="success" fontSize="small" />
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {/* Total Summary */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.50' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Tổng cộng
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Tổng đăng ký</Typography>
                <Typography variant="h4" fontWeight={800}>{summary.total.registered}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Tổng đã ăn</Typography>
                <Typography variant="h4" fontWeight={800} color="success.main">{summary.total.checked}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Tổng vắng</Typography>
                <Typography variant="h4" fontWeight={800} color="error.main">{summary.total.absent}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Thất thoát</Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main">{summary.total.loss}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Tỷ lệ thất thoát</Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main">{summary.total.lossRate}%</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Chi phí thất thoát</Typography>
                <Typography variant="h4" fontWeight={800} color="error.main">
                  {new Intl.NumberFormat('vi-VN').format(summary.total.loss * 25000)} đ
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Detailed Table */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell align="center">Ca</TableCell>
                    <TableCell align="right">Đăng ký</TableCell>
                    <TableCell align="right">Đã ăn</TableCell>
                    <TableCell align="right">Vắng</TableCell>
                    <TableCell align="right">Thất thoát</TableCell>
                    <TableCell align="right">Tỷ lệ</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.details || []).map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{dayjs(row.date).format('DD/MM/YYYY')}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={SESSION_CONFIG[row.session_id]?.name || row.session}
                          size="small"
                          sx={{
                            bgcolor: SESSION_CONFIG[row.session_id]?.color || '#gray',
                            color: 'white',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">{row.registered}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {row.checked}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {row.absent}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                        {row.loss}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${row.lossRate}%`}
                          size="small"
                          color={row.lossRate > 10 ? 'error' : row.lossRate > 5 ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" onClick={() => handleViewDetail(row)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.details || data.details.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Chưa có dữ liệu chi tiết</Typography>
                      </TableCell>
                    </TableRow>
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

export default ReconciliationPage;
