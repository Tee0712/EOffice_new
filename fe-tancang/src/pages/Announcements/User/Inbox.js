import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  AttachFileOutlined,
  CheckCircleOutline,
  Circle,
  Close,
  DoneAll,
  Download,
  NotificationsActive,
  Search,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import announcementService from "@services/announcementService";
import PriorityBadge from "../components/PriorityBadge";
import { useToast } from "@components/common/ToastProvider";
import RichTextRenderer from "../components/RichTextRenderer";

const STATUS = {
  ALL: "ALL",
  UNREAD: "UNREAD",
  CONFIRM: "CONFIRM",
  READ: "READ",
};

const CATEGORY_ALL = "__ALL__";
const GROUP_ORDER = ["HÔM NAY", "HÔM QUA", "TUẦN NÀY", "THÁNG NÀY", "CŨ HƠN"];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleString("vi-VN") : "-";
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatRelativeTime = (dateValue) => {
  const date = toDate(dateValue);
  if (!date) return "-";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes || 1} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

const getGroupLabel = (dateValue) => {
  const date = toDate(dateValue);
  if (!date) return "CŨ HƠN";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays <= 0) return "HÔM NAY";
  if (diffDays === 1) return "HÔM QUA";
  if (diffDays <= 7) return "TUẦN NÀY";

  if (
    startOfToday.getMonth() === startOfDate.getMonth() &&
    startOfToday.getFullYear() === startOfDate.getFullYear()
  ) {
    return "THÁNG NÀY";
  }

  return "CŨ HƠN";
};

const getSenderName = (item) =>
  item?.sender?.fullName ||
  item?.sender?.name ||
  item?.sender_name ||
  item?.author?.name ||
  "Hệ thống";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TB";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const getAvatarColor = (seed = "") => {
  const palette = [
    "#ff8a00",
    "#5b8def",
    "#ef476f",
    "#8a5cf6",
    "#00a896",
    "#2f80ed",
    "#f4a261",
  ];
  const hash = String(seed)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

const getIsConfirmed = (item) =>
  Boolean(
    item?.isConfirmed ??
    item?.confirmed ??
    item?.userConfirmed ??
    item?.confirmedAt ??
    item?.confirmed_at
  );

const normalizeInboxItem = (item, readIdSet, unreadIdSet) => {
  const id = item?.id || item?._id;
  const sentAt =
    item?.sentAt || item?.sent_at || item?.createdAt || item?.created_at;
  const senderName = getSenderName(item);
  const content = item?.content || item?.description || "";
  const title = item?.title || item?.subject || "(Không có tiêu đề)";
  const requireConfirm = Boolean(
    item?.requireConfirm ??
    item?.require_confirmation ??
    item?.requireConfirmation
  );
  const confirmed = getIsConfirmed(item);

  const isReadFromField =
    item?.isRead ?? item?.is_read ?? Boolean(item?.readAt || item?.read_at);
  const isRead = readIdSet.has(id) || (!unreadIdSet.has(id) && isReadFromField);

  const attachments = Array.isArray(item?.attachments) ? item.attachments : [];

  return {
    raw: item,
    id,
    title,
    content,
    excerpt: stripHtml(content).slice(0, 170) || "Không có nội dung tóm tắt.",
    category: item?.category || "Chung",
    priority: item?.priority || "normal",
    sentAt,
    relativeTime: formatRelativeTime(sentAt),
    senderName,
    senderAvatar: getInitials(senderName),
    senderColor: getAvatarColor(senderName || id),
    requireConfirm,
    isConfirmed: confirmed,
    isRead,
    hasAttachment: attachments.length > 0,
    groupLabel: getGroupLabel(sentAt),
  };
};

const tabConfig = [
  {
    value: STATUS.ALL,
    label: "Tất cả",
    icon: null,
  },
  {
    value: STATUS.UNREAD,
    label: "Chưa đọc",
    icon: <Circle sx={{ fontSize: 10, color: "#1d7dfa" }} />,
  },
  {
    value: STATUS.CONFIRM,
    label: "Cần xác nhận",
    icon: <WarningAmberOutlined sx={{ fontSize: 14, color: "#d97706" }} />,
  },
  {
    value: STATUS.READ,
    label: "Đã đọc",
    icon: <CheckCircleOutline sx={{ fontSize: 14, color: "#16a34a" }} />,
  },
];

