import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ArticleOutlined,
  CheckBoxOutlined,
  DeleteOutline,
  EditOutlined,
  InsightsOutlined,
  LocalFireDepartmentOutlined,
  MoreHoriz,
  SettingsOutlined,
  Search,
  SyncRounded,
  Visibility,
  WarningAmberRounded,
  FileUploadOutlined,
  CheckBoxOutlineBlank,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  deleteEvent,
  getEventSummary,
  getEvents,
} from "@services/eventManagementService";

import { styled, alpha } from "@mui/material/styles";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả", lifecycle: undefined },
  { value: "UPCOMING", label: "Sắp diễn ra", lifecycle: "UPCOMING" },
  { value: "ONGOING", label: "Đang diễn ra", lifecycle: "ONGOING" },
  { value: "COMPLETED", label: "Đã kết thúc", lifecycle: "COMPLETED" },
];

const EVENT_TYPE_STYLES = {
  "Kỷ niệm": { color: "#e11d48", bg: "#fff1f2" },
  "Hội nghị": { color: "#2563eb", bg: "#eff6ff" },
  "Khánh thành": { color: "#d97706", bg: "#fffbeb" },
  "Đào tạo": { color: "#059669", bg: "#ecfdf5" },
  "Ký kết": { color: "#475569", bg: "#f8fafc" },
  "Thể thao": { color: "#0891b2", bg: "#ecfeff" },
  Khác: { color: "#64748b", bg: "#f1f5f9" },
};

const WORKFLOW_MAP = {
  RUNNING: { label: "Đang chạy", color: "#15803D", bg: "#DCFCE7" },
  CREATED: { label: "Đã tạo", color: "#A16207", bg: "#FEF9C3" },
  DONE: { label: "Hoàn tất", color: "#166534", bg: "#DCFCE7" },
  NOT_CREATED: { label: "Chưa tạo", color: "#525252", bg: "#E5E5E5" },
};

const EVENT_STATUS_STYLES = {
  UPCOMING: { label: "Sắp diễn ra", color: "#1D4ED8", bg: "#DBEAFE" },
  ONGOING: { label: "Đang diễn ra", color: "#047857", bg: "#D1FAE5" },
  COMPLETED: { label: "Đã kết thúc", color: "#6B7280", bg: "#E5E7EB" },
};

// Styled Components for Modern UI (ASXH Synchronized)
const ModernCard = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  backgroundColor: "#ffffff",
}));

const StatCard = styled(ModernCard)(({ theme }) => ({
  padding: "16px 20px",
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "16px",
}));

const IconWrapper = styled(Box)(({ color }) => ({
  width: "48px",
  height: "48px",
  borderRadius: "10px",
  backgroundColor: alpha(color, 0.1),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& .MuiSvgIcon-root": {
    fontSize: "24px",
    color: color,
  },
}));

const SegmentedTabs = styled(Box)(({ theme }) => ({
  display: "flex",
  backgroundColor: "#f1f5f9",
  padding: "4px",
  borderRadius: "10px",
  gap: "2px",
}));

const TabButton = styled(Button)(({ active }) => ({
  borderRadius: "8px",
  padding: "4px 14px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "13px",
  backgroundColor: active ? "#ffffff" : "transparent",
  color: active ? "#0f172a" : "#64748b",
  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
  minWidth: "auto",
  "&:hover": {
    backgroundColor: active ? "#ffffff" : alpha("#64748b", 0.05),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "12px",
  padding: "8px 18px",
  fontWeight: 600,
  fontSize: "14px",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": { boxShadow: "none" },
}));

const StyledTableCell = styled(TableCell)(({ theme, isheader }) => ({
  padding: theme.spacing(1.5),
  fontSize: isheader ? "13px" : "14px",
  fontWeight: isheader ? 600 : 400,
  color: isheader ? "#64748b" : "#0f172a",
  backgroundColor: isheader ? "#f8f9fb" : "inherit",
  borderBottom: "1px solid #f1f5f9",
}));

const ColorfulPill = styled(Box)(({ color, bgcolor }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 700,
  color: color,
  backgroundColor: bgcolor,
  gap: "6px",
  "&:before": {
    content: '""',
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: color,
  },
}));

