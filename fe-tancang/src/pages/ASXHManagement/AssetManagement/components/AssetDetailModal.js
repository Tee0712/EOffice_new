import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Handyman as SpecIcon,
  Store as VendorIcon,
  Attachment as FileIcon,
} from "@mui/icons-material";
import { useToast } from "@components/common/ToastProvider";
import asxhService from "@services/asxhService";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "---") return "---";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD/MM/YYYY") : dateStr;
};

const StatusBadge = ({ status }) => {
  const STATUS_MAP = {
    RECEIVED: { label: "Đã tiếp nhận", color: "#10b981", bg: "#f0fdf4" },
    IN_PROCUREMENT: { label: "Đang mua sắm", color: "#f97316", bg: "#fff7ed" },
    PURCHASED: { label: "Đã mua", color: "#0891b2", bg: "#ecfeff" },
    SHIPPING: { label: "Đang vận chuyển", color: "#ea580c", bg: "#fff7ed" },
    DELIVERED: { label: "Đã bàn giao", color: "#7c3aed", bg: "#f5f3ff" },
  };
  const config = STATUS_MAP[status] || {
    label: status,
    color: "#64748b",
    bg: "#f1f5f9",
  };
  return (
    <Box
      sx={{
        px: 2,
        py: 0.5,
        borderRadius: "50px",
        fontSize: "0.875rem",
        fontWeight: 700,
        bgcolor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
    >
      {config.label}
    </Box>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      {Icon && <Icon sx={{ fontSize: "1rem", color: "#64748b" }} />}
      <Typography
        variant="caption"
        sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography sx={{ color: "#1e293b", fontWeight: 700, fontSize: "1rem" }}>
      {value || "---"}
    </Typography>
  </Box>
);

const AssetDetailModal = ({ open, onClose, assetId, programId }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState(null);

  const fetchData = useCallback(async () => {
    if (!assetId) return;
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
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          "& *": {
            fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ p: 2.5, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 700, display: "block" }}
            >
              CHI TIẾT HIỆN VẬT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
              {asset?.name || "Đang tải..."}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FFFFFF" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : asset ? (
          <Grid container spacing={3}>
            {/* Main Info */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <InfoIcon sx={{ color: "#3b82f6" }} /> Thông tin cơ bản
                    </Typography>
                    <StatusBadge status={asset.status} />
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <InfoRow
                        label="Mã hiện vật"
                        value={asset.code || `HV-${assetId}`}
                      />
                      <InfoRow
                        label="Số lượng"
                        value={`${asset.quantity} ${asset.unit}`}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoRow label="Danh mục" value={asset.category} />
                      <InfoRow
                        label="Đơn giá"
                        value={`${(asset.unitPrice || asset.unit_price || 0).toLocaleString()} VNĐ`}
                      />
                    </Grid>
                  </Grid>
                  <InfoRow
                    label="Tổng giá trị"
                    value={`${(asset.quantity * (asset.unitPrice || asset.unit_price || 0)).toLocaleString()} VNĐ`}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    Mô tả chi tiết
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      color: "#475569",
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    {asset.description || "Không có mô tả"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <SpecIcon sx={{ color: "#f59e0b" }} /> Quy cách kỹ thuật
                  </Typography>
                  <Grid container spacing={1.5}>
                    {asset.specifications?.map((spec, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b", fontWeight: 700 }}
                          >
                            {spec.parameterName || spec.key}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: "#1e293b",
                              fontSize: "0.875rem",
                            }}
                          >
                            {spec.parameterValue || spec.value}
                          </Typography>
                        </Box>
                      </Grid>
                    )) || (
                      <Typography
                        sx={{ p: 2, color: "#94a3b8", fontSize: "0.875rem" }}
                      >
                        Chưa cập nhật quy cách
                      </Typography>
                    )}
                  </Grid>
                </Box>
              </Stack>
            </Grid>

            {/* Sidebar-style Info */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <VendorIcon sx={{ color: "#10b981" }} /> Nhà cung cấp
                  </Typography>
                  <InfoRow
                    label="Đơn vị cung ứng"
                    value={
                      asset.supplierRelation?.name ||
                      asset.supplier?.name ||
                      "Chưa xác định"
                    }
                  />
                  <InfoRow
                    label="Ngày dự kiến"
                    value={formatDate(
                      asset.handoverEvent?.handoverDate ||
                        asset.delivery_date ||
                        asset.requiredReceiptDate ||
                        asset.receive_date
                    )}
                  />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FileIcon sx={{ color: "#ef4444" }} /> Chứng từ & Tài liệu
                  </Typography>
                  {asset.attachments?.length > 0 ? (
                    <Stack spacing={1}>
                      {asset.attachments.map((file, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1,
                            border: "1px solid #f1f5f9",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <FileIcon
                            fontSize="small"
                            sx={{ color: "#64748b" }}
                          />
                          <Typography
                            noWrap
                            variant="body2"
                            sx={{
                              color: "#1e293b",
                              fontWeight: 600,
                              flexGrow: 1,
                            }}
                          >
                            {file.title || file.name}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      sx={{
                        color: "#94a3b8",
                        textAlign: "center",
                        py: 2,
                        fontSize: "0.875rem",
                      }}
                    >
                      Chưa có chứng từ
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="error">
              Không tìm thấy dữ liệu hiện vật.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}
      >
        <Button
          onClick={onClose}
          variant="text"
          sx={{ color: "#64748b", fontWeight: 700 }}
        >
          Đóng
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            onClose();
            navigate(`/asxh/programs/${programId}/assets/${assetId}/edit`);
          }}
          disabled={!asset}
          sx={{
            borderRadius: "10px",
            px: 3,
            bgcolor: "#7c3aed",
            "&:hover": { bgcolor: "#6d28d9" },
          }}
        >
          Chỉnh sửa hồ sơ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetDetailModal;
