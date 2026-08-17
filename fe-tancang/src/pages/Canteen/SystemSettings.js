import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { mealBookingService as canteenService } from "@services/mealBookingService";
import { trackAction } from "../../utils/trackAction";

const VI = {
  tabs: {
    general: "Cài đặt chung",
    meals: "Bữa ăn và giá",
    notifications: "Thông báo",
    integrations: "Tích hợp",
    holidays: "Ngày nghỉ",
    users: "Người dùng",
    logs: "Logs hệ thống",
  },
  common: {
    save: "Lưu thay đổi",
    refresh: "Làm mới",
    sync: "Đồng bộ",
    noUsers: "Không có dữ liệu người dùng.",
    noLogs: "Chưa có logs.",
  },
};

const tabs = [
  {
    key: "general",
    label: VI.tabs.general,
    icon: <SettingsIcon fontSize="small" />,
  },
  {
    key: "meals",
    label: VI.tabs.meals,
    icon: <RestaurantMenuIcon fontSize="small" />,
  },
  {
    key: "notifications",
    label: VI.tabs.notifications,
    icon: <NotificationsIcon fontSize="small" />,
  },
  {
    key: "integrations",
    label: VI.tabs.integrations,
    icon: <SyncAltIcon fontSize="small" />,
  },
  {
    key: "holidays",
    label: VI.tabs.holidays,
    icon: <EventBusyIcon fontSize="small" />,
  },
  { key: "users", label: VI.tabs.users, icon: <PeopleIcon fontSize="small" /> },
  { key: "logs", label: VI.tabs.logs, icon: <HistoryIcon fontSize="small" /> },
];

const defaultHolidays = [
  { id: 1, dateLabel: "01/01", title: "Tết Dương lịch", days: "1 ngày nghỉ" },
  { id: 2, dateLabel: "30/04", title: "Ngày Giải phóng", days: "1 ngày nghỉ" },
  { id: 3, dateLabel: "01/05", title: "Quốc tế Lao động", days: "1 ngày nghỉ" },
  { id: 4, dateLabel: "02/09", title: "Quốc khánh", days: "1 ngày nghỉ" },
];

const makeSetting = (
  id,
  value,
  label,
  valueType = "string",
  description = ""
) => ({
  id,
  value,
  label,
  value_type: valueType,
  description,
});

const DEFAULT_SETTINGS = {
  deadline: {
    registration_deadline_time: makeSetting(
      0,
      "16:00",
      "Hạn đăng ký (ngày trước)",
      "string"
    ),
    cancellation_deadline_time: makeSetting(
      0,
      "10:00",
      "Hạn hủy (cùng ngày)",
      "string"
    ),
  },
  meal_session: {
    breakfast_active: makeSetting(0, true, "Ăn sáng", "boolean"),
    breakfast_start_time: makeSetting(0, "06:30", "Bắt đầu", "string"),
    breakfast_end_time: makeSetting(0, "08:00", "Kết thúc", "string"),
    breakfast_price: makeSetting(0, 25000, "Giá ăn sáng", "number"),
    lunch_active: makeSetting(0, true, "Ăn trưa", "boolean"),
    lunch_start_time: makeSetting(0, "11:00", "Bắt đầu", "string"),
    lunch_end_time: makeSetting(0, "13:00", "Kết thúc", "string"),
    lunch_price: makeSetting(0, 25000, "Giá ăn trưa", "number"),
    dinner_active: makeSetting(0, true, "Ăn tối", "boolean"),
    dinner_start_time: makeSetting(0, "17:30", "Bắt đầu", "string"),
    dinner_end_time: makeSetting(0, "19:00", "Kết thúc", "string"),
    dinner_price: makeSetting(0, 35000, "Giá ăn tối", "number"),
  },
  rules: {
    allow_multi_meal: makeSetting(0, true, "Cho phép đăng ký nhiều bữa"),
    allow_bulk_registration: makeSetting(0, true, "Cho phép đăng ký hàng loạt"),
    auto_cancel_on_business_trip: makeSetting(
      0,
      true,
      "Tự động hủy khi công tác"
    ),
    auto_cancel_on_leave: makeSetting(0, true, "Tự động hủy khi nghỉ phép"),
    require_cancel_reason: makeSetting(0, false, "Yêu cầu lý do hủy"),
    weekend_service: makeSetting(0, false, "Phục vụ cuối tuần"),
  },
  notification: {
    reminder_enabled: makeSetting(0, true, "Bật nhắc nhở đăng ký", "boolean"),
    reminder_time: makeSetting(0, "08:00", "Giờ gửi thông báo", "string"),
    daily_menu_notify_time: makeSetting(0, "16:00", "Giờ gửi menu", "string"),
  },
  integration: {
    hr_sync_enabled: makeSetting(0, false, "Đồng bộ dữ liệu HR", "boolean"),
    hr_sync_endpoint: makeSetting(0, "", "Endpoint API HR", "string"),
  },
  refund: {
    refund_on_time_rate: makeSetting(0, 100, "Hoàn lại đúng hạn (%)", "number"),
    refund_late_rate: makeSetting(0, 0, "Hoàn lại trễ hạn (%)", "number"),
  },
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const safeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value) || fallback;
};
const parseDayMonth = (input) => {
  const text = safeText(input).trim();
  const match = text.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month };
};
const toBool = (value) =>
  typeof value === "boolean"
    ? value
    : ["true", "1"].includes(
        String(value ?? "")
          .trim()
          .toLowerCase()
      );

