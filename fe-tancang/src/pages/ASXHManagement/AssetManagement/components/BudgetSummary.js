import React from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Chip 
} from "@mui/material";
import { FileDownload as ExportIcon } from "@mui/icons-material";
import { SkyBox, SkyButton } from "@styles/SkyStyles";

const BudgetSummary = ({ summary, itemsCount, onExport }) => {
  const { total_value, program_budget, remaining } = summary || {};

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          <Box component="span" sx={{ fontWeight: 700, color: "#1e293b" }}>{itemsCount || 0} hạng mục</Box> · 
          Tổng giá trị: <Box component="span" sx={{ fontWeight: 700, color: "#1e293b" }}>{total_value?.toLocaleString()} VNĐ</Box> / 
          {program_budget?.toLocaleString()} VNĐ ngân sách
        </Typography>
        
        <Chip 
          label={`Còn ${remaining?.toLocaleString()} VNĐ dự phòng`}
          sx={{ 
            bgcolor: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: "0.75rem",
            borderRadius: "4px", height: 24
          }}
        />
      </Stack>

      <Button
        variant="outlined"
        startIcon={<ExportIcon />}
        onClick={onExport}
        sx={{ 
          textTransform: "none", borderRadius: "8px", borderColor: "#e2e8f0", 
          color: "#475569", fontWeight: 600, px: 2 
        }}
      >
        Xuất danh sách
      </Button>
    </Box>
  );
};

export default BudgetSummary;
