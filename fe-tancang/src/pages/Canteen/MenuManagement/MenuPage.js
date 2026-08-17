import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Save,
  Upload,
  Eye,
  LayoutTemplate,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import MealSlotDetail from '../../../components/Canteen/Menu/MealSlotDetail';
import apiClient from '../../../services/api-client';
import { canteenService } from '../../../services/canteenService';

dayjs.locale('vi');

const getStatusMeta = (day) => {
  if (!day || !Array.isArray(day.slots)) {
    return { label: 'Chưa có menu', color: '#ef4444', bg: '#fee2e2', icon: '✗' };
  }

  const filledSlots = day.slots.filter((s) => s.title_manual || (Array.isArray(s.items) && s.items.length > 0)).length;

  if ((day.day_label === 'Thứ Bảy' || day.day_label === 'Chủ Nhật') && filledSlots === 0) {
    return { label: 'Nghỉ', color: '#64748b', bg: '#f1f5f9', icon: '-' };
  }

  if (filledSlots === day.slots.length && day.slots.length > 0) {
    return { label: 'Đã thiết lập', color: '#16a34a', bg: '#dcfce7', icon: '✓' };
  }

  if (filledSlots > 0) {
    return { label: 'Chưa hoàn tất', color: '#ca8a04', bg: '#fef9c3', icon: '⚠' };
  }

  return { label: 'Chưa có menu', color: '#ef4444', bg: '#fee2e2', icon: '✗' };
};

const normalizeSlots = (slots = []) => {
  if (!Array.isArray(slots)) {
    return [];
  }

  return slots.map((slot) => ({
    ...slot,
    enabled: slot.enabled !== false,
  }));
};

const getDefaultServingTime = (mealSlot) => {
  if (mealSlot === 'breakfast') return '06:30 - 08:00';
  if (mealSlot === 'lunch') return '11:00 - 13:00';
  if (mealSlot === 'dinner') return '17:30 - 19:00';
  return '';
};

const defaultDishNameBySlot = (mealSlot) => {
  if (mealSlot === 'breakfast') return 'Ăn sáng';
  if (mealSlot === 'lunch') return 'Ăn trưa';
  if (mealSlot === 'dinner') return 'Ăn tối';
  return 'Bữa ăn';
};

const getDefaultPriceBySlot = (mealSlot) => {
  if (mealSlot === 'breakfast') return 25000;
  if (mealSlot === 'lunch') return 25000;
  if (mealSlot === 'dinner') return 35000;
  return 25000;
};

