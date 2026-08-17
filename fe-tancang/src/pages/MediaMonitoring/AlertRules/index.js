import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, Switch, Chip, Avatar, AvatarGroup, Button, Divider, List, ListItem, ListItemText, ListItemAvatar } from "@mui/material";
import { Add, NotificationsActive, Email, Settings } from "@mui/icons-material";

export default function AlertRules() {
  const [rules] = useState([
    { id: "1", name: "Cảnh báo Khủng hoảng", desc: "> 5 bài viết Tiêu cực / giờ", severity: "error", channels: ["Email", "Zalo"], active: true },
    { id: "2", name: "Báo cáo ngày", desc: "Tổng hợp bài viết cuối ngày", severity: "info", channels: ["Email"], active: true },
    { id: "3", name: "Phát hiện Đình công", desc: "Chứa từ khóa rủi ro", severity: "warning", channels: ["Zalo"], active: false },
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Cảnh báo & Thông báo
        </Typography>
        <Button variant="contained" startIcon={<Add />}>Thêm Quy tắc</Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>Danh sách Quy tắc</Typography>
          <Grid container spacing={2}>
            {rules.map((rule) => (
              <Grid item xs={12} sm={6} key={rule.id}>
                <Card elevation={1}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">{rule.name}</Typography>
                          <Chip label={rule.severity === "error" ? "Cao" : "Thấp"} color={rule.severity} size="small" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{rule.desc}</Typography>
                      </Box>
                      <Switch defaultChecked={rule.active} />
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1}>
                        {rule.channels.map(c => <Chip key={c} label={c} size="small" variant="outlined" />)}
                      </Stack>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                        <Avatar>PT</Avatar>
                        <Avatar>A</Avatar>
                      </AvatarGroup>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Cấu hình Kênh</Typography>
                <Button size="small" startIcon={<Settings />}>Quản lý</Button>
              </Stack>
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "info.light" }}><Email fontSize="small" /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Email Hệ thống" secondary="Đã kết nối" />
                  <Chip label="Sẵn sàng" color="success" size="small" />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}><NotificationsActive fontSize="small" /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Zalo ZNS" secondary="Chưa cấu hình API Key" />
                  <Chip label="Lỗi" color="error" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Lịch sử Cảnh báo</Typography>
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Đã gửi Cảnh báo Khủng hoảng"
                    secondary="10 phút trước • 2 người nhận"
                    primaryTypographyProps={{ variant: "body2", fontWeight: "medium" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem disableGutters>
                  <ListItemText
                    primary="Đã gửi Báo cáo ngày"
                    secondary="Hôm qua, 17:00 • 5 người nhận"
                    primaryTypographyProps={{ variant: "body2", fontWeight: "medium" }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
