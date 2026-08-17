import React from "react";
import { Box, Card, Typography, Stack, Chip } from "@mui/material";

/**
 * Thẻ thống kê (Summary Card)
 * @param {object} props
 * @param {React.ReactNode} props.icon - Icon hiển thị
 * @param {string} props.title - Tiêu đề thẻ
 * @param {string|number} props.value - Giá trị chính
 * @param {string} props.unit - Đơn vị tính (VD: tỷ VNĐ)
 * @param {string} props.trendText - Text badge xu hướng (VD: +12% so với 2025)
 * @param {string} props.trendColor - Màu của badge trend ('success' | 'default')
 * @param {string} props.topBorderColor - Màu viền trên của thẻ
 * @returns {JSX.Element}
 */
const SummaryCard = ({ icon, title, value, unit, trendText, trendColor = "success", topBorderColor }) => {
  return (
    <Card
      sx={{
        p: 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)",
        border: "1px solid #F1F5F9",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 20px -10px rgba(0,0,0,0.08)",
          borderColor: "#E2E8F0"
        }
      }}
    >
      {/* Top Color Bar */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: "4px", 
          backgroundColor: topBorderColor 
        }} 
      />
      <Box>
        <Box
          sx={{
            display: "inline-flex",
            p: 1.25,
            borderRadius: "10px",
            backgroundColor: `${topBorderColor}12`,
            color: topBorderColor,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "fit-content",
            border: `1px solid ${topBorderColor}20`
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: "1.4rem" } })}
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "#64748B",
            mb: 0.25,
            fontWeight: 700,
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          {title}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: "-1px", fontSize: "1.875rem" }}>
            {value}
          </Typography>
          {unit && (
            <Typography variant="body2" sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "11px", letterSpacing: "0.02em" }}>
              {unit}
            </Typography>
          )}
        </Stack>
      </Box>

      {trendText && (
        <Box sx={{ mt: 1.5 }}>
          <Chip
            label={trendText}
            size="small"
            sx={{
              backgroundColor: trendColor === "success" ? "#DCFCE7" : "#F1F5F9",
              color: trendColor === "success" ? "#15803D" : "#475569",
              fontWeight: 800,
              fontSize: "0.75rem",
              borderRadius: "20px",
              height: "26px",
              border: `1px solid ${trendColor === "success" ? "#BBF7D0" : "#E2E8F0"}`,
              "& .MuiChip-label": { px: 1.5 }
            }}
          />
        </Box>
      )}
    </Card>
  );
};

export default SummaryCard;
