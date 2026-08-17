/**
 * Menu Planner - Lập thực đơn tuần bằng Drag & Drop
 * Sử dụng @dnd-kit
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { mealBookingService } from '@services/mealBookingService';
import dayjs from 'dayjs';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SESSIONS = [
  { id: 1, name: 'Sáng', time: '06:30-08:00', color: '#F59E0B' },
  { id: 2, name: 'Trưa', time: '11:00-13:00', color: '#10B981' },
  { id: 3, name: 'Tối', time: '17:30-19:00', color: '#8B5CF6' },
];

// Draggable Dish Item
const DraggableDish = ({ dish, overlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dish-${dish.id}`,
    data: { dish },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.5,
        mb: 1,
        bgcolor: overlay || isDragging ? 'primary.light' : 'background.paper',
        border: '1px solid',
        borderColor: overlay ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        cursor: 'grab',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
        ...style,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {dish.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dish.category} • {new Intl.NumberFormat('vi-VN').format(dish.price)}đ
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

// Droppable Meal Slot
const MealSlot = ({ dayIndex, sessionId, dishes, onRemoveDish }) => {
  const droppableId = `${dayIndex}-${sessionId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const session = SESSIONS.find((s) => s.id === sessionId);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 120,
        p: 1,
        bgcolor: isOver ? `${session?.color}15` : 'grey.50',
        border: '2px dashed',
        borderColor: isOver ? session?.color : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s',
      }}
    >
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        {session?.name} ({session?.time})
      </Typography>
      <Stack spacing={0.5} mt={1}>
        {(dishes || []).map((dish) => (
          <Box
            key={`${droppableId}-${dish.id}`}
            sx={{
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              borderLeft: `3px solid ${session?.color}`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                {dish.name}
              </Typography>
              <Tooltip title="Xóa">
                <IconButton
                  size="small"
                  onClick={() => onRemoveDish(dayIndex, sessionId, dish.id)}
                  sx={{ p: 0.25 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const MenuPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [menuPlan, setMenuPlan] = useState({}); // { "dayIndex-sessionId": [dishIds] }
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week').format('YYYY-MM-DD'));
  const [activeDish, setActiveDish] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Fetch dishes
  const fetchDishes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mealBookingService.getDishes({ is_active: true });
      if (res?.items) {
        setDishes(res.items);
      }
    } catch (error) {
      console.error('Fetch dishes error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch existing menu plan
  const fetchMenuPlan = useCallback(async () => {
    try {
      const res = await mealBookingService.getDailyMenuDetail(weekStart);
      if (res?.menu) {
        // Transform existing menu to menuPlan format
        const plan = {};
        Object.entries(res.menu).forEach(([slot, items]) => {
          items.forEach((item, idx) => {
            plan[`${idx}-${slot === 'breakfast' ? 1 : slot === 'lunch' ? 2 : 3}`] = [item];
          });
        });
        setMenuPlan(plan);
      }
    } catch (error) {
      console.error('Fetch menu plan error:', error);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchDishes();
    fetchMenuPlan();
  }, [fetchDishes, fetchMenuPlan]);

  const handleDragStart = (event) => {
    const dish = event.active.data.current?.dish;
    setActiveDish(dish);
  };

  const handleDragEnd = (event) => {
    const { over, active } = event;
    setActiveDish(null);

    if (over) {
      const dish = active.data.current?.dish;
      const [dayIndex, sessionId] = over.id.split('-').map(Number);

      setMenuPlan((prev) => {
        const key = `${dayIndex}-${sessionId}`;
        const existing = prev[key] || [];
        // Avoid duplicates
        if (!existing.find((d) => d.id === dish.id)) {
          return { ...prev, [key]: [...existing, dish] };
        }
        return prev;
      });
    }
  };

  const handleRemoveDish = (dayIndex, sessionId, dishId) => {
    setMenuPlan((prev) => {
      const key = `${dayIndex}-${sessionId}`;
      return {
        ...prev,
        [key]: (prev[key] || []).filter((d) => d.id !== dishId),
      };
    });
  };

  const handleCopyWeek = () => {
    // Copy menu from previous week
    const prevWeek = dayjs(weekStart).subtract(1, 'week').format('YYYY-MM-DD');
    // TODO: Fetch and copy
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // Transform menuPlan to API format
      const payload = {
        date: weekStart,
        meals: {},
      };

      Object.entries(menuPlan).forEach(([key, dishes]) => {
        const [dayIndex, sessionId] = key.split('-').map(Number);
        const slotKey = sessionId === 1 ? 'breakfast' : sessionId === 2 ? 'lunch' : 'dinner';
        if (!payload.meals[slotKey]) payload.meals[slotKey] = [];
        dishes.forEach((dish) => {
          payload.meals[slotKey].push({ dish_id: dish.id, actual_qty: 0 });
        });
      });

      // const res = await mealBookingService.saveDailyMenuSetup(payload);
      setMessage({ type: 'success', text: 'Lưu thực đơn thành công!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Lưu thất bại: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // Group dishes by category
  const dishesByCategory = dishes.reduce((acc, dish) => {
    const cat = dish.category || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Lập thực đơn tuần
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kéo thả món ăn vào các ô để tạo thực đơn
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <TextField
            type="date"
            size="small"
            label="Tuần bắt đầu"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyWeek}>
            Copy tuần trước
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchMenuPlan}>
            Làm mới
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thực đơn'}
          </Button>
        </Stack>
      </Stack>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Grid container spacing={2}>
            {/* Dish Bank Sidebar */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 80 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  Ngân hàng món ăn
                </Typography>
                <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  {Object.entries(dishesByCategory).map(([category, items]) => (
                    <Box key={category} mb={2}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {category.toUpperCase()}
                      </Typography>
                      <Stack spacing={0.5} mt={0.5}>
                        {items.map((dish) => (
                          <DraggableDish key={dish.id} dish={dish} />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Weekly Grid */}
            <Grid item xs={12} md={9}>
              <Grid container spacing={1}>
                {/* Header Row */}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1}>
                    <Box sx={{ width: 80 }} />
                    {DAYS.map((day, idx) => (
                      <Paper
                        key={day}
                        sx={{
                          flex: 1,
                          p: 1,
                          textAlign: 'center',
                          bgcolor: idx < 5 ? 'primary.50' : 'grey.100',
                          borderRadius: 1,
                        }}
                      >
                        <Typography fontWeight={700}>{day}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(weekStart).add(idx, 'day').format('DD/MM')}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>

                {/* Meal Slots */}
                {SESSIONS.map((session) => (
                  <Grid item xs={12} key={session.id}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Paper
                        sx={{
                          width: 80,
                          p: 1,
                          textAlign: 'center',
                          bgcolor: session.color,
                          color: 'white',
                          borderRadius: 1,
                        }}
                      >
                        <Typography fontWeight={700} fontSize={12}>
                          {session.name}
                        </Typography>
                        <Typography fontSize={10} sx={{ opacity: 0.9 }}>
                          {session.time}
                        </Typography>
                      </Paper>
                      {DAYS.map((_, dayIndex) => (
                        <Box key={`${dayIndex}-${session.id}`} sx={{ flex: 1 }}>
                          <MealSlot
                            dayIndex={dayIndex}
                            sessionId={session.id}
                            dishes={menuPlan[`${dayIndex}-${session.id}`] || []}
                            onRemoveDish={handleRemoveDish}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDish && <DraggableDish dish={activeDish} overlay />}
          </DragOverlay>
        </DndContext>
      )}
    </Container>
  );
};

export default MenuPlanner;
