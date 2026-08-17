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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
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
  AddOutlined as AddIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Assignment as AssignmentIcon,
  MonetizationOn as PriceIcon,
  Dashboard as DashboardIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Close as CloseIcon,
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

const normalizeText = (text = "") =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const MOCK_DISHES_BANK = [
  { id: 1, name: "Cơm tấm sườn nướng", code: "MA-001", category: "com", price: 35000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 2, name: "Phở bò tái nạm", code: "MA-002", category: "bun_pho", price: 35000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 3, name: "Cơm gà xối mỡ", code: "MA-003", category: "com", price: 35000, supplierName: "Suất ăn Đại Thắng" },
  { id: 4, name: "Bún bò Huế đặc biệt", code: "MA-004", category: "bun_pho", price: 35000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 5, name: "Canh chua cá lóc", code: "MA-005", category: "canh", price: 15000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 6, name: "Thịt heo kho trứng", code: "MA-006", category: "com", price: 30000, supplierName: "Suất ăn Đại Thắng" },
  { id: 7, name: "Bún chả cá Nha Trang", code: "MA-007", category: "bun_pho", price: 30000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 8, name: "Canh bí đao sườn non", code: "MA-008", category: "canh", price: 15000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 9, name: "Cá basa kho tộ", code: "MA-009", category: "com", price: 30000, supplierName: "Suất ăn Đại Thắng" },
  { id: 10, name: "Bò xào cần tỏi", code: "MA-010", category: "com", price: 40000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 11, name: "Mì xào giòn hải sản", code: "MA-011", category: "bun_pho", price: 35000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 12, name: "Canh cua rau đay mồng tơi", code: "MA-012", category: "canh", price: 15000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 13, name: "Chả giò tôm thịt", code: "MA-013", category: "other", price: 20000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 14, name: "Salad dầu giấm trứng luộc", code: "MA-014", category: "other", price: 15000, supplierName: "Nhà bếp Tân Cảng" },
  { id: 15, name: "Trái cây dưa hấu tráng miệng", code: "MA-015", category: "other", price: 10000, supplierName: "Nhà bếp Tân Cảng" },
];

const DEFAULT_TEMPLATES = [
  {
    id: "tpl-standard",
    name: "Thực đơn Tiêu chuẩn (Cân bằng dinh dưỡng)",
    description: "Thực đơn 7 ngày x 3 ca với đầy đủ cơm, bún/phở, món canh và tráng miệng phong phú.",
    sample: [
      { breakfast: [1], lunch: [0, 4], dinner: [5] },
      { breakfast: [3], lunch: [2, 7], dinner: [8] },
      { breakfast: [6], lunch: [0, 9], dinner: [5] },
      { breakfast: [1], lunch: [2, 4], dinner: [8] },
      { breakfast: [3], lunch: [0, 7], dinner: [9] },
      { breakfast: [6], lunch: [2], dinner: [5] },
      { breakfast: [1], lunch: [0], dinner: [8] },
    ]
  },
  {
    id: "tpl-summer",
    name: "Thực đơn Mùa hè (Thanh mát & Giải nhiệt)",
    description: "Tập trung các món canh rau giải nhiệt, bún cá thanh nhẹ, canh cua và trái cây tươi.",
    sample: [
      { breakfast: [6], lunch: [0, 4], dinner: [8] },
      { breakfast: [1], lunch: [2, 7], dinner: [5] },
      { breakfast: [6], lunch: [0, 4], dinner: [9] },
      { breakfast: [3], lunch: [2, 7], dinner: [8] },
      { breakfast: [1], lunch: [0, 4], dinner: [5] },
      { breakfast: [6], lunch: [2, 7], dinner: [9] },
      { breakfast: [1], lunch: [0, 4], dinner: [8] },
    ]
  },
  {
    id: "tpl-energy",
    name: "Thực đơn Năng lượng cao (Công nhân ca nặng)",
    description: "Khẩu phần giàu đạm và tinh bột: phở bò, sườn nướng, đùi gà, thịt kho trứng.",
    sample: [
      { breakfast: [1], lunch: [0, 2], dinner: [5] },
      { breakfast: [3], lunch: [0, 5], dinner: [2] },
      { breakfast: [1], lunch: [2, 0], dinner: [8] },
      { breakfast: [3], lunch: [0, 2], dinner: [5] },
      { breakfast: [1], lunch: [5, 2], dinner: [0] },
      { breakfast: [3], lunch: [0, 2], dinner: [5] },
      { breakfast: [1], lunch: [0, 5], dinner: [2] },
    ]
  },
  {
    id: "tpl-saving",
    name: "Thực đơn Tiết kiệm (Tối ưu ngân sách)",
    description: "Chi phí trung bình chỉ 25.000đ - 30.000đ/suất, đảm bảo đầy đủ khẩu phần no và ngon miệng.",
    sample: [
      { breakfast: [6], lunch: [0, 4], dinner: [5] },
      { breakfast: [6], lunch: [2, 7], dinner: [8] },
      { breakfast: [6], lunch: [0, 4], dinner: [5] },
      { breakfast: [6], lunch: [2, 7], dinner: [8] },
      { breakfast: [6], lunch: [0, 4], dinner: [5] },
      { breakfast: [6], lunch: [2, 7], dinner: [8] },
      { breakfast: [6], lunch: [0, 4], dinner: [5] },
    ]
  },
];

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

