import React from "react";
import { Box, Typography, Paper, Divider, Stack, Avatar } from "@mui/material";
import { 
    Flag as MilestoneIcon, 
    History as LogIcon, 
    CheckCircle as SuccessIcon,
    Update as PendingIcon 
} from "@mui/icons-material";
import moment from "moment";

const ActivityTab = ({ activities = [] }) => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Paper sx={{ p: 4, borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
           Nhật ký hoạt động chương trình
        </Typography>

        <Stack spacing={0} sx={{ position: "relative" }}>
           {/* Timeline vertical line */}
           <Box sx={{ 
              position: "absolute", 
              left: 20, 
              top: 0, 
              bottom: 0, 
              width: 2, 
              bgcolor: "#F1F5F9",
              zIndex: 0
           }} />

           {activities.length > 0 ? (
             activities.map((act, idx) => (
               <Box key={idx} sx={{ position: "relative", pb: 4, pl: 6 }}>
                  {/* Icon */}
                  <Avatar 
                    sx={{ 
                        position: "absolute", 
                        left: -1, 
                        top: 0, 
                        width: 42, 
                        height: 42, 
                        bgcolor: act.type === 'MILESTONE' ? "#EFF6FF" : "#F8FAFC", 
                        border: "2px solid white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        zIndex: 1
                    }}
                  >
                    {act.type === 'MILESTONE' ? (
                        <MilestoneIcon sx={{ color: "#3B82F6", fontSize: "1.2rem" }} />
                    ) : (
                        <LogIcon sx={{ color: "#64748B", fontSize: "1.2rem" }} />
                    )}
                  </Avatar>

                  {/* Content */}
                  <Box>
                     <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                           {act.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           {moment(act.date).format("HH:mm — DD/MM/YYYY")}
                        </Typography>
                     </Stack>
                     
                     <Typography variant="body2" color="#475569" sx={{ mt: 0.5 }}>
                        {act.details || `Đã cập nhật trạng thái: ${act.status || "Hoàn thành"}`}
                     </Typography>

                     {act.owner && (
                        <Typography variant="caption" sx={{ color: "#0055CC", fontWeight: 600, mt: 1, display: "block" }}>
                           Thực hiện bởi: {act.owner}
                        </Typography>
                     )}
                  </Box>
               </Box>
             ))
           ) : (
             <Box sx={{ textAlign: "center", py: 5 }}>
                <Typography color="text.secondary">Chưa có hoạt động nào được ghi nhận.</Typography>
             </Box>
           )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ActivityTab;
