/**
 * Cancel Dialog - Dialog xác nhận hủy đăng ký
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

const CancelDialog = ({ open, onClose, onConfirm, deadlineInfo }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(reason);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <WarningAmberIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={700}>
            Xác nhận hủy đăng ký
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {deadlineInfo && (
            <Alert severity="info" icon={<InfoIcon />}>
              {deadlineInfo}
            </Alert>
          )}

          <Alert severity="warning" sx={{ fontSize: 13 }}>
            Sau khi hủy, bạn sẽ được hoàn tiền theo chính sách của công ty.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Lý do hủy <span style={{ color: 'red' }}>*</span>
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Nhập lý do hủy đăng ký..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Đóng
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelDialog;
