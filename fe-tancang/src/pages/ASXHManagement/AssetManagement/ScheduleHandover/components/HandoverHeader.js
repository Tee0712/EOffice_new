import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import { SkyStatusBadge } from "@styles/SkyStyles";

const HandoverHeader = ({ programInfo, isEdit }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Back Link */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{
          cursor: "pointer",
          mb: 3,
          color: "#64748b",
          width: "fit-content",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            color: "#3b82f6",
            "& .back-icon-box": {
              bgcolor: "rgba(59, 130, 246, 0.08)",
              transform: "translateX(-3px)",
            },
          },
        }}
        onClick={() => navigate(-1)}
      >
        <Box
          className="back-icon-box"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, fontSize: "14px", letterSpacing: "0.2px" }}
        >
          Quay lại quản lý hiện vật
        </Typography>
      </Stack>

      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color: "#1e293b", mb: 0.5, fontSize: "24px" }}
      >
        {isEdit ? "Chỉnh sửa Lên lịch Bàn giao" : "Lên lịch Bàn giao Hiện vật"}
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 4 }}>
        Thiết lập sự kiện bàn giao hiện vật tại địa phương
      </Typography>

      {/* Program Summary Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          position: "relative",
          bgcolor: "#FFFFFF",
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: "4px",
            bgcolor: "#F97316",
            borderRadius: "0 4px 4px 0",
          },
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          {/* Hexagon Icon Placeholder */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: "#FFF7ED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F97316",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L3.5 7V17L12 22L20.5 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#F97316", fontWeight: 700, letterSpacing: "0.5px" }}
            >
              {programInfo?.code || "CT-2026/005"}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: "#1e293b", mt: -0.5 }}
            >
              {programInfo?.name || "Trao máy tính cho trường học Kon Tum"}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ color: "#64748b", mt: 0.5 }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                Hiện vật
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                •
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {programInfo?.locality || "Đắc Hà, Kon Tum"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                •
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {programInfo?.total_items || 0} hạng mục
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                •
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {new Intl.NumberFormat("vi-VN").format(
                  programInfo?.total_amount || programInfo?.total_budget || 0
                )}{" "}
                VNĐ
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default HandoverHeader;
