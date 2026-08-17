/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/ToastProvider';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Breadcrumbs,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  NavigateNext,
  AddCircleOutline,
  ReceiptLong as ReceiptLongIcon,
  ChevronRight,
  Search,
  ShoppingCart as ShoppingCartIcon,
  Send as SendIcon,
  Save as SaveIcon,
  CheckCircle,
  Warning,
  Info,
  Assignment,
  Article,
  HistoryEdu,
} from '@mui/icons-material';
import CustomInput from '@components/CustomInput/CustomInput';
import CustomDatePicker from '@components/CustomDatePicker';
import CustomButton from '@components/CustomButton';
import VppPageHeader from '@components/vpp/VppPageHeader';
import {
  createRequest, 
  getCategories, 
  getRequestorInfo, 
  getInventoryPicker,
  getExpectedApprovalFlow,
  getApprovalFlowConfig,
  escalateRequest
} from '../../services/vppService';
import { formatValidationErrors } from '../../utils/utils';
import { AuthContext } from '../../AuthContext/AuthProvider';
import dayjs from 'dayjs';

// --- Styled Tokens ---
const TOKENS = {
  accent: '#1976d2',
  accentLight: 'rgba(25, 118, 210, 0.08)',
  green: '#2e7d32',
  greenBg: '#e8f5e9',
  amber: '#ed6c02',
  amberBg: '#fff4e5',
  red: '#d32f2f',
  redBg: '#ffebee',
  purple: '#9c27b0',
  purpleBg: '#f3e5f5',
  border: '#e0e0e0',
};

const FONT_FAMILY = "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif";

// --- Sub-components ---

const ModernCard = ({ title, icon: Icon, iconColor, iconBg, children, extra }) => (
  <Card sx={{ 
    mb: 3, 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
    border: '1px solid', 
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'visible'
  }}>
    <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ 
          width: 32, 
          height: 32, 
          borderRadius: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: iconBg,
          color: iconColor
        }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: FONT_FAMILY }}>{title}</Typography>
      </Stack>
      {extra}
    </Box>
    <CardContent sx={{ p: 3, pt: 0 }}>
      {children}
    </CardContent>
  </Card>
);

const QtyControl = ({ value, onChange }) => (
  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 0.5, border: '1px solid', borderColor: 'grey.200', width: 'fit-content' }}>
    <IconButton size="small" onClick={() => onChange(-1)} sx={{ p: 0.5, color: TOKENS.accent }}><Remove sx={{ fontSize: 16 }} /></IconButton>
    <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem', fontFamily: FONT_FAMILY }}>{value}</Typography>
    <IconButton size="small" onClick={() => onChange(1)} sx={{ p: 0.5, color: TOKENS.accent }}><Add sx={{ fontSize: 16 }} /></IconButton>
  </Stack>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
    {Icon && <Icon color="primary" fontSize="small" />}
    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: FONT_FAMILY }}>
      {title}
    </Typography>
  </Stack>
);

// --- Main Components ---

