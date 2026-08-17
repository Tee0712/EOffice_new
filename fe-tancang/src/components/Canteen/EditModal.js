import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Typography,
  FormControl, InputLabel, Select, FormHelperText,
  Alert
} from '@mui/material';
import { canteenRegistrationSchema } from '../../schemas/canteenSchemas';
import { trackAction } from '../../utils/trackAction';

const EditModal = ({ open, onClose, registration, onSave, dishes }) => {
  const [formData, setFormData] = useState({
    menu_item_id: '',
    status: 'registered',
    cancel_reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (registration) {
      setFormData({
        menu_item_id: registration.menu_item_id || '',
        status: registration.status || 'registered',
        cancel_reason: registration.cancel_reason || ''
      });
      setErrors({});
    }
  }, [registration]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      user_id: registration.user_id,
      menu_id: registration.menu_id
    };

    const validation = canteenRegistrationSchema.safeParse(payload);
    
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach(err => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    trackAction('SAVE_REGISTRATION_CHANGES', { registrationId: registration.id, changes: formData });
    onSave(registration.id, formData);
  };

  if (!registration) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa đăng ký</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nhân viên: <strong>{registration.user_id}</strong>
          </Typography>

          <FormControl fullWidth error={!!errors.menu_item_id}>
            <InputLabel>Chọn món ăn</InputLabel>
            <Select
              value={formData.menu_item_id}
              label="Chọn món ăn"
              onChange={(e) => handleChange('menu_item_id', e.target.value)}
            >
              <MenuItem value=""><em>-- Không chọn món --</em></MenuItem>
              {dishes.map(dish => (
                <MenuItem key={dish.id} value={dish.id}>{dish.name}</MenuItem>
              ))}
            </Select>
            {errors.menu_item_id && <FormHelperText>{errors.menu_item_id}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={formData.status}
              label="Trạng thái"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="registered">Đã đăng ký</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
              <MenuItem value="auto_cut">Tự động hủy (Auto-cut)</MenuItem>
            </Select>
          </FormControl>

          {formData.status !== 'registered' && (
            <TextField
              label="Lý do hủy"
              multiline
              rows={2}
              value={formData.cancel_reason}
              onChange={(e) => handleChange('cancel_reason', e.target.value)}
              error={!!errors.cancel_reason}
              helperText={errors.cancel_reason}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Hủy bỏ</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Lưu thay đổi</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditModal;
