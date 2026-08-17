import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Pagination,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  NavigateBefore,
  NavigateNext,
  WbSunnyOutlined,
  LightModeOutlined,
  BedtimeOutlined,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FileDownload,
  Print,
  Close,
  RestaurantMenu,
  Business,
  BarChart,
  ExpandMore,
  ExpandLess,
  HourglassEmpty,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
import dayjs from "dayjs";
import "dayjs/locale/vi";
import axios from "axios";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";
import { toast } from "react-hot-toast";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import * as XLSX from "xlsx";

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
    MuiTableCell: { styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } } },
    MuiInputBase: { styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } } },
    MuiTab: { styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } } },
    MuiMenuItem: { styleOverrides: { root: { fontFamily: VPP_THEME.fontFamily } } },
  },
});

// Hàm gọi API check-in list cho 1 slot
const fetchSlotData = async (date, slot) => {
  try {
    const token = localStorage.getItem("token_app");
    const res = await axios.get(`${APP_BASE}/api/v1/canteen/checkin/list`, {
      params: { date, slot },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.success) {
      const items = res.data.data || [];
      // Map dữ liệu API sang đúng shape UI cần
      const COLORS = [
        "#3b82f6",
        "#ec4899",
        "#10b981",
        "#f59e0b",
        "#6366f1",
        "#14b8a6",
        "#f97316",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
        "#ef4444",
        "#a855f7",
      ];
      return items.map((item, i) => ({
        id: item.id,
        name: item.name,
        dept: item.deptName || item.dept || "",
        avatar:
          item.avatar ||
          (item.name ? item.name.substring(0, 2).toUpperCase() : "U"),
        color: COLORS[i % COLORS.length],
        status: item.status || "pending",
        time: item.time || null,
        slot: slot,
        registration_id: item.registration_id,
        menu_id: item.menu_id,
        checkin_id: item.checkin_id,
        price: item.price || 0,
      }));
    }
    return [];
  } catch (err) {
    console.error(`Lỗi tải check-in ${slot}:`, err);
    return [];
  }
};

const SLOTS = [
  {
    id: "breakfast",
    label: "Ăn sáng",
    emoji: "🌅",
    time: "06:30 – 08:00",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <WbSunnyOutlined sx={{ fontSize: 20, color: "#f59e0b" }} />,
  },
  {
    id: "lunch",
    label: "Ăn trưa",
    emoji: "☀️",
    time: "11:00 – 13:00",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <LightModeOutlined sx={{ fontSize: 20, color: "#10b981" }} />,
  },
  {
    id: "dinner",
    label: "Ăn tối",
    emoji: "🌙",
    time: "17:30 – 19:00",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    icon: <BedtimeOutlined sx={{ fontSize: 20, color: "#8b5cf6" }} />,
  },
];

const ITEMS_PER_PAGE = 10;

// ─── Sub Components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const sx = {
    fontFamily: VPP_THEME.fontFamily,
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    fontSize: 13,
    fontWeight: 700,
  };
  if (status === "checked")
    return (
      <Box sx={{ ...sx, color: "#16a34a" }}>
        <CheckCircleIcon sx={{ fontSize: 15 }} /> Đã ăn
      </Box>
    );
  if (status === "absent")
    return (
      <Box sx={{ ...sx, color: "#dc2626" }}>
        <CancelIcon sx={{ fontSize: 15 }} /> Không đến
      </Box>
    );
  return (
    <Box sx={{ ...sx, color: "#8c8c8c", fontWeight: 600 }}>
      <HourglassEmpty sx={{ fontSize: 15 }} /> Chờ
    </Box>
  );
};

