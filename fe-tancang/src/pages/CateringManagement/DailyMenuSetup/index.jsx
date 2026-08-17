import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  CalendarMonth as CalendarIcon,
  Print as PrintIcon,
  FileDownload as ExportIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
  Apartment as DeptIcon,
  Restaurant as DishIcon,
  WbSunny as SunIcon,
  LightMode as NoonIcon,
  Bedtime as NightIcon,
  TrendingDown as DownIcon,
  TrendingUp as UpIcon,
  InsertChart as ChartIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import './DailyMenuSetup.css';
import { canteenService } from '../../../services/canteenService';

dayjs.locale('vi');

const DailyMenuSetup = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState('');

  // Dialog States
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState('breakfast');
  const [availableDishes, setAvailableDishes] = useState([]);
  const [selectedInDialog, setSelectedInDialog] = useState([]);
  const [dishPage, setDishPage] = useState(0);
  const [hasMoreDishes, setHasMoreDishes] = useState(true);
  const [isFetchingDishes, setIsFetchingDishes] = useState(false);
  const [dishSearch, setDishSearch] = useState('');

  // Edit Quantity States
  const [isEditQtyOpen, setIsEditQtyOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null); // { slot, index, item }
  const [editQtyValue, setEditQtyValue] = useState('');

  // Notification State
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', title: '', content: '' });

  // Department Stats State
  const [deptStats, setDeptStats] = useState([]);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Fetch initial data
  const fetchData = useCallback(async (targetDate) => {
    setLoading(true);
    try {
      // 1. Fetch Daily Menu (slots & items)
      const menuRes = await canteenService.getDailyMenuDetail(targetDate);

      // 2. Fetch Daily Summary (registration stats)
      const summaryRes = await canteenService.getDailySummary(targetDate);

      if (menuRes && menuRes.menu) {
        setMenuData(menuRes.menu);
        if (menuRes.note) setNotes(menuRes.note);
        else setNotes("");
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }

      // 3. Fetch Department Summary
      const deptRes = await canteenService.getDepartmentSummary(targetDate);
      if (deptRes.success) {
        setDeptStats(deptRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        date: dateParam,
        note: notes,
        meals: {
          breakfast: menuData.breakfast.map(d => ({ dish_id: d.id, actual_qty: d.actual_quantity || 0 })),
          lunch: menuData.lunch.map(d => ({ dish_id: d.id, actual_qty: d.actual_quantity || 0 })),
          dinner: menuData.dinner.map(d => ({ dish_id: d.id, actual_qty: d.actual_quantity || 0 })),
        }
      };

      const res = await canteenService.saveDailyMenuSetup(payload);
      if (res.success) {
        showNotification("Lưu thay đổi thành công!");
        fetchData(dateParam);
      } else {
        showNotification("Lỗi khi lưu thay đổi", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification("Lỗi kết nối máy chủ hoặc dữ liệu không hợp lệ", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Dish Selection Logic ---
  const fetchAvailableDishes = useCallback(async (page, search, append = false) => {
    if (isFetchingDishes) return;
    setIsFetchingDishes(true);
    try {
      const res = await canteenService.getDishes({
        page: page,
        size: 5,
        keyword: search
      });

      if (res && res.items) {
        setAvailableDishes(prev => append ? [...prev, ...res.items] : res.items);
        setHasMoreDishes(res.items.length === 5);
      }
    } catch (error) {
      console.error('Error fetching dishes:', error);
    } finally {
      setIsFetchingDishes(false);
    }
  }, [isFetchingDishes]);

  const handleOpenAddDish = (slot) => {
    setActiveSlot(slot);
    setDishPage(0);
    setDishSearch('');
    setAvailableDishes([]);

    // Pre-select existing dishes
    const existingIds = (menuData[slot] || []).map(item => String(item.id));
    setSelectedInDialog(existingIds);

    setIsAddDishOpen(true);
    fetchAvailableDishes(0, '');
  };

  const handleLoadMoreDishes = () => {
    if (hasMoreDishes && !isFetchingDishes) {
      const nextPage = dishPage + 1;
      setDishPage(nextPage);
      fetchAvailableDishes(nextPage, dishSearch, true);
    }
  };

  const handleSearchDishes = (e) => {
    const val = e.target.value;
    setDishSearch(val);
    setDishPage(0);
    fetchAvailableDishes(0, val);
  };

  const handleToggleDishInDialog = (dishId) => {
    const id = String(dishId);
    setSelectedInDialog(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmAddDishes = () => {
    const currentSlotItems = menuData[activeSlot] || [];
    let duplicatesRemoved = 0;

    const newSelection = selectedInDialog.map(id => {
      // Check if already in current menu to avoid duplicates
      if (currentSlotItems.some(item => String(item.id) === id)) {
        duplicatesRemoved++;
        return null;
      }

      // Find the dish in the already fetched list
      const dish = availableDishes.find(d => String(d.id) === id);
      if (dish) {
        return {
          id: String(dish.id),
          name: dish.name,
          price: dish.price,
          supplierName: dish.supplierName || 'N/A'
        };
      }
      return null;
    }).filter(Boolean);

    if (duplicatesRemoved > 0) {
      showNotification(`Đã bỏ qua ${duplicatesRemoved} món bị trùng lặp`, 'warning');
    }

    if (newSelection.length > 0) {
      setMenuData(prev => ({
        ...prev,
        [activeSlot]: [...(prev[activeSlot] || []), ...newSelection]
      }));
      showNotification(`Đã thêm ${newSelection.length} món mới vào thực đơn`);
    } else if (duplicatesRemoved === 0) {
      // User clicked confirm without selecting anything new
    }


    setIsAddDishOpen(false);
  };

  // --- Edit Quantity Logic ---
  const handleOpenEditQty = (slot, index, item) => {
    setEditingTarget({ slot, index, item });
    // Use toString() to ensure 0 is not treated as falsy
    setEditQtyValue(item.actual_quantity !== undefined && item.actual_quantity !== null ? String(item.actual_quantity) : '');
    setIsEditQtyOpen(true);
  };

  const handleConfirmEditQty = () => {
    if (!editingTarget) return;

    // Validate: must be a number and >= 0
    const val = Number(editQtyValue);
    if (isNaN(val) || val < 0 || editQtyValue === '') {
      showNotification('Vui lòng nhập số lượng hợp lệ (>= 0)', 'error');
      return;
    }

    const { slot, index } = editingTarget;
    setMenuData(prev => {
      const updatedSlot = [...prev[slot]];
      updatedSlot[index] = {
        ...updatedSlot[index],
        actual_quantity: val
      };
      return {
        ...prev,
        [slot]: updatedSlot
      };
    });

    setIsEditQtyOpen(false);
  };

  const handleDeleteDish = (slot, index) => {
    setMenuData(prev => ({
      ...prev,
      [slot]: prev[slot].filter((_, i) => i !== index)
    }));
    showNotification('Đã xóa món ăn khỏi thực đơn', 'warning');
  };

  const handleOpenConfirm = (type) => {
    if (type === 'print') {
      setConfirmDialog({
        open: true,
        type: 'print',
        title: 'Xác nhận in thực đơn',
        content: `Bạn có chắc chắn muốn lấy dữ liệu in cho ngày ${dayjs(dateParam).format('DD/MM/YYYY')}?`
      });
    } else {
      setConfirmDialog({
        open: true,
        type: 'export',
        title: 'Xác nhận xuất Excel',
        content: `Bạn có chắc chắn muốn xuất dữ liệu thực đơn ngày ${dayjs(dateParam).format('DD/MM/YYYY')} ra file Excel?`
      });
    }
  };

  const handleConfirmAction = async () => {
    const { type } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, open: false }));
    setLoading(true);

    try {
      if (type === 'print') {
        const res = await canteenService.getDailyMenuPrintData(dateParam);
        if (res.success && res.data) {
          handlePrintView(res.data);
          showNotification('Đang chuẩn bị bản in...');
        } else {
          showNotification('Không lấy được dữ liệu in', 'error');
        }
      } else if (type === 'export') {
        const blob = await canteenService.exportDailyMenuExcel(dateParam);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Thuc-don-ngay-${dateParam}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        showNotification('Đã xuất file Excel thành công!');
      }
    } catch (error) {
      console.error(`${type} error:`, error);
      showNotification(`Lỗi khi thực hiện ${type === 'print' ? 'in' : 'xuất Excel'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintView = (data) => {
    const printWindow = window.open('', '_blank');
    const dateStr = dayjs(data.date).format('DD/MM/YYYY');

    const html = `
      <html>
        <head>
          <title>In thực đơn - ${dateStr}</title>
          <style>
            body { font-family: "Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
            h1 { color: #003366; margin: 0; }
            .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-around; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 12px; color: #64748b; font-weight: bold; }
            .summary-value { font-size: 18px; font-weight: bold; color: #333; }
            .meal-section { margin-bottom: 30px; }
            .meal-title { background: #e2e8f0; padding: 8px 15px; border-radius: 4px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; font-size: 13px; }
            .text-center { text-align: center; }
            .footer { margin-top: 50px; text-align: right; font-style: italic; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>THỰC ĐƠN NGÀY ${dateStr}</h1>
            <p>Văn phòng PTSC - Canteen</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">TỔNG ĐĂNG KÝ</div>
              <div class="summary-value">${data.summary.total}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">ĂN SÁNG</div>
              <div class="summary-value">${data.summary.breakfast}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">ĂN TRƯA</div>
              <div class="summary-value">${data.summary.lunch}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">ĂN TỐI</div>
              <div class="summary-value">${data.summary.dinner}</div>
            </div>
          </div>

          ${['breakfast', 'lunch', 'dinner'].map(slot => {
      const items = data.menu[slot] || [];
      if (items.length === 0) return '';
      return `
              <div class="meal-section">
                <div class="meal-title">${slot === 'breakfast' ? 'BỮA SÁNG' : slot === 'lunch' ? 'BỮA TRƯA' : 'BỮA TỐI'}</div>
                <table>
                  <thead>
                    <tr>
                      <th width="50">STT</th>
                      <th>Tên món ăn</th>
                      <th>Nhà cung cấp</th>
                      <th width="100" class="text-center">Thực tế</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item, idx) => `
                      <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.supplierName || 'N/A'}</td>
                        <td class="text-center">${item.actual_quantity || 0}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
    }).join('')}

          <div class="footer">
            Ngày in: ${dayjs().format('DD/MM/YYYY HH:mm')}
          </div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchData(dateParam);
  }, [dateParam, fetchData]);

  const handleDateChange = (days) => {
    const newDate = dayjs(dateParam).add(days, 'day').format('YYYY-MM-DD');
    setSearchParams({ date: newDate });
  };

  const getMealIcon = (slot) => {
    switch (slot?.toLowerCase()) {
      case 'breakfast': return <SunIcon />;
      case 'lunch': return <NoonIcon />;
      case 'dinner': return <NightIcon />;
      default: return <DishIcon />;
    }
  };

  const getMealLabel = (slot) => {
    switch (slot?.toLowerCase()) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return 'Khác';
    }
  };

  const getMealColor = (slot) => {
    switch (slot?.toLowerCase()) {
      case 'breakfast': return '#f59e0b';
      case 'lunch': return '#ef4444';
      case 'dinner': return '#6366f1';
      default: return '#64748b';
    }
  };

  // Dynamic calculations based on menuData
  const getActualQtyForSlot = useCallback((slot) => {
    return (menuData[slot] || []).reduce((sum, item) => sum + (Number(item.actual_quantity) || 0), 0);
  }, [menuData]);

  const getRegQtyForSlot = useCallback((slot) => {
    return (menuData[slot] || []).reduce((sum, item) => {
      const itemReg = item.registered_quantity || summary?.dish_registrations?.[item.menu_item_id] || 0;
      return sum + Number(itemReg);
    }, 0);
  }, [menuData, summary]);

  const chartData = useMemo(() => [
    { name: 'Sáng', reg: getRegQtyForSlot('breakfast'), actual: getActualQtyForSlot('breakfast') },
    { name: 'Trưa', reg: getRegQtyForSlot('lunch'), actual: getActualQtyForSlot('lunch') },
    { name: 'Tối', reg: getRegQtyForSlot('dinner'), actual: getActualQtyForSlot('dinner') },
  ], [getRegQtyForSlot, getActualQtyForSlot]);

  const totalReg = chartData.reduce((sum, d) => sum + d.reg, 0);
  const totalAct = chartData.reduce((sum, d) => sum + d.actual, 0);
  const usageRate = totalReg > 0 ? (totalAct / totalReg) * 100 : 0;

  const getShortName = (name) => {
    if (!name || name === 'Khác') return 'KH';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getDeptColor = (index, name) => {
    if (name === 'Khác') return '#94a3b8';
    const colors = ['#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  // Lãng phí: Nếu thực tế < đăng ký thì phần chênh lệch là lãng phí
  const wasteCount = Math.max(0, totalReg - totalAct);
  const wasteRate = totalReg > 0 ? (wasteCount / totalReg) * 100 : 0;


  // Hiệu suất: nếu Thực tế >= Đăng ký thì coi như 100% (hoặc có thể tính theo hướng khác tùy NCC)
  const efficiency = totalReg > 0 ? (totalAct >= totalReg ? 100 : (totalAct / totalReg) * 100) : 0;

  if (loading && Object.values(menuData).every(v => v.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="daily-menu-setup standard-font">
      {/* Header Bar */}
      <Box className="daily-header">
        <Stack direction="row" spacing={3} alignItems="center">
          <IconButton
            onClick={() => navigate('/catering/menu-setup')}
            sx={{
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            <BackIcon sx={{ color: '#1a3353' }} />
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              size="small"
              onClick={() => handleDateChange(-1)}
              sx={{ bgcolor: '#f1f5f9', borderRadius: '8px' }}
            >
              <PrevIcon sx={{ fontSize: 18, color: '#64748b' }} />
            </IconButton>

            <Box sx={{ textAlign: 'center', minWidth: 160 }}>
              <Typography sx={{ color: '#1a3353', fontWeight: 900, fontSize: '20px', lineHeight: 1.2 }}>
                {dayjs(dateParam).format('dddd, DD/MM/YYYY')}
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={() => handleDateChange(1)}
              sx={{ bgcolor: '#f1f5f9', borderRadius: '8px' }}
            >
              <NextIcon sx={{ fontSize: 18, color: '#64748b' }} />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => handleOpenConfirm('print')}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            In thực đơn
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleOpenConfirm('export')}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            color="success"
            onClick={handleSave}
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, boxShadow: 'none' }}
          >
            Lưu thay đổi
          </Button>
        </Stack>
      </Box>

      <Box className="daily-content">
        {/* Left Column: Metrics & Meals */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Stats Bar */}
          <Grid container spacing={2}>
            {[
              { label: 'Lượt đăng ký', value: totalReg, delta: '', icon: <DeptIcon />, color: '#3b82f6' },
              { label: 'Thực tế sử dụng', value: totalAct, delta: `${usageRate.toFixed(1)}%`, icon: <DishIcon />, color: '#10b981' },
              { label: 'Món trong ngày', value: (menuData?.breakfast?.length || 0) + (menuData?.lunch?.length || 0) + (menuData?.dinner?.length || 0), delta: '', icon: <NoonIcon />, color: '#f59e0b' },
              { label: 'Phòng ban đăng ký', value: deptStats.length, delta: '', icon: <DeptIcon />, color: '#6366f1' },
              { label: 'Chênh lệch', value: totalAct - totalReg, delta: '', icon: <ChartIcon />, color: totalAct - totalReg < 0 ? '#ef4444' : '#10b981' }
            ].map((stat, idx) => (
              <Grid item xs={2.4} key={idx}>
                <Paper className="metric-card">
                  <Box className="metric-icon-box" sx={{ bgcolor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{stat.value}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>{stat.label}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Meal Sections */}
          <Box className="meal-sections-container">
            {['breakfast', 'lunch', 'dinner'].map(slot => {
              const mealsInSlot = menuData?.[slot] || [];
              const slotReg = getRegQtyForSlot(slot);
              const slotAct = getActualQtyForSlot(slot);
              const slotVar = slotAct - slotReg;

              return (
                <Box key={slot} className="meal-card">
                  <Box className="meal-header">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: `${getMealColor(slot)}15`, color: getMealColor(slot), width: 40, height: 40 }}>
                        {getMealIcon(slot)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{getMealLabel(slot)}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {slot === 'breakfast' ? '06:00 - 08:00' : slot === 'lunch' ? '11:00 - 13:00' : '17:00 - 19:00'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={4}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 800, color: '#3b82f6', fontSize: 18 }}>{slotReg}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Đăng ký</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 800, color: '#10b981', fontSize: 18 }}>{slotAct}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Thực tế</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 800, color: slotVar < 0 ? '#ef4444' : '#64748b', fontSize: 18 }}>{slotVar}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Chênh lệch</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {(mealsInSlot.length > 0) ? mealsInSlot.map((item, mIdx) => {
                    const itemActual = item.actual_quantity || 0;
                    const itemReg = item.registered_quantity || summary?.dish_registrations?.[item.menu_item_id] || 0;
                    const itemVar = itemActual - itemReg;

                    return (
                      <Box key={mIdx} className="dish-row">
                        <Box className="dish-icon-box" sx={{ bgcolor: `${getMealColor(slot)}` }}>
                          <DishIcon />
                        </Box>
                        <Box className="dish-info">
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{item.name || 'Món chính'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ChartIcon sx={{ fontSize: 12 }} /> MA-00{item.id || mIdx + 1} • {item.supplierName || 'Chưa chọn NCC'}
                          </Typography>
                        </Box>
                        <Box className="dish-stats">
                          <Box className="stat-item">
                            <span className="stat-value" style={{ color: '#3b82f6' }}>{itemReg}</span>
                            <span className="stat-label">Đăng ký</span>
                          </Box>
                          <Box className="stat-item">
                            <span className="stat-value" style={{ color: '#10b981' }}>{itemActual}</span>
                            <span className="stat-label">Thực tế</span>
                          </Box>
                          <Box className="stat-item">
                            <span className="stat-value" style={{ color: itemVar < 0 ? '#ef4444' : '#64748b' }}>
                              {itemVar}
                            </span>
                            <span className="stat-label">Chênh lệch</span>
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            sx={{ color: '#f59e0b', bgcolor: '#fffbeb' }}
                            onClick={() => handleOpenEditQty(slot, mIdx, item)}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}
                            onClick={() => handleDeleteDish(slot, mIdx)}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  }) : (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                      <Typography variant="body2">Chưa có món ăn nào cho bữa này</Typography>
                    </Box>
                  )}

                  <Box className="add-dish-btn" onClick={() => handleOpenAddDish(slot)}>
                    <AddIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>Thêm món vào {getMealLabel(slot).toLowerCase()}</Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Right Sidebar */}
        <Box className="sidebar-container">
          {/* Day Summary */}
          <Paper className="sidebar-card">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon color="primary" sx={{ fontSize: 18 }} /> Tổng kết ngày
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
              Thống kê đăng ký và sử dụng suất ăn
            </Typography>

            <Stack spacing={2.5}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight={600}>Tổng đăng ký</Typography>
                  <Typography variant="caption" fontWeight={700}>{totalReg} suất</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }} />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight={600}>Thực tế sử dụng</Typography>
                  <Typography variant="caption" fontWeight={700}>{totalAct} suất</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(100, usageRate)} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight={600}>Chênh lệch</Typography>
                  <Typography variant="caption" fontWeight={700} color={totalAct - totalReg < 0 ? "error" : "primary"}>
                    {totalAct - totalReg} suất
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(100, Math.abs((totalAct - totalReg) / (totalReg || 1) * 100))} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: totalAct - totalReg < 0 ? '#ef4444' : '#3b82f6' } }} />
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Tỷ lệ sử dụng</Typography>
                <Typography variant="caption" fontWeight={700}>{usageRate.toFixed(1)}%</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Hiệu suất sử dụng</Typography>
                <Typography variant="caption" fontWeight={700} color="success.main">{efficiency.toFixed(1)}%</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Tỷ lệ lãng phí</Typography>
                <Typography variant="caption" fontWeight={700} color="error.main">{wasteRate.toFixed(1)}%</Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* Department Breakdown */}
          <Paper className="sidebar-card">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Đăng ký theo Phòng ban</Typography>
            <Stack spacing={1} sx={{ mt: 2, maxHeight: 300, overflowY: 'auto', pr: 1 }}>
              {deptStats.length > 0 ? deptStats.map((dept, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
                  <Avatar sx={{ bgcolor: getDeptColor(i, dept.name), width: 24, height: 24, fontSize: 10, fontWeight: 700 }}>
                    {getShortName(dept.name)}
                  </Avatar>
                  <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>{dept.name}</Typography>
                  <Typography variant="caption" fontWeight={700}>{dept.count}</Typography>
                </Stack>
              )) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Chưa có dữ liệu đăng ký</Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Chart */}
          <Paper className="sidebar-card" sx={{ flex: 1, minHeight: 250 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>So sánh theo bữa</Typography>
            <Box sx={{ width: '100%', height: 180, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <ChartTooltip />
                  <Bar dataKey="reg" name="Đăng ký" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar dataKey="actual" name="Thực tế" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#3b82f6', borderRadius: '50%' }} />
                <Typography variant="caption" fontSize={9}>Đăng ký</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%' }} />
                <Typography variant="caption" fontSize={9}>Thực tế</Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* Notes */}
          <Paper className="sidebar-card">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon sx={{ fontSize: 16 }} /> Ghi chú
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Nhập ghi chú cho ngày này..."
              variant="standard"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              InputProps={{ disableUnderline: true, style: { fontSize: 12 } }}
              sx={{ bgcolor: '#fffbeb', p: 1, borderRadius: 1 }}
            />
          </Paper>
        </Box>
      </Box>
      {/* Dish Selection Dialog */}
      <Dialog
        open={isAddDishOpen}
        onClose={() => setIsAddDishOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          className: 'standard-font',
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: '#3b82f6', color: '#fff', borderRadius: '50%', p: 0.5, display: 'flex' }}>
                <AddIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Thêm món ăn vào {getMealLabel(activeSlot).toLowerCase()}
              </Typography>
            </Stack>
            <IconButton onClick={() => setIsAddDishOpen(false)} size="small" sx={{ bgcolor: '#f1f5f9' }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 1,
            maxHeight: '320px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '10px' }
          }}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight + 20) {
              handleLoadMoreDishes();
            }
          }}
        >
          <TextField
            fullWidth
            placeholder="Tìm kiếm món ăn..."
            value={dishSearch}
            onChange={handleSearchDishes}
            variant="outlined"
            size="small"
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <List sx={{ pt: 0 }}>
            {availableDishes.map((dish) => {
              const isSelected = selectedInDialog.includes(String(dish.id));
              return (
                <ListItem
                  key={dish.id}
                  disablePadding
                  sx={{ mb: 1.5 }}
                >
                  <ListItemButton
                    onClick={() => handleToggleDishInDialog(dish.id)}
                    sx={{
                      borderRadius: '16px',
                      border: `2px solid ${isSelected ? '#10b981' : '#f1f5f9'}`,
                      bgcolor: isSelected ? '#f0fdf4' : '#fff',
                      transition: 'all 0.2s',
                      p: 2,
                      '&:hover': {
                        bgcolor: isSelected ? '#f0fdf4' : '#f8fafc',
                        borderColor: isSelected ? '#10b981' : '#e2e8f0',
                      }
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>
                        {dish.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        MA-{String(dish.id).padStart(3, '0')} • {dish.category === 'com' ? 'Cơm' : dish.category === 'bun_pho' ? 'Bún - Phở' : 'Khác'}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontWeight: 800, color: '#10b981', mr: 2 }}>
                      {Number(dish.price).toLocaleString('vi-VN')}đ
                    </Typography>

                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                        bgcolor: isSelected ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSelected && <SuccessIcon sx={{ color: '#fff', fontSize: 16 }} />}
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}

            {isFetchingDishes && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!hasMoreDishes && availableDishes.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#94a3b8', py: 2 }}>
                Đã hiển thị tất cả món ăn
              </Typography>
            )}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setIsAddDishOpen(false)}
            fullWidth
            sx={{
              borderRadius: '12px',
              color: '#64748b',
              bgcolor: '#fff',
              border: '1px solid #e2e8f0',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.2
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handleConfirmAddDishes}
            sx={{
              borderRadius: '12px',
              bgcolor: '#10b981',
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.2,
              '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
            }}
          >
            + Thêm món đã chọn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Quantity Dialog */}
      <Dialog
        open={isEditQtyOpen}
        onClose={() => setIsEditQtyOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: 'standard-font',
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Cập nhật suất thực tế
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Món: {editingTarget?.item?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: '#475569' }}>
              Số lượng suất ăn thực tế
            </Typography>
            <TextField
              fullWidth
              type="number"
              autoFocus
              value={editQtyValue}
              onChange={(e) => {
                const val = e.target.value;
                // Only allow positive integers (remove any non-digits, though type=number helps)
                if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0)) {
                  setEditQtyValue(val);
                }
              }}
              onKeyDown={(e) => {
                // Prevent 'e', '.', '-', '+' from being entered
                if (['e', 'E', '.', '-', '+'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="Nhập số lượng..."
              inputProps={{
                min: 0,
                step: 1
              }}
              InputProps={{
                sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setIsEditQtyOpen(false)}
            sx={{
              borderRadius: '10px',
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 700
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmEditQty}
            sx={{
              borderRadius: '10px',
              bgcolor: '#f59e0b',
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#d97706', boxShadow: 'none' }
            }}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{
          className: 'inter-font',
          sx: { borderRadius: '20px', p: 1, maxWidth: '400px' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', p: 1, borderRadius: '12px', display: 'flex' }}>
            {confirmDialog.type === 'print' ? <PrintIcon fontSize="small" /> : <ExportIcon fontSize="small" />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{confirmDialog.title}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.6 }}>
            {confirmDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#6b7280' }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmAction}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, boxShadow: 'none' }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add missing icon
const ApartmentIcon = () => <DeptIcon />;

export default DailyMenuSetup;
