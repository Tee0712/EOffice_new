import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
  Avatar,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Tooltip,
  Container,
  Breadcrumbs,
  Link,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  ArrowBack as BackIcon,
  PersonOutline as PersonIcon,
  WarningAmber as WarningIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import educationScholarshipService from "@services/educationScholarshipService";
import { useToast } from "@components/common/ToastProvider";
import { SkySubmitButton } from "@styles/SkyStyles";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";

// --- Styled Components ---
const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  borderBottom: "1px solid #f1f5f9",
  "& .left-part": {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  "& .step-number": {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
  }
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
    "& fieldset": {
      borderColor: "#e2e8f0",
    },
    "&:hover fieldset": {
      borderColor: "#cbd5e1",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b82f6",
      borderWidth: "1px",
    }
  },
  "& .MuiInputBase-input": {
    padding: "10.5px 14px",
    fontSize: "14px",
  }
}));

const FormLabel = ({ children, required, sx }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", mb: 1, display: "block", ...sx }}>
    {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
  </Typography>
);

const FormInput = React.forwardRef(({ placeholder, multiline, ...props }, ref) => (
  <OutlinedInput
    fullWidth
    size="small"
    multiline={multiline}
    placeholder={placeholder}
    inputRef={ref}
    sx={{
      borderRadius: "8px",
      backgroundColor: "#fff",
      ...(multiline && { 
        padding: "12px 14px",
        height: "auto",
        alignItems: "flex-start"
      }),
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6", borderWidth: "1px" },
    }}
    {...props}
  />
));

const CustomSelect = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
    "& fieldset": {
      borderColor: "#e2e8f0",
    },
  },
  "& .MuiSelect-select": {
    padding: "10.5px 14px",
    fontSize: "14px",
  }
}));

const GpaProgress = styled(LinearProgress)(({ theme, score }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: "#e2e8f0",
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
    backgroundColor: score >= 3.6 ? "#10b981" : score >= 3.2 ? "#3b82f6" : score >= 2.5 ? "#f59e0b" : "#ef4444",
  }
}));

const PriorityCard = styled(Paper)(({ theme, active }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: "8px",
  border: `1px solid ${active ? "#8b5cf6" : "#e2e8f0"}`,
  backgroundColor: active ? "#f5f3ff" : "#fff",
  cursor: "pointer",
  boxShadow: "none",
  transition: "all 0.2s",
  "&:hover": {
    borderColor: active ? "#8b5cf6" : "#cbd5e1",
  }
}));

// --- Schema ---
const candidateSchema = yup.object().shape({
  full_name: yup.string().required("Họ tên không được để trống"),
  gender: yup.string().default("MALE"),
  dob: yup.string().required("Vui lòng chọn ngày sinh"),
  national_id: yup.string().required("Vui lòng nhập CMND/CCCD"),
  phone: yup.string().required("Vui lòng nhập số điện thoại"),
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  permanent_address: yup.string().required("Vui lòng nhập địa chỉ thường trú"),
  ethnicity: yup.string().nullable(),
  hometown: yup.string().required("Vui lòng nhập quê quán"),
  school_year: yup.string().required("Niên khóa học bổng không được để trống"),
  
  university_partner_id: yup.mixed().required("Vui lòng chọn trường đại học").test('is-valid-id', 'Vui lòng chọn trường đại học', val => !!val && val !== ""),
  major_name: yup.string().required("Vui lòng chọn ngành học"),
  student_code: yup.string().required("Vui lòng nhập mã số sinh viên"),
  course_code: yup.string().nullable(),
  study_year: yup.string().nullable(),
  education_type: yup.string().nullable(),
  gpa_current: yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("GPA phải là một số")
    .required("Vui lòng nhập GPA")
    .min(0, "GPA không được nhỏ hơn 0")
    .max(4.0, "Vui lòng nhập điểm hệ 4 (Tối đa 4.0)"),
  
  semester_results: yup.array().of(yup.object().shape({
    semester: yup.string().required(),
    gpa_current: yup.number()
      .transform((value, originalValue) => (originalValue === "" ? undefined : value))
      .typeError("GPA phải là một số")
      .required("Vui lòng nhập GPA")
      .min(0, "Không được < 0")
      .max(4.0, "Điểm hệ 4 (Tối đa 4.0)"),
    credits: yup.number()
      .transform((value, originalValue) => (originalValue === "" ? undefined : value))
      .typeError("Số tín chỉ phải là một số")
      .required("Vui lòng nhập số tín chỉ")
      .min(0),
    rank: yup.string().nullable(),
  })).min(1, "Vui lòng nhập kết quả của ít nhất 1 học kỳ"),

  priority_group: yup.string().nullable(),
  family_context: yup.string().nullable(),
  income_per_person_per_month: yup.number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .nullable(),
  siblings_in_school_count: yup.number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .nullable(),

  motivation_letter: yup.string().required("Vui lòng trình bày bài luận / động lực xin học bổng"),
  extracurricular: yup.string().nullable(),
  skills_certificates: yup.string().nullable(),
});

