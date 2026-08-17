import React, { useState, useEffect, useCallback } from "react";
import { 
  FileDownload as ExportIcon,
  ArrowBackIosNew as BackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ListAlt as ListIcon
} from "@mui/icons-material";
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  Button, 
  Stack,
  CircularProgress,
  Grid,
  Paper,
  FormControl,
  Select,
  MenuItem,
  TextField
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { SkyTitle, SkySubmitButton } from "@styles/SkyStyles";
import DisbursementKPIs from "./components/DisbursementKPIs";
import DisbursementTable from "./components/DisbursementTable";
import DisbursementUploadPanel from "./components/DisbursementUploadPanel";
import DisbursementHistory from "./components/DisbursementHistory";
import DisbursementDetailDialog from "./components/DisbursementDetailDialog";
import QuickStats from "./components/QuickStats";
import asxhService from "@services/asxhService";
import workflowWizardService from "@services/workflowWizardService";
import { useToast } from "@components/common/ToastProvider";
import ProgramSummaryCard from "../AssetManagement/components/ProgramSummaryCard";
import { AuthContext } from "@AuthContext/AuthProvider";
import { useContext } from "react";

const DisbursementPage = () => {
  const { programId: paramProgramId } = useParams();
  const programId = (paramProgramId && paramProgramId !== ":programId") ? paramProgramId : "7";
  const navigate = useNavigate();
  const toast = useToast();
  
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [programInfo, setProgramInfo] = useState({});
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [viewDetailData, setViewDetailData] = useState(null);
  const [canCreate, setCanCreate] = useState(false);

  const fetchProgramData = useCallback(async () => {
    setLoading(true);
    try {
      const batchRes = await asxhService.getDisbursementOverview(programId);
      if (batchRes.success) {
        setProgramInfo(batchRes.data.program || {});
        setBatches(batchRes.data.disbursements?.items || []);
        setSummary(batchRes.data.kpi || {});
        
        if (batchRes.data.disbursements?.items?.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchRes.data.disbursements.items[0].id);
        }
      }
    } catch (error) {
      console.error("Fetch disbursement data failed:", error);
      toast("Không thể tải thông tin giải ngân", "error");
    } finally {
      setLoading(false);
    }
  }, [programId, selectedBatchId, toast]);

  const fetchBatchDetail = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await asxhService.getDisbursementIdDetail(id);
      if (res.success) {
        // Flatten disbursement properties to root so components can access them directly
        const normalizedData = {
          ...(res.data.disbursement || res.data),
          details: res.data.details || [],
          attachments: (res.data.attachments || []).map(a => ({
            ...a,
            doc_type: a.docType || a.doc_type 
          }))
        };
        setBatchDetail(normalizedData);
        return normalizedData;
      }
    } catch (error) {
      toast("Không thể tải chi tiết đợt giải ngân", "error");
    }
    return null;
  }, [toast]);

  useEffect(() => {
    fetchProgramData();
  }, [fetchProgramData]);

  useEffect(() => {
    const checkCreationRole = async () => {
      const rolesByProcess = user?.roles_by_process || user?.user?.roles_by_process || [];

      try {
        const res = await workflowWizardService.getList();
        if (res.success) {
          const workflows = res.data || [];
          // 1. Lấy ánh xạ luồng động cho ASXH (ID asxh_root_001)
          const mappingRes = await asxhService.getModuleWorkflowMapping();
          let targetWFKey = null;
          
          if (mappingRes.success && mappingRes.data) {
            const asxhMapping = mappingRes.data.find(m => m.menuId === "asxh_root_001" || m.menu_id === "asxh_root_001");
            if (asxhMapping) {
              targetWFKey = asxhMapping.workflow_key || asxhMapping.workflowKey;
            }
          }

          // Fallback nếu không thấy mapping (để đảm bảo không bị lỗi trắng trang)
          if (!targetWFKey) targetWFKey = "GIAI_NGAN_ASXH_2";

          let hasStep1 = false;
          
          const removeAccents = (str) => str?.toString().normalize('NFD').replace(/[\u0300._\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') || "";
          const normalize = (str) => removeAccents(str?.toString().toUpperCase().replace(/_/g, "").replace(/\s/g, ""));
          
          const targetWF = workflows.find(wf => 
            normalize(wf.processKey) === normalize(targetWFKey)
          );
          
          if (targetWF) {
            const userProcess = rolesByProcess.find(p => 
              normalize(p.processKey) === normalize(targetWF.processKey)
            );
            
            if (userProcess) {
              const detailRes = await workflowWizardService.getDetail(targetWF.processKey);
              if (detailRes.success && detailRes.data?.steps) {
                const step1 = detailRes.data.steps.find(s => s.stepOrder === 1);
                if (step1 && userProcess.roles.some(r => normalize(r.roleCode) === normalize(step1.roleCode))) {
                  hasStep1 = true;
                }
              }
            }
          }

          setCanCreate(hasStep1);
        }
      } catch (error) {
        console.error("ASXH Permission Error:", error);
      }
    };
    if (user) {
      checkCreationRole();
    } else {
      console.log("ASXH Debug - No user in context yet");
    }
  }, [user]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchDetail(selectedBatchId);
    }
  }, [selectedBatchId, fetchBatchDetail]);

  const handleViewDetail = async (id) => {
    try {
      const res = await asxhService.getDisbursementIdDetail(id);
      if (res.success) {
        // Prepare data to match DisbursementDetailDialog expectations
        const formattedData = {
          disbursement: res.data.disbursement || res.data,
          details: res.data.details || [],
          attachments: (res.data.attachments || []).map(a => ({
            ...a,
            doc_type: a.docType || a.doc_type 
          }))
        };
        setViewDetailData(formattedData);
        setOpenDetailDialog(true);
      }
    } catch (error) {
      toast("Không thể tải chi tiết đợt giải ngân", "error");
    }
  };

  const handleUpload = async (pendingFiles) => {
    if (!selectedBatchId || !pendingFiles || pendingFiles.length === 0) return { success: false };
    
    try {
      const formData = new FormData();
      pendingFiles.forEach(item => {
        formData.append("files", item.file);
        formData.append("doc_type", item.doc_type || "KHAC");
        formData.append("title", item.name || item.file.name);
      });

      const res = await asxhService.uploadDisbursementAttachment(selectedBatchId, formData);
      if (res.success) {
        await fetchBatchDetail(selectedBatchId);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (error) {
      console.error("Batch upload failed:", error);
      return { success: false };
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await asxhService.deleteDisbursementAttachment(selectedBatchId, fileId);
      if (res.success) {
        toast("Đã xoá chứng từ", "success");
        fetchBatchDetail(selectedBatchId);
        fetchProgramData();
      }
    } catch (error) {
      toast("Lỗi khi xoá file", "error");
    }
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await asxhService.updateDisbursementStatus(id, nextStatus);
      if (res.success) {
        toast(nextStatus === 'REJECTED' ? "Đã từ chối phê duyệt" : "Phê duyệt thành công", "success");
        await fetchBatchDetail(id);
        await fetchProgramData();
      } else {
        toast(res.message || "Lỗi khi cập nhật trạng thái", "error");
      }
    } catch (error) {
      toast(error.response?.data?.message || "Lỗi khi cập nhật trạng thái", "error");
    }
  };

  const handleSubmitApproval = async (id) => {
    try {
      const latestDetail = await fetchBatchDetail(id);
      if (!latestDetail?.attachments?.length) {
        toast("Vui lòng tải lên ít nhất một chứng từ trước khi gửi phê duyệt", "warning");
        return;
      }

      const currentStatus = (latestDetail?.status || "DRAFT").toUpperCase();
      
      // Step-based status mapping (matches backend STEP_STATUS_MAP)
      const STEP_STATUS_MAP = {
        2: { validStatuses: ['PENDING_APPROVAL'], nextStatus: 'APPROVED' },
        3: { validStatuses: ['APPROVED'], nextStatus: 'DISBURSED' },
        4: { validStatuses: ['DISBURSED'], nextStatus: 'COMPLETED' },
      };

      // Derive correct step from status (fixes legacy data)
      const STATUS_TO_STEP = {
        'DRAFT': 1, 'DRAFF': 1, 'REJECTED': 1,
        'PENDING_APPROVAL': 2, 'APPROVED': 3,
        'DISBURSED': 4, 'COMPLETED': 5,
      };
      const dbStep = latestDetail?.current_step_order || 1;
      const currentStepOrder = STATUS_TO_STEP[currentStatus] || dbStep;

      let nextStatus = "PENDING_APPROVAL";
      
      if (currentStatus === "DRAFT" || currentStatus === "DRAFF" || currentStatus === "REJECTED") {
        nextStatus = "PENDING_APPROVAL";
      } else {
        const stepMapping = STEP_STATUS_MAP[currentStepOrder];
        if (stepMapping && stepMapping.validStatuses.includes(currentStatus)) {
          nextStatus = stepMapping.nextStatus;
        }
      }

      await handleUpdateStatus(id, nextStatus);
    } catch (error) {
      toast("Lỗi khi xử lý", "error");
    }
  };

  const handleRejectApproval = async (id) => {
    await handleUpdateStatus(id, "REJECTED");
  };

  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBatches = batches.filter(batch => {
    if (statusFilter === "ALL") return true;
    
    const normalize = (s) => {
      const val = s?.toString().toUpperCase() || "";
      if (val === "CHỜ DUYỆT" || val === "CHO_DUYET" || val === "PENDING_APPROVAL") return "PENDING_APPROVAL";
      if (val === "ĐÃ XÁC NHẬN" || val === "DA_XAC_NHAN" || val === "VERIFIED") return "VERIFIED";
      if (val === "ĐÃ DUYỆT" || val === "DA_DUYET" || val === "APPROVED") return "APPROVED";
      if (val === "NHÁP" || val === "NHAP" || val === "DRAFT" || val === "DRAFF") return "DRAFT";
      if (val === "TỪ CHỐI" || val === "TU_CHOI" || val === "REJECTED") return "REJECTED";
      if (val === "HOÀN TẤT" || val === "HOAN_TAT" || val === "COMPLETED" || val === "DISBURSED") return "COMPLETED";
      return val;
    };

    return normalize(batch.status) === normalize(statusFilter);
  });

  if (loading && !batches.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: "#f4f7fa",
      fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
      "& *": { fontFamily: "inherit" }
    }}>


      <ProgramSummaryCard programInfo={programInfo} />

      <Grid container spacing={4} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <DisbursementKPIs summary={summary} />

          <Box sx={{ mt: 3 }}>
            <Paper sx={{ 
              borderRadius: "16px", mb: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
              border: "1px solid #e2e8f0", borderBottom: "none", p: "16px 24px", 
              display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#fff" 
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ bgcolor: "#F1F5F9", p: 1, borderRadius: "8px", display: "flex" }}>
                  <ListIcon sx={{ color: "#64748B", fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1E293B" }}>
                  Danh sách đợt giải ngân
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ 
                    minWidth: 150,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#64748B"
                    }
                  }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: "13px" }}>Trạng thái</MenuItem>
                  <MenuItem value="HOAN_THANH" sx={{ fontSize: "13px" }}>Hoàn thành</MenuItem>
                  <MenuItem value="DA_CHI" sx={{ fontSize: "13px" }}>Đã chi</MenuItem>
                  <MenuItem value="DA_DUYET" sx={{ fontSize: "13px" }}>Đã duyệt</MenuItem>
                  <MenuItem value="CHO_DUYET" sx={{ fontSize: "13px" }}>Chờ duyệt</MenuItem>
                  <MenuItem value="TU_CHOI" sx={{ fontSize: "13px" }}>Từ chối</MenuItem>
                  <MenuItem value="DRAFT" sx={{ fontSize: "13px" }}>Bản nháp</MenuItem>
                </TextField>

                {canCreate && (
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/asxh/programs/${programId}/disbursement/create`)}
                    sx={{ 
                      bgcolor: "#3B82F6", textTransform: "none", fontWeight: 700, borderRadius: "10px", 
                      px: 3, py: 1, "&:hover": { bgcolor: "#2563EB" }, height: "40px"
                    }}
                  >
                    Tạo đợt mới
                  </Button>
                )}
              </Box>
            </Paper>

            <DisbursementTable 
              items={filteredBatches} 
              onSelectBatch={setSelectedBatchId} 
              onViewDetail={handleViewDetail}
              selectedId={selectedBatchId} 
              onRefresh={() => {
                fetchProgramData();
                if (selectedBatchId) fetchBatchDetail(selectedBatchId);
              }}
              totalBudget={summary.total_budget || 2400000000}
            />
          </Box>
        </Grid>

        <Grid item xs={12} lg={7.2}>
          <Box sx={{ height: "100%" }}>
            <DisbursementHistory items={batches} />
          </Box>
        </Grid>

        <Grid item xs={12} lg={4.8}>
          <Stack spacing={4}>
            <DisbursementUploadPanel 
              batches={batches}
              selectedBatchId={selectedBatchId}
              onBatchChange={setSelectedBatchId}
              batchDetail={batchDetail}
              onUpload={handleUpload}
              onDeleteFile={handleDeleteFile}
              onSubmitApproval={handleSubmitApproval}
              onRejectApproval={handleRejectApproval}
            />
            <QuickStats 
              items={batches} 
              totalBudget={summary.total_budget || 0}
            />
          </Stack>
        </Grid>
      </Grid>
      
      <DisbursementDetailDialog 
        open={openDetailDialog} 
        onClose={() => setOpenDetailDialog(false)} 
        data={viewDetailData} 
      />
    </Box>
  );
};

export default DisbursementPage;
