import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CelebrationIcon from "@mui/icons-material/Celebration";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import birthdayService from "@services/birthdayService";
import { useToast } from "@components/common/ToastProvider";

const EMAIL_SUGGESTIONS = [
  "Chúc mừng sinh nhật! Chúc anh/chị luôn mạnh khỏe, hạnh phúc và thành công trong công việc!",
  "Happy Birthday! Chúc anh/chị một ngày sinh nhật thật vui vẻ và nhiều niềm vui bên gia đình!",
  "Nhân ngày sinh nhật, kính chúc anh/chị sức khỏe dồi dào, vạn sự như ý!",
];

const CARD_STYLES = [
  { key: "luxury", label: "Sang trọng", bg: "linear-gradient(135deg,#121b44,#1f3b6f)", accent: "#ff5a7f" },
  { key: "warm", label: "Ấm áp", bg: "linear-gradient(135deg,#ff8a65,#ef5350)", accent: "#fff176" },
  { key: "fresh", label: "Tươi mới", bg: "linear-gradient(135deg,#00b894,#55efc4)", accent: "#fefefe" },
  { key: "royal", label: "Hoàng gia", bg: "linear-gradient(135deg,#5e2a84,#7b4dd8)", accent: "#ffd166" },
];

const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: "auto !important",
    minHeight: "44px",
  },
  "& .MuiInputBase-input": {
    lineHeight: 1.45,
    py: 1.25,
    boxSizing: "border-box",
  },
};

const dialogMultilineFieldSx = {
  ...dialogFieldSx,
  "& .MuiInputBase-root.MuiInputBase-multiline": {
    height: "auto !important",
    alignItems: "flex-start",
    py: 0,
  },
  "& .MuiInputBase-inputMultiline": {
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    py: 1.25,
    boxSizing: "border-box",
  },
};

const toDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const formatRange = (start, end) => {
  const s = toDate(start);
  const e = toDate(end);
  return `${String(s.getDate()).padStart(2, "0")}-${String(s.getMonth() + 1).padStart(2, "0")} — ${String(
    e.getDate()
  ).padStart(2, "0")}-${String(e.getMonth() + 1).padStart(2, "0")}/${e.getFullYear()}`;
};

const initials = (name = "") => {
  const parts = String(name).trim().split(/\s+/);
  if (!parts.length) return "NV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[parts.length - 2][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const getRelativeDateLabel = (birthday) => {
  if (!birthday) return "";
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const bday = new Date(birthday);
  const targetDate = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());

  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays < 0) return `${Math.abs(diffDays)} ngày trước`;
  return `${diffDays} ngày nữa`;
};

