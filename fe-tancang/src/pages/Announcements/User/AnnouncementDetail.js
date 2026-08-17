import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AttachFileOutlined,
  CheckCircle,
  ChatBubbleOutline,
  Download,
  NavigateNext,
  WarningAmber,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RichTextRenderer from "../components/RichTextRenderer";
import PriorityBadge from "../components/PriorityBadge";
import announcementService from "@services/announcementService";
import { useToast } from "@components/common/ToastProvider";

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = safeDate(value);
  return date ? date.toLocaleString("vi-VN") : "-";
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getSenderName = (data) =>
  data?.sender?.fullName || data?.sender?.name || data?.sender || "Hệ thống";
const getSenderRole = (data) =>
  data?.sender?.position || data?.sender?.role || "-";
const getSenderDepartment = (data) =>
  data?.sender?.parent?.name || data?.sender?.organization_name || "-";

const getRequireConfirm = (data) =>
  Boolean(
    data?.requireConfirm ??
    data?.require_confirmation ??
    data?.requireConfirmation
  );

const getConfirmed = (data) =>
  Boolean(data?.isConfirmed ?? data?.confirmedAt ?? data?.confirmed_at);

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TB";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const downloadAttachment = (file, toast) => {
  const fileUrl = file?.fileUrl || file?.file_url || file?.url;
  if (!fileUrl) {
    toast("Không tìm thấy đường dẫn tệp đính kèm.", "warning");
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.download = file?.fileName || file?.file_name || file?.name || "attachment";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const sideCardSx = {
  borderRadius: "14px",
  border: "1px solid #dde6f0",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
  p: 2,
};

const statusRowSx = {
  display: "flex",
  gap: 1.2,
  alignItems: "flex-start",
};

const StatusItem = ({ title, subtitle, active = true }) => (
  <Box sx={statusRowSx}>
    <CheckCircle
      sx={{ color: active ? "#16a34a" : "#cbd5e1", fontSize: 19, mt: 0.12 }}
    />
    <Box>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: active ? "#166534" : "#94a3b8",
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: "#94a3b8", mt: 0.15 }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

const AnnouncementDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [neighbors, setNeighbors] = useState({ prevId: null, nextId: null });
  const [confirming, setConfirming] = useState(false);
  const [togglingComment, setTogglingComment] = useState(false);
  const commentSectionRef = useRef(null);

  const isAdminRoute =
    location.pathname.startsWith("/admin/announcements/") ||
    (location.pathname.includes("/admin/") &&
      !location.pathname.startsWith("/user/"));
  const backPath = isAdminRoute ? "/admin/announcements" : "/user/inbox";

  const fetchDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [detailRes, neighborRes] = await Promise.all([
        isAdminRoute
          ? announcementService.getAdminAnnouncementById(id)
          : announcementService.getInboxAnnouncementDetail(id),
        !isAdminRoute
          ? announcementService.getNavigationNeighbors(id)
          : Promise.resolve({}),
      ]);

      const detail = detailRes?.data || detailRes || null;
      setData(detail);

      const nav = neighborRes?.data || neighborRes || {};
      setNeighbors({
        prevId: nav?.prevId || nav?.previousId || null,
        nextId: nav?.nextId || null,
      });
    } catch (error) {
      setData(null);
      toast("Không thể tải chi tiết thông báo.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, isAdminRoute, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const view = useMemo(() => {
    if (!data) return null;

    const attachments = toArray(data.attachments);
    const sentAt =
      data?.sentAt || data?.sent_at || data?.createdAt || data?.created_at;
    const requireConfirm = getRequireConfirm(data);
    const confirmed = getConfirmed(data);

    return {
      attachments,
      sentAt,
      senderName: getSenderName(data),
      senderRole: getSenderRole(data),
      senderDepartment: getSenderDepartment(data),
      requireConfirm,
      isConfirmed: confirmed,
      category: data?.category || "Chung",
      priority: data?.priority || "normal",
    };
  }, [data]);

  const relatedItems = useMemo(
    () => toArray(data?.related || []).slice(0, 3),
    [data]
  );
  const comments = useMemo(
    () => toArray(data?.comments || data?.commentList || data?.feedbacks || []),
    [data]
  );
  const allowComment = Boolean(data?.allowComment ?? data?.allow_comment);
  const showConfirmAction = !isAdminRoute && !view?.isConfirmed;

  const handleBack = useCallback(() => {
    navigate(backPath);
  }, [backPath, navigate]);

  const handlePrev = useCallback(() => {
    if (neighbors.prevId) navigate(`/user/announcements/${neighbors.prevId}`);
  }, [navigate, neighbors.prevId]);

  const handleNext = useCallback(() => {
    if (neighbors.nextId) navigate(`/user/announcements/${neighbors.nextId}`);
  }, [navigate, neighbors.nextId]);

  const handleConfirm = useCallback(async () => {
    if (!id) return;

    try {
      setConfirming(true);
      await announcementService.confirmAnnouncementRead(id);

      setData((prev) => ({
        ...prev,
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
      }));

      toast("Đã xác nhận đã đọc thông báo.", "success");
    } catch (error) {
      toast("Không thể xác nhận thông báo.", "error");
    } finally {
      setConfirming(false);
    }
  }, [id, toast]);

  const handleRelatedClick = useCallback(
    (event) => {
      const { id: relatedId } = event.currentTarget.dataset;
      if (relatedId) navigate(`/user/announcements/${relatedId}`);
    },
    [navigate]
  );

  const handleViewComments = useCallback(() => {
    if (!allowComment && !isAdminRoute) {
      toast("Thông báo này không cho phép bình luận.", "info");
      return;
    }
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [allowComment, isAdminRoute, toast]);

  const handleToggleComment = useCallback(async () => {
    if (!isAdminRoute || !id) return;
    try {
      setTogglingComment(true);
      const next = !allowComment;
      await announcementService.toggleCommentAnnouncement(id, next);
      setData((prev) => ({ ...prev, allowComment: next, allow_comment: next }));
      toast(
        next
          ? "Đã bật bình luận cho thông báo."
          : "Đã tắt bình luận cho thông báo.",
        "success"
      );
    } catch (error) {
      toast("Không thể cập nhật cấu hình bình luận.", "error");
    } finally {
      setTogglingComment(false);
    }
  }, [allowComment, id, isAdminRoute, toast]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "58vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !view) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <Typography sx={{ fontSize: 21, fontWeight: 800, color: "#0f2748" }}>
            Không tìm thấy thông báo
          </Typography>
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Quay lại
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#edf1f6",
        minHeight: "100vh",
        pb: view.requireConfirm && !view.isConfirmed ? 12 : 5,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 3.1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.2 }}
        >
          <Breadcrumbs
            separator={<NavigateNext sx={{ fontSize: 15 }} />}
            sx={{ "& .MuiTypography-root": { fontSize: 13.5 } }}
          >
            <Link
              onClick={handleBack}
              underline="hover"
              sx={{
                cursor: "pointer",
                color: "#2864f0",
                fontWeight: 700,
                fontSize: 13.5,
              }}
            >
              Thông báo
            </Link>
            <Typography
              sx={{ color: "#607089", fontWeight: 700, fontSize: 13.5 }}
            >
              {data.id}
            </Typography>
          </Breadcrumbs>

          {!isAdminRoute && (
            <Stack direction="row" spacing={0.6}>
              <Button
                size="small"
                variant="outlined"
                onClick={handlePrev}
                disabled={!neighbors.prevId}
                sx={{
                  textTransform: "none",
                  minWidth: 62,
                  borderRadius: "8px",
                  borderColor: "#d2dae6",
                  color: "#7b8798",
                }}
              >
                Trước
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleNext}
                disabled={!neighbors.nextId}
                sx={{
                  textTransform: "none",
                  minWidth: 54,
                  borderRadius: "8px",
                  borderColor: "#d2dae6",
                  color: "#344054",
                  fontWeight: 700,
                }}
              >
                Sau
              </Button>
            </Stack>
          )}
        </Stack>

        <Grid container spacing={2.2}>
          <Grid item xs={12} lg={8.3}>
            <Paper
              sx={{
                borderRadius: "14px",
                border: "1px solid #dde6f0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ borderTop: "4px solid #fb7185", p: 2.2 }}>
                <Stack
                  direction="row"
                  spacing={0.7}
                  sx={{ mb: 1.35, flexWrap: "wrap", rowGap: 0.55 }}
                >
                  <PriorityBadge priority={view.priority} size="small" />
                  <Chip
                    size="small"
                    label={view.category}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                    }}
                  />
                  <Chip
                    size="small"
                    label="Đã gửi"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: "#d1fae5",
                      color: "#166534",
                    }}
                  />
                  {view.requireConfirm && (
                    <Chip
                      size="small"
                      label="Cần xác nhận đã đọc"
                      sx={{
                        height: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: "#fef3c7",
                        color: "#92400e",
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  sx={{
                    fontSize: 41,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.05,
                    mb: 1.8,
                  }}
                >
                  {data.title}
                </Typography>

                <Box
                  sx={{
                    borderRadius: "11px",
                    border: "1px solid #e4ebf4",
                    bgcolor: "#f8fafc",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#ef476f",
                      width: 38,
                      height: 38,
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {getInitials(view.senderName)}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}
                    >
                      {view.senderName}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11.5 }}>
                      {view.senderRole} · {view.senderDepartment}
                    </Typography>
                  </Box>

                  <Box sx={{ ml: "auto", textAlign: "right" }}>
                    <Typography
                      sx={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}
                    >
                      Hom qua
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11 }}>
                      {formatDateTime(view.sentAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {showConfirmAction && (
                <Box sx={{ px: 2.2, pb: 2.2 }}>
                  <Box
                    sx={{
                      borderRadius: "12px",
                      border: "1px solid #f3d37a",
                      bgcolor: "#fff7d6",
                      p: 1.35,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <WarningAmber sx={{ color: "#ca8a04", fontSize: 21 }} />
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#9a6700",
                          }}
                        >
                          Thông báo này yêu cầu xác nhận đã đọc
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#9a6700" }}>
                          Vui lòng đọc kỹ nội dung và bấm xác nhận bên dưới
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="contained"
                      onClick={handleConfirm}
                      disabled={confirming}
                      sx={{
                        textTransform: "none",
                        borderRadius: "999px",
                        px: 2,
                        py: 0.7,
                        bgcolor: "#16a34a",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Xác nhận đã đọc
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ px: 2.2, pb: 1.8 }}>
                <Box
                  sx={{
                    borderRadius: "12px",
                    border: "1px solid #e7edf5",
                    bgcolor: "#ffffff",
                    p: 2,
                  }}
                >
                  <RichTextRenderer
                    html={data.content || ""}
                    sx={{ color: "#334155", fontSize: 14.5, lineHeight: 1.7 }}
                  />
                </Box>
              </Box>

              <Box sx={{ px: 2.2, pb: 2.2 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1f2937",
                    mb: 1.05,
                  }}
                >
                  Tệp đính kèm ({view.attachments.length})
                </Typography>

                {!view.attachments.length ? (
                  <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                    Không có tệp đính kèm.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {view.attachments.map((file) => {
                      const fileId =
                        file.id || file.fileId || file.url || file.name;
                      return (
                        <Card
                          key={fileId}
                          variant="outlined"
                          sx={{
                            borderRadius: "10px",
                            borderColor: "#dce4ef",
                            p: 1.1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                bgcolor: "#eff6ff",
                                color: "#2563eb",
                              }}
                            >
                              <AttachFileOutlined sx={{ fontSize: 17 }} />
                            </Avatar>
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 13.5,
                                  color: "#1f2937",
                                }}
                              >
                                {file.fileName || file.name || "Tệp đính kèm"}
                              </Typography>
                              <Typography
                                sx={{ color: "#94a3b8", fontSize: 11.5 }}
                              >
                                {file.fileType || file.size || "-"}
                              </Typography>
                            </Box>
                          </Stack>

                          <IconButton
                            size="small"
                            sx={{ color: "#2563eb" }}
                            onClick={() => downloadAttachment(file, toast)}
                          >
                            <Download sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <Box ref={commentSectionRef} sx={{ px: 2.2, pb: 2.2 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1f2937",
                    mb: 1.05,
                  }}
                >
                  Bình luận ({comments.length})
                </Typography>
                {!allowComment ? (
                  <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                    Thông báo này không cho phép bình luận.
                  </Typography>
                ) : !comments.length ? (
                  <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                    Chưa có bình luận nào.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {comments.map((item, idx) => (
                      <Card
                        key={
                          item?.id || `${item?.author?.id || "author"}-${idx}`
                        }
                        variant="outlined"
                        sx={{ p: 1.2, borderColor: "#dce4ef" }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 13.5,
                            color: "#1f2937",
                          }}
                        >
                          {item?.author?.name ||
                            item?.authorName ||
                            "Người dùng"}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 12.5, color: "#334155", mt: 0.25 }}
                        >
                          {item?.content ||
                            item?.comment ||
                            item?.message ||
                            "(Không có nội dung)"}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11.5, color: "#94a3b8", mt: 0.3 }}
                        >
                          {formatDateTime(
                            item?.createdAt || item?.created_at || item?.time
                          )}
                        </Typography>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={3.7}>
            <Stack spacing={1.8}>
              <Paper sx={sideCardSx}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#4b5563",
                    letterSpacing: 0.45,
                    mb: 1.4,
                  }}
                >
                  TRẠNG THÁI CỦA BẠN
                </Typography>

                <Stack spacing={1.25}>
                  <StatusItem
                    title="Đã nhận"
                    subtitle={formatDateTime(view.sentAt)}
                    active
                  />
                  <Divider
                    sx={{ borderStyle: "dashed", borderColor: "#e5eaf3" }}
                  />
                  <StatusItem title="Đã đọc" subtitle="Vừa xong" active />
                  <Divider
                    sx={{ borderStyle: "dashed", borderColor: "#e5eaf3" }}
                  />
                  <StatusItem
                    title="Đã xác nhận"
                    subtitle={
                      view.isConfirmed
                        ? formatDateTime(data.confirmedAt || data.confirmed_at)
                        : "Chờ xác nhận"
                    }
                    active={view.isConfirmed}
                  />
                </Stack>
              </Paper>

              <Paper sx={sideCardSx}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#4b5563",
                    letterSpacing: 0.45,
                    mb: 1.2,
                  }}
                >
                  THÔNG TIN
                </Typography>

                <Stack spacing={0.85}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                      Mã thông báo
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}
                    >
                      {data.id}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                      Đối tượng
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}
                    >
                      {data.targetSummary || "Toàn công ty"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                      Ngày gửi
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}
                    >
                      {formatDateTime(view.sentAt)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                      Tệp đính kèm
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}
                    >
                      {view.attachments.length} tệp
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                      Bình luận
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}
                    >
                      {allowComment ? "Cho phép" : "Không cho phép"}
                    </Typography>
                  </Stack>
                </Stack>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ChatBubbleOutline sx={{ fontSize: 18 }} />}
                  onClick={handleViewComments}
                  disabled={!allowComment && !isAdminRoute}
                  sx={{
                    mt: 1.5,
                    textTransform: "none",
                    borderRadius: "9px",
                    fontWeight: 700,
                  }}
                >
                  Xem bình luận
                </Button>
                {showConfirmAction && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={confirming}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      borderRadius: "9px",
                      fontWeight: 800,
                      bgcolor: "#16a34a",
                    }}
                  >
                    Xác nhận đã đọc thông báo
                  </Button>
                )}
                {isAdminRoute && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleToggleComment}
                    disabled={togglingComment}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      borderRadius: "9px",
                      fontWeight: 700,
                    }}
                  >
                    {allowComment ? "Tắt bình luận" : "Bật bình luận"}
                  </Button>
                )}
              </Paper>

              <Paper sx={sideCardSx}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#4b5563",
                    letterSpacing: 0.45,
                    mb: 1.1,
                  }}
                >
                  THÔNG BÁO LIÊN QUAN
                </Typography>

                {relatedItems.length ? (
                  <Stack spacing={0.8}>
                    {relatedItems.map((item) => (
                      <Box
                        key={item.id}
                        data-id={item.id}
                        onClick={handleRelatedClick}
                        sx={{
                          borderRadius: "10px",
                          border: "1px solid #e6edf5",
                          p: 1,
                          cursor: "pointer",
                          bgcolor: "#f8fafc",
                          "&:hover": {
                            bgcolor: "#eff6ff",
                            borderColor: "#c9daf7",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12.8,
                            fontWeight: 700,
                            color: "#1f2937",
                            lineHeight: 1.35,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: "#94a3b8", mt: 0.25 }}
                        >
                          {item.senderName || "Hệ thống"} ·{" "}
                          {formatDateTime(item.sentAt || item.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
                    Chưa có dữ liệu liên quan.
                  </Typography>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {showConfirmAction && (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(255,255,255,0.95)",
            borderTop: "1px solid #e2e8f0",
            py: 1.4,
            px: 1.2,
            backdropFilter: "blur(5px)",
            zIndex: 11,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={confirming}
              sx={{
                minWidth: 430,
                borderRadius: "999px",
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "#14b86e",
                py: 1.15,
                fontSize: 15,
              }}
            >
              Tôi đã đọc và xác nhận thông báo này
            </Button>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default AnnouncementDetail;
