import React, { useState, useEffect } from "react";
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
  TextField,
  Paper,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import moment from "moment";
import "moment/locale/vi";
import { getMealSessionConfig } from "../../utils/canteenMealConfig";

moment.locale("vi");

const EditRegistrationModal = ({
  open,
  reg,
  menus = [],
  onClose,
  onSave,
  loading,
}) => {
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [note, setNote] = useState("");
  const [config, setConfig] = useState(getMealSessionConfig);

  useEffect(() => {
    const updateConfig = () => setConfig(getMealSessionConfig());
    updateConfig();
    window.addEventListener("canteen_settings_updated", updateConfig);
    window.addEventListener("storage", updateConfig);
    return () => {
      window.removeEventListener("canteen_settings_updated", updateConfig);
      window.removeEventListener("storage", updateConfig);
    };
  }, []);

  useEffect(() => {
    if (reg) {
      const fromItems = (reg.items || []).map((i) =>
        Number(i.mealSessionId || i.meal_session_id || i.id || 0)
      );
      const fromSessions = (reg.meal_sessions || []).map((s) =>
        Number(s.meal_session_id || s.id || 0)
      );
      const fromMealSessionIds = (reg.mealSessionIds || []).map((s) => Number(s));
      const merged = Array.from(
        new Set([...fromItems, ...fromSessions, ...fromMealSessionIds].filter(Boolean))
      );
      setSelectedSessions(merged.length > 0 ? merged : [2]);
      setNote(reg.note || "");
    }
  }, [reg]);

  if (!reg) return null;

  const toggleSession = (id) => {
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const dynamicSessions = [1, 2, 3].map((sid) => config[sid]);

  const effectiveSessions =
    Array.isArray(menus) && menus.length > 0
      ? menus.map((m) => {
          const sid = Number(m.mealSessionId || m.meal_session_id || 2);
          const def = config[sid] || config[2];
          return {
            ...def,
            mealSessionId: sid,
            price: Number(m.price || def.price),
            dishName: m.dishName || m.dish_name || def.dishName,
          };
        })
      : dynamicSessions;

  const totalCost = effectiveSessions
    .filter((s) => selectedSessions.includes(s.mealSessionId))
    .reduce((sum, s) => sum + s.price, 0);

  const handleSave = () => {
    if (selectedSessions.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ca ăn!");
      return;
    }
    onSave({ meal_session_ids: selectedSessions, note });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <EditIcon sx={{ color: "#EAB308" }} />
        <Typography fontWeight={800} fontSize={18}>
          Chỉnh sửa Đăng ký Suất ăn
        </Typography>
        <Box flex={1} />
        <Box
          onClick={onClose}
          sx={{ cursor: "pointer", color: "text.secondary", p: 0.5 }}
        >
          <CloseIcon />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "10px !important" }}>
        <Box
          sx={{
            bgcolor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderLeft: "4px solid #EAB308",
            borderRadius: 2,
            p: 1.5,
            mb: 2,
            display: "flex",
            gap: 1.2,
            alignItems: "center",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 20, color: "#EAB308", flexShrink: 0 }} />
          <Typography fontSize={13} color="#92400E">
            Lưu ý: Thay đổi có hiệu lực ngay lập tức. Chi phí chênh lệch sẽ được tự động cộng/hoàn vào tài khoản định mức.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 2,
            p: 1.5,
            mb: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontSize={12} color="text.secondary">
              Ngày ăn đã chọn:
            </Typography>
            <Typography fontWeight={800} fontSize={16} color="primary.main" textTransform="capitalize">
              {moment(reg.date).format("dddd, [ngày] DD/MM/YYYY")}
            </Typography>
          </Box>
          <RestaurantMenuIcon sx={{ color: "primary.main", fontSize: 28 }} />
        </Paper>

        <Typography fontWeight={700} fontSize={14} mb={1.2}>
          Lựa chọn các ca ăn trong ngày:
        </Typography>

        <Stack spacing={1.5} mb={2.5}>
          {effectiveSessions.map((s) => {
            const selected = selectedSessions.includes(s.mealSessionId);
            return (
              <Box
                key={s.mealSessionId}
                onClick={() => toggleSession(s.mealSessionId)}
                sx={{
                  border: selected ? "2px solid #3B82F6" : "1.5px solid #E2E8F0",
                  borderLeft: `5px solid ${s.border}`,
                  bgcolor: selected ? s.bg : "white",
                  borderRadius: 2,
                  p: 1.8,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    borderColor: "#3B82F6",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.3}>
                    <Typography fontSize={16}>{s.icon}</Typography>
                    <Typography fontWeight={800} fontSize={15}>
                      {s.name}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      ({s.time})
                    </Typography>
                  </Stack>
                  <Typography fontSize={13} color="text.secondary" pl={3}>
                    🍛 Thực đơn: <strong style={{ color: "#334155" }}>{s.dishName}</strong>
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography fontWeight={800} color="error.main" fontSize={15}>
                    {s.price.toLocaleString("vi-VN")}đ
                  </Typography>
                  <Checkbox checked={selected} sx={{ p: 0 }} />
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <TextField
          label="Ghi chú điều chỉnh"
          placeholder="Ví dụ: Đổi sang ăn chay, ăn tại bếp 1, mang về..."
          fullWidth
          size="small"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700} fontSize={15}>
            Tổng chi phí mới:
          </Typography>
          <Typography fontWeight={900} color="error.main" fontSize={22}>
            {totalCost.toLocaleString("vi-VN")}đ
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<CheckIcon />}
          disabled={loading || selectedSessions.length === 0}
          sx={{ borderRadius: 2, textTransform: "none", px: 3, fontWeight: 700 }}
        >
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRegistrationModal;