const extractInboxPayload = (response) => {
  const payload = response?.items ? response : response?.data || {};
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const total = Number(payload?.total) || items.length;
  return { items, total };
};

const Inbox = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(STATUS.ALL);
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [allItems, setAllItems] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    read: 0,
    confirm: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(searchValue.trim()), 280);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const fetchAllInboxPages = useCallback(async (extraParams = {}) => {
    const limit = 200;
    const maxPages = 100;
    let page = 1;
    let total = 0;
    const items = [];

    while (page <= maxPages) {
      const response = await announcementService.getUserInbox({
        ...extraParams,
        page,
        limit,
      });
      const { items: pageItems, total: pageTotal } =
        extractInboxPayload(response);
      if (page === 1) {
        total = pageTotal;
      }

      items.push(...pageItems);

      if (pageItems.length < limit) break;
      if (total > 0 && items.length >= total) break;
      page += 1;
    }

    return { items, total: total || items.length };
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      setLoading(true);

      const allRes = await fetchAllInboxPages();

      const allRaw = allRes.items || [];
      const normalized = allRaw.map((item) =>
        normalizeInboxItem(item, new Set(), new Set())
      );

      const totalCount = Number(allRes.total) || normalized.length;
      const unreadCount = normalized.filter((item) => !item.isRead).length;
      const readCount = Math.max(0, totalCount - unreadCount);
      const confirmCount = normalized.filter(
        (item) => item.requireConfirm && !item.isConfirmed
      ).length;

      setAllItems(normalized);
      setCounts({
        total: totalCount,
        unread: unreadCount,
        read: readCount,
        confirm: confirmCount,
      });
    } catch (error) {
      setAllItems([]);
      setCounts({ total: 0, unread: 0, read: 0, confirm: 0 });
      toast("Không thể tải danh sách thông báo.", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchAllInboxPages, toast]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const loadDetail = useCallback(
    async (id) => {
      if (!id) return;
      try {
        setDetailLoading(true);
        const response =
          await announcementService.getInboxAnnouncementDetail(id);
        const detail = response?.data || response || null;
        setDetailData(detail);
      } catch (error) {
        toast("Không thể tải chi tiết thông báo.", "error");
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!allItems.length) {
      setSelectedId("");
      setDetailData(null);
      return;
    }
    const exists = allItems.some((x) => x.id === selectedId);
    if (!exists) {
      const nextId = allItems[0]?.id;
      if (nextId) {
        setSelectedId(nextId);
        loadDetail(nextId);
      }
    }
  }, [allItems, selectedId, loadDetail]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(allItems.map((item) => item.category).filter(Boolean))
    );
    return [CATEGORY_ALL, ...unique];
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let items = [...allItems];

    if (activeTab === STATUS.UNREAD)
      items = items.filter((item) => !item.isRead);
    if (activeTab === STATUS.READ) items = items.filter((item) => item.isRead);
    if (activeTab === STATUS.CONFIRM)
      items = items.filter((item) => item.requireConfirm && !item.isConfirmed);

    if (category !== CATEGORY_ALL) {
      items = items.filter((item) => item.category === category);
    }

    if (searchText) {
      const keyword = searchText.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(keyword) ||
          item.excerpt.toLowerCase().includes(keyword) ||
          item.senderName.toLowerCase().includes(keyword)
      );
    }

    items.sort((a, b) => {
      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (a.priority !== "urgent" && b.priority === "urgent") return 1;
      return (
        (toDate(b.sentAt)?.getTime() || 0) - (toDate(a.sentAt)?.getTime() || 0)
      );
    });

    return items;
  }, [activeTab, allItems, category, searchText]);

  const selectedItem = useMemo(
    () => allItems.find((item) => item.id === selectedId) || null,
    [allItems, selectedId]
  );

  const groupedItems = useMemo(() => {
    const groups = filteredItems.reduce((acc, item) => {
      if (!acc[item.groupLabel]) acc[item.groupLabel] = [];
      acc[item.groupLabel].push(item);
      return acc;
    }, {});

    return GROUP_ORDER.filter(
      (group) => Array.isArray(groups[group]) && groups[group].length > 0
    ).map((group) => ({
      label: group,
      items: groups[group],
    }));
  }, [filteredItems]);

  const handleTabChange = useCallback((_, value) => {
    setActiveTab(value);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCategoryChange = useCallback((event) => {
    setCategory(event.target.value);
  }, []);

  const handleCardClick = useCallback(
    (event) => {
      const { id } = event.currentTarget.dataset;
      if (!id) return;
      setSelectedId(id);
      setAllItems((prev) => {
        let changed = false;
        const next = prev.map((x) => {
          if (x.id === id && !x.isRead) {
            changed = true;
            return { ...x, isRead: true };
          }
          return x;
        });
        if (changed) {
          setCounts((current) => ({
            ...current,
            unread: Math.max(0, current.unread - 1),
            read: current.read + 1,
          }));
        }
        return next;
      });
      loadDetail(id);
    },
    [loadDetail]
  );

  const handleDownloadAttachment = useCallback(
    (file) => {
      const fileUrl = file?.fileUrl || file?.file_url;
      if (!fileUrl) {
        toast("Không tìm thấy đường dẫn tải tệp.", "warning");
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.download = file?.fileName || file?.file_name || "attachment";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    [toast]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      setMarkingAllRead(true);
      await announcementService.markAllRead();
      toast("Đã đánh dấu tất cả thông báo là đã đọc.", "success");
      await loadInbox();
    } catch (error) {
      toast("Không thể đánh dấu tất cả là đã đọc.", "error");
    } finally {
      setMarkingAllRead(false);
    }
  }, [loadInbox, toast]);

  return (
    <Box sx={{ bgcolor: "#edf1f6", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="xl" sx={{ maxWidth: "1540px !important" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                bgcolor: "#fbbf24",
                color: "#78350f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                mt: 0.5,
              }}
            >
              <NotificationsActive sx={{ fontSize: 20 }} />
              <Box
                sx={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  borderRadius: "999px",
                  bgcolor: "#ef4444",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.5,
                }}
              >
                {counts.unread}
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 34,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  color: "#0f2748",
                }}
              >
                Thông Báo Nội Bộ
              </Typography>
              <Typography
                sx={{
                  color: "#c2410c",
                  fontWeight: 600,
                  fontSize: 13.5,
                  mt: 0.4,
                }}
              >
                Bạn có {counts.unread} thông báo chưa đọc và {counts.confirm}{" "}
                cần xác nhận
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            onClick={handleMarkAllRead}
            disabled={markingAllRead || counts.unread === 0}
            startIcon={
              markingAllRead ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DoneAll />
              )
            }
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              borderColor: "#d0d7e2",
              color: "#344054",
              bgcolor: "#f7f9fc",
              fontWeight: 700,
              px: 1.8,
            }}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </Stack>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Card
            sx={{
              borderRadius: "14px",
              border: "1px solid #dbe3ef",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              overflow: "hidden",
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ px: 1.2, pt: 1.2, borderBottom: "1px solid #e6edf5" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  "& .MuiTabs-indicator": { height: 2.5, borderRadius: "6px" },
                }}
              >
                {tabConfig.map((tab) => {
                  const count =
                    tab.value === STATUS.ALL
                      ? counts.total
                      : tab.value === STATUS.UNREAD
                        ? counts.unread
                        : tab.value === STATUS.CONFIRM
                          ? counts.confirm
                          : counts.read;

                  return (
                    <Tab
                      key={tab.value}
                      value={tab.value}
                      sx={{ minHeight: 40, textTransform: "none", px: 1.2 }}
                      label={
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                          sx={{ fontWeight: 700, fontSize: 13 }}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                          <Box
                            sx={{
                              minWidth: 20,
                              height: 20,
                              borderRadius: "999px",
                              bgcolor: "#eef2f7",
                              color: "#445168",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: 0.7,
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            {count}
                          </Box>
                        </Stack>
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ p: 1.2, borderBottom: "1px solid #e6edf5" }}
            >
              <TextField
                size="small"
                fullWidth
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm thông báo..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: "#9aa7bb" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: "#f8fafc",
                  },
                }}
              />

              <Select
                size="small"
                value={category}
                onChange={handleCategoryChange}
                sx={{
                  minWidth: 150,
                  borderRadius: "10px",
                  bgcolor: "#f8fafc",
                  "& .MuiSelect-select": {
                    py: "8.5px",
                    fontWeight: 600,
                    color: "#344054",
                  },
                }}
              >
                {categoryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === CATEGORY_ALL ? "Tất cả" : option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {loading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 220 }}
              >
                <CircularProgress size={28} />
              </Stack>
            ) : groupedItems.length === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 220 }}
              >
                <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                  Không có thông báo phù hợp.
                </Typography>
              </Stack>
            ) : (
              <Box>
                {groupedItems.map((group) => (
                  <Box key={group.label}>
                    <Box
                      sx={{
                        height: 30,
                        px: 1.5,
                        bgcolor: "#f8fafd",
                        borderTop: "1px solid #edf2f8",
                        borderBottom: "1px solid #edf2f8",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          letterSpacing: 0.6,
                          color: "#90a0b7",
                          fontWeight: 800,
                        }}
                      >
                        {group.label}
                      </Typography>
                    </Box>

                    {group.items.map((item) => (
                      <Box
                        key={item.id}
                        data-id={item.id}
                        onClick={handleCardClick}
                        sx={{
                          px: 1.7,
                          py: 1.4,
                          borderBottom: "1px solid #edf2f8",
                          display: "flex",
                          gap: 1.3,
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                          position: "relative",
                          bgcolor:
                            selectedId === item.id ? "#eff6ff" : "transparent",
                          "&:hover": { bgcolor: "#f8fbff" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            pt: 0.7,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: item.isRead ? "#d1d9e6" : "#3b82f6",
                            }}
                          />
                        </Box>

                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: item.senderColor,
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            mt: 0.1,
                          }}
                        >
                          {item.senderAvatar}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Typography
                              sx={{
                                fontSize: 16,
                                fontWeight: item.isRead ? 700 : 800,
                                color: "#1f2937",
                                lineHeight: 1.3,
                                flex: 1,
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#94a3b8",
                                whiteSpace: "nowrap",
                                mt: 0.3,
                              }}
                            >
                              {item.relativeTime}
                            </Typography>
                          </Stack>

                          <Typography
                            sx={{
                              mt: 0.45,
                              color: "#64748b",
                              fontSize: 12.5,
                              lineHeight: 1.45,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {item.excerpt}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                            sx={{ mt: 0.8, flexWrap: "wrap", rowGap: 0.55 }}
                          >
                            <PriorityBadge
                              priority={item.priority}
                              size="small"
                            />
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                              }}
                            />

                            {item.requireConfirm && !item.isConfirmed && (
                              <Chip
                                icon={
                                  <WarningAmberOutlined
                                    sx={{
                                      fontSize: "13px !important",
                                      color: "#b45309",
                                    }}
                                  />
                                }
                                label="Cần xác nhận"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: "#fef3c7",
                                  color: "#92400e",
                                  "& .MuiChip-icon": { ml: 0.5 },
                                }}
                              />
                            )}

                            <Typography
                              sx={{ color: "#94a3b8", fontSize: 11.5 }}
                            >
                              •
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11.5, color: "#64748b" }}
                            >
                              {item.senderName}
                            </Typography>

                            {item.hasAttachment && (
                              <Stack
                                direction="row"
                                spacing={0.3}
                                alignItems="center"
                                sx={{ color: "#64748b" }}
                              >
                                <AttachFileOutlined sx={{ fontSize: 13 }} />
                                <Typography sx={{ fontSize: 11.5 }}>
                                  Tệp đính kèm
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            )}
          </Card>

          <Paper
            sx={{
              width: { xs: "100%", lg: 430 },
              borderRadius: "14px",
              border: "1px solid #dbe3ef",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              p: 1.5,
              position: { xs: "static", lg: "sticky" },
              top: 16,
            }}
          >
            {detailLoading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 220 }}
              >
                <CircularProgress size={24} />
              </Stack>
            ) : !detailData ? (
              <Typography sx={{ color: "#64748b", fontSize: 13.5 }}>
                Chọn một thông báo để xem chi tiết.
              </Typography>
            ) : (
              <Stack spacing={1.3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={0.7}>
                    <PriorityBadge
                      priority={detailData?.priority || "normal"}
                      size="small"
                    />
                    <Chip
                      size="small"
                      label={detailData?.category || "Chung"}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  </Stack>
                  <IconButton size="small" onClick={() => setDetailData(null)}>
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 30,
                    lineHeight: 1.15,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {detailData?.title || "(Không có tiêu đề)"}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    detailData?.id &&
                    navigate(`/user/announcements/${detailData.id}`)
                  }
                  sx={{
                    alignSelf: "flex-start",
                    textTransform: "none",
                    borderRadius: "999px",
                    fontWeight: 700,
                  }}
                >
                  Mở trang chi tiết
                </Button>

                <Card
                  variant="outlined"
                  sx={{ p: 1.2, borderRadius: "10px", borderColor: "#e2e8f0" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "#ff8a00",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(getSenderName(detailData))}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {getSenderName(detailData)}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>
                        {formatDateTime(
                          detailData?.sentAt ||
                            detailData?.sent_at ||
                            detailData?.createdAt
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                <Box sx={{ maxHeight: 360, overflowY: "auto", pr: 0.5 }}>
                  <RichTextRenderer
                    html={detailData?.content || ""}
                    sx={{ color: "#334155", fontSize: 14, lineHeight: 1.7 }}
                  />
                </Box>

                <Divider />

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: "10px",
                    borderColor: "#e2e8f0",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#64748b",
                      mb: 0.8,
                    }}
                  >
                    TRẠNG THÁI
                  </Typography>
                  <Stack spacing={0.6}>
                    <Stack direction="row" spacing={0.7} alignItems="center">
                      <Circle sx={{ fontSize: 8, color: "#22c55e" }} />
                      <Typography sx={{ fontSize: 12.5, color: "#334155" }}>
                        Đã nhận:{" "}
                        {formatDateTime(
                          selectedItem?.sentAt ||
                            detailData?.sentAt ||
                            detailData?.sent_at
                        )}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.7} alignItems="center">
                      <Circle
                        sx={{
                          fontSize: 8,
                          color: selectedItem?.isRead ? "#3b82f6" : "#94a3b8",
                        }}
                      />
                      <Typography sx={{ fontSize: 12.5, color: "#334155" }}>
                        Đã đọc:{" "}
                        {selectedItem?.isRead
                          ? formatDateTime(
                              selectedItem?.raw?.readAt ||
                                selectedItem?.raw?.read_at ||
                                detailData?.readAt ||
                                detailData?.read_at ||
                                new Date()
                            )
                          : "Chưa đọc"}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                <Typography
                  sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}
                >
                  TỆP ĐÍNH KÈM (
                  {Array.isArray(detailData?.attachments)
                    ? detailData.attachments.length
                    : 0}
                  )
                </Typography>
                {Array.isArray(detailData?.attachments) &&
                detailData.attachments.length > 0 ? (
                  <Stack spacing={0.8}>
                    {detailData.attachments.map((file) => (
                      <Card
                        key={file?.id || file?.fileUrl || file?.fileName}
                        variant="outlined"
                        sx={{ p: 0.9, borderRadius: "10px" }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#334155",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              mr: 1,
                            }}
                          >
                            {file?.fileName || "Tệp đính kèm"}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ color: "#2563eb" }}
                            onClick={() => handleDownloadAttachment(file)}
                          >
                            <Download sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                    Không có tệp đính kèm.
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        </Stack>

        {!!filteredItems.length && (
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: 12,
              textAlign: "center",
              mt: 1.2,
            }}
          >
            Hiển thị {filteredItems.length} thông báo
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default Inbox;
