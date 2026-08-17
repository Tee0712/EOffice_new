import React from "react";
import { Box, Chip } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import NightlightIcon from "@mui/icons-material/Nightlight";

const ORDERED_SESSION_IDS = [1, 2, 3];

export const SESSION_COLORS = {
  1: {
    bg: "#FEF9C3",
    color: "#854D0E",
    label: "Ăn sáng",
    icon: <WbSunnyIcon sx={{ fontSize: 14 }} />,
  },
  2: {
    bg: "#DCFCE7",
    color: "#166534",
    label: "Ăn trưa",
    icon: <LunchDiningIcon sx={{ fontSize: 14 }} />,
  },
  3: {
    bg: "#EDE9FE",
    color: "#4C1D95",
    label: "Ăn tối",
    icon: <NightlightIcon sx={{ fontSize: 14 }} />,
  },
};

export const SessionChip = ({ sessionId, size = "small" }) => {
  const cfg = SESSION_COLORS[sessionId] || SESSION_COLORS[2];
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size={size}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        "& .MuiChip-icon": { color: cfg.color, ml: 0.5 },
      }}
    />
  );
};

const normalizeOrderedSessionIds = (sessionIds = []) => {
  const unique = Array.from(
    new Set(
      (sessionIds || [])
        .map((id) => Number(id))
        .filter((id) => ORDERED_SESSION_IDS.includes(id))
    )
  );
  return unique.sort(
    (a, b) => ORDERED_SESSION_IDS.indexOf(a) - ORDERED_SESSION_IDS.indexOf(b)
  );
};

export const SessionChips = ({ sessionIds = [] }) => (
  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
    {normalizeOrderedSessionIds(sessionIds).map((id) => (
      <SessionChip key={id} sessionId={id} />
    ))}
  </Box>
);
