import React, { useState, useRef, useContext, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  Select,
  Tooltip as MuiTooltip 
} from "@mui/material";
import { 
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckedIcon,
  Close as CloseIcon,
  Error as ErrorIcon
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useToast } from "@components/common/ToastProvider";
import { AuthContext } from "@AuthContext/AuthProvider";
import workflowWizardService from "@services/workflowWizardService";

const UploadZone = styled(Box)(({ theme }) => ({
  border: "2px dashed #00339940",
  borderRadius: "12px",
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: "#f8fafc",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: "#003399",
    backgroundColor: "#f0f4f8"
  }
}));

const DisbursementUploadPanel = ({ 
  batches = [], 
  selectedBatchId, 
  onBatchChange, 
  batchDetail, 
  onUpload, 
  onDeleteFile, 
  onSubmitApproval,
  onRejectApproval 
}) => {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState(null);

  const status = (batchDetail?.status || "").toString().trim().toUpperCase();

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
  const deriveStepFromStatus = (detail) => {
    const st = (detail?.status || 'DRAFT').toString().trim().toUpperCase();
    const dbStep = detail?.current_step_order || 1;
    const expectedStep = STATUS_TO_STEP[st];
    return (expectedStep && expectedStep !== dbStep) ? expectedStep : dbStep;
  };

  useEffect(() => {
    const fetchWF = async () => {
      const wk = batchDetail?.workflow_key || batchDetail?.workflowKey;
      try {
        const res = await workflowWizardService.getDetail(wk);
        if (res.data) setWorkflowConfig(res.data);
      } catch (err) {
        console.error("Failed to fetch workflow in UploadPanel:", err);
      }
    };
    fetchWF();
  }, [batchDetail?.workflow_key, batchDetail?.workflowKey]);


  const { user } = useContext(AuthContext);

  const checkPermission = () => {
    if (!batchDetail || !user || !workflowConfig) return false;
    
    const curStatus = (batchDetail.status || "").toString().trim().toUpperCase();
    if (curStatus === 'COMPLETED') return false; 
    
    const normalize = (str) => {
      const removeAccents = (s) => s?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') || "";
      return removeAccents(str?.toString().toUpperCase().replace(/_/g, "").replace(/\s/g, ""));
    };

    const wk = batchDetail?.workflow_key || batchDetail?.workflowKey || "";
    const userData = user?.user || user;
    const rolesByProcess = userData.rolesByProcess || userData.roles_by_process || [];
    const targetKey = normalize(wk);
    const userProcess = rolesByProcess.find(p => 
      normalize(p.processKey) === targetKey || 
      normalize(p.name) === targetKey
    );
    if (!userProcess || !userProcess.roles) return false;

    const hasRoleForStep = (stepOrder) => {
      const step = workflowConfig.steps?.find(s => s.stepOrder === stepOrder);
      if (!step) return false;
      const requiredRole = normalize(step.roleCode);
      return userProcess.roles.some(r => {
        const rCode = normalize(r.roleCode);
        const rName = normalize(r.name || r.roleName);
        return rCode === requiredRole || rName === requiredRole;
      });
    };

    // Step 1 user: can submit DRAFT/REJECTED batches
    if (['DRAFT', 'DRAFF', 'REJECTED'].includes(curStatus)) {
      return hasRoleForStep(1);
    }

    // Steps 2-4: derive step from status (fixes legacy data)
    const currentStepOrder = deriveStepFromStatus(batchDetail);
    const stepMapping = STEP_STATUS_MAP[currentStepOrder];
    if (!stepMapping) return false;
    if (!stepMapping.validStatuses.includes(curStatus)) return false;
    return hasRoleForStep(currentStepOrder);
  };

  const hasPermission = checkPermission();

  const getButtonLabel = () => {
    if (!batchDetail || !workflowConfig) return "Chọn một đợt để thao tác";
    
    const curStatus = (batchDetail.status || "").toString().trim().toUpperCase();
    if (curStatus === 'COMPLETED') return null;

    if (curStatus === 'DRAFT' || curStatus === 'DRAFF' || curStatus === 'REJECTED') return "Xác nhận & Gửi phê duyệt";
    if (curStatus === 'PENDING_APPROVAL') return "Xác nhận & Phê duyệt";
    if (curStatus === 'APPROVED') return "Xác nhận & Chuyển chi";
    if (curStatus === 'DISBURSED') return "Xác nhận & Hoàn thành";

    return "Xác nhận & Chuyển bước";
  };

  const isLocked = batchDetail && batchDetail.status === "COMPLETED";

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPending = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        doc_type: "BIEN_BAN",
        name: file.name
      }));
      setPendingFiles(prev => [...prev, ...newPending]);
      e.target.value = null;
    }
  };

  const updatePendingDocType = (id, newType) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, doc_type: newType } : f));
  };

  const removePendingFile = (id) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFinalSubmit = async () => {
    if (isProcessing) return;
    
    // Direct execution: Upload then Approve
    await executeSubmit('APPROVE');
  };

  const executeSubmit = async (actionType) => {
    setIsProcessing(true);
    try {
      if (pendingFiles.length > 0) {
        const res = await onUpload(pendingFiles);
        if (res.success) {
          setPendingFiles([]);
        } else {
          toast(res.message || "Tải tài liệu thất bại. Vui lòng kiểm tra lại.", "error");
          setIsProcessing(false);
          return;
        }
      }
      
      if (actionType === 'REJECT') {
        await onRejectApproval(batchDetail?.id || selectedBatchId);
      } else {
        await onSubmitApproval(batchDetail?.id || selectedBatchId);
      }
    } catch (error) {
      console.error("Submission sequence failed:", error);
      toast("Lỗi khi xử lý", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const docTypes = [
    { value: "BIEN_BAN", label: "Biên bản ký" },
    { value: "UNC", label: "UNC" },
    { value: "HOP_DONG", label: "Hợp đồng" },
    { value: "DU_TOAN", label: "Dự toán" },
    { value: "ANH_TIEN_DO", label: "Ảnh tiến độ" },
  ];

  const getDocTypeInfo = (type) => {
    switch (type) {
      case "BIEN_BAN": return { label: "Biên bản ký", color: "#fef3c7", textColor: "#b45309", badgeColor: "#eff6ff", badgeBorder: "#3b82f6", badgeTextColor: "#3b82f6" };
      case "UNC": return { label: "UNC", color: "#dcfce7", textColor: "#15803d", badgeColor: "#f0fdf4", badgeBorder: "#22c55e", badgeTextColor: "#22c55e" };
      case "HOP_DONG": return { label: "Hợp đồng", color: "#e0f2fe", textColor: "#0369a1", badgeColor: "#eff6ff", badgeBorder: "#3b82f6", badgeTextColor: "#3b82f6" };
      case "DU_TOAN": return { label: "Dự toán", color: "#f3e8ff", textColor: "#7e22ce", badgeColor: "#f5f3ff", badgeBorder: "#8b5cf6", badgeTextColor: "#8b5cf6" };
      case "ANH_TIEN_DO": return { label: "Ảnh tiến độ", color: "#ffedd5", textColor: "#c2410c", badgeColor: "#fff7ed", badgeBorder: "#f97316", badgeTextColor: "#f97316" };
      default: return { label: "Chưa phân loại", color: "#f1f5f9", textColor: "#64748b", badgeColor: "#f8fafc", badgeBorder: "#e2e8f0", badgeTextColor: "#64748b" };
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);

  const handleMenuOpen = (event, id) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setActiveFileId(id);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveFileId(null);
  };

  const handleTypeSelect = (type) => {
    updatePendingDocType(activeFileId, type);
    handleMenuClose();
  };

  return (
    <Paper sx={{ p: 3, borderRadius: "16px", display: "flex", flexDirection: "column", gap: 3, boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <UploadIcon sx={{ color: "#1e293b" }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e293b" }}>
            Tải lên biên bản / chứng từ
          </Typography>
        </Box>
      </Box>

      <FormControl fullWidth size="small">
        <Select
          value={selectedBatchId || ""}
          onChange={(e) => onBatchChange(e.target.value)}
          displayEmpty
          IconComponent={ExpandMoreIcon}
          sx={{ 
            borderRadius: "10px", 
            bgcolor: "#fff",
            "& .MuiSelect-select": { py: 1.5, fontWeight: 600 }
          }}
        >
          <MenuItem value="" disabled>Chọn đợt giải ngân..</MenuItem>
          {batches
            .map((batch, index) => (
              <MenuItem key={batch.id} value={batch.id}>
                {batch.code || `GN-001/0${index + 1}`} - {batch.disbursement_content}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          Đính kèm hồ sơ
          <Typography variant="caption" fontWeight={400} color="text.secondary">
            (Hồ sơ sẽ được tải lên khi nhấn Xác nhận)
          </Typography>
        </Typography>

        <UploadZone 
          onClick={() => !isLocked && !isProcessing && selectedBatchId && fileInputRef.current?.click()}
          sx={{ 
            opacity: (!selectedBatchId || isLocked || isProcessing) ? 0.6 : 1, 
            cursor: (!selectedBatchId || isLocked || isProcessing) ? "not-allowed" : "pointer",
            bgcolor: isLocked ? "#f1f5f9" : "#f8fafc",
            mb: 2
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            hidden 
            multiple
            onClick={(e) => e.stopPropagation()}
            onChange={handleFileSelect} 
            disabled={!selectedBatchId || isLocked || isProcessing}
          />
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1 }}>
            <UploadIcon sx={{ fontSize: 32, color: "#94a3b8", mb: 0.5 }} />
            <Typography variant="caption" fontWeight={700} color="#64748b">
              {isLocked ? "Hồ sơ đã khóa" : "Nhấn để chọn hồ sơ / biên bản"}
            </Typography>
          </Box>
        </UploadZone>

        {/* List Files */}
        <Box sx={{ flexGrow: 1, pr: 0.5 }}>
          <List dense disablePadding>
            {batchDetail?.attachments?.map((file) => {
              const docInfo = getDocTypeInfo(file.doc_type);
              return (
                <ListItem 
                  key={file.id} 
                  sx={{ bgcolor: "#f8fafc", borderRadius: "12px", mb: 1, p: "8px 12px", border: "1px solid #e2e8f0" }}
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={docInfo.label} 
                        size="small" 
                        sx={{ 
                          height: 22, fontSize: "10px", fontWeight: 700, 
                          bgcolor: docInfo.badgeColor, color: docInfo.badgeTextColor,
                          border: `1px solid ${docInfo.badgeBorder}`, borderRadius: "6px"
                        }} 
                      />
                      {!isLocked && (
                        <IconButton edge="end" size="small" onClick={() => onDeleteFile(file.id)}>
                          <CloseIcon sx={{ fontSize: "16px", color: "#94a3b8" }} />
                        </IconButton>
                      )}
                    </Stack>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box sx={{ bgcolor: "#fee2e2", p: 1, borderRadius: "10px", display: "flex" }}>
                      <PdfIcon sx={{ color: "#ef4444", fontSize: 20 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="caption" fontWeight={700} color="#1e293b" noWrap sx={{ maxWidth: 160, display: "block" }}>{file.title}</Typography>}
                    secondary={`${file.file_size_mb || "1.2"} MB • Đã tải lên`}
                    secondaryTypographyProps={{ style: { fontSize: "10px", color: "#64748b" } }}
                  />
                </ListItem>
              );
            })}

            {pendingFiles.map((file) => {
              const docInfo = getDocTypeInfo(file.doc_type);
              return (
                <ListItem 
                  key={file.id} 
                  sx={{ bgcolor: "#eff6ff44", borderRadius: "12px", mb: 1, p: "8px 12px", border: "1px dashed #3b82f6" }}
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={docInfo.label}
                        onClick={(e) => handleMenuOpen(e, file.id)}
                        sx={{ 
                          height: 22, fontSize: "10px", fontWeight: 700,
                          bgcolor: "#fff", color: "#3b82f6", border: "1px solid #3b82f6", borderRadius: "6px",
                          cursor: "pointer", "&:hover": { bgcolor: "#3b82f61a" }
                        }}
                      />
                      <IconButton edge="end" size="small" onClick={() => removePendingFile(file.id)}>
                        <CloseIcon sx={{ fontSize: "16px", color: "#94a3b8" }} />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box sx={{ bgcolor: "#ffedd5", p: 1, borderRadius: "10px", display: "flex" }}>
                      <PdfIcon sx={{ color: "#f97316", fontSize: 20 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="caption" fontWeight={700} color="#1e293b" noWrap sx={{ maxWidth: 160, display: "block" }}>{file.name}</Typography>}
                    secondary={`${(file.file.size / 1024).toFixed(1)} KB • Chờ tải lên`}
                    secondaryTypographyProps={{ style: { fontSize: "10px", color: "#3b82f6" } }}
                  />
                </ListItem>
              );
            })}
          </List>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            {docTypes.map((type) => (
              <MenuItem key={type.value} onClick={() => handleTypeSelect(type.value)} sx={{ fontSize: "12px", py: 1 }}>
                {type.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <Box sx={{ mt: "auto", pt: 2 }}>
        {hasPermission && (
          <Button 
            fullWidth 
            variant="contained" 
            disabled={!selectedBatchId || isLocked || isProcessing}
            onClick={handleFinalSubmit}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <CheckedIcon sx={{ fontSize: "20px !important" }} />}
            sx={{ 
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              textTransform: "none", 
              borderRadius: "12px", 
              py: 1.8, 
              fontWeight: 700,
              fontSize: "15px",
              boxShadow: "0px 6px 20px rgba(16, 185, 129, 0.3)", 
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": { 
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0px 8px 25px rgba(16, 185, 129, 0.4)"
              },
              "&:active": {
                transform: "translateY(0)"
              },
              "&.Mui-disabled": { 
                bgcolor: "#e2e8f0", 
                color: "#94a3b8",
                background: "#e2e8f0"
              }
            }}
          >
            {isProcessing ? "Đang xử lý..." : getButtonLabel()}
          </Button>
        )}
        <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic", textAlign: "center", display: "block", mt: 1.5 }}>
          {isLocked ? (batchDetail ? (status === 'REJECTED' ? "Đợt giải ngân này đã bị từ chối" : "Đợt giải ngân đã hoàn thành") : "* Chọn một đợt giải ngân để bắt đầu") : 
            (hasPermission ? `* Đã chọn ${pendingFiles.length} file chờ tải lên. Nhấn để cập nhật và chuyển bước.` : "Bạn không có quyền thao tác tại bước này")}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DisbursementUploadPanel;
