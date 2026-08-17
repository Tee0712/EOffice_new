import React from "react";
import { 
  Grid, 
  Box, 
  Typography, 
  Paper,
  LinearProgress
} from "@mui/material";
import { 
  AccountBalanceWallet as BudgetIcon,
  CheckCircle as DisbursedIcon,
  People as CandidatesIcon,
  School as GrantedIcon,
  Apartment as SchoolsIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StatPaper = styled(Paper)(({ theme, bordercolor }) => ({
  padding: theme.spacing(2.5),
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: `1px solid ${theme.palette.divider}`,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "4px",
    height: "100%",
    backgroundColor: bordercolor || theme.palette.primary.main,
  }
}));

const IconWrapper = styled(Box)(({ theme, bgcolor, iconcolor }) => ({
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: bgcolor || theme.palette.primary.light,
  color: iconcolor || theme.palette.primary.main,
  marginBottom: theme.spacing(1.5),
}));

/**
 * Thống kê tổng quan cho module Giáo dục & Học bổng
 */
const StatsOverview = ({ data = {} }) => {
  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
  };

  const stats = [
    {
      label: "Tổng ngân sách GD",
      value: formatCurrency(data.total_budget),
      subValue: `Tổng định mức các trường`,
      icon: <BudgetIcon />,
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    {
      label: "Đã cấp phát",
      value: formatCurrency(data.disbursed_budget),
      subValue: `${data.total_budget > 0 ? Math.round((data.disbursed_budget / data.total_budget) * 100) : 0}% ngân sách`,
      icon: <DisbursedIcon />,
      color: "#10b981",
      bgColor: "#ecfdf5",
      progress: data.total_budget > 0 ? (data.disbursed_budget / data.total_budget) * 100 : 0
    },
    {
      label: "Hồ sơ ứng viên",
      value: `${data.total_candidates || 0} hồ sơ`,
      subValue: `${data.candidate_status_stats?.find(s => s.status === 'UNDER_REVIEW')?.count || 0} chờ xét duyệt`,
      icon: <CandidatesIcon />,
      color: "#f59e0b",
      bgColor: "#fffbeb"
    },
    {
      label: "Học bổng đã cấp",
      value: `${data.total_approved_candidates || 0} suất`,
      subValue: `Bao gồm đã duyệt & cấp phát`,
      icon: <GrantedIcon />,
      color: "#8b5cf6",
      bgColor: "#f5f3ff"
    },
    {
      label: "Trường hợp tác",
      value: `${data.total_partners || 0} trường`,
      subValue: `${data.total_slots || 0} chỉ tiêu tổng`,
      icon: <SchoolsIcon />,
      color: "#ec4899",
      bgColor: "#fdf2f8"
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <StatPaper bordercolor={stat.color}>
            <Box>
              <IconWrapper bgcolor={stat.bgColor} iconcolor={stat.color}>
                {stat.icon}
              </IconWrapper>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {stat.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ my: 0.5, color: "#1e293b" }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {stat.subValue}
              </Typography>
            </Box>
            {stat.progress !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={stat.progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: stat.color,
                      borderRadius: 3,
                    }
                  }} 
                />
              </Box>
            )}
          </StatPaper>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsOverview;
