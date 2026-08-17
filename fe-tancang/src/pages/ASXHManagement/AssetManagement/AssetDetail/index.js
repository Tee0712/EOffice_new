import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Container, 
  Stack, 
  CircularProgress, 
  Paper, 
  Typography, 
  Grid,
  Divider,
  Button,
  IconButton
} from "@mui/material";
import { 
  ArrowBack as BackIcon, 
  Edit as EditIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Handyman as SpecIcon,
  AccountBalance as BudgetIcon,
  Store as VendorIcon,
  Attachment as FileIcon
} from "@mui/icons-material";
import { useToast } from "@components/common/ToastProvider";
import asxhService from "@services/asxhService";

const StatusBadge = ({ status }) => {
  const STATUS_MAP = {
    RECEIVED: { label: "Đã tiếp nhận", color: "#10b981", bg: "#f0fdf4" },
    IN_PROCUREMENT: { label: "Đang mua sắm", color: "#f97316", bg: "#fff7ed" },
    PURCHASED: { label: "Đã mua", color: "#0891b2", bg: "#ecfeff" },
    SHIPPING: { label: "Đang vận chuyển", color: "#ea580c", bg: "#fff7ed" },
    SCHEDULED: { label: "Đã lên lịch", color: "#3b82f6", bg: "#eff6ff" },
    DELIVERED: { label: "Đã bàn giao", color: "#7c3aed", bg: "#f5f3ff" }
  };
  const config = STATUS_MAP[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
  return (
    <Box sx={{ 
      px: 2, py: 0.5, borderRadius: "50px", fontSize: "0.875rem", fontWeight: 700,
      bgcolor: config.bg, color: config.color, border: `1px solid ${config.color}40`
    }}>
      {config.label}
    </Box>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      {Icon && <Icon sx={{ fontSize: "1rem", color: "#64748b" }} />}
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </Typography>
    </Stack>
    <Typography sx={{ color: "#1e293b", fontWeight: 700, fontSize: "1rem" }}>
      {value || "---"}
    </Typography>
  </Box>
);

const ASXHAssetDetail = () => {
  const { programId, assetId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await asxhService.getAssetDetail(assetId);
      if (response?.success && response.data) {
        setAsset(response.data);
      }
    } catch (error) {
      console.error("Error fetching asset detail:", error);
      toast("Không thể tải thông tin hiện vật", "error");
    } finally {
      setLoading(false);
    }
  }, [assetId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Không tìm thấy thông tin hiện vật</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>Quay lại</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", p: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", "&:hover": { bgcolor: "#f1f5f9" } }}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>CHƯƠNG TRÌNH ASXH</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>{asset.name}</Typography>
            </Box>
          </Stack>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => navigate(`/asxh/programs/${programId}/assets/${assetId}/edit`)}
            sx={{ 
              borderRadius: "12px", px: 3, py: 1.2, bgcolor: "#7c3aed", 
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
              "&:hover": { bgcolor: "#6d28d9" }
            }}
          >
            Chỉnh sửa
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                    <InfoIcon sx={{ color: "#3b82f6" }} /> Thông tin cơ bản
                  </Typography>
                  <StatusBadge status={asset.status} />
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Mã hiện vật" value={asset.code || `HV-${assetId}`} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <InfoRow label="Số lượng" value={`${asset.quantity} ${asset.unit}`} />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoRow label="Đơn giá" value={`${(asset.unitPrice || asset.unit_price || 0).toLocaleString()} VNĐ`} />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Danh mục" value={asset.category} />
                    <InfoRow label="Tổng giá trị" value={`${(asset.quantity * (asset.unitPrice || asset.unit_price || 0)).toLocaleString()} VNĐ`} />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", mt: 2, display: "block" }}>Mô tả chi tiết</Typography>
                <Typography sx={{ mt: 1, color: "#475569", lineHeight: 1.6 }}>{asset.description || "Không có mô tả"}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <SpecIcon sx={{ color: "#f59e0b" }} /> Quy cách kỹ thuật
                </Typography>
                <Grid container spacing={2}>
                  {asset.specifications?.map((spec, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>{spec.parameterName || spec.key}</Typography>
                        <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>{spec.parameterValue || spec.value}</Typography>
                      </Box>
                    </Grid>
                  )) || <Typography sx={{ p: 2, color: "#94a3b8" }}>Chưa cập nhật quy cách</Typography>}
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <VendorIcon sx={{ color: "#10b981" }} /> Nhà cung cấp
                </Typography>
                <InfoRow label="Đơn vị cung ứng" value={asset.supplier?.name || "Chưa xác định"} />
                <InfoRow label="Báo giá đính kèm" value={asset.has_quotation ? "Đã có báo giá" : "Chưa có báo giá"} />
                <InfoRow label="Thời gian bàn giao dự kiến" value={asset.delivery_date} />
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <FileIcon sx={{ color: "#ef4444" }} /> Chứng từ & Hình ảnh
                </Typography>
                {asset.attachments?.length > 0 ? (
                  <Stack spacing={1}>
                    {asset.attachments.map((file, idx) => (
                      <Box key={idx} sx={{ p: 1, border: "1px solid #f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", gap: 1 }}>
                        <FileIcon fontSize="small" sx={{ color: "#64748b" }} />
                        <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {file.title || file.name}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ color: "#94a3b8", textAlign: "center", py: 2 }}>Chưa có chứng từ</Typography>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ASXHAssetDetail;
