import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress,
  Checkbox,
  InputAdornment,
  Paper,
  Stack,
  Divider,
  Skeleton,
  TablePagination,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Search as SearchIcon,
  NavigateBefore,
  NavigateNext,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Assessment as AssessmentIcon,
  WbSunnyOutlined,
  LightModeOutlined,
  BedtimeOutlined,
  RestaurantMenu as MenuIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import axios from "axios";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";
import { toast } from "react-hot-toast";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import * as XLSX from "xlsx";
import { canteenService } from "../../../services/canteenService";

dayjs.locale("vi");

// ─── Constants & Theme ────────────────────────────────────────────────────────

const VPP_THEME = {
  fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  bg: "#f0f4f9",
  border: "#d8e3f0",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  shadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
};

const muiTheme = createTheme({
  typography: {
    fontFamily: VPP_THEME.fontFamily,
  },
  components: {
    MuiTypography: {
      styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } },
    },
    MuiButton: {
      styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } },
    },
    MuiChip: { styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } } },
    MuiTextField: {
      styleOverrides: {
        root: { "& input": { fontFamily: VPP_THEME.fontFamily } },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } },
    },
  },
});

// ─── Sub Components ────────────────────────────────────────────────────────────

const StatusChip = ({ status }) => {
  const map = {
    checked: { label: "Đã ăn", bg: "#dcfce7", color: "#16a34a" },
    absent: { label: "Vắng", bg: "#fee2e2", color: "#dc2626" },
    pending: { label: "Chờ", bg: "#f1f5f9", color: "#64748b" },
  };
  const cfg = map[status] || map.pending;
  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: "11px",
        height: "24px",
        borderRadius: "6px",
        fontFamily: VPP_THEME.fontFamily,
        "& .MuiChip-label": { px: 1.5 },
      }}
    />
  );
};

