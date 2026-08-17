import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Stack, Button } from "@mui/material";
import { ArrowBack, Visibility, Replay } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function ReportHistory() {
  const navigate = useNavigate();

  const [history] = useState([
    { id: "1", templateName: "Báo cáo ngày", date: "27/03/2024", time: "17:01", recipients: 15, openRate: 85, status: "success" },
    { id: "2", templateName: "Báo cáo ngày", date: "26/03/2024", time: "17:00", recipients: 15, openRate: 90, status: "success" },
    { id: "3", templateName: "Báo cáo tuần", date: "24/03/2024", time: "09:00", recipients: 45, openRate: 60, status: "error" },
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/media/reports")}><ArrowBack /></IconButton>
        <Typography variant="h5" fontWeight="bold">Lịch sử Gửi Báo cáo</Typography>
      </Stack>

      <Card elevation={1}>
        <CardContent>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên Báo cáo</TableCell>
                  <TableCell>Ngày Gửi</TableCell>
                  <TableCell>Giờ Gửi</TableCell>
                  <TableCell>Số người nhận</TableCell>
                  <TableCell>Tỷ lệ Mở</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell fontWeight="Medium">{row.templateName}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.recipients}</TableCell>
                    <TableCell>{row.openRate}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status === "success" ? "Đã gửi" : "Lỗi gửi"} 
                        color={row.status === "success" ? "success" : "error"} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" color="primary"><Visibility fontSize="small" /></IconButton>
                        <IconButton size="small" color="warning" disabled={row.status === "success"}><Replay fontSize="small" /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined">Tải thêm lịch sử</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
