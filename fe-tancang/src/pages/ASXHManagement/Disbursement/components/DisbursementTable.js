import React, { useState } from "react";
import { 
  Visibility as ViewIcon, 
  CloudDownload as DownloadIcon, 
  Edit as EditIcon,
  CheckCircleOutline as ApproveIcon,
  InfoOutlined as InfoIcon,
  DescriptionOutlined as ExcelIcon,
  MoreVert as MoreIcon,
  Check as CheckIcon,
  Close as RejectIcon
} from "@mui/icons-material";
import { 
  Stack,
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Paper,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Menu,
  MenuItem
} from "@mui/material";
import { 
  SkyTableContainer, 
  SkyTable, 
  SkyTableHead, 
  SkyTableBody, 
  SkyTableRow, 
  SkyTableCell,
  SkyTypography 
} from "@styles/SkyStyles";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import asxhService from "@services/asxhService";
import workflowWizardService from "@services/workflowWizardService";
import { toast } from "react-toastify";
import { AuthContext } from "@AuthContext/AuthProvider";
import { useContext, useEffect } from "react";

const STATUS_MAP = {
  draft: { label: "Bản nháp", bgcolor: "#f1f5f9", textColor: "#64748b", border: "1px solid #e2e8f0" },
  pending_approval: { label: "Chờ duyệt", bgcolor: "#fff7ed", textColor: "#c2410c", border: "1px solid #ffedd5" },
  approved: { label: "Đã duyệt", bgcolor: "#eff6ff", textColor: "#1d4ed8", border: "1px solid #dbeafe" },
  disbursed: { label: "Đã chi", bgcolor: "#f0fdf4", textColor: "#15803d", border: "1px solid #dcfce7" },
  completed: { label: "Hoàn thành", bgcolor: "#f0fdf4", textColor: "#16a34a", border: "1px solid #dcfce7" },
  rejected: { label: "Từ chối", bgcolor: "#fef2f2", textColor: "#dc2626", border: "1px solid #fee2e2" },
};