const WorkflowBadge = ({ variant }) => {
  const styles = {
    RUNNING: {
      bg: "#16a34a",
      color: "#fff",
      label: "Đang chạy",
      icon: <SyncRounded sx={{ fontSize: 14 }} />,
    },
    CREATED: {
      bg: "#facc15",
      color: "#854d0e",
      label: "Đã tạo",
      icon: <Add sx={{ fontSize: 14 }} />,
    },
    DONE: {
      bg: "#059669",
      color: "#fff",
      label: "Hoàn tất",
      icon: <CheckBoxOutlined sx={{ fontSize: 14 }} />,
    },
    NOT_CREATED: {
      bg: "transparent",
      color: "#94a3b8",
      label: "Chưa tạo",
      border: "1px solid #e2e8f0",
      icon: <CheckBoxOutlineBlank sx={{ fontSize: 14 }} />,
    },
  };
  const s = styles[variant] || styles.NOT_CREATED;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 700,
        backgroundColor: s.bg,
        color: s.color,
        border: s.border || "none",
        gap: "6px",
        "& svg": { display: "flex" },
      }}
    >
      {s.icon} {s.label}
    </Box>
  );
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
};

const formatDateRange = (start, end) => {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText === "--" && endText === "--") return "--";
  if (!end || endText === "--") return startText;
  return startText === endText ? startText : `${startText} - ${endText}`;
};

const normalizeEventStatus = (item) => {
  const now = Date.now();
  const start = item?.startDatetime
    ? new Date(item.startDatetime).getTime()
    : null;
  const end = item?.endDatetime ? new Date(item.endDatetime).getTime() : null;

  if (item?.status === "ONGOING") return "ONGOING";
  if (item?.status === "COMPLETED" || item?.status === "CANCELLED")
    return "COMPLETED";

  if (start && start > now) return "UPCOMING";
  if (start && end && start <= now && end >= now) return "ONGOING";
  if (end && end < now) return "COMPLETED";

  return "UPCOMING";
};

const normalizeWorkflow = (item) => {
  const raw = String(item?.coordinationStatus || "").toUpperCase();
  if (WORKFLOW_MAP[raw]) return raw;

  const normalizedStatus = normalizeEventStatus(item);
  if (normalizedStatus === "ONGOING") return "RUNNING";
  if (normalizedStatus === "COMPLETED") return "DONE";
  return "NOT_CREATED";
};