const PRIORITY_OPTIONS = [
  { id: "poor", label: "Hộ nghèo", sub: "Theo chuẩn nghèo QG" },
  { id: "near_poor", label: "Hộ cận nghèo", sub: "Theo QĐ địa phương" },
  { id: "other_hardship", label: "Khó khăn khác", sub: "Mồ côi, tàn tật, thiên tai" },
  { id: "ethnic", label: "Dân tộc thiểu số", sub: "Theo danh mục DTTS" },
  { id: "remote", label: "Vùng sâu, vùng xa", sub: "Xã ĐBKK, ATK" },
  { id: "none", label: "Không ưu tiên", sub: "Xét theo kết quả học tập" },
];

const ATTACHMENT_CATEGORIES = [
  { id: 'transcript', name: "Bảng điểm tích lũy (có xác nhận trường)", required: true },
  { id: 'id_card', name: "CCCD / CMND (mặt trước + sau)", required: true },
  { id: 'poverty_cert', name: "Giấy xác nhận hộ nghèo / cận nghèo", required: false },
  { id: 'recommendation', name: "Thư giới thiệu / Nhận xét từ giảng viên", required: false },
  { id: 'essay', name: "Bài luận (nếu viết riêng file)", required: false },
  { id: 'certificate', name: "Giấy khen / Chứng chỉ ngoại ngữ / NCKH", required: false },
];

/**
 * Trang Thêm mới / Cập nhật Ứng viên Học bổng
 */