const StatCard = ({ label, value, sub, color, progress, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: "16px",
      borderLeft: `5px solid ${color}`,
      boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
      height: "100%",
      bgcolor: "white",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-4px)" },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{
          color: "#8c8c8c",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Typography>
    </Box>
    <Typography
      variant="h3"
      sx={{ fontWeight: 900, color: color, mb: 0.5, lineHeight: 1 }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{ color: "#8c8c8c", fontWeight: 600, fontSize: "12px" }}
    >
      {sub}
    </Typography>
    {progress !== undefined && (
      <Box sx={{ mt: "auto", pt: 2 }}>
        <Box
          sx={{
            height: 4,
            bgcolor: "#f1f5f9",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: "100%", width: `${progress}%`, bgcolor: color }} />
        </Box>
      </Box>
    )}
    <Box
      sx={{
        position: "absolute",
        top: -10,
        right: -10,
        width: 80,
        height: 80,
        bgcolor: color,
        opacity: 0.05,
        borderRadius: "50%",
      }}
    />
  </Paper>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const CateringCheckIn = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs());
  const [slot, setSlot] = useState("lunch");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [checkins, setCheckins] = useState([]);
  const [slotCounts, setSlotCounts] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [loading, setLoading] = useState(false);
  const [orgUnits, setOrgUnits] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isEditAllowed = useMemo(() => {
    const checkInDay = dayjs(date).startOf("day");
    const today = dayjs().startOf("day");

    // Không cho chỉnh sửa ngày tương lai
    if (today.isBefore(checkInDay, "day")) return false;

    // Trong vòng 3 ngày kể từ ngày check-in (tính cả ngày check-in)
    const deadline = checkInDay.add(3, "day");
    return today.isBefore(deadline, "day") || today.isSame(deadline, "day");
  }, [date]);

  const ensureEditAllowed = useCallback(() => {
    if (isEditAllowed) return true;
    toast.error(
      "Chỉ được thay đổi trạng thái trong vòng 3 ngày kể từ ngày check-in"
    );
    return false;
  }, [isEditAllowed]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await canteenService.getOrganizationUnits({
          page: 1,
          limit: 5000,
        });
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.data)) setOrgUnits(res.data);
        else setOrgUnits([]);
      } catch (err) {
        if (isMounted) setOrgUnits([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const orgUnitNameLookup = useMemo(() => {
    const map = new Map();
    for (const unit of orgUnits) {
      if (unit?.id) map.set(String(unit.id), unit.name);
      if (unit?.code) map.set(String(unit.code), unit.name);
    }
    return map;
  }, [orgUnits]);

  const getDeptLabel = useCallback(
    (item) => {
      const deptKey = item?.dept;
      if (!deptKey) return item?.deptName || "---";
      return (
        orgUnitNameLookup.get(String(deptKey)) ||
        item?.deptName ||
        String(deptKey)
      );
    },
    [orgUnitNameLookup]
  );

  const departments = useMemo(() => {
    const map = new Map();
    for (const item of checkins) {
      const key = item?.dept;
      if (!key) continue;
      if (map.has(String(key))) continue;
      map.set(String(key), getDeptLabel(item));
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"));
  }, [checkins, getDeptLabel]);

  useEffect(() => {
    if (
      deptFilter !== "all" &&
      !departments.some((d) => String(d.code) === String(deptFilter))
    ) {
      setDeptFilter("all");
    }
  }, [deptFilter, departments]);

  // Fetch Data
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const token = localStorage.getItem("token_app");
        const res = await axios.get(`${APP_BASE}/api/v1/canteen/checkin/list`, {
          params: {
            date: date.format("YYYY-MM-DD"),
            slot: slot,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          setCheckins(res.data.data || []);
          if (res.data.summary) {
            setSlotCounts({
              breakfast: res.data.summary.breakfast || 0,
              lunch: res.data.summary.lunch || 0,
              dinner: res.data.summary.dinner || 0,
            });
          }
        }
      } catch (err) {
        console.error("Lỗi tải danh sách check-in:", err);
        toast.error("Không thể tải danh sách check-in");
      } finally {
        setLoading(false);
      }
    },
    [date, slot]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMark = async (userId, menuId, registration_id, newStatus) => {
    if (!ensureEditAllowed()) return;
    try {
      const token = localStorage.getItem("token_app");
      const res = await axios.patch(
        `${APP_BASE}/api/v1/canteen/checkin/status/${userId}/${menuId}`,
        { status: newStatus, registration_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setCheckins((prev) =>
          prev.map((item) =>
            item.id === userId &&
            item.menu_id === menuId &&
            item.registration_id === registration_id
              ? {
                  ...item,
                  status: newStatus,
                  time:
                    newStatus === "checked" || newStatus === "absent"
                      ? dayjs().format("HH:mm")
                      : null,
                }
              : item
          )
        );
        toast.success(
          newStatus === "checked"
            ? "Xác nhận ăn thành công"
            : "Đã cập nhật trạng thái"
        );
      }
    } catch (err) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleMarkSelected = async (status) => {
    if (!ensureEditAllowed()) return;
    const candidates =
      selected.length > 0
        ? filteredData.filter((item) =>
            selected.includes(`${item.registration_id}_${item.menu_id}`)
          )
        : filteredData;
    const targetRows = candidates.filter((item) => item.status === "pending");
    if (targetRows.length === 0) {
      toast(
        `Không có bản ghi "Chờ" nào để ${status === "checked" ? "xác nhận ăn" : "đánh dấu vắng"}`
      );
      return;
    }

    try {
      const token = localStorage.getItem("token_app");
      await Promise.all(
        targetRows.map((item) => {
          return axios.patch(
            `${APP_BASE}/api/v1/canteen/checkin/status/${item.id}/${item.menu_id}`,
            { status, registration_id: item.registration_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        })
      );
      toast.success(
        `Đã cập nhật tất cả sang ${status === "checked" ? "Đã ăn" : "Vắng"}`
      );
      fetchData(true);
    } catch (err) {
      toast.error("Cập nhật hàng loạt thất bại");
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const exportData = filteredData.map((item, idx) => ({
      STT: idx + 1,
      "Mã Nhân viên": item.id,
      "Họ tên": item.name,
      "Bộ phận": getDeptLabel(item),
      "Suất ăn": item.meal,
      "Trạng thái":
        item.status === "checked"
          ? "Đã ăn"
          : item.status === "absent"
            ? "Vắng"
            : "Chờ",
      "Thời gian xác nhận": item.time || "",
      Ngày: date.format("DD/MM/YYYY"),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CheckIn");
    XLSX.writeFile(wb, `CheckIn_${date.format("YYYYMMDD")}.xlsx`);
    toast.success("Đã xuất file báo cáo");
  };

  const filteredData = useMemo(
    () =>
      checkins.filter((item) => {
        const lowerSearch = search.toLowerCase();
        const matchSearch =
          String(item?.name || "")
            .toLowerCase()
            .includes(lowerSearch) ||
          String(item?.id || "")
            .toLowerCase()
            .includes(lowerSearch);
        const matchDept =
          deptFilter === "all" || String(item?.dept) === String(deptFilter);
        const matchStatus =
          statusFilter === "all" || item.status === statusFilter;
        return matchSearch && matchDept && matchStatus;
      }),
    [checkins, search, deptFilter, statusFilter]
  );

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, deptFilter, statusFilter, slot, date]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredData.length / rowsPerPage)
    );
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredData.length, page, rowsPerPage]);

  const stats = useMemo(() => {
    const total = checkins.length;
    const checked = checkins.filter((c) => c.status === "checked").length;
    const absent = checkins.filter((c) => c.status === "absent").length;
    const pending = checkins.filter((c) => c.status === "pending").length;
    const rate = total > 0 ? Math.round((checked / total) * 100) : 0;
    // Logic giá tiền: Lấy trực tiếp từ dữ liệu thực tế của API
    const unitPrice = checkins[0]?.price || 0;
    const lossAmount = absent * unitPrice;

    return { total, checked, absent, pending, rate, lossAmount };
  }, [checkins, slot]);

  const MEAL_TABS = [
    {
      id: "breakfast",
      label: "Ăn sáng",
      icon: <WbSunnyOutlined />,
      count: slotCounts.breakfast || 0,
    },
    {
      id: "lunch",
      label: "Ăn trưa",
      icon: <LightModeOutlined />,
      count: slotCounts.lunch || 0,
    },
    {
      id: "dinner",
      label: "Ăn tối",
      icon: <BedtimeOutlined />,
      count: slotCounts.dinner || 0,
    },
  ];

  const toggleAll = () => {
    const allUniqueKeys = filteredData.map(
      (c) => `${c.registration_id}_${c.menu_id}`
    );
    setSelected((prev) =>
      prev.length === allUniqueKeys.length ? [] : allUniqueKeys
    );
  };

  const toggleSelect = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const nextRows = parseInt(event.target.value, 10);
    setRowsPerPage(nextRows);
    setPage(0);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
        <Box
          sx={{
            p: 4,
            bgcolor: "#f8fafc",
            minHeight: "100vh",
            fontFamily: VPP_THEME.fontFamily,
          }}
        >
          {/* ── Page Header (VPP Style) ── */}
          <Box sx={{ mb: 4, animate: "fadeUp 0.4s ease both" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                mb: 0.5,
              }}
            >
              Check-in Suất ăn
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontWeight: 500,
                maxWidth: "600px",
                lineHeight: 1.6,
              }}
            >
              Quét mã QR hoặc nhập mã nhân viên để xác nhận bữa ăn
            </Typography>
          </Box>

          {/* ── Header Nav ── */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 0.5,
                px: 1,
                borderRadius: "100px",
                border: "1px solid #e2e8f0",
                bgcolor: "white",
              }}
            >
              <IconButton
                size="small"
                onClick={() => setDate((d) => d.subtract(1, "day"))}
              >
                <NavigateBefore />
              </IconButton>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  cursor: "pointer",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                <Box
                  sx={{
                    bgcolor: "#2563eb",
                    color: "white",
                    borderRadius: "8px",
                    px: 1,
                    py: 0.3,
                    fontSize: "10px",
                    fontWeight: 900,
                  }}
                >
                  Hôm nay
                </Box>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  format="dddd, DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      variant: "standard",
                      sx: {
                        "& .MuiInput-underline:before, & .MuiInput-underline:after":
                          { display: "none" },
                        "& input": {
                          p: 0,
                          fontWeight: 700,
                          fontSize: "14px",
                          width: 220,
                          color: "#1e293b",
                        },
                      },
                    },
                  }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => setDate((d) => d.add(1, "day"))}
              >
                <NavigateNext />
              </IconButton>
            </Paper>

            <Stack direction="row" spacing={1.5}>
              {MEAL_TABS.map((tab) => {
                const isActive = slot === tab.id;
                return (
                  <Paper
                    key={tab.id}
                    onClick={() => setSlot(tab.id)}
                    elevation={0}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      px: 2,
                      py: 0.8,
                      borderRadius: "100px",
                      cursor: "pointer",
                      border: isActive
                        ? "2px solid #10b981"
                        : "1px solid #e2e8f0",
                      bgcolor: isActive ? "#ecfdf5" : "white",
                      transition: "all 0.2s",
                    }}
                  >
                    <Box
                      sx={{
                        color: isActive ? "#10b981" : "#64748b",
                        display: "flex",
                      }}
                    >
                      {tab.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "13px",
                        color: isActive ? "#065f46" : "#64748b",
                      }}
                    >
                      {tab.label}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: isActive ? "#10b981" : "#f1f5f9",
                        color: isActive ? "white" : "#64748b",
                        borderRadius: "100px",
                        px: 1,
                        minWidth: 20,
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {tab.count}
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          {/* ── Stats Panels ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <StatCard
                label="Đăng ký"
                value={stats.total}
                sub="Tổng suất đăng ký bữa này"
                color="#3b82f6"
                icon={<MenuIcon />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                label="Đã sử dụng"
                value={stats.checked}
                sub="Nhân viên đã check-in"
                color="#10b981"
                icon={<CheckCircleIcon />}
                progress={stats.rate}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                label="Không đến"
                value={stats.absent}
                sub={`Thất thoát: ${stats.lossAmount.toLocaleString()} đ`}
                color="#ef4444"
                icon={<CancelIcon />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                label="Tỉ lệ sử dụng"
                value={`${stats.rate}%`}
                sub={`${stats.pending} chưa xác nhận`}
                color="#8b5cf6"
                icon={<MenuIcon />}
              />
            </Grid>
          </Grid>

          {/* ── Consolidated Filters ── */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 3,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Tìm mã và tên nhân viên"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: "white",
                  borderRadius: "10px",
                  width: 220,
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#e2e8f0" },
                },
              }}
            />

            <TextField
              select
              size="small"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              sx={{
                minWidth: 160,
                bgcolor: "white",
                borderRadius: "10px",
                "& fieldset": { borderColor: "#e2e8f0" },
              }}
              SelectProps={{ sx: { fontSize: "13px", fontWeight: 600 } }}
            >
              <MenuItem value="all">Tất cả bộ phận</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.code} value={d.code}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                minWidth: 160,
                bgcolor: "white",
                borderRadius: "10px",
                "& fieldset": { borderColor: "#e2e8f0" },
              }}
              SelectProps={{ sx: { fontSize: "13px", fontWeight: 600 } }}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="pending">Chưa xác nhận</MenuItem>
              <MenuItem value="checked">Đã ăn</MenuItem>
              <MenuItem value="absent">Vắng mặt</MenuItem>
            </TextField>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              disableElevation
              onClick={() => handleMarkSelected("checked")}
              disabled={!isEditAllowed}
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                px: 2,
                borderRadius: "8px",
                bgcolor: "#10b981",
                fontWeight: 700,
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              Đánh dấu tất cả đã ăn
            </Button>

            <Button
              variant="outlined"
              onClick={() => handleMarkSelected("absent")}
              disabled={!isEditAllowed}
              sx={{
                textTransform: "none",
                px: 2,
                borderRadius: "8px",
                color: "#ef4444",
                borderColor: "#ef4444",
                fontWeight: 700,
                "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" },
              }}
            >
              X Còn lại không đến
            </Button>

            <Button
              variant="outlined"
              onClick={handleExport}
              startIcon={<ExportIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                px: 2,
                borderRadius: "8px",
                color: "#1e293b",
                borderColor: "#e2e8f0",
                fontWeight: 700,
                bgcolor: "white",
              }}
            >
              Export
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate("/catering/reconciliation")}
              startIcon={<AssessmentIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                px: 2,
                borderRadius: "8px",
                bgcolor: "#2563eb",
                color: "white",
                fontWeight: 700,
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              Đối chiếu suất ăn
            </Button>
          </Box>

          {/* ── Table Container ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: `1px solid #e2e8f0`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              bgcolor: "white",
              overflow: "hidden",
            }}
          >
            {/* Bulk Actions overlay */}
            {selected.length > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#f1f5f9",
                  borderBottom: `1px solid #e2e8f0`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 800, color: "#2563eb" }}
                >
                  Đang chọn {selected.length} bản ghi
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={!isEditAllowed}
                  onClick={() => handleMarkSelected("checked")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "6px",
                  }}
                >
                  Xác nhận ăn
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  disabled={!isEditAllowed}
                  onClick={() => handleMarkSelected("absent")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "6px",
                  }}
                >
                  Báo vắng
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setSelected([])}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#64748b",
                  }}
                >
                  Hủy chọn
                </Button>
                {!isEditAllowed && (
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#ef4444" }}
                  >
                    (Quá 3 ngày, không thể đổi trạng thái)
                  </Typography>
                )}
              </Box>
            )}

            {/* Table Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "50px 140px 2fr 1.2fr 110px 100px 120px",
                bgcolor: "#f8fafc",
                px: 2,
                py: 2,
                borderBottom: `1px solid #e2e8f0`,
                columnGap: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Checkbox
                  size="small"
                  checked={
                    selected.length === filteredData.length &&
                    filteredData.length > 0
                  }
                  onChange={toggleAll}
                  sx={{ p: 0 }}
                />
              </Box>
              {[
                "Mã NV",
                "Họ tên",
                "Bộ phận",
                "Trạng thái",
                "Giờ xác nhận",
                "Thao tác",
              ].map((h, i) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textAlign: i >= 3 ? "center" : "left",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <Box sx={{ maxHeight: "calc(100vh - 460px)", overflowY: "auto" }}>
              {loading ? (
                <Box sx={{ p: 4 }}>
                  <LinearProgress />
                </Box>
              ) : filteredData.length === 0 ? (
                <Box sx={{ p: 10, textAlign: "center", color: "#94a3b8" }}>
                  <Typography fontWeight={700}>
                    Không có dữ liệu phù hợp
                  </Typography>
                </Box>
              ) : (
                paginatedData.map((item, idx) => {
                  const uniqueKey = `${item.registration_id}_${item.menu_id}`;
                  const isSelected = selected.includes(uniqueKey);
                  return (
                    <Box
                      key={uniqueKey}
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "50px 140px 2fr 1.2fr 110px 100px 120px",
                        alignItems: "center",
                        px: 2,
                        py: 1.5,
                        columnGap: 2,
                        bgcolor: isSelected ? "#f0f9ff" : "white",
                        borderBottom:
                          idx < paginatedData.length - 1
                            ? `1px solid #f1f5f9`
                            : "none",
                        "&:hover": {
                          bgcolor: isSelected ? "#e0f2fe" : "#f8fafc",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleSelect(uniqueKey)}
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        {item.id}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          overflow: "hidden",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: "12px",
                            fontWeight: 800,
                            bgcolor: "#f1f5f9",
                            color: "#2563eb",
                          }}
                        >
                          {item.name.charAt(0)}
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#64748b", fontSize: "13px" }}
                      >
                        {getDeptLabel(item)}
                      </Typography>
                      <Box sx={{ textAlign: "center" }}>
                        <StatusChip status={item.status} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          color: item.time
                            ? item.status === "absent"
                              ? "#dc2626"
                              : "#059669"
                            : "#94a3b8",
                          fontWeight: 800,
                          fontSize: "13px",
                        }}
                      >
                        {item.time || "—"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                      >
                        {item.status === "checked" ||
                        item.status === "absent" ? (
                          <Tooltip
                            title={
                              isEditAllowed
                                ? "Hoàn tác"
                                : "Quá 3 ngày, không thể đổi trạng thái"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={!isEditAllowed}
                                onClick={() =>
                                  handleMark(
                                    item.id,
                                    item.menu_id,
                                    item.registration_id,
                                    "pending"
                                  )
                                }
                                sx={{ color: "#94a3b8" }}
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip
                              title={
                                isEditAllowed
                                  ? "Đã ăn"
                                  : "Quá 3 ngày, không thể đổi trạng thái"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!isEditAllowed}
                                  onClick={() =>
                                    handleMark(
                                      item.id,
                                      item.menu_id,
                                      item.registration_id,
                                      "checked"
                                    )
                                  }
                                  sx={{
                                    color: "#10b981",
                                    bgcolor: "#f0fdf4",
                                    "&:hover": { bgcolor: "#dcfce7" },
                                  }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                isEditAllowed
                                  ? "Vắng"
                                  : "Quá 3 ngày, không thể đổi trạng thái"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!isEditAllowed}
                                  onClick={() =>
                                    handleMark(
                                      item.id,
                                      item.menu_id,
                                      item.registration_id,
                                      "absent"
                                    )
                                  }
                                  sx={{
                                    color: "#ef4444",
                                    bgcolor: "#fef2f2",
                                    "&:hover": { bgcolor: "#fee2e2" },
                                  }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Box>
            <Box
              sx={{
                borderTop: "1px solid #e2e8f0",
                bgcolor: "white",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="Hiển thị"
                sx={{
                  ".MuiTablePagination-toolbar": { px: 1.5, minHeight: "56px" },
                  ".MuiTablePagination-spacer": { flex: "0 0 auto" },
                }}
              />
            </Box>
          </Paper>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default CateringCheckIn;
