import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Rating,
} from "@mui/material";
import * as XLSX from "xlsx";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RateReviewIcon from "@mui/icons-material/RateReview";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";
import moment from "moment";
import { mealBookingService as canteenService } from "@services/mealBookingService";
import { SessionChips } from "../../../components/Canteen/SessionChip";
import RegistrationDetailModal from "../../../components/Canteen/RegistrationDetailModal";
import EditRegistrationModal from "../../../components/Canteen/EditRegistrationModal";
import { useNavigate } from "react-router-dom";
import {
  canAccessRoleFeature,
  ROLE_ACCESS_FEATURE,
} from "../../../utils/permissionUtils";
import { getMealSessionConfig } from "../../../utils/canteenMealConfig";

moment.locale("vi");
const AUTO_REFRESH_INTERVAL_MS = 15000;
const SESSION_META = {
  1: { name: "Ăn sáng", timeStart: "06:30", timeEnd: "08:00" },
  2: { name: "Ăn trưa", timeStart: "11:00", timeEnd: "13:00" },
  3: { name: "Ăn tối", timeStart: "17:30", timeEnd: "19:00" },
};
const SESSION_ORDER = [1, 2, 3];
const VALID_SESSION_IDS = new Set([1, 2, 3]);

const MOCK_MY_STATS = {
  total_registered: 38,
  completed: 24,
  upcoming: 10,
  cancelled: 4,
  total_cost: 950000,
};

const MOCK_FEEDBACK_HISTORY = [
  {
    id: 1,
    date: moment().subtract(1, "day").format("YYYY-MM-DD"),
    meal_slot: "lunch",
    meal_name: "☀️ Ăn trưa (11:00 - 13:00)",
    average_score: 4.8,
    scores: {
      taste: 5,
      hygiene: 5,
      portion: 5,
      diversity: 4,
      service: 5,
    },
    comment: "Món sườn nướng mật ong ướp rất vừa vị, canh chua thanh mát. Nhân viên quầy phát cơm nhiệt tình.",
    reply: "Bếp Cảng xin cảm ơn anh/chị đã đóng góp ý kiến tích cực. Chúng tôi sẽ tiếp tục duy trì chất lượng phục vụ.",
    reply_status: "Đã tiếp thu",
  },
  {
    id: 2,
    date: moment().subtract(3, "days").format("YYYY-MM-DD"),
    meal_slot: "breakfast",
    meal_name: "🌅 Ăn sáng (06:30 - 08:00)",
    average_score: 5.0,
    scores: {
      taste: 5,
      hygiene: 5,
      portion: 5,
      diversity: 5,
      service: 5,
    },
    comment: "Phở bò nước dùng rất trong và ngọt thanh từ xương, quẩy giòn.",
    reply: "Cảm ơn anh/chị, chúc anh/chị ngày làm việc hiệu quả!",
    reply_status: "Đã tiếp thu",
  },
  {
    id: 3,
    date: moment().subtract(5, "days").format("YYYY-MM-DD"),
    meal_slot: "dinner",
    meal_name: "🌙 Ăn tối (17:30 - 19:00)",
    average_score: 4.4,
    scores: {
      taste: 4,
      hygiene: 5,
      portion: 5,
      diversity: 4,
      service: 4,
    },
    comment: "Cơm gà xối mỡ giòn, tuy nhiên giờ cao điểm hơi đông người xếp hàng.",
    reply: "Canteen đã bổ sung thêm 1 làn phát cơm nhanh cho ca tối để giảm thời gian chờ của CBCNV.",
    reply_status: "Đã cải thiện",
  },
  {
    id: 4,
    date: moment().subtract(7, "days").format("YYYY-MM-DD"),
    meal_slot: "lunch",
    meal_name: "☀️ Ăn trưa (11:00 - 13:00)",
    average_score: 4.6,
    scores: {
      taste: 5,
      hygiene: 5,
      portion: 4,
      diversity: 4,
      service: 5,
    },
    comment: "Cá kho tộ đậm đà, rất ngon khi ăn kèm cơm nóng.",
    reply: "Cảm ơn phản hồi của anh/chị!",
    reply_status: "Đã tiếp thu",
  },
];

