import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Button, Tabs, Tab, TextField, Checkbox, FormControlLabel, Divider } from "@mui/material";

export default function Keywords() {
  const [tab, setTab] = useState(0);

  const mockKeywords = [
    { id: "1", name: "PTSC", count: 125, type: "brand", color: "primary" },
    { id: "2", name: "Dịch vụ kỹ thuật", count: 42, type: "theme", color: "info" },
    { id: "3", name: "Petrovietnam", count: 89, type: "brand", color: "primary" },
    { id: "4", name: "Đình công", count: 0, type: "risk", color: "error", exclude: false },
    { id: "5", name: "Cổ phiếu", count: 0, type: "exclude", color: "default", exclude: true },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Cấu hình Từ khóa 
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Tổng từ khóa</Typography><Typography variant="h4">45</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Thương hiệu</Typography><Typography variant="h4" color="primary.main">12</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Rủi ro cần theo dõi</Typography><Typography variant="h4" color="error.main">8</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Từ khóa loại trừ</Typography><Typography variant="h4" color="text.secondary">25</Typography></CardContent></Card></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Tất cả" />
              <Tab label="Thương hiệu" />
              <Tab label="Chủ đề" />
              <Tab label="Rủi ro" />
              <Tab label="Loại trừ" />
            </Tabs>
            <Divider />
            <List>
              {mockKeywords.map((kw) => (
                <ListItem button key={kw.id}>
                  <ListItemText 
                    primary={kw.name} 
                    secondary={kw.exclude ? "Đang loại trừ" : "Đang theo dõi"}
                  />
                  <ListItemSecondaryAction>
                    <Chip label={kw.count} size="small" color={kw.color} />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Chi tiết Từ khóa</Typography>
              <Stack spacing={3}>
                <TextField label="Tên từ khóa" defaultValue="PTSC" fullWidth />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Trọng số ưu tiên (0-100)" defaultValue="100" type="number" fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Nhóm từ khóa" select SelectProps={{ native: true }} fullWidth>
                      <option>Thương hiệu</option>
                      <option>Chủ đề</option>
                      <option>Rủi ro</option>
                    </TextField>
                  </Grid>
                </Grid>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Kích hoạt theo dõi" />
                <FormControlLabel control={<Checkbox />} label="Đây là từ khóa loại trừ (Bài viết chứa từ này sẽ không bị lưu lại)" />
                <Box>
                  <Button variant="contained" sx={{ mr: 1 }}>Lưu thay đổi</Button>
                  <Button variant="outlined" color="error">Xóa từ khóa</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