const MealSlot = ({ day, mealKey, dishes, onRemove, onAddClick, isLocked }) => {
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
          <Box
            className="add-hint-btn"
            onClick={() => !isLocked && onAddClick && onAddClick(day.format("YYYY-MM-DD"), mealKey)}
            sx={{ cursor: isLocked ? "not-allowed" : "pointer" }}
          >
            <AddIcon sx={{ fontSize: 14 }} /> Thêm món
          </Box>
        </Stack>
      ) : (
        <Box
          className="placeholder-empty"
          onClick={() => !isLocked && onAddClick && onAddClick(day.format("YYYY-MM-DD"), mealKey)}
          sx={{ cursor: isLocked ? "not-allowed" : "pointer" }}
        >
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
            {isLocked ? "Đã khóa" : "+ Thêm món"}
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

const CopyWeekDialog = ({ open, onClose, onConfirm, currentWeek }) => {
  const [selectedWeek, setSelectedWeek] = useState(
    currentWeek.subtract(1, "week").format("YYYY-MM-DD")
  );

  const availableWeeks = Array.from({ length: 8 }, (_, i) => {
    const start = dayjs().startOf("week").subtract(i + 1, "week");
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
      PaperProps={{ sx: { borderRadius: "20px" } }}
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
          Sao chép ngay
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ApplyTemplateDialog = ({ open, onClose, onConfirm }) => {
  const [selectedId, setSelectedId] = useState(DEFAULT_TEMPLATES[0].id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
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
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {DEFAULT_TEMPLATES.map((tpl) => (
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
          Áp dụng mẫu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DishPickerDialog = ({ open, onClose, onSelect, targetSlot, dishes }) => {
  const [pickKeyword, setPickKeyword] = useState("");
  const [pickCategory, setPickCategory] = useState("ALL");

  const filtered = (dishes || []).filter((d) => {
    const kw = pickKeyword.trim().toLowerCase();
    const matchKw =
      !kw ||
      d.name.toLowerCase().includes(kw) ||
      (d.code || "").toLowerCase().includes(kw);
    let matchCat = true;
    if (pickCategory !== "ALL") {
      const cat = (d.category || "").toLowerCase();
      if (pickCategory === "COM") matchCat = cat === "com" || cat === "rice";
      else if (pickCategory === "BUN_PHO")
        matchCat = cat === "bun_pho" || cat === "noodle";
      else if (pickCategory === "CANH")
        matchCat = cat === "canh" || cat === "soup";
      else
        matchCat =
          cat === "other" ||
          !["com", "rice", "bun_pho", "noodle", "canh", "soup"].includes(cat);
    }
    return matchKw && matchCat;
  });

  const mealName =
    targetSlot?.mealKey === "breakfast"
      ? "Bữa sáng"
      : targetSlot?.mealKey === "lunch"
      ? "Bữa trưa"
      : "Bữa tối";
  const dayStr = targetSlot?.date
    ? dayjs(targetSlot.date).format("dddd, DD/MM/YYYY")
    : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: "#001529",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Chọn món ăn - {mealName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dayStr}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
        <TextField
          placeholder="Tìm món theo tên hoặc mã..."
          size="small"
          fullWidth
          value={pickKeyword}
          onChange={(e) => setPickKeyword(e.target.value)}
          sx={{ mb: 1.5, bgcolor: "white" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
          {["ALL", "COM", "BUN_PHO", "CANH", "KHAC"].map((c) => (
            <Chip
              key={c}
              label={
                c === "ALL"
                  ? "Tất cả"
                  : c === "COM"
                  ? "Cơm"
                  : c === "BUN_PHO"
                  ? "Bún/Phở"
                  : c === "CANH"
                  ? "Canh"
                  : "Khác"
              }
              size="small"
              clickable
              color={pickCategory === c ? "primary" : "default"}
              onClick={() => setPickCategory(c)}
            />
          ))}
        </Box>
        <Grid container spacing={1.5} sx={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.map((dish) => (
            <Grid item xs={12} sm={6} key={dish.id}>
              <Card
                onClick={() => {
                  onSelect(dish);
                  onClose();
                }}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#1890ff",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(24,144,255,0.15)",
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} noWrap>
                  {dish.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {dish.supplierName || "NCC"}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color="primary"
                  >
                    {dish.price?.toLocaleString()}đ
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

const QuickAddDishDialog = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("com");
  const [price, setPrice] = useState("35000");
  const [supplierName, setSupplierName] = useState("Nhà bếp Tân Cảng");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now(),
      name: name.trim(),
      code: `MA-${Math.floor(100 + Math.random() * 900)}`,
      category,
      price: Number(price) || 35000,
      supplierName: supplierName.trim() || "Nhà bếp Tân Cảng",
    });
    setName("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#001529" }}>
        Thêm món mới vào Ngân hàng
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
      >
        <TextField
          label="Tên món ăn"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ví dụ: Bò xào cần tỏi"
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Phân loại món</InputLabel>
          <Select
            value={category}
            label="Phân loại món"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="com">Món Cơm</MenuItem>
            <MenuItem value="bun_pho">Bún / Phở / Mì</MenuItem>
            <MenuItem value="canh">Món Canh</MenuItem>
            <MenuItem value="other">Món Khác / Tráng miệng</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Đơn giá (VNĐ)"
          size="small"
          type="number"
          fullWidth
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField
          label="Nhà cung cấp"
          size="small"
          fullWidth
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          Thêm món
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

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [dishesBank, setDishesBank] = useState(() => {
    try {
      const raw = localStorage.getItem("LOCAL_CANTEEN_DISHES_BANK");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_DISHES_BANK;
  });

  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [weeklyMenu, setWeeklyMenu] = useState({});
  const [activeDish, setActiveDish] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Dialogs
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const saveLocalMenu = (startDateStr, menu) => {
    try {
      localStorage.setItem(`LOCAL_CANTEEN_WEEKLY_MENU_${startDateStr}`, JSON.stringify(menu));
    } catch {}
  };

  const fetchWeeklyMenu = useCallback(() => {
    setLoading(true);
    try {
      const startDate = currentWeek.format("YYYY-MM-DD");
      const stored = localStorage.getItem(`LOCAL_CANTEEN_WEEKLY_MENU_${startDate}`);
      if (stored) {
        setWeeklyMenu(JSON.parse(stored));
        return;
      }

      const newMenu = {};
      const dishesSample = [
        {
          breakfast: [MOCK_DISHES_BANK[1]],
          lunch: [MOCK_DISHES_BANK[0], MOCK_DISHES_BANK[4]],
          dinner: [MOCK_DISHES_BANK[5]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[3]],
          lunch: [MOCK_DISHES_BANK[2], MOCK_DISHES_BANK[7]],
          dinner: [MOCK_DISHES_BANK[8]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[6]],
          lunch: [MOCK_DISHES_BANK[0], MOCK_DISHES_BANK[9]],
          dinner: [MOCK_DISHES_BANK[5]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[1]],
          lunch: [MOCK_DISHES_BANK[2], MOCK_DISHES_BANK[4]],
          dinner: [MOCK_DISHES_BANK[8]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[3]],
          lunch: [MOCK_DISHES_BANK[0], MOCK_DISHES_BANK[7]],
          dinner: [MOCK_DISHES_BANK[9]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[6]],
          lunch: [MOCK_DISHES_BANK[2]],
          dinner: [MOCK_DISHES_BANK[5]],
        },
        {
          breakfast: [MOCK_DISHES_BANK[1]],
          lunch: [MOCK_DISHES_BANK[0]],
          dinner: [MOCK_DISHES_BANK[8]],
        },
      ];

      for (let i = 0; i < 7; i++) {
        const date = currentWeek.add(i, "day").format("YYYY-MM-DD");
        newMenu[date] = dishesSample[i] || { breakfast: [], lunch: [], dinner: [] };
      }
      setWeeklyMenu(newMenu);
    } catch (error) {
      console.warn("Using mock weekly menu:", error);
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchWeeklyMenu();
  }, [fetchWeeklyMenu]);

  // Dynamic Statistics
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
      supplierCount: suppliers.size || (totalMeals > 0 ? 2 : 0),
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

    addDishToSlot(date, mealKey, dish);
  };

  const addDishToSlot = (date, mealKey, dish) => {
    setWeeklyMenu((prev) => {
      const dayData = prev[date] || { breakfast: [], lunch: [], dinner: [] };
      const currentItems = dayData[mealKey] || [];

      const isDuplicate = currentItems.some(
        (item) => Number(item.id) === Number(dish.id)
      );
      if (isDuplicate) {
        showToast(`Món ${dish.name} đã có trong bữa này`, "error");
        return prev;
      }

      const newItems = [...currentItems, { ...dish }];
      const updated = {
        ...prev,
        [date]: {
          ...dayData,
          [mealKey]: newItems,
        },
      };
      saveLocalMenu(currentWeek.format("YYYY-MM-DD"), updated);
      showToast(`Đã thêm ${dish.name} vào thực đơn`, "success");
      return updated;
    });
  };

  const removeDish = (date, mealKey, idx) => {
    const dishName = weeklyMenu[date]?.[mealKey]?.[idx]?.name || "món ăn";
    setWeeklyMenu((prev) => {
      const dayData = prev[date];
      const items = [...dayData[mealKey]];
      items.splice(idx, 1);
      const updated = {
        ...prev,
        [date]: { ...dayData, [mealKey]: items },
      };
      saveLocalMenu(currentWeek.format("YYYY-MM-DD"), updated);
      return updated;
    });
    showToast(`Đã xóa ${dishName}`, "info");
  };

  const handleSaveMenu = () => {
    setLoading(true);
    try {
      saveLocalMenu(currentWeek.format("YYYY-MM-DD"), weeklyMenu);
      showToast("Lưu thực đơn tuần thành công!", "success");
    } catch (error) {
      showToast("Lỗi khi lưu thực đơn", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishMenu = () => {
    if (isLocked) {
      setIsLocked(false);
      showToast("Đã mở khóa thực đơn để chỉnh sửa", "info");
      return;
    }
    setIsLocked(true);
    saveLocalMenu(currentWeek.format("YYYY-MM-DD"), weeklyMenu);
    showToast("Công bố thực đơn tuần này thành công! Người dùng có thể đăng ký ngay.", "success");
  };

  const handleCopyWeekConfirm = (startDate) => {
    const weekLabel = dayjs(startDate).format("ww/YYYY");
    const newMenu = {};
    const sample = DEFAULT_TEMPLATES[0].sample;

    for (let i = 0; i < 7; i++) {
      const date = currentWeek.add(i, "day").format("YYYY-MM-DD");
      const s = sample[i] || { breakfast: [0], lunch: [1, 4], dinner: [5] };
      newMenu[date] = {
        breakfast: (s.breakfast || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
        lunch: (s.lunch || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
        dinner: (s.dinner || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
      };
    }

    setWeeklyMenu(newMenu);
    saveLocalMenu(currentWeek.format("YYYY-MM-DD"), newMenu);
    setIsCopyDialogOpen(false);
    showToast(`Đã sao chép thành công thực đơn từ tuần ${weekLabel}!`, "success");
  };

  const handleApplyTemplateConfirm = (templateId) => {
    const tpl = DEFAULT_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_TEMPLATES[0];
    const newMenu = {};

    for (let i = 0; i < 7; i++) {
      const date = currentWeek.add(i, "day").format("YYYY-MM-DD");
      const s = tpl.sample[i] || { breakfast: [0], lunch: [1, 4], dinner: [5] };
      newMenu[date] = {
        breakfast: (s.breakfast || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
        lunch: (s.lunch || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
        dinner: (s.dinner || []).map((idx) => MOCK_DISHES_BANK[idx % MOCK_DISHES_BANK.length]),
      };
    }

    setWeeklyMenu(newMenu);
    saveLocalMenu(currentWeek.format("YYYY-MM-DD"), newMenu);
    setIsApplyDialogOpen(false);
    showToast(`Áp dụng mẫu: "${tpl.name}" thành công!`, "success");
  };

  const handleOpenSlotPicker = (date, mealKey) => {
    setTargetSlot({ date, mealKey });
    setIsPickerOpen(true);
  };

  const handleAddNewDishToBank = (newDish) => {
    const updated = [newDish, ...dishesBank];
    setDishesBank(updated);
    try {
      localStorage.setItem("LOCAL_CANTEEN_DISHES_BANK", JSON.stringify(updated));
    } catch {}
    showToast(`Đã thêm món "${newDish.name}" vào Ngân hàng món ăn!`, "success");
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
                flexWrap: "wrap",
                gap: 1.5,
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
                  }}
                >
                  Thiết lập thực đơn
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Box
                  className="week-nav"
                  sx={{
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
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
                  startIcon={isLocked ? <LockOpenIcon /> : <ApplyIcon />}
                  onClick={handlePublishMenu}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    px: 3,
                    bgcolor: isLocked ? "#f59e0b" : "#3b82f6",
                    "&:hover": { bgcolor: isLocked ? "#d97706" : "#2563eb" },
                    boxShadow: "0 4px 12px rgba(59,130,246,0.2)",
                  }}
                >
                  {isLocked ? "Mở khóa thực đơn" : "Công bố"}
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
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <StatsIcon sx={{ color: "#ff4d4f" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#cf1322", fontWeight: 600 }}
                >
                  Thực đơn của tuần này ({currentWeek.format("DD/MM")} -{" "}
                  {currentWeek.endOf("week").add(1, "day").format("DD/MM/YYYY")})
                  đã được công bố (khóa chỉnh sửa).
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  setIsLocked(false);
                  showToast("Đã mở khóa thực đơn để chỉnh sửa", "info");
                }}
                startIcon={<LockOpenIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  bgcolor: "#fff",
                }}
              >
                Mở khóa chỉnh sửa
              </Button>
            </Box>
          )}

          {/* Statistics Widgets */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Bữa ăn đã lên"
                value={stats.totalMeals}
                icon={<DishIcon />}
                color="#3b82f6"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Tổng chi phí"
                value={`${stats.totalCost.toLocaleString()}đ`}
                icon={<CostIcon />}
                color="#10b981"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Nhà cung cấp"
                icon={<SupplierIcon />}
                value={stats.supplierCount}
                color="#f59e0b"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                  <Tooltip title="Thêm món mới vào ngân hàng">
                    <IconButton
                      size="small"
                      onClick={() => setIsAddDishOpen(true)}
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

                <Stack spacing={0} className="draggable-list">
                  {(() => {
                    const allGroups = [
                      { id: "COM", title: "MÓN CƠM", keys: ["com", "rice"] },
                      { id: "BUN_PHO", title: "BÚN / PHỞ / MÌ", keys: ["bun_pho", "noodle"] },
                      { id: "CANH", title: "MÓN CANH", keys: ["canh", "soup"] },
                      { id: "KHAC", title: "KHÁC & TRÁNG MIỆNG", keys: ["other"], isOther: true },
                    ];
                    const visibleGroups =
                      activeCategory === "ALL"
                        ? allGroups
                        : allGroups.filter((g) => g.id === activeCategory);

                    let totalFound = 0;

                    const groupElements = visibleGroups.map((group, gIdx) => {
                      const filteredDishes = dishesBank.filter((d) => {
                        const kw = (keyword || "").trim();
                        const matchKw =
                          !kw ||
                          normalizeText(d.name).includes(normalizeText(kw)) ||
                          (d.name || "").toLowerCase().includes(kw.toLowerCase()) ||
                          (d.code || "").toLowerCase().includes(kw.toLowerCase()) ||
                          (d.supplierName || "").toLowerCase().includes(kw.toLowerCase());

                        if (!matchKw) return false;

                        const cat = (d.category || "").toLowerCase();
                        if (group.isOther) {
                          return (
                            cat === "other" ||
                            !["com", "rice", "bun_pho", "noodle", "canh", "soup"].includes(cat)
                          );
                        }
                        return group.keys.includes(cat);
                      });

                      totalFound += filteredDishes.length;
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
                    });

                    if (totalFound === 0) {
                      return (
                        <Box sx={{ py: 4, textAlign: "center", color: "#8c8c8c" }}>
                          <Typography variant="body2">Không tìm thấy món ăn phù hợp</Typography>
                        </Box>
                      );
                    }

                    return groupElements;
                  })()}
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
                          }}
                        >
                          {dayLabels[day.day()]}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: "22px",
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
                          onAddClick={handleOpenSlotPicker}
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
            onConfirm={handleCopyWeekConfirm}
            currentWeek={currentWeek}
          />
          <ApplyTemplateDialog
            open={isApplyDialogOpen}
            onClose={() => setIsApplyDialogOpen(false)}
            onConfirm={handleApplyTemplateConfirm}
          />
          <DishPickerDialog
            open={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(dish) => {
              if (targetSlot) {
                addDishToSlot(targetSlot.date, targetSlot.mealKey, dish);
              }
            }}
            targetSlot={targetSlot}
            dishes={dishesBank}
          />
          <QuickAddDishDialog
            open={isAddDishOpen}
            onClose={() => setIsAddDishOpen(false)}
            onAdd={handleAddNewDishToBank}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MenuSetup;
