import React from "react";
import { 
  Grid, 
  Box, 
  Typography, 
  LinearProgress, 
  Paper 
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { 
  AccountBalanceWallet as WalletIcon, 
  CheckCircle as DoneIcon, 
  PendingActions as PendingIcon,
  AttachMoney as MoneyIcon
} from "@mui/icons-material";

const KPIPaper = styled(Paper)(({ theme, bordercolor }) => ({
  padding: theme.spacing(2.5),
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
  borderLeft: `6px solid ${bordercolor || theme.palette.primary.main}`,
  height: "100%",
}));

const IconWrapper = styled(Box)(({ theme, bgcolor, color }) => ({
  width: 48,
  height: 48,
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: bgcolor || theme.palette.primary.light,
  color: color || theme.palette.primary.main,
}));

const DisbursementKPIs = ({ summary = {} }) => {
  const formatValue = (value = 0) => {
    // If value >= 1 Billion, show in "tỷ" format
    if (value >= 1e9) {
      return (value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
    }
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const getUnit = (value = 0) => (value >= 1e9 ? "tỷ VNĐ" : "VNĐ");

  const kpis = [
    {
      label: "TỔNG NGÂN SÁCH",
      amount: summary.total_budget || 0,
      icon: <WalletIcon />,
      color: "#003399",
      bgcolor: "rgba(0, 51, 153, 0.05)",
      info: `${summary.items_count || 0} hạng mục · ${summary.total_disbursements || 0} đợt giải ngân`,
      ratio: 100,
    },
    {
      label: "ĐÃ GIẢI NGÂN",
      amount: summary.disbursed_amount || 0,
      icon: <DoneIcon />,
      color: "#10b981",
      bgcolor: "rgba(16, 185, 129, 0.05)",
      info: `${summary.percentages?.disbursed || 0}% ngân sách · ${summary.disbursed_count || 0} đợt hoàn thành`,
      ratio: summary.percentages?.disbursed || 0,
    },
    {
      label: "CHỜ GIẢI NGÂN",
      amount: summary.pending_amount || 0,
      icon: <PendingIcon />,
      color: "#f59e0b",
      bgcolor: "rgba(245, 158, 11, 0.05)",
      info: `${summary.percentages?.pending || 0}% · ${summary.pending_label || "Chưa có dự kiến"}`,
      ratio: summary.percentages?.pending || 0,
    },
    {
      label: "CÒN LẠI",
      amount: summary.remaining_amount || 0,
      icon: <MoneyIcon />,
      color: "#64748b",
      bgcolor: "rgba(100, 116, 139, 0.05)",
      info: `${summary.percentages?.remaining || 0}% · Dự phòng + phát sinh`,
      ratio: summary.percentages?.remaining || 0,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <KPIPaper bordercolor={kpi.color}>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box sx={{ minHeight: "56px" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.5, fontSize: "11px" }}>
                      {kpi.label}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.5 }}>
                      <Typography variant="h5" fontWeight={700} sx={{ color: "#1e293b", fontSize: { xs: "18px", md: "22px" } }}>
                        {formatValue(kpi.amount)}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: "12px" }}>
                        {getUnit(kpi.amount)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconWrapper bgcolor={kpi.bgcolor} color={kpi.color}>
                    {kpi.icon}
                  </IconWrapper>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2, fontSize: "11px", fontWeight: 500, minHeight: "32px", overflow: "hidden" }}>
                  {kpi.info}
                </Typography>

                <LinearProgress 
                  variant="determinate" 
                  value={kpi.ratio} 
                  sx={{ 
                    height: 5, 
                    borderRadius: 2,
                    bgcolor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                      bgcolor: kpi.color
                    }
                  }} 
                />
              </Box>
            </KPIPaper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DisbursementKPIs;
