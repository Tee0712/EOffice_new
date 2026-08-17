import React from "react";
import { Box, Paper, Stack, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

const SIDEBAR_ITEMS = [
  {
    id: "dashboard",
    title: "Bảng tin & Thống kê",
    path: "/bulletin/dashboard",
    altPaths: ["/bulletins"],
  },
  {
    id: "workflow",
    title: "Quy trình Phê duyệt",
    path: "/bulletin/workflow",
    altPaths: ["/bulletin-workflows"],
  },
  {
    id: "departments",
    title: "Quản lý Phòng ban",
    path: "/bulletin/departments",
    altPaths: ["/bulletin-departments"],
  },
  {
    id: "permissions",
    title: "Ma trận Phân quyền",
    path: "/bulletin/permissions",
    altPaths: ["/bulletin-permissions"],
  },
  {
    id: "members",
    title: "Thành viên & Vai trò",
    path: "/bulletin/members",
    altPaths: ["/bulletin-members"],
  },
];

const BulletinLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const isItemActive = (item) => {
    if (activeTab && activeTab === item.id) return true;
    return (
      location.pathname === item.path ||
      (item.altPaths && item.altPaths.includes(location.pathname))
    );
  };

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "calc(100vh - 64px)", bgcolor: "#f3f6fb" }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: isMobile ? 200 : 230,
          minWidth: isMobile ? 200 : 230,
          bgcolor: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          justify: "space-between",
          py: 2,
          px: 1.5,
          boxShadow: "1px 0 3px rgba(0,0,0,0.02)",
        }}
      >
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Box
                key={item.id}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2,
                  py: 1.2,
                  borderRadius: "6px",
                  cursor: "pointer",
                  bgcolor: active ? "#e2e8f0" : "transparent",
                  color: active ? "#0f172a" : "#475569",
                  fontWeight: active ? 700 : 600,
                  fontSize: "13.5px",
                  lineHeight: "1.4",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    bgcolor: active ? "#e2e8f0" : "#f1f5f9",
                    color: "#0f172a",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: active ? 700 : 600,
                    fontSize: "13.5px",
                    color: "inherit",
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Bottom Sidebar Collapse/Footer indicator */}
        <Box sx={{ pt: 2, px: 1, display: "flex", alignItems: "center", opacity: 0.7 }}>
          <MenuOpenIcon sx={{ fontSize: 18, color: "#64748b", cursor: "pointer" }} />
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          bgcolor: "#f3f6fb",
          minHeight: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default BulletinLayout;