const CandidateFormPage = () => {
  const navigate = useNavigate();
  const { id: candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const urlYear = searchParams.get("year");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidateCode, setCandidateCode] = useState("HB-2026/XXXX");
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(candidateSchema),
    defaultValues: {
      full_name: "",
      gender: "MALE",
      dob: "",
      national_id: "",
      phone: "",
      email: "",
      permanent_address: "",
      ethnicity: "",
      hometown: "",
      university_partner_id: "",
      major_name: "",
      student_code: "",
      course_code: "",
      study_year: "",
      education_type: "",
      gpa_current: "",
      semester_results: [{ semester: "Học kỳ 1", gpa_current: 0, credits: 0, rank: "Khá" }],
      priority_group: "none",
      family_context: "",
      motivation_letter: "",
      extracurricular: "",
      skills_certificates: "",
      school_year: "",
    },
  });

  const { fields: semesterFields, append: appendSemester, remove: removeSemester } = useFieldArray({ control, name: "semester_results" });

  const [attachments, setAttachments] = useState(Array(6).fill(null));
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast("Ảnh vượt quá dung lượng 2MB", "error");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles.length) return;

    setAttachments(prev => {
      const newAttachments = [...prev];
      let fileIdx = 0;
      for (let i = 0; i < newAttachments.length && fileIdx < uploadedFiles.length; i++) {
        if (!newAttachments[i]) {
          newAttachments[i] = uploadedFiles[fileIdx];
          fileIdx++;
        }
      }
      return newAttachments;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    setAttachments(prev => {
      const newAttachments = [...prev];
      let fileIdx = 0;
      for (let i = 0; i < newAttachments.length && fileIdx < droppedFiles.length; i++) {
        if (!newAttachments[i]) {
          newAttachments[i] = droppedFiles[fileIdx];
          fileIdx++;
        }
      }
      return newAttachments;
    });
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleRemoveFile = async (index) => {
    const fileToRemove = attachments[index];
    if (fileToRemove && fileToRemove.id) {
       // Xóa trên server nếu là file đã có
       try {
         const res = await educationScholarshipService.deleteCandidateAttachment(fileToRemove.id);
         if (res.success) toast("Đã xóa tài liệu trên hệ thống", "success");
       } catch (err) {
         toast("Lỗi khi xóa tài liệu", "error");
         return;
       }
    }
    setAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments[index] = null;
      return newAttachments;
    });
  };
  
  const watchedGpa = Number(watch("gpa_current")) || 0;
  const gpaRank = watchedGpa >= 3.6 ? { text: "Xuất sắc", bg: "#dbeafe", color: "#1e40af" } :
                  watchedGpa >= 3.2 ? { text: "Giỏi", bg: "#dcfce7", color: "#16a34a" } :
                  watchedGpa >= 2.5 ? { text: "Khá", bg: "#fef3c7", color: "#d97706" } :
                  { text: "Trung bình", bg: "#f1f5f9", color: "#64748b" };
  const watchedSemesters = useWatch({ control, name: "semester_results" }) || [];
  const totalCredits = useMemo(() => watchedSemesters.reduce((acc, s) => acc + (Number(s.credits) || 0), 0), [watchedSemesters]);

  const watchedPartnerId = watch("university_partner_id");
  const watchedStatus = watch("status");
  const watchedSchoolYear = watch("school_year");

  useEffect(() => {
    if (candidateId) {
      fetchDetail();
    } else {
      fetchPreviewCode();
      if (urlYear) {
        setValue("school_year", urlYear);
      }
    }
  }, [candidateId, urlYear, setValue]);

  useEffect(() => {
    if (watchedPartnerId) {
      fetchMajors(watchedPartnerId);
    } else {
      setMajors([]);
    }
  }, [watchedPartnerId]);


  const fetchMajors = async (partnerId) => {
    if (!partnerId) return;
    setMajorsLoading(true);
    try {
      const res = await educationScholarshipService.getPartnerDetail(partnerId);
      if (res.success && res.data.quotas) {
        // Extract unique major names from quotas
        const uniqueMajors = [...new Set(res.data.quotas.map(q => q.major_name))];
        setMajors(uniqueMajors);
      }
    } catch (err) {
      console.error("Failed to fetch majors:", err);
      toast("Lỗi khi tải danh sách ngành học", "error");
    } finally {
      setMajorsLoading(false);
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await educationScholarshipService.getCandidateDetail(candidateId);
      if (res.success) {
        // Map API data to form schema
        const mappedData = {
          ...res.data,
          full_name: res.data.full_name || "",
          gender: res.data.gender || "MALE",
          dob: res.data.dob || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          national_id: res.data.national_id || "",
          permanent_address: res.data.permanent_address || "",
          ethnicity: res.data.ethnicity || "",
          hometown: res.data.hometown || "",
          university_partner_id: res.data.university_partner_id || "",
          major_name: res.data.major_name || "",
          student_code: res.data.student_code || "",
          course_code: res.data.course_code || "",
          study_year: res.data.study_year || "",
          education_type: res.data.education_type || "",
          gpa_current: res.data.gpa_current || "",
          priority_group: res.data.priority_group || "none",
          family_context: res.data.family_context || "",
          motivation_letter: res.data.motivation_letter || "",
          extracurricular: res.data.extracurricular || "",
          skills_certificates: res.data.skills_certificates || "",
          semester_results: (res.data.semester_results || []).map(s => ({
            semester: s.semester_name || "",
            gpa_current: s.semester_gpa || 0,
            credits: s.credits || 0,
            rank: s.classification || "Khá"
          })),
          school_year: res.data.school_year || ""
        };
        reset(mappedData);
        setCandidateCode(res.data.code);
        
        // Map Avatar
        if (res.data.avatar_path) {
          const fullAvatarUrl = res.data.avatar_path.startsWith("http") 
            ? res.data.avatar_path 
            : `${APP_BASE}/${res.data.avatar_path}`;
          setAvatarPreview(fullAvatarUrl);
        }

        // Map Attachments to slots based on doc_type
        const slots = Array(6).fill(null);
        if (res.data.attachments) {
          res.data.attachments.forEach(att => {
            const idx = ATTACHMENT_CATEGORIES.findIndex(cat => cat.id === att.doc_type);
            if (idx !== -1) slots[idx] = att;
          });
        }
        setAttachments(slots);
      }
    } catch (err) {
      toast("Lỗi khi tải chi tiết ứng viên", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewCode = async () => {
    try {
      const res = await educationScholarshipService.previewCandidateCode();
      if (res.success) setCandidateCode(res.data.code);
    } catch (err) {}
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      setSaving(true);
      const res = await educationScholarshipService.deleteCandidate(candidateId);
      if (res.success) {
        toast("Đã xóa hồ sơ thành công", "success");
        navigate("/asxh/educational-sponsorship");
      }
    } catch (err) {
      toast("Lỗi khi xóa hồ sơ", "error");
    } finally {
      setSaving(false);
    }
  };

  const fetchPartners = async (year) => {
    setPartnersLoading(true);
    try {
      const res = await educationScholarshipService.getUniversityPartners({ 
        limit: 100, 
        status: 'ACTIVE',
        school_year: year 
      });
      if (res.success) setPartners(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch partners:", err);
    } finally {
      setPartnersLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners(watchedSchoolYear);
  }, [watchedSchoolYear]);

  const onSubmit = async (data, statusOverride = null) => {
    // Validate required files
    const missingFiles = ATTACHMENT_CATEGORIES
      .filter((cat, idx) => cat.required && !attachments[idx])
      .map(cat => cat.name);
    
    if (!avatarPreview) {
      missingFiles.unshift("Ảnh đại diện");
    }
    
    if (missingFiles.length > 0) {
      toast(`Vui lòng đính kèm các tài liệu bắt buộc: ${missingFiles.join(", ")}`, "error");
      return;
    }

    setSaving(true);
    try {
      // Map form data to API format
      const isDraft = statusOverride === "DRAFT";
      const payload = {
        ...data,
        dob: data.dob ? dayjs(data.dob).format("YYYY-MM-DD") : "",
        status: statusOverride || (data.status === "DRAFT" ? "SUBMITTED" : (data.status || "SUBMITTED")),
        semester_results: (data.semester_results || []).map(s => ({
          semester_name: s.semester,
          semester_gpa: s.gpa_current,
          credits: s.credits,
          classification: s.rank
        }))
      };

      const res = candidateId 
        ? await educationScholarshipService.updateCandidate(candidateId, payload)
        : await educationScholarshipService.createCandidate(payload);
      
      if (res.success) {
        const newCandidateId = res.data.id || candidateId;

        // 1. Upload Avatar nếu có thay đổi
        if (avatarFile) {
          try {
            await educationScholarshipService.uploadCandidateAvatar(newCandidateId, avatarFile);
          } catch (err) {
            console.error("Failed to upload avatar:", err);
            toast("Lỗi khi tải lên ảnh đại diện", "warning");
          }
        }

        // 2. Upload các tài liệu đính kèm mới
        const uploadPromises = attachments.map((file, idx) => {
          if (file && file instanceof File) {
            return educationScholarshipService.uploadCandidateAttachment(newCandidateId, {
              file,
              title: ATTACHMENT_CATEGORIES[idx].name,
              doc_type: ATTACHMENT_CATEGORIES[idx].id,
              is_required: ATTACHMENT_CATEGORIES[idx].required
            });
          }
          return null;
        }).filter(Boolean);

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        const successMsg = isDraft ? "Đã lưu nháp hồ sơ" : (candidateId ? "Cập nhật thành công" : "Thêm ứng viên thành công");
        toast(successMsg, "success");
        navigate("/asxh/educational-sponsorship");
      }
    } catch (err) {
      const isDraft = statusOverride === "DRAFT";
      const defaultError = isDraft ? "Lỗi khi lưu bản nháp" : "Lỗi khi gửi hồ sơ";
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        try {
          if (typeof errorData === 'string' && errorData.startsWith('[')) {
            const parsedErrors = JSON.parse(errorData);
            parsedErrors.forEach(item => {
              setError(item.path[0], { type: "server", message: item.message });
            });
            toast(isDraft ? "Vui lòng kiểm tra lại thông tin bản nháp" : "Vui lòng kiểm tra lại thông tin hồ sơ", "error");
          } else {
            toast(err.response.data.message || defaultError, "error");
          }
        } catch (e) {
          toast(err.response.data.message || defaultError, "error");
        }
      } else {
        toast(err.response?.data?.message || defaultError, "error");
      }
    }
  };
  
  const getFirstError = (errors) => {
    if (!errors) return null;
    
    // Nếu là một object lỗi có message (lỗi trực tiếp)
    if (errors.message) return errors.message;
    
    // Nếu là một array hoặc object chứa các field khác
    for (const key in errors) {
      if (errors[key]) {
        const error = getFirstError(errors[key]);
        if (error) return error;
      }
    }
    return null;
  };

  const onInvalid = (errors) => {
    console.error("Form Validation Errors:", errors);
    const errorMessage = getFirstError(errors);
    toast(errorMessage || "Vui lòng kiểm tra lại các trường bắt buộc", "error");
  };

  const handleBack = () => navigate("/asxh/educational-sponsorship");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <IconButton 
            onClick={handleBack} 
            size="small" 
            sx={{ color: "#64748b", bgcolor: "#fff", border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#f8fafc" } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            {candidateId ? "Cập nhật Hồ sơ Ứng viên" : "Thêm Ứng viên Học bổng mới"}
          </Typography>
        </Stack>
        <Box sx={{ ml: 5, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mã hồ sơ: <span style={{ color: "#3b82f6", fontWeight: 700 }}>{candidateCode}</span>
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: 16, my: "auto" }} />
          <Typography variant="body2" color="text.secondary">
            Trạng thái: <span style={{ fontWeight: 700 }}>{candidateId ? "Đang xử lý" : "Mới tạo"}</span>
          </Typography>
        </Box>
      </Box>

      <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* 1. Thông tin cá nhân */}
        <Paper sx={{ p: 4, borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <SectionHeader>
            <Box className="left-part">
              <div className="step-number">1</div>
              <Typography variant="h6" fontWeight={700}>Thông tin cá nhân</Typography>
            </Box>
            <Box sx={{ bgcolor: "#f1f5f9", px: 2, py: 0.5, borderRadius: "6px", display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>{candidateCode}</Typography>
              <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700 }}>Mới</Typography>
            </Box>
          </SectionHeader>
          <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar src={avatarPreview || ""} sx={{ width: 80, height: 80, bgcolor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
              {!avatarPreview && <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Ảnh chân dung</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>3x4 hoặc 4x6 · JPG/PNG · Tối đa 2MB</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => avatarInputRef.current?.click()} sx={{ borderRadius: "6px", textTransform: "none", color: "#64748b", borderColor: "#e2e8f0" }}>Tải ảnh lên</Button>
                {avatarFile && <Button variant="text" size="small" color="error" onClick={() => {setAvatarFile(null); setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = "";}} sx={{ textTransform: "none", minWidth: 0, px: 1 }}>Xoá ảnh</Button>}
              </Stack>
              <input type="file" hidden ref={avatarInputRef} accept="image/jpeg,image/png,image/jpg" onChange={handleAvatarUpload} />
            </Box>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormLabel required>Họ và tên</FormLabel>
              <CustomTextField fullWidth placeholder="Nguyễn Văn A" {...register("full_name")} error={!!errors.full_name} helperText={errors.full_name?.message} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>Ngày sinh</FormLabel>
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <DatePicker 
                    {...field}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        size: "small",
                        error: !!errors.dob,
                        helperText: errors.dob?.message,
                        sx: { 
                          "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" }
                        }
                      } 
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Giới tính</FormLabel>
              <CustomSelect select fullWidth defaultValue="MALE" {...register("gender")} sx={{ textAlign: "left" }}>
                <MenuItem value="MALE">Nam</MenuItem>
                <MenuItem value="FEMALE">Nữ</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>CMND / CCCD</FormLabel>
              <CustomTextField fullWidth placeholder="0123 456 789 01" {...register("national_id")} error={!!errors.national_id} helperText={errors.national_id?.message} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>Số điện thoại</FormLabel>
              <CustomTextField fullWidth placeholder="09xx xxx xxx" {...register("phone")} error={!!errors.phone} helperText={errors.phone?.message} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>Email</FormLabel>
              <CustomTextField fullWidth placeholder="email@example.com" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
            </Grid>
            <Grid item xs={12}>
              <FormLabel required>Địa chỉ thường trú</FormLabel>
              <CustomTextField 
                fullWidth 
                placeholder="Số nhà, đường, xã/phường, quận/huyện, tỉnh/TP" 
                {...register("permanent_address")} 
                error={!!errors.permanent_address}
                helperText={errors.permanent_address?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Dân tộc</FormLabel>
              <CustomSelect select fullWidth defaultValue="Kinh" {...register("ethnicity")} sx={{ textAlign: "left" }}>
                <MenuItem value="Kinh">Kinh</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>Quê quán</FormLabel>
              <CustomTextField 
                fullWidth 
                placeholder="Tỉnh / Thành phố" 
                {...register("hometown")} 
                error={!!errors.hometown}
                helperText={errors.hometown?.message}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* 2. Thông tin học tập & Kết quả */}
        <Paper sx={{ p: 4, borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <SectionHeader>
            <Box className="left-part">
              <div className="step-number">2</div>
              <Typography variant="h6" fontWeight={700}>Thông tin học tập</Typography>
            </Box>
          </SectionHeader>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FormLabel>Trường đại học <span>*</span></FormLabel>
              <Controller
                name="university_partner_id"
                control={control}
                render={({ field }) => (
                  <CustomSelect select fullWidth {...field} sx={{ textAlign: "left" }} error={!!errors.university_partner_id}>
                    <MenuItem value="" disabled>--- Chọn trường đại học ---</MenuItem>
                    {partnersLoading ? (
                      <MenuItem value="" disabled>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={16} /> <Typography variant="body2">Đang tải...</Typography>
                        </Box>
                      </MenuItem>
                    ) : (
                      partners.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))
                    )}
                  </CustomSelect>
                )}
              />
              {errors.university_partner_id && <Typography variant="caption" color="error">{errors.university_partner_id.message}</Typography>}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel required>Ngành / Chuyên ngành</FormLabel>
              <Controller
                name="major_name"
                control={control}
                render={({ field }) => (
                  <CustomSelect 
                    select 
                    fullWidth 
                    {...field} 
                    error={!!errors.major_name}
                    helperText={errors.major_name?.message}
                    disabled={!watchedPartnerId}
                    sx={{ textAlign: "left" }}
                  >
                    <MenuItem value="" disabled>--- Chọn ngành ---</MenuItem>
                    {majorsLoading ? (
                      <MenuItem value="" disabled>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={16} /> <Typography variant="body2">Đang tải...</Typography>
                        </Box>
                      </MenuItem>
                    ) : majors.length > 0 ? (
                      majors.map((major, index) => (
                        <MenuItem key={index} value={major}>{major}</MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                         <Typography variant="body2">{watchedPartnerId ? "Không có dữ liệu ngành học" : "Vui lòng chọn trường trước"}</Typography>
                      </MenuItem>
                    )}
                  </CustomSelect>
                )}
              />
            </Grid>

            {/* School Year (Read-only) */}
            <Grid item xs={12} md={6}>
              <FormLabel required>Niên khóa học bổng</FormLabel>
              <Box sx={{ position: "relative" }}>
                <CustomTextField 
                  fullWidth 
                  {...register("school_year")}
                  disabled
                  sx={{ 
                    bgcolor: "#f8fafc",
                    "& .MuiOutlinedInput-root": {
                      color: "#475569",
                      fontWeight: 700
                    }
                  }}
                />
                <Tooltip title="Niên khóa được lấy tự động từ bộ lọc ngoài danh sách và không thể thay đổi khi cập nhật.">
                  <Box sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    <InfoIcon sx={{ fontSize: 18 }} />
                  </Box>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormLabel required>Mã số sinh viên</FormLabel>
              <CustomTextField fullWidth placeholder="VD: 20241234" {...register("student_code")} error={!!errors.student_code} helperText={errors.student_code?.message} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Khoá học</FormLabel>
              <CustomSelect select fullWidth defaultValue="K2024" {...register("course_code")} sx={{ textAlign: "left" }}>
                <MenuItem value="K2023">K2023</MenuItem>
                <MenuItem value="K2024">K2024</MenuItem>
                <MenuItem value="K2025">K2025</MenuItem>
                <MenuItem value="K2026">K2026</MenuItem>
                <MenuItem value="K2027">K2027</MenuItem>
              </CustomSelect>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormLabel>Năm đang học</FormLabel>
              <CustomSelect select fullWidth defaultValue="Năm 2" {...register("study_year")} sx={{ textAlign: "left" }}>
                <MenuItem value="Năm 1">Năm 1</MenuItem>
                <MenuItem value="Năm 2">Năm 2</MenuItem>
                <MenuItem value="Năm 3">Năm 3</MenuItem>
                <MenuItem value="Năm 4">Năm 4</MenuItem>
                <MenuItem value="Năm cuối">Năm cuối</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Hệ đào tạo</FormLabel>
              <CustomSelect select fullWidth defaultValue="Chính quy" {...register("education_type")} sx={{ textAlign: "left" }}>
                <MenuItem value="Chính quy">Chính quy</MenuItem>
                <MenuItem value="Liên thông">Liên thông</MenuItem>
                <MenuItem value="Vừa làm vừa học">Vừa làm vừa học</MenuItem>
              </CustomSelect>
            </Grid>

            {/* GPA */}
            <Grid item xs={12}>
              <FormLabel>Điểm trung bình tích lũy (GPA)</FormLabel>
              <Box sx={{ bgcolor: "#f1f5f9", p: 3, borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <CustomTextField 
                      type="number"
                      inputProps={{ 
                        step: "0.01", 
                        min: "0", 
                        max: "4.0",
                        style: { textAlign: "center", fontWeight: 700, color: "#1e293b", fontSize: "16px" } 
                      }} 
                      {...register("gpa_current")}
                      error={!!errors.gpa_current}
                      sx={{ 
                        width: "120px", 
                        bgcolor: "#fff",
                        "& .MuiFormHelperText-root": { display: "none" }
                      }} 
                    />
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 1 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>GPA HIỆN TẠI</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: "24px", color: "#94a3b8", fontWeight: 300 }}>/</Typography>
                  <Box sx={{ textAlign: "center" }}>
                    <CustomTextField 
                      disabled
                      value="4.0" 
                      inputProps={{ style: { textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "16px" } }} 
                      sx={{ width: "120px", bgcolor: "#f8fafc", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" } }} 
                    />
                    <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b", fontWeight: 600 }}>THANG ĐIỂM</Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, position: "relative", mx: 3 }}>
                  <Box sx={{ position: "relative", width: "100%", height: "4px", bgcolor: "#e2e8f0", borderRadius: "2px", mt: "-16px" }}>
                     <Box sx={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((watchedGpa/4)*100, 100)}%`, bgcolor: "#10b981", borderRadius: "2px" }} />
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                     <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700 }}>0.0</Typography>
                     <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700 }}>1.0</Typography>
                     <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700 }}>2.0</Typography>
                     <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700 }}>3.0</Typography>
                     <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700 }}>4.0</Typography>
                  </Box>
                </Box>

                <Box sx={{ bgcolor: gpaRank.bg, color: gpaRank.color, px: 2, py: 0.5, borderRadius: "6px", fontWeight: 700, fontSize: "14px", alignSelf: "flex-start", mt: 2 }}>
                  {gpaRank.text}
                </Box>
              </Box>
              {errors.gpa_current && (
                <Typography variant="caption" color="error" sx={{ display: "block", mt: 1, ml: 1, fontWeight: 600 }}>
                  * {errors.gpa_current.message}
                </Typography>
              )}
            </Grid>

            {/* Bảng kết quả chi tiết */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#475569" }}>Kết quả theo học kỳ</Typography>
              <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                <Grid container sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <Grid item xs={5}><Typography variant="caption" fontWeight={700} color="#64748b">HỌC KỲ</Typography></Grid>
                  <Grid item xs={2}><Typography variant="caption" fontWeight={700} color="#64748b" align="center">GPA KỲ</Typography></Grid>
                  <Grid item xs={2}><Typography variant="caption" fontWeight={700} color="#64748b" align="center">SỐ TC</Typography></Grid>
                  <Grid item xs={2}><Typography variant="caption" fontWeight={700} color="#64748b" align="center">XẾP LOẠI</Typography></Grid>
                  <Grid item xs={1}></Grid>
                </Grid>
                {semesterFields.map((field, index) => (
                  <Grid container key={field.id} sx={{ p: 2, borderBottom: index === semesterFields.length - 1 ? "none" : "1px solid #f1f5f9", alignItems: "center" }} spacing={2}>
                    <Grid item xs={5}>
                      <CustomTextField 
                        fullWidth 
                        size="small" 
                        placeholder="VD: HK1 - 2024-2025" 
                        {...register(`semester_results.${index}.semester`)} 
                        error={!!errors.semester_results?.[index]?.semester}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Tooltip title={errors.semester_results?.[index]?.gpa_current?.message || ""} arrow placement="top">
                        <CustomTextField 
                          fullWidth 
                          size="small" 
                          type="number" 
                          step="0.01" 
                          inputProps={{ style: { textAlign: "center" } }} 
                          {...register(`semester_results.${index}.gpa_current`)} 
                          error={!!errors.semester_results?.[index]?.gpa_current}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={2}>
                      <Tooltip title={errors.semester_results?.[index]?.credits?.message || ""} arrow placement="top">
                        <CustomTextField 
                          fullWidth 
                          size="small" 
                          type="number" 
                          inputProps={{ style: { textAlign: "center" } }} 
                          {...register(`semester_results.${index}.credits`)} 
                          error={!!errors.semester_results?.[index]?.credits}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={2}>
                      <CustomSelect select fullWidth size="small" {...register(`semester_results.${index}.rank`)} sx={{ textAlign: "center" }}>
                        <MenuItem value="Xuất sắc">Xuất sắc</MenuItem>
                        <MenuItem value="Giỏi">Giỏi</MenuItem>
                        <MenuItem value="Khá">Khá</MenuItem>
                        <MenuItem value="Trung bình">Trung bình</MenuItem>
                      </CustomSelect>
                    </Grid>
                    <Grid item xs={1}><IconButton size="small" onClick={() => removeSemester(index)}><CloseIcon sx={{ fontSize: 16, color: "#cbd5e1" }} /></IconButton></Grid>
                  </Grid>
                ))}
                <Box sx={{ p: 2, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Button startIcon={<AddIcon />} variant="text" size="small" onClick={() => appendSemester({ semester: "", gpa_current: 0, credits: 0, rank: "Giỏi" })} sx={{ color: "#64748b", fontWeight: 600, textTransform: "none" }}>Thêm học kỳ</Button>
                  <Typography variant="body2" fontWeight={600} color="#64748b">Tổng: {totalCredits} tín chỉ</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* 3. Hoàn cảnh gia đình */}
        <Paper sx={{ p: 4, borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <SectionHeader>
            <Box className="left-part">
              <div className="step-number" style={{ backgroundColor: "#8b5cf6" }}>3</div>
              <Typography variant="h6" fontWeight={700}>Hoàn cảnh gia đình</Typography>
            </Box>
          </SectionHeader>
          <FormLabel>Đối tượng ưu tiên <span>*</span></FormLabel>
          <Controller
            name="priority_group"
            control={control}
            render={({ field }) => (
              <Grid container spacing={2}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <Grid item xs={12} sm={4} key={opt.id}>
                    <PriorityCard active={field.value === opt.id} onClick={() => field.onChange(opt.id)}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Radio size="small" checked={field.value === opt.id} sx={{ p: 0, color: field.value === opt.id ? "#8b5cf6" : "#cbd5e1", '&.Mui-checked': { color: '#8b5cf6' } }} />
                        <Box>
                          <Typography variant="body2" fontWeight={600} color={field.value === opt.id ? "#1e293b" : "#475569"}>{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>{opt.sub}</Typography>
                        </Box>
                      </Stack>
                    </PriorityCard>
                  </Grid>
                ))}
              </Grid>
            )}
          />
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormLabel>Hoàn cảnh gia đình</FormLabel>
              <FormInput 
                multiline 
                rows={5} 
                placeholder="Mô tả chi tiết về hoàn cảnh gia đình, khó khăn, thu nhập cha/mẹ, các điều kiện sống hiện tại và các khó khăn đặc biệt khác để xét duyệt ưu tiên..." 
                {...register("family_context")} 
              />
            </Grid>
            <Grid container item xs={12} spacing={4}>
              <Grid item xs={12} md={6}>
                <FormLabel sx={{ color: "#64748b" }}>Thu nhập bình quân / người / tháng</FormLabel>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <CustomTextField sx={{ flex: 1 }} type="number" placeholder="0" {...register("income_per_person_per_month")} />
                  <Typography variant="caption" fontWeight={700} color="#64748b">VNĐ</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel sx={{ color: "#64748b" }}>Số anh chị em đang đi học</FormLabel>
                <CustomTextField fullWidth type="number" placeholder="0" {...register("siblings_in_school_count")} />
              </Grid>
            </Grid>
          </Grid>
        </Paper>
        {/* 4. Bài luận / Động lực */}
        <Paper sx={{ p: 4, borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <SectionHeader>
            <Box className="left-part">
              <div className="step-number" style={{ backgroundColor: "#8b5cf6" }}>4</div>
              <Typography variant="h6" fontWeight={700}>Bài luận / Động lực</Typography>
            </Box>
          </SectionHeader>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <FormLabel required>Bài luận / Động lực</FormLabel>
              <FormInput 
                multiline 
                rows={10} 
                placeholder="Trình bày lý do xin học bổng, hoàn cảnh, mục tiêu nghề nghiệp, kế hoạch sau khi tốt nghiệp, cam kết đóng góp cho xã hội sau khi ra trường (ít nhất 200 từ)..." 
                {...register("motivation_letter")} 
                error={!!errors.motivation_letter}
              />
              {errors.motivation_letter && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>{errors.motivation_letter.message}</Typography>}
              <Typography variant="caption" color="#94a3b8" sx={{ mt: 1, display: "block", fontWeight: 500 }}>Sử dụng ô này hoặc upload file bài luận chi tiết ở mục hồ sơ bên dưới</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Hoạt động ngoại khóa</FormLabel>
              <FormInput 
                multiline 
                rows={5} 
                placeholder="Các hoạt động tình nguyện, tham gia CLB, công trình nghiên cứu khoa học, các giải thưởng thi cử hoặc chứng nhận tham gia cộng đồng..." 
                {...register("extracurricular")} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Kỹ năng & Chứng chỉ</FormLabel>
              <FormInput 
                multiline 
                rows={5} 
                placeholder="Ngoại ngữ (IELTS, TOEIC), tin học, các chứng chỉ nghề nghiệp ngắn hạn, kỹ năng mềm được cấp chứng nhận..." 
                {...register("skills_certificates")} 
              />
            </Grid>
          </Grid>
        </Paper>

        {/* 5. Hồ sơ đính kèm */}
        <Paper sx={{ p: 4, borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <SectionHeader>
            <Box className="left-part">
              <div className="step-number" style={{ backgroundColor: "#8b5cf6" }}>5</div>
              <Typography variant="h6" fontWeight={700}>Hồ sơ đính kèm</Typography>
            </Box>
          </SectionHeader>
          <Box sx={{ p: 2, bgcolor: "#eff6ff", borderRadius: "12px", display: "flex", alignItems: "center", mb: 4, border: "1px solid #bfdbfe" }}>
            <InfoIcon sx={{ color: "#1e40af", mr: 2, fontSize: 20 }} />
            <Typography variant="body2" color="#1e40af" fontWeight={500}>Hồ sơ cần đầy đủ các mục <b>bắt buộc</b> trước khi gửi xét duyệt. Các mục tuỳ chọn sẽ được cộng điểm ưu tiên khi xét.</Typography>
          </Box>

          <Box 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            sx={{ 
            border: "1px dashed #3b82f6", 
            borderRadius: "16px", 
            p: 6, 
            mb: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            bgcolor: "#f8fafc",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": { bgcolor: "#f1f5f9", borderColor: "#2563eb" }
          }}>
            <input 
              type="file" 
              multiple 
              hidden 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png" 
            />
            <Box sx={{ width: 48, height: 48, bgcolor: "#94a3b8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadIcon sx={{ color: "#fff", fontSize: 24 }} />
            </Box>
            <Box textAlign="center">
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Kéo thả tất cả tài liệu vào đây</Typography>
              <Typography variant="caption" color="#64748b" fontWeight={500} sx={{ mt: 0.5, display: "block" }}>PDF, JPG, PNG · Tối đa 10MB mỗi tệp</Typography>
            </Box>
            <Button variant="outlined" size="small" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, mt: 1, pointerEvents: "none" }}>Chọn tệp từ máy tính</Button>
          </Box>

          <Stack spacing={2}>
            {ATTACHMENT_CATEGORIES.map((category, idx) => {
              const file = attachments[idx];
              const fileName = file?.name || file?.title || (file?.path ? file.path.split('/').pop() : "");
              const isPdf = fileName.toLowerCase().endsWith('.pdf');
              const fileSizeLabel = file?.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "--- MB";
              
              return (
                <Box key={idx} sx={{ 
                  p: 2, 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: file ? "#fff" : "transparent"
                }}>
                  <Box sx={{ width: 40, height: 40, bgcolor: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {file ? (isPdf ? <PdfIcon color="error" /> : <DocIcon color="warning" />) : <AddIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e293b">{category.name}</Typography>
                    {file && <Typography variant="caption" color="text.secondary">{fileName} · {fileSizeLabel}</Typography>}
                  </Box>
                  
                  {file ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ color: "#16a34a", bgcolor: "#dcfce7", px: 1.5, py: 0.5, borderRadius: "6px", fontWeight: 700 }}>Đã tải lên</Typography>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} sx={{ color: "#cbd5e1" }}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ color: category.required ? "#dc2626" : "#64748b", bgcolor: category.required ? "#fee2e2" : "#f1f5f9", px: 1.5, py: 0.5, borderRadius: "6px", fontWeight: 700 }}>
                        {category.required ? "Bắt buộc" : "Tuỳ chọn"}
                      </Typography>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }} sx={{ color: "#cbd5e1" }}>
                        <UploadIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ mt: 5, mb: 8, display: "flex", justifyContent: "flex-end" }}>
        <Stack direction="row" spacing={2}>
          <Button onClick={handleBack} variant="outlined" sx={{ px: 4, py: 1.2, borderRadius: "10px", textTransform: "none", fontWeight: 600, color: "#64748b", borderColor: "#e2e8f0" }}>Huỷ bỏ</Button>
          {candidateId && (watchedStatus === 'DRAFT' || watchedStatus === 'REJECTED') && (
            <Button 
              onClick={() => setDeleteDialogOpen(true)} 
              variant="outlined" 
              color="error"
              sx={{ px: 4, py: 1.2, borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
            >
              Xóa hồ sơ
            </Button>
          )}
          {!candidateId && (
            <Button 
              variant="outlined" 
              onClick={handleSubmit(data => onSubmit(data, "DRAFT"), onInvalid)}
              disabled={saving}
              sx={{ px: 4, py: 1.2, borderRadius: "10px", textTransform: "none", fontWeight: 600, border: "1px solid #e2e8f0" }}
            >
              {saving ? <CircularProgress size={16} color="inherit" /> : "Lưu nháp hồ sơ"}
            </Button>
          )}
          <SkySubmitButton 
            variant="contained" 
            onClick={handleSubmit(data => onSubmit(data, "SUBMITTED"), onInvalid)}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : (candidateId ? <CheckIcon /> : <AddIcon />)}
            sx={{ px: 6, py: 1.2, borderRadius: "10px", fontSize: "16px" }}
          >
            {candidateId ? "Cập nhật & Gửi" : "Gửi hồ sơ xét duyệt"}
          </SkySubmitButton>
        </Stack>
      </Box>
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#dc2626", pb: 1 }}>
          <WarningIcon /> Xác nhận xóa hồ sơ
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", py: 1 }}>
            Bạn có chắc chắn muốn xóa hồ sơ của ứng viên <strong>{watch("full_name")}</strong>?
            Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu và tài liệu đính kèm, không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, borderColor: "#e2e8f0", color: "#475569", flex: 1 }}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error" 
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, boxShadow: "none", flex: 1 }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CandidateFormPage;
