import React from "react";
import { Paper, Typography, Box, LinearProgress, Stack } from "@mui/material";
import { 
    AccountBalanceWallet as BudgetIcon, 
    CheckCircle as CompletedIcon,
    Group as PeopleIcon,
    HourglassEmpty as RemainingIcon,
    AssignmentTurnedIn as ItemsIcon
} from "@mui/icons-material";

const KPICard = ({ title, value, type, color, last }) => {
  const formatValue = (val) => {
    if (type === "currency") {
       // Format to "2.4 tỷ" style
       const num = Number(val);
       if (num >= 1000000000) return (num / 1000000000).toFixed(1) + " tỷ";
       if (num >= 1000000) return (num / 1000000).toFixed(1) + " triệu";
       return num.toLocaleString();
    }
    return val;
  };

  return (
    <Box sx={{ 
      flex: 1, 
      py: 3, 
      px: 2, 
      textAlign: "center", 
      borderRight: last ? "none" : "1px solid #E2E8F0",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: color || "#1E293B", mb: 0.5, letterSpacing: "-0.02em" }}>
        {formatValue(value)}
      </Typography>
      <Typography variant="caption" fontWeight={700} color="#94A3B8" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>
        {title}
      </Typography>
    </Box>
  );
};

export default KPICard;
