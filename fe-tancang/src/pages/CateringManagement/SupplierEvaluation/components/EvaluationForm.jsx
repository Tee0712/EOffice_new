import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  MenuItem, 
  Select, 
  Rating, 
  Button, 
  Grid 
} from '@mui/material';
import { 
  Restaurant as DishIcon, 
  Timer as TimerIcon, 
  Security as SecurityIcon, 
  Face as FaceIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const FieldLabel = ({ label, required }) => (
  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
  </Typography>
);

const EvaluationForm = ({ suppliers, dishes, onSupplierChange, onSubmit }) => {
  const [formData, setFormData] = React.useState({
    supplierId: '',
    dishId: '',
    comment: '',
    food_quality_score: 0,
    delivery_time_score: 0,
    hygiene_safety_score: 0,
    service_attitude_score: 0
  });

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

  const handleSupplierChange = (e) => {
    const val = e.target.value;
    setFormData({...formData, supplierId: val, dishId: ''});
    onSupplierChange(val);
  };

  const handleAction = () => {
    if (!formData.supplierId || !formData.dishId) {
      toast.error('Vui lòng chọn Nhà cung cấp và Món ăn!');
      return;
    }
    onSubmit(formData);
    setFormData({ 
      supplierId: '', 
      dishId: '',
      comment: '',
      food_quality_score: 0,
      delivery_time_score: 0,
      hygiene_safety_score: 0,
      service_attitude_score: 0
    });
  };

  return (
    <Card sx={{ 
      borderRadius: '24px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)', 
      border: '1px solid #f1f5f9',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 3, pt: 4, bgcolor: '#1a3353', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)', display: 'flex' }}>
            <SendIcon />
          </Box>
          Đánh giá mới
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
          Đánh giá chất lượng sau mỗi lần cung cấp
        </Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <FieldLabel label="Nhà cung cấp" required />
            <Select 
              fullWidth 
              size="small" 
              value={formData.supplierId} 
              onChange={(e) => {
                const val = e.target.value;
                setFormData({...formData, supplierId: val});
                if (onSupplierChange) onSupplierChange(val);
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>-- Chọn nhà cung cấp --</MenuItem>
              {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12}>
            <FieldLabel label="Món ăn" />
            <Select 
              fullWidth 
              size="small" 
              value={formData.dishId}
              onChange={(e) => setFormData({...formData, dishId: e.target.value})}
              displayEmpty
            >
              <MenuItem value="" disabled>-- Chọn món ăn --</MenuItem>
              {(dishes || []).map(d => <MenuItem key={d.id} value={d.id}>{d.dish_name || d.name}</MenuItem>)}
            </Select>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#22c55e', color: 'white', display: 'flex' }}>
                    <DishIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Chất lượng món ăn</Typography>
                </Box>
                <Rating max={5} value={formData.food_quality_score} onChange={(_, val) => setFormData({...formData, food_quality_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#0ea5e9', color: 'white', display: 'flex' }}>
                    <TimerIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Đúng giờ giao hàng</Typography>
                </Box>
                <Rating max={5} value={formData.delivery_time_score} onChange={(_, val) => setFormData({...formData, delivery_time_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#8b5cf6', color: 'white', display: 'flex' }}>
                    <SecurityIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a3353' }}>Vệ sinh an toàn</Typography>
                </Box>
                <Rating max={5} value={formData.hygiene_safety_score} onChange={(_, val) => setFormData({...formData, hygiene_safety_score: val}) } />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
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
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a3353', mb: 0.5 }}>
                {averageScore}
              </Typography>
              <Rating value={Number(averageScore)} precision={0.1} readOnly max={5} sx={{ mb: 1 }} />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 700 }}>
                Điểm trung bình: <span style={{ color: Number(averageScore) > 0 ? '#1a3353' : '#ef4444' }}>
                  {Number(averageScore) > 0 ? `${averageScore}/5.0` : 'Chưa đánh giá'}
                </span>
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
            />
          </Grid>

          <Grid item xs={12}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleAction}
              sx={{ 
                mt: 1, 
                py: 1.5, 
                borderRadius: '12px', 
                bgcolor: '#22c55e', 
                '&:hover': { bgcolor: '#16a34a' },
                textTransform: 'none',
                fontWeight: 800
              }}
            >
              Gửi đánh giá ngay
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EvaluationForm;
