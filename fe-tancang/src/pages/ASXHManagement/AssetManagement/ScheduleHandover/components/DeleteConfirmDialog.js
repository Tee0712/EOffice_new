import React from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  IconButton,
  Alert
} from "@mui/material";
import { DeleteForever, Close, WarningAmber } from "@mui/icons-material";

const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, message, loading, errorMsg }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { 
          borderRadius: "18px", 
          p: 1, 
          maxWidth: "420px",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
        }
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ 
            width: 44, height: 44, borderRadius: "12px", bgcolor: "#FEF2F2", 
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}>
            <WarningAmber sx={{ color: "#EF4444" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", letterSpacing: "-0.01em" }}>
            {title || "Xác nhận xóa"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8", "&:hover": { bgcolor: "#F1F5F9" } }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 1 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontWeight: 500 }}>
            {errorMsg}
          </Alert>
        )}
        <Typography variant="body1" sx={{ color: "#64748B", lineHeight: 1.6, fontSize: "0.9375rem" }}>
          {message || "Dữ liệu lịch bàn giao này sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục hành động này không?"}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
        <Button 
          fullWidth
          variant="outlined" 
          onClick={onClose}
          sx={{ 
            borderRadius: "10px", 
            fontWeight: 700, 
            textTransform: "none",
            borderColor: "#E2E8F0", 
            color: "#64748B", 
            py: 1.25,
            fontSize: "0.875rem",
            "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" }
          }}
        >
          Hủy bỏ
        </Button>
        <Button 
          fullWidth
          variant="contained" 
          disableElevation
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? null : <DeleteForever />}
          sx={{ 
            borderRadius: "10px", 
            fontWeight: 700, 
            textTransform: "none",
            bgcolor: "#EF4444", 
            py: 1.25,
            fontSize: "0.875rem",
            boxShadow: "0 4px 6px -1px rgb(239 68 68 / 0.2)",
            "&:hover": { bgcolor: "#DC2626", boxShadow: "0 10px 15px -3px rgb(239 68 68 / 0.3)" }
          }}
        >
          {loading ? "Đang xử lý..." : "Xác nhận xóa"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
