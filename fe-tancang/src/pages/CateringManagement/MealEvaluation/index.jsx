import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Rating, 
  TextField, 
  Button, 
  IconButton, 
  Stack, 
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { 
  Star, 
  StarBorder, 
  CloudUpload, 
  Delete, 
  InfoOutlined,
  Restaurant,
  CleanHands,
  Fastfood,
  Diversity3,
  SupportAgent,
  CheckCircleOutline,
  RestartAlt,
  Send,
  SoupKitchen,
  Sanitizer,
  Scale,
  RiceBowl,
  Handshake,
  ArrowBack
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mealEvaluationSchema } from '../../../schemas/cateringSchema';
import cateringService from '../../../services/cateringService';
import { trackAction } from '../../../utils/trackAction';
import './MealEvaluation.css';

const CRITERIA = [
  { 
    id: 'taste', 
    label: 'Khẩu vị', 
    description: 'Món ăn ngon, vừa miệng, nêm nếm hợp lý.',
    icon: <SoupKitchen />, 
    color: '#FF6B6B',
    bgColor: '#FFF0F0' 
  },
  { 
    id: 'hygiene', 
    label: 'Vệ sinh an toàn thực phẩm', 
    description: 'Thức ăn sạch sẽ, khu vực ăn gọn gàng.',
    icon: <Sanitizer />, 
    color: '#4DABF7',
    bgColor: '#E7F5FF'
  },
  { 
    id: 'portion', 
    label: 'Khẩu phần', 
    description: 'Lượng cơm, thức ăn đủ no, phân chia hợp lý.',
    icon: <Scale />, 
    color: '#51CF66',
    bgColor: '#EBFBEE'
  },
  { 
    id: 'diversity', 
    label: 'Đa dạng món', 
    description: 'Thực đơn phong phú, không lặp lại nhiều.',
    icon: <RiceBowl />, 
    color: '#FCC419',
    bgColor: '#FFF9DB'
  },
  { 
    id: 'service', 
    label: 'Phục vụ', 
    description: 'Thái độ phục vụ, thời gian chờ, sắp xếp.',
    icon: <Handshake />, 
    color: '#94D82D',
    bgColor: '#F4FCE3'
  },
];

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Bữa sáng' },
  { id: 'lunch', label: 'Bữa trưa' },
  { id: 'afternoon', label: 'Bữa chiều' },
  { id: 'dinner', label: 'Bữa tối' },
];

