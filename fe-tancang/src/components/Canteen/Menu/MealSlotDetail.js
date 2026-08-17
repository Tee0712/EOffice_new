import React from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Switch,
  Stack,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Sunrise, Sun, Moon, Image as ImageIcon } from 'lucide-react';

const MealSlotDetail = ({ mealData, onUpdateField }) => {
  const isBreakfast = mealData.meal_slot === 'breakfast';
  const isLunch = mealData.meal_slot === 'lunch';

  const themeColor = isBreakfast
    ? 'var(--breakfast-main)'
    : isLunch
      ? 'var(--lunch-main)'
      : 'var(--dinner-main)';
  const themeBg = isBreakfast
    ? 'var(--breakfast-bg)'
    : isLunch
      ? 'var(--lunch-bg)'
      : 'var(--dinner-bg)';
  const Icon = isBreakfast ? Sunrise : isLunch ? Sun : Moon;
  const title = isBreakfast ? 'Ăn sáng' : isLunch ? 'Ăn trưa' : 'Ăn tối';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--neutral-200)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          bgcolor: themeColor,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1, borderRadius: 'var(--radius-md)', bgcolor: themeBg, color: themeColor }}>
              <Icon size={24} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--neutral-900)', mb: -0.5 }}>
                {title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--neutral-500)', fontWeight: 600 }}>
                {mealData.serving_time || 'Chưa thiết lập giờ'}
              </Typography>
            </Box>
          </Stack>

          <Switch
            checked={mealData.enabled !== false}
            onChange={(e) => onUpdateField('enabled', e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: themeColor },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: themeColor },
            }}
          />
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                aspectRatio: '4/3',
                border: '2px dashed var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: 'var(--neutral-50)',
                '&:hover': {
                  borderColor: themeColor,
                  bgcolor: `${themeBg}40`,
                },
              }}
            >
              {mealData.image_url_manual ? (
                <Box
                  component="img"
                  src={mealData.image_url_manual}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : (
                <>
                  <ImageIcon size={32} color="var(--neutral-400)" />
                  <Typography variant="caption" sx={{ mt: 1, color: 'var(--neutral-500)', fontWeight: 600 }}>
                    Click để tải ảnh món ăn
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--neutral-400)', fontSize: 10 }}>
                    Khuyến nghị: 800x600px
                  </Typography>
                </>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={9}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Tên món ăn"
                placeholder="VD: Phở bò, bánh mì pate, cháo gà"
                variant="outlined"
                size="small"
                value={mealData.title_manual || ''}
                onChange={(e) => onUpdateField('title_manual', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-md)',
                    bgcolor: 'var(--neutral-50)',
                  },
                }}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                label="Mô tả chi tiết"
                placeholder="Mô tả các món ăn, thành phần hoặc lưu ý..."
                variant="outlined"
                value={mealData.description_manual || ''}
                onChange={(e) => onUpdateField('description_manual', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  style: {
                    lineHeight: 1.5,
                    margin: 0,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-md)',
                    bgcolor: 'var(--neutral-50)',
                    alignItems: 'flex-start',
                  },
                  '& .MuiInputBase-inputMultiline': {
                    lineHeight: 1.5,
                    paddingTop: '14px !important',
                    paddingBottom: '10px !important',
                  },
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Giá tiền (VNĐ)"
                    variant="outlined"
                    size="small"
                    value={mealData.price_total_planned || ''}
                    onChange={(e) => onUpdateField('price_total_planned', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-md)', bgcolor: 'var(--neutral-50)' } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            VNĐ
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Thời gian phục vụ"
                    placeholder="VD: 06:30 - 08:00"
                    variant="outlined"
                    size="small"
                    value={mealData.serving_time || ''}
                    onChange={(e) => onUpdateField('serving_time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-md)', bgcolor: 'var(--neutral-50)' } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default MealSlotDetail;
