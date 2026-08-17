import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, TextField, MenuItem, Button, Chip, IconButton, Divider, Checkbox, FormControlLabel } from "@mui/material";
import { ArrowBack, Send, Flag, CheckCircle, Warning } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

export default function ArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Mocks
  const [internalNote, setInternalNote] = useState("");
  const article = {
    title: "PTSC chuẩn bị thi công dự án điện gió ngoài khơi lớn nhất khu vực",
    source: "VnEconomy",
    url: "https://vneconomy.vn/ptsc-dien-gio",
    date: "27/03/2024 10:30",
    sentiment: "positive",
    status: "Cần theo dõi",
    content: "Tổng công ty Cổ phần Dịch vụ Kỹ thuật Dầu khí Việt Nam (PTSC) vừa ký kết hợp đồng thi công dự án điện gió ngoài khơi với quy mô hàng tỷ USD. Đây là dấu mốc quan trọng khẳng định năng lực của PTSC trên trường quốc tế...",
    keywords: ["PTSC", "điện gió ngoài khơi"]
  };

  const highlightContent = (text, keywords) => {
    // Basic highlighting simulation
    let highlightedText = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`(${kw})`, "gi");
      highlightedText = highlightedText.replace(regex, `<span style="background-color: yellow; font-weight: bold;">$1</span>`);
    });
    return { __html: highlightedText };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Typography variant="h5" fontWeight="bold">Chi tiết Tin tức</Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>{article.title}</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                <Typography variant="subtitle2" color="primary">{article.source}</Typography>
                <Typography variant="body2" color="text.secondary">{article.date}</Typography>
                <Chip label={article.sentiment === "positive" ? "Tích cực" : "Tiêu cực"} color="success" size="small" />
                <Button size="small" href={article.url} target="_blank">Xem trên web</Button>
              </Stack>
              <Box 
                sx={{ typography: 'body1', lineHeight: '1.8', '& span': { px: 0.5, borderRadius: 1 } }}
                dangerouslySetInnerHTML={highlightContent(article.content, article.keywords)} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Phân loại & Xử lý</Typography>
              <Stack spacing={2}>
                <TextField select label="Trạng thái" defaultValue={article.status} size="small" fullWidth>
                  <MenuItem value="Mới">Mới</MenuItem>
                  <MenuItem value="Cần theo dõi">Cần theo dõi</MenuItem>
                  <MenuItem value="Đã xử lý">Đã xử lý</MenuItem>
                </TextField>
                <TextField select label="Mức độ Khẩn" defaultValue="low" size="small" fullWidth>
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="critical">Rất cao</MenuItem>
                </TextField>
                <TextField
                  label="Ghi chú nội bộ / Hướng xử lý"
                  multiline
                  rows={4}
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  fullWidth
                />
                <Button variant="contained" startIcon={<CheckCircle />}>Lưu trạng thái & Ghi chú</Button>
                <Button variant="outlined" color="error" startIcon={<Warning />}>Leo thang xử lý (Escalate)</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Chuyển tiếp đến Phòng ban</Typography>
              <Stack>
                <FormControlLabel control={<Checkbox />} label="Ban Truyền thông & Văn hóa DB" />
                <FormControlLabel control={<Checkbox />} label="Ban Chiến lược & Đầu tư" />
                <FormControlLabel control={<Checkbox />} label="Ban Nhân sự" />
                <Button variant="outlined" startIcon={<Send />} sx={{ mt: 2 }}>Chuyển thông tin</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
