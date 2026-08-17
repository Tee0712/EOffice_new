import React from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Divider 
} from "@mui/material";
import dayjs from "dayjs";

/**
 * Thống kê nhanh cuối trang
 * @param {Array} items - Danh sách các đợt giải ngân
 * @param {Number} totalBudget - Tổng ngân sách chương trình
 */
const QuickStats = ({ items = [], totalBudget = 0 }) => {
  const total = items.length;
  
  // Đếm theo doc_type chính xác (BIEN_BAN, UNC)
  const signed = items.filter(i => 
    (i.attachments || []).some(a => (a.docType || a.doc_type) === "BIEN_BAN")
  ).length;
  
  const unc = items.filter(i => 
    (i.attachments || []).some(a => (a.docType || a.doc_type) === "UNC")
  ).length;
  
  // Tổng tiền của tất cả các đợt trong danh sách (dùng amount_total tương ứng với DisbursementTable)
  const totalDisbursedAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount_total) || 0), 0);
    
  // Tính tỷ lệ giải ngân dựa trên tổng ngân sách chương trình (nếu có)
  const percent = totalBudget > 0 
    ? ((totalDisbursedAmount / totalBudget) * 100).toFixed(1) 
    : "0.0";

  // Tìm đợt tiếp theo (gần nhất so với hôm nay)
  const today = dayjs().startOf("day");
  const nextDateVal = items
    .map(i => dayjs(i.expected_transfer_date))
    .filter(d => d.isValid() && (d.isAfter(today) || d.isSame(today)))
    .sort((a, b) => a.valueOf() - b.valueOf())[0];
    
  const nextDate = nextDateVal ? nextDateVal.format("DD/MM/YYYY") : "Chưa xác định";

  const StatItem = ({ label, value, color, suffix }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.2 }}>
      <Typography variant="body2" color="#64748b">{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: color || "#1e293b" }}>
        {value} {suffix && <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "4px" }}>{suffix}</span>}
      </Typography>
    </Box>
  );

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Typography variant="subtitle2" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
        Thống kê nhanh
      </Typography>
      
      <Box sx={{ mt: 1 }}>
        <StatItem label="Tổng đợt giải ngân" value={total} suffix="đợt" />
        <Divider sx={{ opacity: 0.4, my: 0.5 }} />
        <StatItem label="Biên bản đã ký" value={`${signed} / ${total}`} />
        <Divider sx={{ opacity: 0.4, my: 0.5 }} />
        <StatItem label="UNC đã upload" value={`${unc} / ${total}`} />
        <Divider sx={{ opacity: 0.4, my: 0.5 }} />
        <StatItem label="Tỷ lệ giải ngân" value={`${percent}%`} color="#3b82f6" />
        <Divider sx={{ opacity: 0.4, my: 0.5 }} />
        <StatItem label="Đợt tiếp theo" value={nextDate} color="#f59e0b" />
      </Box>
    </Paper>
  );
};

export default QuickStats;
