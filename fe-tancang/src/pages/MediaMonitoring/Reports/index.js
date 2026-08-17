import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, TextField, Button, Chip, List, ListItem, ListItemText, ListItemSecondaryAction, Tabs, Tab, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { Add, Send, Edit, PlayCircleOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const mockTemplates = [
    { id: "1", name: "Báo cáo ngày", freq: "Hàng ngày", status: "active", sentCount: 45 },
    { id: "2", name: "Báo cáo tuần", freq: "Hàng tuần", status: "active", sentCount: 12 },
    { id: "3", name: "Báo cáo tổng kết khủng hoảng PTSC", freq: "Sự kiện", status: "draft", sentCount: 0 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Báo cáo Định kỳ</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/media/reports/history")}>Lịch sử Gửi</Button>
          <Button variant="contained" startIcon={<Add />}>Thêm Mẫu Mới</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <List>
              {mockTemplates.map((t) => (
                <ListItem button key={t.id} selected={t.id === "1"}>
                  <ListItemText
                    primary={t.name}
                    secondary={`Đã gửi: ${t.sentCount} lần`}
                  />
                  <ListItemSecondaryAction>
                    <Chip label={t.freq} size="small" color={t.status === "active" ? "success" : "default"} />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={1}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6">Chi tiết Mẫu: Báo cáo ngày</Typography>
                <Chip label="Đang hoạt động" color="success" />
              </Stack>
              
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Cấu hình Chung" />
                <Tab label="Tùy chọn Nội dung" />
                <Tab label="Người nhận" />
              </Tabs>
              
              {tab === 0 && (
                <Stack spacing={3}>
                  <TextField label="Tên báo cáo" defaultValue="Báo cáo ngày" fullWidth />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField select label="Tần suất gửi" defaultValue="daily" fullWidth SelectProps={{ native: true }}>
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                        <option value="event">Theo sự kiện</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField type="time" label="Thời gian gửi" defaultValue="17:00" fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select label="Phạm vi dữ liệu" defaultValue="24h" fullWidth SelectProps={{ native: true }}>
                        <option value="24h">24 giờ qua</option>
                        <option value="7d">7 ngày qua</option>
                        <option value="30d">30 ngày qua</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select label="Định dạng xuất" defaultValue="email" fullWidth SelectProps={{ native: true }}>
                        <option value="email">Email trực tiếp (HTML)</option>
                        <option value="pdf">Đính kèm PDF</option>
                      </TextField>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {tab === 1 && (
                <Stack>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Chọn các mục hiển thị trong báo cáo:</Typography>
                  <FormControlLabel control={<Checkbox defaultChecked />} label="Tổng quan KPI & Biểu đồ xu hướng" />
                  <FormControlLabel control={<Checkbox defaultChecked />} label="Cảnh báo nổi bật" />
                  <FormControlLabel control={<Checkbox defaultChecked />} label="Top 5 nguồn nhắc đến nhiều nhất" />
                  <FormControlLabel control={<Checkbox defaultChecked />} label="Từ khóa thịnh hành (Tag Cloud)" />
                  <FormControlLabel control={<Checkbox />} label="Chi tiết tất cả bài viết tiêu cực" />
                </Stack>
              )}

              {tab === 2 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Danh sách người nhận (Email / Account)</Typography>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, minHeight: 150 }}>
                    <Chip label="Giám đốc ABC" onDelete={() => {}} sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Truyền thông Nội bộ" onDelete={() => {}} sx={{ mr: 1, mb: 1 }} />
                    <Button size="small" startIcon={<Add />}>Thêm người nhận</Button>
                  </Box>
                </Stack>
              )}

              <Divider sx={{ my: 3 }} />
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" startIcon={<PlayCircleOutline />} color="info">Gửi thử Demo</Button>
                <Box>
                  <Button variant="outlined" startIcon={<Send />} sx={{ mr: 1 }}>Gửi ngay</Button>
                  <Button variant="contained" startIcon={<Edit />}>Lưu cấu hình</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
