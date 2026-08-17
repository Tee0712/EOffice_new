import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  GlobalStyles,
  Snackbar,
  Alert,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BoltIcon from "@mui/icons-material/Bolt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import moment from "moment";
import { canteenService } from "../../../services/canteenService";
import RegisterModal from "../MyRegistrations/components/RegisterModal";

moment.locale("vi");

const SESSION_META = {
  1: { label: "Ăn sáng", color: "#FEF3C7", border: "#F59E0B", text: "#7C2D12" },
  2: { label: "Ăn trưa", color: "#D1FAE5", border: "#10B981", text: "#065F46" },
  3: { label: "Ăn tối", color: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95" },
};

const PRESET_MEAL_TEMPLATES = [
  {
    key: "breakfast_lunch",
    name: "\u0110\u0103ng k\u00ed b\u1eefa \u0103n s\u00e1ng + tr\u01b0a",
    mealSessionIds: [1, 2],
  },
  {
    key: "lunch_dinner",
    name: "\u0110\u0103ng k\u00ed b\u1eefa \u0103n tr\u01b0a + t\u1ed1i",
    mealSessionIds: [2, 3],
  },
  {
    key: "breakfast_lunch_dinner",
    name: "\u0110\u0103ng k\u00ed b\u1eefa \u0103n s\u00e1ng + tr\u01b0a + t\u1ed1i",
    mealSessionIds: [1, 2, 3],
  },
  {
    key: "breakfast_dinner",
    name: "\u0110\u0103ng k\u00ed b\u1eefa \u0103n s\u00e1ng + t\u1ed1i",
    mealSessionIds: [1, 3],
  },
];

const normalizeTemplateName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0111\u0110]/g, (ch) => (ch === "\u0111" ? "d" : "D"))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizeSessionIds = (sessionIds) =>
  Array.from(
    new Set(
      (Array.isArray(sessionIds) ? sessionIds : [])
        .map((sid) => Number(sid))
        .filter((sid) => [1, 2, 3].includes(sid))
    )
  ).sort((a, b) => a - b);

const parseTemplateMealSessionIds = (template) => {
  const candidates = [];
  if (Array.isArray(template?.meal_session_ids)) {
    candidates.push(...template.meal_session_ids);
  }
  if (Array.isArray(template?.mealSessionIds)) {
    candidates.push(...template.mealSessionIds);
  }
  if (typeof template?.mealSessions === "string" && template.mealSessions.trim()) {
    try {
      const parsed = JSON.parse(template.mealSessions);
      if (Array.isArray(parsed)) candidates.push(...parsed);
    } catch {
      // ignore parse error
    }
  }
  return normalizeSessionIds(candidates);
};

const normalizeTemplate = (template) => ({
  ...template,
  id: Number(template?.id),
  name: String(template?.name || ""),
  mealSessionIds: parseTemplateMealSessionIds(template),
});

const isCancelledStatus = (status) =>
  ["cancelled", "auto_cut"].includes(String(status || "").toLowerCase());

const normalizeMealSessionIds = (reg) => {
  const fromItems = Array.isArray(reg?.items)
    ? reg.items
        .map((i) => Number(i?.mealSessionId))
        .filter((sid) => [1, 2, 3].includes(sid))
    : [];
  if (fromItems.length) return Array.from(new Set(fromItems));

  const fromFallback = Array.isArray(reg?.mealSessionIds)
    ? reg.mealSessionIds
        .map((sid) => Number(sid))
        .filter((sid) => [1, 2, 3].includes(sid))
    : [];
  return Array.from(new Set(fromFallback));
};

