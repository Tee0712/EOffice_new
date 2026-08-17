import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CircleIcon from "@mui/icons-material/Circle";
import moment from "moment";
import { SessionChips } from "./SessionChip";

moment.locale("vi");

const SESSION_LABEL = { 1: "Sáng", 2: "Trưa", 3: "Tối" };
const SESSION_ORDER = [1, 2, 3];

const statusMeta = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "cancelled")
    return { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2" };
  if (key === "completed")
    return { label: "Đã hoàn thành", color: "#166534", bg: "#DCFCE7" };
  if (key === "active")
    return { label: "Đang hoạt động", color: "#166534", bg: "#DCFCE7" };
  if (key === "upcoming")
    return { label: "Sắp tới", color: "#1D4ED8", bg: "#DBEAFE" };
  return { label: status || "Không rõ", color: "#6B7280", bg: "#F3F4F6" };
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDateTime = (value, fallback = "—") => {
  if (!value) return fallback;
  const m = moment(value);
  if (!m.isValid()) return fallback;
  return m.format("DD/MM/YYYY - HH:mm");
};

const maybeDecodeMojibake = (value) => {
  const input = String(value || "");
  if (!input) return "";
  const hasMarker = /Ã|Â|â|ðŸ/.test(input);
  if (!hasMarker) return input;

  try {
    const bytes = [];
    for (let i = 0; i < input.length; i += 1) {
      const code = input.charCodeAt(i);
      if (code > 255) return input;
      bytes.push(code);
    }
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch {
    return input;
  }
};

const normalizeViText = (input) => {
  const text = maybeDecodeMojibake(String(input || "")).trim();
  if (!text) return "—";
  return text
    .replace(/Dang ky suat an/gi, "Đăng ký suất ăn")
    .replace(/Dang ky thanh cong/gi, "Đăng ký thành công")
    .replace(/Huy dang ky/gi, "Hủy đăng ký")
    .replace(/Chinh sua/gi, "Chỉnh sửa")
    .replace(/sessions?\s*:\s*([0-9,\s]+)/gi, (_, rawIds) => {
      const ids = String(rawIds || "")
        .split(",")
        .map((x) => Number(String(x).trim()))
        .filter((x) => [1, 2, 3].includes(x))
        .sort((a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b));
      const sessionText = ids.map((id) => SESSION_LABEL[id]).join(", ");
      return `Các bữa: ${sessionText || "—"}`;
    });
};

const normalizeHistoryItem = (item) => {
  const merged =
    `${item?.action || ""} ${item?.subType || ""} ${item?.description || ""}`.toLowerCase();

  if (
    merged.includes("cancel") ||
    merged.includes("hủy") ||
    merged.includes("huy")
  ) {
    return {
      color: "#DC2626",
      title: "Hủy đăng ký",
      description: normalizeViText(
        item?.description || "Người dùng tự hủy đăng ký."
      ),
    };
  }
  if (
    merged.includes("update") ||
    merged.includes("chỉnh") ||
    merged.includes("sửa") ||
    merged.includes("sua")
  ) {
    return {
      color: "#2563EB",
      title: "Chỉnh sửa đăng ký",
      description: normalizeViText(
        item?.description || "Cập nhật lại suất ăn đã đăng ký."
      ),
    };
  }
  return {
    color: "#16A34A",
    title: "Đăng ký thành công",
    description: normalizeViText(
      item?.description || "Đăng ký suất ăn thành công."
    ),
  };
};

const dedupeHistory = (history) => {
  const map = new Map();
  (history || []).forEach((h) => {
    const key = `${String(h?.action || "").toLowerCase()}|${String(h?.description || "").toLowerCase()}|${moment(
      h?.changedAt || h?.timestamp
    ).format("YYYY-MM-DD HH:mm")}`;
    if (!map.has(key)) map.set(key, h);
  });
  return Array.from(map.values());
};

const buildFallbackHistory = (reg) => {
  const rows = [];
  if (reg?.registeredAt || reg?.createdAt) {
    rows.push({
      id: "created",
      changedAt: reg?.registeredAt || reg?.createdAt,
      action: "Đăng ký thành công",
      description: `Đăng ký ${Array.isArray(reg?.items) ? reg.items.length : 0} bữa`,
    });
  }
  if (String(reg?.status || "").toLowerCase() === "cancelled") {
    rows.push({
      id: "cancelled",
      changedAt: reg?.cancelledAt || reg?.updatedAt || reg?.updated_at,
      action: "Hủy đăng ký",
      description:
        reg?.cancelReason || reg?.note || "Người dùng tự hủy đăng ký.",
    });
  }
  return rows;
};

const RegistrationDetailModal = ({ open, reg, onClose, onEdit, onCancel }) => {
  if (!reg) return null;

  const meta = statusMeta(reg?.status);
  const canEdit = String(reg?.status || "").toLowerCase() === "upcoming";
  const canCancel = ["upcoming", "active"].includes(
    String(reg?.status || "").toLowerCase()
  );

  const sessionIds = Array.isArray(reg?.items)
    ? reg.items.map((i) => Number(i?.mealSessionId)).filter(Boolean)
    : [];

  const sortedMenuItems = Array.isArray(reg?.items)
    ? [...reg.items].sort(
        (a, b) =>
          SESSION_ORDER.indexOf(Number(a?.mealSessionId)) -
          SESSION_ORDER.indexOf(Number(b?.mealSessionId))
      )
    : [];

  const resolvedTotalCost = Number(
    reg?.totalCost ??
      reg?.total_cost ??
      sortedMenuItems.reduce(
        (sum, item) =>
          sum +
          Number(item?.priceAtTime ?? item?.price_at_time ?? item?.price ?? 0),
        0
      ) ??
      0
  );

  const historiesRaw =
    Array.isArray(reg?.history) && reg.history.length > 0
      ? reg.history
      : buildFallbackHistory(reg);

  const histories = dedupeHistory(historiesRaw)
    .sort(
      (a, b) =>
        moment(b?.changedAt || b?.timestamp).valueOf() -
        moment(a?.changedAt || a?.timestamp).valueOf()
    )
    .slice(0, 6);

  const registerTimeFromHistory = (() => {
    if (!histories.length) return null;
    const sortedAsc = [...histories].sort(
      (a, b) =>
        moment(a?.changedAt || a?.timestamp).valueOf() -
        moment(b?.changedAt || b?.timestamp).valueOf()
    );
    return sortedAsc[0]?.changedAt || sortedAsc[0]?.timestamp || null;
  })();

  const registerTimeValue =
    reg?.registeredAt ||
    reg?.registered_at ||
    reg?.createdAt ||
    reg?.created_at ||
    registerTimeFromHistory;

  const deadlineText = (() => {
    if (String(reg?.status || "").toLowerCase() === "cancelled") {
      if (reg?.cancelledAt)
        return `Hủy lúc ${moment(reg.cancelledAt).format("HH:mm DD/MM/YYYY")}`;
      return "Đã hủy";
    }
    const dateM = moment(reg?.date);
    if (!dateM.isValid()) return "—";
    return `Bạn có thể chỉnh sửa hoặc hủy đăng ký này trước 10:00 ngày ${dateM.format("DD/MM/YYYY")}`;
  })();

  const refundAmount = Number(reg?.refundAmount || reg?.refund_amount || 0);
  const isRefunded = Boolean(
    reg?.isRefunded || reg?.is_refunded || refundAmount > 0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1.2 }}
      >
        <AssignmentIcon sx={{ color: "#1E3A8A", fontSize: 18 }} />
        <Typography fontWeight={800} fontSize={30} color="#1E3A8A">
          Chi tiết đăng ký
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box
          onClick={onClose}
          sx={{ color: "#6B7280", cursor: "pointer", display: "inline-flex" }}
        >
          <CloseIcon />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Stack spacing={1.4}>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Ngày
                </Typography>
                <Typography fontWeight={700} color="#1E3A8A">
                  {moment(reg?.date).isValid()
                    ? moment(reg?.date).format("dddd, DD/MM/YYYY")
                    : "—"}
                </Typography>
              </Box>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Bữa ăn đăng ký
                </Typography>
                <Box mt={0.5}>
                  <SessionChips sessionIds={sessionIds} />
                </Box>
              </Box>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Thời gian đăng ký
                </Typography>
                <Typography fontWeight={600}>
                  {formatDateTime(registerTimeValue)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={6}>
            <Stack spacing={1.4}>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Trạng thái
                </Typography>
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{
                    bgcolor: meta.bg,
                    color: meta.color,
                    fontWeight: 700,
                    borderRadius: 1.2,
                    mt: 0.4,
                  }}
                />
              </Box>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Tổng chi phí
                </Typography>
                <Typography fontWeight={800} color="#EF4444">
                  {formatMoney(resolvedTotalCost)}
                </Typography>
              </Box>
              <Box>
                <Typography fontSize={12} color="#6B7280">
                  Hạn chỉnh sửa/hủy
                </Typography>
                <Typography fontWeight={700} color="#16A34A">
                  {deadlineText}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            p: 1.4,
            bgcolor: "#F9FAFB",
            borderRadius: 1.5,
            border: "1px solid #E5E7EB",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <CircleIcon sx={{ fontSize: 10, color: "#DC2626" }} />
            <Typography fontWeight={700} color="#1E3A8A">
              Menu chi tiết
            </Typography>
          </Stack>
          {sortedMenuItems.length > 0 ? (
            sortedMenuItems.map((item, idx) => (
              <Box
                key={`${item?.mealSessionId || idx}-${idx}`}
                sx={{ mb: idx === sortedMenuItems.length - 1 ? 0 : 1 }}
              >
                <Typography fontWeight={700} color="#92400E">
                  {item?.mealSession?.name || "Bữa ăn"} (
                  {item?.mealSession?.timeStart || "--:--"} -{" "}
                  {item?.mealSession?.timeEnd || "--:--"}):
                </Typography>
                <Typography fontSize={13} color="#4B5563">
                  {item?.dailyMenu?.dishName || "-"}
                </Typography>
                <Typography fontSize={13} fontWeight={700} color="#EF4444">
                  Giá:{" "}
                  {formatMoney(
                    item?.priceAtTime ?? item?.price_at_time ?? item?.price ?? 0
                  )}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography fontSize={13} color="#6B7280">
              Chưa có menu chi tiết
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            mt: 1.4,
            bgcolor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 1.2,
            p: 1.2,
          }}
        >
          <Typography fontSize={13} color="#334155">
            Lưu ý: {deadlineText}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography fontWeight={800} color="#1E3A8A" mb={1}>
            Lịch sử thay đổi
          </Typography>
          <Stack spacing={1.2}>
            {histories.length === 0 ? (
              <Typography fontSize={13} color="#6B7280">
                Chưa có lịch sử thay đổi.
              </Typography>
            ) : (
              histories.map((h, idx) => {
                const e = normalizeHistoryItem(h);
                return (
                  <Stack
                    key={h?.id || idx}
                    direction="row"
                    spacing={1.1}
                    alignItems="stretch"
                  >
                    <Box
                      sx={{ width: 16, position: "relative", flexShrink: 0 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: `2px solid ${e.color}`,
                          bgcolor: "#fff",
                          position: "absolute",
                          top: 9,
                          left: 2,
                        }}
                      />
                      {idx !== histories.length - 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 21,
                            left: 7,
                            width: 2,
                            bottom: -14,
                            bgcolor: "#E5E7EB",
                          }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        borderLeft: `3px solid ${e.color}`,
                        borderRadius: 1.2,
                        bgcolor: "#F8FAFC",
                        p: 1.1,
                      }}
                    >
                      <Typography fontSize={12} color="#6B7280">
                        {formatDateTime(h?.changedAt || h?.timestamp)}
                      </Typography>
                      <Typography fontWeight={800} color={e.color}>
                        {e.title}
                      </Typography>
                      <Typography fontSize={13} color="#374151">
                        {e.description}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 2,
            bgcolor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 1.2,
            p: 1.2,
          }}
        >
          <Typography fontSize={13} color="#374151">
            Trạng thái hoàn tiền:{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {isRefunded
                ? `Đã hoàn ${formatMoney(refundAmount)}`
                : "Chưa hoàn tiền"}
            </Box>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.8, justifyContent: "space-between" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: "none",
            bgcolor: "#6B7280",
            borderRadius: 1.1,
            minWidth: 74,
          }}
        >
          Đóng
        </Button>
        <Stack direction="row" spacing={1}>
          {canEdit && (
            <Button
              onClick={() => onEdit?.(reg)}
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                textTransform: "none",
                bgcolor: "#2563EB",
                borderRadius: 1.1,
                minWidth: 100,
              }}
            >
              Chỉnh sửa
            </Button>
          )}
          {canCancel && (
            <Button
              onClick={() => onCancel?.(reg)}
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              sx={{ textTransform: "none", borderRadius: 1.1, minWidth: 108 }}
            >
              Hủy đăng ký
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationDetailModal;