const MealComparisonCard = ({ slot, data, onClick }) => {
  const checked = data.filter((d) => d.status === "checked").length;
  const absent = data.filter((d) => d.status === "absent").length;
  const registered = data.length;
  const actualTotal = data.filter((d) => d.status !== "pending").length;
  const rate =
    actualTotal > 0 && checked > 0
      ? Math.round((checked / actualTotal) * 100)
      : 0;
  const isPending = data.every((d) => d.status === "pending");

  return (
    <Paper
      elevation={0}
      onClick={() => !isPending && onClick(slot.id)}
      sx={{
        p: 2.5,
        borderRadius: "16px",
        border: `2px solid ${slot.border}`,
        bgcolor: slot.bg,
        cursor: isPending ? "default" : "pointer",
        transition: "all 0.2s",
        opacity: isPending ? 0.6 : 1,
        fontFamily: VPP_THEME.fontFamily,
        "&:hover": {
          boxShadow: isPending ? "none" : "0 6px 20px rgba(0,0,0,0.1)",
          transform: isPending ? "none" : "translateY(-2px)",
        },
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {slot.icon}
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: "#001529", fontFamily: VPP_THEME.fontFamily }}
          >
            {slot.label}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={900}
          sx={{
            color: rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626",
            fontFamily: VPP_THEME.fontFamily,
          }}
        >
          {isPending ? "Chưa phục vụ" : `${rate}%`}
        </Typography>
      </Box>

      {!isPending && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(rate, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                bgcolor:
                  rate >= 80 ? "#22c55e" : rate >= 60 ? "#f59e0b" : "#ef4444",
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          mb: 1.5,
        }}
      >
        {[
          { label: "Đăng ký", value: registered, color: "#2563eb" },
          {
            label: "Đã ăn",
            value: isPending ? "—" : checked,
            color: "#16a34a",
          },
          {
            label: "Không đến",
            value: isPending ? "—" : absent,
            color: "#dc2626",
          },
        ].map((s) => (
          <Box key={s.label} sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{ color: s.color, fontFamily: VPP_THEME.fontFamily }}
            >
              {s.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#8c8c8c", fontFamily: VPP_THEME.fontFamily }}
            >
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography
        variant="caption"
        sx={{ color: "#8c8c8c", fontFamily: VPP_THEME.fontFamily }}
      >
        {slot.time}
        {!isPending && absent > 0 && (
          <>
            {" "}
            · Thất thoát{" "}
            <strong style={{ color: "#dc2626" }}>
            {((absent) * (data[0]?.price || 0)).toLocaleString()} ₫
            </strong>
          </>
        )}
        {!isPending && <> · Nhấn xem chi tiết</>}
        {isPending && " · Dữ liệu chưa có"}
      </Typography>
    </Paper>
  );
};

const BarChartViz = ({ allData }) => (
  <Paper
    elevation={0}
    sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0", mb: 3 }}
  >
    <Typography
      variant="subtitle1"
      fontWeight={800}
      sx={{ color: "#001529", mb: 0.5, fontFamily: VPP_THEME.fontFamily }}
    >
      📊 Đăng ký vs Sử dụng thực tế
    </Typography>
    <Typography
      variant="caption"
      sx={{
        color: "#8c8c8c",
        display: "block",
        mb: 2.5,
        fontFamily: VPP_THEME.fontFamily,
      }}
    >
      Số lượng suất ăn theo từng bữa trong ngày
    </Typography>

    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      {[
        { color: "#3b82f6", label: "Đăng ký" },
        { color: "#22c55e", label: "Đã ăn" },
        { color: "#ef4444", label: "Không đến" },
      ].map((l) => (
        <Box
          key={l.label}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Box
            sx={{ width: 12, height: 12, borderRadius: 2, bgcolor: l.color }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "#595959",
              fontWeight: 600,
              fontFamily: VPP_THEME.fontFamily,
            }}
          >
            {l.label}
          </Typography>
        </Box>
      ))}
    </Box>

    <Box
      sx={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-end",
        height: 160,
        gap: 2,
      }}
    >
      {SLOTS.map((slot) => {
        const data = allData[slot.id] || [];
        const total = data.length;
        const checked = data.filter((d) => d.status === "checked").length;
        const absent = data.filter((d) => d.status === "absent").length;
        const isPending = data.every((d) => d.status === "pending");
        const maxH = 120;
        const scale = total > 0 ? maxH / total : 1;

        return (
          <Box
            key={slot.id}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 0.5,
                height: maxH,
              }}
            >
              {[
                { val: total, color: "#3b82f6" },
                { val: isPending ? 0 : checked, color: "#22c55e" },
                { val: isPending ? 0 : absent, color: "#ef4444" },
              ].map((bar, bi) => (
                <Box
                  key={bi}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: bar.color,
                      fontSize: 11,
                      mb: 0.3,
                      fontFamily: VPP_THEME.fontFamily,
                    }}
                  >
                    {isPending && bi > 0 ? "—" : bar.val}
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: Math.max(bar.val * scale, bar.val > 0 ? 4 : 0),
                      bgcolor: isPending ? "#e5e7eb" : bar.color,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s",
                    }}
                  />
                </Box>
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: "#595959",
                mt: 0.5,
                fontFamily: VPP_THEME.fontFamily,
              }}
              align="center"
            >
              {slot.emoji} {slot.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isPending ? "#bfbfbf" : slot.color,
                fontWeight: 700,
                fontSize: 10,
                fontFamily: VPP_THEME.fontFamily,
              }}
            >
              {isPending
                ? "Chưa phục vụ"
                : `${total > 0 ? Math.round((checked / total) * 100) : 0}% sử dụng`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  </Paper>
);