const resolveRegistrationTotalCost = (reg, dayMenus = []) => {
  const directCost = Number(reg?.totalCost ?? reg?.total_cost ?? 0);
  if (Number.isFinite(directCost) && directCost > 0) return directCost;

  const sessionIds = normalizeMealSessionIds(reg);
  const menuCost = sessionIds.reduce((sum, sid) => {
    const menu = (dayMenus || []).find(
      (m) => Number(m?.mealSessionId) === Number(sid)
    );
    return sum + Number(menu?.price || 0);
  }, 0);
  if (Number.isFinite(menuCost) && menuCost > 0) return menuCost;

  const itemCost = Array.isArray(reg?.items)
    ? reg.items.reduce(
        (sum, item) =>
          sum +
          Number(item?.priceAtTime ?? item?.price_at_time ?? item?.price ?? 0),
        0
      )
    : 0;
  if (Number.isFinite(itemCost) && itemCost > 0) return itemCost;

  return 0;
};

const getRegistrationTimestamp = (reg) => {
  const candidates = [
    reg?.updatedAt,
    reg?.updated_at,
    reg?.cancelledAt,
    reg?.cancelled_at,
    reg?.registeredAt,
    reg?.registered_at,
    reg?.createdAt,
    reg?.created_at,
  ];
  for (const candidate of candidates) {
    const ts = moment(candidate).valueOf();
    if (Number.isFinite(ts) && ts > 0) return ts;
  }
  return 0;
};

const pickPreferredRegistration = (primary, secondary) => {
  const a = primary || null;
  const b = secondary || null;
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;

  const aTs = getRegistrationTimestamp(a);
  const bTs = getRegistrationTimestamp(b);
  if (aTs !== bTs) return bTs > aTs ? b : a;

  const aCount = normalizeMealSessionIds(a).length;
  const bCount = normalizeMealSessionIds(b).length;
  if (aCount !== bCount) return bCount > aCount ? b : a;

  return a;
};

const QuickPanel = ({
  templates,
  userSettings,
  onSaveSettings,
  onBulkRegister,
  onSaveTemplate,
  selectedTemplateId,
  onTemplateChange,
  bulkLoading,
  templateLoading,
}) => {
  const [settings, setSettings] = useState(userSettings || {});

  useEffect(() => setSettings(userSettings || {}), [userSettings]);

  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    onSaveSettings?.(next);
  };

  return (
    <Paper sx={{ borderRadius: 2.5, overflow: "hidden", boxShadow: 2 }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
          p: 2.2,
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={1.8}>
          <BoltIcon fontSize="small" />
          <Typography fontWeight={700} fontSize={16}>
            Đăng ký nhanh
          </Typography>
        </Stack>
        <Stack spacing={1.2}>
          <Button
            fullWidth
            onClick={() => onBulkRegister?.("WEEK", selectedTemplateId || null)}
            disabled={bulkLoading}
            sx={{
              bgcolor: "rgba(255,255,255,0.16)",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": { bgcolor: "rgba(255,255,255,0.24)" },
            }}
            startIcon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
          >
            {bulkLoading ? "Đang đăng ký..." : "Đăng ký cả tuần này"}
          </Button>
          <Button
            fullWidth
            onClick={() =>
              onBulkRegister?.("MONTH", selectedTemplateId || null)
            }
            disabled={bulkLoading}
            sx={{
              bgcolor: "rgba(255,255,255,0.16)",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": { bgcolor: "rgba(255,255,255,0.24)" },
            }}
            startIcon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
          >
            {bulkLoading ? "Đang đăng ký..." : "Đăng ký cả tháng"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography fontWeight={700} fontSize={13} mb={1}>
          Áp dụng template:
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1.2 }}>
          <InputLabel>Chọn template</InputLabel>
          <Select
            value={selectedTemplateId || ""}
            label="Chọn template"
            onChange={(e) => onTemplateChange?.(e.target.value)}
          >
            <MenuItem value="">
              <em>-- Chọn template --</em>
            </MenuItem>
            {(templates || []).map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={1} mb={1.2}>
          <Button
            size="small"
            variant="contained"
            fullWidth
            disabled={bulkLoading || !selectedTemplateId}
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={() => onBulkRegister?.("WEEK", selectedTemplateId)}
          >
            {bulkLoading ? "Đang xử lý..." : "Đăng ký tuần theo template"}
          </Button>
          <Button
            size="small"
            variant="contained"
            fullWidth
            disabled={bulkLoading || !selectedTemplateId}
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={() => onBulkRegister?.("MONTH", selectedTemplateId)}
          >
            {bulkLoading ? "Đang xử lý..." : "Đăng ký tháng theo template"}
          </Button>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          fullWidth
          disabled={templateLoading}
          sx={{ borderRadius: 2, textTransform: "none", mb: 2 }}
          onClick={() => onSaveTemplate?.()}
        >
          {templateLoading ? "Đang lưu..." : "Lưu làm template mới"}
        </Button>

        <Typography fontWeight={700} fontSize={13} mb={1}>
          Chú thích
        </Typography>
        {[
          { color: "#DBEAFE", label: "Hôm nay" },
          { color: "#FEF9C3", label: "Ăn sáng" },
          { color: "#DCFCE7", label: "Ăn trưa" },
          { color: "#EDE9FE", label: "Ăn tối" },
          { color: "#F3F4F6", label: "Chủ nhật (Không phục vụ)" },
        ].map((item) => (
          <Stack
            key={item.label}
            direction="row"
            spacing={1}
            alignItems="center"
            mb={0.5}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.5,
                bgcolor: item.color,
                border: "1px solid #E5E7EB",
              }}
            />
            <Typography fontSize={12}>{item.label}</Typography>
          </Stack>
        ))}

        <Typography fontWeight={700} fontSize={13} mt={2} mb={1}>
          Cài đặt tự động
        </Typography>
        {[
          { key: "autoCancelOnTrip", label: "Tự động hủy khi công tác" },
          { key: "autoCancelOnLeave", label: "Tự động hủy khi nghỉ phép" },
          { key: "receiveEmailNotification", label: "Nhận email thông báo" },
          { key: "remindBefore1Day", label: "Nhắc nhở trước 1 ngày" },
        ].map((s) => (
          <FormControlLabel
            key={s.key}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mx: 0,
              mb: 0.2,
            }}
            labelPlacement="start"
            label={<Typography fontSize={12}>{s.label}</Typography>}
            control={
              <Switch
                size="small"
                checked={Boolean(settings[s.key])}
                onChange={(e) => updateSetting(s.key, e.target.checked)}
              />
            }
          />
        ))}
      </Box>
    </Paper>
  );
};

