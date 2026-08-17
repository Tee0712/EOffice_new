import React from "react";
import { Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

const VppPageHeader = ({ title, subtitle, actions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={2}
      >
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.01em",
              mb: 0.5,
              fontFamily: "'Inter', 'Roboto', sans-serif"
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontWeight: 500,
                maxWidth: 700,
                lineHeight: 1.6,
                fontFamily: "'Inter', 'Roboto', sans-serif"
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actions ? <Box>{actions}</Box> : null}
      </Stack>
    </Box>
  );
};

export default VppPageHeader;

