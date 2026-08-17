import React from "react";
import { 
  Paper, 
  Typography, 
  Grid, 
  Box, 
  TextField, 
  Stack
} from "@mui/material";

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
        padding: props.multiline ? "0px" : "8.5px 14px",
        fontSize: "0.875rem",
      },
      "& .MuiInputBase-multiline": {
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


const LocalContactSection = ({ formData, errors, onChange }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#3b82f6", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          3
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Liên hệ tại địa phương
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SkyFieldLabel required>Người đại diện tiếp nhận</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="VD: Thầy Nguyễn Văn Tâm..."
            value={formData.receiver_name}
            onChange={(e) => onChange("receiver_name", e.target.value)}
            error={!!errors.receiver_name}
            helperText={errors.receiver_name}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SkyFieldLabel>Chức vụ</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="VD: Hiệu trưởng trường THCS..."
            value={formData.receiver_title}
            onChange={(e) => onChange("receiver_title", e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SkyFieldLabel required>Số điện thoại</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="Nhập số điện thoại liên hệ..."
            value={formData.receiver_phone}
            onChange={(e) => onChange("receiver_phone", e.target.value)}
            error={!!errors.receiver_phone}
            helperText={errors.receiver_phone}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SkyFieldLabel>Email</SkyFieldLabel>
          <SkyTextField
            fullWidth
            placeholder="VD: nguyenvantam@gmail.com..."
            value={formData.receiver_email}
            onChange={(e) => onChange("receiver_email", e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default LocalContactSection;