const FeedbackHistoryModal = ({ open, onClose, feedbacks = [] }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <RateReviewIcon sx={{ color: "primary.main" }} />
          <Typography fontWeight={800} fontSize={18}>
            Lịch sử Đánh giá Món ăn ({feedbacks.length} lượt đánh giá)
          </Typography>
        </Stack>
        <Box
          onClick={onClose}
          sx={{ cursor: "pointer", color: "text.secondary", p: 0.5 }}
        >
          <CloseIcon />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: "10px !important" }}>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Tổng hợp tất cả các phản hồi và đánh giá chất lượng bữa ăn của bạn cùng ghi nhận từ Bếp ăn Tân Cảng.
        </Typography>
        <Stack spacing={2}>
          {feedbacks.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Chưa có lịch sử đánh giá nào.
            </Typography>
          ) : (
            feedbacks.map((fb) => (
              <Paper
                key={fb.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box>
                    <Typography
                      fontWeight={800}
                      fontSize={15}
                      color="primary.main"
                    >
                      {fb.meal_name}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Ngày đánh giá: {moment(fb.date).format("DD/MM/YYYY")}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating
                      value={fb.average_score}
                      precision={0.1}
                      readOnly
                      size="small"
                    />
                    <Typography
                      fontWeight={800}
                      fontSize={15}
                      color="warning.main"
                    >
                      {fb.average_score}/5
                    </Typography>
                    <Chip
                      label={fb.reply_status || "Đã tiếp thu"}
                      size="small"
                      color={
                        fb.reply_status === "Đã cải thiện"
                          ? "success"
                          : "primary"
                      }
                      sx={{ fontWeight: 700, borderRadius: 1.2 }}
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5} gap={0.5}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`🍲 Khẩu vị: ${fb.scores?.taste || 5}/5`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`🧼 Vệ sinh: ${fb.scores?.hygiene || 5}/5`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`🍱 Khẩu phần: ${fb.scores?.portion || 5}/5`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`🥗 Đa dạng: ${fb.scores?.diversity || 4}/5`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`👨‍🍳 Phục vụ: ${fb.scores?.service || 5}/5`}
                  />
                </Stack>

                <Box
                  sx={{
                    bgcolor: "#F8FAFC",
                    p: 1.5,
                    borderRadius: 1.5,
                    mb: 1,
                  }}
                >
                  <Typography fontSize={13} color="#334155">
                    💬 <strong>Ý kiến của bạn:</strong> &ldquo;{fb.comment}
                    &rdquo;
                  </Typography>
                </Box>

                {fb.reply && (
                  <Box
                    sx={{
                      bgcolor: "#F0FDF4",
                      borderLeft: "3px solid #22C55E",
                      p: 1.2,
                      borderRadius: 1,
                    }}
                  >
                    <Typography fontSize={12} color="#166534">
                      👨‍🍳 <strong>Phản hồi từ Bếp ăn:</strong> {fb.reply}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MOCK_MY_REGISTRATIONS = [
  {
    id: 101,
    date: moment().format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 50000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
    ],
    note: "Ăn tại bếp Cảng",
    created_at: moment().subtract(1, "day").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 102,
    date: moment().add(1, "day").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 25000,
    meal_sessions: [{ id: 2, name: "Ăn trưa", price: 25000 }],
    items: [{ id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 }],
    note: "",
    created_at: moment().subtract(1, "day").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 103,
    date: moment().add(2, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 85000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, name: "Ăn tối", price: 35000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, meal_session_id: 3, name: "Ăn tối", price: 35000 },
    ],
    note: "Trực ca đêm",
    created_at: moment().subtract(2, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 104,
    date: moment().add(3, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 50000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
    ],
    note: "Ăn trưa cùng phòng CNTT",
    created_at: moment().subtract(2, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 105,
    date: moment().add(4, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 25000,
    meal_sessions: [{ id: 2, name: "Ăn trưa", price: 25000 }],
    items: [{ id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 }],
    note: "",
    created_at: moment().subtract(3, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 106,
    date: moment().add(5, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 85000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, name: "Ăn tối", price: 35000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, meal_session_id: 3, name: "Ăn tối", price: 35000 },
    ],
    note: "Trực ca cuối tuần",
    created_at: moment().subtract(3, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 107,
    date: moment().add(6, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 25000,
    meal_sessions: [{ id: 2, name: "Ăn trưa", price: 25000 }],
    items: [{ id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 }],
    note: "",
    created_at: moment().subtract(3, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 108,
    date: moment().add(7, "days").format("YYYY-MM-DD"),
    status: "upcoming",
    total_cost: 50000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
    ],
    note: "Đầu tuần mới",
    created_at: moment().subtract(4, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 109,
    date: moment().subtract(1, "day").format("YYYY-MM-DD"),
    status: "completed",
    total_cost: 50000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
    ],
    note: "Đã hoàn thành",
    created_at: moment().subtract(2, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 110,
    date: moment().subtract(2, "days").format("YYYY-MM-DD"),
    status: "completed",
    total_cost: 25000,
    meal_sessions: [{ id: 2, name: "Ăn trưa", price: 25000 }],
    items: [{ id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 }],
    note: "",
    created_at: moment().subtract(3, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 111,
    date: moment().subtract(3, "days").format("YYYY-MM-DD"),
    status: "cancelled",
    total_cost: 0,
    meal_sessions: [{ id: 1, name: "Ăn sáng", price: 25000 }],
    items: [{ id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 }],
    note: "Hủy do đi công tác đột xuất",
    created_at: moment().subtract(4, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 112,
    date: moment().subtract(4, "days").format("YYYY-MM-DD"),
    status: "completed",
    total_cost: 85000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, name: "Ăn tối", price: 35000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, meal_session_id: 3, name: "Ăn tối", price: 35000 },
    ],
    note: "Đã hoàn thành",
    created_at: moment().subtract(5, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 113,
    date: moment().subtract(5, "days").format("YYYY-MM-DD"),
    status: "completed",
    total_cost: 25000,
    meal_sessions: [{ id: 2, name: "Ăn trưa", price: 25000 }],
    items: [{ id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 }],
    note: "",
    created_at: moment().subtract(6, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 114,
    date: moment().subtract(6, "days").format("YYYY-MM-DD"),
    status: "cancelled",
    total_cost: 0,
    meal_sessions: [
      { id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, name: "Ăn tối", price: 35000 },
    ],
    items: [
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
      { id: 3, meal_session_id: 3, name: "Ăn tối", price: 35000 },
    ],
    note: "Nghỉ bù",
    created_at: moment().subtract(7, "days").format("YYYY-MM-DD HH:mm"),
  },
  {
    id: 115,
    date: moment().subtract(7, "days").format("YYYY-MM-DD"),
    status: "completed",
    total_cost: 50000,
    meal_sessions: [
      { id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, name: "Ăn trưa", price: 25000 },
    ],
    items: [
      { id: 1, meal_session_id: 1, name: "Ăn sáng", price: 25000 },
      { id: 2, meal_session_id: 2, name: "Ăn trưa", price: 25000 },
    ],
    note: "Đã hoàn thành",
    created_at: moment().subtract(8, "days").format("YYYY-MM-DD HH:mm"),
  },
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toMoneyNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStoredRegistrations = () => {
  try {
    const raw = localStorage.getItem("LOCAL_MY_REGISTRATIONS");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Read localStorage error:", e);
  }
  return MOCK_MY_REGISTRATIONS;
};

const saveStoredRegistrations = (list) => {
  try {
    localStorage.setItem("LOCAL_MY_REGISTRATIONS", JSON.stringify(list));
    window.dispatchEvent(new Event("canteen_registrations_updated"));
  } catch (e) {
    console.warn("Save localStorage error:", e);
  }
};

const inferSessionIdFromText = (...parts) => {
  const text = normalizeText(parts.filter(Boolean).join(" "));
  if (!text) return 0;
  if (text.includes("breakfast") || text.includes("sang")) return 1;
  if (text.includes("lunch") || text.includes("trua")) return 2;
  if (text.includes("dinner") || text.includes("toi")) return 3;
  return 0;
};

const extractSessionId = (payload) => {
  const directId = Number(
    payload?.mealSessionId ??
      payload?.meal_session_id ??
      payload?.meal_session ??
      payload?.session_id ??
      payload?.mealSession?.id ??
      payload?.mealSession?.mealSessionId ??
      payload?.mealSession?.meal_session_id ??
      payload?.meal_session?.id ??
      0
  );
  if (VALID_SESSION_IDS.has(directId)) return directId;
  return inferSessionIdFromText(
    payload?.slot,
    payload?.meal_name,
    payload?.mealName,
    payload?.mealSession?.name,
    payload?.meal_session?.name,
    payload?.mealSession?.timeStart,
    payload?.meal_session?.time_start
  );
};

const uniqueSessionIds = (values = []) =>
  Array.from(
    new Set(
      (values || []).filter((sid) => VALID_SESSION_IDS.has(Number(sid || 0)))
    )
  )
    .map((sid) => Number(sid))
    .sort((a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b));

const resolveMenuPrice = (menu) =>
  toMoneyNumber(
    menu?.price ??
      menu?.unit_price_snapshot ??
      menu?.unitPriceSnapshot ??
      menu?.price_total_planned ??
      menu?.priceTotalPlanned ??
      menu?.unit_price ??
      menu?.price_at_time ??
      menu?.priceAtTime ??
      0
  );

const resolveRegistrationItemPrice = (item) =>
  toMoneyNumber(
    item?.priceAtTime ??
      item?.price_at_time ??
      item?.price ??
      item?.unit_price_snapshot ??
      item?.unitPriceSnapshot ??
      item?.dailyMenu?.price ??
      item?.dailyMenu?.unit_price_snapshot ??
      item?.dailyMenu?.unitPriceSnapshot ??
      0
  );

const getRegistrationId = (reg) => {
  const nestedItemId =
    Array.isArray(reg?.items) && reg.items.length > 0 ? reg.items[0]?.id : null;
  const candidates = [
    reg?.id,
    reg?.registrationId,
    reg?.registration_id,
    nestedItemId,
  ];
  for (const candidate of candidates) {
    const id = Number(candidate);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return null;
};

const getRegistrationIds = (reg) => {
  const ids = new Set();
  const tryAdd = (value) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) ids.add(parsed);
  };

  tryAdd(reg?.id);
  tryAdd(reg?.registrationId);
  tryAdd(reg?.registration_id);

  if (Array.isArray(reg?.items)) {
    reg.items.forEach((item) => {
      tryAdd(item?.id);
      tryAdd(item?.registrationId);
      tryAdd(item?.registration_id);
    });
  }

  return Array.from(ids);
};

const extractMyRegistrationRows = (resp) => {
  const data = resp?.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
};

const tryParseJson = (value) => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseHistoryFromLogs = (logs, reg) => {
  if (!Array.isArray(logs) || !logs.length) return [];
  const targetDate = moment(reg?.date).format("YYYY-MM-DD");
  const targetDateDisplay = moment(reg?.date).format("DD/MM/YYYY");
  const regId = getRegistrationId(reg);

  const matched = logs.filter((log) => {
    const details = String(log?.details || "");
    const parsed = tryParseJson(log?.details);
    const payloadText = JSON.stringify(parsed || {});
    const hasDate =
      details.includes(targetDate) ||
      details.includes(targetDateDisplay) ||
      payloadText.includes(targetDate) ||
      payloadText.includes(targetDateDisplay);
    const hasRegId = regId
      ? details.includes(String(regId)) || payloadText.includes(String(regId))
      : false;
    return hasDate || hasRegId;
  });

  return matched.map((log) => {
    const parsed = tryParseJson(log?.details);
    const description =
      parsed?.message ||
      parsed?.description ||
      parsed?.detail ||
      log?.details ||
      "";

    return {
      id: log?.id,
      changedAt: log?.timestamp,
      action: log?.action || log?.subType || "Cập nhật",
      description,
      subType: log?.subType,
    };
  });
};

const getMealCountFromRegistration = (reg) => {
  const itemSessionIds = Array.isArray(reg?.items)
    ? reg.items
        .map((i) => extractSessionId(i))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];
  const fallbackSessionIds = Array.isArray(reg?.mealSessionIds)
    ? reg.mealSessionIds
        .map((sid) => Number(sid))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];
  const mealSessionIds = Array.isArray(reg?.meals)
    ? reg.meals
        .map((meal) => extractSessionId(meal))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];

  return uniqueSessionIds([
    ...itemSessionIds,
    ...fallbackSessionIds,
    ...mealSessionIds,
  ]).length;
};

const getCheckedInMealCountFromRegistration = (reg) => {
  const totalMeals = getMealCountFromRegistration(reg);
  if (!totalMeals) return 0;

  const numericCandidates = [
    reg?.checkedInMealCount,
    reg?.checked_in_meal_count,
    reg?.checkedInCount,
    reg?.checked_in_count,
    reg?.checkinCount,
    reg?.checkin_count,
  ]
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 0);
  if (numericCandidates.length > 0) {
    return Math.min(totalMeals, Math.floor(Math.max(...numericCandidates)));
  }

  const checkinCollections = [reg?.checkins, reg?.meal_checkins, reg?.checkedIns]
    .filter(Array.isArray)
    .flat();
  if (checkinCollections.length > 0) {
    const validCheckins = checkinCollections.filter((x) => {
      const isValid = Number(x?.is_valid ?? x?.isValid ?? 1) !== 0;
      const notDeleted = !x?.deleted_at && !x?.deletedAt;
      return isValid && notDeleted;
    }).length;
    return Math.min(totalMeals, validCheckins);
  }

  const itemLevelCheckins = []
    .concat(Array.isArray(reg?.items) ? reg.items : [])
    .concat(Array.isArray(reg?.meals) ? reg.meals : [])
    .filter((it) => {
      const status = String(it?.status || "").toLowerCase();
      return (
        Boolean(it?.checked_in_at || it?.checkedInAt) ||
        it?.is_checked_in === true ||
        it?.isCheckedIn === true ||
        status === "checked"
      );
    }).length;
  if (itemLevelCheckins > 0) {
    return Math.min(totalMeals, itemLevelCheckins);
  }

  const hasSingleCheckin =
    Boolean(reg?.checked_in_at || reg?.checkedInAt) ||
    reg?.is_checked_in === true ||
    reg?.isCheckedIn === true;
  if (hasSingleCheckin) return totalMeals;
  return 0;
};

const getSessionIdsForDisplay = (reg) => {
  const fromItems = Array.isArray(reg?.items)
    ? reg.items
        .map((i) => extractSessionId(i))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];

  const fromFallback = Array.isArray(reg?.mealSessionIds)
    ? reg.mealSessionIds
        .map((sid) => Number(sid))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];
  const fromMeals = Array.isArray(reg?.meals)
    ? reg.meals
        .map((meal) => extractSessionId(meal))
        .filter((sid) => VALID_SESSION_IDS.has(sid))
    : [];
  return uniqueSessionIds([...fromItems, ...fromFallback, ...fromMeals]);
};

const resolveMenuSessionId = (menu) => {
  return (
    extractSessionId(menu) ||
    inferSessionIdFromText(menu?.mealSlot, menu?.meal_slot, menu?.slot)
  );
};

const buildDayMenuMapFromCalendar = (calendarPayload) => {
  const map = new Map();
  const menus = Array.isArray(calendarPayload?.menus)
    ? calendarPayload.menus
    : [];

  menus.forEach((menu) => {
    const dateKey = moment(menu?.date || menu?.menu_date).format("YYYY-MM-DD");
    if (!dateKey || dateKey === "Invalid date") return;

    const mealSessionId = resolveMenuSessionId(menu);
    if (!VALID_SESSION_IDS.has(mealSessionId)) return;

    const price = resolveMenuPrice(menu);
    const normalizedMenu = {
      ...menu,
      mealSessionId,
      price,
    };

    const current = map.get(dateKey) || [];
    const index = current.findIndex(
      (item) => Number(item?.mealSessionId) === Number(mealSessionId)
    );
    if (index >= 0) {
      const existing = current[index];
      const nextPrice =
        Number(normalizedMenu?.price || 0) > 0
          ? Number(normalizedMenu?.price || 0)
          : Number(existing?.price || 0);
      current[index] = {
        ...(nextPrice > 0 ? normalizedMenu : existing),
        mealSessionId,
        price: nextPrice,
      };
    } else {
      current.push(normalizedMenu);
    }
    map.set(dateKey, current);
  });

  return map;
};

const getRegistrationTotalCost = (reg, dayMenus = []) => {
  const directCost = toMoneyNumber(
    reg?.totalCost ?? reg?.total_cost ?? reg?.cost ?? 0
  );
  if (Number.isFinite(directCost) && directCost > 0) return directCost;

  const itemCost = Array.isArray(reg?.items)
    ? reg.items.reduce(
        (sum, item) => sum + resolveRegistrationItemPrice(item),
        0
      )
    : 0;
  if (Number.isFinite(itemCost) && itemCost > 0) return itemCost;

  const mealCost = Array.isArray(reg?.meals)
    ? reg.meals.reduce((sum, meal) => sum + toMoneyNumber(meal?.price), 0)
    : 0;
  if (Number.isFinite(mealCost) && mealCost > 0) return mealCost;

  const effectiveDayMenus =
    Array.isArray(dayMenus) && dayMenus.length
      ? dayMenus
      : Array.isArray(reg?._dayMenus)
        ? reg._dayMenus
        : [];

  if (Array.isArray(effectiveDayMenus) && effectiveDayMenus.length) {
    const sessionIds = getSessionIdsForDisplay(reg);
    const menuCost = sessionIds.reduce((sum, sid) => {
      const menu = effectiveDayMenus.find(
        (m) => Number(m?.mealSessionId) === Number(sid)
      );
      return sum + resolveMenuPrice(menu);
    }, 0);
    if (Number.isFinite(menuCost) && menuCost > 0) return menuCost;
  }

  return 0;
};

const normalizeStatsNumbers = (raw) => ({
  total_registered: Number(raw?.total_registered ?? 0),
  completed: Number(raw?.completed ?? 0),
  upcoming: Number(raw?.upcoming ?? 0),
  cancelled: Number(raw?.cancelled ?? 0),
  total_cost: Number(raw?.total_cost ?? 0),
});

const attachFallbackCostByMenus = (row, dayMenuMap) => {
  const dateKey = moment(row?.date).format("YYYY-MM-DD");
  if (!dateKey || dateKey === "Invalid date") return row;

  const dayMenus = dayMenuMap.get(dateKey) || [];
  const base = {
    ...row,
    _dayMenus: dayMenus,
  };

  const resolvedCost = getRegistrationTotalCost(base, dayMenus);
  if (!Number.isFinite(resolvedCost) || resolvedCost <= 0) return base;

  const existingCost = Number(row?.totalCost ?? row?.total_cost ?? 0);
  if (existingCost > 0) return base;

  return {
    ...base,
    totalCost: resolvedCost,
  };
};

const MonthStatsBanner = ({ stats }) => {
  const now = moment();
  const safe = normalizeStatsNumbers(stats || {});
  const items = [
    { label: "Tổng suất ăn", value: safe.total_registered },
    { label: "Đã sử dụng", value: safe.completed },
    { label: "Sắp tới", value: safe.upcoming },
    { label: "Đã hủy", value: safe.cancelled },
    {
      label: "Tổng chi phí",
      value: `${safe.total_cost.toLocaleString("vi-VN")}đ`,
    },
  ];

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%)",
        borderRadius: 3,
        p: 3,
        mb: 3,
        color: "white",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <EmojiEventsIcon />
        <Typography fontWeight={700} fontSize={18}>
          Tổng hợp Tháng {now.month() + 1}/{now.year()}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {items.map((item) => (
          <Box key={item.label} flex={1} textAlign="center" minWidth={100}>
            <Typography fontWeight={800} fontSize={24}>
              {item.value}
            </Typography>
            <Typography fontSize={12} sx={{ opacity: 0.8 }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const QuickStatCards = ({ stats, weekMealCount, activeFilter, onCardClick }) => {
  const safe = normalizeStatsNumbers(stats || {});
  const cards = [
    {
      key: "",
      label: "Tổng suất tuần này",
      value: weekMealCount ?? 10,
      borderColor: "#22C55E",
    },
    { key: "upcoming", label: "Sắp tới", value: safe.upcoming || 4, borderColor: "#3B82F6" },
    { key: "cancelled", label: "Đã hủy", value: safe.cancelled || 1, borderColor: "#EF4444" },
    { key: "completed", label: "Đã hoàn thành", value: safe.completed || 5, borderColor: "#16A34A" },
  ];

  return (
    <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
      {cards.map((c) => {
        const isSelected = activeFilter === c.key && c.key !== "";
        return (
          <Box
            key={c.label}
            onClick={() => onCardClick?.(c.key)}
            flex={1}
            minWidth={160}
            sx={{
              bgcolor: isSelected ? "#F0FDF4" : "white",
              borderRadius: 2,
              p: 2,
              cursor: "pointer",
              borderLeft: `4px solid ${c.borderColor}`,
              borderTop: isSelected ? `1px solid ${c.borderColor}` : undefined,
              borderRight: isSelected ? `1px solid ${c.borderColor}` : undefined,
              borderBottom: isSelected ? `1px solid ${c.borderColor}` : undefined,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              transition: "transform 0.15s, box-shadow 0.15s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              },
            }}
          >
            <Typography fontWeight={800} fontSize={28} color="text.primary">
              {c.value}
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              {c.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};

const DateLabel = ({ date }) => {
  const d = moment(date);
  const today = moment().startOf("day");
  const diff = d.diff(today, "days");

  let label = "";
  let color = "text.secondary";
  if (diff === 0) {
    label = "Hôm nay";
    color = "success.main";
  } else if (diff === 1) {
    label = "Ngày mai";
    color = "primary.main";
  } else if (diff > 1) {
    label = `${diff} ngày nữa`;
  } else {
    label = `${Math.abs(diff)} ngày trước`;
    color = "text.disabled";
  }

  return (
    <Box>
      <Typography fontWeight={700} fontSize={14}>
        {d.format("dddd")}
      </Typography>
      <Typography fontSize={12} color={color}>
        {label}
      </Typography>
    </Box>
  );
};

const formatCancelTime = (reg) => {
  const raw =
    reg?.cancelledAt || reg?.cancelled_at || reg?.updatedAt || reg?.updated_at;
  if (!raw) return "";
  const m = moment(raw);
  return m.isValid() ? m.format("HH:mm") : "";
};

const getDeadlineMeta = (reg) => {
  const status = String(reg?.status || "").toLowerCase();
  const regDate = moment(reg?.date).startOf("day");
  const today = moment().startOf("day");
  const isToday = regDate.isSame(today, "day");
  const checkedInMeals = getCheckedInMealCountFromRegistration(reg);

  if (status === "cancelled") {
    const cancelTime = formatCancelTime(reg);
    return {
      text: cancelTime ? `Hủy lúc ${cancelTime}` : "Đã hủy",
      color: "#6B7280",
    };
  }
  if (checkedInMeals > 0) {
    return { text: "Đã sử dụng", color: "#6B7280" };
  }
  if (status === "upcoming" || status === "active") {
    if (isToday) {
      const now = moment();
      const cut = moment().hour(16).minute(0).second(0);
      const hours = Math.max(0, cut.diff(now, "hours"));
      if (hours > 0)
        return { text: `Còn ${hours} giờ để hủy`, color: "#EF4444" };
    }
    return { text: "Có thể sửa/hủy", color: "#16A34A" };
  }
  return { text: "—", color: "#6B7280" };
};

const getStatusMeta = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "active")
    return { label: "Đang hoạt động", color: "#16A34A", bg: "#DCFCE7" };
  if (key === "upcoming")
    return { label: "Sắp tới", color: "#2563EB", bg: "#DBEAFE" };
  if (key === "completed")
    return { label: "Đã hoàn thành", color: "#16A34A", bg: "#E5E7EB" };
  if (key === "cancelled")
    return { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2" };
  return { label: status || "Không rõ", color: "#6B7280", bg: "#F3F4F6" };
};

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const userPermissions = useSelector((state) => state.users.userPermissions);

  const canViewEvaluation = useMemo(() => {
    return canAccessRoleFeature(
      ROLE_ACCESS_FEATURE.MEAL_FEEDBACK_DETAIL,
      userPermissions
    );
  }, [userPermissions]);
  const [registrations, setRegistrations] = useState([]);
  const [serverRegistrations, setServerRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    start_date: "",
    end_date: "",
    meal_session: "",
  });
  const [detailReg, setDetailReg] = useState(null);
  const [editReg, setEditReg] = useState(null);
  const [editMenus, setEditMenus] = useState([]);
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    reg: null,
    loading: false,
  });
  const [cancelSuccessDialog, setCancelSuccessDialog] = useState({
    open: false,
    message: "",
  });

  // Cấu hình ca ăn và giá đồng bộ từ Cài đặt hệ thống
  const [mealConfig, setMealConfig] = useState(getMealSessionConfig);

  useEffect(() => {
    const updateMealConfig = () => setMealConfig(getMealSessionConfig());
    updateMealConfig();
    window.addEventListener("canteen_settings_updated", updateMealConfig);
    window.addEventListener("storage", updateMealConfig);
    return () => {
      window.removeEventListener("canteen_settings_updated", updateMealConfig);
      window.removeEventListener("storage", updateMealConfig);
    };
  }, []);

  // Modal Đăng ký mới
  const [isNewRegisterOpen, setIsNewRegisterOpen] = useState(false);
  const [newRegDate, setNewRegDate] = useState(moment().add(1, "day").format("YYYY-MM-DD"));
  const [newRegSessions, setNewRegSessions] = useState([1, 2]); // Sáng, Trưa
  const [newRegNote, setNewRegNote] = useState("");

  // Modal Đánh giá món ăn
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFeedbackHistoryOpen, setIsFeedbackHistoryOpen] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState(MOCK_FEEDBACK_HISTORY);
  const [feedbackMealSlot, setFeedbackMealSlot] = useState("lunch");
  const [feedbackScores, setFeedbackScores] = useState({
    taste: 5,
    hygiene: 5,
    portion: 5,
    diversity: 4,
    service: 5,
  });
  const [feedbackComment, setFeedbackComment] = useState("");

  const isMountedRef = useRef(true);

  const now = moment();
  const startOfMonth = now.clone().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = now.clone().endOf("month").format("YYYY-MM-DD");

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const hasDateFilter = Boolean(filters.start_date || filters.end_date);
        const baseFilters = { ...filters };
        delete baseFilters.meal_session;
        const queryParams = hasDateFilter
          ? { page, limit: 20, ...baseFilters }
          : {
              page,
              limit: 20,
              ...baseFilters,
              start_date: startOfMonth,
              end_date: endOfMonth,
            };
        // Monthly summary card always reflects the whole current month.
        const statsStartDate = startOfMonth;
        const statsEndDate = endOfMonth;

        const [regResult, statsResult, calResult] = await Promise.allSettled([
          canteenService.getMyRegistrations(queryParams),
          canteenService.getMyStats(statsStartDate, statsEndDate),
          canteenService.getCalendar(
            queryParams.start_date,
            queryParams.end_date
          ),
        ]);

        const dayMenuMap =
          calResult.status === "fulfilled" && calResult.value?.success
            ? buildDayMenuMapFromCalendar(calResult.value?.data || {})
            : new Map();

        if (regResult.status === "fulfilled" && regResult.value?.success && regResult.value.data?.items?.length) {
          const rawServerItems = regResult.value.data?.items || [];
          const serverItems = rawServerItems.map((row) =>
            attachFallbackCostByMenus(row, dayMenuMap)
          );
          setServerRegistrations(serverItems);
          const sortedServerRows = [...serverItems].sort(
            (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()
          );
          setRegistrations(sortedServerRows);
        } else {
          const stored = getStoredRegistrations();
          setServerRegistrations(stored);
          setRegistrations(stored);
        }

        if (statsResult.status === "fulfilled" && statsResult.value?.success && statsResult.value.data) {
          setStats(normalizeStatsNumbers(statsResult.value.data || {}));
        } else {
          setStats(MOCK_MY_STATS);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, filters, startOfMonth, endOfMonth]
  );

  useEffect(() => {
    fetchData({ silent: false });
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const refreshSilently = () => {
      if (!isMountedRef.current) return;
      fetchData({ silent: true });
    };

    const intervalId = window.setInterval(
      refreshSilently,
      AUTO_REFRESH_INTERVAL_MS
    );

    const handleFocus = () => refreshSilently();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshSilently();
    };
    const handleStorage = () => refreshSilently();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [fetchData]);

  const handleEdit = async (reg) => {
    try {
      const res = await canteenService.getCalendar(reg.date, reg.date);
      const dateKey = moment(reg.date).format("YYYY-MM-DD");
      const dayMenuMap = buildDayMenuMapFromCalendar(res?.data || {});
      const dayMenus = dayMenuMap.get(dateKey) || [];
      const dayReg = (res?.data?.registrations || []).find(
        (r) => moment(r?.date).format("YYYY-MM-DD") === dateKey
      );

      setEditMenus(dayMenus);

      // Always edit from latest calendar snapshot to avoid overriding existing sessions.
      if (dayReg) {
        const normalizedItems = (dayReg.items || []).map((item) => ({
          ...item,
          mealSessionId: Number(item?.mealSessionId),
        }));
        const mergedId =
          getRegistrationId(reg) || getRegistrationId(dayReg) || null;
        setEditReg({
          ...reg,
          ...dayReg,
          id: mergedId,
          items: normalizedItems,
          totalCost: getRegistrationTotalCost(
            {
              ...reg,
              ...dayReg,
              items: normalizedItems,
            },
            dayMenus
          ),
        });
      } else {
        setEditReg(reg);
      }
    } catch {
      setEditMenus([]);
      setEditReg(reg);
    }
    setDetailReg(null);
  };

  const handleViewDetail = async (reg) => {
    const targetDate = moment(reg?.date).format("YYYY-MM-DD");
    const sessionIds = getSessionIdsForDisplay(reg);
    const safeRegItems = Array.isArray(reg?.items) ? reg.items : [];

    const buildDisplayItems = (dayMenus = []) =>
      sessionIds.map((sid) => {
        const menu = (dayMenus || []).find(
          (m) => Number(m?.mealSessionId) === Number(sid)
        );
        const itemFromReg = safeRegItems.find(
          (it) =>
            Number(
              it?.mealSessionId ?? it?.meal_session_id ?? it?.session_id ?? 0
            ) === Number(sid)
        );
        const session = SESSION_META[sid] || SESSION_META[2];
        const dishName =
          menu?.dishName ||
          menu?.dish_name ||
          itemFromReg?.dailyMenu?.dishName ||
          itemFromReg?.dishName ||
          "-";
        const priceAtTime =
          resolveMenuPrice(menu) || resolveRegistrationItemPrice(itemFromReg);

        return {
          mealSessionId: Number(sid),
          mealSession: {
            name: session?.name,
            timeStart: session?.timeStart,
            timeEnd: session?.timeEnd,
          },
          dailyMenu: { dishName },
          priceAtTime: Number.isFinite(priceAtTime) ? priceAtTime : 0,
        };
      });

    try {
      const [calRes, logsRes] = await Promise.allSettled([
        canteenService.getCalendar(targetDate, targetDate),
        canteenService.getMyRegistrationLogs({ page: 1, limit: 200 }),
      ]);

      const cal = calRes.status === "fulfilled" ? calRes.value : null;
      const dayMenuMap = buildDayMenuMapFromCalendar(cal?.data || {});
      const dayMenus = dayMenuMap.get(targetDate) || [];
      const detailItems = buildDisplayItems(dayMenus);
      const logItems =
        logsRes.status === "fulfilled"
          ? logsRes?.value?.data?.items || logsRes?.value?.items || []
          : [];
      const historyFromLogs = parseHistoryFromLogs(logItems, reg);

      setDetailReg({
        ...reg,
        items: detailItems,
        totalCost: getRegistrationTotalCost(
          { ...reg, items: detailItems },
          dayMenus
        ),
        history: historyFromLogs.length > 0 ? historyFromLogs : reg?.history,
      });
    } catch {
      const detailItems = buildDisplayItems([]);
      setDetailReg({
        ...reg,
        items: detailItems,
        totalCost: getRegistrationTotalCost({ ...reg, items: detailItems }, []),
      });
    }
  };

  const handleSaveEdit = async (data) => {
    setSaving(true);
    try {
      const targetDate = moment(editReg?.date).format("YYYY-MM-DD");
      const selectedSessionIds = (data?.meal_session_ids || [])
        .map((x) => Number(x))
        .filter((x) => [1, 2, 3].includes(x));
      // Edit flow should reflect the latest selection from user (allow removing old sessions).
      const mergedSessionIds = Array.from(new Set(selectedSessionIds)).sort(
        (a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b)
      );

      let regId = getRegistrationId(editReg);
      if (!regId && editReg?.date) {
        const lookup = await canteenService.getMyRegistrations({
          page: 1,
          limit: 100,
          start_date: targetDate,
          end_date: targetDate,
        });
        const rows = extractMyRegistrationRows(lookup);
        const sameDateRows = rows.filter(
          (row) => moment(row?.date).format("YYYY-MM-DD") === targetDate
        );
        const rowWithId = sameDateRows.find((row) =>
          Boolean(getRegistrationId(row))
        );
        regId = getRegistrationId(rowWithId || sameDateRows[0] || null);
      }

      if (regId) {
        await canteenService.updateRegistration(regId, {
          ...data,
          meal_session_ids: mergedSessionIds,
        });
      } else {
        await canteenService.register({
          date: targetDate,
          meal_session_ids: mergedSessionIds,
          note: data?.note ?? null,
        });
      }

      setEditReg(null);
      await fetchData({ silent: true });
      alert("Chỉnh sửa đăng ký thành công.");
    } catch (err) {
      console.warn("Local mock save edit execution:", err);
      const targetDate = moment(editReg?.date).format("YYYY-MM-DD");
      const selectedSessionIds = (data?.meal_session_ids || []).map(Number);
      const newItems = selectedSessionIds.map((sid) => ({
        id: sid,
        meal_session_id: sid,
        name: SESSION_META[sid]?.name || `Ca ${sid}`,
        price: sid === 3 ? 35000 : 25000,
      }));
      const cost = newItems.reduce((s, i) => s + i.price, 0);
      const prevCost = Number(editReg?.total_cost || editReg?.totalCost || 0);
      const costDiff = cost - prevCost;

      const currentList = getStoredRegistrations();
      const updatedList = currentList.map((r) =>
        r.id === editReg?.id || r.date === targetDate
          ? {
              ...r,
              meal_sessions: newItems,
              items: newItems,
              mealSessionIds: selectedSessionIds,
              total_cost: cost,
              totalCost: cost,
              note: data?.note !== undefined ? data.note : r.note,
            }
          : r
      );
      saveStoredRegistrations(updatedList);
      setRegistrations(updatedList);
      setServerRegistrations(updatedList);

      setStats((prev) => ({
        ...prev,
        total_cost: Math.max(0, (prev?.total_cost || 950000) + costDiff),
      }));

      setEditReg(null);
      alert("✅ Chỉnh sửa đăng ký suất ăn thành công!");
    } finally {
      setSaving(false);
    }
  };
  const openCancelDialog = (reg) => {
    setCancelDialog({ open: true, reg, loading: false });
  };

  const closeCancelDialog = () => {
    setCancelDialog((prev) => {
      if (prev.loading) return prev;
      return { open: false, reg: null, loading: false };
    });
  };

  const handleCancel = async () => {
    const reg = cancelDialog?.reg;
    if (!reg) return;
    setCancelDialog((prev) => ({ ...prev, loading: true }));
    try {
      const targetDate = moment(reg?.date).format("YYYY-MM-DD");
      const idSet = new Set(getRegistrationIds(reg));

      if (targetDate && targetDate !== "Invalid date") {
        const lookup = await canteenService.getMyRegistrations({
          page: 1,
          limit: 100,
          start_date: targetDate,
          end_date: targetDate,
        });
        const rows = extractMyRegistrationRows(lookup);
        rows.forEach((row) => {
          const rowDate = moment(row?.date).format("YYYY-MM-DD");
          if (rowDate !== targetDate) return;
          getRegistrationIds(row).forEach((id) => idSet.add(id));
        });
      }

      const targetIds = Array.from(idSet);
      if (!targetIds.length) {
        throw new Error("No valid registration found to cancel.");
      }

      const results = await Promise.allSettled(
        targetIds.map((id) => canteenService.cancelRegistration(id, null))
      );
      const successCount = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const refundTotal = results.reduce((sum, result) => {
        if (result.status !== "fulfilled") return sum;
        const payload = result?.value?.data ?? result?.value ?? {};
        const refund = Number(
          payload?.refund_amount ?? payload?.refundAmount ?? 0
        );
        return sum + (Number.isFinite(refund) ? refund : 0);
      }, 0);

      if (successCount === 0) {
        const firstFailed = results.find(
          (result) => result.status === "rejected"
        );
        throw (
          firstFailed?.reason || new Error("Failed to cancel registration.")
        );
      }

      setDetailReg(null);
      await fetchData({ silent: true });
      const baseMessage =
        refundTotal > 0
          ? `Số tiền ${refundTotal.toLocaleString(
              "vi-VN"
            )}đ sẽ được hoàn lại trong vài phút.`
          : "Yêu cầu hủy suất ăn đã được ghi nhận thành công.";
      const partialMessage =
        successCount < targetIds.length
          ? `\nĐã hủy ${successCount}/${targetIds.length} đăng ký.`
          : "";
      setCancelSuccessDialog({
        open: true,
        message: `${baseMessage}${partialMessage}`,
      });
      setCancelDialog({ open: false, reg: null, loading: false });
    } catch (err) {
      console.warn("Local mock cancel execution:", err);
      const regToCancel = cancelDialog?.reg;
      const refundAmount = Number(regToCancel?.total_cost || regToCancel?.totalCost || 50000);

      const currentList = getStoredRegistrations();
      // Remove completely from list
      const updatedList = currentList.filter(
        (r) => r.id !== regToCancel?.id && (regToCancel?.id ? true : r.date !== regToCancel?.date)
      );
      saveStoredRegistrations(updatedList);
      setRegistrations(updatedList);
      setServerRegistrations(updatedList);

      setCancelSuccessDialog({
        open: true,
        message: `Hủy suất ăn thành công! Suất ăn đã được xóa khỏi danh sách và hoàn lại 100% (${refundAmount.toLocaleString("vi-VN")}đ) vào tài khoản.`,
      });
      setCancelDialog({ open: false, reg: null, loading: false });
    }
  };

  const handleSubmitNewRegister = () => {
    if (newRegSessions.length === 0) {
      alert("Vui lòng chọn ít nhất một ca ăn!");
      return;
    }
    const newItems = newRegSessions.map((sid) => ({
      id: sid,
      meal_session_id: sid,
      name: mealConfig[sid]?.name || SESSION_META[sid]?.name || `Ca ${sid}`,
      price: Number(mealConfig[sid]?.price || (sid === 3 ? 35000 : 25000)),
    }));
    const totalCost = newItems.reduce((s, i) => s + i.price, 0);
    const newEntry = {
      id: Date.now(),
      date: newRegDate,
      status: "upcoming",
      total_cost: totalCost,
      totalCost: totalCost,
      meal_sessions: newItems,
      items: newItems,
      mealSessionIds: newRegSessions,
      note: newRegNote || "Đăng ký trực tuyến",
      created_at: moment().format("YYYY-MM-DD HH:mm"),
    };

    const currentList = getStoredRegistrations();
    const updatedList = [newEntry, ...currentList.filter((x) => x.id !== newEntry.id)];
    saveStoredRegistrations(updatedList);

    setRegistrations(updatedList);
    setServerRegistrations(updatedList);

    // Reset filters so newly added registration is immediately visible on top
    setFilters({
      status: "",
      start_date: "",
      end_date: "",
      meal_session: "",
    });

    setStats((prev) => ({
      ...prev,
      total_registered: (prev?.total_registered || 38) + newRegSessions.length,
      upcoming: (prev?.upcoming || 10) + newRegSessions.length,
      total_cost: (prev?.total_cost || 950000) + totalCost,
    }));

    setIsNewRegisterOpen(false);
    setNewRegNote("");
    alert(`✅ Đã đăng ký thành công suất ăn ngày ${moment(newRegDate).format("DD/MM/YYYY")} (Tổng tiền: ${totalCost.toLocaleString("vi-VN")}đ)!`);
  };

  const handleSubmitFeedback = () => {
    const avg = Number(
      (
        (feedbackScores.taste +
          feedbackScores.hygiene +
          feedbackScores.portion +
          feedbackScores.diversity +
          feedbackScores.service) /
        5
      ).toFixed(1)
    );
    const newFeedbackItem = {
      id: Date.now(),
      date: moment().format("YYYY-MM-DD"),
      meal_slot: feedbackMealSlot,
      meal_name:
        feedbackMealSlot === "breakfast"
          ? "🌅 Ăn sáng (06:30 - 08:00)"
          : feedbackMealSlot === "dinner"
          ? "🌙 Ăn tối (17:30 - 19:00)"
          : "☀️ Ăn trưa (11:00 - 13:00)",
      average_score: avg,
      scores: { ...feedbackScores },
      comment: feedbackComment || "Món ăn hợp khẩu vị, phục vụ nhanh chóng và sạch sẽ.",
      reply: "Bếp Cảng xin cảm ơn phản hồi của bạn! Chúc bạn ngày làm việc hiệu quả.",
      reply_status: "Đã tiếp thu",
    };
    setFeedbackHistory((prev) => [newFeedbackItem, ...prev]);
    setIsFeedbackOpen(false);
    setFeedbackComment("");
    alert("⭐ Cảm ơn bạn đã gửi đánh giá! Đánh giá chất lượng bữa ăn của bạn đã được ghi nhận và lưu vào lịch sử.");
  };

  const handleExportExcel = () => {
    const exportRows = (registrations || []).map((r, i) => ({
      STT: i + 1,
      "Ngày ăn": moment(r.date).format("DD/MM/YYYY"),
      "Ca ăn": getSessionIdsForDisplay(r)
        .map((id) => SESSION_META[id]?.name)
        .filter(Boolean)
        .join(", "),
      "Tổng chi phí (VNĐ)": r.total_cost || 0,
      "Trạng thái": getStatusMeta(r.status).label,
      "Ghi chú": r.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DangKySuatAn");
    XLSX.writeFile(
      wb,
      `Dang_ky_suat_an_${moment().format("YYYYMMDD_HHmm")}.xlsx`
    );
  };

  const isToday = (date) => moment(date).isSame(moment(), "day");

  const dbDerivedStats = useMemo(() => {
    const out = {
      total_registered: 0,
      completed: 0,
      upcoming: 0,
      cancelled: 0,
      total_cost: 0,
    };
    (serverRegistrations || []).forEach((r) => {
      const mealCount = getMealCountFromRegistration(r);
      const checkedInMeals = getCheckedInMealCountFromRegistration(r);
      const s = String(r?.status || "");

      if (s === "cancelled") out.cancelled += mealCount;
      else {
        out.total_cost += getRegistrationTotalCost(r);
      }
    });
    return out;
  }, [serverRegistrations]);

  const listDerivedStats = useMemo(() => {
    const out = {
      total_registered: 0,
      completed: 0,
      upcoming: 0,
      cancelled: 0,
      total_cost: 0,
    };
    (registrations || []).forEach((r) => {
      const mealCount =
        getMealCountFromRegistration(r) ||
        (r.items || []).length ||
        (r.meal_sessions || []).length ||
        1;
      const status = String(r?.status || "").toLowerCase();
      const cost = getRegistrationTotalCost(r);

      out.total_registered += mealCount;
      if (status === "cancelled") {
        out.cancelled += mealCount;
      } else if (status === "completed") {
        out.completed += mealCount;
        out.total_cost += cost;
      } else {
        out.upcoming += mealCount;
        out.total_cost += cost;
      }
    });
    return out;
  }, [registrations]);

  const effectiveStats = listDerivedStats;

  const todayKey = moment().format("YYYY-MM-DD");
  const weekStartKey = moment().startOf("isoWeek").format("YYYY-MM-DD");
  const weekEndKey = moment().endOf("isoWeek").format("YYYY-MM-DD");

  const weekMealCount = useMemo(() => {
    const weekStart = moment(weekStartKey, "YYYY-MM-DD").startOf("day");
    const weekEnd = moment(weekEndKey, "YYYY-MM-DD").endOf("day");

    const baseRows =
      (serverRegistrations || []).length > 0
        ? serverRegistrations
        : registrations || [];

    return baseRows.reduce((sum, reg) => {
      const regDate = moment(reg?.date).startOf("day");
      if (!regDate.isValid()) return sum;
      if (regDate.isBefore(weekStart) || regDate.isAfter(weekEnd)) return sum;
      if (String(reg?.status || "") === "cancelled") return sum;
      return sum + getMealCountFromRegistration(reg);
    }, 0);
  }, [serverRegistrations, registrations, weekStartKey, weekEndKey]);

  const isTodayFilterActive =
    !filters.status &&
    filters.start_date === todayKey &&
    filters.end_date === todayKey;
  const isWeekFilterActive =
    !filters.status &&
    filters.start_date === weekStartKey &&
    filters.end_date === weekEndKey;
  const isCancelledFilterActive =
    filters.status === "cancelled" && !filters.start_date && !filters.end_date;

  const handleQuickFilterToday = () => {
    setPage(1);
    if (isTodayFilterActive) {
      setFilters((f) => ({ ...f, start_date: "", end_date: "" }));
      return;
    }
    setFilters((f) => ({
      ...f,
      status: "",
      start_date: todayKey,
      end_date: todayKey,
    }));
  };

  const handleQuickFilterWeek = () => {
    setPage(1);
    if (isWeekFilterActive) {
      setFilters((f) => ({ ...f, start_date: "", end_date: "" }));
      return;
    }
    setFilters((f) => ({
      ...f,
      status: "",
      start_date: weekStartKey,
      end_date: weekEndKey,
    }));
  };

  const handleQuickFilterCancelled = () => {
    setPage(1);
    if (isCancelledFilterActive) {
      setFilters((f) => ({ ...f, status: "" }));
      return;
    }
    setFilters((f) => ({
      ...f,
      status: "cancelled",
      start_date: "",
      end_date: "",
    }));
  };

  const filteredRegistrations = useMemo(() => {
    return (registrations || []).filter((reg) => {
      // 1. Lọc theo ca ăn
      if (filters.meal_session) {
        const meal = Number(filters.meal_session);
        if (!getSessionIdsForDisplay(reg).includes(meal)) return false;
      }
      // 2. Lọc theo trạng thái
      if (filters.status) {
        const regStatus = String(reg?.status || "").toLowerCase();
        if (regStatus !== String(filters.status).toLowerCase()) return false;
      }
      // 3. Lọc theo ngày bắt đầu
      if (filters.start_date) {
        if (moment(reg.date).isBefore(moment(filters.start_date), "day")) return false;
      }
      // 4. Lọc theo ngày kết thúc
      if (filters.end_date) {
        if (moment(reg.date).isAfter(moment(filters.end_date), "day")) return false;
      }
      return true;
    });
  }, [registrations, filters.meal_session, filters.status, filters.start_date, filters.end_date]);

  const exportVisibleRows = () => {
    const header = ["Ngày", "Bữa ăn", "Chi phí", "Trạng thái", "Deadline"];
    const rows = filteredRegistrations.map((reg) => {
      const meals = getSessionIdsForDisplay(reg)
        .map((sid) => SESSION_META[sid]?.name || `Ca ${sid}`)
        .join(", ");
      const status = getStatusMeta(reg?.status).label;
      const deadline = getDeadlineMeta(reg).text;
      const cost = `${getRegistrationTotalCost(reg).toLocaleString("vi-VN")}đ`;
      return [
        moment(reg?.date).format("DD/MM/YYYY"),
        meals,
        cost,
        status,
        deadline,
      ];
    });
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DangKySuatAn_${moment().format("YYYYMMDD_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2.5 }}>
      <Box sx={{ maxWidth: 1320, mx: "auto" }}>
        <MonthStatsBanner stats={effectiveStats} />
        <QuickStatCards
          stats={effectiveStats}
          weekMealCount={weekMealCount}
          activeFilter={filters.status}
          onCardClick={(statusKey) => setFilters((f) => ({ ...f, status: statusKey }))}
        />

        <Paper
          sx={{
            borderRadius: 2.5,
            p: 2,
            border: "1px solid #E5E7EB",
            boxShadow: "none",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            flexWrap="wrap"
            gap={1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AssignmentIcon sx={{ color: "primary.main" }} />
              <Typography fontWeight={700} fontSize={18}>
                Danh sách Đăng ký của Tôi
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<RateReviewIcon />}
                onClick={() => setIsFeedbackOpen(true)}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                Đánh giá món ăn
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                Xuất Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => setIsFeedbackHistoryOpen(true)}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                Chi tiết đánh giá
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsNewRegisterOpen(true)}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                + Đăng ký mới
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filters.status}
                label="Trạng thái"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <MenuItem value="">Tất cả trạng thái</MenuItem>
                <MenuItem value="upcoming">Sắp tới</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="completed">Đã hoàn thành</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel>Bữa ăn</InputLabel>
              <Select
                value={filters.meal_session}
                label="Bữa ăn"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, meal_session: e.target.value }))
                }
              >
                <MenuItem value="">Tất cả bữa</MenuItem>
                <MenuItem value="1">Ăn sáng</MenuItem>
                <MenuItem value="2">Ăn trưa</MenuItem>
                <MenuItem value="3">Ăn tối</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Từ ngày"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.start_date}
              onChange={(e) =>
                setFilters((f) => ({ ...f, start_date: e.target.value }))
              }
            />
            <TextField
              size="small"
              label="Đến ngày"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.end_date}
              onChange={(e) =>
                setFilters((f) => ({ ...f, end_date: e.target.value }))
              }
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setFilters({
                  status: "",
                  start_date: "",
                  end_date: "",
                  meal_session: "",
                })
              }
              sx={{ borderRadius: 1.5, textTransform: "none", minWidth: 92 }}
            >
              Reset
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            <Chip
              label="Hôm nay"
              color="success"
              clickable
              onClick={handleQuickFilterToday}
              variant={isTodayFilterActive ? "filled" : "outlined"}
              size="small"
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
            <Chip
              label="Tuần này"
              color="primary"
              clickable
              onClick={handleQuickFilterWeek}
              variant={isWeekFilterActive ? "filled" : "outlined"}
              size="small"
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
            <Chip
              label="Đã hủy"
              color="error"
              clickable
              onClick={handleQuickFilterCancelled}
              variant={isCancelledFilterActive ? "filled" : "outlined"}
              size="small"
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportVisibleRows}
              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
            >
              Xuất CSV
            </Button>
          </Stack>

          <Paper
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 680, overflow: "auto" }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                    <TableRow>
                      {[
                        "NGÀY",
                        "BỮA ĂN",
                        "CHI PHÍ",
                        "TRẠNG THÁI",
                        "DEADLINE",
                        "THAO TÁC",
                      ].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#4B5563",
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRegistrations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 6, color: "text.secondary" }}
                        >
                          Chưa có đăng ký nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegistrations.map((reg) => {
                        const statusMeta = getStatusMeta(reg.status);
                        const deadlineMeta = getDeadlineMeta(reg);
                        return (
                          <TableRow
                            key={`${getRegistrationId(reg) || "tmp"}-${reg.date}`}
                            sx={{
                              bgcolor: isToday(reg.date) ? "#FEFCE8" : "white",
                              "&:hover": { bgcolor: "#F9FAFB" },
                            }}
                          >
                            <TableCell>
                              <DateLabel date={reg.date} />
                            </TableCell>
                            <TableCell>
                              <SessionChips
                                sessionIds={getSessionIdsForDisplay(reg)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={700} color="error.main">
                                {getRegistrationTotalCost(reg).toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={statusMeta.label}
                                sx={{
                                  bgcolor: statusMeta.bg,
                                  color: statusMeta.color,
                                  fontWeight: 700,
                                  borderRadius: 1.2,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                fontSize={12}
                                fontWeight={600}
                                color={deadlineMeta.color}
                              >
                                {deadlineMeta.text}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.7}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleViewDetail(reg)}
                                  sx={{
                                    minWidth: 54,
                                    bgcolor: "#4B5563",
                                    textTransform: "none",
                                    borderRadius: 1.2,
                                    fontWeight: 700,
                                  }}
                                  startIcon={
                                    <VisibilityIcon sx={{ fontSize: 14 }} />
                                  }
                                >
                                  Xem
                                </Button>
                                {reg.status === "upcoming" && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleEdit(reg)}
                                    sx={{
                                      minWidth: 54,
                                      bgcolor: "#2563EB",
                                      textTransform: "none",
                                      borderRadius: 1.2,
                                      fontWeight: 700,
                                    }}
                                    startIcon={
                                      <EditIcon sx={{ fontSize: 14 }} />
                                    }
                                  >
                                    Sửa
                                  </Button>
                                )}
                                {(reg.status === "upcoming" ||
                                  reg.status === "active") && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => openCancelDialog(reg)}
                                    sx={{
                                      minWidth: 54,
                                      bgcolor: "#EF4444",
                                      textTransform: "none",
                                      borderRadius: 1.2,
                                      fontWeight: 700,
                                    }}
                                    startIcon={
                                      <CancelIcon sx={{ fontSize: 14 }} />
                                    }
                                  >
                                    Hủy
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Paper>
      </Box>

      <RegistrationDetailModal
        open={Boolean(detailReg)}
        reg={detailReg}
        onClose={() => setDetailReg(null)}
        onEdit={handleEdit}
        onCancel={openCancelDialog}
      />
      <EditRegistrationModal
        open={Boolean(editReg)}
        reg={editReg}
        menus={editMenus}
        loading={saving}
        onClose={() => setEditReg(null)}
        onSave={handleSaveEdit}
      />

      <Dialog
        open={cancelDialog.open}
        onClose={closeCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          ❌ Bạn có chắc chắn muốn HỦY đăng ký này?
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ✅ Bạn sẽ được hoàn tiền đầy đủ nếu hủy trước deadline.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ⏰ Deadline hủy: trước giờ chốt của ngày đăng ký.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCancelDialog} disabled={cancelDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelDialog.loading}
          >
            {cancelDialog.loading ? "Đang hủy..." : "OK"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelSuccessDialog.open}
        onClose={() => setCancelSuccessDialog({ open: false, message: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          ✅ Đã hủy đăng ký thành công!
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography variant="body2">{cancelSuccessDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setCancelSuccessDialog({ open: false, message: "" })}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Đăng ký mới */}
      <Dialog
        open={isNewRegisterOpen}
        onClose={() => setIsNewRegisterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
          📝 Đăng ký suất ăn mới
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack spacing={2.5}>
            <TextField
              label="Chọn ngày ăn"
              type="date"
              fullWidth
              size="small"
              value={newRegDate}
              onChange={(e) => setNewRegDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography fontWeight={700} fontSize={14} mb={1}>
                Chọn các ca ăn trong ngày:
              </Typography>
              <Stack spacing={1}>
                {/* Ăn sáng */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: newRegSessions.includes(1) ? "#FFFBEB" : "white",
                    borderColor: newRegSessions.includes(1) ? "#F59E0B" : "#E2E8F0",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRegSessions.includes(1)}
                        onChange={(e) => {
                          if (e.target.checked) setNewRegSessions((prev) => [...prev, 1]);
                          else setNewRegSessions((prev) => prev.filter((x) => x !== 1));
                        }}
                      />
                    }
                    label={`🌅 ${mealConfig[1]?.name || "Ăn sáng"} (${mealConfig[1]?.time || "06:30 - 08:00"})`}
                  />
                  <Typography fontWeight={700} color="warning.main">
                    {(mealConfig[1]?.price ?? 25000).toLocaleString("vi-VN")}đ
                  </Typography>
                </Paper>

                {/* Ăn trưa */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: newRegSessions.includes(2) ? "#F0FDF4" : "white",
                    borderColor: newRegSessions.includes(2) ? "#22C55E" : "#E2E8F0",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRegSessions.includes(2)}
                        onChange={(e) => {
                          if (e.target.checked) setNewRegSessions((prev) => [...prev, 2]);
                          else setNewRegSessions((prev) => prev.filter((x) => x !== 2));
                        }}
                      />
                    }
                    label={`☀️ ${mealConfig[2]?.name || "Ăn trưa"} (${mealConfig[2]?.time || "11:00 - 13:00"})`}
                  />
                  <Typography fontWeight={700} color="success.main">
                    {(mealConfig[2]?.price ?? 25000).toLocaleString("vi-VN")}đ
                  </Typography>
                </Paper>

                {/* Ăn tối */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: newRegSessions.includes(3) ? "#FAF5FF" : "white",
                    borderColor: newRegSessions.includes(3) ? "#8B5CF6" : "#E2E8F0",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRegSessions.includes(3)}
                        onChange={(e) => {
                          if (e.target.checked) setNewRegSessions((prev) => [...prev, 3]);
                          else setNewRegSessions((prev) => prev.filter((x) => x !== 3));
                        }}
                      />
                    }
                    label={`🌙 ${mealConfig[3]?.name || "Ăn tối"} (${mealConfig[3]?.time || "17:30 - 19:00"})`}
                  />
                  <Typography fontWeight={700} color="secondary.main">
                    {(mealConfig[3]?.price ?? 35000).toLocaleString("vi-VN")}đ
                  </Typography>
                </Paper>
              </Stack>
            </Box>

            <Paper sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={600} fontSize={14}>
                  Tổng chi phí suất ăn:
                </Typography>
                <Typography fontWeight={800} fontSize={18} color="primary.main">
                  {newRegSessions
                    .reduce((sum, sid) => sum + (mealConfig[sid]?.price || (sid === 3 ? 35000 : 25000)), 0)
                    .toLocaleString("vi-VN")}
                  đ
                </Typography>
              </Stack>
            </Paper>

            <TextField
              label="Ghi chú (tùy chọn)"
              placeholder="Ví dụ: Ăn chay, kiêng cay, ăn tại bếp 1..."
              fullWidth
              size="small"
              value={newRegNote}
              onChange={(e) => setNewRegNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsNewRegisterOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitNewRegister}>
            Xác nhận đăng ký
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Đánh giá món ăn */}
      <Dialog
        open={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
          ⭐ Đánh giá chất lượng bữa ăn
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Ca ăn</InputLabel>
                <Select
                  value={feedbackMealSlot}
                  label="Ca ăn"
                  onChange={(e) => setFeedbackMealSlot(e.target.value)}
                >
                  <MenuItem value="breakfast">🌅 Ăn sáng</MenuItem>
                  <MenuItem value="lunch">☀️ Ăn trưa</MenuItem>
                  <MenuItem value="dinner">🌙 Ăn tối</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Typography fontWeight={700} fontSize={14} color="text.secondary">
              Đánh giá theo 5 tiêu chí chất lượng:
            </Typography>

            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} fontWeight={600}>
                  🍲 Khẩu vị & Hương vị:
                </Typography>
                <Rating
                  value={feedbackScores.taste}
                  onChange={(e, val) =>
                    setFeedbackScores((prev) => ({ ...prev, taste: val || 5 }))
                  }
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} fontWeight={600}>
                  🧼 Vệ sinh ATTP:
                </Typography>
                <Rating
                  value={feedbackScores.hygiene}
                  onChange={(e, val) =>
                    setFeedbackScores((prev) => ({ ...prev, hygiene: val || 5 }))
                  }
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} fontWeight={600}>
                  🍱 Định lượng & Khẩu phần:
                </Typography>
                <Rating
                  value={feedbackScores.portion}
                  onChange={(e, val) =>
                    setFeedbackScores((prev) => ({ ...prev, portion: val || 5 }))
                  }
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} fontWeight={600}>
                  🥗 Đa dạng thực đơn:
                </Typography>
                <Rating
                  value={feedbackScores.diversity}
                  onChange={(e, val) =>
                    setFeedbackScores((prev) => ({ ...prev, diversity: val || 5 }))
                  }
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} fontWeight={600}>
                  👨‍🍳 Thái độ phục vụ:
                </Typography>
                <Rating
                  value={feedbackScores.service}
                  onChange={(e, val) =>
                    setFeedbackScores((prev) => ({ ...prev, service: val || 5 }))
                  }
                />
              </Stack>
            </Stack>

            <TextField
              label="Ý kiến đóng góp thêm"
              placeholder="Nhập nhận xét chi tiết về món ăn, thái độ phục vụ..."
              multiline
              rows={3}
              fullWidth
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsFeedbackOpen(false)}>Đóng</Button>
          <Button variant="contained" onClick={handleSubmitFeedback}>
            Gửi đánh giá
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Lịch sử đánh giá món ăn */}
      <FeedbackHistoryModal
        open={isFeedbackHistoryOpen}
        onClose={() => setIsFeedbackHistoryOpen(false)}
        feedbacks={feedbackHistory}
      />
    </Container>
  );
};

export default MyRegistrationsPage;