const MenuPage = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
  );
  const [loading, setLoading] = useState(false);
  const [menuData, setMenuData] = useState({ days: [], week_label: '' });
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sessionIdBySlot, setSessionIdBySlot] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const slotToSessionId = useCallback(
    (mealSlot) => {
      if (!mealSlot) return null;
      return sessionIdBySlot[mealSlot] || null;
    },
    [sessionIdBySlot],
  );

  const fetchMealSessions = useCallback(async () => {
    try {
      const res = await canteenService.getSessions();
      const sessions = res?.data || [];
      const nextMap = { breakfast: null, lunch: null, dinner: null };

      for (const s of sessions) {
        const name = String(s?.name || '').toLowerCase();
        if (!nextMap.breakfast && (name.includes('sáng') || name.includes('breakfast'))) {
          nextMap.breakfast = Number(s.id);
        } else if (!nextMap.lunch && (name.includes('trưa') || name.includes('lunch'))) {
          nextMap.lunch = Number(s.id);
        } else if (!nextMap.dinner && (name.includes('tối') || name.includes('dinner'))) {
          nextMap.dinner = Number(s.id);
        }
      }

      // fallback theo sortOrder nếu tên không chuẩn
      if ((!nextMap.breakfast || !nextMap.lunch || !nextMap.dinner) && sessions.length >= 3) {
        const sorted = [...sessions].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        if (!nextMap.breakfast) nextMap.breakfast = Number(sorted[0]?.id || null);
        if (!nextMap.lunch) nextMap.lunch = Number(sorted[1]?.id || null);
        if (!nextMap.dinner) nextMap.dinner = Number(sorted[2]?.id || null);
      }

      setSessionIdBySlot(nextMap);
    } catch (err) {
      console.error('Failed to load meal sessions:', err);
    }
  }, []);

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/menus/week?week_start=${currentWeekStart}`);
      if (res?.success) {
        const incomingDays = Array.isArray(res.data?.days) ? res.data.days : [];
        setMenuData({
          week_label: res.data?.week_label || '',
          days: incomingDays.map((day) => ({
            ...day,
            slots: normalizeSlots(day.slots).map((slot) => ({
              ...slot,
              serving_time: slot.serving_time || getDefaultServingTime(slot.meal_slot),
            })),
          })),
        });
        setSelectedDayIndex((prev) => Math.min(prev, Math.max(0, incomingDays.length - 1)));
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu thực đơn tuần.');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  useEffect(() => {
    fetchMealSessions();
  }, [fetchMealSessions]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => dayjs(prev).subtract(1, 'week').format('YYYY-MM-DD'));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => dayjs(prev).add(1, 'week').format('YYYY-MM-DD'));
  };

  const handleUpdateMealField = (dayIdx, slotIdx, field, value) => {
    setMenuData((prev) => {
      const next = { ...prev, days: [...(prev.days || [])] };
      if (!next.days[dayIdx]) {
        return prev;
      }
      next.days[dayIdx] = {
        ...next.days[dayIdx],
        slots: [...(next.days[dayIdx].slots || [])],
      };
      if (!next.days[dayIdx].slots[slotIdx]) {
        return prev;
      }
      next.days[dayIdx].slots[slotIdx] = {
        ...next.days[dayIdx].slots[slotIdx],
        [field]: value,
      };
      return next;
    });
  };

  const handleSaveMenu = async () => {
    setLoading(true);
    try {
      const activeDay = menuData.days[selectedDayIndex];
      if (!activeDay || !Array.isArray(activeDay.slots)) {
        toast.warning('Không có dữ liệu bữa ăn để lưu.');
        return;
      }

      const menus = activeDay.slots.map((slot) => ({
        menu_date: activeDay.date,
        meal_slot: slot.meal_slot,
        supplier_id: slot.supplier_id,
        register_deadline_at:
          slot.register_deadline_at || dayjs(activeDay.date).subtract(1, 'day').hour(16).minute(0).second(0).toISOString(),
        cancel_deadline_at: slot.cancel_deadline_at || dayjs(activeDay.date).hour(10).minute(0).second(0).toISOString(),
        note: slot.note || '',
        serving_time: slot.serving_time || getDefaultServingTime(slot.meal_slot),
        image_url_manual: slot.image_url_manual || '',
        description_manual: slot.description_manual || '',
        title_manual: slot.title_manual || '',
        price_total_planned: Number(slot.price_total_planned) || 0,
        items: Array.isArray(slot.items) ? slot.items : [],
      }));

      await apiClient.post('/menus/day', {
        date: activeDay.date,
        menus,
      });

      // Đồng bộ sang module canteen mới để lịch /canteen/calendar hiển thị đúng dữ liệu
      try {
        const existingRes = await canteenService.getMenus({ date: activeDay.date });
        const existingBySession = new Map(
          (existingRes?.data || []).map((m) => [Number(m.mealSessionId), m]),
        );

        if (!sessionIdBySlot.breakfast && !sessionIdBySlot.lunch && !sessionIdBySlot.dinner) {
          throw new Error('Meal sessions are not mapped');
        }

        for (const slot of activeDay.slots) {
          const mealSessionId = slotToSessionId(slot.meal_slot);
          if (!mealSessionId) continue;

          const normalizedPrice = Number(slot.price_total_planned || 0) > 0
            ? Number(slot.price_total_planned)
            : getDefaultPriceBySlot(slot.meal_slot);

          const payload = {
            date: activeDay.date,
            meal_session_id: mealSessionId,
            dish_name: (slot.title_manual || defaultDishNameBySlot(slot.meal_slot)).trim(),
            description: (slot.description_manual || '').trim() || null,
            price: normalizedPrice,
            serving_time: slot.serving_time || getDefaultServingTime(slot.meal_slot),
            photo_url: slot.image_url_manual || null,
            is_active: slot.enabled !== false,
          };

          const existing = existingBySession.get(mealSessionId);
          if (existing?.id) {
            await canteenService.updateMenu(existing.id, payload);
          } else {
            await canteenService.createMenu(payload);
          }
        }
      } catch (syncErr) {
        console.error('Canteen calendar sync failed:', syncErr);
        toast.warning('Menu đã lưu, nhưng đồng bộ lịch đăng ký ăn ca chưa thành công.');
      }

      toast.success('Đã lưu thực đơn thành công.');
      fetchMenuData();
    } catch (error) {
      toast.error('Lỗi khi lưu thực đơn.');
    } finally {
      setLoading(false);
    }
  };

  const activeDay = useMemo(() => {
    const selected = menuData.days?.[selectedDayIndex];
    if (!selected) {
      return { slots: [], day_label: '', date: '' };
    }
    return { ...selected, slots: normalizeSlots(selected.slots) };
  }, [menuData.days, selectedDayIndex]);

  const weekBadge = useMemo(() => {
    const start = dayjs(currentWeekStart);
    const end = start.add(6, 'day');
    return `Tuần ${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`;
  }, [currentWeekStart]);

  return (
    <Box sx={{ bgcolor: '#eef2f7', minHeight: '100vh', pb: 6 }}>
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ bgcolor: 'linear-gradient(90deg, #1e3a8a, #2563eb)' }}>
        <Box
          sx={{
            background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)',
            color: '#fff',
            px: 3,
            py: 2,
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Quản lý Menu hằng ngày
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.92 }}>
                Tân Cảng Sài Gòn - Quản lý Bếp ăn
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {weekBadge}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 3 }, pt: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }} spacing={2} mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={handlePrevWeek} size="small" sx={{ bgcolor: '#fff', border: '1px solid #dbe2ea' }}>
              <ChevronLeft size={18} />
            </IconButton>
            <Box sx={{ px: 2, py: 1, bgcolor: '#fff', borderRadius: 2, border: '1px solid #dbe2ea', minWidth: 230, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                {weekBadge}
              </Typography>
            </Box>
            <IconButton onClick={handleNextWeek} size="small" sx={{ bgcolor: '#fff', border: '1px solid #dbe2ea' }}>
              <ChevronRight size={18} />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<LayoutTemplate size={16} />} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Sử dụng Template
            </Button>
            <Button variant="outlined" startIcon={<Save size={16} />} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Lưu làm Template
            </Button>
            <Button variant="contained" startIcon={<Copy size={16} />} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Sao chép từ ngày khác
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(7, minmax(0, 1fr))' },
            gap: 1.2,
            mb: 2.5,
          }}
        >
          {(menuData.days || []).map((day, i) => {
            const status = getStatusMeta(day);
            const isSelected = i === selectedDayIndex;
            return (
              <Box
                key={day.date || i}
                onClick={() => setSelectedDayIndex(i)}
                sx={{
                  p: 1.3,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: '#fff',
                  border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 10px 16px rgba(37,99,235,0.12)' : 'none',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                  {day.day_label}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.4}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                    {dayjs(day.date).format('DD')}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    mt: 0.8,
                    px: 1,
                    py: 0.3,
                    borderRadius: 1,
                    bgcolor: status.bg,
                    color: status.color,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {status.icon} {status.label}
                </Box>
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#94a3b8' }}>
                  {(day.slots || []).filter((s) => s.title_manual).length} bữa
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: '1px solid #dbe2ea', boxShadow: '0 1px 8px rgba(15,23,42,0.05)' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ md: 'center' }} mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
              Thiết lập Menu - {activeDay.day_label}, {activeDay.date ? dayjs(activeDay.date).format('DD/MM/YYYY') : '--/--/----'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Eye size={16} />} onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Xem trước
              </Button>
              <Button variant="contained" color="success" startIcon={<Upload size={16} />} onClick={handleSaveMenu} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Lưu Menu
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {activeDay.slots.map((slot, sIdx) => (
              <MealSlotDetail
                key={`${slot.meal_slot || 'slot'}-${sIdx}`}
                mealData={slot}
                dayIndex={selectedDayIndex}
                slotIndex={sIdx}
                onUpdateField={(field, val) => handleUpdateMealField(selectedDayIndex, sIdx, field, val)}
              />
            ))}

            {activeDay.slots.length < 3 && (
              <Button
                variant="outlined"
                startIcon={<Plus size={18} />}
                onClick={() => {
                  const types = ['breakfast', 'lunch', 'dinner'];
                  const existingTypes = (activeDay.slots || []).map((s) => s.meal_slot);
                  const nextType = types.find((t) => !existingTypes.includes(t)) || 'other';

                  setMenuData((prev) => {
                    const next = { ...prev, days: [...(prev.days || [])] };
                    if (!next.days[selectedDayIndex]) {
                      return prev;
                    }
                    next.days[selectedDayIndex] = {
                      ...next.days[selectedDayIndex],
                      slots: [...(next.days[selectedDayIndex].slots || [])],
                    };
                    next.days[selectedDayIndex].slots.push({
                      meal_slot: nextType,
                      items: [],
                      status: 'draft',
                      enabled: true,
                    });
                    return next;
                  });
                }}
                sx={{
                  py: 1.1,
                  borderStyle: 'dashed',
                  borderWidth: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Thêm bữa ăn (Sáng, Trưa, Tối)
              </Button>
            )}
          </Stack>

          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#fefce8', border: '1px solid #fde68a', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: '#854d0e', fontWeight: 600 }}>
              Lưu ý: Menu sẽ hiển thị cho nhân viên sau khi lưu. Hãy kiểm tra kỹ thông tin trước khi lưu.
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Xem trước Menu (giao diện nhân viên)
          </Typography>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8fafc' }}>
          <Stack spacing={2}>
            {activeDay.slots.map((slot, idx) => (
              <Paper key={`${slot.meal_slot}-${idx}`} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {slot.title_manual || (slot.meal_slot === 'breakfast' ? 'Ăn sáng' : slot.meal_slot === 'lunch' ? 'Ăn trưa' : 'Ăn tối')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4 }}>
                  {slot.description_manual || 'Không có mô tả chi tiết'}
                </Typography>
                <Stack direction="row" spacing={2} mt={1}>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {(Number(slot.price_total_planned) || 0).toLocaleString('vi-VN')} VNĐ
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Giờ phục vụ: {slot.serving_time || 'N/A'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setPreviewOpen(false)} sx={{ textTransform: 'none' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuPage;
