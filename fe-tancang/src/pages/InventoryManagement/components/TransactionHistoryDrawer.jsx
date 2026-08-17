import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  alpha
} from "@mui/material";
import { 
  Close as CloseIcon, 
  Inventory as PackageIcon, 
  History as HistoryIcon 
} from "@mui/icons-material";
import { fetchInventoryDetail } from "../../../services/inventoryService";
import moment from "moment";

const TransactionHistoryDrawer = ({ open, onClose, productId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      loadHistory();
    } else {
      setDetail(null);
    }
  }, [open, productId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchInventoryDetail(productId, { page: 1, size: 50 });
      if (res?.success) {
        setDetail(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDotColor = (type) => {
    if (type === "RECEIPT") return "#10b981"; // Green
    if (type === "ISSUE" || type === "ISSUE_REQUEST") return "#ef4444"; // Red
    return "#f59e0b"; // Orange (Adjust/Others)
  };

  const getTransactionTypeLabel = (type) => {
    if (type === "RECEIPT") return "Nhập kho";
    if (type === "ISSUE" || type === "ISSUE_REQUEST") return "Xuất kho";
    return "Điều chỉnh";
  };


  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose} 
      sx={{ zIndex: 1300 }}
      PaperProps={{ 
        sx: { 
          width: { xs: "100%", sm: 540 }, 
          borderRadius: { xs: 0, sm: "20px 0 0 20px" },
          boxShadow: "-12px 0 35px rgba(0,0,0,0.12)",
          border: 'none',
          overflow: 'hidden'
        } 
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
        <Typography variant="h6" fontWeight="800" color="#1e293b">Chi tiết tồn kho</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <CircularProgress size={36} thickness={5} />
          <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>Đang tải thông tin...</Typography>
        </Box>
      ) : detail ? (
        <Box sx={{ p: 3, overflowY: "auto", height: 'calc(100vh - 80px)' }}>
          
          {/* Product Info Card */}
          <Box sx={{ 
            p: 2.5, 
            mb: 3, 
            bgcolor: '#f8fafc', 
            borderRadius: 4, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            border: '1px solid #f1f5f9'
          }}>
            <Box sx={{ 
              width: 56, 
              height: 56, 
              bgcolor: '#fff', 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              <PackageIcon sx={{ color: '#64748b', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', lineHeight: 1.2 }}>{detail.productName}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.5 }}>
                {detail.productCode} · {detail.category || "Chưa phân loại"} · {detail.unit}
              </Typography>
            </Box>
          </Box>

          {/* Stats Grid */}
          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            <Box sx={{ flex: 1, p: 2, bgcolor: alpha('#10b981', 0.08), borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: alpha('#10b981', 0.1) }}>
              <Typography variant="h5" fontWeight="900" color="#059669">{detail.quantity}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Tồn hiện tại</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, bgcolor: '#fff', borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <Typography variant="h5" fontWeight="800" color="#1e293b">{detail.minStock}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Tồn tối thiểu</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, bgcolor: '#fff', borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <Typography variant="h5" fontWeight="800" color="#1e293b">500</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Tồn tối đa</Typography>
            </Box>
          </Stack>



          {/* History List */}
          <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#1e293b', mb: 3, letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
            LỊCH SỬ NHẬP - XUẤT GẦN ĐÂY
          </Typography>

          <List sx={{ pt: 0 }}>
            {detail.transactions && detail.transactions.length > 0 ? (
              detail.transactions.map((tx, index) => (
                <ListItem 
                  key={tx.id} 
                  disablePadding 
                  sx={{ 
                    alignItems: 'flex-start', 
                    mb: 3, 
                    position: 'relative',
                    '&:not(:last-child):after': {
                      content: '""',
                      position: 'absolute',
                      left: 7,
                      top: 24,
                      bottom: -24,
                      width: 2,
                      bgcolor: '#f1f5f9',
                      zIndex: 1
                    }
                  }}
                >
                  {/* Dot */}
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%', 
                    bgcolor: getTransactionDotColor(tx.transactionType), 
                    mt: 1, 
                    mr: 2.5,
                    border: '3px solid #fff',
                    boxShadow: '0 0 0 1px #f1f5f9',
                    zIndex: 2
                  }} />
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>
                          {getTransactionTypeLabel(tx.transactionType)} – <Box component="span" sx={{ fontWeight: 600, color: '#64748b' }}>{tx.department_name || tx.supplier || "Nội bộ"}</Box>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mt: 0.5 }}>
                          {moment(tx.transactionDate).format("DD/MM/YYYY")} · {tx.transactionCode}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 900, 
                        color: tx.transactionType === "RECEIPT" ? "#10b981" : tx.transactionType === "ISSUE" ? "#ef4444" : "#f59e0b"
                      }}>
                        {tx.transactionType === "RECEIPT" ? "+" : tx.transactionType === "ISSUE" ? "-" : ""}{Number(tx.quantity).toLocaleString()} <Box component="span" sx={{ fontSize: 11 }}>{detail.unit}</Box>
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                <PackageIcon sx={{ fontSize: 48, mb: 1.5, color: '#cbd5e1' }} />
                <Typography variant="body2" fontWeight="600" color="text.secondary">Chưa có lịch sử giao dịch</Typography>
              </Box>
            )}
          </List>
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Không tìm thấy dữ liệu.</Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default TransactionHistoryDrawer;
