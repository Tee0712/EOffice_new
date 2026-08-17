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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RateReviewIcon from "@mui/icons-material/RateReview";
import moment from "moment";
import { canteenService } from "../../../services/canteenService";
import { SessionChips } from "../../../components/Canteen/SessionChip";
import RegistrationDetailModal from "../../../components/Canteen/RegistrationDetailModal";
import EditRegistrationModal from "../../../components/Canteen/EditRegistrationModal";
import { useNavigate } from "react-router-dom";
import {
  canAccessRoleFeature,
  ROLE_ACCESS_FEATURE,
} from "../../../utils/permissionUtils";

moment.locale("vi");
const AUTO_REFRESH_INTERVAL_MS = 15000;
const SESSION_META = {
  1: { name: "Ăn sáng", timeStart: "06:30", timeEnd: "08:00" },
  2: { name: "Ăn trưa", timeStart: "11:00", timeEnd: "13:00" },
  3: { name: "Ăn tối", timeStart: "17:30", timeEnd: "19:00" },
};
const SESSION_ORDER = [1, 2, 3];
const VALID_SESSION_IDS = new Set([1, 2, 3]);

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

const QuickStatCards = ({ stats, weekMealCount }) => {
  const safe = normalizeStatsNumbers(stats || {});
  const cards = [
    {
      label: "Tổng suất tuần này",
      value: weekMealCount ?? 0,
      borderColor: "#22C55E",
    },
    { label: "Sắp tới", value: safe.upcoming, borderColor: "#3B82F6" },
    { label: "Đã hủy", value: safe.cancelled, borderColor: "#EF4444" },
    { label: "Đã hoàn thành", value: safe.completed, borderColor: "#16A34A" },
  ];

  return (
    <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
      {cards.map((c) => (
        <Box
          key={c.label}
          flex={1}
          minWidth={160}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            p: 2,
            borderLeft: `4px solid ${c.borderColor}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <Typography fontWeight={800} fontSize={28} color="text.primary">
            {c.value}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {c.label}
          </Typography>
        </Box>
      ))}
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

        if (regResult.status === "fulfilled" && regResult.value?.success) {
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
          setServerRegistrations([]);
          setRegistrations([]);
        }

        if (statsResult.status === "fulfilled" && statsResult.value?.success) {
          setStats(normalizeStatsNumbers(statsResult.value.data || {}));
        } else {
          setStats(null);
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
      console.error("Save error:", err);
      alert(err?.response?.data?.message || "Chỉnh sửa đăng ký thất bại.");
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
        alert("No valid registration found to cancel.");
        return;
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
      console.error("Cancel error:", err);
      alert(err?.response?.data?.message || "Cancel registration failed.");
      setCancelDialog((prev) => ({ ...prev, loading: false }));
    }
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
        out.completed += checkedInMeals;
        out.upcoming += Math.max(0, mealCount - checkedInMeals);
      }

      if (s !== "cancelled") {
        out.total_registered += mealCount;
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
      const mealCount = getMealCountFromRegistration(r);
      const checkedInMeals = getCheckedInMealCountFromRegistration(r);
      const status = String(r?.status || "").toLowerCase();

      if (status === "cancelled") out.cancelled += mealCount;
      else {
        out.completed += checkedInMeals;
        out.upcoming += Math.max(0, mealCount - checkedInMeals);
      }

      if (status !== "cancelled") {
        out.total_registered += mealCount;
        out.total_cost += getRegistrationTotalCost(r);
      }
    });
    return out;
  }, [registrations]);

  const statsIsAllZero = useMemo(() => {
    const s = normalizeStatsNumbers(stats || {});
    return (
      Number(s.total_registered || 0) === 0 &&
      Number(s.completed || 0) === 0 &&
      Number(s.upcoming || 0) === 0 &&
      Number(s.cancelled || 0) === 0 &&
      Number(s.total_cost || 0) === 0
    );
  }, [stats]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.status ||
        filters.start_date ||
        filters.end_date ||
        filters.meal_session
      ),
    [filters.status, filters.start_date, filters.end_date, filters.meal_session]
  );

  const effectiveStats = useMemo(
    () => normalizeStatsNumbers(stats || {}),
    [stats]
  );

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
    if (!filters.meal_session) return registrations;
    const meal = Number(filters.meal_session);
    return (registrations || []).filter((reg) =>
      getSessionIdsForDisplay(reg).includes(meal)
    );
  }, [registrations, filters.meal_session]);

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
        <QuickStatCards stats={effectiveStats} weekMealCount={weekMealCount} />

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
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AssignmentIcon sx={{ color: "primary.main" }} />
              <Typography fontWeight={700} fontSize={18}>
                Danh sách Đăng ký của Tôi
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<RateReviewIcon />}
                onClick={() => navigate("/catering/meal-feedback")}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                Đánh giá món ăn
              </Button>
              {canViewEvaluation && (
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate("/catering/meal-feedback-detail")}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 1.8,
                  }}
                >
                  Chi tiết đánh giá
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/canteen/calendar")}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.8,
                }}
              >
                Đăng ký mới
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
              <TableContainer>
                <Table>
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
    </Container>
  );
};

export default MyRegistrationsPage;
