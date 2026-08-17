import React from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Avatar,
  FormControlLabel,
  Switch,
  Grid,
  IconButton
} from "@mui/material";
import { 
  NotificationsActive as NotifyIcon,
  EmailOutlined as EmailIcon,
  SmsOutlined as SmsIcon,
  ComputerOutlined as SystemIcon
} from "@mui/icons-material";

const NotificationOption = ({ icon: Icon, title, description, checked, onChange }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2.5, 
      borderRadius: "12px", 
      border: "1px solid",
      borderColor: checked ? "#3b82f6" : "#e2e8f0",
      bgcolor: checked ? "#f0f7ff" : "#fff",
      transition: "all 0.2s ease"
    }}
  >
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box 
        sx={{ 
          p: 1.5, 
          borderRadius: "10px", 
          bgcolor: checked ? "#fff" : "#f1f5f9",
          color: checked ? "#3b82f6" : "#64748b",
          display: "flex"
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="#1e293b">{title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      <Switch 
        size="small" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
      />
    </Stack>
  </Paper>
);

const Step6Notification = ({ data, onChange }) => {
  // notification_type: email | sms | system | all | none
  const notificationType = data.notification_type || "email";

  const handleToggle = (type, val) => {
    // Logic đơn giản: switch sang type đó hoặc none
    if (val) {
      onChange("notification_type", type);
    } else {
      onChange("notification_type", "none");
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Avatar sx={{ bgcolor: "#0f172a", width: 32, height: 32, fontSize: "14px", fontWeight: 700 }}>6</Avatar>
        <Typography variant="h6" fontWeight={700} color="#1e293b">Thông báo</Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <Typography variant="body2" fontWeight={700} mb={3}>Cấu hình nhận thông báo khi có thay đổi trạng thái</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <NotificationOption 
              icon={EmailIcon}
              title="Email"
              description="Nhận thông báo qua email cá nhân"
              checked={notificationType === "email" || notificationType === "all"}
              onChange={(val) => handleToggle("email", val)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <NotificationOption 
              icon={SmsIcon}
              title="SMS"
              description="Nhận tin nhắn văn bản (OTP/Status)"
              checked={notificationType === "sms" || notificationType === "all"}
              onChange={(val) => handleToggle("sms", val)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <NotificationOption 
              icon={SystemIcon}
              title="Hệ thống"
              description="Thông báo đẩy trong ứng dụng"
              checked={notificationType === "system" || notificationType === "all"}
              onChange={(val) => handleToggle("system", val)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, p: 2, bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
           <Stack direction="row" spacing={2} alignItems="center">
             <NotifyIcon sx={{ color: "#3b82f6" }} />
             <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
               Hệ thống sẽ tự động gửi thông báo cho các cấp phê duyệt tiếp theo và thông báo lại cho bạn khi đợt giải ngân được phê duyệt hoặc bị từ chối.
             </Typography>
           </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default Step6Notification;