const normalizeSaveValueType = (valueType, value) => {
  const normalized = String(valueType || "")
    .trim()
    .toLowerCase();
  if (["boolean", "bool"].includes(normalized)) return "boolean";
  if (["integer", "int"].includes(normalized)) return "integer";
  if (["decimal", "float", "double", "number"].includes(normalized)) {
    return Number.isInteger(Number(value)) ? "integer" : "decimal";
  }
  if (["json", "object"].includes(normalized)) return "json";
  if (normalized === "time") return "time";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "decimal";
  }
  if (value && typeof value === "object") return "json";
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return "time";
  return "string";
};

const normalizeEntry = (entry, fallbackLabel) => {
  const value = entry?.value ?? entry ?? "";
  const id = Number(entry?.id ?? entry?.setting_id ?? 0);
  return {
    id: Number.isFinite(id) ? id : 0,
    value,
    value_type:
      entry?.value_type || entry?.valueType || typeof value || "string",
    label: entry?.label || fallbackLabel,
    description: entry?.description || "",
  };
};

const normalizeSettingsPayload = (payload) => {
  const source = payload?.data ?? payload;
  if (!source) return null;

  const grouped = {};
  const pushItem = (group, key, rawItem) => {
    if (!group || !key) return;
    if (!grouped[group]) grouped[group] = {};
    grouped[group][key] = normalizeEntry(rawItem, key);
  };

  const collections = [
    source,
    source?.settings,
    source?.data,
    source?.items,
    source?.result,
  ].filter(Array.isArray);
  if (collections.length) {
    collections.forEach((list) =>
      list.forEach((item) =>
        pushItem(
          item?.group || item?.setting_group,
          item?.key || item?.setting_key,
          item
        )
      )
    );
  } else if (typeof source === "object") {
    Object.entries(source).forEach(([group, value]) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((item) =>
          pushItem(group, item?.key || item?.setting_key, item)
        );
        return;
      }
      Object.entries(value).forEach(([key, entry]) => {
        if (entry && typeof entry === "object") pushItem(group, key, entry);
      });
    });
  }

  if (Object.keys(grouped).length > 0) return grouped;

  if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, rawValue]) => {
      const matchedGroup = Object.keys(DEFAULT_SETTINGS).find((group) =>
        Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS[group], key)
      );
      if (!matchedGroup) return;
      if (!grouped[matchedGroup]) grouped[matchedGroup] = {};
      const fallback = DEFAULT_SETTINGS[matchedGroup][key];
      grouped[matchedGroup][key] = normalizeEntry(
        {
          id: fallback?.id ?? 0,
          value: rawValue,
          value_type: fallback?.value_type || typeof rawValue || "string",
          label: fallback?.label || key,
          description: fallback?.description || "",
        },
        key
      );
    });
  }

  return Object.keys(grouped).length > 0 ? grouped : null;
};

