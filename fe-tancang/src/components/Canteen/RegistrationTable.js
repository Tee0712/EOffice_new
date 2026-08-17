import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

const normalizeSlot = (rawSlot, mealName = '') => {
  const raw = String(rawSlot || '').trim();
  const s = raw.toLowerCase();
  if (s === 'breakfast' || s === 'lunch' || s === 'dinner') return s;
  const repaired = (() => {
    try {
      return decodeURIComponent(escape(raw));
    } catch {
      return raw;
    }
  })();
  const n = `${s} ${String(mealName || '').toLowerCase()} ${String(repaired || '').toLowerCase()}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (n.includes('breakfast') || n.includes('sang')) return 'breakfast';
  if (n.includes('lunch') || n.includes('trua')) return 'lunch';
  if (n.includes('dinner') || n.includes('toi')) return 'dinner';
  return '';
};

const SlotChip = ({ slot, mealName }) => {
  const configs = {
    breakfast: { label: 'Sáng', color: 'warning' },
    lunch: { label: 'Trưa', color: 'success' },
    dinner: { label: 'Tối', color: 'secondary' },
  };
  const key = normalizeSlot(slot, mealName);
  const config = configs[key] || { label: slot || mealName || 'N/A', color: 'default' };
  return <Chip label={config.label} size='small' color={config.color} sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
};

const RegistrationTable = ({ registrations, onEdit, onView }) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: 'background.neutral' }}>
          <TableRow>
            <TableCell padding='checkbox'><Checkbox size='small' /></TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>STT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Họ tên nhân viên</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Bộ phận</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Bữa ăn</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trạng thái</TableCell>
            <TableCell align='center' sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registrations.length > 0 ? registrations.map((row, index) => {
            const dedupMeals = [...new Map(
              (row.meals || []).map((m) => {
                const normalized = normalizeSlot(m.slot, m.meal_name);
                return [normalized, { ...m, slot: normalized }];
              }),
            ).values()];

            return (
              <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell padding='checkbox'><Checkbox size='small' /></TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontWeight: 700,
                      }}
                    >
                      {(row.user_name || row.user_id || '').substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{row.user_name || row.user_id}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {row.department_name || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    {row.email || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {dedupMeals.length > 0 ? (
                      dedupMeals.map((m, idx) => <SlotChip key={`${row.id}-${idx}`} slot={m.slot} mealName={m.meal_name} />)
                    ) : (
                      <SlotChip slot={row.menu?.meal_slot} mealName={row.menu?.meal_name || ''} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      row.status === 'cancelled'
                        ? 'Đã hủy'
                        : row.status === 'completed'
                          ? 'Đã hoàn thành'
                          : row.status === 'active'
                            ? 'Đang dùng'
                            : 'Đã đăng ký'
                    }
                    size='small'
                    variant='outlined'
                    color={row.status === 'cancelled' ? 'error' : 'primary'}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </TableCell>
                <TableCell align='center'>
                  <Tooltip title='Xem chi tiết'>
                    <IconButton size='small' onClick={() => onView(row)} sx={{ mr: 0.5 }}>
                      <VisibilityIcon fontSize='small' sx={{ color: 'action.active' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Chỉnh sửa'>
                    <IconButton
                      size='small'
                      onClick={() => onEdit(row)}
                      sx={{ color: 'primary.main', bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}
                    >
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={8} align='center' sx={{ py: 10 }}>
                <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                  Không tìm thấy dữ liệu đăng ký phù hợp.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RegistrationTable;
