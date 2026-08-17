import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Visibility as ViewIcon,
  MoreHoriz as MoreIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
} from "@mui/icons-material";

const KanbanContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  overflowX: "auto",
  paddingBottom: theme.spacing(2),
  minHeight: "calc(100vh - 400px)",
}));

const KanbanColumn = styled(Box)(({ theme }) => ({
  minWidth: "320px",
  width: "320px",
  backgroundColor: "#f1f5f9",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1.5),
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1, 1, 2, 1),
}));

const ColumnBadge = styled(Box)(({ theme, bgcolor, color }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2px 10px",
  borderRadius: "12px",
  backgroundColor: bgcolor,
  color: color,
  fontSize: "12px",
  fontWeight: 700,
  marginLeft: theme.spacing(1),
}));

const ProgramCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: "12px",
  marginBottom: theme.spacing(1.5),
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  border: "1px solid transparent",
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme, customcolor }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.grey[100],
  "& .MuiLinearProgress-bar": {
    borderRadius: 3,
    backgroundColor: customcolor || theme.palette.primary.main,
  },
}));

const FUNDING_TYPE_STYLES = {
  Bang_tien: { label: "Tiền mặt", color: "#2563eb", bgcolor: "#eff6ff" },
  Hien_vat: { label: "Hiện vật", color: "#d97706", bgcolor: "#fffbeb" },
  Giao_duc: { label: "Giáo dục", color: "#7c3aed", bgcolor: "#f5f3ff" },
};

const STATUS_CONFIG = [
  { key: "lap_ke_hoach", label: "Lập kế hoạch", color: "#64748b", bgcolor: "#e2e8f0" },
  { key: "dang_trien_khai", label: "Đang triển khai", color: "#16a34a", bgcolor: "#dcfce7" },
  { key: "dang_giai_ngan", label: "Đang giải ngân", color: "#d97706", bgcolor: "#fef3c7" },
  { key: "hoan_thanh", label: "Hoàn thành", color: "#7c3aed", bgcolor: "#f3e8ff" },
];

const ProgramKanban = ({ items = [], onView }) => {
  const getProgramsByStatus = (statusKey) => {
    return items.filter((item) => item.status === statusKey);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
  };

  return (
    <KanbanContainer>
      {STATUS_CONFIG.map((col) => {
        const columnPrograms = getProgramsByStatus(col.key);
        
        return (
          <KanbanColumn key={col.key}>
            <ColumnHeader>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {col.label}
                </Typography>
                <ColumnBadge bgcolor={col.bgcolor} color={col.color}>
                  {columnPrograms.length}
                </ColumnBadge>
              </Box>
              <IconButton size="small">
                <MoreIcon fontSize="small" />
              </IconButton>
            </ColumnHeader>

            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {columnPrograms.map((item) => {
                const funding = FUNDING_TYPE_STYLES[item.funding_type] || { label: item.funding_type, color: "#64748b", bgcolor: "#f1f5f9" };
                
                return (
                  <ProgramCard key={item.id} onClick={() => onView && onView(item)}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Chip
                          label={funding.label}
                          size="small"
                          sx={{ 
                            bgcolor: funding.bgcolor, 
                            color: funding.color, 
                            fontWeight: 700, 
                            fontSize: "10px",
                            height: "20px"
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {item.code}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4, color: "#1e293b" }}>
                        {item.name}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.locality}
                        </Typography>
                      </Stack>

                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Tiến độ: {item.progress_percent}%
                          </Typography>
                          <ViewIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                        </Box>
                        <StyledLinearProgress
                          variant="determinate"
                          value={item.progress_percent}
                          customcolor={item.progress_percent === 100 ? "#7c3aed" : col.color}
                        />
                      </Box>

                      <Box sx={{ 
                        pt: 1.5, 
                        borderTop: "1px dashed #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary">Ngân sách</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(item.budget)}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" display="block" color="text.secondary">Đã chi</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#16a34a" }}>{formatCurrency(item.disbursed_total)}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </ProgramCard>
                );
              })}
              
              {columnPrograms.length === 0 && (
                <Box sx={{ 
                  p: 4, 
                  textAlign: "center", 
                  border: "2px dashed #e2e8f0", 
                  borderRadius: "12px",
                  mt: 1
                }}>
                  <Typography variant="caption" color="text.disabled">
                    Không có chương trình
                  </Typography>
                </Box>
              )}
            </Box>
          </KanbanColumn>
        );
      })}
    </KanbanContainer>
  );
};

export default ProgramKanban;
