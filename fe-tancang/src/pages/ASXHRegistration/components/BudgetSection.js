import React from "react";
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, IconButton, Grid
} from "@mui/material";
import { Add, RemoveCircleOutline } from "@mui/icons-material";

/**
 * Helper component for Form Fields with Labels Above
 */
const FormField = ({ label, required, children, sx = {} }) => (
  <Box sx={{ mb: 1, ...sx }}>
    <Typography 
      variant="body2" 
      sx={{ 
        fontWeight: 600, 
        color: "#344054", 
        mb: 1, 
        display: "flex", 
        alignItems: "center",
        fontSize: "0.875rem"
      }}
    >
      {label} {required && <Box component="span" sx={{ color: "#F04438", ml: 0.5 }}>*</Box>}
    </Typography>
    {children}
  </Box>
);

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.95rem",
    minHeight: "44px",
    "& fieldset": {
      borderColor: "#D0D5DD",
    },
    "&:hover fieldset": {
      borderColor: "#2563EB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#98A2B3",
    opacity: 1,
  },
};

const BudgetSection = ({ items = [], proposed_budget, funding_source, onChange }) => {
  const handleAddItem = () => {
    const newItems = [...items, { name: "", unit_price: 0, quantity: 1 }];
    onChange("items", newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange("items", newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
    onChange("proposed_budget", newTotal);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange("items", newItems);

    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
    onChange("proposed_budget", newTotal);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <Box>
      {/* Header Fields: Total Budget & Funding Source */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormField label="Tổng ngân sách phê duyệt" required>
            <TextField
              fullWidth
              placeholder="VD: 3,200,000,000"
              value={proposed_budget ? formatNumber(proposed_budget) : ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val === "" || !isNaN(val)) onChange("proposed_budget", val === "" ? 0 : Number(val));
              }}
              InputProps={{
                endAdornment: <Typography variant="body2" sx={{ color: "#94A3B8", ml: 1, fontWeight: 600 }}>VNĐ</Typography>
              }}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormField label="Nguồn kinh phí">
            <TextField
              fullWidth
              placeholder="VD: Ngân sách ASXH – TCSG"
              value={funding_source || ""}
              onChange={(e) => onChange("funding_source", e.target.value)}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Itemized Table */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054", mb: 1.5 }}>
          Chi tiết hạng mục chi
        </Typography>

        <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569", width: "50px", fontSize: "0.75rem", py: 1.5 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>HẠNG MỤC</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem", width: "20%" }}>ĐƠN GIÁ (VNĐ)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem", width: "15%" }}>SỐ LƯỢNG</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem", width: "20%" }}>THÀNH TIỀN</TableCell>
                <TableCell sx={{ width: "40px" }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell sx={{ color: "#64748B", fontSize: "0.875rem" }}>{index + 1}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="VD: Khảo sát & thiết kế"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      sx={inputStyles}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="480,000,000"
                      value={item.unit_price ? formatNumber(item.unit_price) : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val === "" || !isNaN(val)) handleItemChange(index, "unit_price", val === "" ? 0 : Number(val));
                      }}
                      sx={inputStyles}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      sx={inputStyles}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: "#2563EB", fontSize: "0.95rem" }}>
                      {formatNumber(Number(item.unit_price) * Number(item.quantity))}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: "#94A3B8" }}>
                      <RemoveCircleOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#94A3B8", fontSize: "0.875rem" }}>
                    Chưa có hạng mục nào. Nhấn "Thêm hạng mục" để bắt đầu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          startIcon={<Add />}
          onClick={handleAddItem}
          sx={{ 
            color: "#64748B", 
            textTransform: "none", 
            fontWeight: 600, 
            fontSize: "0.875rem",
            "&:hover": { backgroundColor: "transparent", color: "#2563EB" } 
          }}
        >
          Thêm hạng mục
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500 }}>Tổng cộng:</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#2563EB" }}>
            {formatNumber(proposed_budget || 0)} <Box component="span" sx={{ fontSize: "1rem" }}>VNĐ</Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default BudgetSection;
