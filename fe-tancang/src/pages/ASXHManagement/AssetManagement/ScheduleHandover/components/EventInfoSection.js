import React from "react";
import { 
  Paper, 
  Typography, 
  Grid, 
  Box, 
  TextField, 
  MenuItem,
  Stack
} from "@mui/material";
import { AccessTime, Event, LocationOn } from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const SkyFieldLabel = ({ children, required }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", mb: 0.75, display: "block" }}>
    {children} {required && <span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>}
  </Typography>
);

const SkyTextField = (props) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    sx={{ 
      "& .MuiOutlinedInput-root": { 
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        "& fieldset": { borderColor: "#e2e8f0" },
        "&:hover fieldset": { borderColor: "#cbd5e1" },
        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
      },
      "& .MuiInputBase-input": {
        fontSize: "0.875rem",
        padding: props.multiline ? "0 !important" : "8.5px 14px",
      },
      "& .MuiInputBase-root.MuiInputBase-multiline": {
        padding: "8.5px 14px",
      },
      "& .MuiInputBase-input::placeholder": {
        opacity: 0.6,
        color: "#64748b",
      },
      ...props.sx 
    }}
  />
);


const EventInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#3b82f6", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          1
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Thông tin sự kiện bàn giao
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SkyFieldLabel required>Tên sự kiện</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="VD: Bàn giao đợt 1 – Máy tính & Máy in..."
            value={formData.event_name}
            onChange={(e) => onChange("event_name", e.target.value)}
            error={!!errors.event_name}
            helperText={errors.event_name}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SkyFieldLabel required>Ngày bàn giao</SkyFieldLabel>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker 
              format="DD/MM/YYYY"
              value={formData.handover_date ? dayjs(formData.handover_date) : null}
              onChange={(val) => onChange("handover_date", val ? val.format("YYYY-MM-DD") : "")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  error: !!errors.handover_date,
                  helperText: errors.handover_date,
                  sx: {
                    "& .MuiOutlinedInput-root": { 
                      borderRadius: "8px",
                      bgcolor: "#FFFFFF",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "0.875rem",
                      padding: "8.5px 14px",
                    }
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={8}>
          <SkyFieldLabel>Thời gian</SkyFieldLabel>
          <Stack direction="row" spacing={2} alignItems="center">
            <SkyTextField
              sx={{ flex: 1 }}
              type="time"
              InputProps={{
                startAdornment: <AccessTime sx={{ color: "#94a3b8", mr: 1, fontSize: "1.25rem" }} />,
              }}
              value={formData.start_time}
              onChange={(e) => onChange("start_time", e.target.value)}
            />
            <Typography variant="body2" sx={{ color: "#64748b" }}>đến</Typography>
            <SkyTextField
              sx={{ flex: 1 }}
              type="time"
              InputProps={{
                startAdornment: <AccessTime sx={{ color: "#94a3b8", mr: 1, fontSize: "1.25rem" }} />,
              }}
              value={formData.end_time}
              onChange={(e) => onChange("end_time", e.target.value)}
            />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <SkyFieldLabel required>Địa điểm</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="Nhập địa chỉ chi tiết nơi bàn giao..."
            InputProps={{
              startAdornment: <LocationOn sx={{ color: "#94a3b8", mr: 1, fontSize: "1.25rem" }} />,
            }}
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
            error={!!errors.location}
            helperText={errors.location}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SkyFieldLabel>Loại sự kiện</SkyFieldLabel>
          <SkyTextField
            select
            fullWidth
            value={formData.event_type}
            onChange={(e) => onChange("event_type", e.target.value)}
          >
            <MenuItem value="PARTIAL_HANDOVER">Bàn giao từng đợt</MenuItem>
            <MenuItem value="FULL_HANDOVER">Bàn giao toàn bộ</MenuItem>
            <MenuItem value="TOTAL_INSPECTION">Nghiệm thu tổng</MenuItem>
            <MenuItem value="OFFICIAL_GIFTING">Lễ trao tặng chính thức</MenuItem>
          </SkyTextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <SkyFieldLabel>Hình thức</SkyFieldLabel>
          <SkyTextField
            select
            fullWidth
            value={formData.format}
            onChange={(e) => onChange("format", e.target.value)}
          >
            <MenuItem value="DIRECT">Trực tiếp tại địa phương</MenuItem>
            <MenuItem value="SHIPPING">Giao nhận qua đơn vị vận chuyển</MenuItem>
          </SkyTextField>
        </Grid>

        <Grid item xs={12}>
          <SkyFieldLabel>Ghi chú sự kiện</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="Cần chuẩn bị banner, phông nền lễ trao tặng. Đại diện TCSG phát biểu + trao bảng tượng trưng. Hiệu trưởng tiếp nhận và ký biên bản."
            value={formData.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </Grid>

      </Grid>
    </Paper>
  );
};

export default EventInfoSection;
