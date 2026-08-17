import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSelectedModule } from "@redux/slices/layoutSlice";
import FormHeader from "./components/FormHeader";
import FormSection from "./components/FormSection";
import BasicInfoSection from "./components/BasicInfoSection";
import BudgetSection from "./components/BudgetSection";
import MilestoneSection from "./components/MilestoneSection";
import PersonnelSection from "./components/PersonnelSection";
import DispatchSection from "./components/DispatchSection";
import ActionFooter from "./components/ActionFooter";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";
import { trackAction } from "../../utils/trackAction";

const STORAGE_KEY = "asxh_registration_draft";

const ASXHRegistration = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { id: editId } = useParams();
  const isEditMode = !!editId;
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);

  // Initial State
  const [formData, setFormData] = useState({
    code: "",
    funding_type: "Bang_tien",
    name: "",
    description: "",
    locality: "",
    specific_address: "",
    start_date: "",
    end_date: "",
    local_partner: "",
    beneficiary: "",
    classification_keywords: [],
    funding_source: "",
    proposed_budget: 0,
    items: [],
    milestones: [],
    lead_user_id: null,
    lead_department: "",
    members: [],
    linked_documents: [],
    is_draft: false
  });

  const [errors, setErrors] = useState({});

  // 1. Fetch Provinces & Generate Code using Promise.all
  // 1. Fetch Provinces & Users using Promise.all
  const fetchInitialData = async () => {
    try {
      const [provRes, orgRes] = await Promise.all([
        asxhService.getProvinces().catch(() => ({ success: false, data: [] })),
        asxhService.getOrganizationUnits().catch(() => ({ success: false, data: [] }))
      ]);

      if (provRes?.success) setProvinces(provRes.data || []);
      if (orgRes?.success) setOrgUnits(orgRes.data || []);
    } catch (err) {
      console.error("Lỗi fetch dữ liệu khởi tạo:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    if (isEditMode) {
      fetchProgramDetail(editId);
    }
  }, [editId, isEditMode]);

  const fetchProgramDetail = async (id) => {
    setLoading(true);
    try {
      const res = await asxhService.getProgramDetail(id);
      if (res.success) {
        const d = res.data;
        // Map data from detail API to form structure
        setFormData({
          ...d,
          proposed_budget: d.budget || d.proposed_budget || 0,
          classification_keywords: typeof d.classification_keywords === 'string' 
            ? d.classification_keywords.split(',').map(k => k.trim()).filter(Boolean) 
            : (d.classification_keywords || []),
          lead_user_id: d.members?.find(m => m.role === 'LEADER')?.user_id || d.lead_user_id,
          lead_department: d.lead_department || d.department?.name || "",
          members: d.members?.filter(m => m.role !== 'LEADER') || d.members || [],
          items: d.program_items || d.items || [],
          milestones: d.program_milestones || d.milestones || [],
          linked_documents: d.incoming_documents || d.linked_documents || []
        });
      }
    } catch (err) {
      toast("Không thể tải chi tiết chương trình", "error");
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe sự thay đổi của funding_type để fetch lại code mới (Debounced to avoid loops)
  useEffect(() => {
    if (!formData.funding_type) return;
    
    let isMounted = true;
    const timeout = setTimeout(() => {
      asxhService.generateProgramCode(formData.funding_type)
        .then(res => {
          if (isMounted && res.success && res.data?.code && res.data.code !== formData.code) {
            setFormData(prev => ({ ...prev, code: res.data.code }));
          }
        }).catch(err => console.error("Lỗi generate code:", err));
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [formData.funding_type]);

  // 2. Tải bản nháp từ LocalStorage khi khởi tạo (Chỉ khi tạo mới)
  useEffect(() => {
    if (isEditMode) return;
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Lỗi parse bản nháp:", e);
      }
    }
  }, [isEditMode]);

  // 2. Tự động lưu bản nháp mỗi khi formData thay đổi (Chỉ khi tạo mới)
  useEffect(() => {
    if (isEditMode) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, 1000); 
    return () => clearTimeout(timeout);
  }, [formData, isEditMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 3) newErrors.name = "Tên chương trình phải từ 3 ký tự";
    if (!formData.funding_type) newErrors.funding_type = "Vui lòng chọn loại hình tài trợ";
    if (!formData.locality) newErrors.locality = "Vui lòng chọn địa phương";
    if (!formData.start_date) newErrors.start_date = "Ngày bắt đầu là bắt buộc";
    if (!formData.end_date) newErrors.end_date = "Ngày kết thúc là bắt buộc";
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast("Kiểm tra lại các trường bắt buộc", "error");
      return false;
    }
    return true;
  };

  const processTransaction = async (isDraft) => {
    // Collect all members including leader
    const allMembers = [
      ...(formData.lead_user_id ? [{ user_id: formData.lead_user_id, role: "LEADER" }] : []),
      ...(formData.members || [])
    ];

    // Single payload with all relations - Backend create method handles them all
    const programPayload = {
      ...formData,
      members: allMembers,
      budget: Number(formData.proposed_budget) || 0,
      beneficiary: formData.beneficiary || "",
      classification_keywords: Array.isArray(formData.classification_keywords) ? formData.classification_keywords.join(", ") : formData.classification_keywords,
      action: isDraft ? "DRAFT" : "SUBMIT"
    };

    trackAction(`${isEditMode ? 'UPDATE' : 'CREATE'}_PROGRAM_START_${isDraft ? 'DRAFT' : 'SUBMIT'}`, programPayload);
    
    let programRes;
    if (isEditMode) {
      programRes = await asxhService.updateProgram(editId, programPayload);
    } else {
      programRes = await asxhService.createProgram(programPayload);
    }

    if (!programRes.success || (!isEditMode && !programRes.data?.id)) {
      throw new Error(programRes.message || `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} chương trình.`);
    }

    trackAction(`${isEditMode ? 'UPDATE' : 'CREATE'}_PROGRAM_SUCCESS`, { programId: editId || programRes.data?.id, isDraft });
    return editId || programRes.data.id;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      await processTransaction(false);
      toast(isEditMode ? "Cập nhật chương trình thành công!" : "Tạo chương trình thành công!", "success");
      if (!isEditMode) localStorage.removeItem(STORAGE_KEY);
      dispatch(setSelectedModule("an-sinh-xa-hoc"));
      navigate("/asxh-management");
    } catch (error) {
      console.error("Lỗi submit chương trình:", error);
      toast(error.message || "Có lỗi xảy ra khi tạo chương trình.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    setLoading(true);
    try {
      await processTransaction(true);
      toast("Đã ghi nhận bản nháp.", "success");
      localStorage.removeItem(STORAGE_KEY);
      dispatch(setSelectedModule("an-sinh-xa-hoc"));
      navigate("/asxh-management");
    } catch (error) {
      toast(error.message || "Lưu nháp Server thất bại.", "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    const newItems = [...formData.milestones, { milestone_name: "", milestone_date: "", milestone_type: "MANDATORY" }];
    handleInputChange("milestones", newItems);
  };

  const handlePreview = () => {
    toast("Tính năng Xem trước đang được phát triển.", "info");
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy bỏ và quay lại danh sách? Mọi thay đổi chưa lưu sẽ bị mất.")) {
      localStorage.removeItem(STORAGE_KEY);
      navigate("/asxh-management");
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        height: "calc(100vh - 80px)",
        overflowY: "auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        pt: 1
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 2, pb: 12 }}>
        <Box sx={{ maxWidth: "1060px", margin: "0 auto" }}>
          <FormHeader title={isEditMode ? "Chỉnh sửa Chương trình ASXH" : "Tạo Chương trình ASXH mới"} />

          <FormSection 
            number={1} 
            title="Thông tin chương trình"
            extra={
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1.5,
                backgroundColor: "#F1F5F9",
                px: 2,
                py: 1,
                borderRadius: "12px",
                border: "1px solid #E2E8F0"
              }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#2563EB", letterSpacing: "0.05em" }}>
                  {formData.code || "CT-2026/..."}
                </Typography>
                <Box sx={{ 
                  backgroundColor: "#DCFCE7", 
                  color: "#15803D", 
                  px: 1, 
                  py: 0.25, 
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  Tự động
                </Box>
              </Box>
            }
          >
            <BasicInfoSection values={formData} errors={errors} onChange={handleInputChange} provinces={provinces} />
          </FormSection>

          <FormSection number={2} title="Ngân sách & Hạng mục chi">
            <BudgetSection
              items={formData.items}
              proposed_budget={formData.proposed_budget}
              funding_source={formData.funding_source}
              onChange={handleInputChange}
            />
          </FormSection>

          <FormSection 
            number={3} 
            title="Các mốc triển khai"
            extra={
              <Button 
                startIcon={<Add fontSize="small" />} 
                onClick={handleAddMilestone}
                sx={{ 
                  color: "#64748B", 
                  textTransform: "none", 
                  fontWeight: 600, 
                  fontSize: "0.875rem",
                  "&:hover": { backgroundColor: "transparent", color: "#2563EB" }
                }}
              >
                Thêm mốc
              </Button>
            }
          >
            <MilestoneSection
              milestones={formData.milestones}
              onChange={handleInputChange}
            />
          </FormSection>

          <FormSection number={4} title="Nhân sự phụ trách">
            <PersonnelSection values={formData} errors={errors} onChange={handleInputChange} orgUnits={orgUnits} />
          </FormSection>

          <FormSection 
            number={5} 
            title="Công văn liên kết"
            extra={
              <Typography variant="body2" sx={{ color: "#94A3B8", fontWeight: 400, fontSize: "0.85rem" }}>
                Chọn công văn gốc liên quan đến chương trình này
              </Typography>
            }
          >
            <DispatchSection
              selectedDocuments={formData.linked_documents}
              onChange={handleInputChange}
            />
          </FormSection>
        </Box>
      </Container>

      {/* Footer cố định */}
      <ActionFooter
        onCancel={handleCancel}
        onDraft={handleDraft}
        onPreview={handlePreview}
        onSubmit={handleSubmit}
        loading={loading}
        isEditMode={isEditMode}
      />
    </Box>
  );
};

export default ASXHRegistration;
