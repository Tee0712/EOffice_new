import React from "react";
import { Grid, Paper, Typography, Box, Divider, List, ListItem, ListItemIcon, ListItemText, Stack, Chip } from "@mui/material";
import { 
    Flag as GoalIcon, 
    Business as OrgIcon, 
    Timeline as MilestoneIcon,
    Circle as DotIcon
} from "@mui/icons-material";
import moment from "moment";

const OverviewTab = ({ data }) => {
  return (
    <Grid container spacing={4}>
      {/* Detailed Information Table */}
      <Grid item xs={12} md={7.5}>
        <Box sx={{ borderBottom: "1px solid #E2E8F0", pb: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#64748B" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Thông tin chi tiết
          </Typography>
        </Box>
        
        <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
          <Box component="tbody">
            {[
              { label: "MÃ CHƯƠNG TRÌNH", value: data.code, cyan: true },
              { label: "CÔNG VĂN GỐC", value: data.linked_documents?.[0] ? `${data.linked_documents[0].document_code} — ${data.linked_documents[0].document_subject}` : "Chưa liên kết", blue: true },
              { label: "LOẠI HÌNH", value: data.funding_type === "CASH" ? "Hỗ trợ bằng tiền mặt" : "Hỗ trợ hiện vật" },
              { label: "ĐỊA PHƯƠNG", value: data.locality },
              { label: "THỜI GIAN", value: `${moment(data.start_date).format("DD/MM/YYYY")} → ${moment(data.end_date).format("DD/MM/YYYY")} (6 tháng)` },
              { label: "NGÂN SÁCH PHÊ DUYỆT", value: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.budget), blue: true },
              { label: "PHỤ TRÁCH TCSG", value: data.members?.find(m => m.role === 'LEADER')?.user_name || "Phạm Ngọc Hà — Phòng ASXH" },
              { label: "ĐỐI TÁC ĐỊA PHƯƠNG", value: data.local_partner || "UBND huyện Châu Thành, Hội Chữ thập đỏ tỉnh Bến Tre" },
              { label: "ĐỐI TƯỢNG THỤ HƯỞNG", value: data.beneficiary || "9 hộ gia đình chính sách, hộ nghèo tại xã Phú Túc và An Khánh (khoảng 126 nhân khẩu)" },
              { label: "MỤC TIÊU", value: data.description || "Xây mới 9 căn nhà tình thương (diện tích 48-60m² / căn) đạt chuẩn nông thôn mới, đảm bảo an toàn và bền vững" },
            ].map((row, idx) => (
              <Box component="tr" key={idx} sx={{ borderBottom: "1px solid #F1F5F9" }}>
                 <Box component="td" sx={{ py: 1.5, width: "30%", color: "#94A3B8", fontWeight: 600, fontSize: "0.75rem", verticalAlign: "top" }}>
                   {row.label}
                 </Box>
                 <Box component="td" sx={{ py: 1.5, color: row.cyan ? "#0891B2" : (row.blue ? "#2563EB" : "#1E293B"), fontWeight: 600, fontSize: "0.875rem" }}>
                   {row.value}
                 </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>

      {/* Sidebar: Progress & Milestones */}
      <Grid item xs={12} md={4.5}>
        <Stack spacing={4}>
          {/* Progress Circular Display */}
          <Box sx={{ 
            p: 4, 
            borderRadius: "16px", 
            backgroundColor: "#F8FAFC", 
            textAlign: "center",
            border: "1px solid #F1F5F9"
          }}>
            <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
              {/* SVG for true circular progress as per design */}
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="#10B981" strokeWidth="12" 
                  strokeDasharray={`${2 * Math.PI * 70 * data.progress_percent / 100} ${2 * Math.PI * 70}`} 
                  strokeLinecap="round" transform="rotate(-90 80 80)" />
                <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fill="#1E293B" fontWeight="800" fontSize="32px">
                  {data.progress_percent}%
                </text>
                <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fill="#94A3B8" fontWeight="700" fontSize="12px" style={{ textTransform: "uppercase" }}>
                  Tiến độ
                </text>
              </svg>
            </Box>
            <Typography variant="body2" fontWeight={700} color="#1E293B">
              {data.item_completed_count || 0} / {data.item_count} hạng mục đã hoàn thành
            </Typography>
            <Typography variant="caption" fontWeight={700} color="#10B981" sx={{ mt: 0.5, display: "block" }}>
              Đúng tiến độ
            </Typography>
          </Box>

          {/* Milestones Sidebar */}
          <Box>
            <Typography variant="caption" fontWeight={800} color="#94A3B8" sx={{ mb: 2, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Các mốc quan trọng
            </Typography>
            <List dense sx={{ p: 0, position: "relative" }}>
               {/* Vertical line through milestones */}
               <Box sx={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, bgcolor: "#F1F5F9" }} />
               
              {data.milestones?.length > 0 ? (
                data.milestones.map((ms, idx) => {
                  const isDone = moment(ms.milestone_date).isBefore(moment()) || ms.status === 'COMPLETED';
                  const isPending = !isDone && idx === data.milestones.findIndex(m => !moment(m.milestone_date).isBefore(moment()));

                  return (
                    <ListItem key={ms.id} sx={{ alignItems: "flex-start", px: 0, pb: 3, position: "relative", "&:last-child": { pb: 0 } }}>
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5, zIndex: 1 }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          borderRadius: "50%", 
                          border: `2px solid ${isDone ? "#10B981" : (isPending ? "#F59E0B" : "#CBD5E1")}`,
                          bgcolor: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                           {isDone && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10B981" }} />}
                           {isPending && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#F59E0B" }} />}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} color="#1E293B" sx={{ mb: 0.2 }}>{ms.milestone_name}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {moment(ms.milestone_date).format("DD/MM/YYYY")} {isPending && '— Dự kiến'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa có mốc thời gian</Typography>
              )}
            </List>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;
