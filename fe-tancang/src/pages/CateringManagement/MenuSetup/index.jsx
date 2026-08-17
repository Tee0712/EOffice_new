import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Card,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Radio,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Home as HomeIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  AssignmentTurnedIn as ApplyIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Restaurant as DishIcon,
  Store as SupplierIcon,
  AccountBalanceWallet as CostIcon,
  Equalizer as StatsIcon,
  WbSunnyOutlined as BreakfastIcon,
  LightModeOutlined as LunchIcon,
  BedtimeOutlined as DinnerIcon,
  DragIndicator as DragIcon,
  AddOutlined as AddIcon,
  ArrowBack as BackIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Assignment as AssignmentIcon,
  WbSunny as SunIcon,
  Brightness2 as MoonIcon,
  MonetizationOn as PriceIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { useToast } from "../../../components/common/ToastProvider";
import axios from "axios";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekOfYear from "dayjs/plugin/weekOfYear";
import "dayjs/locale/vi";
import "./MenuSetup.css";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";

dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);
dayjs.locale("vi");

// --- Helper Components ---

const DraggableDish = ({ dish }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draggable-${dish.id}`,
      data: { dish },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const getDishCategoryClass = (cat) => {
    const c = cat?.toLowerCase();
    if (c === "com" || c === "rice") return "rice";
    if (c === "bun_pho" || c === "noodle") return "noodle";
    if (c === "canh" || c === "soup") return "soup";
    return "other";
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`dish-item ${isDragging ? "dragging" : ""}`}
    >
      <Box className="dish-item-header">
        <Box className={`dish-icon ${getDishCategoryClass(dish.category)}`}>
          <DishIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box className="dish-info">
          <Typography
            variant="subtitle2"
            component="h4"
            noWrap
            title={dish.name}
          >
            {dish.name}
          </Typography>
          <Typography variant="caption" component="span">
            {dish.code || `MA-${dish.id?.toString().padStart(3, "0")}`}
          </Typography>
        </Box>
      </Box>
      <Box className="dish-item-footer">
        <Typography className="dish-price">
          {dish.price?.toLocaleString()}đ
        </Typography>
        <Typography className="dish-supplier">
          {dish.supplierName || "NCC"}
        </Typography>
      </Box>
    </Card>
  );
};

const MealSlot = ({ day, mealKey, dishes, onRemove, isLocked }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${day.format("YYYY-MM-DD")}-${mealKey}`,
    data: { date: day.format("YYYY-MM-DD"), mealKey },
    disabled: isLocked,
  });

  const getDishCategoryClass = (cat) => {
    const c = cat?.toLowerCase();
    if (c === "com" || c === "rice") return "rice";
    if (c === "bun_pho" || c === "noodle") return "noodle";
    if (c === "canh" || c === "soup") return "soup";
    return "other";
  };

  return (
    <Box
      ref={setNodeRef}
      className={`meal-slot ${isOver ? "over" : ""} ${dishes.length === 0 ? "empty" : ""}`}
    >
      {dishes.length > 0 ? (
        <Stack spacing={1} sx={{ width: "100%" }}>
          {dishes.map((dish, idx) => (
            <Box
              key={`${dish.id}-${idx}`}
              className={`dish-tile ${getDishCategoryClass(dish.category)}`}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: "13px",
                  color: "#0f172a",
                  mb: 0.5,
                  width: "100%",
                  lineHeight: 1.3,
                }}
                noWrap
                title={dish.name}
              >
                {dish.name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}
                  noWrap
                >
                  {dish.supplierName || dish.supplier || "NCC"}
                </Typography>
                <Typography
                  className="dish-tile-price"
                  sx={{ fontSize: "13px !important" }}
                >
                  {dish.price?.toLocaleString()}đ
                </Typography>
              </Box>
              <IconButton
                className="delete-btn"
                size="small"
                disabled={isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked)
                    onRemove(day.format("YYYY-MM-DD"), mealKey, idx);
                }}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  p: 0.2,
                  bgcolor: "rgba(255,255,255,0.9)",
                  opacity: 0,
                  visibility: "hidden",
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: "#fee2e2", color: "#ef4444" },
                }}
              >
                <DeleteIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
          <Box className="add-hint-btn">
            <AddIcon sx={{ fontSize: 14 }} /> Thêm món
          </Box>
        </Stack>
      ) : (
        <Box className="placeholder-empty">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AddIcon sx={{ fontSize: 20, color: "#bfbfbf" }} />
          </Box>
          <Typography variant="caption">
            {isLocked ? "Đã khóa" : "Kéo thả món ăn"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <Card
    sx={{
      p: 2.5,
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      gap: 2.5,
      border: "1px solid #f0f0f0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      flex: 1,
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRadius: "12px",
        bgcolor: color,
        color: "white",
        display: "flex",
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 24 } })}
    </Box>
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 900,
          color: "#001529",
          lineHeight: 1,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "#8c8c8c",
          fontWeight: 700,
          mt: 0.5,
          display: "block",
          textTransform: "uppercase",
          fontSize: "10px",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Typography>
    </Box>
  </Card>
);

