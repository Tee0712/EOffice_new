import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Rating, 
  TextField, 
  Grid,
  IconButton,
  Avatar
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Restaurant as DishIcon, 
  Timer as TimerIcon, 
  Security as SecurityIcon, 
  Face as FaceIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const FieldLabel = ({ label, required }) => (
  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
  </Typography>
);

const EvaluationEditModal = ({ open, onClose, evaluation, onSave }) => {
  const [formData, setFormData] = useState({
    comment: '',
    food_quality_score: 0,
    delivery_time_score: 0,
    hygiene_safety_score: 0,
    service_attitude_score: 0
  });

  useEffect(() => {
    if (evaluation) {
      setFormData({
        comment: evaluation.comment || '',
        food_quality_score: evaluation.scores?.food_quality || 0,
        delivery_time_score: evaluation.scores?.delivery_time || 0,
        hygiene_safety_score: evaluation.scores?.hygiene_safety_score || 0,
        service_attitude_score: evaluation.scores?.service_attitude_score || 0
      });
    }
  }, [evaluation]);

  const averageScore = React.useMemo(() => {
    const scores = [
      formData.food_quality_score,
      formData.delivery_time_score,
      formData.hygiene_safety_score,
      formData.service_attitude_score
    ].filter(s => s > 0);
    
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [formData]);

  const handleAction = () => {
    onSave({
      ...formData,
      id: evaluation.id
    });
  };

  if (!evaluation) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ 
        className: 'standard-font',
        sx: { borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } 
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 900, color: '#1a3353', fontSize: '1.25rem' }}>Sửa Đánh giá</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
           <Avatar sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: '#1a3353', fontWeight: 900, mx: 'auto', mb: 1.5 }}>
             {evaluation.supplierName ? evaluation.supplierName.split(' ')[evaluation.supplierName.split(' ').length - 1][0] : '?'}
           </Avatar>
           <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a3353', mb: 0.5 }}>{evaluation.supplierName}</Typography>
           <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
             {evaluation.dishName ? `Món ăn: ${evaluation.dishName}` : 'Đánh giá chung'}
           </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#22c55e', color: 'white', display: 'flex' }}>
                    <DishIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Chất lượng món ăn</Typography>
                </Box>
                <Rating max={5} value={formData.food_quality_score} onChange={(_, val) => setFormData({...formData, food_quality_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#0ea5e9', color: 'white', display: 'flex' }}>
                    <TimerIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Đúng giờ giao hàng</Typography>
                </Box>
                <Rating max={5} value={formData.delivery_time_score} onChange={(_, val) => setFormData({...formData, delivery_time_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#8b5cf6', color: 'white', display: 'flex' }}>
                    <SecurityIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Vệ sinh an toàn</Typography>
                </Box>
                <Rating max={5} value={formData.hygiene_safety_score} onChange={(_, val) => setFormData({...formData, hygiene_safety_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#f59e0b', color: 'white', display: 'flex' }}>
                    <FaceIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Thái độ phục vụ</Typography>
                </Box>
                <Rating max={5} value={formData.service_attitude_score} onChange={(_, val) => setFormData({...formData, service_attitude_score: val}) } />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '20px', 
              bgcolor: '#f1f5f9', 
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a3353', mb: 0.5 }}>
                {averageScore}
              </Typography>
              <Rating value={Number(averageScore)} precision={0.1} readOnly max={5} size="small" />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 700, mt: 0.5 }}>
                Điểm trung bình: {averageScore}/5.0
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <FieldLabel label="Ghi chú / Nhận xét" />
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              placeholder="Nhập nhận xét của bạn..." 
              size="small" 
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            borderRadius: '12px', 
            textTransform: 'none', 
            fontWeight: 700, 
            px: 3,
            color: '#64748b'
          }}
        >
          Hủy bỏ
        </Button>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleAction}
          sx={{ 
            borderRadius: '12px', 
            bgcolor: '#1a3353', 
            textTransform: 'none', 
            fontWeight: 800, 
            px: 4,
            '&:hover': { bgcolor: '#2c3e50' }
          }}
        >
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EvaluationEditModal;
