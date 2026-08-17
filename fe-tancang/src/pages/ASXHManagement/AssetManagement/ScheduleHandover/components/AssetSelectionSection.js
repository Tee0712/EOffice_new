import React from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Stack,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton
} from "@mui/material";

const STATUS_MAP = {
  RECEIVED: { label: "Đã tiếp nhận", color: "#10b981", bg: "#ecfdf5" },
  PURCHASED: { label: "Đã mua", color: "#0891b2", bg: "#ecfeff" },
  PENDING: { label: "Đang mua sắm", color: "#f59e0b", bg: "#fff7ed" },
  PURCHASING: { label: "Đang mua sắm", color: "#f59e0b", bg: "#fff7ed" },
  DRAFT: { label: "Nháp", color: "#64748b", bg: "#f1f5f9" },
};

const AssetSelectionSection = ({ assets = [], selectedIds = [], onToggle, loading, bookedAssetIds = [] }) => {
  const getStatus = (status) => STATUS_MAP[status] || { label: "Chưa mua", color: "#94a3b8", bg: "#f8fafc" };

  const totalValue = (Array.isArray(assets) ? assets : [])
    .filter(a => selectedIds?.includes(a.id))
    .reduce((sum, a) => sum + (a.value_total || a.total_price || (a.unitPrice || a.unit_price || 0) * a.quantity), 0);

  const selectedCount = selectedIds.length;
  const totalUnits = (Array.isArray(assets) ? assets : [])
    .filter(a => selectedIds.includes(a.id))
    .reduce((s, a) => s + (a.quantity || 0), 0);

  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ 
              width: 28, height: 28, borderRadius: "50%", bgcolor: "#3b82f6", 
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.75rem"
            }}>
              2
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "16px" }}>
              Hiện vật bàn giao trong đợt này
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Tick chọn các hạng mục sẽ bàn giao
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ borderTop: "1px solid #f1f5f9" }}>
        {loading ? (
          <Box sx={{ p: 2 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} height={60} />)}</Box>
        ) : assets.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "#94a3b8" }}>Chưa có hiện vật nào khả dụng.</Box>
        ) : (
          <Stack>
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              
              // Use the computed bookedAssetIds from the parent
              const isBooked = bookedAssetIds.includes(asset.id);
              
              const isDelivered = asset.status === "DELIVERED";
              const status = getStatus(asset.status);
              
              // If it's already in another handover, we disable it
              const disabled = isBooked || (isDelivered && !isSelected);
              
              return (
                <Box 
                  key={asset.id} 
                  onClick={() => {
                    if (disabled) return;
                    const newIds = isSelected 
                      ? selectedIds.filter(id => id !== asset.id)
                      : [...selectedIds, asset.id];
                    onToggle(newIds);
                  }}
                  sx={{ 
                    p: 2, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 2,
                    cursor: disabled ? "default" : "pointer",
                    borderBottom: "1px solid #f8fafc",
                    bgcolor: isSelected ? "#fcfcfc" : "transparent",
                    opacity: disabled ? 0.6 : 1,
                    filter: disabled ? "grayscale(0.5)" : "none",
                    position: "relative",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: disabled ? "transparent" : "#f8fafc" },
                    "&:last-child": { borderBottom: "none" }
                  }}
                >
                  <Checkbox 
                    checked={isSelected || isBooked}
                    disabled={disabled}
                    sx={{ 
                      color: "#e2e8f0",
                      "&.Mui-checked": { color: disabled ? "#94a3b8" : "#f97316" },
                      p: 0
                    }}
                  />
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 700, 
                      color: isBooked ? "#94a3b8" : (isSelected ? "#1e293b" : "#64748b"),
                      transition: "color 0.2s"
                    }}>
                      {asset.name}
                      {isBooked && (
                        <Box component="span" sx={{ 
                          ml: 1, px: 0.8, py: 0.2, bgcolor: "#fee2e2", color: "#ef4444",
                          borderRadius: "4px", fontSize: "0.6rem", textTransform: "uppercase",
                          fontWeight: 700
                        }}>
                          Đã nằm trong lịch khác
                        </Box>
                      )}
                      {(isDelivered && !isBooked) && (
                        <Box component="span" sx={{ 
                          ml: 1, px: 0.8, py: 0.2, bgcolor: "#ecfdf5", color: "#10b981",
                          borderRadius: "4px", fontSize: "0.6rem", textTransform: "uppercase"
                        }}>
                          Đã bàn giao
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.25 }}>
                      {asset.specifications?.length > 0
                        ? asset.specifications.map(s => `${s.parameterName || s.key}: ${s.value}`).join(" / ")
                        : (asset.description || "N/A")}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={3} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected || isBooked ? "#1e293b" : "#cbd5e1" }}>
                      ×{asset.quantity}
                    </Typography>
                    <Chip 
                      label={isBooked && asset.status === "DELIVERED" ? "Đã bàn giao" : status.label} 
                      size="small" 
                      sx={{ 
                        bgcolor: isBooked ? "#f1f5f9" : status.bg, 
                        color: isBooked ? "#64748b" : status.color, 
                        fontWeight: 700, 
                        fontSize: "0.65rem", 
                        height: "24px",
                        borderRadius: "6px",
                        opacity: isSelected || isBooked ? 1 : 0.6
                      }} 
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Footer Summary */}
      <Box sx={{ 
        p: 2, 
        px: 3,
        bgcolor: "#f1f5f9", 
        borderTop: "1px solid #e2e8f0",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center"
      }}>
        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
          Đã chọn <Box component="span" sx={{ color: "#1e293b" }}>{selectedCount} hạng mục</Box> · 
          <Box component="span" sx={{ color: "#1e293b", ml: 0.5 }}>{totalUnits} đơn vị</Box>
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#f97316", fontSize: "1.1rem" }}>
          {new Intl.NumberFormat("vi-VN").format(totalValue)} VNĐ
        </Typography>
      </Box>
    </Paper>
  );
};

export default AssetSelectionSection;
