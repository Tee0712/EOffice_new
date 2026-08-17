import React from "react";
import { Box, Typography } from "@mui/material";
import { SkyTitle } from "@styles/SkyStyles";

const ASXHRegistration = () => {
  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <SkyTitle variant="h4" sx={{ mb: 3 }}>Đăng ký Chương trình ASXH</SkyTitle>
      <Typography variant="body1">
        Trang đăng ký chương trình đang được phát triển...
      </Typography>
    </Box>
  );
};

export default ASXHRegistration;
