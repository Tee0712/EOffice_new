import React from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider
} from "@mui/material";
import { 
  CheckCircle as SuccessIcon,
  Schedule as PendingIcon,
  Circle as DotIcon,
  History as HistoryIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";

const HistoryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "16px",
  boxShadow: "none",
  border: "none",
  bgcolor: "transparent"
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  display: "flex",
  paddingBottom: theme.spacing(4),
  position: "relative",
  "&:last-child": {
    paddingBottom: 0
  },
  "&:not(:last-child)::before": {
    content: '""',
    position: "absolute",
    left: "10px",
    top: "24px",
    bottom: 0,
    width: "2px",
    backgroundColor: "#e2e8f0",
    zIndex: 0
  }
}));

const StatusIconWrapper = styled(Box)(({ status }) => {
  const cfg = getStatusConfig(status);
  
  return {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    border: `2px solid ${cfg.dotColor}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    marginRight: "16px",
    marginTop: "2px",
    "& svg": {
      fontSize: "14px",
      color: cfg.dotColor
    }
  };
});

const getStatusConfig = (status = "") => {
  const s = status.toUpperCase();
  
  if (s === "COMPLETED" || s === "SUCCESSFUL") {
    return { color: "#10b981", label: "Hoàn thành", bgcolor: "#f0fdf4", dotColor: "#10b981" };
  }
  if (s === "APPROVED" || s === "TRANSFERRED") {
    return { color: "#3b82f6", label: "Đã chuyển tiền", bgcolor: "#eff6ff", dotColor: "#3b82f6" };
  }
  if (s === "PENDING_APPROVAL" || s === "PENDING") {
    return { color: "#f59e0b", label: "Chờ duyệt", bgcolor: "#fffbeb", dotColor: "#f59e0b" };
  }
  if (s === "REJECTED") {
    return { color: "#ef4444", label: "Từ chối", bgcolor: "#fef2f2", dotColor: "#ef4444" };
  }
  if (s === "DRAFT") {
    return { color: "#64748b", label: "Nháp", bgcolor: "#f8fafc", dotColor: "#94a3b8" };
  }
  
  return { color: "#94a3b8", label: "Dự kiến", bgcolor: "#f8fafc", dotColor: "#cbd5e1" };
};

/**
 * Component hiển thị Timeline lịch sử các đợt giải ngân của chương trình
 * @param {Array} items - Danh sách các đợt giải ngân
 */
const DisbursementHistory = ({ items = [] }) => {
  return (
    <HistoryPaper elevation={0}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <HistoryIcon sx={{ mr: 1, color: "#1e293b", fontSize: "20px" }} />
        <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
          Lịch sử giải ngân
        </Typography>
      </Box>

      {items.length > 0 ? (
        <Box sx={{ px: 1 }}>
          {items.map((item, index) => {
            const cfg = getStatusConfig(item.status);
            return (
              <TimelineItem key={item.id}>
                <StatusIconWrapper status={item.status}>
                  {item.status?.toUpperCase() === "COMPLETED" || item.status?.toUpperCase() === "SUCCESSFUL" 
                    ? <SuccessIcon /> 
                    : <DotIcon />
                  }
                </StatusIconWrapper>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#1e293b">
                        {item.disbursement_content || `Đợt ${index + 1}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {item.receiving_unit || "Chưa xác định"} · {item.expected_transfer_date ? (
                          item.expected_transfer_date.includes("Dự kiến") 
                            ? `Dự kiến ${dayjs(item.expected_transfer_date.replace("Dự kiến", "").trim()).format("DD/MM/YYYY")}`
                            : dayjs(item.expected_transfer_date).format("DD/MM/YYYY")
                        ) : "---"} 
                        {item.attachments?.some(a => a.title?.toLowerCase().includes("biên bản")) && " · Biên bản đã ký"}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      fontWeight={800} 
                      sx={{ color: cfg.color }}
                    >
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.amount_total || 0)}
                    </Typography>
                  </Box>
                </Box>
              </TimelineItem>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <DotIcon sx={{ color: "#cbd5e1", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Chưa có đợt giải ngân nào được ghi nhận
          </Typography>
        </Box>
      )}
    </HistoryPaper>
  );
};

export default DisbursementHistory;
