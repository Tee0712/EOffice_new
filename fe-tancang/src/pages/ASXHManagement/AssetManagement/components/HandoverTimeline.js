import React from "react";
import PropTypes from "prop-types";
import { 
  Box, 
  Typography, 
  Stack, 
  Paper
} from "@mui/material";
import { 
  Add as AddIcon,
  Event as EventIcon,
  Check as CheckIcon
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { SkySubmitButton } from "@styles/SkyStyles";

const HandoverTimeline = ({ batches, onRefresh }) => {
  const navigate = useNavigate();
  const { programId } = useParams();
  
  const items = batches || [];

  const getStatusDisplay = (item) => {
    // 1. Logic check status based on assets (Fallback)
    const assets = item.assets || [];
    const hasUnbought = assets.some(a => ["RECEIVED", "IN_PROCUREMENT"].includes(a.status));
    const hasInTransit = assets.some(a => ["SHIPPING"].includes(a.status));
    
    // 2. Main Status Mapping
    if (item.status === "COMPLETED" || item.status === "DELIVERED") {
      return { 
        label: "Hoàn thành", 
        bg: "#ecfdf5", 
        text: "#10b981", 
        icon: <CheckIcon sx={{ color: "#10b981" }} />,
        iconBg: "#ecfdf5",
        isFaded: true 
      };
    }

    if (item.status === "WAITING_PURCHASE" || (item.status === "SCHEDULED" && hasUnbought)) {
      return { 
        label: "Chờ mua xong", 
        bg: "#f8fafc", 
        text: "#475569", 
        icon: <EventIcon sx={{ color: "#94a3b8" }} />,
        iconBg: "#f1f5f9",
        isFaded: false 
      };
    }

    if (item.status === "WAITING_HANDOVER" || (item.status === "SCHEDULED" && hasInTransit)) {
      return { 
        label: "Chờ bàn giao", 
        bg: "#fff7ed", 
        text: "#ea580c", 
        icon: <EventIcon sx={{ color: "#f97316" }} />,
        iconBg: "#fff7ed",
        isFaded: false 
      };
    }

    if (item.status === "SCHEDULED") {
      return { 
        label: "Đã lên lịch", 
        bg: "#eff6ff", 
        text: "#3b82f6", 
        icon: <EventIcon sx={{ color: "#3b82f6" }} />,
        iconBg: "#eff6ff",
        isFaded: false 
      };
    }

    if (item.status === "DRAFT") {
      return { 
        label: "Bản nháp", 
        bg: "#f1f5f9", 
        text: "#94a3b8", 
        icon: <EventIcon sx={{ color: "#cbd5e1" }} />,
        iconBg: "#f8fafc",
        isFaded: true 
      };
    }

    return { 
      label: item.status || "Chờ bàn giao", 
      bg: "#f8fafc", 
      text: "#94a3b8", 
      icon: <CheckIcon sx={{ color: "#cbd5e1" }} />,
      iconBg: "#f8fafc",
      isFaded: false 
    };
  };

  const getAssetSummary = (item) => {
    const assets = item.assets || [];
    if (assets.length === 0) return "";
    return assets.map(a => `${a.quantity} ${a.name}`).join(" + ");
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "white" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box component="span" sx={{ display: "flex", color: "#1e293b" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </Box>
          Lịch bàn giao tại địa phương
        </Typography>
        <SkySubmitButton 
          variant="contained" 
          startIcon={<AddIcon />} 
          size="small"
          sx={{ borderRadius: "8px", px: 2, py: 1, textTransform: "none", fontWeight: 700 }}
          onClick={() => navigate(`/asxh/programs/${programId}/assets/schedule-handover`)}
        >
          Lên lịch
        </SkySubmitButton>
      </Box>

      <Stack spacing={2}>
        {items.length > 0 ? items.map((item) => {
          const status = getStatusDisplay(item);
          const assetSummary = getAssetSummary(item);
          
          return (
            <Box 
              key={item.id} 
              onClick={() => navigate(`/asxh/programs/${programId}/assets/schedule-handover/${item.id}`)}
              sx={{ 
                p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", gap: 2.5,
                transition: "all 0.2s",
                cursor: "pointer",
                opacity: status.isFaded ? 0.5 : 1,
                "&:hover": {
                  borderColor: "#3b82f6",
                  bgcolor: "#f8fafc",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }
              }}
            >
              <Box sx={{ 
                width: 48, height: 48, borderRadius: "12px", 
                bgcolor: status.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {status.icon}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 0.5, lineHeight: 1.2 }}>
                  {item.eventName || item.event_name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, mb: 0.2 }}>
                  {item.location || item.locality || "Đang cập nhật địa điểm"} · Dự kiến {item.handoverDate || item.handover_date}
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                   {assetSummary}{assetSummary && item.notes ? " · " : ""}{item.notes || item.desc || item.description}
                </Typography>
              </Box>

              <Box sx={{ 
                px: 1.5, py: 0.75, borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800,
                bgcolor: status.bg, color: status.text,
                flexShrink: 0,
                whiteSpace: "nowrap"
              }}>
                {status.label}
              </Box>
            </Box>
          );
        }) : (
          <Box sx={{ py: 4, textAlign: "center", color: "#94a3b8", border: "1px dashed #e2e8f0", borderRadius: "12px" }}>
             Chưa có lịch bàn giao
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

HandoverTimeline.propTypes = {
  batches: PropTypes.array,
  onRefresh: PropTypes.func
};

export default HandoverTimeline;