const MealEvaluation = () => {
  const [suppliers, setSuppliers] = useState([]);

  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiTypography: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiButton: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif', textTransform: 'none' } } },
      MuiTextField: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiInputBase: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiMenuItem: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiSelect: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiRating: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
    },
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState([]);

  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(mealEvaluationSchema),
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      mealSlot: 'lunch',
      supplierId: undefined,
      scores: {
        taste: 0,
        hygiene: 0,
        portion: 0,
        diversity: 0,
        service: 0,
      },
      comment: '',
      images: [],
    }
  });

  const watchScores = useWatch({
    control,
    name: 'scores',
  });

  const completionCount = useMemo(() => {
    if (!watchScores) return 0;
    return Object.values(watchScores).filter(s => s > 0).length;
  }, [watchScores]);

  const averageScore = useMemo(() => {
    if (!watchScores || completionCount === 0) return '0.0';
    const scores = Object.values(watchScores).filter(s => s > 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(1);
  }, [watchScores, completionCount]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const supData = await cateringService.getSuppliers();
      setSuppliers(supData || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const onImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => {
          const newImages = [...prev, reader.result];
          setValue('images', newImages);
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue('images', newImages);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const menuId = 1; 
      const supplierOrderId = 1; 

      await cateringService.submitEvaluation({
        ...data,
        menuId,
        supplierOrderId,
      });

      trackAction('SUBMIT_MEAL_EVALUATION', { menuId, data });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      handleReset();
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setImages([]);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box className="meal-evaluation-container">
        <Container maxWidth="md" sx={{ py: 4 }}>
          
          {/* Page Header */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Quản lý ăn ca</Typography>
              <Typography variant="body2" color="text.secondary">{'>'}</Typography>
              <Typography variant="body2" color="text.secondary">Đánh giá chất lượng</Typography>
              <Typography variant="body2" color="text.secondary">{'>'}</Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Gửi đánh giá</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Đánh giá chất lượng bữa ăn
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Phản hồi của bạn giúp cải thiện chất lượng phục vụ bữa ăn tại đơn vị
            </Typography>
          </Box>

          {/* Form Content */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Meal Information Card */}
            <Paper className="evaluation-card" elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
              <Box className="card-header" sx={{ bgcolor: '#fff', borderBottom: 'none', pt: 3, pb: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  THÔNG TIN BỮA ĂN
                </Typography>
              </Box>
              <Box className="card-content">
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>Ngày</Typography>
                      <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={dayjs(field.value)}
                            onChange={(val) => field.onChange(val?.format('YYYY-MM-DD'))}
                            slotProps={{ 
                              textField: { 
                                size: 'small',
                                fullWidth: true, 
                                error: !!errors.date, 
                                variant: 'outlined',
                                sx: { '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }
                              } 
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth error={!!errors.mealSlot}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>Bữa ăn</Typography>
                      <Controller
                        name="mealSlot"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} size="small" sx={{ bgcolor: '#fff' }}>
                            {MEAL_SLOTS.map(slot => (
                              <MenuItem key={slot.id} value={slot.id}>{slot.label}</MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth error={!!errors.supplierId}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>Nhà cung cấp</Typography>
                      <Controller
                        name="supplierId"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} size="small" sx={{ bgcolor: '#fff' }}>
                            {suppliers.map(sup => (
                              <MenuItem key={sup.id} value={sup.id}>{sup.name}</MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Menu Banner */}
                <Box className="menu-banner">
                  <Restaurant sx={{ color: '#316FD5', fontSize: 18 }} />
                  <Box className="menu-banner-label">Thực đơn:</Box>
                  <Box className="menu-banner-content" sx={{ color: '#1E293B' }}>
                    Cơm trắng · Sườn xào chua ngọt · Canh bí đỏ thịt bằm · Cải ngọt luộc · Tráng miệng chuối
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Evaluation Criteria Card */}
            <Paper className="evaluation-card" elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
              <Box className="card-header" sx={{ bgcolor: '#fff', borderBottom: 'none', pt: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ĐÁNH GIÁ THEO TIÊU CHÍ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, color: '#64748B', mt: 0.5, display: 'block' }}>
                  Chạm vào số sao tương ứng with mức độ hài lòng của bạn (1–5 ★)
                </Typography>
              </Box>
              <Box className="card-content">
                {CRITERIA.map((criterion) => (
                  <Box key={criterion.id} className="rating-row">
                    <Box className="criterion-info">
                      <Box className="icon-box" sx={{ bgcolor: criterion.bgColor, color: criterion.color }}>
                        {React.cloneElement(criterion.icon, { fontSize: 'small' })}
                      </Box>
                      <Box className="criterion-text">
                        <h4>{criterion.label}</h4>
                        <p>{criterion.description}</p>
                      </Box>
                    </Box>

                    <Controller
                      name={`scores.${criterion.id}`}
                      control={control}
                      render={({ field }) => (
                        <Rating
                          {...field}
                          value={Number(field.value)}
                          onChange={(_, val) => field.onChange(val)}
                          icon={<Star sx={{ fontSize: '2.25rem' }} />}
                          emptyIcon={<StarBorder sx={{ fontSize: '2.25rem' }} />}
                        />
                      )}
                    />
                  </Box>
                ))}

                {/* Average Score Box */}
                <Box className="average-score-box">
                  <Typography className="average-score-label">ĐIỂM TRUNG BÌNH</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography className="average-score-value">{averageScore}</Typography>
                    <Typography variant="h6" sx={{ color: '#D97706', fontWeight: 600 }}>/ 5</Typography>
                    <Rating value={Number(averageScore)} readOnly precision={0.1} size="small" />
                  </Stack>
                </Box>
              </Box>
            </Paper>

            {/* Comments & Attachments Card */}
            <Paper className="evaluation-card" elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
              <Box className="card-header">
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  NHẬN XÉT & HÌNH ẢNH
                </Typography>
              </Box>
              <Box className="card-content">
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: '#475569' }}>
                  NHẬN XÉT KHÁC (NẾU CÓ)
                </Typography>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Nhập ý kiến đóng góp của bạn để chúng tôi phục vụ tốt hơn..."
                        variant="outlined"
                        sx={{ bgcolor: '#F8FAFC' }}
                        inputProps={{ maxLength: 500 }}
                      />
                      <Typography variant="caption" sx={{ position: 'absolute', bottom: 8, right: 12, color: '#94A3B8' }}>
                        {field.value?.length || 0}/500
                      </Typography>
                    </Box>
                  )}
                />

                <Box sx={{ mt: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: '#475569' }}>
                    ĐÍNH KÈM HÌNH ẢNH (TỐI ĐA 3 ẢNH)
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    {images.map((src, i) => (
                      <Box key={i} sx={{ position: 'relative', width: 100, height: 100 }}>
                        <img src={src} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                        <IconButton 
                          size="small" 
                          onClick={() => removeImage(i)}
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8, 
                            bgcolor: '#EF4444', 
                            color: '#fff', 
                            '&:hover': { bgcolor: '#DC2626' },
                            width: 24,
                            height: 24
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                    {images.length < 3 && (
                      <label className="image-upload-btn">
                        <CloudUpload sx={{ color: '#94A3B8', mb: 0.5 }} />
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Thêm ảnh</Typography>
                        <input type="file" hidden accept="image/*" multiple onChange={onImageUpload} />
                      </label>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Paper>

            {success && (
              <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Cảm ơn bạn đã gửi đánh giá! Thông tin đã được ghi nhận.
              </Alert>
            )}

          </Box>
        </Container>

        {/* Sticky Footer */}
        <Box className="sticky-footer">
          <Container maxWidth="md">
            <Box className="footer-content">
              <Box className="progress-info">
                <Box className={`status-dot ${completionCount === 5 ? 'active' : ''}`} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: completionCount === 5 ? '#10B981' : '#64748B' }}>
                  Đã đánh giá {completionCount}/5 tiêu chí
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Button 
                  className="btn-reset" 
                  onClick={handleReset}
                  startIcon={<RestartAlt />}
                >
                  Đặt lại
                </Button>
                <Button 
                  className="btn-submit"
                  disabled={submitting || completionCount < 5}
                  onClick={handleSubmit(onSubmit)}
                  variant="contained"
                  endIcon={submitting ? null : <Send />}
                >
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Gửi đánh giá'}
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default MealEvaluation;
