import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
} from "@mui/material";
import {
  ArrowBack,
  BarChart,
  CheckBoxOutlineBlank,
  CheckCircle,
  Download,
  Edit,
  MenuBook,
  NotificationsActive,
  Search,
  TimerOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import announcementService from "@services/announcementService";
import RichTextRenderer from "../components/RichTextRenderer";
import PriorityBadge from "../components/PriorityBadge";
import { useToast } from "@components/common/ToastProvider";
import * as XLSX from "xlsx";

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "read", label: "Đã đọc" },
  { value: "confirmed", label: "Xác nhận" },
  { value: "unread", label: "Chưa đọc" },
];

const safeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTime = (value) => {
  const d = safeDate(value);
  return d ? d.toLocaleString("vi-VN") : "-";
};

const formatRelative = (value) => {
  const d = safeDate(value);
  if (!d) return "-";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour)
    return `${Math.max(1, Math.floor(diff / minute))} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  return `${Math.floor(diff / day)} ngày trước`;
};

const formatReadDuration = (sentAt, readAt) => {
  const start = safeDate(sentAt);
  const end = safeDate(readAt);
  if (!start || !end) return "-";
  const hour = Math.max(
    0,
    (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  );
  return `${hour.toFixed(1)}h`;
};

const getDepartment = (user) => {
  if (!user) return "-";
  if (typeof user.parent === "object" && user.parent?.name)
    return user.parent.name;
  if (typeof user.parent === "string") return user.parent;
  return user.organization_name || "-";
};

const getFullName = (row) =>
  row?.user?.name || row?.user?.fullName || row?.userId || "-";
const getRoleName = (row) =>
  row?.user?.position || row?.user?.role || "Nhân viên";

const cardStyle = {
  p: 2,
  borderRadius: 3,
  border: "1px solid #dbe3ef",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
};

const AnnouncementStatsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState(null);
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0, rate: 0 });
  const [readStatus, setReadStatus] = useState([]);

  const [activeTab, setActiveTab] = useState("read-status");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [detailRes, statRes, readRes] = await Promise.all([
        announcementService.getAdminAnnouncementById(id),
        announcementService.getAnnouncementStatistics(id),
        announcementService.getAnnouncementReadStatus(id),
      ]);

      setAnnouncement(detailRes?.data || detailRes || null);
      setStats(
        statRes?.data || statRes || { total: 0, read: 0, unread: 0, rate: 0 }
      );
      const rows = readRes?.data || readRes || [];
      setReadStatus(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error(error);
      toast("Không thể tải dữ liệu chi tiết thông báo.", "error");
      setAnnouncement(null);
      setReadStatus([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const sentAt =
    announcement?.sentAt ||
    announcement?.sent_at ||
    announcement?.createdAt ||
    announcement?.created_at;
  const readRate = Math.min(Math.max(Number(stats?.rate || 0), 0), 100);
  const confirmedCount = useMemo(
    () =>
      readStatus.filter((item) =>
        Boolean(item.confirmedAt || item.confirmed_at)
      ).length,
    [readStatus]
  );
  const unreadCount = Number(stats?.unread || 0);

  const avgReadHours = useMemo(() => {
    if (!sentAt) return "-";
    const durations = readStatus
      .filter((item) => item.readAt || item.read_at)
      .map((item) => {
        const end = item.readAt || item.read_at;
        const startDate = safeDate(sentAt);
        const endDate = safeDate(end);
        if (!startDate || !endDate) return null;
        return Math.max(
          0,
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
        );
      })
      .filter((x) => Number.isFinite(x));

    if (!durations.length) return "-";
    return `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)}h`;
  }, [readStatus, sentAt]);

  const departmentOptions = useMemo(() => {
    const values = new Set(readStatus.map((item) => getDepartment(item.user)));
    return Array.from(values).filter((x) => x && x !== "-");
  }, [readStatus]);

  const filteredRows = useMemo(() => {
    return readStatus.filter((item) => {
      const name = String(getFullName(item)).toLowerCase();
      const department = getDepartment(item.user);
      const isRead = Boolean(item.readAt || item.read_at);
      const isConfirmed = Boolean(item.confirmedAt || item.confirmed_at);
      const keyword = searchText.trim().toLowerCase();

      const statusMatched =
        statusFilter === "all" ||
        (statusFilter === "read" && isRead) ||
        (statusFilter === "unread" && !isRead) ||
        (statusFilter === "confirmed" && isConfirmed);
      const departmentMatched =
        !departmentFilter || department === departmentFilter;
      const searchMatched = !keyword || name.includes(keyword);

      return statusMatched && departmentMatched && searchMatched;
    });
  }, [readStatus, statusFilter, departmentFilter, searchText]);

  const handleSendReminder = async () => {
    if (!id) return;
    try {
      setSendingReminder(true);
      const res = await announcementService.sendReminders(id);
      const count = Number(
        res?.sentRemindersCount ?? res?.data?.sentRemindersCount ?? 0
      );
      toast(`Đã gửi nhắc nhở cho ${count} người chưa đọc.`, "success");
    } catch (error) {
      toast("Không thể gửi nhắc nhở.", "error");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleExport = () => {
    if (!readStatus || readStatus.length === 0) {
      toast("Không có dữ liệu để xuất.", "warning");
      return;
    }
    try {
      const exportData = readStatus.map((row, index) => {
        const isRead = Boolean(row.readAt || row.read_at);
        const isConfirmed = Boolean(row.confirmedAt || row.confirmed_at);
        const readTime = row.readAt || row.read_at;
        return {
          STT: index + 1,
          "Mã nhân viên": row.user?.code || "-",
          "Họ và tên": getFullName(row),
          "Chức vụ": getRoleName(row),
          "Phòng ban": getDepartment(row.user),
          "Trạng thái": isRead ? "Đã đọc" : "Chưa đọc",
          "Xác nhận": isConfirmed ? "Đã xác nhận" : "Chưa xác nhận",
          "Thời gian đọc": formatDateTime(readTime),
          "Đọc sau gửi": isRead ? formatReadDuration(sentAt, readTime) : "-",
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chi tiết đọc");

      const fileName = `Bao_cao_thong_bao_${id || "danh_sach"}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      toast("Có lỗi xảy ra khi xuất báo cáo.", "error");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!announcement) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Không tìm thấy thông báo.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/announcements")}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f1f5f9", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2.2 }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{ mb: 0.6 }}
          >
            <IconButton
              size="small"
              onClick={() => navigate("/admin/announcements")}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography
              sx={{ fontSize: 12.5, color: "#64748b", fontWeight: 700 }}
            >
              {announcement.id}
            </Typography>
            <PriorityBadge priority={announcement.priority} size="small" />
            <Chip
              size="small"
              color="success"
              label="Đã gửi"
              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
            />
            {announcement.isPinned && (
              <Chip
                size="small"
                color="warning"
                label="Ghim"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Stack>
          <Typography
            sx={{
              fontSize: 38,
              lineHeight: 1.08,
              fontWeight: 800,
              color: "#0f172a",
              maxWidth: 880,
            }}
          >
            {announcement.title}
          </Typography>
          <Stack direction="row" spacing={1.4} sx={{ mt: 1.2 }}>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={handleExport}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Xuất báo cáo
            </Button>
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={() => navigate(`/admin/announcements/create?id=${id}`)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Chỉnh sửa
            </Button>
          </Stack>
        </Box>
        <Button
          startIcon={<NotificationsActive />}
          variant="contained"
          color="warning"
          disabled={sendingReminder || unreadCount <= 0}
          onClick={handleSendReminder}
          sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 800 }}
        >
          Nhắc nhở ({unreadCount})
        </Button>
      </Stack>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
        }}
      >
        <Card sx={{ ...cardStyle, bgcolor: "#eef2ff" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckBoxOutlineBlank fontSize="small" />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Tổng người nhận
            </Typography>
          </Stack>
          <Typography
            sx={{ mt: 0.4, fontSize: 42, fontWeight: 800, color: "#4f46e5" }}
          >
            {stats.total}
          </Typography>
        </Card>

        <Card sx={{ ...cardStyle, bgcolor: "#eff6ff" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <MenuBook fontSize="small" />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Đã đọc
            </Typography>
          </Stack>
          <Typography
            sx={{ mt: 0.4, fontSize: 42, fontWeight: 800, color: "#2563eb" }}
          >
            {stats.read}
          </Typography>
        </Card>

        <Card sx={{ ...cardStyle, bgcolor: "#ecfdf5" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircle fontSize="small" />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Đã xác nhận
            </Typography>
          </Stack>
          <Typography
            sx={{ mt: 0.4, fontSize: 42, fontWeight: 800, color: "#16a34a" }}
          >
            {confirmedCount}
          </Typography>
        </Card>

        <Card sx={{ ...cardStyle, bgcolor: "#fef2f2" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberOutlined fontSize="small" />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Chưa đọc
            </Typography>
          </Stack>
          <Typography
            sx={{ mt: 0.4, fontSize: 42, fontWeight: 800, color: "#ef4444" }}
          >
            {stats.unread}
          </Typography>
        </Card>

        <Card sx={{ ...cardStyle, bgcolor: "#fefce8" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TimerOutlined fontSize="small" />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              TG đọc TB
            </Typography>
          </Stack>
          <Typography
            sx={{ mt: 0.4, fontSize: 42, fontWeight: 800, color: "#f59e0b" }}
          >
            {avgReadHours}
          </Typography>
        </Card>
      </Box>

      <Paper sx={{ p: 2, borderRadius: "16px", border: "1px solid #dbe3ef" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 1.5 }}
        >
          <Tab
            value="read-status"
            icon={<CheckCircle fontSize="small" />}
            iconPosition="start"
            label="Theo dõi trạng thái đọc"
            sx={{ textTransform: "none", fontWeight: 700 }}
          />
          <Tab
            value="content"
            icon={<MenuBook fontSize="small" />}
            iconPosition="start"
            label="Nội dung thông báo"
            sx={{ textTransform: "none", fontWeight: 700 }}
          />
          <Tab
            value="stats"
            icon={<BarChart fontSize="small" />}
            iconPosition="start"
            label="Thống kê chi tiết"
            sx={{ textTransform: "none", fontWeight: 700 }}
          />
        </Tabs>

        {activeTab === "content" && (
          <Box sx={{ p: 1.2 }}>
            <RichTextRenderer html={announcement.content || ""} />
          </Box>
        )}

        {activeTab === "stats" && (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            <Card sx={cardStyle}>
              <Typography
                sx={{ fontSize: 34, fontWeight: 800, color: "#2563eb" }}
              >
                {readRate.toFixed(1)}%
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                Tỷ lệ đọc
              </Typography>
            </Card>
            <Card sx={cardStyle}>
              <Typography
                sx={{ fontSize: 34, fontWeight: 800, color: "#16a34a" }}
              >
                {stats.total
                  ? ((confirmedCount / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                Tỷ lệ xác nhận
              </Typography>
            </Card>
            <Card sx={cardStyle}>
              <Typography
                sx={{ fontSize: 34, fontWeight: 800, color: "#f59e0b" }}
              >
                {avgReadHours}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                Thời gian đọc trung bình
              </Typography>
            </Card>
          </Box>
        )}

        {activeTab === "read-status" && (
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ mb: 1.5, rowGap: 1 }}
            >
              {STATUS_FILTERS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  color={statusFilter === item.value ? "primary" : "default"}
                  variant={statusFilter === item.value ? "filled" : "outlined"}
                  onClick={() => setStatusFilter(item.value)}
                  size="small"
                />
              ))}

              <Select
                size="small"
                value={departmentFilter}
                displayEmpty
                onChange={(e) => setDepartmentFilter(e.target.value)}
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">Tất cả phòng ban</MenuItem>
                {departmentOptions.map((dep) => (
                  <MenuItem key={dep} value={dep}>
                    {dep}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                size="small"
                placeholder="Tìm kiếm CBCNV..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />,
                }}
                sx={{ minWidth: 250 }}
              />
            </Stack>

            <Box
              sx={{
                mb: 2,
                p: 1.2,
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748b",
                  mb: 0.6,
                  fontWeight: 700,
                }}
              >
                Tiến độ đọc tổng thể
              </Typography>
              <Box
                sx={{
                  height: 9,
                  borderRadius: 5,
                  bgcolor: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{ width: `${readRate}%`, height: 9, bgcolor: "#3b82f6" }}
                />
              </Box>
              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: 12,
                  color: "#3b82f6",
                  fontWeight: 700,
                }}
              >
                {stats.read}/{stats.total}
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" />
                    </TableCell>
                    <TableCell>CBCNV</TableCell>
                    <TableCell>Phòng ban</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thời gian đọc</TableCell>
                    <TableCell>Đọc sau gửi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => {
                    const isRead = Boolean(row.readAt || row.read_at);
                    const isConfirmed = Boolean(
                      row.confirmedAt || row.confirmed_at
                    );
                    const rowReadAt = row.readAt || row.read_at;

                    return (
                      <TableRow key={row.id}>
                        <TableCell padding="checkbox">
                          <Checkbox size="small" />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{ width: 30, height: 30, fontSize: 12 }}
                            >
                              {getFullName(row).charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {getFullName(row)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {getRoleName(row)}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{getDepartment(row.user)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.6}>
                            <Chip
                              size="small"
                              color={isRead ? "primary" : "default"}
                              label={isRead ? "Đã đọc" : "Chưa đọc"}
                            />
                            {isConfirmed && (
                              <Chip
                                size="small"
                                color="success"
                                label="Đã xác nhận"
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                            {formatDateTime(rowReadAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                            {formatRelative(rowReadAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatReadDuration(sentAt, rowReadAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredRows.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnnouncementStatsDetail;
