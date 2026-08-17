import React from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  CheckCircle, 
  RadioButtonUnchecked, 
  ArrowForwardIos 
} from "@mui/icons-material";

const STATUS_STEPS = [
  { value: "RECEIVED", label: "Tiếp nhận", icon: "📦" },
  { value: "IN_PROCUREMENT", label: "Mua sắm", icon: "🛒" },
  { value: "PURCHASED", label: "Đã mua", icon: "✅" },
  { value: "SHIPPING", label: "Vận chuyển", icon: "🚚" },
  { value: "DELIVERED", label: "Bàn giao", icon: "🎁" }
];

const StatusConfirmationSection = ({ currentStatus, onStatusChange }) => {
  const currentIndex = STATUS_STEPS.findIndex(s => s.value === currentStatus);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "white" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#7c3aed", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          !
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Xác nhận trạng thái xử lý
        </Typography>
      </Stack>

      <Box sx={{ 
        p: 2, bgcolor: "#f8fafc", borderRadius: "12px", 
        border: "1px dashed #cbd5e1"
      }}>
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          justifyContent="space-between"
          sx={{ overflowX: "auto", pb: 1 }}
        >
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const isNext = index === currentIndex + 1;

            return (
              <React.Fragment key={step.value}>
                <Box 
                  onClick={() => onStatusChange(step.value)}
                  sx={{ 
                    flex: 1,
                    minWidth: 120,
                    p: 1.5, 
                    borderRadius: "12px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                    border: "2px solid",
                    borderColor: isCurrent ? "#7c3aed" : isCompleted ? "#10b981" : "#e2e8f0",
                    bgcolor: isCurrent ? "#f5f3ff" : isCompleted ? "#f0fdf4" : "white",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }
                  }}
                >
                  <Typography sx={{ fontSize: "1.25rem", mb: 0.5 }}>{step.icon}</Typography>
                  <Typography sx={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 700, 
                    color: isCurrent ? "#7c3aed" : isCompleted ? "#065f46" : "#64748b" 
                  }}>
                    {step.label}
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
                    {isCompleted ? (
                      <CheckCircle sx={{ fontSize: "1rem", color: "#10b981" }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: "1rem", color: "#cbd5e1" }} />
                    )}
                  </Box>
                </Box>
                
                {index < STATUS_STEPS.length - 1 && (
                  <ArrowForwardIos sx={{ fontSize: "0.75rem", color: "#cbd5e1" }} />
                )}
              </React.Fragment>
            );
          })}
        </Stack>
      </Box>

      <Typography variant="caption" sx={{ mt: 2, display: "block", color: "#64748b", fontStyle: "italic" }}>
        * Nhấn vào ô trạng thái để cập nhật tiến độ hiện tại của hạng mục. Hệ thống sẽ tự động lưu nhật ký thay đổi.
      </Typography>
    </Paper>
  );
};

export default StatusConfirmationSection;
