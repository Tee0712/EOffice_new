import React from "react";
import { Box, Typography } from "@mui/material";

const FormHeader = ({ title }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "flex-start",
        fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif"
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: "#0f172a", 
            mb: 1,
            fontFamily: "inherit"
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: "text.secondary",
            maxWidth: "700px",
            lineHeight: 1.5,
            fontFamily: "inherit"
          }}
        >
          Thiết lập thông tin, ngân sách, kế hoạch và nhân sự cho chương trình an sinh xã hội
        </Typography>
      </Box>
    </Box>
  );
};

export default FormHeader;
