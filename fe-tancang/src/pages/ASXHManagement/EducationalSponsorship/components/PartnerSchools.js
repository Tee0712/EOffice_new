import React from "react";
import { 
  Grid, 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Avatar,
  Stack,
  Divider
} from "@mui/material";
import { 
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Description as MOUIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";

const SchoolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 30px rgba(16, 185, 129, 0.1)",
    borderColor: "#10b981",
    transform: "translateY(-4px)"
  }
}));

const LogoAvatar = styled(Avatar)(({ theme, bgcolor }) => ({
  width: "56px",
  height: "56px",
  borderRadius: "12px",
  backgroundColor: bgcolor || "#f1f5f9",
  fontSize: "20px",
  fontWeight: 700,
  color: "#fff"
}));

const MetricBox = styled(Box)(({ theme }) => ({
  flex: 1,
  textAlign: "center",
  padding: theme.spacing(1),
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
  minWidth: "85px",
  whiteSpace: "nowrap"
}));

/**
 * Danh sách các trường ĐH đối tác (Cards)
 */
const PartnerSchools = ({ schools = [], onViewDetail, onViewAll }) => {
  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
  };

  const getLogoInfo = (logoPath, shortName) => {
    let imageUrl = logoPath;
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${APP_BASE}/${imageUrl}`;
    }
    
    if (logoPath) return { text: shortName || "UN", color: "#64748b", image: imageUrl };
    const text = shortName || "UN";
    const colors = ["#0056b3", "#e30613", "#00a651", "#7c3aed", "#db2777"];
    const charCode = text.charCodeAt(0);
    return { text: text.substring(0, 2).toUpperCase(), color: colors[charCode % colors.length] };
  };

  const normalizePartnerStatus = (status) => {
    if (!status) return "DRAFT";
    const s = String(status).toUpperCase();
    if (s === "ĐÃ KÝ MOU" || s === "ĐANG HOẠT ĐỘNG" || s === "ACTIVE" || s === "SIGNED") return "ACTIVE";
    if (s === "CHỜ KÝ MOU" || s === "PENDING" || s === "SUBMITTED") return "PENDING";
    if (s === "ĐANG THƯƠNG LƯỢNG" || s === "NEGOTIATING") return "NEGOTIATING";
    if (s === "TẠM DỪNG" || s === "PAUSED" || s === "INACTIVE") return "PAUSED";
    if (s === "NHÁP" || s === "DRAFT") return "DRAFT";
    return s;
  };

  const getStatusInfo = (status) => {
    const code = normalizePartnerStatus(status);
    if (code === "ACTIVE") {
      return { label: "Đã ký MOU", color: "success", bgcolor: "#ecfdf5", textColor: "#10b981" };
    }
    if (code === "PENDING") {
      return { label: "Chờ ký MOU", color: "info", bgcolor: "#eff6ff", textColor: "#3b82f6" };
    }
    if (code === "NEGOTIATING") {
      return { label: "Đang thương lượng", color: "warning", bgcolor: "#fff7ed", textColor: "#f97316" };
    }
    if (code === "DRAFT") {
      return { label: "Nháp", color: "default", bgcolor: "#f1f5f9", textColor: "#64748b" };
    }
    return { label: "Tạm dừng", color: "warning", bgcolor: "#fffbeb", textColor: "#f59e0b" };
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} color="#1e293b">
          Trường ĐH hợp tác
        </Typography>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ cursor: "pointer", fontWeight: 600 }}
          onClick={onViewAll}
        >
          Xem tất cả đối tác →
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {schools.map((school) => {
          const logoInfo = getLogoInfo(school.logo_path, school.short_name);
          const statusInfo = getStatusInfo(school.cooperation_status || school.status);

          return (
            <Grid item xs={12} md={4} key={school.id}>
              <SchoolCard onClick={() => onViewDetail(school.id)} sx={{ cursor: "pointer" }}>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <LogoAvatar bgcolor={logoInfo.color} variant="rounded" src={logoInfo.image}>
                    {!logoInfo.image && logoInfo.text}
                  </LogoAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {school.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={statusInfo.label} 
                        size="small" 
                        color={statusInfo.color}
                        sx={{ 
                          height: "22px", 
                          fontSize: "11px", 
                          fontWeight: 600,
                          bgcolor: statusInfo.bgcolor,
                          color: statusInfo.textColor,
                          border: "none"
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
                        <MOUIcon sx={{ fontSize: 14, mr: 0.5 }} /> {school.mou_number || "N/A"}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ngân sách năm học
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#334155">
                    {formatCurrency(school.budget)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  <MetricBox>
                    <Typography variant="h6" fontWeight={700} color="#10b981">
                      {school.slots || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Suất HB
                    </Typography>
                  </MetricBox>
                  <MetricBox>
                    <Typography variant="h6" fontWeight={700} color="#f59e0b">
                      {school.pending || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Chờ duyệt
                    </Typography>
                  </MetricBox>
                  <MetricBox sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TimelineIcon sx={{ color: "#94a3b8" }} />
                  </MetricBox>
                </Stack>
              </SchoolCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PartnerSchools;
