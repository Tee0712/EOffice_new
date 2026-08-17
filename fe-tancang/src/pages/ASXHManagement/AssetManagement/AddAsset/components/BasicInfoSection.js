import React from "react";
import { Box, Paper, Stack, Grid, TextField, Typography, MenuItem } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const UNITS = ["Cái", "Bộ", "Chiếc", "Thùng", "Kg", "Khác"];
const CATEGORIES = ["Thiết bị CNTT", "Nội thất trường học", "Thiết bị giảng dạy", "Thiết bị y tế", "Vật tư xây dựng", "Khác"];

// Local refined components for tight design control
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



const BasicInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            width: 28, 
            height: 28, 
            borderRadius: "50%", 
            bgcolor: "#F97316", 
            color: "white", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px"
          }}>1</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "18px" }}>
            Thông tin hạng mục
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ bgcolor: "#F1F5F9", px: 1.5, py: 0.5, borderRadius: "8px" }}>
          <Typography sx={{ color: "#F97316", fontWeight: "bold", fontSize: "13px" }}>HV-005/06</Typography>
          <Typography sx={{ color: "#10B981", fontSize: "12px", bgcolor: "#DCFCE7", px: 1, borderRadius: "4px" }}>Mới</Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Asset Name */}
        <Grid item xs={12} md={8}>
          <SkyFieldLabel required>Tên hạng mục hiện vật</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="Nhập tên hiện vật..."
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>

        {/* Unit */}
        {/* Category */}
        <Grid item xs={12} md={6}>
          <SkyFieldLabel required>Danh mục</SkyFieldLabel>
          <SkyTextField
            select
            fullWidth
            value={formData.category || ""}
            onChange={(e) => onChange("category", e.target.value)}
            error={!!errors.category}
            helperText={errors.category}
          >
            <MenuItem value="" disabled>Chọn danh mục...</MenuItem>
            {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </SkyTextField>
        </Grid>

        {/* Unit */}
        <Grid item xs={12} md={6}>
          <SkyFieldLabel>Đơn vị tính</SkyFieldLabel>
          <SkyTextField
            select
            fullWidth
            value={formData.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            error={!!errors.unit}
            helperText={errors.unit}
          >
             {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </SkyTextField>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <SkyFieldLabel>Mô tả / Lý do cần thiết</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="Mục đích sử dụng, lý do bổ sung, đối tượng thụ hưởng..."
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </Grid>

      </Grid>
    </Paper>
  );
};

export default BasicInfoSection;
