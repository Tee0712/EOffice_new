import React from "react";
import { Card, Box, Typography, CardContent, Divider } from "@mui/material";

const ChartCard = ({ title, extra, children, sx }) => {
  return (
    <Card
      sx={{
        borderRadius: "16px",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...sx
      }}
    >
      <Box sx={{ p: 2.5, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        {extra && <Box>{extra}</Box>}
      </Box>
      <Divider sx={{ mx: 2 }} />
      <CardContent sx={{ flexGrow: 1, p: 2.5, pt: 3 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