const RequestInfoForm = ({ form, setForm, user, requestCode }) => {
  const priorityOptions = [
    { label: 'Bình thường', value: 'Bình thường' },
    { label: 'Gấp', value: 'Khẩn' },
  ];

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ModernCard 
      title="Thông tin phiếu" 
      icon={Assignment} 
      iconColor={TOKENS.accent} 
      iconBg={TOKENS.accentLight}
      extra={
        <Typography variant="caption" sx={{ fontFamily: 'Monospace', color: 'text.secondary' }}>
          Mã phiếu: <Box component="span" sx={{ color: TOKENS.accent, fontWeight: 'bold' }}>{requestCode}</Box>
        </Typography>
      }
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">Người đề nghị</Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={user?.name || ''} 
            disabled
            sx={{ mt: 0.5, bgcolor: 'grey.50' }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">Phòng ban</Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={user?.organizationName || ''} 
            disabled
            sx={{ mt: 0.5, bgcolor: 'grey.50' }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">Ngày tạo</Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={dayjs().format('DD/MM/YYYY')} 
            disabled
            sx={{ mt: 0.5, bgcolor: 'grey.50' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomDatePicker
            label="Ngày cần *"
            value={form.needDate}
            onChange={(val) => handleFieldChange('needDate', val)}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomInput
            select
            label="Mức ưu tiên"
            value={form.priority}
            options={priorityOptions}
            customLabel="label"
            customValue="value"
            onChange={(val) => handleFieldChange('priority', val)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <CustomInput
            multiline
            rows={2}
            label="Lý do / Mục đích sử dụng *"
            placeholder="VD: Bổ sung VPP hàng tháng cho phòng, phục vụ công tác..."
            value={form.reason}
            onChange={(e) => handleFieldChange('reason', e.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>
    </ModernCard>
  );
};

const ProductSelector = ({ 
  searchTerm, 
  setSearchTerm, 
  categoryFilter, 
  setCategoryFilter, 
  categories, 
  products, 
  loading,
  onAddItem 
}) => {
  return (
    <ModernCard 
      title="Chọn mặt hàng" 
      icon={AddCircleOutline} 
      iconColor={TOKENS.green} 
      iconBg={TOKENS.greenBg}
      extra={<Typography variant="caption" color="text.secondary">{products.length} mặt hàng</Typography>}
    >
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={8}>
          <TextField
              size="small"
              placeholder="Tìm theo tên, mã mặt hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { borderRadius: '10px' }
              }}
            />
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomInput
            select
            size="small"
            value={categoryFilter}
            options={[{ label: 'Tất cả nhóm hàng', value: 'all' }, ...categories]}
            onChange={(val) => setCategoryFilter(val)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>

      <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {products.map((item) => {
              const outOfStock = item.stock <= 0;
              return (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Paper 
                    elevation={0}
                    variant="outlined" 
                    onClick={() => !outOfStock && onAddItem(item)}
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: outOfStock ? 0.6 : 1,
                      position: 'relative',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      '&:hover': { 
                        borderColor: TOKENS.accent, 
                        bgcolor: 'rgba(25, 118, 210, 0.02)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      } 
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', width: 40, height: 40, borderRadius: 2 }}>
                        <Article fontSize="small" />
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight="800" noWrap sx={{ fontFamily: FONT_FAMILY }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontFamily: FONT_FAMILY }}>
                          {item.code} · {item.unit} {item.quota > 0 ? `· Định mức: ${item.quota}/${item.quotaUnit || 'Tháng'}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: outOfStock ? TOKENS.red : item.stock < 10 ? TOKENS.amber : TOKENS.green }}>
                          {outOfStock ? 'Hết' : item.stock}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '10px' }}>tồn kho</Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddItem(item); }} disabled={outOfStock} sx={{ color: TOKENS.accent }}>
                        <AddCircleOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </ModernCard>
  );
};

const RequestedItemsTable = ({ items, onRemove, onChangeQty }) => {
  return (
    <ModernCard 
      title="Mặt hàng đề nghị cấp" 
      icon={ShoppingCartIcon} 
      iconColor={TOKENS.purple} 
      iconBg={TOKENS.purpleBg}
      extra={
        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: TOKENS.accent }}>
          {items.length} mặt hàng
        </Typography>
      }
    >
      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Mặt hàng</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Số lượng</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Định mức</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tồn kho</TableCell>
              <TableCell align="center" padding="none"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1} sx={{ opacity: 0.5 }}>
                    <ReceiptLongIcon sx={{ fontSize: 40 }} />
                    <Typography variant="body2">Chưa chọn mặt hàng nào.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => {
                const isOverLimit = row.quota > 0 && (row.used + row.qty) > row.quota;
                const outOfStock = row.stock <= 0;
                return (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" fontWeight="700" sx={{ fontFamily: FONT_FAMILY }}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: FONT_FAMILY }}>{row.code} · {row.unit}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <QtyControl value={row.qty} onChange={(delta) => onChangeQty(row.id, delta)} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.quota > 0 ? `${row.used + row.qty}/${row.quota} (${row.quotaUnit || 'Tháng'})` : 'Không ĐM'} 
                        size="small" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '11px',
                          bgcolor: isOverLimit ? TOKENS.redBg : TOKENS.greenBg, 
                          color: isOverLimit ? TOKENS.red : TOKENS.green,
                          border: 'none'
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight="bold" sx={{ color: outOfStock ? TOKENS.red : row.stock < 10 ? TOKENS.amber : 'text.secondary', fontFamily: 'Monospace' }}>
                        {outOfStock ? 'Hết' : row.stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => onRemove(row.id)}>
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ModernCard>
  );
};

const normalizeFlowSteps = (configuredSteps = [], fallbackUsers = []) => {
  if (!configuredSteps.length) return [];
  return configuredSteps.map((step, index) => {
    const userId = step.userId || step.id || step._id;
    const match = fallbackUsers.find((user) => user.id === userId || user.username === step.username);
    return {
      id: userId,
      name: match?.name || step.name || step.username || 'Người duyệt',
      username: match?.username || step.username,
      departmentName: match?.departmentName || step.departmentName,
      departmentCode: match?.departmentCode || step.departmentCode,
      order: step.order ?? index + 1
    };
  });
};
const FLOW_MODULE_TYPE = 'VPP';

const mapExpectedFlow = (users = []) => users.map((user, index) => ({
  id: user.id || user._id,
  name: user.name,
  username: user.username,
  departmentName: user.departmentName,
  departmentCode: user.departmentCode,
  order: index + 1
}));

const determineNextApprover = (flow = [], currentUserId, currentUsername) => {
  if (!flow.length) return null;
  const currentIndex = flow.findIndex((item) =>
    (item.id && currentUserId && item.id === currentUserId) ||
    (item.userId && currentUserId && item.userId === currentUserId) ||
    (item.username && currentUsername && item.username === currentUsername)
  );
  if (currentIndex === -1) {
    return flow[0]?.id || flow[0]?.userId || flow[0]?._id || null;
  }
  const next = flow[currentIndex + 1];
  return next?.id || next?.userId || next?._id || null;
};

const ApprovalFlow = ({ user, flowData }) => {
  const steps = [
    { label: 'Tạo phiếu', name: user?.name || 'Bạn', status: 'current', icon: <HistoryEdu sx={{ fontSize: 14 }} /> },
    ...(flowData || []).map((item, idx) => ({
      label: item.departmentName || 'Duyệt phiếu',
      name: item.name || item.username || 'Người duyệt',
      status: 'pending',
      id: idx + 1,
    })),
  ];

  return (
    <ModernCard title="Luồng duyệt dự kiến" icon={HistoryEdu} iconColor={TOKENS.accent} iconBg={TOKENS.accentLight}>
      <Stack spacing={2.5}>
        {steps.map((s, i) => (
          <Stack direction="row" spacing={2} key={i} alignItems="flex-start" sx={{ position: 'relative' }}>
            {i < steps.length - 1 && (
              <Box sx={{ 
                position: 'absolute', 
                left: 11, 
                top: 24, 
                bottom: -16, 
                width: 2, 
                bgcolor: 'grey.200', 
                borderRadius: 1 
              }} />
            )}
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: s.status === 'current' ? TOKENS.accent : 'grey.100',
              color: s.status === 'current' ? 'white' : 'text.secondary',
              border: s.status === 'pending' ? '1px solid' : 'none',
              borderColor: 'grey.300',
              fontWeight: 'bold',
              fontSize: 12,
              zIndex: 1
            }}>
              {s.icon }
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="bold" display="block" lineHeight={1.2}>{s.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>{s.name}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </ModernCard>
  );
};

// --- Main Component Implementation ---

const CreateOfficeRequest = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user: authData } = useContext(AuthContext);
  const currentUser = authData?.user;

  // States
  const [requestorInfo, setRequestorInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', categoryId: 'all' });
  const [form, setForm] = useState({ needDate: null, priority: 'Bình thường', reason: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [requestCode, setRequestCode] = useState('');
  const [flowData, setFlowData] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const requestorDepartmentId = useMemo(() => (
    requestorInfo?.departmentId ||
    requestorInfo?.department_id ||
    requestorInfo?.department?.id
  ), [requestorInfo]);

  const loadApprovalFlow = useCallback(async (departmentId) => {
    if (!departmentId) {
      setFlowData([]);
      return;
    }
    setFlowLoading(true);
    try {
      const [expectedRes, configRes] = await Promise.allSettled([
        getExpectedApprovalFlow({ moduleType: FLOW_MODULE_TYPE }),
        getApprovalFlowConfig({ moduleType: FLOW_MODULE_TYPE })
      ]);
      const expectedUsers = expectedRes.status === "fulfilled" && expectedRes.value?.success
        ? expectedRes.value.data || []
        : [];
      const configuredSteps = configRes.status === "fulfilled" && configRes.value?.success
        ? configRes.value.data?.steps || []
        : [];
      const normalized = normalizeFlowSteps(configuredSteps, expectedUsers);
      const fallback = mapExpectedFlow(expectedUsers);
      setFlowData(normalized.length ? normalized : fallback);
    } catch (err) {
      console.error("Load approval flow error:", err);
      setFlowData([]);
    } finally {
      setFlowLoading(false);
    }
  }, []);

  // Initial Fetches
  useEffect(() => {
    // Generate Request Code: DN-2026-03241512 (Format: DN-Year-MonthDaySecond)
    const now = dayjs();
    const generatedCode = `DN-${now.format('YYYY')}-${now.format('MMDDss')}${Math.floor(Math.random() * 10)}`;
    setRequestCode(generatedCode);

    const init = async () => {
      try {
        const [userRes, catRes] = await Promise.all([
          getRequestorInfo(),
          getCategories(),
        ]);
        if (userRes?.success) setRequestorInfo(userRes.data);
        if (catRes?.success) {
          const catData = catRes.data?.items || catRes.data || [];
          setCategories(catData.map(c => typeof c === 'string' ? { label: c, value: c } : c));
        }
      } catch (err) {
        console.error("Init fetch failed", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (requestorDepartmentId) {
      loadApprovalFlow(requestorDepartmentId);
    }
  }, [requestorDepartmentId, loadApprovalFlow]);

  // Fetch Products for Picker
  useEffect(() => {
    const fetchPickerItems = async () => {
      setProductsLoading(true);
      try {
        const params = {
          keyword: filters.search || undefined,
          category: filters.categoryId !== 'all' ? filters.categoryId : undefined
        };
        const res = await getInventoryPicker(params);
        if (res?.success) setProducts(res.data);
      } catch (err) {
        console.error("Fetch products failed", err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchPickerItems();
  }, [filters]);

  const handleAddItem = (item) => {
    const isExist = selectedItems.find((p) => p.id === item.id);
    if (!isExist) {
      setSelectedItems([...selectedItems, { ...item, qty: 1 }]);
    }
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  const handleChangeQty = (id, delta) => {
    let errorMsg = null;
    setSelectedItems((prev) => {
      const next = prev.map((i) => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          if (newQty > i.stock) {
            errorMsg = `Sản phẩm ${i.name} chỉ còn ${i.stock} trong kho!`;
            return i;
          }
          return { ...i, qty: newQty > 0 ? newQty : 1 };
        }
        return i;
      });
      return next;
    });
    if (errorMsg) {
      showToast(errorMsg, 'warning');
    }
  };

  const hasOverlapLimit = selectedItems.some(i => i.quota > 0 && (i.used + i.qty) > i.quota);

  // Totals
  const totalItems = selectedItems.length;
  const totalQty = selectedItems.reduce((acc, i) => acc + i.qty, 0);
  const totalValue = selectedItems.reduce((acc, i) => acc + (i.qty * (i.price || 0)), 0);

  const handleSubmit = async (action = 'SUBMIT') => {
    if (!form.needDate || !form.reason?.trim()) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Vui lòng chọn ít nhất một mặt hàng!', 'warning');
      return;
    }
    
    // Validate stock
    const overStockItem = selectedItems.find(i => i.qty > i.stock);
    if (overStockItem) {
      showToast(`Số lượng ${overStockItem.name} vượt quá tồn kho (${overStockItem.stock})!`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const currentUserId = currentUser?.id || currentUser?._id;
      const nextApproverId = determineNextApprover(flowData, currentUserId, currentUser?.username);
      const finalApproverId = nextApproverId || currentUser?.parent?.id || currentUser?.parent?._id || requestorInfo?.approverId;

      const payload = {
        action,
        code: requestCode,
        priority: form.priority,
        need_date: dayjs(form.needDate).format('YYYY-MM-DD'),
        reason: form.reason,
        department: currentUser?.organizationName || requestorInfo?.departmentName,
        status: 2,
        approver: finalApproverId,
        requester_id: currentUserId,
        requester_name: currentUser?.name,
        requester_username: currentUser?.username,
        estimated_value: totalValue,
        items: selectedItems.map(item => ({
          price: item.price || 0,
          quantity: item.qty,
          requested_quantity: item.qty,
          product_id: item.id,
          product_name: item.name,
          product_code: item.code,
          unit: item.unit,
          ...item,
          note: ""
        }))
      };

      const res = await createRequest(payload);
      if (res?.success) {
        showToast(action === 'SUBMIT' ? 'Gửi phiếu thành công!' : 'Lưu nháp thành công!', 'success');
        navigate('/office-supply-request/list');
      } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (e) {
      const errorMsg = formatValidationErrors(e, 'Lỗi kết nối.');
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f1f5f9', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <VppPageHeader
          title="Tạo phiếu đề nghị cấp VPP"
          subtitle="Chọn mặt hàng từ danh mục, nhập số lượng và gửi duyệt"
        />

        <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} lg={8.2}>
          <RequestInfoForm form={form} setForm={setForm} user={currentUser || requestorInfo} requestCode={requestCode} />
          
          <ProductSelector 
            searchTerm={filters.search}
            setSearchTerm={(val) => setFilters(f => ({ ...f, search: val }))}
            categoryFilter={filters.categoryId}
            setCategoryFilter={(val) => setFilters(f => ({ ...f, categoryId: val }))}
            categories={categories}
            products={products}
            loading={productsLoading}
            onAddItem={handleAddItem}
          />
          
          <RequestedItemsTable 
            items={selectedItems}
            onRemove={handleRemoveItem}
            onChangeQty={handleChangeQty}
          />
        </Grid>

        {/* Right Column / Sidebar */}
        <Grid item xs={12} lg={3.8}>
          <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
            
            {/* Requester Profile */}
            <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: 'none' }}>
              <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">Người đề nghị</Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ 
                    bgcolor: TOKENS.accent, 
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(25,118,210,0.15)'
                  }}>
                    {(currentUser?.name || requestorInfo?.name || 'U').charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="800" variant="body2">{currentUser?.name || requestorInfo?.name || 'Đang cập nhật'}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {currentUser?.organizationName || requestorInfo?.departmentName || 'Phòng ban'} · {currentUser?.orgType || 'Nhân viên'}
                    </Typography>
                  </Box>
                </Stack>
                
                <Stack spacing={1.5} mt={2.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Mã nhân viên</Typography>
                    <Typography variant="caption" fontWeight="bold">{currentUser?.username || requestorInfo?.employeeCode || 'NV-XXXX'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Kỳ cấp phát</Typography>
                    <Typography variant="caption" fontWeight="bold">Tháng {dayjs().format('MM/YYYY')}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Đã sử dụng tháng này</Typography>
                    <Typography variant="caption" fontWeight="bold" color={TOKENS.amber}>{requestorInfo?.requestStats || 0} phiếu</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: 'none' }}>
              <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">Tóm tắt phiếu</Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Mã phiếu dự kiến</Typography>
                    <Typography fontWeight="bold" variant="body2" sx={{ fontFamily: 'Monospace', color: TOKENS.accent }}>{requestCode}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Số mặt hàng</Typography>
                    <Typography fontWeight="bold" variant="body2">{totalItems}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Tổng số lượng</Typography>
                    <Typography fontWeight="bold" variant="body2">{totalQty}</Typography>
                  </Stack>
                  
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="bold">Ước tính giá trị</Typography>
                    <Typography fontWeight="900" variant="subtitle1" color="primary">
                      {totalValue.toLocaleString('vi-VN')} ₫
                    </Typography>
                  </Stack>

                  {hasOverlapLimit && (
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: TOKENS.amberBg, 
                      borderRadius: 2, 
                      display: 'flex', 
                      gap: 1.2, 
                      border: '1px solid', 
                      borderColor: 'rgba(237, 108, 2, 0.2)' 
                    }}>
                      <Warning sx={{ fontSize: 18, color: TOKENS.amber }} />
                      <Typography variant="caption" color={TOKENS.amber} fontWeight="600" lineHeight={1.3}>
                        Có sản phẩm vượt định mức tháng. Cần phê duyệt cấp trên.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <ApprovalFlow user={currentUser || requestorInfo} flowData={flowData} />

            {/* Actions */}
            <Stack spacing={1.5} mt={3}>
              <Button 
                fullWidth 
                variant="contained" 
                size="large"
                startIcon={<SendIcon />}
                onClick={() => handleSubmit('SUBMIT')}
                disabled={isSaving}
                sx={{ 
                  py: 1.8, 
                  borderRadius: '12px', 
                  fontWeight: '900', 
                  fontFamily: FONT_FAMILY,
                  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.25)',
                  bgcolor: TOKENS.accent,
                  '&:hover': { bgcolor: '#1565c0', boxShadow: 'none' }
                }}
              >
                GỬI PHÊ DUYỆT
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<SaveIcon />}
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSaving}
                sx={{ 
                  py: 1.5, 
                  borderRadius: '12px', 
                  fontWeight: '700',
                  fontFamily: FONT_FAMILY,
                  color: 'text.secondary',
                  borderColor: 'grey.300',
                  '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' }
                }}
              >
                LƯU BẢN NHÁP
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default CreateOfficeRequest;
