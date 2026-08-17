import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Switch, Stack } from "@mui/material";
import { Add, Sync, Download } from "@mui/icons-material";

export default function NewsSources() {
  const [sources] = useState([
    { id: "1", name: "Báo Tuổi Trẻ", url: "https://tuoitre.vn/rss", type: "RSS", status: "active", frequency: 30, lastSync: "2024-03-27 10:00:00" },
    { id: "2", name: "VnExpress", url: "https://vnexpress.net/rss", type: "RSS", status: "error", frequency: 15, lastSync: "2024-03-27 09:45:00" },
    { id: "3", name: "Fanpage PTSC", url: "https://facebook.com/ptsc", type: "Facebook API", status: "active", frequency: 60, lastSync: "2024-03-27 09:00:00" },
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Cấu hình Nguồn tin
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Tổng nguồn tin</Typography><Typography variant="h4">35</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Đang hoạt động</Typography><Typography variant="h4" color="success.main">32</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Lỗi đồng bộ</Typography><Typography variant="h4" color="error.main">2</Typography></CardContent></Card></Grid>
        <Grid item xs={3}><Card elevation={1}><CardContent><Typography variant="subtitle2">Tạm dừng</Typography><Typography variant="h4" color="warning.main">1</Typography></CardContent></Card></Grid>
      </Grid>

      <Card elevation={1}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              {/* Filter placeholders */}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Download />}>Xuất Excel</Button>
              <Button variant="outlined" startIcon={<Sync />}>Đồng bộ tất cả</Button>
              <Button variant="contained" startIcon={<Add />}>Thêm mới</Button>
            </Stack>
          </Stack>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên nguồn</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Tần suất (phút)</TableCell>
                  <TableCell>Đồng bộ cuối</TableCell>
                  <TableCell>Bật/Tắt</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell fontWeight="Medium">{row.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.url}</TableCell>
                    <TableCell><Chip label={row.type} size="small" /></TableCell>
                    <TableCell>
                      <Chip label={row.status === "active" ? "Bình thường" : "Có lỗi"} color={row.status === "active" ? "success" : "error"} size="small" />
                    </TableCell>
                    <TableCell>{row.frequency}</TableCell>
                    <TableCell>{row.lastSync}</TableCell>
                    <TableCell><Switch defaultChecked={row.status === "active"} size="small" /></TableCell>
                    <TableCell>
                      <Button size="small">Sửa</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
