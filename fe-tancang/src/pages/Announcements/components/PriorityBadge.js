import React from "react";
import { Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const PriorityBadge = ({ priority, size = "small" }) => {
  const theme = useTheme();
  const normalized = String(priority || "normal").toLowerCase();

  const configByPriority = {
    urgent: {
      label: "Khẩn cấp",
      textColor: theme.palette.error.dark,
      bgColor: theme.palette.error.light,
    },
    high: {
      label: "Cao",
      textColor: theme.palette.warning.dark,
      bgColor: theme.palette.warning.light,
    },
    normal: {
      label: "Bình thường",
      textColor: theme.palette.info.dark,
      bgColor: theme.palette.info.light,
    },
    low: {
      label: "Thấp",
      textColor: theme.palette.grey[700],
      bgColor: theme.palette.grey[200],
    },
  };

  const valueMap = {
    "khẩn cấp": "urgent",
    cao: "high",
    "bình thường": "normal",
    thấp: "low",
  };

  const key = valueMap[normalized] || normalized;
  const config = configByPriority[key] || configByPriority.normal;

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        fontWeight: 700,
        color: config.textColor,
        backgroundColor: config.bgColor,
        borderRadius: "6px",
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
};

export default PriorityBadge;
