import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import announcementService from "@services/announcementService";

const AnnouncementStatsLanding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const resolveRoute = async () => {
      try {
        const res = await announcementService.getAdminAnnouncements({ page: 1, limit: 1 });
        const payload = res?.items ? res : res?.data || {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const firstId = items?.[0]?.id;
        if (firstId) {
          navigate(`/admin/announcements/${firstId}/stats`, { replace: true });
          return;
        }
      } catch (error) {
        console.error("AnnouncementStatsLanding error:", error);
      } finally {
        setLoading(false);
      }
      setHasData(false);
    };
    resolveRoute();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 5 }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" fontWeight={700}>
          Chưa có thông báo để xem màn chi tiết admin
        </Typography>
        <Button variant="contained" onClick={() => navigate("/admin/announcements/create")}>
          Tạo thông báo mới
        </Button>
      </Stack>
    </Box>
  );
};

export default AnnouncementStatsLanding;
