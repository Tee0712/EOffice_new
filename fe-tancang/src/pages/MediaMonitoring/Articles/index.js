import React from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, TextField, MenuItem, Button, Chip } from "@mui/material";
import { Search, FilterList, OpenInNew } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function Articles() {
  const navigate = useNavigate();
  const mockArticles = [
    { id: "1", title: "PTSC chuẩn bị thi công dự án điện gió ngoài khơi lớn nhất khu vực", source: "VnEconomy", date: "27/03/2024 10:30", sentiment: "positive", status: "Mới", keywords: ["PTSC", "Điện gió"] },
    { id: "2", title: "Lợi nhuận PTSC tăng trưởng trong quý 1/2024", source: "CafeF", date: "27/03/2024 09:15", sentiment: "positive", status: "Đã xử lý", keywords: ["PTSC", "Lợi nhuận"] },
    { id: "3", title: "Rủi ro chậm tiến độ dự án do thiếu vật tư nhập khẩu tại các tổng thầu", source: "Tuổi Trẻ", date: "26/03/2024 14:00", sentiment: "negative", status: "Cần theo dõi", keywords: ["Rủi ro", "Chậm tiến độ"] },
  ];

  const getSentimentColor = (s) => (s === "positive" ? "success" : s === "negative" ? "error" : "default");

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Danh sách Tin tức
      </Typography>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth placeholder="Tìm kiểm tiêu đề, nội dung..." size="small" InputProps={{ startAdornment: <Search color="action" /> }} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField select fullWidth size="small" label="Tình cảm">
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="positive">Tích cực</MenuItem>
                <MenuItem value="negative">Tiêu cực</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField select fullWidth size="small" label="Trạng thái">
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="new">Mới</MenuItem>
                <MenuItem value="tracking">Cần theo dõi</MenuItem>
                <MenuItem value="done">Đã xử lý</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField type="date" fullWidth size="small" label="Từ ngày" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button variant="outlined" fullWidth startIcon={<FilterList />}>Lọc</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {mockArticles.map((article) => (
          <Grid item xs={12} key={article.id}>
            <Card elevation={1} sx={{ cursor: "pointer", '&:hover': { boxShadow: 3 } }} onClick={() => navigate(`/media/articles/${article.id}`)}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: "1.1rem", mb: 1, '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                      {article.title}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight="bold">{article.source}</Typography>
                      <Typography variant="body2" color="text.secondary">• {article.date}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      {article.keywords.map(kw => <Typography key={kw} variant="caption" sx={{ bgcolor: "warning.light", color: "warning.contrastText", px: 0.5, borderRadius: 0.5 }}>{kw}</Typography>)}
                    </Stack>
                  </Box>
                  <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} alignItems={{ xs: 'center', sm: 'flex-end' }}>
                    <Chip label={article.sentiment === "positive" ? "Tích cực" : article.sentiment === "negative" ? "Tiêu cực" : "Trung tính"} color={getSentimentColor(article.sentiment)} size="small" />
                    <Chip label={article.status} variant="outlined" size="small" />
                    <Button size="small" endIcon={<OpenInNew />} onClick={(e) => { e.stopPropagation(); window.open('#', '_blank'); }}>Link Gốc</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button variant="outlined">Tải thêm</Button>
      </Box>
    </Box>
  );
}
