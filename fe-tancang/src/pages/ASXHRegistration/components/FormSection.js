import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { SkyStyles } from "@styles/SkyStyles";

const FormSection = ({ number, title, children, extra, sx = {} }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#ffffff",
        ...sx
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#2563EB",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "0.875rem"
            }}
          >
            {number}
          </Box>
          <Typography variant="h6" color="#0F172A" fontWeight="700" sx={{ fontSize: "1.1rem" }}>
            {title}
          </Typography>
        </Box>
        {extra && <Box>{extra}</Box>}
      </Box>
      <Box>
        {children}
      </Box>
    </Paper>
  );
};

export default FormSection;
