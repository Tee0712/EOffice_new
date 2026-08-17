import React from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Grid, 
  Divider, 
  Chip,
  Stack,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { 
  Close as CloseIcon,
  Business as ReceiverIcon,
  AccountBalance as BankIcon,
  Description as DocIcon,
  Schedule as TimeIcon,
  AttachFile as AttachCountIcon
} from "@mui/icons-material";
import dayjs from "dayjs";

const STATUS_MAP = {
  DRAFT: { label: "Nháp", color: "#64748b", bgcolor: "#f1f5f9" },
  NHAP: { label: "Nháp", color: "#64748b", bgcolor: "#f1f5f9" },
  PENDING_APPROVAL: { label: "Chờ duyệt", color: "#d97706", bgcolor: "#fff7ed" },
  CHO_DUYET: { label: "Chờ duyệt", color: "#d97706", bgcolor: "#fff7ed" },
  APPROVED: { label: "Đã chuyển tiền", color: "#2563eb", bgcolor: "#dbeafe" },
  COMPLETED: { label: "Hoàn thành", color: "#059669", bgcolor: "#ecfdf5" },
  SUCCESSFUL: { label: "Thành công", color: "#059669", bgcolor: "#ecfdf5" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bgcolor: "#fef2f2" },
};

const DisbursementDetailDialog = ({ open, onClose, data }) => {
  if (!data) return null;

  const disbursement = data.disbursement || {};
  const statusInfo = STATUS_MAP[disbursement.status?.toUpperCase()] || { label: disbursement.status, color: "#64748b", bgcolor: "#f1f5f9" };
  const items = data.details || [];
  const attachments = data.attachments || [];

  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: "20px", boxShadow: "0px 10px 40px rgba(0,0,0,0.12)" }
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ 
            bgcolor: "#EFF6FF", color: "#3B82F6", 
            p: 1.2, borderRadius: "12px", display: "flex" 
          }}>
            <DocIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#1E293B">
              Chi tiết đợt giải ngân
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Mã đợt: <span style={{ color: "#3B82F6" }}>{disbursement.code || "---"}</span>
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip 
            label={statusInfo.label} 
            sx={{ 
              fontWeight: 700, bgcolor: statusInfo.bgcolor, color: statusInfo.color,
              height: 28, borderRadius: "8px", border: `1px solid ${statusInfo.color}20` 
            }} 
          />
          <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Grid container spacing={3}>
          {/* General Information */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #E2E8F0", height: "100%" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#475569" mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DocIcon sx={{ fontSize: 18 }} /> Thông tin chung
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>NỘI DUNG GIẢI NGÂN</Typography>
                  <Typography variant="body2" fontWeight={700} color="#1E293B">{disbursement.disbursement_content}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>MÔ TẢ CHI TIẾT</Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>{disbursement.detailed_description || "Không có mô tả"}</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>NGÀY DỰ KIẾN</Typography>
                    <Typography variant="body2" fontWeight={700} color="#1E293B" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TimeIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                      {disbursement.expected_transfer_date ? dayjs(disbursement.expected_transfer_date).format("DD/MM/YYYY") : "---"}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>

          {/* Receiver Information */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC", height: "100%" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#475569" mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ReceiverIcon sx={{ fontSize: 18 }} /> Đơn vị nhận tiền
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>TÊN ĐƠN VỊ</Typography>
                  <Typography variant="body2" fontWeight={800} color="#1E293B">{disbursement.receiving_unit || disbursement.receiver?.name || "---"}</Typography>
                </Box>

                <Box sx={{ p: 1.5, bgcolor: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <BankIcon sx={{ fontSize: 12 }} /> THÔNG TIN TÀI KHOẢN
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="#3B82F6" sx={{ mt: 0.5 }}>
                    {disbursement.receiver?.bank_account_number || disbursement.bank_account_number || "---"}
                  </Typography>
                  <Typography variant="caption" color="#1E293B" fontWeight={700} display="block">
                    {disbursement.receiver?.bank_account_holder || disbursement.bank_account_holder || "---"}
                  </Typography>
                  <Typography variant="caption" color="#64748B" fontWeight={600} display="block">
                    {disbursement.receiver?.bank_name || disbursement.bank_name || "---"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Detailed Items Table */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={800} color="#475569" mb={1.5} pl={1}>
              Danh mục chi phí ({items.length})
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Nội dung chi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền (VNĐ)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{item.expense_content}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#1E293B" }}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "#F1F5F9" }}>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Tổng cộng</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "15px" }}>
                      {formatCurrency(items.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Attachments Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={800} color="#475569" mb={1.5} pl={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AttachCountIcon sx={{ fontSize: 18 }} /> Tài liệu đính kèm ({attachments.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {attachments.map((file, idx) => (
                <Chip
                  key={idx}
                  label={file.title || file.name}
                  icon={<DocIcon sx={{ fontSize: "14px !important" }} />}
                  variant="outlined"
                  sx={{ 
                    borderRadius: "10px", fontWeight: 600, py: 2, px: 0.5,
                    borderColor: "#E2E8F0", "&:hover": { bgcolor: "#F1F5F9" } 
                  }}
                />
              ))}
              {attachments.length === 0 && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic" pl={1}>
                  Chưa có tài liệu đính kèm
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          fullWidth
          variant="contained" 
          onClick={onClose}
          sx={{ 
            bgcolor: "#1E293B", textTransform: "none", fontWeight: 700, py: 1.2, borderRadius: "12px",
            "&:hover": { bgcolor: "#0F172A" }
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DisbursementDetailDialog;