const StaffRow = ({ item, idx, isModal }) => {
  const isAbsent = item.status === "absent";
  const isChecked = item.status === "checked";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.5,
        bgcolor: isAbsent ? "#fff5f5" : "white",
        borderRadius: isModal ? "12px" : isAbsent ? "12px" : 0,
        border: isAbsent
          ? "1px solid #fee2e2"
          : isModal
            ? "1px solid #f1f5f9"
            : "none",
        borderBottom: !isAbsent && !isModal ? "1px solid #f5f5f5" : "none",
        mb: isModal ? 1.2 : isAbsent ? 1.5 : 0,
        boxShadow:
          isModal && isAbsent ? "0 2px 8px rgba(239, 68, 68, 0.04)" : "none",
        "&:hover": { bgcolor: isAbsent ? "#fff2f2" : "#f8fafc" },
        transition: "all 0.1s",
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 13,
          fontWeight: 700,
          bgcolor: item.color,
          mr: 1.5,
          flexShrink: 0,
          fontFamily: VPP_THEME.fontFamily,
        }}
      >
        {item.avatar}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={800}
          sx={{ color: "#1e40af", fontFamily: VPP_THEME.fontFamily }}
          noWrap
        >
          {item.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#94a3b8", fontFamily: VPP_THEME.fontFamily }}
        >
          {item.dept}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {isChecked && (
          <Box
            sx={{
              px: 1.2,
              py: 0.3,
              borderRadius: "100px",
              bgcolor: "#ecfdf5",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: "1px solid #d1fae5",
            }}
          >
            <Typography variant="caption" fontWeight={800}>
              ✓ Đã ăn
            </Typography>
          </Box>
        )}
        {isAbsent && (
          <Box
            sx={{
              px: 1.2,
              py: 0.3,
              borderRadius: "100px",
              bgcolor: "#fff1f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: "1px solid #ffe4e6",
            }}
          >
            <Typography variant="caption" fontWeight={800}>
              X Không đến
            </Typography>
          </Box>
        )}
        {!isChecked && !isAbsent && (
          <Box
            sx={{
              px: 1.2,
              py: 0.3,
              borderRadius: "100px",
              bgcolor: "#f3f4f6",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontFamily: VPP_THEME.fontFamily, fontWeight: 800 }}
            >
              Chờ
            </Typography>
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            minWidth: 40,
            textAlign: "right",
            color: item.time
              ? item.status === "absent"
                ? "#dc2626"
                : "#059669"
              : "#bfbfbf",
            fontWeight: item.time ? 700 : 400,
            fontFamily: VPP_THEME.fontFamily,
          }}
        >
          {item.time || "—"}
        </Typography>
      </Box>
    </Box>
  );
};

