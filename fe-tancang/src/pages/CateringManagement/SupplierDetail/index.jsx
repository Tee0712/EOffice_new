import React, { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { read, utils } from "xlsx";
import { useToast } from "@components/common/ToastProvider";
import { DishFormModal } from "../DishBank/components/DishModals";
import {
  SupplierFormModal,
  DeleteConfirmModal,
} from "../Suppliers/components/SupplierModals";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { callApi } from "@services/api";
import {
  API_CATERING_SUPPLIERS,
  API_CATERING_SUPPLIER_DETAIL,
  API_CATERING_SUPPLIER_CONTRACTS,
  API_CATERING_CONTRACT_UPDATE,
  API_CATERING_SUPPLIER_PRICES,
  API_CATERING_SUPPLIER_EVALUATIONS,
  API_CATERING_SUPPLIER_EVALUATIONS_NEW,
  API_CATERING_SUPPLIER_ORDERS,
  API_CATERING_SUPPLIER_ORDERS_EXPORT,
  API_CATERING_DISHES,
  API_CATERING_DISH_DETAIL,
} from "@EnvironmentFile/constants/urlConfig";
import "../Suppliers/Suppliers.css";
import {
  AccessTime,
  Add,
  ArrowBack,
  AttachMoney,
  CalendarMonth,
  DeleteOutline,
  DescriptionOutlined,
  DownloadRounded,
  EditOutlined,
  EmailOutlined,
  FastfoodOutlined,
  FileDownloadOutlined,
  HealthAndSafetyOutlined,
  History,
  HourglassBottom,
  LocalOfferOutlined,
  LocationOnOutlined,
  NavigateBefore,
  NavigateNext,
  NoteAddOutlined,
  Person,
  Phone,
  ReceiptLongOutlined,
  Restaurant,
  Search,
  Refresh,
  SentimentSatisfiedAlt,
  ShoppingCart,
  Star,
  StarBorderRounded,
  VisibilityOutlined,
  WorkspacesOutlined,
  Close,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const supplierMock = {
  initials: "HA",
  name: "Công ty TNHH Suất ăn Hương An",
  code: "NCC-001",
  taxCode: "0312345678",
  category: "Suất ăn công nghiệp",
  status: "Đang hợp tác",
  contactName: "Nguyễn Văn An",
  phone: "0909 123 456",
  email: "an.nv@huongan.com.vn",
  address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
  averageRating: "4.5",
  reviewCount: "128",
  contractValue: "2.5 tỷ",
  currentContractValue: "2.500.000.000 VNĐ",
  contractTerm: "12 tháng",
  daysLeft: "332 ngày",
  completedOrders: "156",
  contracts: [
    {
      id: "hd-2025",
      iconColor: "#3b9ae1",
      title: "Hợp đồng cung cấp suất ăn năm 2025",
      code: "HD-2025-001",
      startDate: "01/01/2025",
      endDate: "31/12/2025",
      amount: "2.500.000.000 VNĐ",
      status: "Đang hiệu lực",
      note: "Còn 332 ngày",
      statusColor: "#22c55e",
      statusBg: "#dcfce7",
    },
    {
      id: "hd-2024",
      iconColor: "#95a5a6",
      title: "Hợp đồng cung cấp suất ăn năm 2024",
      code: "HD-2024-001",
      startDate: "01/01/2024",
      endDate: "31/12/2024",
      amount: "2.200.000.000 VNĐ",
      status: "Đã hết hạn",
      note: "Đã hoàn thành",
      statusColor: "#ef4444",
      statusBg: "#fee2e2",
    },
    {
      id: "hd-2023",
      iconColor: "#95a5a6",
      title: "Hợp đồng cung cấp suất ăn năm 2023",
      code: "HD-2023-001",
      startDate: "01/01/2023",
      endDate: "31/12/2023",
      amount: "2.000.000.000 VNĐ",
      status: "Đã hết hạn",
      note: "Đã hoàn thành",
      statusColor: "#ef4444",
      statusBg: "#fee2e2",
    },
  ],
};

// const infoItems = [
//   { icon: <Person sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'NGƯỜI LIÊN HỆ', value: supplierMock.contactName },
//   { icon: <Phone sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'SỐ ĐIỆN THOẠI', value: supplierMock.phone },
//   { icon: <EmailOutlined sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'EMAIL', value: supplierMock.email },
//   { icon: <LocationOnOutlined sx={{ fontSize: 18, color: '#3b82f6' }} />, label: 'ĐỊA CHỈ', value: supplierMock.address },
// ];

// const stats = [
//   { icon: <AttachMoney sx={{ fontSize: 28, color: '#22c55e' }} />, value: supplierMock.currentContractValue, label: 'Giá trị HĐ hiện tại' },
//   { icon: <CalendarMonth sx={{ fontSize: 28, color: '#3b82f6' }} />, value: supplierMock.contractTerm, label: 'Thời hạn HĐ' },
//   { icon: <HourglassBottom sx={{ fontSize: 28, color: '#f59e0b' }} />, value: supplierMock.daysLeft, label: 'Còn lại' },
//   { icon: <WorkspacesOutlined sx={{ fontSize: 28, color: '#a855f7' }} />, value: supplierMock.completedOrders, label: 'Đơn hàng đã thực hiện' },
// ];

const priceItems = [
  {
    id: 1,
    name: "Cơm sườn nướng",
    code: "MA-001",
    category: "Cơm",
    price: "35.000 VNĐ",
    unit: "Suất",
    updatedAt: "01/01/2025",
    change: "+5%",
    iconBg: "#f59e0b",
  },
  {
    id: 2,
    name: "Cơm gà xối mỡ",
    code: "MA-002",
    category: "Cơm",
    price: "32.000 VNĐ",
    unit: "Suất",
    updatedAt: "01/01/2025",
    change: "",
    iconBg: "#22c55e",
  },
  {
    id: 3,
    name: "Phở bò tái",
    code: "MA-003",
    category: "Bún/Phở",
    price: "38.000 VNĐ",
    unit: "Tô",
    updatedAt: "01/01/2025",
    change: "",
    iconBg: "#3b82f6",
  },
  {
    id: 4,
    name: "Bún bò Huế",
    code: "MA-004",
    category: "Bún/Phở",
    price: "36.000 VNĐ",
    unit: "Tô",
    updatedAt: "15/01/2025",
    change: "+3%",
    iconBg: "#a855f7",
  },
  {
    id: 5,
    name: "Cơm tấm bì chả",
    code: "MA-005",
    category: "Cơm",
    price: "30.000 VNĐ",
    unit: "Suất",
    updatedAt: "01/01/2025",
    change: "",
    iconBg: "#ef4444",
  },
];

const historyItems = [
  {
    code: "DH-20250203-001",
    supplyDate: "03/02/2025",
    meal: "Bữa trưa",
    quantity: "320 suất",
    amount: "11.200.000 VNĐ",
    status: "Đang xử lý",
    statusBg: "#fef3c7",
    statusColor: "#b45309",
    rating: "-",
  },
  {
    code: "DH-20250202-001",
    supplyDate: "02/02/2025",
    meal: "Bữa trưa",
    quantity: "315 suất",
    amount: "11.025.000 VNĐ",
    status: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#15803d",
    rating: 5,
  },
  {
    code: "DH-20250201-001",
    supplyDate: "01/02/2025",
    meal: "Bữa trưa",
    quantity: "298 suất",
    amount: "10.430.000 VNĐ",
    status: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#15803d",
    rating: 4,
  },
  {
    code: "DH-20250131-001",
    supplyDate: "31/01/2025",
    meal: "Bữa trưa",
    quantity: "305 suất",
    amount: "10.675.000 VNĐ",
    status: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#15803d",
    rating: 4,
  },
  {
    code: "DH-20250130-001",
    supplyDate: "30/01/2025",
    meal: "Bữa trưa",
    quantity: "0 suất",
    amount: "0 VNĐ",
    status: "Đã hủy",
    statusBg: "#fee2e2",
    statusColor: "#b91c1c",
    rating: "-",
  },
];

const reviewTrend = [4.2, 4.28, 4.36, 4.48, 4.37, 4.58, 4.49];
const reviewLabels = [
  "T8/24",
  "T9/24",
  "T10/24",
  "T11/24",
  "T12/24",
  "T1/25",
  "T2/25",
];
const reviewBreakdown = [
  { label: "5 sao", value: 65 },
  { label: "4 sao", value: 20 },
  { label: "3 sao", value: 10 },
  { label: "2 sao", value: 3 },
  { label: "1 sao", value: 2 },
];
const reviewMetrics = [
  {
    icon: <Restaurant sx={{ fontSize: 28, color: "#22c55e" }} />,
    score: "4.6",
    label: "Chất lượng món ăn",
  },
  {
    icon: <AccessTime sx={{ fontSize: 28, color: "#3498db" }} />,
    score: "4.4",
    label: "Đúng giờ giao hàng",
  },
  {
    icon: <HealthAndSafetyOutlined sx={{ fontSize: 28, color: "#a855f7" }} />,
    score: "4.7",
    label: "Vệ sinh an toàn",
  },
  {
    icon: <SentimentSatisfiedAlt sx={{ fontSize: 28, color: "#f59e0b" }} />,
    score: "4.3",
    label: "Thái độ phục vụ",
  },
];
const recentReviews = [
  {
    initials: "NT",
    name: "Nguyễn Thị Mai",
    department: "Phòng Kế toán",
    rating: 5,
    date: "02/02/2025",
    comment:
      "Món ăn rất ngon, đầy đủ dinh dưỡng. Cơm sườn nướng hôm nay rất tuyệt vời, thịt mềm và đậm đà. Rau củ tươi ngon. Rất hài lòng!",
    color: "#3498db",
  },
  {
    initials: "TH",
    name: "Trần Văn Hùng",
    department: "Phòng IT",
    rating: 4,
    date: "01/02/2025",
    comment:
      "Phở bò ngon, nước dùng đậm đà. Tuy nhiên thịt hơi ít so với giá tiền. Nhân viên phục vụ thân thiện.",
    color: "#3498db",
  },
  {
    initials: "LH",
    name: "Lê Thị Hương",
    department: "Phòng Nhân sự",
    rating: 4,
    date: "31/01/2025",
    comment:
      "Bún bò Huế cay vừa, nước dùng thơm. Giao hàng đúng giờ, đóng gói cẩn thận. Sẽ tiếp tục ủng hộ.",
    color: "#3498db",
  },
];

const sectionByTab = {
  contracts: "Lịch sử hợp đồng",
  prices: "Danh sách bảng giá",
  reviews: "Đánh giá gần đây",
  history: "Lịch sử cung cấp",
};
const categoryChipStyles = {
  Cơm: { color: "#b7791f", bgcolor: "#fef3c7" },
  com: { color: "#b7791f", bgcolor: "#fef3c7" },
  "Bún/Phở": { color: "#15803d", bgcolor: "#dcfce7" },
  canh: { color: "#b7791f", bgcolor: "#fef3c7" },
  nuoc: { color: "#3b82f6", bgcolor: "#eff6ff" },
};

const mapCategoryLabel = (cat) => {
  if (!cat) return "Chưa phân loại";
  const mapping = {
    com: "Cơm",
    canh: "Canh",
    nuoc: "Nước uống",
  };
  return mapping[cat.toLowerCase()] || cat;
};

const getInitials = (name) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const mapSupplierType = (type) => {
  const types = {
    FOOD: "Suất ăn công nghiệp",
    INDUSTRIAL_LUNCH: "Suất ăn công nghiệp",
    WATER: "Cung cấp nước uống",
    BEVERAGE: "Đồ uống",
    CLEANING: "Dịch vụ vệ sinh",
    FRESH_FOOD: "Thực phẩm tươi sống",
    INGREDIENT: "Thực phẩm tươi sống",
  };
  return types[type] || "Nhà cung cấp";
};

const mapContractStatus = (status) => {
  if (!status) return "Không xác định";
  const s = status.toLowerCase();
  const statuses = {
    active: "Đang hiệu lực",
    inactive: "Ngừng hợp tác",
    expired: "Đã hết hạn",
    replaced: "Đã thay thế",
  };
  return statuses[s] || status;
};

const formatContractTerm = (term) => {
  if (!term || term === "Chưa cập nhật") return term;
  if (term.includes(" - ")) {
    const parts = term.split(" - ");
    return parts.map((p) => formatDate(p.trim())).join(" - ");
  }
  return formatDate(term);
};

const getDaysLeft = (dateString) => {
  if (!dateString) return "0 ngày";
  const end = new Date(dateString);
  const now = new Date();
  const diff = end - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} ngày` : "Hết hạn";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const PaginationRow = ({ active = 1, totalPages = 1, onPageChange }) => {
  const displayTotalPages = Math.max(totalPages, 1);

  const handlePageClick = (p) => {
    if (onPageChange && p >= 1 && p <= displayTotalPages) {
      onPageChange(p);
    }
  };

  const pages = Array.from({ length: displayTotalPages }, (_, i) => i + 1);

  return (
    <Stack
      direction="row"
      justifyContent="center"
      spacing={0.75}
      sx={{ mt: 3, mb: 1 }}
    >
      <IconButton
        sx={{
          width: 32,
          height: 32,
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          bgcolor: "#fff",
          "&:hover": { bgcolor: "#f8fafc" },
          "&.Mui-disabled": { opacity: 0.5 },
        }}
        disabled={active === 1}
        onClick={() => handlePageClick(active - 1)}
      >
        <NavigateBefore sx={{ fontSize: 18, color: "#64748b" }} />
      </IconButton>

      {pages.map((page) => (
        <Box
          key={page}
          onClick={() => handlePageClick(page)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            cursor: "pointer",
            border: page === active ? "none" : "1px solid #e2e8f0",
            bgcolor: page === active ? "#3b82f6" : "#fff",
            color: page === active ? "#fff" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            "&:hover": { bgcolor: page === active ? "#2563eb" : "#f8fafc" },
          }}
        >
          {page}
        </Box>
      ))}

      <IconButton
        sx={{
          width: 32,
          height: 32,
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          bgcolor: "#fff",
          "&:hover": { bgcolor: "#f8fafc" },
          "&.Mui-disabled": { opacity: 0.5 },
        }}
        disabled={active === displayTotalPages}
        onClick={() => handlePageClick(active + 1)}
      >
        <NavigateNext sx={{ fontSize: 18, color: "#64748b" }} />
      </IconButton>
    </Stack>
  );
};

const renderRating = (rating) => {
  if (rating === "-")
    return (
      <Typography sx={{ color: "#0f172a", fontWeight: 600 }}>-</Typography>
    );
  return (
    <Stack direction="row" spacing={0.2}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          sx={{ fontSize: 18, color: index < rating ? "#0f172a" : "#cbd5e1" }}
        />
      ))}
    </Stack>
  );
};

const renderOrangeStars = (count, small = false) => (
  <Stack direction="row" spacing={0.2} justifyContent="center">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        sx={{
          fontSize: small ? 18 : 30,
          color: index < count ? "#f59e0b" : "#fde68a",
        }}
      />
    ))}
  </Stack>
);

const PriceTabContent = ({
  prices,
  onAddDish,
  onEditDish,
  page = 1,
  onPageChange,
  isExpired,
}) => {
  const pageSize = 5;
  const totalPages = Math.ceil((prices?.length || 0) / pageSize) || 1;
  const paginatedPrices = useMemo(() => {
    const start = (page - 1) * pageSize;
    const sorted = [...(prices || [])].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.updatedAt || 0);
      const dateB = new Date(b.updated_at || b.updatedAt || 0);
      return dateB - dateA;
    });
    return sorted.slice(start, start + pageSize);
  }, [prices, page, pageSize]);

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          bgcolor: "#fff",
        }}
      >
        <TextField
          select
          size="small"
          defaultValue="all"
          sx={{
            width: 160,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "#fff",
            },
          }}
        >
          <MenuItem value="all">Tất cả phân loại</MenuItem>
        </TextField>
        <TextField
          placeholder="Tìm kiếm món ăn..."
          size="small"
          InputProps={{
            startAdornment: (
              <Search sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} />
            ),
          }}
          sx={{
            width: 240,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "#fff",
            },
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Tooltip
          title={
            isExpired
              ? "Không thể thêm món cho nhà cung cấp đã hết hạn hợp đồng"
              : ""
          }
        >
          <span>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 18 }} />}
              onClick={onAddDish}
              disabled={isExpired}
              sx={{
                bgcolor: "#f59e0b",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                "&:hover": { bgcolor: "#d97706" },
                "&.Mui-disabled": { bgcolor: "#cbd5e1" },
              }}
            >
              Thêm món
            </Button>
          </span>
        </Tooltip>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f1f5f9" }}>
            <TableRow>
              <TableCell
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: 12,
                  width: 60,
                }}
              >
                STT
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                MÓN ĂN
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                PHÂN LOẠI
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                ĐƠN GIÁ
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                ĐƠN VỊ
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                CẬP NHẬT
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                THAO TÁC
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrices.map((item, index) => (
              <TableRow
                key={item.id}
                hover
                sx={{ "&:last-child td": { border: 0 } }}
              >
                <TableCell
                  sx={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}
                >
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={item.image_url}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: item.image_url
                          ? "transparent"
                          : item.iconBg || "#f59e0b",
                        borderRadius: "12px",
                      }}
                    >
                      {!item.image_url && (
                        <FastfoodOutlined
                          sx={{ fontSize: 20, color: "#fff" }}
                        />
                      )}
                    </Avatar>
                    <Box>
                      <Typography
                        sx={{ fontWeight: 600, color: "#334155", fontSize: 14 }}
                      >
                        {item.name || item.dishName}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                        {item.dish_code || item.code}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mapCategoryLabel(item.category)}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        categoryChipStyles[item.category]?.color || "#6366f1",
                      bgcolor:
                        categoryChipStyles[item.category]?.bgcolor || "#e0e7ff",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: "#10b981" }}>
                    {(item.price || 0).toLocaleString()} VNĐ
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                    {item.unit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                    {formatDate(item.updated_at || item.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onEditDish(item)}
                    sx={{
                      color: "#3b82f6",
                      bgcolor: "#eff6ff",
                      borderRadius: "8px",
                      "&:hover": { bgcolor: "#dbeafe" },
                    }}
                  >
                    <EditOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationRow
        active={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Box>
  );
};

const formatCurrency = (amount) => {
  if (amount >= 1e9) {
    return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + " tỷ";
  }
  return amount?.toLocaleString("vi-VN") + " VNĐ";
};

const PreviewExcelModal = ({ open, onClose, blob, fileName }) => {
  const [data, setData] = useState([]);
  const [sheetName, setSheetName] = useState("");

  useEffect(() => {
    if (open && blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const ab = e.target.result;
        const workbook = read(ab, { type: "array" });
        const name = workbook.SheetNames[0];
        setSheetName(name);
        const ws = workbook.Sheets[name];
        const json = utils.sheet_to_json(ws, { header: 1, defval: "" });
        setData(json);
      };
      reader.readAsArrayBuffer(blob);
    }
  }, [open, blob]);

  const handleDownload = () => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#107c41",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(16,124,65,0.2)",
            }}
          >
            <DescriptionOutlined sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                fontSize: 18,
                lineHeight: 1.2,
              }}
            >
              Xem trước báo cáo
            </Typography>
            <Typography
              sx={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}
            >
              {fileName}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#94a3b8",
            "&:hover": { color: "#64748b", bgcolor: "#f1f5f9" },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#f1f5f9" }}>
        <Box
          sx={{
            p: 1.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <Chip
            label={sheetName || "Sheet1"}
            size="small"
            sx={{
              bgcolor: "#fff",
              border: "1px solid #3b82f6",
              color: "#3b82f6",
              fontWeight: 700,
              px: 1,
              height: 26,
              "& .MuiChip-label": { px: 1 },
            }}
          />
          <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
            Chế độ xem trước lưới dữ liệu
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <TableContainer
            sx={{
              maxHeight: 550,
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              bgcolor: "#fff",
              overflow: "auto",
              "&::-webkit-scrollbar": { width: 8, height: 8 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "#cbd5e1",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-track": { bgcolor: "#f8fafc" },
            }}
          >
            <Table stickyHeader size="small">
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                  >
                    <TableCell
                      sx={{
                        width: 40,
                        minWidth: 40,
                        bgcolor: "#f8fafc",
                        color: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: "center",
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                        p: 0.5,
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                      }}
                    >
                      {rowIndex + 1}
                    </TableCell>
                    {Array.isArray(row) &&
                      row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          sx={{
                            border: "1px dotted #e2e8f0",
                            borderBottom: "1px solid #e2e8f0",
                            borderRight: "1px solid #e2e8f0",
                            fontSize: 13,
                            color:
                              cell === "" || cell === null || cell === undefined
                                ? "#cbd5e1"
                                : "#334155",
                            fontWeight: rowIndex < 3 ? 700 : 400,
                            bgcolor: rowIndex < 3 ? "#fbfcfe" : "inherit",
                            minWidth: cellIndex === 0 ? 50 : 120,
                            maxWidth: cellIndex === 0 ? 60 : 300,
                            whiteSpace: "nowrap",
                            p: 1.5,
                            textAlign: cellIndex === 0 ? "center" : "left",
                          }}
                        >
                          {cell || ""}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2.5,
          px: 3,
          bgcolor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: "#64748b",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            borderRadius: "10px",
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          startIcon={<FileDownloadOutlined />}
          sx={{
            bgcolor: "#107c41",
            textTransform: "none",
            fontWeight: 700,
            px: 4,
            borderRadius: "10px",
            boxShadow: "0 8px 16px rgba(16,124,65,0.25)",
            "&:hover": {
              bgcolor: "#0e6b38",
              boxShadow: "0 12px 20px rgba(16,124,65,0.35)",
            },
          }}
        >
          Tải xuống Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OrderDetailModal = ({ open, onClose, order }) => {
  if (!order) return null;

  const code = order.order_no || order.code || order.id;
  const date = order.order_date
    ? formatDate(order.order_date)
    : order.supplyDate || order.date;
  const mealMap = {
    lunch: "Bữa trưa",
    breakfast: "Bữa sáng",
    dinner: "Bữa tối",
  };
  const meal = mealMap[order.meal_slot] || order.meal || order.type;
  const statusMap = {
    processing: "Đang xử lý",
    confirmed: "Hoàn thành",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    delivered: "Đã giao hàng",
  };
  const statusLabel = statusMap[order.status] || order.status;

  const isProcessing = statusLabel === "Đang xử lý";
  const isSuccess =
    statusLabel === "Hoàn thành" || statusLabel === "Đã giao hàng";
  const amount =
    order.total_amount !== undefined ? Number(order.total_amount) : 0;
  const qty = order.expected_qty || 0;
  const menuItems = order.menu?.items || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              bgcolor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(59,130,246,0.2)",
            }}
          >
            <ReceiptLongOutlined sx={{ color: "#fff", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, color: "#1e293b", lineHeight: 1.2 }}
            >
              Chi tiết Đơn hàng
            </Typography>
            <Typography
              sx={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}
            >
              Mã đơn: {code}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#94a3b8",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          {/* Top Info Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Ngày cung cấp
                </Typography>
                <Typography sx={{ fontWeight: 800, color: "#1e293b", mt: 0.5 }}>
                  {date}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Bữa ăn
                </Typography>
                <Typography sx={{ fontWeight: 800, color: "#1e293b", mt: 0.5 }}>
                  {meal}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Thao tác bởi
                </Typography>
                <Typography sx={{ fontWeight: 800, color: "#1e293b", mt: 0.5 }}>
                  Hệ thống
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: isSuccess
                    ? "#dcfce7"
                    : isProcessing
                      ? "#fef3c7"
                      : "#fee2e2",
                  border: "1px solid transparent",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isSuccess
                      ? "#166534"
                      : isProcessing
                        ? "#92400e"
                        : "#991b1b",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Trạng thái
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: isSuccess
                      ? "#15803d"
                      : isProcessing
                        ? "#b45309"
                        : "#b91c1c",
                    mt: 0.5,
                  }}
                >
                  {statusLabel}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Financial Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "24px",
              bgcolor: "#1e293b",
              color: "#fff",
              mb: 4,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontWeight: 700 }}
              >
                SỐ SUẤT ĂN
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                {qty.toLocaleString()}
              </Typography>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontWeight: 700 }}
              >
                ĐƠN GIÁ
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                {(order.unit_price || 0).toLocaleString()}{" "}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  VNĐ
                </Typography>
              </Typography>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontWeight: 700 }}
              >
                TỔNG GIÁ TRỊ
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: "#10b981", mt: 0.5 }}
              >
                {amount.toLocaleString()}{" "}
                <Typography
                  component="span"
                  sx={{ fontSize: "1rem", fontWeight: 700 }}
                >
                  VNĐ
                </Typography>
              </Typography>
            </Box>
          </Paper>

          {/* Dish List Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Restaurant sx={{ fontSize: 20 }} /> Danh sách món ăn được cung
              cấp
            </Typography>
            <TableContainer
              sx={{ borderRadius: "16px", border: "1px solid #f1f5f9" }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, p: 2, color: "#64748b" }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, p: 2, color: "#64748b" }}>
                      HÌNH ẢNH
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, p: 2, color: "#64748b" }}>
                      TÊN MÓN ĂN
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, p: 2, color: "#64748b" }}>
                      MÃ MÓN
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, p: 2, color: "#64748b" }}>
                      ĐƠN VỊ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.length > 0 ? (
                    menuItems.map((mi, idx) => (
                      <TableRow key={mi.id} hover>
                        <TableCell sx={{ p: 2 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={mi.dish?.image_url}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "8px",
                              bgcolor: "#f1f5f9",
                            }}
                          >
                            <FastfoodOutlined sx={{ color: "#cbd5e1" }} />
                          </Avatar>
                        </TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Typography
                            sx={{ fontWeight: 700, color: "#334155" }}
                          >
                            {mi.dish?.name || "Món ăn không tên"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Chip
                            label={mi.dish?.dish_code || "-"}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 2 }}>
                          <Typography
                            sx={{ color: "#64748b", fontWeight: 600 }}
                          >
                            {mi.unit || "Suất"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 4, color: "#94a3b8", fontStyle: "italic" }}
                      >
                        Không có thông tin món ăn chi tiết.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Note Section */}
          {order.note && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#fdfcfe",
                border: "1px solid #f5f3ff",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#8b5cf6",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                Ghi chú công việc
              </Typography>
              <Typography
                sx={{ mt: 0.5, color: "#1e293b", fontStyle: "italic" }}
              >
                "{order.note}"
              </Typography>
            </Box>
          )}

          {/* Evaluation Section */}
          {order.evaluation && (
            <Box
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "#f0f9ff",
                border: "1px solid #e0f2fe",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#0369a1",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  Kết quả đánh giá chất lượng
                </Typography>
                <Rating
                  value={Number(order.evaluation.overall_score || 0)}
                  readOnly
                  size="small"
                  precision={0.1}
                />
              </Box>
              <Typography sx={{ color: "#1a3353", fontWeight: 600 }}>
                "{order.evaluation.comment || "Không có nhận xét"}"
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#1e293b",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 800,
            px: 4,
            py: 1.2,
            boxShadow: "0 8px 16px rgba(30,41,59,0.3)",
            "&:hover": { bgcolor: "#334155" },
          }}
        >
          Đóng cửa sổ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HistoryTabContent = ({
  orders,
  summary,
  supplierId,
  supplierName,
  page = 1,
  onPageChange,
}) => {
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterDateFrom, setFilterDateFrom] = React.useState("");
  const [filterDateTo, setFilterDateTo] = React.useState("");
  const [appliedFilter, setAppliedFilter] = React.useState({
    status: "all",
    from: "",
    to: "",
  });
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [previewBlob, setPreviewBlob] = React.useState(null);
  const [exportFileName, setExportFileName] = React.useState("");

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleFilter = () =>
    setAppliedFilter({
      status: filterStatus,
      from: filterDateFrom,
      to: filterDateTo,
    });

  const handleReset = () => {
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilter({ status: "all", from: "", to: "" });
  };

  const handleExportExcel = async () => {
    try {
      const res = await callApi(
        "GET",
        API_CATERING_SUPPLIER_ORDERS_EXPORT(supplierId),
        {
          status:
            appliedFilter.status === "all" ? undefined : appliedFilter.status,
          date_from: appliedFilter.from || undefined,
          date_to: appliedFilter.to || undefined,
        },
        { responseType: "blob" }
      );

      const fileName = `Lich_su_cung_cap_${supplierName?.replace(/\s+/g, "_") || supplierId}.xlsx`;
      setPreviewBlob(res);
      setExportFileName(fileName);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const statusMap = {
    processing: "Đang xử lý",
    confirmed: "Hoàn thành",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  const statusFilterMap = {
    completed: "Hoàn thành",
    processing: "Đang xử lý",
    cancelled: "Đã hủy",
  };

  const filteredOrders = React.useMemo(() => {
    return (orders || []).filter((item) => {
      const statusLabel = statusMap[item.status] || item.status;
      if (
        appliedFilter.status !== "all" &&
        statusLabel !== statusFilterMap[appliedFilter.status]
      )
        return false;

      const orderDate = item.order_date ? dayjs(item.order_date) : null;

      if (appliedFilter.from && orderDate) {
        if (orderDate.isBefore(appliedFilter.from, "day")) return false;
      }
      if (appliedFilter.to && orderDate) {
        if (orderDate.isAfter(appliedFilter.to, "day")) return false;
      }
      return true;
    });
  }, [orders, appliedFilter]);

  const statsList = [
    {
      icon: <ShoppingCart sx={{ fontSize: 28, color: "#ffffff" }} />,
      value: summary?.total_orders?.toLocaleString() || "0",
      label: "Tổng đơn hàng",
      iconBg: "#3498db",
    },
    {
      icon: <Restaurant sx={{ fontSize: 28, color: "#ffffff" }} />,
      value: summary?.total_qty?.toLocaleString() || "0",
      label: "Tổng suất ăn",
      iconBg: "#22c55e",
    },
    {
      icon: <AttachMoney sx={{ fontSize: 28, color: "#ffffff" }} />,
      value: summary?.total_amount
        ? formatCurrency(summary.total_amount)
        : "0 VNĐ",
      label: "Tổng giá trị",
      iconBg: "#8e44ad",
    },
    {
      icon: <History sx={{ fontSize: 28, color: "#ffffff" }} />,
      value: summary?.avg_qty_per_day?.toLocaleString() || "0",
      label: "TB suất/ngày",
      iconBg: "#f59e0b",
    },
  ];

  const paginatedOrders = React.useMemo(() => {
    const start = (page - 1) * 5;
    return (filteredOrders || []).slice(start, start + 5);
  }, [filteredOrders, page]);

  return (
    <Box sx={{ p: 0 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            bgcolor: "#fff",
            flexWrap: "wrap",
          }}
        >
          <TextField
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{
              width: 160,
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
          >
            <MenuItem value="all">Tất cả trạng thái</MenuItem>
            <MenuItem value="completed">Hoàn thành</MenuItem>
            <MenuItem value="processing">Đang xử lý</MenuItem>
            <MenuItem value="cancelled">Đã hủy</MenuItem>
          </TextField>
          <DatePicker
            label="Từ ngày"
            value={filterDateFrom ? dayjs(filterDateFrom) : null}
            onChange={(newValue) => setFilterDateFrom(newValue)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  width: 170,
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                },
              },
            }}
          />
          <Typography sx={{ color: "#94a3b8" }}>đến</Typography>
          <DatePicker
            label="Đến ngày"
            value={filterDateTo ? dayjs(filterDateTo) : null}
            onChange={(newValue) => setFilterDateTo(newValue)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  width: 170,
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                },
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search sx={{ fontSize: 18 }} />}
            onClick={handleFilter}
            sx={{
              bgcolor: "#f59e0b",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              height: 40,
              "&:hover": { bgcolor: "#d97706" },
            }}
          >
            Lọc
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={handleReset}
            sx={{
              color: "#64748b",
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              height: 40,
              "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
            }}
          >
            Làm mới
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined sx={{ fontSize: 18 }} />}
            onClick={handleExportExcel}
            sx={{
              borderColor: "#ef4444",
              color: "#ef4444",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              "&:hover": { borderColor: "#dc2626", bgcolor: "#fef2f2" },
            }}
          >
            Xuất Excel
          </Button>
        </Box>
      </LocalizationProvider>

      <Grid container spacing={2} sx={{ p: 2, bgcolor: "#f1f5f9" }}>
        {statsList.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Box
              sx={{
                p: 2,
                bgcolor: "#fff",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  bgcolor: stat.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#1e293b",
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f1f5f9" }}>
            <TableRow>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                MÃ ĐƠN
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                NGÀY CUNG CẤP
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                BỮA ĂN
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                SỐ SUẤT
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                TỔNG TIỀN
              </TableCell>
              <TableCell
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                TRẠNG THÁI
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                ĐÁNH GIÁ
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}
              >
                CHI TIẾT
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 6, color: "#94a3b8" }}
                >
                  Không có đơn hàng phù hợp với bộ lọc
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((item, index) => {
                const code = item.order_no || item.code || item.id;
                const date = item.order_date
                  ? formatDate(item.order_date)
                  : item.supplyDate || item.date;
                const mealMap = {
                  lunch: "Bữa trưa",
                  breakfast: "Bữa sáng",
                  dinner: "Bữa tối",
                };
                const meal = mealMap[item.meal_slot] || item.meal || item.type;
                const quantity =
                  item.expected_qty !== undefined
                    ? `${item.expected_qty} suất`
                    : item.quantity;
                const amount =
                  item.total_amount !== undefined
                    ? formatCurrency(item.total_amount)
                    : item.amount;

                const statusLabel = statusMap[item.status] || item.status;
                const isProcessing = statusLabel === "Đang xử lý";
                const isSuccess = statusLabel === "Hoàn thành";

                return (
                  <TableRow
                    key={index}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}
                      >
                        {code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                        {date}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ color: "#1e293b", fontSize: 13, fontWeight: 500 }}
                      >
                        {meal}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                        {quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}
                      >
                        {amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabel}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isProcessing
                            ? "#b45309"
                            : isSuccess
                              ? "#15803d"
                              : "#b91c1c",
                          bgcolor: isProcessing
                            ? "#fef3c7"
                            : isSuccess
                              ? "#dcfce7"
                              : "#fee2e2",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {renderRating(item.rating || "-")}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleShowDetail(item)}
                        sx={{
                          color: "#3b82f6",
                          bgcolor: "#eff6ff",
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "#dbeafe" },
                        }}
                      >
                        <VisibilityOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationRow
        active={page}
        totalPages={Math.ceil((filteredOrders.length || 0) / 5) || 1}
        onPageChange={onPageChange}
      />
      <PreviewExcelModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        blob={previewBlob}
        fileName={exportFileName}
      />
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
      />
    </Box>
  );
};

const ReviewTabContent = ({
  evaluations,
  supplier,
  page = 1,
  onPageChange,
  stats,
  allEvaluations,
  totalAvg,
}) => {
  const reviews = evaluations?.recent || [];
  const totalReviews = evaluations?.total || 0;
  const totalPages = Math.ceil(totalReviews / 5) || 1;
  const avgScore =
    totalAvg ||
    stats?.average_rating ||
    stats?.rating_avg ||
    (allEvaluations.length > 0
      ? (
          allEvaluations.reduce((sum, r) => sum + (r.rating || 0), 0) /
          (allEvaluations.filter((r) => r.rating > 0).length || 1)
        ).toFixed(1)
      : supplier?.averageRating || "0.0");
  const dataSource = allEvaluations.length > 0 ? allEvaluations : reviews;
  const dynamicBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = dataSource.filter(
      (r) => Math.round(r.rating) === star
    ).length;
    const total = dataSource.length || 1;
    const value = Math.round((count / total) * 100);
    return { label: `${star}★`, value };
  });
  const gap = Math.max(reviews.length - 1, 1);
  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                bgcolor: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#1e293b",
                  lineHeight: 1,
                }}
              >
                {avgScore}
              </Typography>
              <Box sx={{ my: 1 }}>
                {renderOrangeStars(parseFloat(avgScore), true)}
              </Box>
              <Typography sx={{ color: "#64748b", fontSize: 13, mb: 2.5 }}>
                Dựa trên {allEvaluations.length || totalReviews} đánh giá
              </Typography>
              <Box sx={{ width: "100%", px: 1 }}>
                {dynamicBreakdown.map((row) => (
                  <Box
                    key={row.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 0.75,
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        minWidth: 35,
                      }}
                    >
                      {row.label}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={row.value}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": { bgcolor: "#f59e0b" },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        minWidth: 25,
                        textAlign: "right",
                      }}
                    >
                      {row.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                p: 3,
                bgcolor: "#fff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                height: "100%",
              }}
            >
              <Typography sx={{ color: "#1e293b", fontWeight: 700, mb: 2 }}>
                Xu hướng đánh giá theo thời gian
              </Typography>
              <Box sx={{ height: 180, width: "100%", mt: 1 }}>
                <svg width="100%" height="160" viewBox="0 0 600 160">
                  {[0.0, 1.0, 2.0, 3.0, 4.0, 5.0].map((val, i) => {
                    const y = 140 - (val / 5.0) * 120;
                    return (
                      <g key={val}>
                        <text x="5" y={y + 5} fontSize="10" fill="#94a3b8">
                          {val.toFixed(1)}
                        </text>
                        <line
                          x1="30"
                          y1={y}
                          x2="580"
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={
                      allEvaluations.length >= 1
                        ? allEvaluations
                            .map(
                              (r, i) =>
                                `${40 + i * Math.floor(500 / Math.max(allEvaluations.length - 1, 1))},${140 - (Math.min(r.rating || 3, 5) / 5.0) * 120}`
                            )
                            .join(" ")
                        : "40,140"
                    }
                  />
                  <path
                    fill="url(#trendGradient)"
                    d={
                      allEvaluations.length >= 1
                        ? `M 40 ${140 - (Math.min(allEvaluations[0].rating || 3, 5) / 5.0) * 120} ` +
                          allEvaluations
                            .map(
                              (r, i) =>
                                `L ${40 + i * Math.floor(500 / Math.max(allEvaluations.length - 1, 1))} ${140 - (Math.min(r.rating || 3, 5) / 5.0) * 120}`
                            )
                            .join(" ") +
                          ` L ${40 + (allEvaluations.length - 1) * Math.floor(500 / Math.max(allEvaluations.length - 1, 1))} 140 L 40 140 Z`
                        : ""
                    }
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient
                      id="trendGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#fff" />
                    </linearGradient>
                  </defs>
                  {allEvaluations.map((r, i) => (
                    <circle
                      key={i}
                      cx={
                        40 +
                        i *
                          Math.floor(
                            500 / Math.max(allEvaluations.length - 1, 1)
                          )
                      }
                      cy={140 - (Math.min(r.rating || 3, 5) / 5.0) * 120}
                      r="4"
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  ))}
                  {allEvaluations.map((r, i) => (
                    <text
                      key={i}
                      x={
                        40 +
                        i *
                          Math.floor(
                            500 / Math.max(allEvaluations.length - 1, 1)
                          )
                      }
                      y="158"
                      fontSize="10"
                      fill="#94a3b8"
                      textAnchor="middle"
                    >
                      {allEvaluations.length > 10 && i % 4 !== 0 ? "" : r.date}
                    </text>
                  ))}
                </svg>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* 4 sub metric cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: "Chất lượng món ăn",
              icon: "🍴",
              field: "food_quality_score",
            },
            {
              label: "Đúng giờ giao hàng",
              icon: "🕐",
              field: "punctuality_score",
            },
            { label: "Vệ sinh an toàn", field: "hygiene_score", emoji: true },
            { label: "Thái độ phục vụ", icon: "😊", field: "service_score" },
          ].map((metric, idx) => {
            const dataSource =
              allEvaluations.length > 0 ? allEvaluations : reviews;
            const activeItems = dataSource.filter(
              (r) => (r[metric.field] || 0) > 0
            );
            const avg =
              activeItems.length > 0
                ? (
                    activeItems.reduce((sum, r) => sum + r[metric.field], 0) /
                    activeItems.length
                  ).toFixed(1)
                : reviews.length > 0 && reviews[0][metric.field]
                  ? reviews[0][metric.field].toFixed(1)
                  : "—";
            const icons = ["🍴", "🕐", "🖐", "😊"];
            return (
              <Grid item xs={6} sm={3} key={idx}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#fff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 26, mb: 0.5 }}>
                    {icons[idx]}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#1e293b",
                      lineHeight: 1,
                    }}
                  >
                    {avg}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: 600,
                      mt: 0.75,
                    }}
                  >
                    {metric.label}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <EmailOutlined sx={{ color: "#3b82f6", fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>
              Đánh giá gần đây
            </Typography>
          </Stack>
          {reviews.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "#94a3b8" }}>
              <Typography variant="body2">Chưa có đánh giá nào</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {reviews.map((review, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: review.color || "#3b82f6",
                          width: 36,
                          height: 36,
                          fontSize: 14,
                        }}
                      >
                        {review.initials}
                      </Avatar>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#1e293b",
                            fontSize: 13,
                          }}
                        >
                          {review.name} - {review.department}
                        </Typography>
                        <Box sx={{ display: "flex", mt: 0.25 }}>
                          {renderOrangeStars(review.rating, true)}
                        </Box>
                      </Box>
                    </Stack>
                    <Typography
                      sx={{ color: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                    >
                      {review.date}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 13,
                      lineHeight: 1.5,
                      pl: 6.5,
                    }}
                  >
                    {review.comment}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
        <PaginationRow
          active={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </Box>
    </Box>
  );
};

const DefaultTabContent = ({
  activeTab,
  supplier,
  stats,
  contracts,
  page = 1,
  onPageChange,
}) => {
  const pageSize = 5;
  const totalPages = Math.ceil((contracts?.length || 0) / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (contracts || []).slice(start, start + pageSize);
  }, [contracts, page, pageSize]);

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {stats.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  spacing: 2,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    mr: 2,
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>
              {sectionByTab[activeTab]}
            </Typography>
            <Button
              size="small"
              sx={{ textTransform: "none", fontWeight: 600, color: "#3b82f6" }}
            >
              Xem tất cả
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell
                    sx={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}
                  >
                    MÃ HỢP ĐỒNG
                  </TableCell>
                  <TableCell
                    sx={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}
                  >
                    LOẠI DỊCH VỤ
                  </TableCell>
                  <TableCell
                    sx={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}
                  >
                    GIÁ TRỊ
                  </TableCell>
                  <TableCell
                    sx={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}
                  >
                    HIỆU LỰC
                  </TableCell>
                  <TableCell
                    sx={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}
                  >
                    TRẠNG THÁI
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedContracts.map((contract) => {
                  const endDate =
                    contract.end_date ||
                    contract.endDate ||
                    contract.validUntil;
                  const isPast =
                    endDate && dayjs().isAfter(dayjs(endDate), "day");
                  const rawStatus = contract.status || "inactive";
                  // Only override ACTIVE to expired if date has passed. Keep REPLACED as is.
                  const displayStatus =
                    isPast && ["ACTIVE", "active"].includes(rawStatus)
                      ? "expired"
                      : rawStatus;

                  return (
                    <TableRow
                      key={contract.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: "#334155" }}>
                          {contract.contract_no ||
                            contract.code ||
                            contract.number ||
                            contract.contractNo ||
                            "---"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#64748b" }}>
                          {contract.contract_type ||
                            contract.type ||
                            "Chưa phân loại"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#334155", fontWeight: 600 }}>
                          {typeof (
                            contract.value_amount ||
                            contract.amount ||
                            contract.value
                          ) === "number"
                            ? (
                                contract.value_amount ||
                                contract.amount ||
                                contract.value
                              ).toLocaleString() + " VNĐ"
                            : contract.value_amount ||
                              contract.amount ||
                              contract.value ||
                              "---"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#64748b" }}>
                          {formatDate(
                            contract.end_date ||
                              contract.endDate ||
                              contract.validUntil
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={mapContractStatus(displayStatus)}
                          size="small"
                          color={
                            ["ACTIVE", "active", "Đang hiệu lực"].includes(
                              displayStatus
                            )
                              ? "success"
                              : [
                                    "REPLACED",
                                    "replaced",
                                    "Đã thay thế",
                                  ].includes(displayStatus)
                                ? "warning"
                                : "default"
                          }
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <PaginationRow
          active={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </Box>
    </Box>
  );
};

const ContractExtendModal = ({ open, onClose, contracts, onSubmit }) => {
  const [selectedId, setSelectedId] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    if (open) {
      const active = contracts?.find(
        (c) =>
          c.status === "ACTIVE" ||
          c.status === "active" ||
          c.status === "Đang hiệu lực"
      );
      if (active) {
        setSelectedId(active.id);
        setNewEndDate(active.end_date || active.endDate || "");
      } else if (contracts?.length > 0) {
        setSelectedId(contracts[0].id);
        setNewEndDate(contracts[0].end_date || contracts[0].endDate || "");
      }
    }
  }, [open, contracts]);

  const handleContractChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const contract = contracts?.find((c) => c.id === id);
    if (contract) {
      setNewEndDate(contract.end_date || contract.endDate || "");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#1e293b" }}>
        Gia hạn hợp đồng
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Chọn hợp đồng"
            value={selectedId}
            onChange={handleContractChange}
            variant="outlined"
            size="small"
          >
            {(contracts || []).map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.contract_no || c.code || c.number || "Không có mã"} -{" "}
                {mapContractStatus(c.status)}
              </MenuItem>
            ))}
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Ngày kết thúc mới"
              value={newEndDate ? dayjs(newEndDate) : null}
              onChange={(newValue) =>
                setNewEndDate(
                  newValue ? newValue.toISOString().split("T")[0] : ""
                )
              }
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  variant: "outlined",
                },
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(selectedId, newEndDate)}
          disabled={!selectedId || !newEndDate}
          sx={{
            bgcolor: "#22c55e",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "8px",
            "&:hover": { bgcolor: "#16a34a" },
          }}
        >
          Xác nhận gia hạn
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SupplierDetailPage = () => {
  const { id } = useParams();
  const showToast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: "1.9rem", fontWeight: 800 },
      h5: { fontSize: "1.5rem", fontWeight: 800 },
      h6: { fontSize: "1.1rem", fontWeight: 700 },
      subtitle1: { fontSize: "1rem", fontWeight: 600 },
      subtitle2: { fontSize: "0.9rem", fontWeight: 600 },
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
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontSize: "0.95rem",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
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
      MuiMenuItem: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            textTransform: "none",
            fontWeight: 700,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontWeight: 800,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
    },
  });

  const [activeTab, setActiveTab] = useState("contracts");
  const [supplier, setSupplier] = useState(supplierMock);
  const [contracts, setContracts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [evaluations, setEvaluations] = useState(null);
  const [evalStats, setEvalStats] = useState(null);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [evalPage, setEvalPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);
  const [pricePage, setPricePage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [extendModalOpen, setExtendModalOpen] = useState(false);

  const targetId = useMemo(
    () => id || location.state?.id || "19",
    [id, location.state]
  );

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      // Use the listing API as requested by the user to find the supplier info
      const res = await callApi("GET", API_CATERING_SUPPLIERS, {
        keyword: "",
        page: 0,
        size: 100,
      });

      // Extract the content using the same logic as Suppliers/index.jsx
      let content = [];
      if (Array.isArray(res)) {
        content = res;
      } else if (res?.data && Array.isArray(res.data)) {
        content = res.data;
      } else {
        content = res?.content || res?.data?.content || res?.items || [];
      }

      const found = content.find(
        (s) => s.id?.toString() === targetId?.toString()
      );

      if (found) {
        const endDate = found.contractEndAtCached || found.endDate;
        let displayStatus = found.contractStatusCached || found.status;

        // Auto-expire if past end date
        if (endDate && dayjs().isAfter(dayjs(endDate), "day")) {
          displayStatus = "expired";
        }

        setSupplier({
          ...supplierMock,
          id: found.id,
          name: found.name,
          initials: getInitials(found.name),
          code: found.supplierCode || found.code,
          taxCode: found.taxCode,
          category: mapSupplierType(found.type),
          status: mapContractStatus(displayStatus),
          contactName:
            found.contactPerson || found.contactName || "Chưa cập nhật",
          phone: found.phone || "Chưa cập nhật",
          email: found.email || "Chưa cập nhật",
          address: found.address || "Chưa cập nhật",
          averageRating: (
            found.ratingAvgCached ||
            found.ratingAvg ||
            0
          ).toString(),
          reviewCount: (
            found.ratingCountCached ||
            found.ratingCount ||
            0
          ).toString(),
          contractValue:
            found.contractValueCached || found.contractValue || "0",
          daysLeft: getDaysLeft(
            found.contractEndAtCached || found.contractEndAt
          ),
          completedOrders: (
            found.completedOrdersCount ||
            found.completedOrders ||
            0
          ).toString(),
          contractTerm: found.contractTerm || "Chưa cập nhật",
          currentContractValue: found.currentContractValue || "0 VNĐ",
          // Raw fields for SupplierFormModal
          contactPerson: found.contactPerson,
          type: found.type,
          contractStartAtCached: found.contractStartAtCached,
          contractEndAtCached: found.contractEndAtCached,
          updatedAt: found.updatedAt || found.updated_at,
          createdAt: found.createdAt || found.created_at,
          notes: found.notes,
        });
      } else {
        // If not found in list, try the specialized detail API as fallback
        const detailRes = await callApi(
          "GET",
          API_CATERING_SUPPLIER_DETAIL(targetId)
        );
        if (detailRes?.success && detailRes?.data) {
          const detailData = detailRes.data;
          setSupplier({
            ...supplierMock,
            id: detailData.id,
            name: detailData.name,
            initials: getInitials(detailData.name),
            code: detailData.supplierCode,
            taxCode: detailData.taxCode,
            category: mapSupplierType(detailData.type),
            status: mapContractStatus(detailData.contractStatusCached),
            contactName: detailData.contactPerson || "Chưa cập nhật",
            phone: detailData.phone || "Chưa cập nhật",
            email: detailData.email || "Chưa cập nhật",
            address: detailData.address || "Chưa cập nhật",
            averageRating: (detailData.ratingAvgCached || 0).toString(),
            reviewCount: (detailData.ratingCountCached || 0).toString(),
            contractValue: detailData.contractValueCached || "0",
            daysLeft: getDaysLeft(detailData.contractEndAtCached),
            completedOrders: (detailData.completedOrdersCount || 0).toString(),
            contractTerm: detailData.contractTerm || "Chưa cập nhật",
            currentContractValue: detailData.currentContractValue || "0 VNĐ",
            // Raw fields for SupplierFormModal
            contactPerson: detailData.contactPerson,
            type: detailData.type,
            contractStartAtCached: detailData.contractStartAtCached,
            contractEndAtCached: detailData.contractEndAtCached,
            updatedAt: detailData.updatedAt || detailData.updated_at,
            createdAt: detailData.createdAt || detailData.created_at,
            notes: detailData.notes,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch supplier detail:", error);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await callApi(
        "GET",
        API_CATERING_SUPPLIER_CONTRACTS(targetId)
      );
      if (res?.success && res?.data) {
        setContracts(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
    }
  }, [targetId]);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIER_PRICES(targetId), {
        sort: "updated_at,desc",
      });
      if (res?.success && res?.data) {
        setPrices(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    }
  }, [targetId]);

  const handleSaveDish = async (data) => {
    try {
      const isEdit = !!editingDish;
      const url = isEdit
        ? API_CATERING_DISH_DETAIL(editingDish.id)
        : API_CATERING_DISHES;
      const method = isEdit ? "PUT" : "POST";

      const res = await callApi(method, url, {
        ...data,
        dish_code: data.dish_code || data.code,
        imageUrl: data.image_url || data.imageUrl,
        image: data.image_url || data.imageUrl,
        supplier_id: targetId,
        supplier_code: supplier.code,
        tax_Code: supplier.taxCode || data.tax_Code,
      });
      if (res) {
        showToast(`${isEdit ? "Cập nhật" : "Thêm"} món ăn thành công!`);
        setAddDishOpen(false);
        setEditingDish(null);
        fetchPrices();
      }
    } catch (error) {
      console.error("Failed to save dish:", error);
      showToast(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu món ăn"
      );
    }
  };

  const fetchEvalStats = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIER_EVALUATION_STATS, {
        supplier_id: targetId,
      });
      if (res?.success && res.data) {
        setEvalStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch evaluation stats:", error);
    }
  }, [targetId]);

  const fetchAllEvaluations = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIER_EVALUATIONS_NEW, {
        supplier_id: targetId,
        size: 100,
        sort: "created_at,asc", // Oldest to newest for trend chart
      });
      if (res?.success && res.data) {
        setAllEvaluations(
          (Array.isArray(res.data) ? res.data : []).map((item) => {
            const scores = Array.isArray(item.scores) ? item.scores : [];
            const getScore = (code) => {
              const s = scores.find(
                (s) => s.criterion_code === code || s.evaluation_code === code
              );
              return s?.score || s?.value || 0;
            };

            const food = item.food_quality_score || getScore("food_quality");
            const punct = item.punctuality_score || getScore("delivery_time");
            const hygiene = item.hygiene_score || getScore("hygiene_safety");
            const service = item.service_score || getScore("service_attitude");

            let rating = item.overall_score || item.rating;
            if (!rating && (food || punct || hygiene || service)) {
              const activeScores = [food, punct, hygiene, service].filter(
                (v) => v > 0
              );
              rating =
                activeScores.length > 0
                  ? activeScores.reduce((a, b) => a + b, 0) /
                    activeScores.length
                  : 0;
            }

            return {
              ...item,
              rating: rating || 0,
              food_quality_score: food,
              punctuality_score: punct,
              hygiene_score: hygiene,
              service_score: service,
              date: formatDate(item.created_at || item.date),
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch all evaluations:", error);
    }
  }, [targetId]);

  const fetchEvaluations = useCallback(
    async (page = 1) => {
      try {
        const res = await callApi(
          "GET",
          API_CATERING_SUPPLIER_EVALUATIONS_NEW,
          {
            supplier_id: targetId,
            page: page,
            size: 5,
            sort: "created_at,desc",
          }
        );
        if (res?.success && res?.data) {
          setEvaluations({
            total: res.total || (Array.isArray(res.data) ? res.data.length : 0),
            recent: (Array.isArray(res.data) ? res.data : []).map((item) => ({
              initials: getInitials(item.user_name || item.name || "AD"),
              name: item.user_name || item.name || "Admin",
              department: item.overall_rating || item.department || "Nhân viên",
              rating:
                item.overall_score !== undefined
                  ? item.overall_score
                  : item.rating || 0,
              date: formatDate(item.created_at || item.date),
              comment: item.comment || "",
              color: "#3498db",
              food_quality_score:
                item.food_quality_score ||
                item.scores?.find((s) => s.criterion_code === "food_quality")
                  ?.score ||
                0,
              punctuality_score:
                item.punctuality_score ||
                item.scores?.find((s) => s.criterion_code === "delivery_time")
                  ?.score ||
                0,
              hygiene_score:
                item.hygiene_score ||
                item.scores?.find((s) => s.criterion_code === "hygiene_safety")
                  ?.score ||
                0,
              service_score:
                item.service_score ||
                item.scores?.find(
                  (s) => s.criterion_code === "service_attitude"
                )?.score ||
                0,
            })),
          });
        }
      } catch (error) {
        console.error("Failed to fetch evaluations:", error);
      }
    },
    [targetId]
  );

  const handleExtendContract = async (contractId, newEndDate) => {
    try {
      const res = await callApi(
        "PUT",
        API_CATERING_CONTRACT_UPDATE(contractId),
        {
          end_date: newEndDate,
          status: "ACTIVE",
        }
      );
      if (res) {
        showToast("Gia hạn hợp đồng thành công!");
        setExtendModalOpen(false);
        fetchContracts();
        fetchDetail();
      }
    } catch (error) {
      console.error("Failed to extend contract:", error);
      showToast(
        error.response?.data?.message || "Có lỗi xảy ra khi gia hạn hợp đồng"
      );
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIER_ORDERS(targetId));
      if (res?.success && res?.data) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [targetId]);

  useEffect(() => {
    fetchDetail();
    fetchContracts();
    fetchPrices();
    fetchOrders();
    fetchEvalStats();
    fetchAllEvaluations();
  }, [
    fetchDetail,
    fetchContracts,
    fetchPrices,
    fetchOrders,
    fetchEvalStats,
    fetchAllEvaluations,
  ]);

  useEffect(() => {
    fetchEvaluations(evalPage);
  }, [fetchEvaluations, evalPage]);

  const totalAvg = useMemo(() => {
    if (allEvaluations.length === 0) return null;
    const activeEvaluations = allEvaluations.filter((r) => (r.rating || 0) > 0);
    if (activeEvaluations.length === 0) return null;
    return (
      activeEvaluations.reduce((acc, curr) => acc + curr.rating, 0) /
      activeEvaluations.length
    ).toFixed(1);
  }, [allEvaluations]);

  const handleEditSupplier = async (values) => {
    try {
      const payload = {
        name: values.name,
        taxCode: values.taxCode,
        contactName: values.contactName, // This matches the DTO's contactName check
        phone: values.phone,
        email: values.email,
        type: values.type,
        address: values.address,
        startDate: values.startDate?.$d
          ? dayjs(values.startDate).format("YYYY-MM-DD")
          : values.startDate?.format
            ? values.startDate.format("YYYY-MM-DD")
            : values.startDate,
        endDate: values.endDate?.$d
          ? dayjs(values.endDate).format("YYYY-MM-DD")
          : values.endDate?.format
            ? values.endDate.format("YYYY-MM-DD")
            : values.endDate,
        notes: values.notes,
        supplier_code: supplier.supplierCode || supplier.code, // Dynamic fallback
      };

      const res = await callApi(
        "PUT",
        `${API_CATERING_SUPPLIERS}/${targetId}`,
        payload
      );
      if (res) {
        showToast("Cập nhật nhà cung cấp thành công!");
        setEditModalOpen(false);
        fetchDetail();
        fetchContracts();
      }
    } catch (error) {
      console.error("Failed to update supplier:", error);
      showToast(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật nhà cung cấp"
      );
    }
  };

  const handleDeleteSupplier = async () => {
    try {
      const res = await callApi(
        "DELETE",
        `${API_CATERING_SUPPLIERS}/${targetId}`
      );
      if (res) {
        showToast("Xóa nhà cung cấp thành công!");
        setDeleteModalOpen(false);
        navigate("/catering/suppliers");
      }
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      showToast(
        error.response?.data?.message || "Có lỗi xảy ra khi xóa nhà cung cấp"
      );
    }
  };

  const stats = useMemo(() => {
    const latestContract =
      contracts?.find((c) => c.status === "ACTIVE") || contracts?.[0];
    return [
      {
        icon: <AttachMoney sx={{ fontSize: 28, color: "#22c55e" }} />,
        value:
          typeof latestContract?.value_amount === "number"
            ? latestContract.value_amount.toLocaleString() + " VNĐ"
            : supplier.currentContractValue || "0 VNĐ",
        label: "Giá trị HĐ hiện tại",
      },
      {
        icon: <CalendarMonth sx={{ fontSize: 28, color: "#3b82f6" }} />,
        value:
          latestContract?.start_date && latestContract?.end_date
            ? `${formatDate(latestContract.start_date)} - ${formatDate(latestContract.end_date)}`
            : formatContractTerm(supplier.contractTerm || "Chưa có"),
        label: "Thời hạn HĐ",
      },
      {
        icon: <HourglassBottom sx={{ fontSize: 28, color: "#f59e0b" }} />,
        value:
          typeof latestContract?.remaining_days === "number"
            ? `${latestContract.remaining_days} ngày`
            : supplier.daysLeft,
        label: "Còn lại",
      },
      {
        icon: <WorkspacesOutlined sx={{ fontSize: 28, color: "#a855f7" }} />,
        value: supplier.completedOrders || "0",
        label: "Đơn hàng đã thực hiện",
      },
    ];
  }, [supplier, contracts]);

  const infoItems = useMemo(
    () => [
      {
        icon: <Person sx={{ fontSize: 18, color: "#3b82f6" }} />,
        label: "NGƯỜI LIÊN HỆ",
        value: supplier.contactName,
      },
      {
        icon: <Phone sx={{ fontSize: 18, color: "#3b82f6" }} />,
        label: "SỐ ĐIỆN THOẠI",
        value: supplier.phone,
      },
      {
        icon: <EmailOutlined sx={{ fontSize: 18, color: "#3b82f6" }} />,
        label: "EMAIL",
        value: supplier.email,
      },
      {
        icon: <LocationOnOutlined sx={{ fontSize: 18, color: "#3b82f6" }} />,
        label: "ĐỊA CHỈ",
        value: supplier.address,
      },
    ],
    [supplier]
  );

  const tabs = useMemo(
    () => [
      {
        label: "Hợp đồng",
        value: "contracts",
        icon: <DescriptionOutlined sx={{ fontSize: 18 }} />,
        count: contracts?.length || 0,
      },
      {
        label: "Bảng giá",
        value: "prices",
        icon: <ReceiptLongOutlined sx={{ fontSize: 18 }} />,
        count: prices?.length || 0,
      },
      {
        label: "Đánh giá",
        value: "reviews",
        icon: <StarBorderRounded sx={{ fontSize: 18 }} />,
        count: evaluations?.total || supplier.reviewCount || 0,
      },
      {
        label: "Lịch sử cung cấp",
        value: "history",
        icon: <History sx={{ fontSize: 18 }} />,
        count:
          orders?.items?.length || (Array.isArray(orders) ? orders.length : 0),
      },
    ],
    [contracts, prices, evaluations, orders, supplier]
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        className="supplier-detail-page standard-font"
        sx={{
          width: "100%",
          background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f8 100%)",
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate("/catering/suppliers")}
              sx={{
                color: "#3b82f6",
                textTransform: "none",
                fontWeight: 600,
                px: 0,
                "&:hover": { bgcolor: "transparent", color: "#2563eb" },
              }}
            >
              Quay lại danh sách
            </Button>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<History sx={{ fontSize: 18 }} />}
                onClick={() => setExtendModalOpen(true)}
                sx={{
                  borderRadius: "10px",
                  bgcolor: "#22c55e",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.25,
                  boxShadow: "0 10px 18px rgba(34,197,94,0.22)",
                  "&:hover": { bgcolor: "#16a34a" },
                }}
              >
                Gia hạn HĐ
              </Button>
              <Button
                variant="contained"
                onClick={() => setEditModalOpen(true)}
                startIcon={<EditOutlined sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: "10px",
                  bgcolor: "#f59e0b",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.25,
                  boxShadow: "0 10px 18px rgba(245,158,11,0.22)",
                  "&:hover": { bgcolor: "#d97706" },
                }}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="outlined"
                onClick={() => setDeleteModalOpen(true)}
                startIcon={<DeleteOutline sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: "10px",
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.25,
                  "&:hover": { borderColor: "#dc2626", bgcolor: "#fef2f2" },
                }}
              >
                Xóa
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              overflow: "hidden",
              borderRadius: "18px",
              bgcolor: "#fff",
              boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #274a7a 0%, #2f5689 100%)",
                px: { xs: 2, md: 3 },
                py: 3,
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                justifyContent="space-between"
                spacing={2.5}
              >
                <Stack
                  direction="row"
                  spacing={2.25}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <Box
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, #4ca9e8 0%, #2b7ebd 100%)",
                      border: "3px solid rgba(255,255,255,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 34,
                      fontWeight: 800,
                      flexShrink: 0,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    {supplier.initials}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: { xs: 28, md: 36 },
                        lineHeight: 1.15,
                        mb: 0.75,
                      }}
                    >
                      {supplier.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontWeight: 600,
                        mb: 1.5,
                      }}
                    >
                      Mã NCC: {supplier.code} | MST: {supplier.taxCode}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={supplier.category}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.16)",
                          color: "#fff",
                          fontWeight: 700,
                          borderRadius: "999px",
                        }}
                      />
                      <Chip
                        label={supplier.status}
                        size="small"
                        sx={{
                          bgcolor: ["Đã hết hạn", "Ngừng hợp tác"].includes(
                            supplier.status
                          )
                            ? "#ef4444"
                            : ["Đã thay thế"].includes(supplier.status)
                              ? "#f59e0b"
                              : "#22c55e",
                          color: "#fff",
                          fontWeight: 700,
                          borderRadius: "999px",
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Box
                    sx={{
                      minWidth: 116,
                      px: 2,
                      py: 1.75,
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.2}
                      justifyContent="center"
                      sx={{ mb: 0.5 }}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          sx={{ color: "#fbbf24", fontSize: 20 }}
                        />
                      ))}
                    </Stack>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 22,
                        lineHeight: 1,
                      }}
                    >
                      {totalAvg || supplier.averageRating || "0.0"}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Đánh giá TB
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 96,
                      px: 2,
                      py: 1.75,
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 22,
                        lineHeight: 1.1,
                        mb: 0.75,
                      }}
                    >
                      {String(
                        evalStats?.total ||
                          evaluations?.total ||
                          allEvaluations.length ||
                          supplier.reviewCount ||
                          "0"
                      )}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Lượt Đánh giá
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 96,
                      px: 2,
                      py: 1.75,
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 22,
                        lineHeight: 1.1,
                        mb: 0.75,
                      }}
                    >
                      {contracts
                        ?.find((c) => c.status?.toUpperCase() === "ACTIVE")
                        ?.value_amount?.toLocaleString() ||
                        supplier.contractValue}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Giá trị HĐ
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
            <Grid container spacing={0} sx={{ px: { xs: 2, md: 3 }, py: 2.25 }}>
              {infoItems.map((item) => (
                <Grid item xs={12} sm={6} lg={3} key={item.label}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                    sx={{ py: 1 }}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "10px",
                        bgcolor: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 700,
                          mb: 0.35,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#0f172a",
                          fontWeight: 700,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            sx={{
              borderRadius: "18px",
              overflow: "hidden",
              bgcolor: "#fff",
              boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            }}
          >
            <Box
              sx={{ borderBottom: "1px solid #e5e7eb", px: { xs: 1, md: 2 } }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                allowScrollButtonsMobile
                TabIndicatorProps={{
                  style: { backgroundColor: "#3b82f6", height: 3 },
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    icon={tab.icon}
                    iconPosition="start"
                    disableRipple
                    label={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <span>{tab.label}</span>
                        <Box
                          sx={{
                            minWidth: 20,
                            height: 18,
                            borderRadius: "999px",
                            px: 0.75,
                            bgcolor: "#e5e7eb",
                            color: "#64748b",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {tab.count}
                        </Box>
                      </Stack>
                    }
                    sx={{
                      minHeight: 58,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#475569",
                      alignItems: "center",
                    }}
                  />
                ))}
              </Tabs>
            </Box>
            {activeTab === "prices" && (
              <PriceTabContent
                prices={prices}
                onAddDish={() => {
                  setEditingDish(null);
                  setAddDishOpen(true);
                }}
                onEditDish={(dish) => {
                  setEditingDish(dish);
                  setAddDishOpen(true);
                }}
                page={pricePage}
                onPageChange={setPricePage}
                isExpired={["Đã hết hạn", "Ngừng hợp tác"].includes(
                  supplier.status
                )}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewTabContent
                supplier={supplier}
                evaluations={evaluations}
                page={evalPage}
                onPageChange={setEvalPage}
                stats={evalStats}
                allEvaluations={allEvaluations}
                totalAvg={totalAvg}
              />
            )}
            {activeTab === "history" && (
              <HistoryTabContent
                orders={orders?.items || (Array.isArray(orders) ? orders : [])}
                summary={orders?.summary}
                supplierId={targetId}
                supplierName={supplier.name}
                page={orderPage}
                onPageChange={setOrderPage}
              />
            )}
            {activeTab !== "prices" &&
              activeTab !== "reviews" &&
              activeTab !== "history" && (
                <DefaultTabContent
                  activeTab={activeTab}
                  supplier={supplier}
                  stats={stats}
                  contracts={contracts}
                  page={contractPage}
                  onPageChange={setContractPage}
                />
              )}
          </Box>
          <DishFormModal
            open={addDishOpen}
            onClose={() => {
              setAddDishOpen(false);
              setEditingDish(null);
            }}
            onSubmit={handleSaveDish}
            dish={editingDish}
            defaultSupplierTaxCode={supplier.taxCode}
            defaultSupplierName={supplier.name}
            defaultSupplierId={supplier.id}
            readOnlySupplier={true}
          />
          <SupplierFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSupplier}
            supplier={supplier}
            mode="EDIT"
          />
          <DeleteConfirmModal
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleDeleteSupplier}
            supplierName={supplier.name}
          />
          <ContractExtendModal
            open={extendModalOpen}
            onClose={() => setExtendModalOpen(false)}
            contracts={contracts}
            onSubmit={handleExtendContract}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SupplierDetailPage;