// --- New Dialog Components ---

const CopyWeekDialog = ({ open, onClose, onConfirm, currentWeek }) => {
  const [selectedWeek, setSelectedWeek] = useState(
    currentWeek.subtract(1, "week").format("YYYY-MM-DD")
  );

  // Generate last 10 weeks
  const availableWeeks = Array.from({ length: 10 }, (_, i) => {
    const start = dayjs().startOf("week").subtract(i, "week");
    return {
      startDate: start.format("YYYY-MM-DD"),
      label: `Tuần ${start.format("ww/YYYY")}`,
      range: `${start.format("DD/MM")} - ${start.add(6, "day").format("DD/MM/YYYY")}`,
    };
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiPaper-root": { borderRadius: "20px" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: "#001529",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CopyIcon color="primary" /> Sao chép từ tuần khác
      </DialogTitle>
      <DialogContent dividers>
        <List sx={{ pt: 0 }}>
          {availableWeeks.map((week) => (
            <ListItem disablePadding key={week.startDate}>
              <ListItemButton
                onClick={() => setSelectedWeek(week.startDate)}
                sx={{
                  borderRadius: "12px",
                  mb: 1,
                  border: "1px solid",
                  borderColor:
                    selectedWeek === week.startDate ? "#1890ff" : "#f0f0f0",
                  bgcolor:
                    selectedWeek === week.startDate ? "#f0f5ff" : "transparent",
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Radio
                    edge="start"
                    checked={selectedWeek === week.startDate}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={week.label}
                  secondary={week.range}
                  primaryTypographyProps={{ fontWeight: 700, color: "#001529" }}
                  secondaryTypographyProps={{ fontSize: "11px" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, color: "#8c8c8c" }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(selectedWeek)}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
        >
          Sao chép
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ApplyTemplateDialog = ({ open, onClose, onConfirm, templates }) => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ "& .MuiPaper-root": { borderRadius: "20px" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: "#001529",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <ApplyIcon color="primary" /> Chọn mẫu thực đơn
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
        {templates.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "#bfbfbf" }}>
            Chưa có mẫu nào được sao chép. Hãy dùng "Sao chép tuần trước" để tạo
            mẫu.
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Static Placeholders */}
            {/* <Grid item xs={12}>
              <Card sx={{ p: 2, borderRadius: '16px', border: '2px solid transparent', bgcolor: '#fff', opacity: 0.6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f6ffed', color: '#52c41a' }}>
                    <ApplyIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: '#001529' }}>Mẫu tiêu chuẩn</Typography>
                    <Typography variant="caption" sx={{ color: '#8c8c8c' }}>Thực đơn cân bằng dinh dưỡng (Sắp ra mắt)</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 2, borderRadius: '16px', border: '2px solid transparent', bgcolor: '#fff', opacity: 0.6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#fff7e6', color: '#fa8c16' }}>
                    <StatsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: '#001529' }}>Mẫu đặc biệt - Tết</Typography>
                    <Typography variant="caption" sx={{ color: '#8c8c8c' }}>Thực đơn cho các dịp lễ Tết (Sắp ra mắt)</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid> */}

            {templates.map((tpl) => (
              <Grid item xs={12} key={tpl.id}>
                <Card
                  onClick={() => setSelectedId(tpl.id)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    borderRadius: "16px",
                    border: "2px solid",
                    borderColor:
                      selectedId === tpl.id ? "#1890ff" : "transparent",
                    boxShadow:
                      selectedId === tpl.id
                        ? "0 8px 20px rgba(24,144,255,0.15)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "#f0f5ff",
                        color: "#1890ff",
                      }}
                    >
                      <StatsIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: "#001529" }}>
                        {tpl.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#8c8c8c" }}>
                        {tpl.description}
                      </Typography>
                    </Box>
                    <Radio checked={selectedId === tpl.id} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, color: "#8c8c8c" }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          disabled={!selectedId}
          onClick={() => onConfirm(selectedId)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "10px",
            px: 4,
          }}
        >
          Áp dụng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Main Page ---

const MenuSetup = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: "2rem", fontWeight: 900 },
      h5: { fontSize: "1.5rem", fontWeight: 800 },
      h6: { fontSize: "1.15rem", fontWeight: 800 },
      subtitle1: { fontSize: "1rem", fontWeight: 700 },
      subtitle2: { fontSize: "0.9rem", fontWeight: 700 },
      body1: { fontSize: "0.95rem" },
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.78rem" },
      button: { fontSize: "0.9rem", fontWeight: 700, textTransform: "none" },
    },
    components: {
      MuiTypography: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            textTransform: "none",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontSize: "0.95rem",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
          },
        },
      },
    },
  });

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week")); // Start Monday (vi locale)
  const [dishesBank, setDishesBank] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Pagination for Dish Bank (Infinite Scroll)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Menu data: { 'YYYY-MM-DD': { breakfast: [], lunch: [], dinner: [] } }
  const [weeklyMenu, setWeeklyMenu] = useState({});
  const [activeDish, setActiveDish] = useState(null);

  // Template Management
  const [templateBank, setTemplateBank] = useState([]);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  // Logic to determine if editing is allowed
  const isLocked = useMemo(() => {
    return currentWeek.isSameOrBefore(dayjs(), "week");
  }, [currentWeek]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchDishes = useCallback(
    async (targetPage = 0, isReset = false) => {
      if (isReset) {
        setPage(0);
        setHasMore(true);
      }
      setIsFetchingMore(true);

      try {
        const token = localStorage.getItem("token_app");
        const response = await axios.get(`${APP_BASE}/api/v1/dishes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: targetPage,
            size: 20,
            keyword,
            category: activeCategory === "ALL" ? undefined : activeCategory,
          },
        });

        const newItems = response.data.items || [];
        setDishesBank((prev) => (isReset ? newItems : [...prev, ...newItems]));
        setHasMore(newItems.length === 20); // Standard page size is 20
      } catch (error) {
        console.error("Error fetching dishes:", error);
      } finally {
        setIsFetchingMore(false);
      }
    },
    [keyword, activeCategory]
  );

  const handleSidebarScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight + 50 &&
      hasMore &&
      !isFetchingMore
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDishes(nextPage);
    }
  };

  const fetchWeeklyMenu = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = currentWeek.format("YYYY-MM-DD");
      const token = localStorage.getItem("token_app");
      const response = await axios.get(`${APP_BASE}/api/v1/menus/weekly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate },
      });
      if (response.data && response.data.daysMenu) {
        setWeeklyMenu(response.data.daysMenu);
        return;
      }

      // Initialize empty menu for the week if not fetched
      const newMenu = {};
      for (let i = 0; i < 7; i++) {
        const date = currentWeek.add(i, "day").format("YYYY-MM-DD");
        newMenu[date] = { breakfast: [], lunch: [], dinner: [] };
      }
      setWeeklyMenu(newMenu);
    } catch (error) {
      console.error("Error fetching weekly menu:", error);
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchDishes(0, true);
  }, [keyword, activeCategory]); // Reload on search or category change

  useEffect(() => {
    fetchWeeklyMenu();
  }, [fetchWeeklyMenu]);

  // Statistics
  const stats = useMemo(() => {
    let totalMeals = 0;
    let totalCost = 0;
    const suppliers = new Set();

    Object.values(weeklyMenu).forEach((day) => {
      ["breakfast", "lunch", "dinner"].forEach((meal) => {
        (day[meal] || []).forEach((dish) => {
          totalMeals++;
          totalCost += dish.price || 0;
          if (dish.supplierName) suppliers.add(dish.supplierName);
        });
      });
    });

    return {
      totalMeals,
      totalCost,
      supplierCount: suppliers.size,
      avgPrice: totalMeals > 0 ? Math.round(totalCost / totalMeals) : 0,
    };
  }, [weeklyMenu]);

  const handleDragStart = (event) => {
    if (isLocked) return;
    const { active } = event;
    setActiveDish(active.data.current.dish);
  };

  const handleDragEnd = (event) => {
    setActiveDish(null);
    if (isLocked) return;
    const { active, over } = event;
    if (!over) return;

    const dish = active.data.current.dish;
    const { date, mealKey } = over.data.current;

    setWeeklyMenu((prev) => {
      const dayData = prev[date] || { breakfast: [], lunch: [], dinner: [] };
      const currentItems = dayData[mealKey] || [];

      // Check for duplicate dish in this slot
      const isDuplicate = currentItems.some(
        (item) => Number(item.id) === Number(dish.id)
      );
      if (isDuplicate) {
        showToast(`Món ${dish.name} đã có trong bữa này`, "error");
        return prev;
      }

      const newItems = [...currentItems, { ...dish }];
      showToast(`Đã thêm ${dish.name} vào thực đơn`, "success");

      return {
        ...prev,
        [date]: {
          ...dayData,
          [mealKey]: newItems,
        },
      };
    });
  };

  const removeDish = (date, mealKey, idx) => {
    const dishName = weeklyMenu[date]?.[mealKey]?.[idx]?.name || "món ăn";
    setWeeklyMenu((prev) => {
      const dayData = prev[date];
      const items = [...dayData[mealKey]];
      items.splice(idx, 1);
      return {
        ...prev,
        [date]: { ...dayData, [mealKey]: items },
      };
    });
    showToast(`Đã xóa ${dishName}`, "info");
  };

  const handleSaveMenu = async () => {
    setLoading(true);
    try {
      const payload = {
        startDate: currentWeek.format("YYYY-MM-DD"),
        days: Object.entries(weeklyMenu).map(([date, meals]) => ({
          date,
          meals: {
            breakfast: (meals.breakfast || []).map((d) => d.id),
            lunch: (meals.lunch || []).map((d) => d.id),
            dinner: (meals.dinner || []).map((d) => d.id),
          },
        })),
      };

      const token = localStorage.getItem("token_app");
      await axios.post(`${APP_BASE}/api/v1/menus`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Saving payload:", payload);
      showToast("Lưu thực đơn thành công", "success");
    } catch (error) {
      showToast("Lỗi khi lưu thực đơn", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishMenu = async () => {
    const isConfirm = window.confirm(
      "Bạn có chắc chắn muốn công bố thực đơn tuần này? Người dùng sẽ có thể đăng ký suất ăn ngay lập tức."
    );
    if (!isConfirm) return;

    setLoading(true);
    try {
      const payload = {
        week_start: currentWeek.format("YYYY-MM-DD"),
      };
      const token = localStorage.getItem("token_app");
      await axios.post(`${APP_BASE}/api/v1/menus/publish`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Công bố thực đơn thành công", "success");
    } catch (error) {
      showToast("Lỗi khi công bố thực đơn", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTemplates = async (startDate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token_app");
      const response = await axios.get(`${APP_BASE}/api/v1/menus/weekly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate },
      });

      if (response.data && response.data.daysMenu) {
        const weekLabel = dayjs(startDate).format("ww/YYYY");
        const newTemplate = {
          id: `tpl-${Date.now()}`,
          name: `Tuần ${weekLabel}`,
          description: `Mẫu sao chép từ thực đơn tuần ${weekLabel}`,
          data: response.data.daysMenu,
          sourceStartDate: startDate,
        };
        setTemplateBank((prev) => [newTemplate, ...prev]);

        // Also apply it to current week immediately
        const sourceData = response.data.daysMenu;
        const newMenu = {};
        const sourceStart = dayjs(startDate);

        for (let i = 0; i < 7; i++) {
          const sDate = sourceStart.add(i, "day").format("YYYY-MM-DD");
          const tDate = currentWeek.add(i, "day").format("YYYY-MM-DD");
          if (sourceData[sDate]) {
            newMenu[tDate] = { ...sourceData[sDate] };
          } else {
            newMenu[tDate] = { breakfast: [], lunch: [], dinner: [] };
          }
        }
        setWeeklyMenu(newMenu);

        showToast(`Đã sao chép thực đơn tuần ${weekLabel}`, "success");
        setIsCopyDialogOpen(false);
      } else {
        showToast("Không tìm thấy dữ liệu tuần này để làm mẫu.", "info");
      }
    } catch (error) {
      showToast("Lỗi khi lấy dữ liệu tuần làm mẫu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (templateId) => {
    const tpl = templateBank.find((t) => t.id === templateId);
    if (!tpl) return;

    const sourceData = tpl.data;
    const newMenu = {};
    const sourceStart = dayjs(tpl.sourceStartDate);

    // Map each of the 7 days from source to current week
    for (let i = 0; i < 7; i++) {
      const sDate = sourceStart.add(i, "day").format("YYYY-MM-DD");
      const tDate = currentWeek.add(i, "day").format("YYYY-MM-DD");
      if (sourceData[sDate]) {
        newMenu[tDate] = { ...sourceData[sDate] };
      } else {
        newMenu[tDate] = { breakfast: [], lunch: [], dinner: [] };
      }
    }

    setWeeklyMenu(newMenu);
    setIsApplyDialogOpen(false);
    showToast(`Đã áp dụng mẫu: ${tpl.name}`, "success");
  };

  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    currentWeek.add(i, "day")
  );

  return (
    <ThemeProvider theme={theme}>
      <Box className="menu-setup-page">
        {/* Sticky Top Header */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            py: 1.5,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)",
          }}
        >
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  onClick={() => navigate(-1)}
                  size="small"
                  sx={{
                    color: "#64748b",
                    bgcolor: "#f1f5f9",
                    "&:hover": { bgcolor: "#e2e8f0" },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                    fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  Thiết lập thực đơn
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  className="week-nav"
                  sx={{
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "10px",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() =>
                      setCurrentWeek((prev) => prev.subtract(1, "week"))
                    }
                    sx={{ border: "1px solid #e2e8f0" }}
                  >
                    <PrevIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ textAlign: "center", minWidth: 140 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#1e293b",
                        lineHeight: 1,
                        fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                        fontSize: "15px",
                      }}
                    >
                      Tuần {currentWeek.format("ww/YYYY")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 600,
                        fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      {currentWeek.format("DD/MM")} -{" "}
                      {currentWeek
                        .endOf("week")
                        .add(1, "day")
                        .format("DD/MM/YYYY")}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setCurrentWeek((prev) => prev.add(1, "week"))
                    }
                    sx={{ border: "1px solid #e2e8f0" }}
                  >
                    <NextIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => setIsCopyDialogOpen(true)}
                  disabled={isLocked}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    color: "#475569",
                    borderColor: "#e2e8f0",
                    px: 2,
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
                  }}
                >
                  Sao chép tuần trước
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setIsApplyDialogOpen(true)}
                  disabled={isLocked}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    color: "#475569",
                    borderColor: "#e2e8f0",
                    px: 2,
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
                  }}
                >
                  Áp dụng mẫu
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ApplyIcon />}
                  onClick={handlePublishMenu}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    px: 3,
                    bgcolor: "#3b82f6",
                    "&:hover": { bgcolor: "#2563eb" },
                    boxShadow: "0 4px 12px rgba(59,130,246,0.2)",
                  }}
                >
                  {loading ? "Đang xử lý..." : "Công bố"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveMenu}
                  disabled={loading || isLocked}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    px: 3,
                    bgcolor: "#10b981",
                    "&:hover": { bgcolor: "#059669" },
                    boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
                  }}
                >
                  {loading ? "Đang lưu..." : "Lưu thực đơn"}
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Content Area */}
        <Container
          maxWidth={false}
          sx={{
            px: { xs: 2, md: 4 },
            pt: 2,
            pb: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {isLocked && (
            <Box
              sx={{
                mb: 2,
                py: 1,
                px: 2,
                bgcolor: "#fff1f0",
                border: "1px solid #ffccc7",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box sx={{ color: "#ff4d4f", display: "flex" }}>
                <StatsIcon />
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "#cf1322", fontWeight: 600 }}
              >
                Thực đơn của tuần này ({currentWeek.format("DD/MM")} -{" "}
                {currentWeek.endOf("week").add(1, "day").format("DD/MM/YYYY")})
                đã bị khóa, không thể chỉnh sửa.
              </Typography>
            </Box>
          )}

          {/* Statistics Widgets */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <StatCard
                label="Bữa ăn đã lên"
                value={stats.totalMeals}
                icon={<DishIcon />}
                color="#3b82f6"
              />
            </Grid>
            <Grid item xs={3}>
              <StatCard
                label="Tổng chi phí"
                value={`${stats.totalCost.toLocaleString()}đ`}
                icon={<CostIcon />}
                color="#10b981"
              />
            </Grid>
            <Grid item xs={3}>
              <StatCard
                label="Nhà cung cấp"
                icon={<SupplierIcon />}
                value={stats.supplierCount}
                color="#f59e0b"
              />
            </Grid>
            <Grid item xs={3}>
              <StatCard
                label="Giá trung bình"
                value={`${stats.avgPrice.toLocaleString()}đ`}
                icon={<PriceIcon />}
                color="#8b5cf6"
              />
            </Grid>
          </Grid>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box className="planner-layout">
              {/* Sidebar: Dish Bank */}
              <Paper elevation={0} className="dish-bank-sidebar">
                <Box
                  sx={{
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DishIcon sx={{ color: "#fa8c16" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "#1a3353" }}
                    >
                      Ngân hàng món ăn
                    </Typography>
                  </Box>
                  <Tooltip title="Thêm món mới">
                    <IconButton
                      size="small"
                      onClick={() => navigate("/catering/dish-bank")}
                      sx={{
                        bgcolor: "#fff7e6",
                        color: "#fa8c16",
                        border: "1px solid #ffd591",
                        "&:hover": { bgcolor: "#ffe7ba" },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <TextField
                  placeholder="Tìm món ăn..."
                  fullWidth
                  size="small"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "100px",
                      bgcolor: "#f5f5f5",
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "#d9d9d9" },
                      "&.Mui-focused fieldset": { borderColor: "#1890ff" },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          fontSize="small"
                          sx={{ color: "#8c8c8c" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}
                >
                  {["ALL", "COM", "BUN_PHO", "CANH", "KHAC"].map((cat) => (
                    <Chip
                      key={cat}
                      label={
                        cat === "ALL"
                          ? "Tất cả"
                          : cat === "COM"
                            ? "Cơm"
                            : cat === "BUN_PHO"
                              ? "Bún/Phở"
                              : cat === "CANH"
                                ? "Canh"
                                : "Khác"
                      }
                      size="small"
                      clickable
                      color={activeCategory === cat ? "primary" : "default"}
                      onClick={() => setActiveCategory(cat)}
                      sx={{ fontWeight: activeCategory === cat ? 800 : 500 }}
                    />
                  ))}
                </Box>

                <Stack
                  spacing={0}
                  className="draggable-list"
                  onScroll={handleSidebarScroll}
                >
                  {[
                    { title: "MÓN CƠM", keys: ["com", "rice"] },
                    { title: "BÚN / PHỞ / MÌ", keys: ["bun_pho", "noodle"] },
                    { title: "MÓN CANH", keys: ["canh", "soup"] },
                    { title: "KHÁC", keys: [], isOther: true },
                  ].map((group, gIdx) => {
                    const filteredDishes = dishesBank.filter((d) => {
                      const cat = d.category?.toLowerCase();
                      if (group.isOther) {
                        return ![
                          "com",
                          "rice",
                          "bun_pho",
                          "noodle",
                          "canh",
                          "soup",
                        ].includes(cat);
                      }
                      return group.keys.includes(cat);
                    });

                    if (filteredDishes.length === 0) return null;

                    return (
                      <Box key={gIdx} className="dish-category">
                        <Typography className="dish-category-title">
                          {group.title}
                        </Typography>
                        {filteredDishes.map((dish) => (
                          <DraggableDish key={dish.id} dish={dish} />
                        ))}
                      </Box>
                    );
                  })}

                  {isFetchingMore && (
                    <Box sx={{ py: 2, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: "#8c8c8c" }}>
                        Đang tải thêm...
                      </Typography>
                    </Box>
                  )}

                  {!hasMore && dishesBank.length > 0 && (
                    <Box sx={{ py: 2, textAlign: "center", opacity: 0.6 }}>
                      <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
                        Đã tải hết danh sách
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Main Grid: Weekly Planner */}
              <Box
                className="weekly-planner-grid"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  bgcolor: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                <Box
                  className="grid-header"
                  sx={{
                    bgcolor: "#1e293b",
                    py: 2,
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: "12.5%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#fff",
                        fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                        fontSize: "14px",
                      }}
                    >
                      Bữa ăn
                    </Typography>
                  </Box>
                  {daysOfWeek.map((day, idx) => {
                    const dayLabels = {
                      0: "CN",
                      1: "Thứ 2",
                      2: "Thứ 3",
                      3: "Thứ 4",
                      4: "Thứ 5",
                      5: "Thứ 6",
                      6: "Thứ 7",
                    };
                    return (
                      <Box
                        key={idx}
                        sx={{
                          width: "12.5%",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <Box sx={{ position: "absolute", top: 4, right: 4 }}>
                          <Tooltip title="Xem chi tiết ngày">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#a5b4fc",
                                "&:hover": {
                                  color: "#fff",
                                  bgcolor: "rgba(255,255,255,0.1)",
                                },
                              }}
                              onClick={() =>
                                navigate(
                                  `/catering/daily-menu-setup?date=${day.format("YYYY-MM-DD")}`
                                )
                              }
                            >
                              <DashboardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "#a5b4fc",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                          }}
                        >
                          {dayLabels[day.day()]}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: "22px",
                            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                          }}
                        >
                          {day.format("DD")}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Rows: Breakfast, Lunch, Dinner */}
                {[
                  {
                    key: "breakfast",
                    label: "Bữa sáng",
                    time: "06:00 - 08:30",
                    icon: <BreakfastIcon style={{ fontSize: 24 }} />,
                    color: "#fa8c16",
                  },
                  {
                    key: "lunch",
                    label: "Bữa trưa",
                    time: "11:00 - 13:00",
                    icon: <LunchIcon style={{ fontSize: 24 }} />,
                    color: "#ef4444",
                  },
                  {
                    key: "dinner",
                    label: "Bữa tối",
                    time: "17:00 - 19:00",
                    icon: <DinnerIcon style={{ fontSize: 24 }} />,
                    color: "#6366f1",
                  },
                ].map((meal) => (
                  <Box
                    key={meal.key}
                    sx={{
                      flex: 1,
                      display: "flex",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Box
                      className="meal-type-col"
                      sx={{
                        width: "12.5%",
                        borderRight: "1px solid #f0f0f0",
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box sx={{ textAlign: "center" }}>
                        <Box
                          sx={{
                            color: meal.color,
                            mb: 1,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {meal.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: "#001529",
                            display: "block",
                            fontSize: "14px",
                            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                          }}
                        >
                          {meal.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#8c8c8c",
                            fontSize: "12px",
                            fontWeight: 500,
                            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
                          }}
                        >
                          {meal.time}
                        </Typography>
                      </Box>
                    </Box>
                    {daysOfWeek.map((day, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: "12.5%",
                          borderRight: idx < 6 ? "1px solid #f0f0f0" : "none",
                        }}
                      >
                        <MealSlot
                          day={day}
                          mealKey={meal.key}
                          dishes={
                            weeklyMenu[day.format("YYYY-MM-DD")]?.[meal.key] ||
                            []
                          }
                          onRemove={removeDish}
                          isLocked={isLocked}
                        />
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>

            <DragOverlay>
              {activeDish ? (
                <Box className="dish-drag-preview">
                  <DraggableDish dish={activeDish} />
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Dialogs */}
          <CopyWeekDialog
            open={isCopyDialogOpen}
            onClose={() => setIsCopyDialogOpen(false)}
            onConfirm={handleAddToTemplates}
            currentWeek={currentWeek}
          />
          <ApplyTemplateDialog
            open={isApplyDialogOpen}
            onClose={() => setIsApplyDialogOpen(false)}
            onConfirm={handleApplyTemplate}
            templates={templateBank}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MenuSetup;
