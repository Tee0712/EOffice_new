import React from "react"; // Forcing rebuild to clear stale warning
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import {
  ArrowForwardIos,
  AccountBalanceWallet,
  CheckCircle,
  Info,
} from "@mui/icons-material";
import { SkyTitle, SkyStatusBadge } from "@styles/SkyStyles";

const BudgetBox = ({ label, value, color }) => (
  <Box
    sx={{
      bgcolor: "white",
      border: "1px solid #E2E8F0",
      borderLeft: `4px solid ${color}`,
      borderRadius: "8px",
      flex: 1,
      p: 1.5,
      boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: "#64748B",
        fontWeight: 600,
        textTransform: "uppercase",
        display: "block",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: color === "#10B981" ? "#10B981" : "#1E293B",
        fontSize: "1.1rem",
      }}
    >
      {new Intl.NumberFormat("vi-VN").format(value)}
    </Typography>
  </Box>
);

const AssetFormHeader = ({
  programInfo,
  allocatedBudget,
  availableBudget,
  isEdit = false,
}) => {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{
          cursor: "pointer",
          mb: 3,
          color: "#64748B",
          width: "fit-content",
          transition: "all 0.2s ease-in-out",
          textDecoration: "none",
          "&:hover": {
            color: "#3B82F6",
            "& .back-icon-box": {
              bgcolor: "rgba(59, 130, 246, 0.08)",
              transform: "translateX(-3px)",
            },
          },
        }}
        onClick={() => window.history.back()}
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
          Quay lại danh sách hiện vật
        </Typography>
      </Stack>

      <Typography
        variant="h4"
        sx={{ mb: 0.5, fontWeight: 700, color: "#1E293B", fontSize: "24px" }}
      >
        {isEdit ? "Cập nhật" : "Thêm"} hạng mục Hiện vật
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
        {isEdit
          ? "Cập nhật thông tin hiện vật cho"
          : "Bổ sung hiện vật mới vào"}{" "}
        chương trình{" "}
        <Box component="span" sx={{ color: "#F97316", fontWeight: 600 }}>
          {programInfo?.code || "CT-2026/005"}
        </Box>
      </Typography>

      {/* Program Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          mb: 3,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            border: "2px solid #F97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 2,
            color: "#F97316",
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              border: "2px solid currentColor",
              borderRadius: "4px",
              transform: "rotate(45deg)",
            }}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            sx={{ color: "#F97316", fontSize: "12px", fontWeight: 700 }}
          >
            {programInfo?.code || "CT-2026/005"}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1E293B" }}
          >
            {programInfo?.name}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Hiện vật
            </Typography>
            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
              •
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              {programInfo?.locality || "Đăk Hà, Kon Tum"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
              •
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#F97316", fontWeight: 600 }}
            >
              Đang mua sắm
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {/* Budget Summary Sections */}
      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
        <BudgetBox
          label="NGÂN SÁCH CT"
          value={programInfo?.total_budget || 0}
          color="#F97316"
        />
        <BudgetBox
          label={`ĐÃ PHÂN BỔ (${programInfo?.id === "7" || programInfo?.id === 7 ? "5 HM" : "HM"})`}
          value={allocatedBudget}
          color="#F59E0B"
        />
        <BudgetBox
          label="CÒN KHẢ DỤNG"
          value={availableBudget}
          color="#10B981"
        />
      </Stack>
    </Box>
  );
};

export default AssetFormHeader;
