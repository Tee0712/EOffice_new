import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography,
  IconButton, Tooltip, Chip, Box, CircularProgress, Stack
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ModeEditOutlineOutlined as ReviewIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon
} from '@mui/icons-material';
import moment from 'moment';

const STATUS_CONFIG = {
  DRAFT: { label: 'Nháp', color: 'default' },
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'warning' },
  PENDING_DEPT_APPROVAL: { label: 'Chờ duyệt', color: 'warning' },
  PENDING_HC_APPROVAL: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Chờ cấp phát', color: 'info' },
  PENDING_ISSUE: { label: 'Chờ cấp phát', color: 'info' },
  REJECTED: { label: 'Từ chối', color: 'error' },
  FINISHED: { label: 'Hoàn thành', color: 'success' },
  COMPLETED: { label: 'Hoàn thành', color: 'success' },
};

const REVIEWABLE_STATUSES = [
  'PENDING',
  'PENDING_APPROVAL',
  'PENDING_DEPT_APPROVAL',
  'PENDING_HC_APPROVAL'
];

const RequestTable = ({ data, loading, onView, onReview, onDelete, onEdit, currentUser }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
      <Table sx={{ minWidth: 750 }}>
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            {['MÃ PHIẾU / NGÀY TẠO', 'NGƯỜI ĐỀ NGHỊ', 'PHÒNG BAN', 'MẶT HÀNG', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                <CircularProgress size={28} /><Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">Đang tải...</Typography>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography color="text.secondary">Chưa có phiếu đề nghị nào</Typography></TableCell></TableRow>
          ) : data.map((row) => {
            const statusUpper = row.status?.toUpperCase();
            const sc = STATUS_CONFIG[statusUpper || row.status] || { label: row.status, color: 'default' };
            const currentUserId = String(currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.user || '');
            const rowRequesterId = String(row.requester_id || row.created_by || '');
            const isOwner = currentUserId !== '' && currentUserId === rowRequesterId;

            return (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a73e8' }}>{row.request_number}</Typography>
                  <Typography variant="caption" color="text.secondary">{moment(row.created_at).format('DD/MM/YYYY HH:mm')}</Typography>
                </TableCell>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{row.requester_name}</Typography></TableCell>
                <TableCell><Typography variant="body2">{row.department_name}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.total_items || 0} mặt hàng</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Intl.NumberFormat('vi-VN').format(row.estimated_value || 0)} ₫
                  </Typography>
                </TableCell>
                <TableCell><Chip label={sc.label} color={sc.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton size="small" onClick={() => onView(row.id)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0', color: '#1a73e8' } }}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {(statusUpper === 'DRAFT' || statusUpper === 'REJECTED') && isOwner && (
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row.id)}
                          sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {statusUpper === 'DRAFT' && isOwner && (
                      <Tooltip title="Xóa nháp">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(row.id)}
                          sx={{ bgcolor: '#fff1f2', color: '#e11d48', '&:hover': { bgcolor: '#ffe4e6' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {REVIEWABLE_STATUSES.includes(statusUpper) &&
                      (String(currentUser?.id || currentUser?._id) === String(row.approver)) && (
                        <Tooltip title="Duyệt phiếu">
                          <IconButton
                            size="small"
                            onClick={() => onReview(row.id)}
                            sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}
                          >
                            <ReviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};


export default RequestTable;
