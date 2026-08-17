import React from "react";
import { Grid, Box, Typography, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ListAlt as AllIcon,
  AssignmentOutlined as PlanningIcon,
  PlayCircleOutline as InProgressIcon,
  MonetizationOnOutlined as DisbursingIcon,
  CheckCircleOutline as CompletedIcon,
} from "@mui/icons-material";

const StatCard = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1.5),
  boxShadow: "none",
  border: "1px solid",
  borderColor: "#e2e8f0",
  transition: "transform 0.2s, boxShadow 0.2s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
}));

const IconWrapper = styled(Box)(({ theme, bgcolor, color }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: theme.spacing(1.5),
  backgroundColor: bgcolor || "#f1f5f9",
  color: color || "#475569",
  marginRight: theme.spacing(2),
  "& svg": { fontSize: "22px" }
}));

/**
 * Component hiển thị các thẻ thống kê nhanh cho chương trình ASXH
 */
const StatsOverview = ({ summary = {} }) => {
  const stats = [
    {
      label: "Tổng chương trình",
      value: summary.total_programs || summary.total || 0,
      icon: <AllIcon />,
      bgcolor: "#e8effe",
      color: "#2563eb",
    },
    {
      label: "Đang lập kế hoạch",
      value: summary.lap_ke_hoach || summary.planning || 0,
      icon: <PlanningIcon />,
      bgcolor: "#f1f5f9",
      color: "#64748b",
    },
    {
      label: "Đang triển khai",
      value: summary.dang_trien_khai || summary.in_progress || 0,
      icon: <InProgressIcon />,
      bgcolor: "#e6f8f1",
      color: "#16a34a",
    },
    {
      label: "Đang giải ngân",
      value: summary.dang_giai_ngan || summary.disbursing || 0,
      icon: <DisbursingIcon />,
      bgcolor: "#fef3c7",
      color: "#d97706",
    },
    {
      label: "Hoàn thành",
      value: summary.hoan_thanh || summary.completed || 0,
      icon: <CompletedIcon />,
      bgcolor: "#f3e8ff",
      color: "#9333ea",
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <StatCard elevation={0}>
            <IconWrapper bgcolor={stat.bgcolor} color={stat.color}>
              {stat.icon}
            </IconWrapper>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.25rem", lineHeight: 1.2 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
                {stat.label}
              </Typography>
            </Box>
          </StatCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsOverview;