const MealDetailModal = ({ open, onClose, slot, data }) => {
  const [page, setPage] = useState(1);
  const slotId = slot?.id;
  const dataLength = data?.length || 0;

  // Reset page when slot or data changes
  useEffect(() => {
    setPage(1);
  }, [slotId, dataLength]);

  if (!slot) return null;

  const checked = data.filter((d) => d.status === "checked").length;
  const absent = data.filter((d) => d.status === "absent").length;
  const unitPrice = data[0]?.price || 0;
  const loss = absent * unitPrice;

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const paginatedData = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "24px", overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          pt: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ fontSize: 24 }}>{slot.emoji}</Box>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ color: "#1e3a8a", fontFamily: VPP_THEME.fontFamily }}
          >
            Chi tiết – {slot.label}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "#f1f5f9" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 4 }}>
        {/* Summary Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            mb: 4,
            bgcolor: "#f8fafc",
            p: 2,
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          {[
            { label: "Đăng ký", value: data.length, color: "#2563eb" },
            { label: "Đã ăn", value: checked, color: "#10b981" },
            { label: "Không đến", value: absent, color: "#ef4444" },
            {
              label: "Thất thoát",
              value: `${loss.toLocaleString()} đ`,
              color: "#dc2626",
            },
          ].map((s) => (
            <Box key={s.label} sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{
                  color: s.color,
                  fontSize: 18,
                  fontFamily: VPP_THEME.fontFamily,
                }}
              >
                {s.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontFamily: VPP_THEME.fontFamily,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* List Content */}
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
          {paginatedData.map((item, idx) => (
            <StaffRow key={item.id} item={item} idx={idx} isModal={true} />
          ))}
          {data.length === 0 && (
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "#94a3b8",
                mt: 4,
                fontFamily: VPP_THEME.fontFamily,
              }}
            >
              Không có dữ liệu
            </Typography>
          )}
        </Box>

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, p) => setPage(p)}
              color="primary"
              size="small"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: VPP_THEME.fontFamily,
                  fontWeight: 700,
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MealAccordion = ({ slot, data, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen || false);
  const [page, setPage] = useState(1);
  const checked = data.filter((d) => d.status === "checked").length;
  const absent = data.filter((d) => d.status === "absent").length;
  const isPending = data.every((d) => d.status === "pending");

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const paginatedData = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: "1px solid #f0f0f0",
        overflow: "hidden",
        mb: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          cursor: "pointer",
          bgcolor: open ? "#f5f6fa" : "white",
          borderBottom: open ? "1px solid #f0f0f0" : "none",
          "&:hover": { bgcolor: "#f5f6fa" },
          transition: "background 0.15s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {slot.icon}
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: "#001529", fontFamily: VPP_THEME.fontFamily }}
          >
            {slot.label}
          </Typography>
          <Box sx={{ px: 1, py: 0.2, bgcolor: "#f0f0f0", borderRadius: "6px" }}>
            <Typography
              variant="caption"
              sx={{
                color: "#595959",
                fontWeight: 600,
                fontFamily: VPP_THEME.fontFamily,
              }}
            >
              {slot.time}
            </Typography>
          </Box>
        </Box>

        {!isPending && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#16a34a",
                fontWeight: 700,
                fontFamily: VPP_THEME.fontFamily,
              }}
            >
              {checked} đã ăn
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#dc2626",
                fontWeight: 700,
                fontFamily: VPP_THEME.fontFamily,
              }}
            >
              {absent} không đến
            </Typography>
          </Box>
        )}
        {isPending && (
          <Chip
            label="🍽 Chưa phục vụ"
            size="small"
            sx={{
              bgcolor: "#f0f0f0",
              color: "#8c8c8c",
              fontWeight: 600,
              fontFamily: VPP_THEME.fontFamily,
            }}
          />
        )}

        <IconButton size="small">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Content */}
      {open && (
        <Box sx={{ pb: 2 }}>
          <Box>
            {paginatedData.map((item, idx) => (
              <StaffRow key={item.id} item={item} idx={idx} />
            ))}
            {data.length === 0 && (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", fontFamily: VPP_THEME.fontFamily }}
                >
                  Không có dữ liệu đăng ký cho bữa này.
                </Typography>
              </Box>
            )}
          </Box>
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                pt: 2,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => setPage(p)}
                color="primary"
                size="small"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontFamily: VPP_THEME.fontFamily,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

const DeptCard = ({ dept, items }) => {
  const checked = items.filter((i) => i.status === "checked").length;
  const total =
    items.filter((i) => i.status !== "pending").length || items.length;
  const rate = total > 0 ? Math.round((checked / total) * 100) : 0;
  const isLow = rate < 70 && total > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "14px",
        border: "1px solid",
        borderColor: isLow ? "#fecaca" : "#f0f0f0",
        boxShadow: isLow
          ? "0 4px 12px rgba(239,68,68,0.08)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isLow && (
        <Box sx={{ position: "absolute", top: 10, right: 10 }}>
          <Chip
            label="⚠️ Thấp nhất"
            size="small"
            sx={{
              bgcolor: "#fee2e2",
              color: "#dc2626",
              fontWeight: 700,
              fontSize: 10,
            }}
          />
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: "#f0f5ff",
            borderRadius: "10px",
            display: "flex",
          }}
        >
          <Business sx={{ color: "#2563eb", fontSize: 18 }} />
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ color: "#001529", fontFamily: VPP_THEME.fontFamily }}
          >
            {dept}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#8c8c8c", fontFamily: VPP_THEME.fontFamily }}
          >
            {items.length} nhân viên
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#8c8c8c",
              fontWeight: 600,
              fontFamily: VPP_THEME.fontFamily,
            }}
          >
            Tỉ lệ sử dụng
          </Typography>
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{
              color:
                rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626",
              fontFamily: VPP_THEME.fontFamily,
            }}
          >
            {rate}% {rate >= 80 ? "✓" : "⚠️"}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(rate, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: "#f0f0f0",
            "& .MuiLinearProgress-bar": {
              bgcolor:
                rate >= 80 ? "#22c55e" : rate >= 60 ? "#f59e0b" : "#ef4444",
            },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }}>
        {[
          { label: "Đăng ký", val: items.length, color: "#2563eb" },
          { label: "Đã ăn", val: checked, color: "#16a34a" },
          {
            label: "Vắng",
            val: items.filter((i) => i.status === "absent").length,
            color: "#dc2626",
          },
        ].map((s) => (
          <Box key={s.label} sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={900} color={s.color}>
              {s.val}
            </Typography>
            <Typography variant="caption" color="#8c8c8c" sx={{ fontSize: 10 }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MealReconciliation = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return dayjs();
    const parsedDate = dayjs(dateParam);
    return parsedDate.isValid() ? parsedDate : dayjs();
  });
  const [viewMode, setView] = useState("meal");
  const [focusSlot, setFocusSlot] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });

  // Fetch dữ liệu thực từ API check-in (song song 3 bữa)
  const fetchAllSlots = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = date.format("YYYY-MM-DD");
      const [breakfast, lunch, dinner] = await Promise.all([
        fetchSlotData(dateStr, "breakfast"),
        fetchSlotData(dateStr, "lunch"),
        fetchSlotData(dateStr, "dinner"),
      ]);
      setAllData({ breakfast, lunch, dinner });
    } catch (err) {
      console.error("Lỗi tải dữ liệu đối chiếu:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAllSlots();
  }, [fetchAllSlots]);

  const handleMark = async (empId, slot, newStatus) => {
    // Cập nhật UI ngay lập tức (optimistic update)
    setAllData((prev) => ({
      ...prev,
      [slot]: prev[slot].map((item) =>
        item.id === empId
          ? {
            ...item,
            status: newStatus,
            time: newStatus === "checked" ? dayjs().format("HH:mm") : null,
          }
          : item
      ),
    }));

    // Gọi API cập nhật trạng thái
    try {
      const token = localStorage.getItem("token_app");
      const item = allData[slot]?.find((i) => i.id === empId);
      if (item?.registration_id) {
        await axios.patch(
          `${APP_BASE}/api/v1/canteen/checkin/status/${item.id}/${item.menu_id}`,
          { registration_id: item.registration_id, status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      // Rollback nếu lỗi - tải lại dữ liệu
      fetchAllSlots();
    }
  };

  const handleExport = () => {
    const allItems = [
      ...allData.breakfast.map((i) => ({ ...i, buoi: "Ăn sáng" })),
      ...allData.lunch.map((i) => ({ ...i, buoi: "Ăn trưa" })),
      ...allData.dinner.map((i) => ({ ...i, buoi: "Ăn tối" })),
    ];

    if (allItems.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    // 1. Tạo header và thông tin tổng hợp ở đầu file
    const headerInfo = [
      ["BÁO CÁO ĐỐI CHIẾU SUẤT ĂN HÀNG NGÀY"],
      [`Ngày: ${date.format("DD/MM/YYYY")}`],
      [""],
      ["Tóm tắt thống kê:"],
      ["Tổng đăng ký", "Đã ăn", "Vắng mặt", "Thất thoát (đ)", "Tỉ lệ sử dụng"],
      [
        totals.registered,
        totals.checked,
        totals.absent,
        totals.loss,
        `${totals.rate}%`,
      ],
      [""],
      ["Danh sách chi tiết:"],
      [
        "STT",
        "Ngày",
        "Buổi",
        "Mã NV",
        "Họ tên",
        "Bộ phận",
        "Trạng thái",
        "THời gian xác nhận",
      ],
    ];

    // 2. Tạo sheet từ headerInfo
    const ws = XLSX.utils.aoa_to_sheet(headerInfo);

    // 3. Thêm dữ liệu chi tiết vào bảng bên dưới
    const exportRows = allItems.map((item, idx) => [
      idx + 1,
      date.format("DD/MM/YYYY"),
      item.buoi,
      item.id,
      item.name,
      item.dept,
      item.status === "checked"
        ? "Đã ăn"
        : item.status === "absent"
          ? "Vắng"
          : "Chờ",
      item.time || "",
    ]);

    XLSX.utils.sheet_add_aoa(ws, exportRows, { origin: "A10" });

    // 4. Tạo workbook và lưu file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DoiChieuSuatAn");

    // Chỉnh độ rộng cột
    ws["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.writeFile(wb, `Bao_Cao_Doi_Chieu_${date.format("YYYYMMDD")}.xlsx`);
    toast.success("Đã xuất file báo cáo tổng hợp");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const dateStr = date.format("DD/MM/YYYY");

    let html = `
      <html>
        <head>
          <title>Báo cáo đối chiếu suất ăn - ${dateStr}</title>
          <style>
            body { font-family: "Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-val { font-size: 20px; font-weight: bold; color: #1e40af; margin: 5px 0; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .checked { color: #16a34a; font-weight: bold; }
            .absent { color: #dc2626; font-weight: bold; }
            .section-title { margin-top: 40px; font-size: 18px; font-weight: bold; border-left: 4px solid #3b82f6; padding-left: 10px; }
            @media print {
              .no-print { display: none; }
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BÁO CÁO ĐỐI CHIẾU SUẤT ĂN HÀNG NGÀY</h2>
            <p>Ngày: ${dateStr} | Đơn vị: Tân Cảng Sài Gòn</p>
          </div>

          <div class="summary">
            <div class="stat-card">
              <div class="stat-label">Tổng đăng ký</div>
              <div class="stat-val">${totals.registered}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Đã sử dụng</div>
              <div class="stat-val">${totals.checked}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Thất thoát</div>
              <div class="stat-val">${totals.loss.toLocaleString()} đ</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Tỉ lệ sử dụng</div>
              <div class="stat-val">${totals.rate}%</div>
            </div>
          </div>
    `;

    SLOTS.forEach((slot) => {
      const data = allData[slot.id] || [];
      if (data.length === 0) return;

      html += `
        <div class="section-title">${slot.emoji} ${slot.label} (${slot.time})</div>
        <table>
          <thead>
            <tr>
              <th width="50">STT</th>
              <th width="100">Mã NV</th>
              <th>Họ tên</th>
              <th>Bộ phận</th>
              <th width="120">Trạng thái</th>
              <th width="100">Thời gian xác nhận</th>
            </tr>
          </thead>
          <tbody>
            ${data
          .map(
            (item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.dept}</td>
                <td class="${item.status}">${item.status === "checked" ? "Đã ăn" : item.status === "absent" ? "Vắng" : "Chờ"}</td>
                <td>${item.time || "—"}</td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      `;
    });

    html += `
          <div style="margin-top: 50px; text-align: right;">
            <p>Ngày in: ${dayjs().format("DD/MM/YYYY HH:mm")}</p>
            <p style="margin-top: 60px;"><i>(Ký tên và đóng dấu)</i></p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Đợi một chút để CSS load xong rồi mới gọi in
    setTimeout(() => {
      printWindow.onafterprint = () => {
        printWindow.close();
      };
      printWindow.print();
    }, 500);
  };

  const handleBulk = (slot, status) => {
    setAllData((prev) => ({
      ...prev,
      [slot]: prev[slot].map((item) =>
        item.status === "pending" ||
          (status === "absent" && item.status !== "checked")
          ? {
            ...item,
            status,
            time: status === "checked" ? dayjs().format("HH:mm") : null,
          }
          : item
      ),
    }));
  };

  const totals = useMemo(() => {
    const all = Object.values(allData).flat();
    const registered = all.length;
    const checked = all.filter((a) => a.status === "checked").length;
    const absent = all.filter((a) => a.status === "absent").length;
    const pending = all.filter(
      (a) => a.status !== "checked" && a.status !== "absent"
    ).length;
    const rate = registered > 0 ? Math.round((checked / registered) * 100) : 0;
    const loss = SLOTS.reduce((sum, slot) => {
      const records = allData[slot.id] || [];
      const ab = records.filter(
        (d) => d.status === "absent"
      ).length;
      const unitPrice = records[0]?.price || 0;
      return sum + ab * unitPrice;
    }, 0);
    return { registered, checked, absent, pending, rate, loss };
  }, [allData]);

  // Group by dept
  const groupedByDept = useMemo(() => {
    const map = {};
    Object.values(allData)
      .flat()
      .forEach((item) => {
        if (!map[item.dept]) map[item.dept] = [];
        map[item.dept].push(item);
      });
    return map;
  }, [allData]);

  const isToday = date.isSame(dayjs(), "day");

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
        <Box
          sx={{
            p: 4,
            bgcolor: VPP_THEME.bg,
            minHeight: "100vh",
            fontFamily: VPP_THEME.fontFamily,
          }}
        >
          {/* ── Header ── */}
          <Box sx={{ mb: 4 }}>
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
              Đối soát & Báo cáo suất ăn
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
              So sánh kế hoạch đăng ký và thực tế sử dụng suất ăn
            </Typography>
          </Box>

          {/* ── Date nav + actions ── */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  px: 0.5,
                  py: 0,
                  borderRadius: "100px",
                  border: "1px solid #e5e7eb",
                  bgcolor: "white",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setDate((d) => d.subtract(1, "day"))}
                  sx={{ color: "#8c8c8c" }}
                >
                  <NavigateBefore />
                </IconButton>
                <DatePicker
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  format="DD/MM/YYYY"
                  localeText={{
                    clearButtonLabel: "Xóa",
                    todayButtonLabel: "Hôm nay",
                  }}
                  slotProps={{
                    actionBar: {
                      actions: ["clear", "today"],
                    },
                    textField: {
                      size: "small",
                      sx: {
                        "& .MuiInputBase-root": {
                          borderRadius: "100px",
                          bgcolor: "white",
                          height: 36,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#000",
                          "& fieldset": { border: "none" },
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          width: 120,
                        },
                      },
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => setDate((d) => d.add(1, "day"))}
                >
                  <NavigateNext />
                </IconButton>
              </Paper>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                size="small"
                onClick={handleExport}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  borderColor: "#d9d9d9",
                  color: "#595959",
                }}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                size="small"
                onClick={handlePrint}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  borderColor: "#d9d9d9",
                  color: "#595959",
                }}
              >
                In báo cáo
              </Button>
            </Box>
          </Box>

          {/* ── Summary Stats ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                label: "TỔNG ĐĂNG KÝ",
                value: totals.registered,
                sub: `${totals.pending} suất đang chờ`,
                color: "#2563eb",
                icon: "📋",
              },
              {
                label: "ĐÃ SỬ DỤNG",
                value: totals.checked,
                sub: `trên tổng ${totals.registered} suất đăng ký`,
                color: "#16a34a",
                icon: "✅",
              },
              {
                label: "THẤT THOÁT",
                value: `${totals.loss.toLocaleString()} đ`,
                sub: `${totals.absent} suất không được sử dụng`,
                color: "#dc2626",
                icon: "💸",
                large: true,
              },
              {
                label: "TỈ LỆ SỬ DỤNG",
                value: `${totals.rate}%`,
                sub: "mục tiêu: ≥ 90%",
                color:
                  totals.rate >= 90
                    ? "#16a34a"
                    : totals.rate >= 70
                      ? "#d97706"
                      : "#dc2626",
                icon: "📊",
              },
            ].map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    height: "100%",
                    fontFamily: VPP_THEME.fontFamily,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#8c8c8c",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontFamily: VPP_THEME.fontFamily,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
                  </Typography>
                  <Typography
                    variant={s.large ? "h5" : "h4"}
                    sx={{
                      fontWeight: 900,
                      color: s.color,
                      my: 0.5,
                      lineHeight: 1,
                      fontFamily: VPP_THEME.fontFamily,
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#8c8c8c", fontFamily: VPP_THEME.fontFamily }}
                  >
                    {s.sub}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* ── Meal Comparison Cards ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {SLOTS.map((slot) => (
              <Grid item xs={12} md={4} key={slot.id}>
                <MealComparisonCard
                  slot={slot}
                  data={allData[slot.id]}
                  onClick={(id) => {
                    setFocusSlot(id);
                    setOpenModal(true);
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <MealDetailModal
            open={openModal}
            onClose={() => {
              setOpenModal(false);
              setFocusSlot(null);
            }}
            slot={SLOTS.find((s) => s.id === focusSlot)}
            data={allData[focusSlot] || []}
          />

          {/* ── Bar Chart ── */}
          <BarChartViz allData={allData} />

          {/* ── View Tabs ── */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {[
              {
                id: "meal",
                label: "🍽️ Chi tiết theo bữa",
                icon: <RestaurantMenu sx={{ fontSize: 16 }} />,
              },
              {
                id: "dept",
                label: "🏢 Chi tiết theo bộ phận",
                icon: <Business sx={{ fontSize: 16 }} />,
              },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => {
                  setView(tab.id);
                  setFocusSlot(null);
                }}
                variant={viewMode === tab.id ? "contained" : "outlined"}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  fontSize: 13,
                  fontFamily: VPP_THEME.fontFamily,
                  bgcolor: viewMode === tab.id ? "#2563eb" : "white",
                  borderColor: viewMode === tab.id ? "#2563eb" : "#e5e7eb",
                  color: viewMode === tab.id ? "white" : "#595959",
                  "&:hover": {
                    bgcolor: viewMode === tab.id ? "#1d4ed8" : "#f5f5f5",
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          {/* ── Detail View ── */}
          {viewMode === "meal" ? (
            SLOTS.filter((slot) => !focusSlot || slot.id === focusSlot).map(
              (slot, i) => (
                <MealAccordion
                  key={slot.id}
                  slot={slot}
                  data={allData[slot.id]}
                  defaultOpen={!!focusSlot || i === 0}
                />
              )
            )
          ) : (
            <Grid container spacing={2}>
              {Object.entries(groupedByDept)
                .sort((a, b) => {
                  const rateA =
                    a[1].filter((i) => i.status === "checked").length /
                    a[1].length;
                  const rateB =
                    b[1].filter((i) => i.status === "checked").length /
                    b[1].length;
                  return rateA - rateB;
                })
                .map(([dept, items]) => (
                  <Grid item xs={12} sm={6} md={4} key={dept}>
                    <DeptCard dept={dept} items={items} />
                  </Grid>
                ))}
            </Grid>
          )}
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default MealReconciliation;
