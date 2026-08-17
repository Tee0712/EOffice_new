import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import announcementService from "@services/announcementService";

const AnnouncementDetailLanding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveRoute = async () => {
      try {
        const res = await announcementService.getUserInbox({ page: 1, limit: 1 });
        const payload = res?.items ? res : res?.data || {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const firstId = items?.[0]?.id;
        if (firstId) {
          navigate(`/user/announcements/${firstId}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error("AnnouncementDetailLanding error:", error);
      } finally {
        setLoading(false);
      }
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
          Hộp thư chưa có thông báo để xem chi tiết
        </Typography>
        <Button variant="contained" onClick={() => navigate("/user/inbox")}>
          Quay về hộp thư
        </Button>
      </Stack>
    </Box>
  );
};

export default AnnouncementDetailLanding;
