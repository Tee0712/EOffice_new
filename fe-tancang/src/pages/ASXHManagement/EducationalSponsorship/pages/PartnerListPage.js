import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Stack, 
  IconButton, 
  Tooltip,
  InputAdornment,
  MenuItem,
  Button,
  Pagination,
  LinearProgress,
  Breadcrumbs,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from "@mui/material";
import { 
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  SchoolOutlined as PartnerIcon,
  VisibilityOutlined as ViewIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  Add as AddIcon,
  Description as MOUIcon,
  Close as CloseIcon,
  WarningAmber as WarningIcon,
  PauseCircleOutline as PauseIcon,
  PlayCircleOutline as PlayIcon
} from "@mui/icons-material";
import { 
  SkyTableContainer,
  SkyTable,
  SkyTableHead,
  SkyTableBody,
  SkyTableRow,
  SkyTableCell,
  SkyTextField,
  SkySelect,
  SkyFormControl,
  SkyTitle,
  SkySubmitButton
} from "@styles/SkyStyles";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import educationScholarshipService from "@services/educationScholarshipService";
import { useToast } from "@components/common/ToastProvider";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";

const LogoAvatar = styled(Avatar)(({ theme, bgcolor }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  backgroundColor: bgcolor || "#f1f5f9",
  fontSize: "14px",
  fontWeight: 700,
  color: "#fff"
}));

const STATUS_CONFIG = {
  ACTIVE: { label: "Đã ký MOU", color: "success", bgcolor: "#ecfdf5", textColor: "#10b981" },
  PENDING: { label: "Chờ ký MOU", color: "info", bgcolor: "#eff6ff", textColor: "#3b82f6" },
  NEGOTIATING: { label: "Đang thương lượng", color: "warning", bgcolor: "#fff7ed", textColor: "#f97316" },
  PAUSED: { label: "Tạm dừng", color: "warning", bgcolor: "#fffbeb", textColor: "#f59e0b" },
  DRAFT: { label: "Nháp", color: "default", bgcolor: "#f1f5f9", textColor: "#64748b" }
};

/**
 * Màn hình Danh sách Đối tác ĐH
 */
const PartnerListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await educationScholarshipService.getUniversityPartners({
        page: pagination.page,
        limit: pagination.limit,
        keyword: searchTerm,
        status: statusFilter === "all" ? "" : statusFilter
      });
      
      if (res.success) {
        setPartners(res.data.items || []);
        const total = res.data.meta?.total || res.data.pagination?.total || res.data.total || res.data.items?.length || 0;
        setPagination(prev => ({ ...prev, total }));
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      toast("Lỗi khi tải danh sách đối tác", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPartners();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPartners]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteClick = (id) => {
    setPartnerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!partnerToDelete) return;
    
    setDeleteLoading(true);
    try {
      const res = await educationScholarshipService.deletePartner(partnerToDelete);
      if (res.success) {
        toast("Xóa đối tác thành công", "success");
        fetchPartners();
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      toast("Lỗi khi xóa đối tác", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await educationScholarshipService.togglePartnerStatus(id);
      if (res.success) {
        toast(res.message, "success");
        fetchPartners();
      }
    } catch (error) {
      toast("Lỗi khi thay đổi trạng thái", "error");
    }
  };

  const normalizePartnerStatus = (status) => {
    if (!status) return "DRAFT";
    const s = String(status).toUpperCase();
    if (s === "ĐÃ KÝ MOU" || s === "ĐANG HOẠT ĐỘNG" || s === "ACTIVE") return "ACTIVE";
    if (s === "CHỜ KÝ MOU" || s === "PENDING" || s === "SUBMITTED") return "PENDING";
    if (s === "ĐANG THƯƠNG LƯỢNG" || s === "NEGOTIATING") return "NEGOTIATING";
    if (s === "TẠM DỪNG" || s === "PAUSED" || s === "INACTIVE") return "PAUSED";
    if (s === "NHÁP" || s === "DRAFT") return "DRAFT";
    return s;
  };

  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
  };

  const getLogoInfo = (logoPath, shortName) => {
    let imageUrl = logoPath;
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${APP_BASE}/${imageUrl}`;
    }

    if (logoPath) return { text: shortName || "UN", image: imageUrl };
    const text = shortName || "UN";
    const colors = ["#0056b3", "#e30613", "#00a651", "#7c3aed", "#db2777"];
    const charCode = text.charCodeAt(0);
    return { text: text.substring(0, 2).toUpperCase(), color: colors[charCode % colors.length] };
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => navigate("/asxh/educational-sponsorship")}
              sx={{ color: "#64748b", bgcolor: "#fff", border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <SkyTitle variant="h4" sx={{ color: "#1e293b", fontSize: "1.75rem", mb: 0 }}>
              Danh sách đối tác ĐH
            </SkyTitle>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Xem và quản lý thông tin các trường đại học hợp tác (Tất cả các năm)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: "#2563eb", 
            textTransform: "none", 
            borderRadius: "10px",
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: "none",
            "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" }
          }}
          onClick={() => navigate("/asxh/educational-sponsorship/partner/add")}
        >
          Thêm đối tác
        </Button>
      </Box>

      <Paper sx={{ borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "none" }}>
        {/* Header Filter Section */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PartnerIcon sx={{ color: "#475569" }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
              Tất cả đối tác ({pagination.total})
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1.5}>
            <SkyTextField
              size="small"
              placeholder="Tìm tên trường, mã trường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 250, my: 0, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
            />
            <SkyFormControl size="small" sx={{ width: 160 }}>
              <SkySelect 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty 
                size="small" 
                sx={{ borderRadius: '6px' }}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </SkySelect>
            </SkyFormControl>
          </Stack>
        </Box>

        {/* Table Section */}
        <Box sx={{ position: "relative" }}>
          {loading && (
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
              <LinearProgress sx={{ height: 2 }} />
            </Box>
          )}
          <SkyTableContainer sx={{ boxShadow: "none", borderRadius: 0, opacity: loading ? 0.6 : 1 }}>
            <SkyTable>
              <SkyTableHead sx={{ bgcolor: "#f1f5f9" }}>
                <SkyTableRow>
                  <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Trường đại học</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Mã trường</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>MOU Number</SkyTableCell>
                  <SkyTableCell align="right" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Ngân sách</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Chỉ tiêu HB</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Trạng thái</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Ngày tạo</SkyTableCell>
                  <SkyTableCell align="center" sx={{ color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Thao tác</SkyTableCell>
                </SkyTableRow>
              </SkyTableHead>
              <SkyTableBody>
                {partners.length === 0 && !loading ? (
                  <SkyTableRow>
                    <SkyTableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">Không tìm thấy đối tác nào</Typography>
                    </SkyTableCell>
                  </SkyTableRow>
                ) : (
                  partners.map((partner) => {
                    const logoInfo = getLogoInfo(partner.logo_path, partner.short_name);
                    const statusCode = normalizePartnerStatus(partner.cooperation_status || partner.status);
                    const statusInfo = STATUS_CONFIG[statusCode] || STATUS_CONFIG.ACTIVE;
                    
                    return (
                      <SkyTableRow key={partner.id} hover sx={{ "& td": { borderBottom: "1px solid #f1f5f9", py: 1.5 } }}>
                        <SkyTableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <LogoAvatar bgcolor={logoInfo.color} variant="rounded" src={logoInfo.image}>
                              {!logoInfo.image && logoInfo.text}
                            </LogoAvatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#1e293b">{partner.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{partner.address || "Chưa cập nhật địa chỉ"}</Typography>
                            </Box>
                          </Stack>
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Chip 
                            label={partner.short_name || "N/A"} 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 700, color: "#1e293b", bgcolor: "#f8fafc", borderColor: "#e2e8f0" }}
                          />
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                            <MOUIcon sx={{ fontSize: 16, color: "#64748b" }} />
                            <Typography variant="body2" color="#475569" fontWeight={500}>{partner.mou_number || "N/A"}</Typography>
                          </Stack>
                        </SkyTableCell>
                        <SkyTableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="#334155">{formatCurrency(partner.budget)}</Typography>
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Typography variant="body2" fontWeight={700} color="#10b981">{partner.slots || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Suất học bổng</Typography>
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Chip 
                            label={statusInfo.label} 
                            size="small" 
                            sx={{ 
                              height: "24px", 
                              fontWeight: 600, 
                              bgcolor: statusInfo.bgcolor, 
                              color: statusInfo.textColor,
                              fontSize: "11px"
                            }} 
                          />
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Typography variant="caption" color="#64748b" fontWeight={500}>
                            {partner.created_at ? dayjs(partner.created_at).format("DD/MM/YYYY") : "-"}
                          </Typography>
                        </SkyTableCell>
                        <SkyTableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {statusCode !== "DRAFT" && (
                              <Tooltip title={statusCode === "PAUSED" ? "Kích hoạt hợp tác" : "Tạm dừng hợp tác"}>
                                <IconButton size="small" onClick={() => handleToggleStatus(partner.id)}>
                                  {statusCode === "PAUSED" ? (
                                    <PlayIcon fontSize="small" sx={{ color: "#10b981" }} />
                                  ) : (
                                    <PauseIcon fontSize="small" sx={{ color: "#f59e0b" }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Sửa">
                              <IconButton size="small" onClick={() => navigate(`/asxh/educational-sponsorship/partner/edit/${partner.id}`)}>
                                <EditIcon fontSize="small" sx={{ color: "#3b82f6" }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa vĩnh viễn">
                              <IconButton size="small" onClick={() => handleDeleteClick(partner.id)}>
                                <DeleteIcon fontSize="small" sx={{ color: "#ef4444" }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </SkyTableCell>
                      </SkyTableRow>
                    );
                  })
                )}
              </SkyTableBody>
            </SkyTable>
          </SkyTableContainer>
        </Box>

        {/* Footer actions / Pagination */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Typography variant="caption" color="#64748b">
            Hiển thị <strong>{partners.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong tổng số <strong>{pagination.total}</strong> đối tác
          </Typography>
          
          {pagination.total > 0 && (
            <Pagination 
              count={Math.ceil(pagination.total / pagination.limit)} 
              page={pagination.page} 
              onChange={handlePageChange} 
              shape="rounded" 
              size="small"
              sx={{
                '& .MuiPaginationItem-root': {
                  bgcolor: '#fff',
                  border: '1px solid #e2e8f0',
                  '&.Mui-selected': {
                    bgcolor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }
                }
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Dialog xác nhận xóa */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700} color="#1e293b">Xác nhận xóa</Typography>
          <IconButton size="small" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box 
              sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: "50%", 
                bgcolor: "#fee2e2", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                mx: "auto",
                mb: 2
              }}
            >
              <WarningIcon sx={{ fontSize: 32, color: "#ef4444" }} />
            </Box>
            <Typography variant="body1" fontWeight={600} gutterBottom color="#ef4444">
              Xác nhận XÓA VĨNH VIỄN đối tác này?
            </Typography>
            <Box sx={{ bgcolor: "#fff1f2", p: 2, borderRadius: "8px", border: "1px solid #fecaca", mt: 1 }}>
              <Typography variant="body2" color="#b91c1c" fontWeight={700}>
                CẢNH BÁO NGUY HIỂM:
              </Typography>
              <Typography variant="body2" color="#b91c1c" sx={{ textAlign: "left", mt: 0.5 }}>
                • Toàn bộ dữ liệu trường học và ngân sách sẽ bị xóa.<br />
                • <strong>Tất cả hồ sơ ứng viên</strong> liên quan đến trường này sẽ bị xóa khỏi hệ thống.<br />
                • Thao tác này <strong>không thể khôi phục</strong>.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, borderColor: "#e2e8f0", color: "#475569", py: 1 }}
          >
            Hủy bỏ
          </Button>
          <SkySubmitButton 
            fullWidth 
            variant="contained" 
            onClick={handleConfirmDelete}
            showLoading={deleteLoading}
            sx={{ 
              borderRadius: "10px", 
              py: 1,
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" }
            }}
          >
            {deleteLoading ? "Đang xóa..." : "Xác nhận xóa"}
          </SkySubmitButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnerListPage;
