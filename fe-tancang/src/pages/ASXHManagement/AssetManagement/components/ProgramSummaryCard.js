import React from "react";
import { Box, Typography, Paper, Stack, Button, Avatar } from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  ChevronLeft as BackIcon,
  AttachMoney as DollarIcon,
  Visibility as ViewIcon, // For "Xem chương trình"
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const ProgramSummaryCard = ({ programInfo }) => {
  const navigate = useNavigate();
  const {
    id,
    code = "CT-2026/001",
    name = "Xây nhà tình thương Bến Tre",
    start_date = "01/01/2026",
    end_date = "30/06/2026",
    locality = "Huyện Châu Thành, Bến Tre",
    funding_type = "CASH",
    status = "dang_trien_khai",
  } = programInfo || {};

  const formatDate = (date) => {
    if (!date) return "---";
    return dayjs(date).format("DD/MM/YYYY");
  };

  const getStatusLabel = (s) =>
    s === "dang_trien_khai" ? "Đang triển khai" : s;
  const getFundingLabel = (f) => (f === "CASH" ? "Bằng tiền" : "Hiện vật");

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{
          cursor: "pointer",
          mb: 2.5,
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
        onClick={() => navigate("/asxh-management")}
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
          Quay lại chương trình
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          bgcolor: "#FFFFFF",
          borderLeft: "6px solid #10b981", // Teal/Green vertical bar
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow:
            "0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" sx={{ flex: 1 }}>
          {/* Icon Box */}
          <Avatar
            sx={{
              width: 56,
              height: 56,
              borderRadius: "12px",
              bgcolor: "#f0fdf4",
              color: "#16a34a", // Clean green theme
              border: "1px solid #dcfce7",
              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.05)",
            }}
          >
            <DollarIcon sx={{ fontSize: 32 }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#16a34a",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "1px",
                mb: 0.5,
                display: "block",
              }}
            >
              {code}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: { xs: "18px", md: "22px" },
                lineHeight: 1.2,
                mb: 1.5,
              }}
            >
              {name}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: { xs: 1.5, md: 3 } }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <CalendarIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#475569", fontWeight: 500 }}
                >
                  {formatDate(start_date)} — {formatDate(end_date)}
                </Typography>
              </Stack>

              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: "#cbd5e1",
                  display: { xs: "none", md: "block" },
                }}
              />

              <Stack direction="row" spacing={0.8} alignItems="center">
                <LocationIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#475569", fontWeight: 500 }}
                >
                  {locality}
                </Typography>
              </Stack>

              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: "#cbd5e1",
                  display: { xs: "none", md: "block" },
                }}
              />

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: "6px",
                    bgcolor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#475569", fontWeight: 700 }}
                  >
                    {getFundingLabel(funding_type)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#22c55e",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "#16a34a", fontWeight: 700 }}
                  >
                    {getStatusLabel(status)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        <Button
          variant="contained"
          onClick={() => navigate(`/asxh/programs/${id}`)}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            bgcolor: "#fff",
            color: "#0f172a",
            fontWeight: 700,
            px: 3,
            py: 1,
            fontSize: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
            ml: 4,
            "&:hover": {
              borderColor: "#cbd5e1",
              bgcolor: "#f8fafc",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            },
          }}
        >
          Xem chương trình
        </Button>
      </Paper>
    </Box>
  );
};

export default ProgramSummaryCard;
