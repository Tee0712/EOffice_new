/**
 * My Registrations Page - Đăng ký của tôi
 * Theo chuẩn LIFETEX ER - File ≤ 300 dòng
 */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useMyRegistrations } from '../hooks/useMyRegistrations';
import RegisterModal from '../components/RegisterModal';
import RegistrationDetailModal from '../components/RegistrationDetailModal';
import CancelDialog from '../components/CancelDialog';
import StatsCards from '../components/StatsCards';
import FilterBar from '../components/FilterBar';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const MyRegistrationsPage = () => {
  const {
    registrations,
    stats,
    loading,
    pagination,
    filters,
    setFilters,
    setPagination,
    cancelRegistration,
    SESSION_META,
    STATUS_CONFIG,
  } = useMyRegistrations();

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  const handleViewDetail = (registration) => {
    setSelectedRegistration(registration);
    setDetailModalOpen(true);
  };

  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setRegisterModalOpen(true);
  };

  const handleCancel = (registration) => {
    setSelectedRegistration(registration);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (reason) => {
    if (selectedRegistration) {
      await cancelRegistration(selectedRegistration.id, reason);
      setCancelDialogOpen(false);
      setSelectedRegistration(null);
    }
  };

  const isToday = (date) => dayjs(date).isSame(dayjs(), 'day');

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
            Đăng ký suất ăn của tôi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý và theo dõi các suất ăn đã đăng ký
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRegisterModalOpen(true)}
        >
          Đăng ký mới
        </Button>
      </Stack>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        showDateRange
        showStatus
        showQuickChips
      />

      {/* Registrations Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell width={40}>STT</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Ca ăn</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Đơn giá</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Đang tải dữ liệu...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Chưa có đăng ký nào
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={() => setRegisterModalOpen(true)}
                      sx={{ mt: 1 }}
                    >
                      Đăng ký ngay
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg, index) => (
                  <TableRow
                    key={reg.id}
                    hover
                    sx={{
                      bgcolor: isToday(reg.date) ? '#FEFCE8' : 'inherit',
                      '&:hover': { bgcolor: '#F9FAFB' },
                    }}
                  >
                    <TableCell>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </TableCell>
                    <TableCell>
                      <Stack direction="column" spacing={0.5}>
                        <Typography fontWeight={600}>
                          {dayjs(reg.date).format('dddd, DD/MM/YYYY')}
                        </Typography>
                        {isToday(reg.date) && (
                          <Chip
                            label="Hôm nay"
                            size="small"
                            color="primary"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(reg.sessions || []).map((sessionId) => {
                          const session = SESSION_META[sessionId];
                          return (
                            <Chip
                              key={sessionId}
                              label={session?.name || `Ca ${sessionId}`}
                              size="small"
                              sx={{
                                bgcolor: session?.color || '#grey.200',
                                color: 'white',
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_CONFIG[reg.status]?.label || reg.status}
                        color={STATUS_CONFIG[reg.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {new Intl.NumberFormat('vi-VN').format(reg.total_cost || 0)} đ
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(reg)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {reg.status === 'upcoming' && (
                          <>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(reg)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hủy đăng ký">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancel(reg)}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderTop={1}
            borderColor="divider"
          >
            <Typography variant="body2" color="text.secondary">
              Tổng: {pagination.total} đăng ký
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Trang</Typography>
              <Select
                size="small"
                value={pagination.page}
                onChange={(e) =>
                  setPagination((prev) => ({ ...prev, page: e.target.value }))
                }
                sx={{ minWidth: 60 }}
              >
                {Array.from(
                  { length: Math.ceil(pagination.total / pagination.limit) },
                  (_, i) => i + 1
                ).map((page) => (
                  <MenuItem key={page} value={page}>
                    {page}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        )}
      </Paper>

      {/* Modals */}
      <RegisterModal
        open={registerModalOpen}
        onClose={() => {
          setRegisterModalOpen(false);
          setSelectedRegistration(null);
        }}
        editData={selectedRegistration}
      />

      <RegistrationDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRegistration(null);
        }}
        registration={selectedRegistration}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedRegistration(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </Container>
  );
};

export default MyRegistrationsPage;
