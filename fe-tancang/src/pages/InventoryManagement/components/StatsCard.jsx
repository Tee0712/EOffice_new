import React from "react";
import { Grid, Card, Typography, Box, Avatar, Stack } from "@mui/material";
import {
  Inventory2Outlined as TotalIcon,
  CheckCircleOutline as EnoughIcon,
  WarningAmberOutlined as LowIcon,
  ErrorOutline as OutIcon
} from "@mui/icons-material";

const STATS_CONFIG = [
  {
    key: "totalItems",
    label: "Tổng mặt hàng",
    icon: <TotalIcon />,
    avatarBg: "#e8effe", // xanh nhat
    iconColor: "#255df2" // xanh dam
  },
  {
    key: "enoughStock",
    label: "Còn đủ hàng",
    icon: <EnoughIcon />,
    avatarBg: "#e6f8f1", // xanh la nhat
    iconColor: "#16a34a" // xanh la dam
  },
  {
    key: "lowStock",
    label: "Sắp hết tồn",
    icon: <LowIcon />,
    avatarBg: "#fef3c7", // vang nhat
    iconColor: "#d97706" // vang dam
  },
  {
    key: "outOfStock",
    label: "Đã hết hàng",
    icon: <OutIcon />,
    avatarBg: "#FEE2E2", // do nhat
    iconColor: "#DC2626" // do dam
  }
];

const StatsCard = ({ stats }) => {
  return (
    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
      {STATS_CONFIG.map((config) => (
        <Grid item xs={12} sm={6} md={3} key={config.key}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3.5, 
              border: "1px solid", 
              borderColor: "grey.100", 
              p: 2,
              bgcolor: "background.paper",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                borderColor: "primary.light"
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar 
                variant="rounded" 
                sx={{ 
                  bgcolor: config.avatarBg, 
                  color: config.iconColor, 
                  width: 52, 
                  height: 52, 
                  borderRadius: 2.5,
                  boxShadow: `0 4px 12px ${alpha(config.iconColor, 0.15)}`
                }}
              >
                {React.cloneElement(config.icon, { sx: { fontSize: 28 } })}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="850" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                  {new Intl.NumberFormat('vi-VN').format(stats[config.key] || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ mt: 0.2, fontSize: 13, opacity: 0.8 }}>
                  {config.label}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Cần import alpha từ MUI
import { alpha } from "@mui/material";

export default StatsCard;
