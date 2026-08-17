import React from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Stack,
  Switch,
  TextField,
  MenuItem,
  Grid
} from "@mui/material";
import { NotificationsActive, Message } from "@mui/icons-material";

const NotificationSettingSection = ({ formData, onChange }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#3b82f6", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          6
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Thông báo & Nhắc nhở
        </Typography>
      </Stack>

      <Stack spacing={0} sx={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
        {[
          { 
            key: "notify_attendees", 
            title: "Email thông báo cho đoàn tham dự", 
            desc: "Gửi lịch trình và thông tin sự kiện" 
          },
          { 
            key: "notify_local", 
            title: "Thông báo cho đơn vị tiếp nhận", 
            desc: "Gửi email/SMS xác nhận lịch cho Trường THCS" 
          },
          { 
            key: "remind_3days", 
            title: "Nhắc nhở trước 3 ngày", 
            desc: "Tự động nhắc đoàn và đơn vị tiếp nhận" 
          },
          { 
            key: "sync_google_calendar", 
            title: "Đồng bộ lịch Google Calendar", 
            desc: "Thêm sự kiện vào lịch của đoàn tham dự" 
          },
          { 
            key: "remind_checklist", 
            title: "Nhắc nhở hoàn tất checklist", 
            desc: "Nhắc hàng ngày nếu checklist bắt buộc chưa xong" 
          }
        ].map((item, index, array) => (
          <React.Fragment key={item.key}>
            <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#FFFFFF" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1e293b", mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  {item.desc}
                </Typography>
              </Box>
              <Switch 
                checked={!!formData[item.key]} 
                onChange={(e) => onChange(item.key, e.target.checked)}
                color="primary"
              />
            </Box>
            {index < array.length - 1 && <Box sx={{ height: "1px", bgcolor: "#f1f5f9", mx: 2.5 }} />}
          </React.Fragment>
        ))}
      </Stack>
    </Paper>


  );
};

export default NotificationSettingSection;
