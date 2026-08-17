import React from "react";
import { 
  Paper, 
  Typography, 
  Grid, 
  Box, 
  TextField, 
  Stack, 
  InputAdornment 
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { SkyFieldLabel } from "@styles/SkyStyles";
import { MenuItem } from "@mui/material";

const SPECIAL_REQUIREMENT_OPTIONS = [
  "Không có",
  "Cần lắp đặt tại chỗ",
  "Cần đào tạo sử dụng",
  "Cần bảo hiểm vận chuyển"
];

// Local refined components for tight design control
const skyTextFieldSx = { 
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
  },
  "& .MuiInputBase-root.MuiInputBase-multiline": {
    padding: "8.5px 14px",
  },
  "& .MuiInputBase-input::placeholder": {
    opacity: 0.6,
    color: "#64748b",
  }
};

const SkyTextField = (props) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    sx={{ 
      ...skyTextFieldSx,
      "& .MuiInputBase-input": {
        ...skyTextFieldSx["& .MuiInputBase-input"],
        padding: props.multiline ? "0 !important" : "8.5px 14px",
      },
      ...props.sx 
    }}
  />
);


const QuantityPriceSection = ({ formData, errors, onChange, availableBudget }) => {
  const total = (formData.quantity || 0) * (formData.unit_price || 0);
  const budgetValue = availableBudget || 0;
  const percentage = budgetValue > 0 ? ((total / budgetValue) * 100).toFixed(1) : 0;
  const remainingBudget = budgetValue - total;

  return (
    <Paper elevation={0} sx={{ p: 0, borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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
          }}>3</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "18px" }}>
            Số lượng & Đơn giá
          </Typography>
        </Stack>

        {/* Calculation Box */}
        <Box sx={{ 
          bgcolor: "#F1F5F9", 
          borderRadius: "12px", 
          p: 3, 
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2
        }}>
          {/* Unit Price */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, mb: 1, display: "block", textTransform: "uppercase" }}>
              Đơn giá (VNĐ)
            </Typography>
            <SkyTextField
              fullWidth
              type="number"
              placeholder="0"
              value={formData.unit_price || ""}
              onChange={(e) => onChange("unit_price", Number(e.target.value))}
              sx={{ "& .MuiInputBase-input": { textAlign: "right", fontWeight: "bold", color: "#1E293B", fontSize: "1.1rem" } }}
            />
          </Box>

          <Typography sx={{ color: "#94A3B8", fontWeight: "bold", mt: 3 }}>×</Typography>

          {/* Quantity */}
          <Box sx={{ width: "150px" }}>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, mb: 1, display: "block", textTransform: "uppercase" }}>
              Số lượng
            </Typography>
            <SkyTextField
              fullWidth
              type="number"
              placeholder="0"
              value={formData.quantity || ""}
              onChange={(e) => onChange("quantity", Number(e.target.value))}
              sx={{ "& .MuiInputBase-input": { textAlign: "right", fontWeight: "bold", color: "#1E293B", fontSize: "1.1rem" } }}
            />
          </Box>

          <Typography sx={{ color: "#94A3B8", fontWeight: "bold", mt: 3 }}>=</Typography>

          {/* Total */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "var(--primary-color, #F97316)", fontWeight: 800, mb: 1, display: "block", textTransform: "uppercase" }}>
              Thành tiền
            </Typography>
            <SkyTextField
              fullWidth
              disabled
              value={new Intl.NumberFormat("vi-VN").format(total)}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderColor: "var(--primary-color, #F97316) !important",
                  borderWidth: "2px",
                  bgcolor: "#FFF7ED"
                },
                "& .MuiInputBase-input": { 
                  textAlign: "right", 
                  fontWeight: "900", 
                  color: "var(--primary-color, #F97316)", 
                  fontSize: "1.25rem",
                  WebkitTextFillColor: "var(--primary-color, #F97316) !important"
                } 
              }}
            />
          </Box>
        </Box>

        {/* Budget Alert Box */}
        <Box sx={{ 
          bgcolor: "#FEFCE8", 
          border: "1px solid #FEF08A", 
          borderRadius: "8px", 
          p: 2, 
          mb: 3, 
          display: "flex", 
          alignItems: "flex-start", 
          gap: 1.5 
        }}>
          <Typography variant="body2" sx={{ color: "#713F12", lineHeight: 1.6, display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span>
              Thành tiền <span style={{ fontWeight: "bold" }}>{new Intl.NumberFormat("vi-VN").format(total)} VNĐ</span> sẽ chiếm <span style={{ fontWeight: "bold", color: "#F97316" }}>{percentage}%</span> ngân sách còn khả dụng ({new Intl.NumberFormat("vi-VN").format(budgetValue)} VNĐ). Còn lại <span style={{ fontWeight: "bold" }}>{new Intl.NumberFormat("vi-VN").format(remainingBudget)} VNĐ</span> cho các hạng mục khác.
            </span>
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Delivery Date */}
          <Grid item xs={12} md={6}>
            <SkyFieldLabel styledMarginBottom={0.5}>Thời gian cần nhận hàng</SkyFieldLabel>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
              <DatePicker
                value={formData.delivery_date ? dayjs(formData.delivery_date) : null}
                onChange={(val) => onChange("delivery_date", val ? val.format("YYYY-MM-DD") : "")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "DD/MM/YYYY",
                    error: !!errors.delivery_date,
                    helperText: errors.delivery_date,
                    sx: skyTextFieldSx
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Special Requirements */}
          <Grid item xs={12} md={6}>
            <SkyFieldLabel styledMarginBottom={0.5}>Yêu cầu đặc biệt</SkyFieldLabel>
            <SkyTextField
              select
              fullWidth
              placeholder="Cần đào tạo sử dụng"
              value={formData.special_requirements}
              onChange={(e) => onChange("special_requirements", e.target.value)}
              sx={{ 
                "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                mt: 0 
              }}
            >
              {SPECIAL_REQUIREMENT_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </SkyTextField>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default QuantityPriceSection;
