import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Stack, CircularProgress, Chip } from "@mui/material";
import { TrendingUp, WarningAmber, Assessment, Layers, Public } from "@mui/icons-material";
import mediaMonitoringService from "../../../services/mediaMonitoringService";

const kpiConfig = [
  { key: "totalMentions", label: "Tổng số lượt nhắc", icon: <Assessment color="primary" /> },
  { key: "totalPositive", label: "Tin tích cực", icon: <TrendingUp color="success" /> },
  { key: "totalNegative", label: "Tin tiêu cực", icon: <WarningAmber color="error" /> },
  { key: "activeSources", label: "Nguồn hoạt động", icon: <Public color="info" /> },
  { key: "alertsToday", label: "Cảnh báo hôm nay", icon: <Layers color="warning" /> },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Using mock data structurally since actual backend connectivity/seeded data might be pending
        const mockKpi = {
          totalMentions: 1254,
          totalPositive: 800,
          totalNegative: 45,
          activeSources: 12,
          alertsToday: 3,
          growthPercentage: 12.5,
        };
        setKpi(mockKpi);
      } catch (error) {
        console.error("Dashboard KPI query failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Dashboard Truyền thông
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {kpiConfig.map((item) => (
            <Grid item xs={12} sm={6} md={2.4} key={item.key}>
              <Card elevation={1}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.label}
                    </Typography>
                    {item.icon}
                  </Stack>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
                    {kpi?.[item.key]?.toLocaleString() || 0}
                  </Typography>
                  {item.key === "totalMentions" && (
                    <Typography variant="caption" color="success.main" sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      +{kpi?.growthPercentage}% so với tuần trước
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Placeholders for Charts per UI specs */}
          <Grid item xs={12} md={8}>
            <Card elevation={1}>
              <CardContent sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
                <Typography color="text.secondary">Biểu đồ xu hướng 30 ngày (Bar Chart Placeholder)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={1}>
              <CardContent sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
                <Typography color="text.secondary">Phân loại Sentiment (Donut Chart Placeholder)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={1}>
              <CardContent sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
                <Typography color="text.secondary">Heatmap Bản đồ nhiệt Placeholder</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={1}>
              <CardContent sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
                <Typography color="text.secondary">Tag Cloud Từ khoá Placeholder</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={1}>
              <CardContent sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
                <Typography color="text.secondary">Pie Loại nguồn Placeholder</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Cảnh báo nổi bật</Typography>
                <Stack spacing={2}>
                  <Box p={2} sx={{ bgcolor: "error.light", borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText">Từ khóa "Khủng hoảng" xuất hiện vượt ngưỡng > 10 bài/giờ</Typography>
                  </Box>
                  <Box p={2} sx={{ bgcolor: "warning.light", borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.contrastText">Bài viết tiêu cực trên báo VnExpress</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Hoạt động gần đây</Typography>
                <Stack spacing={2}>
                  <Typography variant="body2">• 10 phút trước: Hệ thống crawler thu thập 25 bài viết mới.</Typography>
                  <Typography variant="body2">• 30 phút trước: Đã gửi báo cáo ngày cho nhóm Truyền thông.</Typography>
                  <Typography variant="body2">• 2 giờ trước: Quy tắc cảnh báo "PTSC Đình công" được kích hoạt.</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
