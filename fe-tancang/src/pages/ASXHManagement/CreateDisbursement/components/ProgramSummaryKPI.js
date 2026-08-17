import React from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  LinearProgress, 
  Stack,
  Divider
} from "@mui/material";
import { 
  AccountBalanceWallet as BudgetIcon,
  CheckCircle as DisbursedIcon,
  PendingActions as BalanceIcon
} from "@mui/icons-material";

const KPIWidget = ({ title, amount, color, progress, hasBar = false, barColor, showFullValue = false }) => {
  const formatValue = (value = 0) => {
    if (showFullValue || value < 1e9) {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return (value / 1e9).toLocaleString("vi-VN", { 
      minimumFractionDigits: 3,
      maximumFractionDigits: 3 
    });
  };

  const currentUnit = (amount >= 1e9 && !showFullValue) ? "tỷ" : "VNĐ";

  return (
    <Box 
      sx={{ 
        flex: 1, 
        py: 4, 
        px: 2, 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="baseline" mb={0.5}>
        <Typography 
          fontWeight={700} 
          sx={{ 
            color: color || "#1e293b", 
            fontSize: "26px",
            letterSpacing: "-0.5px",
            fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif"
          }}
        >
          {formatValue(amount)}
        </Typography>
        <Typography 
          fontWeight={800} 
          sx={{ color: color || "#1e293b", fontSize: "16px", fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif" }}
        >
          {currentUnit}
        </Typography>
      </Stack>
      
      <Typography 
        variant="caption" 
        fontWeight={700} 
        sx={{ 
          color: "#94a3b8", 
          textTransform: "uppercase", 
          letterSpacing: 0.5,
          fontSize: "11px",
          fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif"
        }}
      >
        {title}
      </Typography>

      {hasBar && (
        <Box sx={{ width: "80%", mt: 1.5 }}>
           <Box 
            sx={{ 
              height: 4, 
              width: "100%", 
              bgcolor: "#f1f5f9", 
              borderRadius: 2,
              overflow: "hidden"
            }} 
          >
            <Box 
              sx={{ 
                height: "100%", 
                width: progress ? `${progress}%` : "30%", 
                bgcolor: barColor || color,
                borderRadius: 2
              }} 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ProgramSummaryKPI = ({ programInfo, summary }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Program Summary Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: "18px 24px", 
          borderRadius: "16px", 
          border: "1px solid #e2e8f0",
          borderLeft: "6px solid #10b981",
          bgcolor: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          mb: 3
        }}
      >
        <Box sx={{ 
          width: 50, 
          height: 48, 
          bgcolor: "#dcfce7", 
          borderRadius: "12px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Typography variant="h5" color="#10b981" fontWeight={700} sx={{ mt: -0.2 }}>$</Typography>
        </Box>

        <Box>
           <Typography variant="caption" color="#10b981" fontWeight={700} sx={{ fontSize: "11px", display: "block", mb: 0.2 }}>
             {programInfo.code || "CT-2026/001"}
           </Typography>
           <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: "19px", mb: 0.2 }}>
             {programInfo.name || "---"}
           </Typography>
           
           <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#64748b" }}>
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: "13px" }}>
                {programInfo.funding_type === 'CASH' ? 'Bằng tiền' : 'Hiện vật'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "13px" }}>·</Typography>
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: "13px" }}>{programInfo.locality}</Typography>
              <Typography variant="caption" sx={{ fontSize: "13px" }}>·</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                 <Box sx={{ width: 6, height: 6, bgcolor: "#10b981", borderRadius: "50%" }} />
                 <Typography variant="caption" color="#10b981" fontWeight={700} sx={{ fontSize: "13px" }}>
                   {programInfo.status === 'dang_trien_khai' ? 'Đang triển khai' : programInfo.status}
                 </Typography>
              </Box>
           </Stack>
        </Box>
      </Paper>

      {/* KPI Stats Widgets */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: "16px", 
          border: "1px solid #e2e8f0",
          bgcolor: "#fff",
          overflow: "hidden"
        }}
      >
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "#CBD5E1", opacity: 0.6, my: 4 }} />}>
          <KPIWidget 
            title="TỔNG NGÂN SÁCH"
            amount={summary.total_budget || 0}
            color="#2563eb"
          />
          <KPIWidget 
            title={`ĐÃ GIẢI NGÂN (${summary.disbursed_count || 0} ĐỢT)`}
            amount={summary.disbursed_amount || 0}
            color="#10b981"
            progress={summary.percentages?.disbursed || 45}
            hasBar={true}
            barColor="#10b981"
          />
          <KPIWidget 
            title="KHẢ DỤNG CÒN LẠI"
            amount={summary.remaining_amount || 0}
            color="#f59e0b"
            progress={summary.percentages?.remaining || 15}
            hasBar={true}
            barColor="#f59e0b"
          />
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProgramSummaryKPI;