const CalendarPage = () => {
  const calendarRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(moment().startOf("month"));
  const [menus, setMenus] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openRegister, setOpenRegister] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const startDate = currentMonth.clone().startOf("month").format("YYYY-MM-DD");
  const endDate = currentMonth.clone().endOf("month").format("YYYY-MM-DD");

  const sortTemplates = useCallback((list) => {
    const presetOrder = new Map(
      PRESET_MEAL_TEMPLATES.map((preset, index) => [
        normalizeTemplateName(preset.name),
        index,
      ])
    );
    return [...(list || [])].sort((a, b) => {
      const aIdx = presetOrder.has(normalizeTemplateName(a?.name))
        ? presetOrder.get(normalizeTemplateName(a?.name))
        : 999;
      const bIdx = presetOrder.has(normalizeTemplateName(b?.name))
        ? presetOrder.get(normalizeTemplateName(b?.name))
        : 999;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return String(a?.name || "").localeCompare(String(b?.name || ""), "vi");
    });
  }, []);

  const ensurePresetTemplates = useCallback(async (incomingTemplates = []) => {
    const normalizedIncoming = (incomingTemplates || []).map(normalizeTemplate);
    const existingNameSet = new Set(
      normalizedIncoming.map((tpl) => normalizeTemplateName(tpl?.name))
    );

    const missingPresets = PRESET_MEAL_TEMPLATES.filter(
      (preset) => !existingNameSet.has(normalizeTemplateName(preset.name))
    );

    if (!missingPresets.length) {
      return sortTemplates(normalizedIncoming);
    }

    for (const preset of missingPresets) {
      await canteenService.createTemplate({
        name: preset.name,
        meal_session_ids: preset.mealSessionIds,
      });
    }

    const tplRes = await canteenService.getTemplates();
    if (!tplRes?.success) {
      return sortTemplates(normalizedIncoming);
    }

    const refreshed = (tplRes.data || []).map(normalizeTemplate);
    return sortTemplates(refreshed);
  }, [sortTemplates]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, myRegRes, tplRes, settingsRes] = await Promise.all([
        canteenService.getCalendar(startDate, endDate),
        canteenService.getMyRegistrations({
          page: 1,
          limit: 500,
          start_date: startDate,
          end_date: endDate,
        }),
        canteenService.getTemplates(),
        canteenService.getUserSettings(),
      ]);
      if (calRes?.success) {
        setMenus(calRes.data?.menus || []);
        const calendarRegs = Array.isArray(calRes.data?.registrations)
          ? calRes.data.registrations
          : [];
        const listRegs = Array.isArray(myRegRes?.data?.items)
          ? myRegRes.data.items
          : [];

        const byDate = new Map();
        listRegs.forEach((reg) => {
          const key = moment(reg?.date).format("YYYY-MM-DD");
          if (!key || key === "Invalid date") return;
          byDate.set(key, pickPreferredRegistration(byDate.get(key), reg));
        });
        calendarRegs.forEach((reg) => {
          const key = moment(reg?.date).format("YYYY-MM-DD");
          if (!key || key === "Invalid date") return;
          if (!byDate.has(key)) {
            byDate.set(key, reg);
          }
        });

        setRegistrations(Array.from(byDate.values()));
      }
      if (tplRes?.success) {
        const nextTemplates = await ensurePresetTemplates(tplRes.data || []);
        setTemplates(nextTemplates);
      }
      if (settingsRes?.success) setUserSettings(settingsRes.data);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, ensurePresetTemplates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const exists = (templates || []).some(
      (tpl) => String(tpl?.id) === String(selectedTemplateId)
    );
    if (!exists) {
      setSelectedTemplateId("");
    }
  }, [templates, selectedTemplateId]);

  const handleSaveSettings = async (data) => {
    try {
      const res = await canteenService.updateUserSettings(data);
      if (res?.success !== false) {
        setSettingsNotice({
          open: true,
          severity: "success",
          message: "Đã cập nhật cài đặt tự động",
        });
      } else {
        setSettingsNotice({
          open: true,
          severity: "error",
          message: "Cập nhật cài đặt thất bại",
        });
      }
    } catch (err) {
      setSettingsNotice({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || "Cập nhật cài đặt thất bại",
      });
    }
  };

  const handleTemplateChange = (value) => {
    if (!value) {
      setSelectedTemplateId("");
      return;
    }
    const exists = (templates || []).some(
      (tpl) => String(tpl?.id) === String(value)
    );
    if (!exists) {
      setSelectedTemplateId("");
      alert("Template da chon khong con kha dung. Vui long chon lai.");
      return;
    }
    setSelectedTemplateId(value);
  };

  const handleBulkRegister = async (type, templateIdOverride = null) => {
    setBulkLoading(true);
    try {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      let rangeStart = moment();
      let rangeEnd = moment();

      if (type === "WEEK") {
        rangeStart = moment().startOf("isoWeek");
        rangeEnd = moment().endOf("isoWeek");
      } else {
        rangeStart = currentMonth.clone().startOf("month");
        rangeEnd = currentMonth.clone().endOf("month");
      }

      const payload = {
        start_date: rangeStart.format("YYYY-MM-DD"),
        end_date: rangeEnd.format("YYYY-MM-DD"),
        days_of_week: allDays,
      };

      const effectiveTemplateId = templateIdOverride ?? selectedTemplateId;
      if (effectiveTemplateId) {
        payload.template_id = Number(effectiveTemplateId);
      } else {
        payload.meal_session_ids = [1, 2, 3];
      }

      const res = await canteenService.bulkRegisterByFilters(payload);
      if (res?.success) {
        await fetchData();
        const stats = res?.data || {};
        const registered = stats.registered ?? stats.created_count ?? 0;
        alert(`Đăng ký nhanh thành công: ${registered} suất`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Đăng ký nhanh thất bại");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    const name = window.prompt("Nhập tên template");
    const trimmed = String(name || "").trim();
    if (!trimmed) return;

    setTemplateLoading(true);
    try {
      const res = await canteenService.createTemplate({
        name: trimmed,
        meal_session_ids: [1, 2, 3],
      });
      if (res?.success) {
        await fetchData();
        alert("Đã lưu template");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Lưu template thất bại");
    } finally {
      setTemplateLoading(false);
    }
  };

  const registrationMap = useMemo(() => {
    const map = new Map();
    registrations.forEach((r) => {
      const dateKey = moment(r.date).format("YYYY-MM-DD");
      map.set(dateKey, r);
    });
    return map;
  }, [registrations]);

  const menuMap = useMemo(() => {
    const map = new Map();
    menus.forEach((m) => {
      const dateKey = moment(m.date).format("YYYY-MM-DD");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(m);
    });
    return map;
  }, [menus]);

  const events = useMemo(() => {
    const result = [];
    const dates = new Set([...menuMap.keys(), ...registrationMap.keys()]);

    dates.forEach((date) => {
      const reg = registrationMap.get(date);
      const activeReg = reg || null;
      const dayMenus = menuMap.get(date) || [];

      if (activeReg && !isCancelledStatus(activeReg?.status)) {
        const itemIds = normalizeMealSessionIds(activeReg);

        if (!itemIds.length) {
          dayMenus.forEach((m, idx) => {
            const meta = SESSION_META[m.mealSessionId] || SESSION_META[2];
            result.push({
              id: `menu-${date}-${m.mealSessionId}-${idx}`,
              title: meta.label,
              start: date,
              allDay: true,
              backgroundColor: meta.color,
              borderColor: meta.color,
              textColor: meta.text,
              classNames: ["canteen-pill-event", "canteen-menu-event"],
              extendedProps: { displayOrder: 1 },
            });
          });
          return;
        }

        result.push({
          id: `status-${date}`,
          title: "Đã đăng ký",
          start: date,
          allDay: true,
          backgroundColor: "#DBFCE7",
          borderColor: "#DBFCE7",
          textColor: "#166534",
          classNames: ["canteen-status-event"],
          extendedProps: { displayOrder: 0 },
        });

        itemIds.forEach((sessionId, idx) => {
          const meta = SESSION_META[sessionId] || SESSION_META[2];
          result.push({
            id: `reg-${date}-${sessionId}-${idx}`,
            title: meta.label,
            start: date,
            allDay: true,
            backgroundColor: meta.color,
            borderColor: meta.color,
            textColor: meta.text,
            classNames: ["canteen-pill-event"],
            extendedProps: { displayOrder: 1 },
          });
        });

        const resolvedCost = resolveRegistrationTotalCost(activeReg, dayMenus);

        result.push({
          id: `cost-${date}`,
          title: `${Number(resolvedCost || 0).toLocaleString("vi-VN")}đ`,
          start: date,
          allDay: true,
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: "#DC2626",
          classNames: ["canteen-cost-event"],
          extendedProps: { displayOrder: 99 },
        });
      } else {
        dayMenus.forEach((m, idx) => {
          const meta = SESSION_META[m.mealSessionId] || SESSION_META[2];
          result.push({
            id: `menu-${date}-${m.mealSessionId}-${idx}`,
            title: meta.label,
            start: date,
            allDay: true,
            backgroundColor: meta.color,
            borderColor: meta.color,
            textColor: meta.text,
            classNames: ["canteen-pill-event", "canteen-menu-event"],
            extendedProps: { displayOrder: 1 },
          });
        });
      }
    });

    return result;
  }, [menuMap, registrationMap]);

  const sessionCounts = { 1: 0, 2: 0, 3: 0 };
  registrations.forEach(
    (r) =>
      !isCancelledStatus(r?.status) &&
      normalizeMealSessionIds(r).forEach((sid) => {
        if (sessionCounts[sid] !== undefined) sessionCounts[sid] += 1;
      })
  );
  const totalCostMonth =
    registrations
      .filter((r) => !isCancelledStatus(r?.status))
      .reduce((s, r) => {
        const dateKey = moment(r?.date).format("YYYY-MM-DD");
        const dayMenus = menuMap.get(dateKey) || [];
        return s + resolveRegistrationTotalCost(r, dayMenus);
      }, 0);

  const goMonth = (offset) => {
    const next = currentMonth.clone().add(offset, "month");
    setCurrentMonth(next);
    const api = calendarRef.current?.getApi();
    api?.gotoDate(next.toDate());
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <GlobalStyles
        styles={{
          ".canteen-calendar .fc": {
            fontFamily: "inherit",
            border: "1px solid #d7dde6",
            borderRadius: 8,
            overflow: "hidden",
          },
          ".canteen-calendar .fc .fc-toolbar": { display: "none" },
          ".canteen-calendar .fc .fc-scrollgrid": { border: "none" },
          ".canteen-calendar .fc .fc-col-header-cell": {
            backgroundColor: "#f8fafc",
          },
          ".canteen-calendar .fc .fc-col-header-cell-cushion": {
            padding: "8px 4px",
            fontSize: 12,
            fontWeight: 700,
            color: "#334155",
            textTransform: "uppercase",
          },
          ".canteen-calendar .fc .fc-daygrid-day": { backgroundColor: "#fff" },
          ".canteen-calendar .fc .fc-daygrid-day-frame": { minHeight: 116 },
          ".canteen-calendar .fc .fc-daygrid-day-events": {
            margin: "2px 4px 0",
          },
          ".canteen-calendar .fc .fc-day-other": { backgroundColor: "#f5f6f8" },
          ".canteen-calendar .fc .fc-day-other .fc-daygrid-day-number": {
            color: "#9CA3AF",
          },
          ".canteen-calendar .fc .fc-day-sun": { backgroundColor: "#F9FAFB" },
          ".canteen-calendar .fc .fc-day-today": {
            backgroundColor: "#EFF6FF !important",
            boxShadow: "inset 0 0 0 2px #3B82F6",
          },
          ".canteen-calendar .fc .fc-daygrid-day-top": {
            justifyContent: "flex-start",
          },
          ".canteen-calendar .fc .fc-daygrid-day-number": {
            fontSize: 13,
            fontWeight: 600,
            color: "#1e40af",
            padding: "6px",
            textDecoration: "none",
          },
          ".canteen-calendar .fc .fc-event": {
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            padding: 0,
            margin: 0,
          },
          ".canteen-calendar .fc .canteen-pill-event": {
            boxShadow: "none",
          },
          ".canteen-calendar .fc .canteen-status-event": {
            borderRadius: 4,
          },
          ".canteen-calendar .fc .canteen-cost-event": {
            fontWeight: 700,
            fontSize: 12,
          },
          ".canteen-calendar .fc .fc-daygrid-event-harness": { marginTop: 2 },
          ".canteen-calendar .fc .fc-daygrid-more-link": {
            fontSize: 11,
            color: "#2563eb",
          },
        }}
      />

      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        {[
          {
            label: "Suất ăn sáng (Tháng này)",
            value: sessionCounts[1],
            border: "#F59E0B",
          },
          {
            label: "Suất ăn trưa (Tháng này)",
            value: sessionCounts[2],
            border: "#10B981",
          },
          {
            label: "Suất ăn tối (Tháng này)",
            value: sessionCounts[3],
            border: "#8B5CF6",
          },
          {
            label: "Tổng chi phí (Tháng này)",
            value: `${totalCostMonth.toLocaleString("vi-VN")}đ`,
            border: "#EF4444",
          },
        ].map((c) => (
          <Box
            key={c.label}
            flex={1}
            minWidth={210}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              p: 2,
              borderLeft: `4px solid ${c.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            }}
          >
            <Typography
              fontWeight={800}
              fontSize={42 < String(c.value).length ? 36 : 40}
              color="text.primary"
            >
              {c.value}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {c.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Paper
            sx={{
              borderRadius: 2.5,
              p: 2.5,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1.5}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon sx={{ color: "primary.main" }} />
                <Typography fontWeight={700} fontSize={26}>
                  Lịch Đăng ký
                </Typography>
              </Stack>
              <Button
                size="small"
                variant="contained"
                startIcon={<BoltIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
                onClick={() => {
                  setSelectedDay(moment().format("YYYY-MM-DD"));
                  setOpenRegister(true);
                }}
              >
                Đăng ký nhanh
              </Button>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1.2}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  size="small"
                  onClick={() => goMonth(-1)}
                  sx={{ minWidth: 36 }}
                >
                  <ChevronLeftIcon />
                </Button>
                <Typography
                  fontWeight={700}
                  minWidth={130}
                  textAlign="center"
                  textTransform="capitalize"
                >
                  {currentMonth.format("MMMM, YYYY")}
                </Typography>
                <Button
                  size="small"
                  onClick={() => goMonth(1)}
                  sx={{ minWidth: 36 }}
                >
                  <ChevronRightIcon />
                </Button>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const now = moment().startOf("month");
                  setCurrentMonth(now);
                  calendarRef.current?.getApi()?.today();
                }}
                sx={{ borderRadius: 1.5, textTransform: "none", fontSize: 12 }}
              >
                Hôm nay
              </Button>
            </Stack>

            <Box
              sx={{
                bgcolor: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderLeft: "3px solid #EAB308",
                borderRadius: 1,
                p: 1,
                mb: 1.2,
                display: "flex",
                gap: 1,
              }}
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 16, color: "#EAB308", flexShrink: 0, mt: 0.15 }}
              />
              <Typography fontSize={12} color="#92400E">
                Deadline: Đăng ký trước 16:00 ngày hôm trước | Hủy trước 10:00
                cùng ngày
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box className="canteen-calendar">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  locale={viLocale}
                  initialView="dayGridMonth"
                  initialDate={currentMonth.toDate()}
                  firstDay={1}
                  fixedWeekCount
                  headerToolbar={false}
                  dayMaxEventRows={4}
                  height="auto"
                  eventOrder="displayOrder,start,title"
                  events={events}
                  eventDisplay="block"
                  eventContent={(arg) => {
                    const isCost =
                      arg.event.classNames?.includes("canteen-cost-event");
                    const isStatus = arg.event.classNames?.includes(
                      "canteen-status-event"
                    );
                    if (isCost) {
                      return (
                        <span
                          style={{
                            display: "block",
                            color: "#DC2626",
                            fontWeight: 700,
                            fontSize: 11,
                            padding: "1px 2px",
                          }}
                        >
                          {arg.event.title}
                        </span>
                      );
                    }
                    return (
                      <span
                        style={{
                          display: "block",
                          borderRadius: 4,
                          padding: isStatus ? "2px 6px" : "1px 6px",
                          fontSize: 11,
                          fontWeight: isStatus ? 700 : 600,
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {arg.event.title}
                      </span>
                    );
                  }}
                  dateClick={(info) => {
                    setSelectedDay(moment(info.date).format("YYYY-MM-DD"));
                    setOpenRegister(true);
                  }}
                  datesSet={(info) => {
                    setCurrentMonth(
                      moment(info.start).add(10, "day").startOf("month")
                    );
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={3}>
          <QuickPanel
            templates={templates}
            userSettings={userSettings}
            onSaveSettings={handleSaveSettings}
            onBulkRegister={handleBulkRegister}
            onSaveTemplate={handleSaveTemplate}
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            bulkLoading={bulkLoading}
            templateLoading={templateLoading}
          />
        </Grid>
      </Grid>

      <RegisterModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
        onSuccess={fetchData}
        onRegistered={() => {}}
        initialDate={selectedDay}
      />

      <Snackbar
        open={settingsNotice.open}
        autoHideDuration={2200}
        onClose={() => setSettingsNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() =>
            setSettingsNotice((prev) => ({ ...prev, open: false }))
          }
          severity={settingsNotice.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {settingsNotice.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CalendarPage;
