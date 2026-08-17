import React from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography, 
    Box, 
    Chip,
    IconButton,
    Tooltip
} from "@mui/material";
import { Visibility as ViewIcon } from "@mui/icons-material";
import moment from "moment";

const DisbursementTab = ({ disbursements = [] }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getStatusChip = (status) => {
    const config = {
      'hoan_thanh': { label: 'Đã chi', color: 'success', bgcolor: '#DCFCE7', text: '#166534' },
      'cho_duyet': { label: 'Chờ duyệt', color: 'warning', bgcolor: '#FEF9C3', text: '#854D0E' },
      'dang_xu_ly': { label: 'Đang xử lý', color: 'info', bgcolor: '#DBEAFE', text: '#1E40AF' },
    };
    const s = config[status] || { label: status, color: 'default', bgcolor: '#F1F5F9', text: '#475569' };
    return <Chip label={s.label} size="small" sx={{ bgcolor: s.bgcolor, color: s.text, fontWeight: 700, fontSize: '0.7rem' }} />;
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#64748B" }}>Mã đợt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748B" }}>Nội dung giải ngân</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748B" }}>Đơn vị nhận</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#64748B" }}>Số tiền</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748B" }}>Ngày duyệt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748B" }}>Trạng thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#64748B" }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {disbursements.length > 0 ? (
              disbursements.map((d) => (
                <TableRow key={d.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: "#0055CC" }}>{d.code || `GN-${d.id}`}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: "#1E293B" }}>{d.disbursement_content}</TableCell>
                  <TableCell color="#475569">{d.receiver_name || d.receiving_unit}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1E293B" }}>{formatCurrency(d.amount || 0)}</TableCell>
                  <TableCell color="#64748B">{d.created_at ? moment(d.created_at).format("DD/MM/YYYY") : "—"}</TableCell>
                  <TableCell>{getStatusChip(d.status)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết">
                        <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                  Chưa có dữ liệu giải ngân cho chương trình này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DisbursementTab;
