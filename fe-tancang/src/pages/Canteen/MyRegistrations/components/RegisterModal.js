import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  Checkbox,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import moment from "moment";
import "moment/locale/vi";
import { canteenService } from "../../../../services/canteenService";

moment.locale("vi");

const MY_REG_CACHE_KEY = "canteen_my_reg_cache_v1";

const SESSION_UI = {
  1: { border: "#EAB308", name: "Ăn sáng", time: "06:30 - 08:00" },
  2: { border: "#22C55E", name: "Ăn trưa", time: "11:00 - 13:00" },
  3: { border: "#A855F7", name: "Ăn tối", time: "17:30 - 19:00" },
};

const decodeMojibake = (value) => {
  if (typeof value !== "string") return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

const normalizeErrorMessage = (err) => {
  const raw = err?.response?.data?.message;
  if (Array.isArray(raw))
    return raw.map((x) => decodeMojibake(String(x))).join(", ");
  if (raw && typeof raw === "object") {
    if (typeof raw.message === "string") return decodeMojibake(raw.message);
    return decodeMojibake(JSON.stringify(raw));
  }
  return decodeMojibake(raw || "Đăng ký thất bại");
};

const RegisterModal = ({
  open,
  onClose,
  onSuccess,
  onRegistered,
  initialDate,
}) => {
  const [date, setDate] = useState(moment().add(1, "day").format("YYYY-MM-DD"));
  const [menus, setMenus] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;

    const effectiveDate = initialDate || date;
    if (!effectiveDate) return;

    setDate(effectiveDate);
    setFetching(true);
    let active = true;

    canteenService
      .getCalendar(effectiveDate, effectiveDate)
      .then((res) => {
        if (!active) return;
        setMenus(
          res?.data?.menus?.filter(
            (m) => moment(m.date).format("YYYY-MM-DD") === effectiveDate
          ) || []
        );
        const dayReg = (res?.data?.registrations || []).find(
          (r) => moment(r.date).format("YYYY-MM-DD") === effectiveDate
        );
        const preselected = (dayReg?.items || [])
          .map((i) => Number(i.mealSessionId))
          .filter((x) => [1, 2, 3].includes(x));
        setSelectedSessions(Array.from(new Set(preselected)));
      })
      .catch(() => {
        if (!active) return;
        setMenus([]);
        setSelectedSessions([]);
      })
      .finally(() => {
        if (!active) return;
        setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [open, initialDate, date]);

  const selectedDate = moment(date, "YYYY-MM-DD");
  const defaultDeadline = selectedDate
    .clone()
    .subtract(1, "day")
    .set({ hour: 16, minute: 0, second: 0, millisecond: 0 });

  const getMenuDeadline = (menu) => {
    if (menu?.registerDeadlineAt) return moment(menu.registerDeadlineAt);
    return defaultDeadline;
  };

  const isMenuExpired = (menu) => moment().isAfter(getMenuDeadline(menu));

  const expiredSessionSet = useMemo(() => {
    const set = new Set();
    (menus || []).forEach((menu) => {
      if (isMenuExpired(menu)) {
        set.add(Number(menu.mealSessionId));
      }
    });
    return set;
  }, [menus]);

  const toggle = (id) => {
    if (expiredSessionSet.has(Number(id))) return;
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalCost = menus
    .filter((m) => selectedSessions.includes(Number(m.mealSessionId)))
    .reduce((sum, m) => sum + Number(m.price || 0), 0);

  const diffHoursRaw = Math.floor(
    moment.duration(defaultDeadline.diff(moment())).asHours()
  );
  const deadlineText =
    diffHoursRaw >= 0 ? `còn ${diffHoursRaw} giờ` : "đã hết hạn";
  const hasExpiredSelected = selectedSessions.some((sid) =>
    expiredSessionSet.has(Number(sid))
  );

  const handleSubmit = async () => {
    if (selectedSessions.length === 0) return;

    const blockedSelected = selectedSessions.filter((sid) =>
      expiredSessionSet.has(Number(sid))
    );
    if (blockedSelected.length > 0) {
      alert(
        "Đã quá hạn đăng ký cho một hoặc nhiều bữa đã chọn. Vui lòng bỏ chọn bữa quá hạn."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await canteenService.registerByDate({
        date,
        meal_session_ids: selectedSessions,
        note: note || null,
      });
      const registeredCount = Number(res?.data?.registered || 0);
      const alreadyRegistered = Boolean(res?.data?.already_registered);
      const serverMessage = decodeMojibake(res?.data?.message || "");

      try {
        const raw = localStorage.getItem(MY_REG_CACHE_KEY);
        const cache = raw ? JSON.parse(raw) : {};
        cache[date] = {
          id: `local-${date}`,
          date,
          status: "upcoming",
          totalCost: Number(totalCost || 0),
          note: note || null,
          items: selectedSessions.map((sid) => ({
            mealSessionId: Number(sid),
          })),
          updatedAt: Date.now(),
        };
        localStorage.setItem(MY_REG_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // ignore local cache errors
      }

      onRegistered?.({
        date,
        mealSessionIds: [...selectedSessions],
        totalCost,
      });

      if (onSuccess) {
        await onSuccess();
      }

      if (alreadyRegistered || registeredCount === 0) {
        alert(serverMessage || "Bạn đã đăng ký các bữa đã chọn.");
      } else {
        alert("Đăng ký bữa ăn thành công");
      }
      onClose();
    } catch (err) {
      alert(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <RestaurantIcon sx={{ color: "primary.main" }} />
        <Typography fontWeight={700}>Đăng ký suất ăn</Typography>
        <Box flex={1} />
        <Box
          onClick={onClose}
          sx={{ cursor: "pointer", color: "text.secondary" }}
        >
          <CloseIcon />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            bgcolor: "#edf3fd",
            borderRadius: 1.5,
            py: 1.2,
            px: 1.5,
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography fontSize={35} fontWeight={800} color="#1E3A8A">
            {selectedDate.format("dddd, DD/MM/YYYY")}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Ngày {selectedDate.date()} tháng {selectedDate.month() + 1} năm{" "}
            {selectedDate.year()}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "#FFF7D6",
            borderLeft: "3px solid #F59E0B",
            borderRadius: 1,
            p: 1,
            mb: 2,
          }}
        >
          <Typography fontSize={13} color="#7C2D12" fontWeight={600}>
            Deadline đăng ký: {defaultDeadline.format("HH:mm DD/MM/YYYY")} (
            {deadlineText})
          </Typography>
        </Box>

        {fetching ? (
          <Typography color="text.secondary" fontSize={13}>
            Đang tải menu...
          </Typography>
        ) : menus.length === 0 ? (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Chưa có menu cho ngày này
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {menus.map((menu) => {
              const cfg = SESSION_UI[menu.mealSessionId] || SESSION_UI[2];
              const selected = selectedSessions.includes(
                Number(menu.mealSessionId)
              );
              const isExpired = isMenuExpired(menu);

              return (
                <Box
                  key={menu.mealSessionId}
                  onClick={() => toggle(Number(menu.mealSessionId))}
                  sx={{
                    border: selected
                      ? "2px solid #3B82F6"
                      : "1.5px solid #E5E7EB",
                    borderLeft: `4px solid ${cfg.border}`,
                    bgcolor: selected ? "#EFF6FF" : "white",
                    borderRadius: 2,
                    p: 1.5,
                    cursor: isExpired ? "not-allowed" : "pointer",
                    opacity: isExpired ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box flex={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={700} fontSize={14}>
                        {cfg.name}
                      </Typography>
                      <Typography
                        fontWeight={700}
                        color="error.main"
                        fontSize={13}
                      >
                        {Number(menu.price).toLocaleString("vi-VN")}đ
                      </Typography>
                    </Stack>
                    <Typography fontSize={12} color="text.secondary">
                      {cfg.time}
                    </Typography>
                    {menu.dishName && (
                      <Typography fontSize={12} color="text.secondary">
                        {menu.dishName}
                      </Typography>
                    )}
                    {isExpired && (
                      <Typography
                        fontSize={12}
                        color="error.main"
                        fontWeight={600}
                      >
                        Đã quá hạn đăng ký
                      </Typography>
                    )}
                  </Box>
                  <Checkbox
                    checked={selected}
                    disabled={isExpired}
                    size="small"
                    readOnly
                    sx={{ p: 0 }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}

        {hasExpiredSelected && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Có bữa đã quá hạn trong lựa chọn. Vui lòng bỏ chọn trước khi xác
            nhận.
          </Alert>
        )}

        {totalCost > 0 && (
          <Box
            sx={{
              mt: 2,
              bgcolor: "#edf3fd",
              borderRadius: 1.5,
              py: 1.2,
              px: 1.5,
              textAlign: "center",
            }}
          >
            <Typography fontWeight={500} color="text.secondary">
              Tổng chi phí
            </Typography>
            <Typography fontWeight={800} color="error.main" fontSize={34}>
              {totalCost.toLocaleString("vi-VN")}đ
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            bgcolor: "#dff7eb",
            borderLeft: "3px solid #10B981",
            borderRadius: 1,
            px: 1,
            py: 1,
          }}
        >
          <Typography fontSize={13} color="#065F46">
            Lưu ý: Bạn có thể hủy đăng ký trước 10:00 sáng cùng ngày để được
            hoàn tiền.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            fetching ||
            selectedSessions.length === 0 ||
            hasExpiredSelected
          }
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          {loading ? "Đang đăng ký..." : "Xác nhận đăng ký"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterModal;
