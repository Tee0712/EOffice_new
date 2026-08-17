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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import moment from "moment";
import "moment/locale/vi";

moment.locale("vi");

const SESSION_UI = {
  1: {
    border: "#EAB308",
    bg: "#FEFCE8",
    name: "Ăn sáng",
    time: "06:30 - 08:00",
  },
  2: {
    border: "#22C55E",
    bg: "#F0FDF4",
    name: "Ăn trưa",
    time: "11:00 - 13:00",
  },
  3: {
    border: "#A855F7",
    bg: "#FAF5FF",
    name: "Ăn tối",
    time: "17:30 - 19:00",
  },
};

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

  useEffect(() => {
    if (reg) {
      setSelectedSessions(
        (reg.items || []).map((i) => Number(i.mealSessionId))
      );
      setNote(reg.note || "");
    }
  }, [reg]);

  if (!reg) return null;

  const toggleSession = (id) => {
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalCost = (menus || [])
    .filter((m) => selectedSessions.includes(Number(m.mealSessionId)))
    .reduce((sum, m) => sum + Number(m.price || 0), 0);

  const handleSave = () => onSave({ meal_session_ids: selectedSessions, note });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}
      >
        <EditIcon sx={{ color: "#EAB308" }} />
        <Typography fontWeight={700}>Chỉnh sửa Đăng ký</Typography>
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
            bgcolor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderLeft: "4px solid #EAB308",
            borderRadius: 1.5,
            p: 1.5,
            mb: 2,
            display: "flex",
            gap: 1,
          }}
        >
          <WarningAmberIcon
            sx={{ fontSize: 18, color: "#EAB308", flexShrink: 0, mt: 0.2 }}
          />
          <Typography fontSize={12} color="#92400E">
            Chỉnh sửa trước khi hết deadline. Sau khi lưu, tổng chi phí sẽ được
            cập nhật.
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "#EFF6FF",
            borderRadius: 2,
            p: 1.5,
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography
            fontWeight={700}
            color="primary.main"
            textTransform="capitalize"
          >
            {moment(reg.date).format("dddd")}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {moment(reg.date).format("DD/MM/YYYY")}
          </Typography>
        </Box>

        <Typography fontWeight={600} mb={1}>
          Chọn bữa ăn
        </Typography>
        <Stack spacing={1.5}>
          {(menus || []).map((menu) => {
            const cfg = SESSION_UI[Number(menu.mealSessionId)] || SESSION_UI[2];
            const selected = selectedSessions.includes(
              Number(menu.mealSessionId)
            );
            return (
              <Box
                key={menu.mealSessionId}
                onClick={() => toggleSession(Number(menu.mealSessionId))}
                sx={{
                  border: selected
                    ? "2px solid #3B82F6"
                    : "1.5px solid #E5E7EB",
                  borderLeft: `4px solid ${cfg.border}`,
                  bgcolor: selected ? "#EFF6FF" : "white",
                  borderRadius: 2,
                  p: 1.5,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box flex={1}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography fontWeight={700} fontSize={14}>
                      {cfg.name}
                    </Typography>
                    <Typography
                      fontWeight={700}
                      color="error.main"
                      fontSize={13}
                    >
                      {Number(menu.price || 0).toLocaleString("vi-VN")}đ
                    </Typography>
                  </Stack>
                  <Typography fontSize={12} color="text.secondary">
                    {cfg.time}
                  </Typography>
                  {menu.dishName && (
                    <Typography fontSize={12} color="text.secondary" mt={0.3}>
                      {menu.dishName}
                    </Typography>
                  )}
                </Box>
                <Checkbox
                  checked={selected}
                  size="small"
                  sx={{ p: 0, color: selected ? "primary.main" : "grey.400" }}
                  readOnly
                />
              </Box>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          pt={1.5}
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        >
          <Typography fontWeight={600}>Tổng chi phí</Typography>
          <Typography fontWeight={800} color="error.main" fontSize={20}>
            {totalCost.toLocaleString("vi-VN")}đ
          </Typography>
        </Stack>
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
          onClick={handleSave}
          variant="contained"
          color="success"
          startIcon={<CheckIcon />}
          disabled={loading || selectedSessions.length === 0}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRegistrationModal;
