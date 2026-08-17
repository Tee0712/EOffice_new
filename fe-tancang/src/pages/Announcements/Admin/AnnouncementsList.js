import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  BarChart,
  Campaign,
  CheckCircleOutline,
  DeleteOutline,
  Edit,
  ErrorOutline,
  GridView,
  MoreVert,
  PushPin,
  Search,
  Send,
  TrendingUp,
  ViewList,
  Visibility,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import announcementService from "@services/announcementService";
import { useToast } from "@components/common/ToastProvider";
import PriorityBadge from "../components/PriorityBadge";

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả danh mục" },
  { value: "Chung", label: "Chung" },
  { value: "Hành chính", label: "Hành chính" },
  { value: "Kỹ thuật", label: "Kỹ thuật" },
  { value: "Nhân sự", label: "Nhân sự" },
  { value: "Tài chính", label: "Tài chính" },
  { value: "Đào tạo", label: "Đào tạo" },
  { value: "An toàn lao động", label: "An toàn lao động" },
  { value: "Sự kiện", label: "Sự kiện" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả ưu tiên" },
  { value: "low", label: "Thấp" },
  { value: "normal", label: "Bình thường" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

const STATUS_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "draft", label: "Nháp" },
  { value: "scheduled", label: "Lên lịch" },
  { value: "sent", label: "Đã gửi" },
  { value: "expired", label: "Hết hạn" },
];

const statusMeta = {
  draft: { color: "default", label: "Nháp" },
  scheduled: { color: "warning", label: "Lên lịch" },
  sent: { color: "success", label: "Đã gửi" },
  expired: { color: "error", label: "Hết hạn" },
};

const LIST_PAGE_LIMIT = 200;
const LIST_MAX_PAGES = 100;

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTime = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleString("vi-VN") : "-";
};

