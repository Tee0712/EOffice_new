import React from "react";
import { 
  Box, 
  Typography, 
  Stack, 
  Paper,
  Divider
} from "@mui/material";
import { People as PeopleIcon } from "@mui/icons-material";

const VendorList = ({ suppliers }) => {
  // Use items from the summary object or fallback
  const items = suppliers?.items || [];
  const totalValue = suppliers?.total_contract_value || 0;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center" }}>
        <PeopleIcon sx={{ mr: 1, color: "#64748b" }} />
        Nhà cung cấp
      </Typography>

      <Stack spacing={2} divider={<Divider />}>
        {items.length > 0 ? (
          items.map((v, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ 
                width: 48, height: 48, borderRadius: "8px", bgcolor: "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.875rem", fontWeight: 700, color: "#64748b",
                textTransform: "uppercase"
              }}>
                {v.initials || v.supplier?.substring(0, 2) || "NC"}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {v.name || v.supplier_name || v.supplier || "Đối tác ASXH"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {v.asset_count === 1 ? "1 hạng mục" : `${v.asset_count} hạng mục`}
                </Typography>
              </Box>
  
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {(v.total_value || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.disabled">VNĐ</Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography variant="caption" sx={{ py: 2, textAlign: "center", color: "#94a3b8" }}>
            Chưa có thông tin nhà cung cấp
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Tổng giá trị hợp đồng</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b" }}>
          {totalValue.toLocaleString()} VNĐ
        </Typography>
      </Box>
    </Paper>
  );
};

export default VendorList;