const DisbursementTable = ({ items = [], onSelectBatch, onViewDetail, selectedId, onRefresh, totalBudget = 2400000000, programId = "7" }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [workflowCache, setWorkflowCache] = useState({});

  useEffect(() => {
    // Pre-fetch workflow details for all items in the table
    const fetchWorkflows = async () => {
      const keys = [...new Set(items.map(item => item.workflow_key || item.workflowKey).filter(Boolean))];
      const newCache = { ...workflowCache };
      let changed = false;

      for (const key of keys) {
        if (!newCache[key]) {
          try {
            const res = await workflowWizardService.getDetail(key);
            if (res.success && res.data) {
              newCache[key] = res.data;
              changed = true;
            }
          } catch (err) {
             console.error(`Failed to fetch workflow ${key}:`, err);
          }
        }
      }
      if (changed) setWorkflowCache(newCache);
    };
    if (items.length > 0) fetchWorkflows();
  }, [items]);

  // Strict step↔status mapping (must match backend STEP_STATUS_MAP)
  const STEP_STATUS_MAP = {
    2: { validStatuses: ['PENDING_APPROVAL'], nextStatus: 'APPROVED' },
    3: { validStatuses: ['APPROVED'], nextStatus: 'DISBURSED' },
    4: { validStatuses: ['DISBURSED'], nextStatus: 'COMPLETED' },
  };

  // Derive correct step from status (fixes legacy data with wrong step in DB)
  const STATUS_TO_STEP = {
    'DRAFT': 1, 'DRAFF': 1, 'REJECTED': 1,
    'PENDING_APPROVAL': 2,
    'APPROVED': 3,
    'DISBURSED': 4,
    'COMPLETED': 5,
  };
  const deriveStepFromStatus = (item) => {
    const status = (item.status || 'DRAFT').toUpperCase();
    const dbStep = item.current_step_order || item.currentStepOrder || 1;
    const expectedStep = STATUS_TO_STEP[status];
    return (expectedStep && expectedStep !== dbStep) ? expectedStep : dbStep;
  };

  const checkPermission = (item, action) => {
    if (!user?.user || !item) return false;
    const status = (item.status || "DRAFT").toUpperCase();
    const rolesByProcess = user.user.roles_by_process || [];
    
    const normalize = (str) => {
      const removeAccents = (s) => s?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') || "";
      return removeAccents(str?.toString().toUpperCase().replace(/_/g, "").replace(/\s/g, ""));
    };

    const wk = item.workflow_key || item.workflowKey;
    const config = workflowCache[wk];
    if (!config) return false;

    const targetKey = normalize(wk);
    const userProcess = rolesByProcess.find(p => normalize(p.processKey) === targetKey || normalize(p.name) === targetKey);
    if (!userProcess || !userProcess.roles) return false;

    const hasRoleForStep = (stepOrder) => {
      const step = config.steps?.find(s => s.stepOrder === stepOrder);
      if (!step) return false;
      const requiredRole = normalize(step.roleCode);
      return userProcess.roles.some(r => {
        const rCode = normalize(r.roleCode);
        const rName = normalize(r.name || r.roleName);
        return rCode === requiredRole || rName === requiredRole;
      });
    };

    if (action === 'edit' || action === 'delete') {
      // Step 1: Only edit/delete DRAFT or REJECTED
      if (!['DRAFT', 'DRAFF', 'REJECTED'].includes(status)) return false;
      return hasRoleForStep(1);
    }

    if (action === 'approve') {
      if (status === 'COMPLETED') return false;
      const currentStepOrder = deriveStepFromStatus(item);
      const stepMapping = STEP_STATUS_MAP[currentStepOrder];
      if (!stepMapping) return false;
      if (!stepMapping.validStatuses.includes(status)) return false;
      return hasRoleForStep(currentStepOrder);
    }

    return false;
  };

  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);
  const totalDisbursed = items.reduce((acc, curr) => acc + (curr.amount_total || 0), 0);

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const handleActionMenuOpen = (event, item) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setActiveItem(item);
    }
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setActiveItem(null);
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    handleActionMenuClose();
    setProcessingId(id);
    try {
      const res = await asxhService.updateDisbursementStatus(id, nextStatus);
      if (res.success) {
        toast.success(nextStatus === "REJECTED" ? "Đã từ chối đợt giải ngân" : "Cập nhật trạng thái thành công");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      toast.error("Lỗi khi kết nối máy chủ");
    } finally {
      setProcessingId(null);
    }
  };

  const getNextStatus = (item) => {
    if (!item) return null;
    const currentStepOrder = deriveStepFromStatus(item);
    const stepMapping = STEP_STATUS_MAP[currentStepOrder];
    return stepMapping ? stepMapping.nextStatus : null;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await asxhService.exportDisbursements(programId);
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BangKeGiaiNgan_${dayjs().format("DDMMYYYY")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Xuất bảng kê thành công!");
      setShowExportConfirm(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Có lỗi xảy ra khi xuất bảng kê.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Paper sx={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0px 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
      <SkyTableContainer>
        <SkyTable>
          <SkyTableHead sx={{ bgcolor: "#F8FAFC" }}>
            <SkyTableRow>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }}>MÃ ĐỢT</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }}>NỘI DUNG</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }}>ĐƠN VỊ NHẬN</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }} align="right">SỐ TIỀN</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }} align="center">NGÀY CHUYỂN</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }} align="center">BIÊN BẢN / CHỨNG TỪ</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }} align="center">TRẠNG THÁI</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 13, py: 1.5 }} align="center">THAO TÁC</SkyTableCell>
            </SkyTableRow>
          </SkyTableHead>
          <SkyTableBody>
            {items.map((item, index) => {
              const status = (item.status || "DRAFT").toUpperCase();
              const statusKey = status.toLowerCase();
              const statusInfo = STATUS_MAP[statusKey] || { label: item.status, bgcolor: "#f1f5f9", textColor: "#64748b" };
              
              const hasBienBan = item.attachments?.some(a => a.docType === "BIEN_BAN" || a.doc_type === "BIEN_BAN");
              const hasUNC = item.attachments?.some(a => a.docType === "UNC" || a.doc_type === "UNC");
              const hasHopDong = item.attachments?.some(a => a.docType === "HOP_DONG" || a.doc_type === "HOP_DONG");
              const hasDuToan = item.attachments?.some(a => a.docType === "DU_TOAN" || a.doc_type === "DU_TOAN");
              const hasAny = item.attachments && item.attachments.length > 0;

              return (
                <SkyTableRow 
                  key={item.id} 
                  hover 
                  selected={selectedId === item.id}
                  onClick={() => onSelectBatch(item.id)}
                  sx={{ 
                    cursor: "pointer", 
                    transition: "all 0.2s ease",
                    bgcolor: selectedId === item.id ? "#F1F5F9" : "inherit",
                    "& .MuiTableCell-root": { py: 2.5, borderBottom: "1px solid #f1f5f9" },
                    "&:hover": { bgcolor: "#f8fafc" }
                  }}
                >
                  <SkyTableCell>
                    <SkyTypography variant="body2" sx={{ color: "#3B82F6", fontWeight: 700, fontSize: "13px" }}>
                      {item.code || `GN-001/0${index + 1}`}
                    </SkyTypography>
                  </SkyTableCell>
                  <SkyTableCell>
                    <SkyTypography variant="body2" sx={{ color: "#1E293B", fontWeight: 600, fontSize: "14px" }}>
                      {item.disbursement_content}
                    </SkyTypography>
                    {item.detailed_description && (
                      <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", fontSize: "11.5px", mt: 0.5 }}>
                        {item.detailed_description}
                      </Typography>
                    )}
                  </SkyTableCell>
                  <SkyTableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="#1E293B" sx={{ fontSize: "14px" }}>
                        {item.receiving_unit || item.receiver?.name || "Chưa xác định"}
                      </Typography>
                      { (item.bank_account_number || item.receiver?.bank_account_number) && (
                        <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", fontSize: "11px", mt: 0.5 }}>
                          STK: {item.bank_account_number || item.receiver?.bank_account_number || "---"} — {item.bank_name || item.receiver?.bank_name || "Ngân hàng"}
                        </Typography>
                      )}
                    </Box>
                  </SkyTableCell>
                  <SkyTableCell align="right">
                    <Typography variant="body2" fontWeight={800} color="#1E293B" sx={{ fontSize: "14px" }}>
                      {formatCurrency(item.amount_total)}
                    </Typography>
                  </SkyTableCell>
                  <SkyTableCell align="center">
                    <Typography 
                      variant="body2" 
                      color={(statusKey === "pending_approval" || statusKey === "draft") ? "#F59E0B" : "#1E293B"} 
                      sx={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      {item.expected_transfer_date ? (
                        (statusKey === "pending_approval" || statusKey === "draft") 
                          ? `Dự kiến ${dayjs(item.expected_transfer_date).format("DD/MM")}`
                          : dayjs(item.expected_transfer_date).format("DD/MM/YYYY")
                      ) : (
                         statusKey === "draft" ? `Dự kiến T${dayjs().format("M/YYYY")}` : "---"
                      )}
                    </Typography>
                  </SkyTableCell>
                  <SkyTableCell align="center">
                    <Stack direction="row" spacing={0.7} justifyContent="center" flexWrap="wrap">
                      {hasBienBan ? (
                        <Chip 
                          label="✓ Biên bản ký" 
                          size="small" 
                          sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#ecfdf5", color: "#059669", fontWeight: 700, border: "1px solid #10b981" }} 
                        />
                      ) : (
                        <Chip 
                          label="! Chưa ký BB" 
                          size="small" 
                          sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#fff1f2", border: "1px dashed #ef4444", color: "#ef4444", fontWeight: 700 }} 
                        />
                      )}
                      {hasUNC && (
                        <Chip 
                          label="✓ UNC" 
                          size="small" 
                          sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#ecfdf5", color: "#059669", fontWeight: 700, border: "1px solid #10b981" }} 
                        />
                      )}
                      {hasHopDong && (
                        <Chip 
                          label="Hợp đồng" 
                          size="small" 
                          sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }} 
                        />
                      )}
                      {hasDuToan && (
                        <Chip 
                          label="Dự toán" 
                          size="small" 
                          sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }} 
                        />
                      )}
                      {!hasAny && (
                        <Chip label="Chưa có" size="small" sx={{ fontSize: "10.5px", height: "22px", bgcolor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }} />
                      )}
                    </Stack>
                  </SkyTableCell>
                  <SkyTableCell align="center">
                    <Chip 
                      label={statusInfo.label}
                      size="small"
                      sx={{ 
                        fontSize: "11.5px", fontWeight: 700, height: "26px", px: 0.5,
                        bgcolor: statusInfo.bgcolor,
                        color: statusInfo.textColor,
                        border: statusInfo.border || "none"
                      }}
                    />
                  </SkyTableCell>
                  <SkyTableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {checkPermission(item, 'edit') ? (
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" sx={{ color: "#3b82f6", "&:hover": { bgcolor: "#eff6ff" } }} onClick={() => navigate(`/asxh/programs/${programId || item.program_id || '7'}/disbursement/edit/${item.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" sx={{ color: "#94A3B8", "&:hover": { bgcolor: "#f1f5f9" } }} onClick={() => onViewDetail(item.id)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {['PENDING_APPROVAL', 'APPROVED', 'DISBURSED'].includes(status) && checkPermission(item, 'approve') && (
                        <Tooltip title="Phê duyệt / Từ chối">
                          <IconButton size="small" sx={{ color: "#10b981", "&:hover": { bgcolor: "#ecfdf5" } }} onClick={(e) => handleActionMenuOpen(e, item)}>
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {processingId === item.id ? (
                        <CircularProgress size={20} sx={{ m: 1 }} />
                      ) : (
                        <>
                          {(status === "COMPLETED" || status === "REJECTED") && (
                            <Tooltip title="Tải hồ sơ">
                              <IconButton size="small" sx={{ color: "#94A3B8" }}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </Stack>
                  </SkyTableCell>
                </SkyTableRow>
              );
            })}
            {items.length === 0 && (
              <SkyTableRow>
                <SkyTableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="#94A3B8" fontWeight={500}>Chưa có đợt giải ngân nào được tạo</Typography>
                </SkyTableCell>
              </SkyTableRow>
            )}
          </SkyTableBody>
        </SkyTable>
      </SkyTableContainer>

      <Divider />
      
      <Box sx={{ p: 2, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc" }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748B" }}>
          Tổng {items.length} đợt · Giải ngân: 
          <Box component="span" sx={{ color: "#10B981", mx: 0.8, fontWeight: 800 }}>{formatCurrency(totalDisbursed)} VNĐ</Box> / 
          <Box component="span" sx={{ ml: 0.5, color: "#1E293B" }}>{formatCurrency(totalBudget)} VNĐ</Box>
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={() => setShowExportConfirm(true)}
          sx={{ 
            textTransform: "none", 
            fontWeight: 700, 
            borderRadius: "10px", 
            bgcolor: "#fff",
            borderColor: "#E2E8F0",
            color: "#475569",
            px: 2,
            py: 0.8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" }
          }}
        >
          Xuất bảng kê
        </Button>
      </Box>

      <Dialog 
        open={showExportConfirm} 
        onClose={() => !isExporting && setShowExportConfirm(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 400 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ bgcolor: "#eff6ff", p: 1, borderRadius: "50%", display: "flex" }}>
            <ExcelIcon sx={{ color: "#3b82f6" }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>Xác nhận xuất bảng kê</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Bạn có chắc chắn muốn xuất dữ liệu của <strong>{items.length} đợt giải ngân</strong> này ra file Excel? Hệ thống sẽ tạo bảng kê chi tiết dựa trên nội dung hiện tại của chương trình.
          </Typography>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: 2, alignItems: "center" }}>
            <InfoIcon sx={{ color: "#64748b", fontSize: 20 }} />
            <Typography variant="caption" color="#475569">
              File sẽ được tải xuống tự động dưới định dạng .xlsx sau khi quá trình xử lý hoàn tất.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setShowExportConfirm(false)} 
            disabled={isExporting}
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            variant="contained"
            sx={{ 
              textTransform: "none", bgcolor: "#3b82f6", fontWeight: 700, borderRadius: "10px", px: 3,
              "&:hover": { bgcolor: "#2563eb" }
            }}
          >
            {isExporting ? <CircularProgress size={20} color="inherit" /> : "Xác nhận xuất file"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: { borderRadius: "12px", mt: 1, boxShadow: "0px 10px 25px rgba(0,0,0,0.1)", minWidth: 150 }
        }}
      >
        <MenuItem 
          onClick={() => handleStatusUpdate(activeItem?.id, getNextStatus(activeItem))}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <CheckIcon sx={{ color: "#10b981", fontSize: 20 }} />
          <Typography variant="body2" fontWeight={700} color="#1e293b">Phê duyệt</Typography>
        </MenuItem>
        
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem 
          onClick={() => handleStatusUpdate(activeItem?.id, "REJECTED")}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <RejectIcon sx={{ color: "#ef4444", fontSize: 20 }} />
          <Typography variant="body2" fontWeight={700} color="#ef4444">Từ chối</Typography>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default DisbursementTable;