const formatRelative = (value) => {
  const d = toDate(value);
  if (!d) return "-";
  const diff = Date.now() - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour)
    return `${Math.max(1, Math.floor(diff / minute))} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

const formatRatePercent = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  return num.toFixed(digits).replace(/\.?0+$/, "");
};

const normalizeAnnouncement = (row) => {
  const status = String(row?.status || "draft").toLowerCase();
  const sentAt =
    row?.sentAt || row?.sent_at || row?.createdAt || row?.created_at;
  const recipientTotal = Number(
    row?.recipientCount ??
      row?.recipient_count ??
      row?.totalRecipients ??
      row?.total_receivers ??
      0
  );
  const readRate = Number(row?.readRate ?? row?.read_rate ?? 0);
  const readCount =
    recipientTotal > 0
      ? Math.round((recipientTotal * readRate) / 100)
      : Number(row?.readCount || 0);

  return {
    ...row,
    status,
    sentAt,
    recipientTotal: recipientTotal || 0,
    readRate: Number.isFinite(readRate) ? readRate : 0,
    readCount: Number.isFinite(readCount) ? readCount : 0,
  };
};

const AnnouncementsList = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let page = 1;
      let total = 0;
      const collected = [];

      while (page <= LIST_MAX_PAGES) {
        const params = {
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          search: searchText || undefined,
          page,
          limit: LIST_PAGE_LIMIT,
        };

        const response =
          await announcementService.getAdminAnnouncements(params);
        const payload = response?.items ? response : response?.data || {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        if (page === 1) {
          total = Number(payload?.total) || 0;
        }

        collected.push(...items);

        if (items.length < LIST_PAGE_LIMIT) break;
        if (total > 0 && collected.length >= total) break;
        page += 1;
      }

      const normalized = collected.map(normalizeAnnouncement);
      setData(normalized);
      setSelectedIds([]);
    } catch (error) {
      console.error("Fetch announcements error:", error);
      setData([]);
      setSelectedIds([]);
      toast("Không thể tải danh sách thông báo.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, priorityFilter, searchText]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const stats = useMemo(() => {
    const countBy = (status) => data.filter((x) => x.status === status).length;
    const rates = data
      .map((x) => Number(x.readRate))
      .filter((x) => Number.isFinite(x));
    const avgRate = rates.length
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0;
    return {
      total: data.length,
      draft: countBy("draft"),
      scheduled: countBy("scheduled"),
      sent: countBy("sent"),
      expired: countBy("expired"),
      avgRate,
    };
  }, [data]);

  const statCards = [
    {
      key: "ALL",
      label: "Tổng thông báo",
      value: stats.total,
      color: "#1976d2",
    },
    { key: "draft", label: "Nháp", value: stats.draft, color: "#6b7280" },
    {
      key: "scheduled",
      label: "Đã lên lịch",
      value: stats.scheduled,
      color: "#f59e0b",
    },
    { key: "sent", label: "Đã gửi", value: stats.sent, color: "#16a34a" },
    {
      key: "expired",
      label: "Hết hạn",
      value: stats.expired,
      color: "#dc2626",
    },
    {
      key: "READ_RATE",
      label: "Tỷ lệ đọc TB",
      value: `${formatRatePercent(stats.avgRate)}%`,
      color: "#0f766e",
    },
  ];

  const filteredData = useMemo(() => {
    const rows =
      activeTab === "ALL"
        ? data
        : data.filter((item) => item.status === activeTab);
    return [...rows].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        (toDate(b.sentAt)?.getTime() || 0) - (toDate(a.sentAt)?.getTime() || 0)
      );
    });
  }, [activeTab, data]);

  const handlePinToggle = async (row) => {
    try {
      await announcementService.togglePinAnnouncement(row.id, !row.isPinned);
      toast(
        row.isPinned ? "Đã bỏ ghim thông báo." : "Đã ghim thông báo.",
        "success"
      );
      fetchData();
    } catch (error) {
      console.error(error);
      toast("Không thể thay đổi trạng thái ghim.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await announcementService.deleteAnnouncement(id);
      toast("Đã xóa thông báo.", "success");
      fetchData();
    } catch (error) {
      console.error(error);
      toast("Không thể xóa thông báo.", "error");
    }
  };

  const handleRemind = async (id) => {
    try {
      const res = await announcementService.sendReminders(id);
      const count = Number(
        res?.sentRemindersCount ?? res?.data?.sentRemindersCount ?? 0
      );
      toast(`Đã gửi nhắc nhở cho ${count} người chưa đọc.`, "success");
    } catch (error) {
      console.error(error);
      toast("Không thể gửi nhắc nhở.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(
        selectedIds.map((id) => announcementService.deleteAnnouncement(id))
      );
      toast(`Đã xóa ${selectedIds.length} thông báo.`, "success");
      fetchData();
    } catch (error) {
      console.error(error);
      toast("Có lỗi khi xóa hàng loạt.", "error");
    }
  };

  const handleBulkRemind = async () => {
    const sentRows = filteredData.filter(
      (x) => selectedIds.includes(x.id) && x.status === "sent"
    );
    if (!sentRows.length) {
      toast("Chỉ có thể nhắc nhở các thông báo đã gửi.", "warning");
      return;
    }
    try {
      await Promise.all(
        sentRows.map((row) => announcementService.sendReminders(row.id))
      );
      toast(`Đã gửi nhắc nhở cho ${sentRows.length} thông báo.`, "success");
    } catch (error) {
      console.error(error);
      toast("Không thể gửi nhắc nhở hàng loạt.", "error");
    }
  };

  const openRowMenu = (event, row) => {
    setActionAnchor(event.currentTarget);
    setActionRow(row);
  };

  const closeRowMenu = () => {
    setActionAnchor(null);
    setActionRow(null);
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={800} color="primary">
          Quản lý Thông báo
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/admin/announcements/create")}
          sx={{
            borderRadius: "10px",
            px: 3,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: 3,
          }}
        >
          Tạo thông báo mới
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={2} key={card.label}>
            <Card
              onClick={() => {
                if (card.key !== "READ_RATE") setActiveTab(card.key);
              }}
              sx={{
                p: 2,
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                cursor: card.key !== "READ_RATE" ? "pointer" : "default",
                boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ color: card.color }}
              >
                {card.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                {card.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: "16px", mb: 3 }}>
        <Box
          sx={{
            borderBottom: "1px solid #e5e7eb",
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                value={tab.value}
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
            ))}
          </Tabs>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ mr: 1 }}
          >
            <ToggleButton value="list">
              <ViewList fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid">
              <GridView fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ p: 2 }}
          alignItems="center"
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Tìm theo tiêu đề, mã, tác giả..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ width: 330 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            {PRIORITY_OPTIONS.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={fetchData}
            sx={{ textTransform: "none" }}
          >
            Tìm
          </Button>
        </Stack>

        {!!selectedIds.length && (
          <Stack direction="row" spacing={1} sx={{ px: 2, pb: 2 }}>
            <Chip label={`Đã chọn ${selectedIds.length}`} color="primary" />
            <Button
              size="small"
              variant="outlined"
              onClick={handleBulkRemind}
              sx={{ textTransform: "none" }}
            >
              Gửi nhắc nhở hàng loạt
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              sx={{ textTransform: "none" }}
            >
              Xóa hàng loạt
            </Button>
          </Stack>
        )}
      </Card>

      {viewMode === "grid" ? (
        <Grid container spacing={2}>
          {filteredData.map((row) => (
            <Grid item xs={12} md={6} lg={4} key={row.id}>
              <Card
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  border: "1px solid #e6edf7",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: "#e6f0ff", color: "#1d4ed8" }}>
                      <Campaign />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        onClick={() =>
                          navigate(`/admin/announcements/${row.id}/stats`)
                        }
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          cursor: "pointer",
                          "&:hover": {
                            color: "primary.main",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {row.isPinned && (
                          <PushPin
                            sx={{ fontSize: 14, color: "primary.main" }}
                          />
                        )}
                        {row.title || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(row.sentAt)}
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small" onClick={(e) => openRowMenu(e, row)}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1.5, mb: 1 }}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <PriorityBadge priority={row.priority} />
                  <Chip
                    size="small"
                    label={row.category || "Chung"}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    color={statusMeta[row.status]?.color || "default"}
                    label={statusMeta[row.status]?.label || row.status}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {row.recipientTotal} người nhận · Đọc{" "}
                  {formatRatePercent(row.readRate)}%
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #dbe4f0",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f4f8ff" }}>
                <TableRow>
                  <TableCell width={48}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredData.length
                      }
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? filteredData.map((x) => x.id) : []
                        )
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Thông báo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người nhận</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tỷ lệ đọc</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 8, color: "text.secondary" }}
                    >
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}

                {filteredData.map((row) => {
                  const senderName =
                    row?.author?.name || row?.sender?.name || "Hệ thống";
                  const readRate = Math.min(
                    Math.max(Number(row.readRate) || 0, 0),
                    100
                  );

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => {
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, row.id]
                                : prev.filter((x) => x !== row.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              bgcolor: "#e6f0ff",
                              color: "#1d4ed8",
                              width: 38,
                              height: 38,
                            }}
                          >
                            <Campaign fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              onClick={() =>
                                navigate(`/admin/announcements/${row.id}/stats`)
                              }
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: "pointer",
                                "&:hover": {
                                  color: "primary.main",
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              {row.isPinned && (
                                <PushPin
                                  sx={{ fontSize: 14, color: "primary.main" }}
                                />
                              )}
                              {row.title || "-"}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.8}
                              alignItems="center"
                              sx={{ mt: 0.4 }}
                            >
                              <PriorityBadge priority={row.priority} />
                              <Chip
                                size="small"
                                label={row.category || "Chung"}
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                bởi {senderName}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={statusMeta[row.status]?.color || "default"}
                          label={statusMeta[row.status]?.label || row.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDateTime(row.sentAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelative(row.sentAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.readCount}/{row.recipientTotal}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              height: 6,
                              width: 80,
                              bgcolor: "#e5e7eb",
                              borderRadius: 4,
                            }}
                          >
                            <Box
                              sx={{
                                height: 6,
                                width: `${readRate}%`,
                                bgcolor: "#1d4ed8",
                                borderRadius: 4,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight={700}>
                            {formatRatePercent(readRate)}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(`/admin/announcements/${row.id}/stats`)
                            }
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={row.isPinned ? "Bỏ ghim" : "Ghim"}>
                          <IconButton
                            size="small"
                            onClick={() => handlePinToggle(row)}
                          >
                            <PushPin fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => openRowMenu(e, row)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={closeRowMenu}
      >
        <MenuItem
          onClick={() => {
            navigate(`/admin/announcements/${actionRow?.id}/stats`);
            closeRowMenu();
          }}
        >
          <Visibility fontSize="small" sx={{ mr: 1 }} /> Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/admin/announcements/create?id=${actionRow?.id}`);
            closeRowMenu();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} /> Chỉnh sửa
        </MenuItem>
        <MenuItem
          disabled={actionRow?.status !== "sent"}
          onClick={() => {
            if (actionRow?.id) handleRemind(actionRow.id);
            closeRowMenu();
          }}
        >
          <Send fontSize="small" sx={{ mr: 1 }} /> Gửi nhắc nhở
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionRow?.id) handleDelete(actionRow.id);
            closeRowMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutline fontSize="small" sx={{ mr: 1 }} /> Xóa
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AnnouncementsList;
