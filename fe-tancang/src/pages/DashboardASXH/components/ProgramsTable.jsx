import React from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Chip, Button
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ChartCard from "./ChartCard";

const ProgramsTable = ({ data, loading }) => {
  const navigate = useNavigate();

  // Config Badge for Funding Type
  const typeConfig = {
    "CASH": { label: "Bằng tiền", color: "#F0FDFA", textColor: "#0D9488" },
    "IN_KIND": { label: "Bằng hiện vật", color: "#FFF7ED", textColor: "#EA580C" },
    "EDUCATION": { label: "Tài trợ giáo dục", color: "#F5F3FF", textColor: "#7C3AED" }
  };

  // Config Status Dot
  const statusConfig = {
    "ACTIVE": { label: "Đang triển khai", color: "#22C55E", bgColor: "#DCFCE7", textColor: "#15803D" },
    "COMPLETED": { label: "Hoàn thành", color: "#64748B", bgColor: "#F1F5F9", textColor: "#475569" },
    "IN_PROGRESS": { label: "Đang triển khai", color: "#22C55E", bgColor: "#DCFCE7", textColor: "#15803D" },
    "PREPARING": { label: "Lập kế hoạch", color: "#EA580C", bgColor: "#FFF7ED", textColor: "#C2410C" },
    "CANCELLED": { label: "Đã hủy", color: "#EF4444", bgColor: "#FEE2E2", textColor: "#B91C1C" }
  };

  const extraLink = (
    <Button 
      variant="text" 
      endIcon={<ArrowForward />} 
      onClick={() => navigate("/asxh-management")}
      sx={{ 
        textTransform: "none", 
        fontWeight: 700,
        color: "#2563EB",
        fontSize: "0.85rem",
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
      }}
    >
      Xem tất cả
    </Button>
  );

  return (
    <ChartCard title="Chương trình ASXH đang triển khai" extra={extraLink} sx={{ px: 0, borderRadius: "16px", boxShadow: "0px 4px 20px rgba(0,0,0,0.03)" }}>
      <Box sx={{ mt: -1, mx: -2.5, mb: -2.5 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="programs table">
            <TableHead sx={{ backgroundColor: "#F1F5F9" }}>
              <TableRow>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.8rem", px: 3, py: 2 }}>TÊN CHƯƠNG TRÌNH</TableCell>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.8rem", py: 2 }}>LOẠI HÌNH</TableCell>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.8rem", py: 2 }}>ĐỊA PHƯƠNG</TableCell>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.8rem", py: 2 }}>NGÂN SÁCH</TableCell>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.75rem", py: 2, width: "15%" }}>TIẾN ĐỘ</TableCell>
                <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.75rem", py: 2, pr: 3 }}>TRẠNG THÁI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && (data || []).map((row) => {
                const typeStyle = typeConfig[row.funding_type] || { label: row.funding_type, color: "#F1F5F9", textColor: "#475569" };
                const stConfig = statusConfig[row.status] || { label: row.status, color: "#64748B", barColor: "#94A3B8" };

                return (
                  <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ px: 3, fontWeight: 600, color: "#1E293B", py: 1.75, fontSize: "0.9rem" }}>
                      {row.name}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Chip 
                        label={typeStyle.label} 
                        size="small" 
                        sx={{ 
                          backgroundColor: typeStyle.color, 
                          color: typeStyle.textColor,
                          fontWeight: 700,
                          borderRadius: "20px",
                          height: "24px",
                          fontSize: "0.75rem"
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.875rem", py: 1.75, fontWeight: 500 }}>{row.locality}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#1E293B", py: 1.75, fontSize: "0.95rem" }}>
                      {(row.budget / 1000000000).toFixed(2)} tỷ
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1.5 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={row.progress || 0} 
                          sx={{ 
                            flex: 1,
                            height: 6, 
                            borderRadius: 3, 
                            backgroundColor: "#E2E8F0",
                            "& .MuiLinearProgress-bar": { 
                              backgroundColor: stConfig.color,
                              borderRadius: 3
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B", minWidth: 35 }}>
                          {row.progress?.toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ pr: 3, py: 1.75 }}>
                      <Chip 
                        label={stConfig.label} 
                        size="small" 
                        sx={{ 
                          backgroundColor: stConfig.bgColor, 
                          color: stConfig.textColor,
                          fontWeight: 700,
                          borderRadius: "6px",
                          height: "24px",
                          fontSize: "0.7rem",
                          "& .MuiChip-label": { px: 1 }
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ChartCard>
  );
};

export default ProgramsTable;
