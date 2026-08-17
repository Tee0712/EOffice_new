import React, { useState } from 'react';
import {
  Drawer, Box, Typography, Stack, IconButton,
  Divider, Grid, Chip, Button, TextField,
  Table, TableBody, TableCell, TableHead, TableRow,
  Paper, CircularProgress, Avatar
} from '@mui/material';
import { 
  Close as CloseIcon, 
  OpenInNew as OpenIcon,
  CheckCircle as ApproveIcon 
} from '@mui/icons-material';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = { 
  completed: '#10b981', 
  rejected: '#ef4444', 
  pending_dept_approval: '#f59e0b', 
  pending_hc_approval: '#f59e0b', 
  pending_issue: '#3b82f6', 
  DRAFT: '#64748b' 
};

const RequestDetailDrawer = ({ open, transactionId, onClose, onApprove, onReject, data, loading }) => {
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const handleAction = async (action) => {
    if (action === 'APPROVE') {
      // Navigate to review page as requested
      navigate(`/office-supply-request/review/${transactionId}`);
      onClose();
    } else {
      await onReject(transactionId, 'REJECT', note);
      setNote('');
    }
  };

  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const normalized = value.replace(/[^\d.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const getItemQuantity = (item) => toNumber(item?.actual_quantity ?? item?.requested_quantity ?? item?.quantity ?? 0);

  const totalAmount = (data?.items || []).reduce((sum, item) => {
    const price = toNumber(item?.price);
    const quantity = getItemQuantity(item);
    return sum + price * quantity;
  }, 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.appBar - 1 }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'transparent' } // Remove backdrop darken if desired, or keep light
        }
      }}
      PaperProps={{ 
        sx: { 
          width: { xs: '100%', sm: 500, md: 600 }, 
          border: 'none', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)',
          top: '48px !important',
          height: 'calc(100% - 48px) !important',
        } 
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
              Chi tiết đề nghị
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a73e8' }}>
                #{data?.request_number || '---'}
              </Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                {data ? moment(data.created_at).format('DD/MM/YYYY HH:mm') : '---'}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {data?.status && (
              <Chip 
                label={data.status} 
                size="small" 
                sx={{ 
                  fontWeight: 800, fontSize: '11px', height: 24,
                  color: 'white', bgcolor: STATUS_COLORS[data.status] || '#64748b'
                }} 
              />
            )}
            <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', bgcolor: '#fbfcfd' }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 20 }}>
            <CircularProgress size={32} thickness={5} sx={{ color: '#1a73e8' }} />
            <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>Tải dữ liệu...</Typography>
          </Stack>
        ) : data ? (
          <Stack spacing={4}>
            {/* General Info */}
            <Box>
              <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>Thông tin chung</Typography>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {[
                  { label: 'Người đề nghị', value: data.requester_name },
                  { label: 'Phòng ban', value: data.department_name },
                  { label: 'Độ ưu tiên', value: data.priority === 'URGENT' ? 'Cấp bách (Gấp)' : data.priority },
                  { label: 'Ngày cần hàng', value: data.needed_date ? moment(data.needed_date).format('DD/MM/YYYY') : '---' },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{value || '---'}</Typography>
                  </Grid>
                ))}
              </Grid>
              {data.reason && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>Lý do / Mục đích</Typography>
                  <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>{data.reason}</Typography>
                </Box>
              )}
            </Box>

            {/* Items List */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>
                  Danh sách mặt hàng ({data.items?.length || 0})
                </Typography>
              </Stack>
              <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569' }}>MẶT HÀNG</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569' }}>SỐ LƯỢNG</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569' }}>THÀNH TIỀN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.product_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{item.product_code}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(getItemQuantity(item))} {item.unit}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {new Intl.NumberFormat('vi-VN').format(toNumber(item.price) * getItemQuantity(item))} đ
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#1e293b' }}>Tổng giá trị ước tính</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#1a73e8', fontSize: '1rem' }}>
                        {new Intl.NumberFormat('vi-VN').format(totalAmount)} đ
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            {/* Approval Progress */}
            {data.logs?.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>Tiến trình phê duyệt</Typography>
                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  {data.logs.map((log, i) => (
                    <Stack key={i} direction="row" spacing={2}>
                      <Avatar sx={{ 
                        width: 28, height: 28, fontSize: 12, fontWeight: 800,
                        bgcolor: log.status === 'completed' ? '#10b981' : log.status === 'rejected' ? '#ef4444' : '#64748b'
                      }}>
                        {i + 1}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>{log.actor_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{moment(log.created_at).format('DD/MM HH:mm')}</Typography>
                        </Stack>
                        {log.comment && (
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#64748b', fontSize: '0.8rem' }}>
                            "{log.comment}"
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        ) : null}
      </Box>

      {/* Footer Actions */}
      { data && !['DRAFT', 'APPROVED', 'REJECTED', 'FINISHED'].includes(data.status) && (
        <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: 'white', flexShrink: 0 }}>
          <Stack direction="row" spacing={2}>
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<ApproveIcon />}
              onClick={() => handleAction('APPROVE')}
              sx={{ 
                borderRadius: '12px', height: 48, textTransform: 'none', fontWeight: 800,
                bgcolor: '#1a73e8', boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)',
                '&:hover': { bgcolor: '#1557b0' }
              }}
            >
              Phê duyệt
            </Button>
            {/* <Button 
              fullWidth 
              variant="outlined" 
              color="error"
              onClick={() => handleAction('REJECT')}
              sx={{ 
                borderRadius: '12px', height: 48, textTransform: 'none', fontWeight: 800,
                borderColor: '#fee2e2', color: '#ef4444',
                '&:hover': { bgcolor: '#fef2f2', borderColor: '#fecaca' }
              }}
            >
              Hủy
            </Button> */}
          </Stack>
        </Box>
      )}
      </Box>
    </Drawer>
  );
};

export default RequestDetailDrawer;