const EventList = () => {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    upcoming30Days: 0,
    ongoing: 0,
    checklistPending: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  const requestParams = useMemo(() => {
    const statusMeta = STATUS_FILTERS.find(
      (item) => item.value === statusFilter
    );
    const params = {
      page: page - 1,
      size: PAGE_SIZE,
      year: selectedYear,
    };

    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (statusMeta?.lifecycle) params.lifecycle = statusMeta.lifecycle;
    if (selectedType && selectedType !== "ALL") params.type = selectedType;

    return params;
  }, [debouncedKeyword, page, selectedType, selectedYear, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, selectedType, selectedYear, debouncedKeyword]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [listRes, summaryRes] = await Promise.all([
          getEvents(requestParams),
          getEventSummary(requestParams),
        ]);

        const items = Array.isArray(listRes?.data) ? listRes.data : [];
        setEvents(items);
        setTotal(Number(listRes?.pagination?.total || 0));

        setSummary({
          total: Number(summaryRes?.data?.total || 0),
          upcoming30Days: Number(summaryRes?.data?.upcoming30Days || 0),
          ongoing: Number(summaryRes?.data?.ongoing || 0),
          checklistPending: Number(summaryRes?.data?.checklistPending || 0),
        });
      } catch (fetchError) {
        setEvents([]);
        setTotal(0);
        setSummary({
          total: 0,
          upcoming30Days: 0,
          ongoing: 0,
          checklistPending: 0,
        });
        setError("Không tải được dữ liệu sự kiện từ API.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestParams, reloadKey]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    events.forEach((item) => {
      if (item?.eventType) set.add(item.eventType);
    });
    return ["ALL", ...Array.from(set)];
  }, [events]);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).sort(
        (a, b) => b - a
      ),
    [currentYear]
  );

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const goTo = (path) => {
    if (selectedRow?.id) {
      navigate(path.replace(":id", selectedRow.id));
    }
    handleMenuClose();
  };

  const handleDeleteEvent = async () => {
    if (!selectedRow?.id) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sự kiện "${selectedRow?.name || ""}"?`
    );
    if (!confirmed) return;

    try {
      await deleteEvent(selectedRow.id);
      handleMenuClose();
      setReloadKey((prev) => prev + 1);
    } catch (e) {
      handleMenuClose();
      setError("Không thể xóa sự kiện. Vui lòng thử lại.");
    }
  };

  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(events.map((row) => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const batchActionsActive = selectedIds.length > 0;

  const dashboardCards = [
    {
      key: "total",
      icon: <ArticleOutlined />,
      value: summary.total,
      label: `Tổng sự kiện năm ${selectedYear}`,
      color: "#1D4ED8",
    },
    {
      key: "upcoming",
      icon: <LocalFireDepartmentOutlined />,
      value: summary.upcoming30Days,
      label: "Sắp diễn ra (30 ngày tới)",
      color: "#B91C1C",
    },
    {
      key: "ongoing",
      icon: <SyncRounded />,
      value: summary.ongoing,
      label: "Đang có quy trình phối hợp",
      color: "#0B5CAD",
    },
    {
      key: "checklist",
      icon: <WarningAmberRounded />,
      value: summary.checklistPending,
      label: "Checklist chưa hoàn thành",
      color: "#D97706",
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "#f4f7fa",
        minHeight: "100vh",
        fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
        "& *": { fontFamily: "inherit" },
      }}
    >
      {/* 1. Header Section */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        mb={3}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}
          >
            Danh sách Sự kiện
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hệ thống theo dõi và quản lý toàn bộ sự kiện và quy trình phối hợp
            tổ chức tập trung.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ActionButton
            variant="outlined"
            startIcon={<FileUploadOutlined />}
            sx={{
              borderColor: "grey.300",
              bgcolor: "background.paper",
              color: "text.secondary",
              "&:hover": { bgcolor: "grey.50" },
            }}
            onClick={() => alert("Đang phát triển mẫu ASXH!")}
          >
            Xuất báo cáo
          </ActionButton>
          <ActionButton
            variant="contained"
            disableElevation
            startIcon={<Add />}
            sx={{ bgcolor: "#255df2", "&:hover": { bgcolor: "#1d4ed8" } }}
            onClick={() => navigate("/event-management/events/create")}
          >
            Tạo sự kiện mới
          </ActionButton>
        </Stack>
      </Stack>

      {/* 2. Stats Section */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} mb={3}>
        {dashboardCards.map((card) => (
          <StatCard key={card.key}>
            <IconWrapper color={card.color}>{card.icon}</IconWrapper>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                color="#0f172a"
                lineHeight={1.1}
              >
                {card.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                sx={{ mt: 0.5, display: "block" }}
              >
                {card.label}
              </Typography>
            </Box>
          </StatCard>
        ))}
      </Stack>

      {/* 3. Standardized Filter Bar (ASXH Style) */}
      <Box
        sx={{
          mb: 1.5,
          p: 1.5,
          bgcolor: "white",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={1.5}
          alignItems={{ xl: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography
              variant="caption"
              fontWeight={700}
              color="#475569"
              sx={{ fontSize: 13 }}
            >
              Trạng thái:
            </Typography>
            <SegmentedTabs>
              {STATUS_FILTERS.map((item) => (
                <TabButton
                  key={item.value}
                  active={statusFilter === item.value}
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                </TabButton>
              ))}
            </SegmentedTabs>
          </Stack>

          <Box sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo tên hoặc mã sự kiện..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#94a3b8", fontSize: "1.1rem" }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: "10px",
                  bgcolor: "#f0f2f5",
                  height: "40px",
                  fontSize: 14,
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>

          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              select
              sx={{
                minWidth: 170,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  height: "40px",
                  fontSize: 14,
                  bgcolor: "#f8f9fb",
                },
              }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {typeOptions.map((item) => (
                <MenuItem key={item} value={item} sx={{ fontSize: 13 }}>
                  {item === "ALL" ? "Tất cả loại sự kiện" : item}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              select
              sx={{
                minWidth: 110,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  height: "40px",
                  fontSize: 14,
                  bgcolor: "#f8f9fb",
                },
              }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year} sx={{ fontSize: 13 }}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {/* 4. Main Event List Table */}
      <ModernCard>
        <Box
          sx={{
            px: 2,
            py: 1.8,
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "60px",
          }}
        >
          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: "#0f172a" }}
            >
              Danh sách sự kiện
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hiển thị {events.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(page * PAGE_SIZE, total)} của {total} sự kiện
            </Typography>
          </Box>

          {batchActionsActive && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="caption" fontWeight={700} color="#0f172a">
                {selectedIds.length} sự kiện đã chọn
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<SyncRounded />}
                sx={{
                  bgcolor: "#059669",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#047857", boxShadow: "none" },
                }}
              >
                Tạo quy trình phối hợp
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArticleOutlined />}
                sx={{
                  color: "#475569",
                  borderColor: "grey.300",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                }}
              >
                Tạo thông báo
              </Button>
            </Stack>
          )}
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <StyledTableCell isheader="true" sx={{ width: 48, pl: 3 }}>
                  <input
                    type="checkbox"
                    style={{ width: 17, height: 17, cursor: "pointer" }}
                    checked={
                      events.length > 0 && selectedIds.length === events.length
                    }
                    onChange={handleSelectAll}
                  />
                </StyledTableCell>
                <StyledTableCell isheader="true">
                  TÊN SỰ KIỆN / MÃ
                </StyledTableCell>
                <StyledTableCell isheader="true">LOẠI HÌNH</StyledTableCell>
                <StyledTableCell isheader="true">THỜI GIAN</StyledTableCell>
                <StyledTableCell isheader="true">ĐỊA ĐIỂM</StyledTableCell>
                <StyledTableCell isheader="true">
                  QUY TRÌNH PHỐI HỢP
                </StyledTableCell>
                <StyledTableCell isheader="true" sx={{ width: "15%" }}>
                  TIẾN ĐỘ CHECKLIST
                </StyledTableCell>
                <StyledTableCell isheader="true">TRẠNG THÁI</StyledTableCell>
                <StyledTableCell
                  isheader="true"
                  align="center"
                  sx={{ pr: 3, width: 120 }}
                >
                  THAO TÁC
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <StyledTableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Đang tải dữ liệu...
                    </Typography>
                  </StyledTableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <StyledTableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không tìm thấy sự kiện nào
                    </Typography>
                  </StyledTableCell>
                </TableRow>
              ) : (
                events.map((row) => {
                  const eventType = row.eventType || "Khác";
                  const pillStyle =
                    EVENT_TYPE_STYLES[eventType] || EVENT_TYPE_STYLES["Khác"];
                  const statusStyle =
                    EVENT_STATUS_STYLES[normalizeEventStatus(row)];
                  const workflowKey = normalizeWorkflow(row);
                  const checklistProgress = Number(row.checklistProgress);
                  const isSelected = selectedIds.includes(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: isSelected
                          ? alpha("#255df2", 0.03)
                          : "inherit",
                        "& td": {
                          borderBottom: "1px solid",
                          borderColor: "grey.100",
                        },
                        "&:last-child td": { border: 0 },
                      }}
                    >
                      <StyledTableCell sx={{ pl: 3 }}>
                        <input
                          type="checkbox"
                          style={{ width: 17, height: 17, cursor: "pointer" }}
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#0f172a" }}
                        >
                          {row.name || "--"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "monospace", letterSpacing: 0.5 }}
                        >
                          {row.code || "--"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <ColorfulPill
                          color={pillStyle.color}
                          bgcolor={pillStyle.bg}
                        >
                          {eventType}
                        </ColorfulPill>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          {formatDateRange(row.startDatetime, row.endDatetime)}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="#475569">
                          {row.location || "--"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <WorkflowBadge variant={workflowKey} />
                      </StyledTableCell>
                      <StyledTableCell>
                        {Number.isFinite(checklistProgress) ? (
                          <Box sx={{ width: "100%" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: "text.primary" }}
                              >
                                {Math.round(checklistProgress)}%
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Hoàn thành
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.max(
                                0,
                                Math.min(100, checklistProgress)
                              )}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: "#f1f5f9",
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 3,
                                  bgcolor:
                                    checklistProgress === 100
                                      ? "#7c3aed"
                                      : "#2563eb",
                                },
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ fontWeight: 500 }}
                          >
                            Chưa có checklist
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: statusStyle.color,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: statusStyle.color, fontWeight: 600 }}
                          >
                            {statusStyle.label}
                          </Typography>
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell align="center" sx={{ pr: 3 }}>
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, row)}
                          sx={{
                            color: "#475569",
                            "&:hover": { bgcolor: alpha("#475569", 0.1) },
                          }}
                        >
                          <MoreHoriz />
                        </IconButton>
                      </StyledTableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Global Pagination Footer */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid",
            borderColor: "grey.100",
            bgcolor: "#fff",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Hiển thị {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} -{" "}
            {Math.min(page * PAGE_SIZE, total)} của {total} bản ghi
          </Typography>
          <Pagination
            count={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            page={page}
            onChange={(e, p) => setPage(p)}
            color="primary"
            shape="rounded"
            size="small"
            sx={{
              "& .MuiPaginationItem-root": { fontWeight: 600 },
              "& .Mui-selected": { bgcolor: "#255df2 !important" },
            }}
          />
        </Box>
      </ModernCard>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        elevation={2}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "12px",
            minWidth: 180,
            p: 1,
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              py: 1,
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#475569",
              "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
              "& .MuiListItemIcon-root": {
                minWidth: "32px !important",
                color: "#94a3b8",
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => goTo("/event-management/events/:id")}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          Xem quy trình
        </MenuItem>
        <MenuItem
          onClick={() =>
            goTo("/event-management/interaction-stats?eventId=:id")
          }
        >
          <ListItemIcon>
            <InsightsOutlined fontSize="small" />
          </ListItemIcon>
          Thống kê tương tác
        </MenuItem>
        <MenuItem
          onClick={() => goTo("/event-management/events/:id/checklist/create")}
        >
          <ListItemIcon>
            <CheckBoxOutlined fontSize="small" />
          </ListItemIcon>
          Checklist
        </MenuItem>
        <MenuItem
          onClick={() => goTo("/event-management/events/create?id=:id")}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Chỉnh sửa
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() =>
            goTo("/event-management/events/:id?mode=create-process")
          }
        >
          <ListItemIcon>
            <SettingsOutlined fontSize="small" />
          </ListItemIcon>
          Tạo quy trình
        </MenuItem>
        <MenuItem
          onClick={handleDeleteEvent}
          sx={{ color: "#dc2626 !important" }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" sx={{ color: "#dc2626" }} />
          </ListItemIcon>
          Xóa sự kiện
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EventList;