const BirthdayCBNVPage = () => {
  const toast = useToast();
  const [view, setView] = useState("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], range: null });
  const [summary, setSummary] = useState({ totalInRange: 0, todayCount: 0, totalWished: 0 });
  const [loading, setLoading] = useState(false);

  const [emailDialog, setEmailDialog] = useState({ open: false, user: null });
  const [emailForm, setEmailForm] = useState({ subject: "", content: "", selectedSuggestion: 0 });

  const [cardDialog, setCardDialog] = useState({ open: false, user: null });
  const [cardForm, setCardForm] = useState({
    styleKey: CARD_STYLES[0].key,
    message: EMAIL_SUGGESTIONS[0],
    sender: "Tân Cảng Sài Gòn",
  });

  const [successDialog, setSuccessDialog] = useState({ open: false, user: null, message: "", cardData: null });

  const loadData = async (nextView = view, nextDate = anchorDate, nextPage = page) => {
    setLoading(true);
    try {
      const res = await birthdayService.getBirthdays({
        view: nextView,
        date: nextDate.toISOString(),
        page: nextPage,
        limit: 8,
      });

      setData({
        items: Array.isArray(res?.items) ? res.items : [],
        range: res?.range || null,
      });

      if (res?.summary) {
        setSummary({
          totalInRange: res.summary.totalInRange || 0,
          todayCount: res.summary.todayCount || 0,
          totalWished: res.summary.wishedCount || 0,
        });
      }
    } catch (error) {
      console.error(error);
      toast("Không thể tải danh sách sinh nhật", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [view, anchorDate, page]);

  const headerRange = useMemo(() => {
    if (!data?.range) return "";
    return formatRange(data.range.start, data.range.end);
  }, [data.range]);

  const selectedCardStyle = useMemo(
    () => CARD_STYLES.find((s) => s.key === cardForm.styleKey) || CARD_STYLES[0],
    [cardForm.styleKey]
  );

  const handleShift = (direction) => {
    const next = new Date(anchorDate);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * 7);
    setAnchorDate(next);
    setPage(1);
  };

  const handleMonthSelect = (monthIndex) => {
    const next = new Date(anchorDate);
    next.setMonth(monthIndex);
    setAnchorDate(next);
    setPage(1);
  };

  const openEmailDialog = (item) => {
    const defaultMsg = `Chúc mừng sinh nhật ${item.name}! ${EMAIL_SUGGESTIONS[0]}`;
    setEmailForm({
      subject: `🎂 Chúc mừng sinh nhật ${item.name}!`,
      content: defaultMsg,
      selectedSuggestion: 0,
    });
    setEmailDialog({ open: true, user: item });
  };

  const openCardDialog = (item) => {
    setCardForm({
      styleKey: CARD_STYLES[0].key,
      message: EMAIL_SUGGESTIONS[0],
      sender: "Tân Cảng Sài Gòn",
    });
    setCardDialog({ open: true, user: item });
  };

  const handleSendEmailWish = async () => {
    if (!emailDialog.user) return;
    if (!emailForm.content.trim()) {
      toast("Vui lòng nhập nội dung lời chúc", "warning");
      return;
    }

    try {
      await birthdayService.sendWish(emailDialog.user.id, {
        message: emailForm.content.trim(),
        subject: emailForm.subject,
      });
      toast("Đã gửi lời chúc thành công", "success");
      setEmailDialog({ open: false, user: null });
      
      // Optimistic update for UI feel
      const userId = emailDialog.user.id;
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === userId ? { ...i, wished: true } : i)),
      }));
      setSummary((prev) => ({
        ...prev,
        totalWished: prev.totalWished + 1,
      }));

      // Small delay then refresh to sync with server
      setTimeout(() => {
        loadData();
      }, 800);
    } catch (error) {
      console.error(error);
      toast("Không thể gửi lời chúc", "error");
    }
  };

  const handleCreateCard = async () => {
    if (!cardDialog.user) return;
    if (!cardForm.message.trim()) {
      toast("Vui lòng nhập lời chúc trên thiệp", "warning");
      return;
    }
    setSuccessDialog({
      open: true,
      user: cardDialog.user,
      message: `[THIỆP - ${selectedCardStyle.label}] ${cardForm.message.trim()} — ${cardForm.sender.trim() || "Tân Cảng Sài Gòn"}`,
      cardData: {
        message: cardForm.message.trim(),
        sender: cardForm.sender.trim() || "Tân Cảng Sài Gòn",
        style: selectedCardStyle,
        isCard: true,
      },
    });
    setCardDialog({ open: false, user: null });
  };

  const handleConfirmSendCard = async () => {
    if (!successDialog.user) return;
    try {
      const payload = successDialog.cardData
        ? {
            ...successDialog.cardData,
            fullMessage: successDialog.message, // Gửi cả chuỗi format cũ nếu BE cần
          }
        : { message: successDialog.message };

      await birthdayService.sendWish(successDialog.user.id, payload);
      toast("Đã gửi lời chúc thành công", "success");
      setSuccessDialog({ open: false, user: null, message: "", cardData: null });

      // Optimistic update for UI feel
      const userId = successDialog.user.id;
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === userId ? { ...i, wished: true } : i)),
      }));
      setSummary((prev) => ({
        ...prev,
        totalWished: prev.totalWished + 1,
      }));

      // Small delay then refresh to sync with server
      setTimeout(() => {
        loadData();
      }, 800);
    } catch (error) {
      console.error(error);
      toast("Không thể gửi lời chúc", "error");
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f3f6fb", minHeight: "100%" }}>
      <Card sx={{ mb: 3, borderRadius: 4, background: "linear-gradient(135deg, #ffe7a9 0%, #f7d96b 100%)" }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CakeOutlinedIcon sx={{ fontSize: 38, color: "#8a4f08" }} />
            <Box>
              <Typography variant="h4" fontWeight={700} color="#7f3f00">
                Sinh Nhật CBCNV
              </Typography>
              <Typography color="#9a5d1f">Gửi lời chúc mừng đến đồng nghiệp nhân ngày sinh nhật</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 2 }}>
        <ToggleButtonGroup
          color="primary"
          value={view}
          exclusive
          onChange={(_, next) => {
            if (next) {
              setView(next);
              setPage(1);
            }
          }}
          size="small"
        >
          <ToggleButton value="week">
            <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} /> Theo tuần
          </ToggleButton>
          <ToggleButton value="month">
            <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} /> Theo tháng
          </ToggleButton>
        </ToggleButtonGroup>

        {view === "month" ? (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
            {MONTHS.map((m, idx) => {
              const isActive = anchorDate.getMonth() === idx;
              return (
                <Button
                  key={m}
                  variant={isActive ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleMonthSelect(idx)}
                  sx={{
                    minWidth: 36,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    p: 0,
                    fontSize: "0.75rem",
                    fontWeight: isActive ? 700 : 400,
                    backgroundColor: isActive ? "#1e293b" : "transparent",
                    color: isActive ? "#fff" : "#94a3b8",
                    borderColor: isActive ? "#1e293b" : "#e2e8f0",
                    "&:hover": {
                      backgroundColor: isActive ? "#0f172a" : "#f1f5f9",
                      borderColor: isActive ? "#0f172a" : "#cbd5e1",
                    },
                  }}
                >
                  {m}
                </Button>
              );
            })}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" onClick={() => handleShift(-1)}>
              <ChevronLeftIcon />
            </Button>
            <Chip label={headerRange} sx={{ fontWeight: 700, px: 2, height: 40, backgroundColor: "#fff" }} />
            <Button variant="outlined" onClick={() => handleShift(1)}>
              <ChevronRightIcon />
            </Button>
          </Stack>
        )}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: "#fff1f3" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <CakeOutlinedIcon color="error" />
              <Typography variant="h4" fontWeight={700} color="error.main">{summary.totalInRange}</Typography>
            </Stack>
            <Typography>Sinh nhật {view === "week" ? "tuần này" : "tháng này"}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: "#fff8e1" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <CelebrationIcon color="warning" />
              <Typography variant="h4" fontWeight={700} color="warning.main">{summary.todayCount}</Typography>
            </Stack>
            <Typography>Sinh nhật hôm nay</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: "#e8f8f1" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailOutlinedIcon color="success" />
              <Typography variant="h4" fontWeight={700} color="success.main">
                {summary.totalWished}
              </Typography>
            </Stack>
            <Typography>Đã gửi lời chúc</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Stack spacing={2}>
        {data.items.map((item) => (
          <Card key={item.id} sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
            <CardContent sx={{ py: "16px !important" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 64,
                      height: 64,
                      fontWeight: 700,
                      borderRadius: 3,
                      background: "linear-gradient(135deg,#6e80ff,#00b894)",
                      boxShadow: "0 8px 16px rgba(110,128,255,0.25)",
                      fontSize: "1.25rem",
                    }}
                  >
                    {initials(item.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: "#1e293b", mb: 0.5 }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                      {item.position || "Nhân viên"} {item.departmentName ? `· ${item.departmentName}` : ""}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center" sx={{ flex: 1, justifyContent: "flex-end" }}>
                  <Stack alignItems="flex-end" sx={{ mr: 2 }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: "#1e293b" }}>
                      {item.birthdayLabel}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 500 }}>
                      {getRelativeDateLabel(item.birthday)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => openEmailDialog(item)}
                      disabled={loading || item.wished}
                      startIcon={item.wished ? <CheckIcon /> : <EmailOutlinedIcon />}
                      sx={{
                        borderRadius: 2.5,
                        width: 145, // Fixed width to prevent shifting
                        py: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        backgroundColor: item.wished ? "#ecfdf5 !important" : "#f0f7ff",
                        color: item.wished ? "#10b981 !important" : "#2f6df6",
                        boxShadow: "none",
                        opacity: "1 !important", // Ensure it doesn't look faded
                        "&:hover": {
                          backgroundColor: item.wished ? "#ecfdf5" : "#e0f2fe",
                          boxShadow: "none",
                        },
                        "& .MuiButton-startIcon": { mr: 0.5 },
                        "&.Mui-disabled": {
                          backgroundColor: "#ecfdf5",
                          color: "#10b981",
                        },
                      }}
                    >
                      {item.wished ? "Đã gửi" : "Gửi lời chúc"}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => openCardDialog(item)}
                      disabled={loading || item.wished}
                      startIcon={<PaletteOutlinedIcon />}
                      sx={{
                        borderRadius: 2.5,
                        px: 2.5,
                        py: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        backgroundColor: item.wished ? "#f1f5f9 !important" : "#f5f3ff",
                        color: item.wished ? "#94a3b8 !important" : "#7b4dd8",
                        boxShadow: "none",
                        opacity: item.wished ? 0.7 : 1,
                        "&:hover": {
                          backgroundColor: item.wished ? "#f1f5f9" : "#ede9fe",
                          boxShadow: "none",
                        },
                        "& .MuiButton-startIcon": { mr: 0.75 },
                        "&.Mui-disabled": {
                          backgroundColor: "#f1f5f9",
                          color: "#94a3b8",
                        },
                      }}
                    >
                      Tạo thiệp
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {Math.ceil((summary.totalInRange || 0) / 8) >= 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={Math.max(1, Math.ceil((summary.totalInRange || 0) / 8))}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
            size="large"
          />
        </Stack>
      )}

      <Dialog open={emailDialog.open} onClose={() => setEmailDialog({ open: false, user: null })} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>Gửi Email Chúc Mừng</Typography>
              <Typography color="text.secondary">Gửi đến: {emailDialog.user?.name || ""} — {emailDialog.user?.departmentName || ""}</Typography>
            </Box>
            <IconButton onClick={() => setEmailDialog({ open: false, user: null })}><CloseIcon /></IconButton>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Tiêu đề"
              value={emailForm.subject}
              onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={dialogFieldSx}
            />
            <TextField
              label="Nội dung"
              value={emailForm.content}
              onChange={(e) => setEmailForm((p) => ({ ...p, content: e.target.value }))}
              multiline
              rows={5}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={dialogMultilineFieldSx}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Mẫu lời chúc gợi ý</Typography>
              <Stack spacing={1}>
                {EMAIL_SUGGESTIONS.map((text, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setEmailForm((p) => ({ ...p, content: text, selectedSuggestion: idx }))}
                    sx={{
                      border: idx === emailForm.selectedSuggestion ? "1px solid #2f6df6" : "1px solid #d7dfea",
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      backgroundColor: idx === emailForm.selectedSuggestion ? "#f4f8ff" : "#fff",
                    }}
                  >
                    <Typography>{text}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
            <Button variant="outlined" color="inherit" onClick={() => setEmailDialog({ open: false, user: null })}>Hủy</Button>
            <Button variant="contained" onClick={handleSendEmailWish} startIcon={<EmailOutlinedIcon />}>Gửi Email</Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={cardDialog.open} onClose={() => setCardDialog({ open: false, user: null })} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>Tạo Thiệp Sinh Nhật</Typography>
              <Typography color="text.secondary">Thiệp dành cho: {cardDialog.user?.name || ""}</Typography>
            </Box>
            <IconButton onClick={() => setCardDialog({ open: false, user: null })}><CloseIcon /></IconButton>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Chọn mẫu thiệp</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {CARD_STYLES.map((style) => (
                  <Grid item xs={6} key={style.key}>
                    <Button
                      fullWidth
                      onClick={() => setCardForm((p) => ({ ...p, styleKey: style.key }))}
                      sx={{
                        borderRadius: 2,
                        color: "#fff",
                        background: style.bg,
                        border: cardForm.styleKey === style.key ? "2px solid #5d9bff" : "2px solid transparent",
                        py: 1,
                      }}
                    >
                      {style.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Lời chúc"
                multiline
                rows={4}
                fullWidth
                sx={{ ...dialogMultilineFieldSx, mb: 1.5 }}
                value={cardForm.message}
                onChange={(e) => setCardForm((p) => ({ ...p, message: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {EMAIL_SUGGESTIONS.map((_, idx) => (
                  <Chip
                    key={idx}
                    label={`Mẫu ${idx + 1}`}
                    color="primary"
                    variant="outlined"
                    onClick={() => setCardForm((p) => ({ ...p, message: EMAIL_SUGGESTIONS[idx] }))}
                  />
                ))}
              </Stack>

              <TextField
                label="Người gửi"
                fullWidth
                value={cardForm.sender}
                onChange={(e) => setCardForm((p) => ({ ...p, sender: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={dialogFieldSx}
              />

              <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={{ mt: 2 }}>
                <Button variant="outlined" color="inherit" fullWidth onClick={() => setCardDialog({ open: false, user: null })}>
                  Hủy
                </Button>
                <Button variant="contained" fullWidth onClick={handleCreateCard} startIcon={<CelebrationIcon />}>
                  Tạo thiệp
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Xem trước</Typography>
              <Box
                sx={{
                  borderRadius: 3,
                  p: 4,
                  minHeight: 380,
                  color: "#fff",
                  background: selectedCardStyle.bg,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.35)",
                }}
              >
                <Typography sx={{ fontSize: 54, mb: 1 }}>🎂</Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: selectedCardStyle.accent, mb: 1 }}>
                  Chúc Mừng Sinh Nhật
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                  {cardDialog.user?.name || ""}
                </Typography>
                <Box sx={{ width: 80, height: 3, borderRadius: 3, backgroundColor: selectedCardStyle.accent, mb: 2 }} />
                <Typography sx={{ maxWidth: 420, fontSize: 22, fontStyle: "italic", lineHeight: 1.6 }}>
                  "{cardForm.message}"
                </Typography>
                <Typography sx={{ mt: 3, opacity: 0.92 }}>— {cardForm.sender || "Tân Cảng Sài Gòn"}</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, user: null, message: "" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, textAlign: "center", p: 1 } }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                backgroundColor: "#fff9f0",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <CelebrationIcon sx={{ fontSize: 48, color: "#f7d96b" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1, color: "#1e293b" }}>
                Thiệp đã được tạo!
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 280, mx: "auto", fontSize: "0.95rem" }}>
                Thiệp chúc mừng sinh nhật cho <strong>{successDialog.user?.name}</strong> đã sẵn sàng gửi đi.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={() => setSuccessDialog({ open: false, user: null, message: "" })}
                sx={{
                  py: 1.2,
                  borderRadius: 3,
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  borderColor: "transparent",
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#e2e8f0", borderColor: "transparent" },
                }}
              >
                Đóng
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirmSendCard}
                startIcon={<CelebrationIcon />}
                sx={{
                  py: 1.2,
                  borderRadius: 3,
                  backgroundColor: "#2f6df6",
                  "&:hover": { backgroundColor: "#1d4ed8" },
                  boxShadow: "0 4px 12px rgba(47,109,246,0.25)",
                }}
              >
                Gửi thiệp qua Email
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BirthdayCBNVPage;