const mergeWithDefaults = (normalized) => {
  const base = deepClone(DEFAULT_SETTINGS);
  if (!normalized) return base;
  Object.entries(normalized).forEach(([group, items]) => {
    Object.entries(items || {}).forEach(([key, entry]) => {
      const matchedGroup = Object.keys(DEFAULT_SETTINGS).find((name) =>
        Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS[name], key)
      );
      const resolvedGroup = base[group] ? group : matchedGroup || group;
      if (!base[resolvedGroup]) base[resolvedGroup] = {};
      const fallbackLabel = base[resolvedGroup]?.[key]?.label || key;
      base[resolvedGroup][key] = normalizeEntry(entry, fallbackLabel);
    });
  });
  return base;
};

const unwrapArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  return [];
};

const foldText = (value) =>
  safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const resolveUserRoleLabel = (user, roleLabel) => {
  const identity = foldText(
    [user?.username, user?.email, user?.name, user?.fullName, user?.displayName]
      .filter(Boolean)
      .join(" ")
  );
  const roleKey = foldText(roleLabel);

  if (identity.includes("admin") || roleKey.includes("admin")) {
    return "Admin";
  }
  if (
    identity.includes("canbo") ||
    identity.includes("can bo") ||
    roleKey.includes("canbo") ||
    roleKey.includes("can bo")
  ) {
    return "C\u00e1n b\u1ed9";
  }
  if (roleKey === "everyone") {
    return "Nh\u00e2n vi\u00ean";
  }
  return safeText(roleLabel, "Nh\u00e2n vi\u00ean");
};
const mapUserRow = (user, idx) => {
  const roles = user?.roles || user?.role;
  const firstRole = Array.isArray(roles) ? roles[0] : roles;
  const role = resolveUserRoleLabel(
    user,
    firstRole?.name || firstRole?.code || firstRole || "Nh\u00e2n vi\u00ean"
  );
  const activeRaw = user?.isActive ?? user?.active ?? user?.status;
  const status =
    typeof activeRaw === "boolean"
      ? activeRaw
        ? "Hoạt động"
        : "Không hoạt động"
      : String(activeRaw || "")
            .toLowerCase()
            .includes("active") || activeRaw === 1
        ? "Hoạt động"
        : "Không hoạt động";

  return {
    id: user?._id || user?.id || user?.userId || `user-${idx}`,
    name: safeText(
      user?.fullName ||
        user?.name ||
        user?.displayName ||
        user?.username ||
        "Chưa cập nhật"
    ),
    email: safeText(user?.email || user?.username || "Chưa cập nhật"),
    department: safeText(
      user?.parent?.name ||
        user?.organizationUnit?.name ||
        user?.unit?.name ||
        user?.department?.name ||
        user?.departmentName ||
        "Chưa xác định"
    ),
    role,
    status,
  };
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => deepClone(DEFAULT_SETTINGS));
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [holidays, setHolidays] = useState(defaultHolidays);
  const [holidaySort, setHolidaySort] = useState("date_asc");
  const [newHoliday, setNewHoliday] = useState({
    dateLabel: "",
    title: "",
    days: "",
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let normalized = normalizeSettingsPayload(
        await canteenService.getSettings()
      );
      if (!normalized) {
        try {
          normalized = normalizeSettingsPayload(
            await canteenService.getSystemSettings()
          );
        } catch (fallbackError) {
          console.warn("Fallback settings API error:", fallbackError);
        }
      }
      setSettings(mergeWithDefaults(normalized));
    } catch (error) {
      console.error("Fetch settings error:", error);
      setErrorMsg("Lỗi kết nối máy chủ.");
      setSettings(deepClone(DEFAULT_SETTINGS));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      let payload;
      try {
        payload = await canteenService.getUserManagementList({
          page: 1,
          limit: 200,
        });
      } catch {
        payload = await canteenService.getUserManagementListLimit({
          page: 1,
          limit: 200,
        });
      }
      setUsers(
        unwrapArray(payload)
          .map(mapUserRow)
          .filter((x) => x.id)
      );
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await canteenService.getAdminRegistrationLogs({ limit: 50 });
      const rows = unwrapArray(res).map((item, idx) => {
        const timeRaw = item?.timestamp || item?.createdAt || item?.time;
        const date = timeRaw ? new Date(timeRaw) : null;
        const time =
          date && !Number.isNaN(date.getTime())
            ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
            : safeText(timeRaw || "");
        return {
          id: item?.id || idx + 1,
          title: safeText(item?.action || item?.subType || "Action"),
          desc: safeText(item?.details || item?.message || ""),
          time,
        };
      });
      setLogs(rows);
    } catch (error) {
      console.error("Fetch logs error:", error);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, fetchUsers, fetchLogs]);

  const readValue = useCallback(
    (group, key, fallback = "") => settings?.[group]?.[key]?.value ?? fallback,
    [settings]
  );
  const readLabel = useCallback(
    (group, key, fallback = key) =>
      safeText(settings?.[group]?.[key]?.label || fallback),
    [settings]
  );
  const updateValue = (group, key, value) =>
    setSettings((prev) => {
      const next = deepClone(prev);
      if (!next[group]) next[group] = {};
      if (!next[group][key]) next[group][key] = makeSetting(0, value, key);
      next[group][key].value = value;
      return next;
    });
  const toggleValue = (group, key) =>
    updateValue(group, key, !toBool(readValue(group, key, false)));

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload = [];
      Object.entries(settings || {}).forEach(([groupKey, group]) => {
        Object.entries(group || {}).forEach(([settingKey, entry]) => {
          const id = Number(entry?.id ?? 0);
          const baseItem = {
            value: String(entry?.value ?? ""),
            group: groupKey,
            key: settingKey,
            value_type: safeText(entry?.value_type, typeof entry?.value || "string"),
            label: safeText(entry?.label, settingKey),
            description: safeText(entry?.description, ""),
          };
          if (Number.isFinite(id) && id > 0) {
            payload.push({ ...baseItem, id });
          } else {
            payload.push(baseItem);
          }
        });
      });
      if (!payload.length) {
        setErrorMsg("Không có cấu hình hợp lệ để lưu.");
        return;
      }
      const res = await canteenService.updateSettings(payload);
      if (res?.success === false) {
        setErrorMsg("Không thể lưu cấu hình.");
        return;
      }
      setSuccessMsg("Đã lưu thay đổi cấu hình hệ thống.");
      trackAction("UPDATE_CANTEEN_SETTINGS", { count: payload.length });
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (error) {
      console.error("Save settings error:", error);
      setErrorMsg("Lỗi khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday.dateLabel || !newHoliday.title) return;
    setHolidays((prev) => [
      ...prev,
      {
        id: Date.now(),
        dateLabel: newHoliday.dateLabel,
        title: newHoliday.title,
        days: newHoliday.days || "1 ngày nghỉ",
      },
    ]);
    setNewHoliday({ dateLabel: "", title: "", days: "" });
  };
  const handleRemoveHoliday = (id) =>
    setHolidays((prev) => prev.filter((x) => x.id !== id));

  const sortedHolidays = useMemo(() => {
    const direction = holidaySort === "date_desc" ? -1 : 1;
    return [...holidays].sort((a, b) => {
      const left = parseDayMonth(a?.dateLabel);
      const right = parseDayMonth(b?.dateLabel);
      if (left && right) {
        if (left.month !== right.month)
          return (left.month - right.month) * direction;
        if (left.day !== right.day) return (left.day - right.day) * direction;
      } else if (left && !right) {
        return -1;
      } else if (!left && right) {
        return 1;
      }
      return safeText(a?.title).localeCompare(safeText(b?.title), "vi", {
        sensitivity: "base",
      });
    });
  }, [holidays, holidaySort]);

  const mealSessions = useMemo(
    () => [
      { key: "breakfast", fallbackLabel: "Ăn sáng" },
      { key: "lunch", fallbackLabel: "Bữa trưa" },
      { key: "dinner", fallbackLabel: "Ăn tối" },
    ],
    []
  );

  const titleMap = {
    general: VI.tabs.general,
    meals: VI.tabs.meals,
    notifications: VI.tabs.notifications,
    integrations: VI.tabs.integrations,
    holidays: VI.tabs.holidays,
    users: VI.tabs.users,
    logs: VI.tabs.logs,
  };

  const panel = (() => {
    if (activeTab === "general") {
      return (
        <Stack spacing={2}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography fontWeight={700} mb={1}>
              Deadline đăng ký và hủy
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={readLabel(
                    "deadline",
                    "registration_deadline_time",
                    "Hạn đăng ký"
                  )}
                  type="time"
                  value={readValue(
                    "deadline",
                    "registration_deadline_time",
                    "16:00"
                  )}
                  onChange={(e) =>
                    updateValue(
                      "deadline",
                      "registration_deadline_time",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={readLabel(
                    "deadline",
                    "cancellation_deadline_time",
                    "Hạn hủy"
                  )}
                  type="time"
                  value={readValue(
                    "deadline",
                    "cancellation_deadline_time",
                    "10:00"
                  )}
                  onChange={(e) =>
                    updateValue(
                      "deadline",
                      "cancellation_deadline_time",
                      e.target.value
                    )
                  }
                />
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography fontWeight={700} mb={1}>
              Quy tắc hệ thống
            </Typography>
            <Stack divider={<Divider flexItem />}>
              {Object.keys(settings?.rules || {}).map((key) => (
                <FormControlLabel
                  key={key}
                  sx={{ m: 0, py: 0.8, justifyContent: "space-between" }}
                  control={
                    <Switch
                      checked={toBool(readValue("rules", key, false))}
                      onChange={() => toggleValue("rules", key)}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600}>
                      {readLabel("rules", key, key)}
                    </Typography>
                  }
                  labelPlacement="start"
                />
              ))}
            </Stack>
          </Paper>
        </Stack>
      );
    }
    if (activeTab === "meals") {
      return (
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>
            Cấu hình bữa ăn
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={2}>
            {mealSessions.map((meal) => (
              <Box key={meal.key} pt={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography fontWeight={700}>
                    {readLabel(
                      "meal_session",
                      `${meal.key}_active`,
                      meal.fallbackLabel
                    )}
                  </Typography>
                  <Switch
                    checked={toBool(
                      readValue("meal_session", `${meal.key}_active`, true)
                    )}
                    onChange={() =>
                      toggleValue("meal_session", `${meal.key}_active`)
                    }
                  />
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label={readLabel(
                        "meal_session",
                        `${meal.key}_price`,
                        "Giá"
                      )}
                      value={readValue("meal_session", `${meal.key}_price`, 0)}
                      onChange={(e) =>
                        updateValue(
                          "meal_session",
                          `${meal.key}_price`,
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label={readLabel(
                        "meal_session",
                        `${meal.key}_start_time`,
                        "Bắt đầu"
                      )}
                      value={readValue(
                        "meal_session",
                        `${meal.key}_start_time`,
                        ""
                      )}
                      onChange={(e) =>
                        updateValue(
                          "meal_session",
                          `${meal.key}_start_time`,
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label={readLabel(
                        "meal_session",
                        `${meal.key}_end_time`,
                        "Kết thúc"
                      )}
                      value={readValue(
                        "meal_session",
                        `${meal.key}_end_time`,
                        ""
                      )}
                      onChange={(e) =>
                        updateValue(
                          "meal_session",
                          `${meal.key}_end_time`,
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Paper>
      );
    }
    if (activeTab === "notifications") {
      return (
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>
            {VI.tabs.notifications}
          </Typography>
          <Stack spacing={1.5}>
            <FormControlLabel
              sx={{ m: 0, justifyContent: "space-between" }}
              control={
                <Switch
                  checked={toBool(
                    readValue("notification", "reminder_enabled", true)
                  )}
                  onChange={() =>
                    toggleValue("notification", "reminder_enabled")
                  }
                />
              }
              label={
                <Typography fontWeight={600}>
                  {readLabel(
                    "notification",
                    "reminder_enabled",
                    "Bật nhắc nhở"
                  )}
                </Typography>
              }
              labelPlacement="start"
            />
            <TextField
              fullWidth
              type="time"
              label={readLabel(
                "notification",
                "reminder_time",
                "Giờ gửi thông báo"
              )}
              value={readValue("notification", "reminder_time", "08:00")}
              onChange={(e) =>
                updateValue("notification", "reminder_time", e.target.value)
              }
            />
            <TextField
              fullWidth
              type="time"
              label={readLabel(
                "notification",
                "daily_menu_notify_time",
                "Giờ gửi menu"
              )}
              value={readValue(
                "notification",
                "daily_menu_notify_time",
                "16:00"
              )}
              onChange={(e) =>
                updateValue(
                  "notification",
                  "daily_menu_notify_time",
                  e.target.value
                )
              }
            />
          </Stack>
        </Paper>
      );
    }
    if (activeTab === "integrations") {
      return (
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography fontWeight={700}>{VI.tabs.integrations}</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => canteenService.syncDatabase()}
            >
              {VI.common.sync}
            </Button>
          </Stack>
          <Stack spacing={1.5}>
            <FormControlLabel
              sx={{ m: 0, justifyContent: "space-between" }}
              control={
                <Switch
                  checked={toBool(
                    readValue("integration", "hr_sync_enabled", false)
                  )}
                  onChange={() => toggleValue("integration", "hr_sync_enabled")}
                />
              }
              label={
                <Typography fontWeight={600}>
                  {readLabel(
                    "integration",
                    "hr_sync_enabled",
                    "Đồng bộ dữ liệu HR"
                  )}
                </Typography>
              }
              labelPlacement="start"
            />
            <TextField
              fullWidth
              label={readLabel(
                "integration",
                "hr_sync_endpoint",
                "Endpoint API HR"
              )}
              value={readValue("integration", "hr_sync_endpoint", "")}
              onChange={(e) =>
                updateValue("integration", "hr_sync_endpoint", e.target.value)
              }
            />
          </Stack>
        </Paper>
      );
    }
    if (activeTab === "holidays") {
      return (
        <Stack spacing={2}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography fontWeight={700} mb={1}>
              Thêm ngày nghỉ
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Ngày"
                  placeholder="dd/mm"
                  value={newHoliday.dateLabel}
                  onChange={(e) =>
                    setNewHoliday((p) => ({ ...p, dateLabel: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Tên ngày nghỉ"
                  value={newHoliday.title}
                  onChange={(e) =>
                    setNewHoliday((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Số ngày"
                  value={newHoliday.days}
                  onChange={(e) =>
                    setNewHoliday((p) => ({ ...p, days: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddHoliday}
                  sx={{ height: "100%" }}
                >
                  <AddIcon />
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography fontWeight={700} mb={1}>
              Danh sách ngày nghỉ
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="flex-end"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={1.5}
              mb={1}
            >
              <TextField
                select
                size="small"
                label={"S\u1eafp x\u1ebfp"}
                value={holidaySort}
                onChange={(e) => setHolidaySort(e.target.value)}
                sx={{ minWidth: { xs: "100%", md: 240 } }}
                SelectProps={{ native: true }}
              >
                <option value="date_asc">
                  {"Ng\u00e0y l\u1ec5 g\u1ea7n tr\u01b0\u1edbc"}
                </option>
                <option value="date_desc">
                  {"Ng\u00e0y l\u1ec5 xa tr\u01b0\u1edbc"}
                </option>
              </TextField>
            </Stack>
            <Stack spacing={1.2}>
              {sortedHolidays.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 1.5,
                    p: 1.2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {safeText(item.title)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {safeText(item.dateLabel)} - {safeText(item.days)}
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveHoliday(item.id)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Stack>
      );
    }
    if (activeTab === "users") {
      return (
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography fontWeight={700}>{VI.tabs.users}</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={usersLoading}
            >
              {VI.common.refresh}
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Họ tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Bộ phận</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={18} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {VI.common.noUsers}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.department}</TableCell>
                    <TableCell>
                      <Chip size="small" label={u.role} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.status}
                        color={u.status === "Hoạt động" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      );
    }
    return (
      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography fontWeight={700}>{VI.tabs.logs}</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={logsLoading}
          >
            {VI.common.refresh}
          </Button>
        </Stack>
        <Stack spacing={1.2}>
          {logsLoading ? (
            <Box sx={{ py: 2, textAlign: "center" }}>
              <CircularProgress size={18} />
            </Box>
          ) : logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {VI.common.noLogs}
            </Typography>
          ) : (
            logs.map((log) => (
              <Paper key={log.id} variant="outlined" sx={{ p: 1.2 }}>
                <Typography variant="body2" fontWeight={700}>
                  {log.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {log.desc}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {log.time}
                </Typography>
              </Paper>
            ))
          )}
        </Stack>
      </Paper>
    );
  })();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 2.5 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2.6}>
          <Paper sx={{ borderRadius: 2 }}>
            <List disablePadding>
              {tabs.map((tab) => (
                <ListItemButton
                  key={tab.key}
                  selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>{tab.icon}</ListItemIcon>
                  <ListItemText
                    primary={tab.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9.4}>
          <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight={700}>
                {titleMap[activeTab]}
              </Typography>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                onClick={handleSave}
              >
                {VI.common.save}
              </Button>
            </Stack>
          </Paper>
          {errorMsg ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          ) : null}
          {successMsg ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMsg}
            </Alert>
          ) : null}
          {panel}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SystemSettings;
