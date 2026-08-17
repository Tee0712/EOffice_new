import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  IconButton, 
  Button, 
  Stack, 
  Avatar,
  Alert,
  AlertTitle
} from "@mui/material";
import { 
  Add as AddIcon, 
  DeleteOutline as DeleteIcon,
  WarningAmber as WarningIcon
} from "@mui/icons-material";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";

const Step3AmountDetail = ({ data, remainingBudget, onChange, errors = {}, isEditMode = false }) => {
  const amountDetails = data.amount_details || [];
  const detailErrors = errors.amount_details || [];
  const totalAmount = amountDetails.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const isOverBudget = totalAmount > remainingBudget;

  const handleAddRow = () => {
    onChange([...amountDetails, { expense_content: "", amount: 0 }]);
  };

  const handleRemoveRow = (index) => {
    const newList = amountDetails.filter((_, i) => i !== index);
    onChange(newList);
  };

  const handleUpdateRow = (index, field, value) => {
    const newList = amountDetails.map((item, i) => {
      if (i === index) return { ...item, [field]: value };
      return item;
    });
    onChange(newList);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar sx={{ bgcolor: "#3B82F6", width: 26, height: 26, fontSize: "13px", fontWeight: 700 }}>3</Avatar>
        <Typography fontWeight={700} color="#0f172a" sx={{ fontSize: "17px" }}>
          Chi tiết số tiền giải ngân
        </Typography>
      </Stack>

      <Paper id="amount_detail_table" elevation={0} sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        <TableContainer sx={{ mb: 2, borderRadius: "8px", border: "1px solid #f1f5f9" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "12px" }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "12px" }}>NỘI DUNG CHI <span style={{ color: "#ef4444" }}>*</span></TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "12px" }} align="right">SỐ TIỀN (VNĐ) <span style={{ color: "#ef4444" }}>*</span></TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "12px" }} align="center">HÀNH ĐỘNG</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {amountDetails.map((item, index) => {
                const rowError = detailErrors[index] || {};

                return (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <TextField 
                        fullWidth 
                        size="small"
                        placeholder="Nhập nội dung chi tiết..."
                        value={item.expense_content}
                        onChange={(e) => handleUpdateRow(index, "expense_content", e.target.value)}
                        error={!!rowError.expense_content}
                        helperText={rowError.expense_content}
                        sx={{ 
                          "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                          "& .MuiFormHelperText-root": { fontSize: "10px", mx: 0 }
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField 
                        type="number" 
                        size="small"
                        value={item.amount}
                        onChange={(e) => handleUpdateRow(index, "amount", e.target.value)}
                        error={!!rowError.amount}
                        helperText={rowError.amount}
                        sx={{ 
                          width: 180, 
                          "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                          "& .MuiFormHelperText-root": { fontSize: "10px", mx: 0 }
                        }}
                        inputProps={{ style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveRow(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={4} sx={{ borderBottom: "none", pt: 2 }}>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={handleAddRow}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#3B82F6" }}
                  >
                    Thêm dòng mới
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ bgcolor: "#f8fafc", p: 3, borderRadius: "12px", border: "1px solid #e2e8f0" }}>
           <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>TỔNG GIẢI NGÂN ĐỢT NÀY:</Typography>
              <Typography variant="h6" fontWeight={700} color="#1e293b">{totalAmount?.toLocaleString()} VNĐ</Typography>
           </Stack>
           
           {isOverBudget && (
             <Alert 
               severity="warning" 
               icon={<WarningIcon fontSize="inherit" />}
               sx={{ borderRadius: "10px", mt: 2, bgcolor: "#fffbeb", border: "1px solid #fef3c7" }}
             >
               <AlertTitle sx={{ fontWeight: 700 }}>Vượt quá ngân sách!</AlertTitle>
               Sau đợt giải ngân này, ngân sách còn lại của chương trình sẽ là 
               <strong style={{ margin: "0 4px", color: "#b45309" }}>{(remainingBudget - totalAmount)?.toLocaleString()} VNĐ</strong> 
               (Đây là con số âm, vui lòng kiểm tra lại).
             </Alert>
           )}

           {!isOverBudget && totalAmount > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fdf8e6", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                <Typography variant="caption" color="#b45309" fontWeight={700}>
                  Ghi chú: Sau đợt giải ngân này, ngân sách còn lại của chương trình là {(remainingBudget - totalAmount)?.toLocaleString()} VNĐ ({( ((remainingBudget - totalAmount)/remainingBudget)*100 ).toFixed(1)}%).
                </Typography>
              </Box>
           )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Step3AmountDetail;
