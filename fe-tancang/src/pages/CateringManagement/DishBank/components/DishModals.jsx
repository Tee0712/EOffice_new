import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  MenuItem,
  Select,
  Rating,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Restaurant as DishIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { dishSchema, getDishImage } from '../constants';
import axios from 'axios';
import { useToast } from "@components/common/ToastProvider";
import { API_CATERING_SUPPLIERS, API_FILES_UPLOAD, API_VIEW_FILE } from '@EnvironmentFile/constants/urlConfig';

const ModalHeader = ({ title, onClose, icon: Icon = DishIcon }) => (
  <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ p: 1, borderRadius: '12px', bgcolor: '#f0f9ff', color: '#0ea5e9' }}>
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a3353' }}>{title}</Typography>
    </Box>
    <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
      <CloseIcon fontSize="small" />
    </IconButton>
  </DialogTitle>
);

const FieldLabel = ({ label, required }) => (
  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
  </Typography>
);

export const DishFormModal = ({ open, onClose, onSubmit, dish, defaultSupplierTaxCode, readOnlySupplier, defaultSupplierName, defaultSupplierId }) => {
  const showToast = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPage, setSupplierPage] = useState(0);
  const [hasMoreSuppliers, setHasMoreSuppliers] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: yupResolver(dishSchema),
    defaultValues: dish || {
      name: '',
      code: '',
      category: 'com',
      supplierId: defaultSupplierId || '',
      price: '',
      unit: 'Suất',
      description: '',
      image_url: '',
      is_active: 1
    }
  });

  const category = watch('category');
  const image_url = watch('image_url');

  const fetchSuppliers = React.useCallback(async (page, isFirst = false) => {
    if (loadingSuppliers || (!hasMoreSuppliers && !isFirst)) return;
    
    setLoadingSuppliers(true);
    try {
      const token = localStorage.getItem('token_app');
      const response = await axios.get(API_CATERING_SUPPLIERS, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page: page, 
          size: 5,
          is_active: 1,
          contract_status: 'active'
        }
      });
      if (response.data?.items) {
        const newItems = response.data.items;
        setSuppliers(prev => isFirst ? newItems : [...prev, ...newItems]);
        setHasMoreSuppliers(newItems.length === 5);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [loadingSuppliers, hasMoreSuppliers]);

  React.useEffect(() => {
    if (open) {
      setSuppliers([]);
      setSupplierPage(0);
      setHasMoreSuppliers(true);
      fetchSuppliers(0, true);
    }
  }, [open]);

  const handleMenuScroll = (event) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 5) {
      if (hasMoreSuppliers && !loadingSuppliers) {
        const nextPage = supplierPage + 1;
        setSupplierPage(nextPage);
        fetchSuppliers(nextPage);
      }
    }
  };

  // After suppliers load, apply defaultSupplier (tax_Code comparison for initial setup)
  React.useEffect(() => {
    if (suppliers.length > 0 && !dish?.id) {
       if (defaultSupplierId) {
         setValue('supplierId', defaultSupplierId);
       } else if (defaultSupplierTaxCode) {
         const matched = suppliers.find(s => s.taxCode === defaultSupplierTaxCode);
         if (matched) setValue('supplierId', matched.id);
       }
    }
  }, [suppliers, defaultSupplierTaxCode, defaultSupplierId, dish, setValue]);

  React.useEffect(() => {
    if (open) {
      if (dish) {
        reset({
          ...dish,
          code: dish.dish_code || dish.code || '',
          supplierId: dish.supplierId || dish.supplier_id || defaultSupplierId || '',
          image_url: dish.imageUrl || dish.image_url || ''
        });
        const currentImg = dish.imageUrl || dish.image_url;
        setPreviewImage(currentImg ? getDishImage(currentImg, dish.category) : null);
      } else {
        reset({
          name: '',
          code: '',
          category: 'com',
          supplierId: defaultSupplierId || '',
          price: '',
          unit: 'Suất',
          description: '',
          is_active: 1,
          image_url: ''
        });
        setPreviewImage(null);
      }
    }
  }, [dish, open, reset, suppliers]);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewImage(localPreviewUrl);

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);
    formData.append('object_type', 'dish');

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token_app');
      const response = await axios.post(API_FILES_UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data && response.data.id) {
        const serverImageUrl = `${API_VIEW_FILE}/${response.data.id}`;
        setValue('image_url', serverImageUrl);
        setPreviewImage(serverImageUrl); 
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast(error.response?.data?.message || 'Tải hình ảnh lên thất bại. Vui lòng thử lại.', 'error');
      setPreviewImage(image_url || null); // Revert to old image
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ className: 'standard-font', sx: { borderRadius: '24px' } }}>
      <ModalHeader title={dish?.id ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'} onClose={onClose} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Image Upload Area */}
            <Grid item xs={12} md={4}>
              <Box sx={{ width: '100%', mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#475569', fontWeight: 600 }}>
                  Hình ảnh món ăn
                </Typography>
                <Box
                  onClick={handleFileClick}
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: '16px',
                    border: '2px dashed #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#0ea5e9',
                      bgcolor: '#f0f9ff'
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                  {previewImage || image_url ? (
                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                      <img
                        src={getDishImage(previewImage || image_url, category)}
                        alt="Dish Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}>
                        <UploadIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {isUploading ? 'Đang tải lên...' : 'Thay đổi hình ảnh'}
                        </Typography>
                      </Box>
                      {isUploading && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.7)'
                        }}>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Tải lên...</Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ p: 2, borderRadius: '50%', bgcolor: '#f1f5f9', color: '#94a3b8', mb: 1.5 }}>
                        <UploadIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', px: 3 }}>
                        {isUploading ? 'Đang tải lên...' : 'Kéo thả hoặc nhấp để tải lên hình ảnh món ăn'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                        Định dạng: JPG, PNG, WEBP (Max 2MB)
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Form Fields Area */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={8}>
                  <FieldLabel label="Tên món ăn" required />
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth size="small" placeholder="VD: Cơm sườn nướng mỡ hành..." error={!!errors.name} helperText={errors.name?.message} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FieldLabel label="Mã món ăn" required />
                  <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth size="small" placeholder="Mã món..." error={!!errors.code} helperText={errors.code?.message} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel label="Phân loại" required />
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} fullWidth size="small">
                        <MenuItem value="com">Món cơm</MenuItem>
                        <MenuItem value="bun_pho">Bún/Phở/Mì</MenuItem>
                        <MenuItem value="canh">Canh/Soup</MenuItem>
                        <MenuItem value="mon_khac">Món khác</MenuItem>
                      </Select>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel label="Nhà cung cấp" required />
                   <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      readOnlySupplier ? (
                        <TextField 
                          fullWidth 
                          size="small" 
                          value={defaultSupplierName || suppliers.find(s => s.id === field.value)?.name || field.value || ''}
                          disabled 
                          sx={{ 
                            '& .MuiInputBase-input.Mui-disabled': { 
                                WebkitTextFillColor: '#1a3353', 
                                fontWeight: 600,
                                bgcolor: '#f8fafc'
                            } 
                          }}
                        />
                      ) : (
                        <Select 
                          {...field} 
                          fullWidth 
                          size="small" 
                          error={!!errors.supplierId}
                          MenuProps={{
                            PaperProps: {
                              onScroll: handleMenuScroll,
                              sx: { maxHeight: 250 }
                            }
                          }}
                        >
                          {suppliers.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.taxCode})</MenuItem>
                          ))}
                          {loadingSuppliers && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                              <CircularProgress size={20} />
                            </Box>
                          )}
                          {!loadingSuppliers && suppliers.length === 0 && <MenuItem disabled>Không có dữ liệu</MenuItem>}
                        </Select>
                      )
                    )}
                  />
                  {errors.supplierId && <Typography variant="caption" color="error">{errors.supplierId.message}</Typography>}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel label="Đơn giá" required />
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth size="small" type="number" placeholder="0" error={!!errors.price} helperText={errors.price?.message} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel label="Đơn vị tính" required />
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth size="small" placeholder="VD: Suất, Tô..." error={!!errors.unit} helperText={errors.unit?.message} />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FieldLabel label="Mô tả món ăn" />
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth multiline rows={3} />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderRadius: '12px', px: 4, color: '#64748b' }}>Hủy bỏ</Button>
          <Button type="submit" variant="contained" sx={{ textTransform: 'none', borderRadius: '12px', px: 4, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}>Lưu món ăn</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export const DishViewModal = ({ open, onClose, dish }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'standard-font', sx: { borderRadius: '24px' } }}>
    <ModalHeader title="Chi tiết món ăn" onClose={onClose} />
    <DialogContent sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Avatar
          variant="rounded"
          src={getDishImage(dish?.imageUrl, dish?.category)}
          onError={(e) => { e.target.src = getDishImage(null, dish?.category); }}
          sx={{ width: 120, height: 120, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a3353', mb: 1 }}>{dish?.name}</Typography>
          <Typography variant="body1" sx={{ color: '#27ae60', fontWeight: 800, fontSize: '20px' }}>
            {dish?.price?.toLocaleString('vi-VN') || 0} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>/ {dish?.unit || 'Suất'}</span>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: '#f0f9ff', color: '#0ea5e9', fontSize: '12px', fontWeight: 700 }}>#{dish?.code}</Box>
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: '#f0fdf4', color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>ĐANG PHỤC VỤ</Box>
          </Box>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <FieldLabel label="Phân loại" />
          <Typography sx={{ fontWeight: 700, color: '#1a3353' }}>
            {dish?.category === 'com' ? 'Món cơm' : dish?.category === 'bun_pho' ? 'Bún/Phở' : dish?.category === 'canh' ? 'Canh/Soup' : 'Món khác'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <FieldLabel label="Nhà cung cấp" />
          <Typography sx={{ fontWeight: 700, color: '#1a3353' }}>{dish?.supplierName || dish?.supplier || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <FieldLabel label="Mô tả chi tiết" />
          <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>{dish?.description || "Món ăn giàu dinh dưỡng, đảm bảo vệ sinh an toàn thực phẩm, phù hợp khẩu vị đa số cán bộ nhân viên."}</Typography>
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions sx={{ p: 3, pb: 4, justifyContent: 'center' }}>
      <Button onClick={onClose} variant="contained" sx={{ px: 8, borderRadius: '12px', textTransform: 'none', bgcolor: '#1a3353' }}>Đóng</Button>
    </DialogActions>
  </Dialog>
);

export const ExportConfirmModal = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ className: 'standard-font', sx: { borderRadius: '24px' } }}>
    <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a3353', mb: 1 }}>Xuất dữ liệu?</Typography>
      <Typography variant="body2" sx={{ color: '#64748b' }}>Bạn có chắc chắn muốn xuất danh sách món ăn ra file Excel?</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
      <Button onClick={onClose} variant="outlined" sx={{ px: 4, borderRadius: '12px', textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
      <Button onClick={onConfirm} variant="contained" sx={{ px: 4, borderRadius: '12px', textTransform: 'none', bgcolor: '#22c55e' }}>Xác nhận</Button>
    </DialogActions>
  </Dialog>
);

export const DeactivateModal = ({ open, onClose, onConfirm, dish }) => {
  const isActivating = dish?.isActive === 0;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ className: 'standard-font', sx: { borderRadius: '24px' } }}>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box sx={{ 
          width: 60, 
          height: 60, 
          border: `1px solid ${isActivating ? '#22c55e' : '#ff4d4f'}`, 
          bgcolor: isActivating ? '#f0fdf4' : '#fff1f0', 
          color: isActivating ? '#22c55e' : '#f5222d', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 20px' 
        }}>
          {isActivating ? <SuccessIcon sx={{ fontSize: 32 }} /> : <WarningIcon sx={{ fontSize: 32 }} />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a3353', mb: 1 }}>
          {isActivating ? 'Kích hoạt món ăn?' : 'Ngưng phục vụ món ăn?'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', px: 2 }}>
          {isActivating 
            ? `Món ăn ${dish?.name} sẽ được kích hoạt và hiển thị lại trong thực đơn.` 
            : `Món ăn ${dish?.name} sẽ chuyển sang trạng thái "Ngưng phục vụ" và không hiện trong thực đơn.`
          }
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ px: 4, borderRadius: '12px', textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
        <Button 
          onClick={() => onConfirm(dish)} 
          variant="contained" 
          sx={{ 
            px: 4, 
            borderRadius: '12px', 
            textTransform: 'none', 
            bgcolor: isActivating ? '#22c55e' : '#ff4d4f', 
            '&:hover': { bgcolor: isActivating ? '#16a34a' : '#f5222d' } 
          }}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};
