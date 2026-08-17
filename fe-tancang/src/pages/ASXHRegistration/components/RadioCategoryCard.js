import React from "react";
import { Box, Typography, Paper, Radio } from "@mui/material";

const RadioCategoryCard = ({ id, icon, title, subtitle, selected, onClick, sx = {} }) => {
  // Define colors based on category ID
  const getColorScheme = () => {
    switch (id) {
      case "Bang_tien":
        return { icon: "#10B981", bg: "#ECFDF5" };
      case "Hien_vat":
        return { icon: "#F97316", bg: "#FFF7ED" };
      case "Giao_duc":
        return { icon: "#8B5CF6", bg: "#F5F3FF" };
      default:
        return { icon: "#64748B", bg: "#F1F5F9" };
    }
  };

  const scheme = getColorScheme();

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: "14px 18px",
        cursor: "pointer",
        borderRadius: "14px",
        border: "1.5px solid",
        borderColor: selected ? "#2563EB" : "#E2E8F0",
        backgroundColor: selected ? "#EFF6FF" : "#ffffff",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        position: "relative",
        "&:hover": {
          borderColor: "#2563EB",
          backgroundColor: selected ? "#EFF6FF" : "#F8FAFC",
        },
        ...sx
      }}
    >
      <Radio
        checked={selected}
        onChange={onClick}
        sx={{
          p: 0,
          color: "#CBD5E1",
          "&.Mui-checked": {
            color: "#2563EB",
          },
        }}
      />
      
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "10px",
          backgroundColor: scheme.bg,
          color: scheme.icon,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            fontSize: "22px"
          }
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.2, mb: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 400 }}>
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
};

export default RadioCategoryCard;
