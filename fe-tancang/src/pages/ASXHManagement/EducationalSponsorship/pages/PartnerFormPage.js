import React, { useEffect, useState, useMemo } from "react";
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
  Avatar,
  Paper,
  Checkbox,
  FormControlLabel,
  Container,
  Breadcrumbs,
  Link,
  Select,
  OutlinedInput,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ArrowBack as BackIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteOutlineIcon,
  WarningAmber as WarningIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import educationScholarshipService from "@services/educationScholarshipService";
import { useToast } from "@components/common/ToastProvider";
import { useNavigate, useParams } from "react-router-dom";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";
import { SkySubmitButton } from "@styles/SkyStyles";

// --- Styled Components ---
const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  "& .step-number": {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#7c3aed",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
  }
}));

const LogoUploadBox = styled(Box)(({ theme }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f8fafc",
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff"
  }
}));

const StyledTableHead = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 100px 150px 180px 40px",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
  "& .label": {
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase"
  }
}));

const ContactCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  position: "relative",
  backgroundColor: "#fff"
}));

const CoopItem = styled(Box)(({ theme, checked }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0.5, 2), // reduced vertical padding slightly to match image height
  marginBottom: theme.spacing(1.5),
  borderRadius: "8px",
  border: `1px solid ${checked ? "#e2e8f0" : "#e2e8f0"}`, // The image shows consistent light gray borders for both
  backgroundColor: "#fff",
}));

// Custom Label component
const FormLabel = ({ children, required }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", mb: 1, display: "block" }}>
    {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
  </Typography>
);

// Custom Input Field
const FormInput = React.forwardRef(({ placeholder, multiline, error, helperText, ...props }, ref) => (
  <TextField
    fullWidth
    size="small"
    multiline={multiline}
    placeholder={placeholder}
    inputRef={ref}
    error={error}
    helperText={helperText}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        backgroundColor: "#fff",
        ...(multiline && { 
          padding: "12px 14px",
          height: "auto",
          alignItems: "flex-start"
        }),
        "& fieldset": { borderColor: "#cbd5e1" },
        "&:hover fieldset": { borderColor: "#94a3b8" },
        "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "1px" },
      }
    }}
    {...props}
  />
));

const FormSelect = React.forwardRef(({ children, ...props }, ref) => (
  <Select
    fullWidth
    size="small"
    inputRef={ref}
    displayEmpty
    sx={{
      borderRadius: "8px",
      backgroundColor: "#fff",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6", borderWidth: "1px" },
    }}
    {...props}
  >
    {children}
  </Select>
));

// --- Schema ---
const partnerSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập tên trường"),
  short_name: yup.string().required("Vui lòng nhập tên viết tắt"),
  code: yup.string().required("Vui lòng nhập mã trường"),
  address: yup.string().required("Vui lòng nhập địa chỉ"),
  website: yup.string().nullable(),
  main_field: yup.string().nullable(),
  
  status: yup.string().default("PENDING"),
  mou_number: yup.string().nullable(),
  sign_date: yup.string().required("Vui lòng chọn ngày ký"),
  expiry_date: yup.string().required("Vui lòng chọn ngày hết hạn"),
  signatory_tcsg: yup.string().nullable(),
  signatory_school: yup.string().nullable(),
  cooperation_goals: yup.string().nullable(),

  quotas: yup.array().of(yup.object().shape({
    major_name: yup.string().nullable(),
    slots: yup.number().nullable().transform((value, originalValue) => originalValue === "" ? null : value).min(0),
    amount_per_slot: yup.number().nullable().transform((value, originalValue) => originalValue === "" ? null : value).min(0),
  })).nullable(),

  min_gpa: yup.string().nullable(),
  priority_group: yup.string().nullable(),

  contacts: yup.array().of(yup.object().shape({
    name: yup.string().required("Họ tên không được để trống"),
    position: yup.string().nullable(),
    phone: yup.string().nullable(),
    email: yup.string().nullable().email("Email không hợp lệ"),
  })).nullable(),

  cooperation_contents: yup.array().of(yup.string()).default([]),
  attachments: yup.array().default([]),
});

const COOP_OPTIONS = [
  { id: "scholarship", label: "Cấp học bổng cho sinh viên theo niên khóa", type: "Chính" },
  { id: "internship", label: "Tiếp nhận sinh viên thực tập tại TCSG", type: "Bổ sung" },
  { id: "recruitment", label: "Ưu tiên tuyển dụng sinh viên tốt nghiệp xuất sắc", type: "Bổ sung" },
  { id: "research", label: "Phối hợp nghiên cứu khoa học ứng dụng", type: "Bổ sung" },
  { id: "lab_support", label: "Hỗ trợ trang thiết bị phòng thí nghiệm / giảng dạy", type: "Bổ sung" },
  { id: "workshop", label: "Tổ chức hội thảo / talkshow ngành Hàng hải - Logistics", type: "Bổ sung" },
];

/**
 * Trang Thêm mới / Cập nhật Đối tác Đại học (Refined UI)
 */
const PartnerFormPage = () => {
  const navigate = useNavigate();
  const { id: partnerId } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [displayCoopItems, setDisplayCoopItems] = useState(
    COOP_OPTIONS.map(o => ({ id: o.id, label: o.label, type: o.type, isDefault: true }))
  );
  const [newCoopText, setNewCoopText] = useState("");

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
    resolver: yupResolver(partnerSchema),
    defaultValues: {
      name: "",
      short_name: "",
      code: "",
      address: "",
      website: "",
      main_field: "Đa ngành",
      status: "PENDING",
      mou_number: "",
      sign_date: "",
      expiry_date: "",
      signatory_tcsg: "Chọn...",
      signatory_school: "",
      cooperation_goals: "",
      priority_group: "Hộ nghèo / Cận nghèo",
      quotas: [
        { major_name: "Kỹ thuật Hàng hải", slots: 15, amount_per_slot: 25000000 },
        { major_name: "Logistics & Chuỗi cung ứng", slots: 10, amount_per_slot: 20000000 },
        { major_name: "Kỹ thuật Xây dựng CT Biển", slots: 10, amount_per_slot: 25000000 },
        { major_name: "Kinh tế Vận tải", slots: 5, amount_per_slot: 15000000 }
      ],
      contacts: [{ name: "TS. Trần Hữu Phong", position: "Trưởng phòng CTCT", phone: "0901 234 567", email: "phong.tranhhuu@tdtu.edu.vn" }],
      cooperation_contents: ["scholarship", "internship", "research"],
      attachments: [],
    },
  });

  const { fields: quotaFields, append: appendQuota, remove: removeQuota } = useFieldArray({ control, name: "quotas" });
  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({ control, name: "contacts" });

  const watchedQuotas = watch("quotas");
  const watchedContacts = watch("contacts");
  const watchedAttachments = watch("attachments");
  const watchedLogo = watch("logo");
  const totalSlots = useMemo(() => (watchedQuotas || []).reduce((acc, q) => acc + (parseInt(q.slots) || 0), 0), [watchedQuotas]);
  const totalBudget = useMemo(() => (watchedQuotas || []).reduce((acc, q) => acc + ((parseInt(q.slots) || 0) * (parseInt(q.amount_per_slot) || 0)), 0), [watchedQuotas]);

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

  useEffect(() => {
    if (partnerId) fetchDetail();
  }, [partnerId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await educationScholarshipService.getPartnerDetail(partnerId);
      if (res.success) {
        const mappedData = {
          ...res.data,
          name: res.data.name || "",
          short_name: res.data.short_name || "",
          code: res.data.code || "",
          address: res.data.address || "",
          website: res.data.website || "",
          main_field: res.data.primary_field || res.data.main_field || "Đa ngành",
          status: normalizePartnerStatus(res.data.cooperation_status || res.data.status),
          mou_number: res.data.mou_number || "",
          sign_date: res.data.expected_sign_date || res.data.sign_date || "",
          expiry_date: res.data.effective_date || res.data.expiry_date || "",
          signatory_tcsg: res.data.tcsg_signer_name || res.data.signatory_tcsg || "",
          signatory_school: res.data.school_signer_name || res.data.signatory_school || "",
          cooperation_goals: res.data.cooperation_goal || res.data.cooperation_goals || "",
          min_gpa: res.data.min_gpa !== null && res.data.min_gpa !== undefined ? String(res.data.min_gpa) : "",
          priority_group: res.data.priority_target || res.data.priority_group || "Không ưu tiên",
          quotas: (res.data.quotas || []).map(q => ({
            major_name: q.major_name || "",
            slots: q.slots || 0,
            amount_per_slot: q.amount_per_slot || 0
          })),
          contacts: (res.data.contacts || []).map(c => ({
            name: c.full_name || c.name || "",
            position: c.title || c.position || "",
            phone: c.phone || "",
            email: c.email || ""
          })),
          cooperation_contents: (() => {
            const contents = Array.isArray(res.data.cooperation_contents) 
              ? res.data.cooperation_contents 
              : (typeof res.data.cooperation_contents === 'string' ? res.data.cooperation_contents.split(',').filter(Boolean) : []);
            
            // Merge backend items into displayCoopItems if they don't already exist
            setDisplayCoopItems(prev => {
              const newList = [...prev];
              contents.forEach(idOrLabel => {
                const alreadyExists = newList.some(item => item.id === idOrLabel || item.label === idOrLabel);
                if (!alreadyExists) {
                  newList.push({ id: idOrLabel, label: idOrLabel, type: "Bổ sung", isDefault: false });
                }
              });
              return newList;
            });
            
            return contents;
          })(),
          attachments: res.data.attachments || []
        };
        reset(mappedData);
        if (res.data.logo_path) {
          const fullLogoUrl = res.data.logo_path.startsWith("http") 
            ? res.data.logo_path 
            : `${APP_BASE}/${res.data.logo_path}`;
          setLogoPreview(fullLogoUrl);
        }
      }
    } catch (err) {
      toast("Lỗi khi tải chi tiết đối tác", "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data, statusOverride = null) => {
    setSaving(true);
    try {
      const isDraft = statusOverride === "DRAFT";
      // 1. Lưu thông tin text chính
      const payload = {
        ...data,
        sign_date: data.sign_date ? dayjs(data.sign_date).format("YYYY-MM-DD") : "",
        expiry_date: data.expiry_date ? dayjs(data.expiry_date).format("YYYY-MM-DD") : "",
        cooperation_status: statusOverride || (data.cooperation_status === "DRAFT" ? "PENDING" : (data.cooperation_status || "PENDING"))
      };

      const res = partnerId 
        ? await educationScholarshipService.updatePartner(partnerId, payload)
        : await educationScholarshipService.createPartner(payload);
      
      if (res.success) {
        const newPartnerId = res.data.id || partnerId;

        // 2. Upload Logo nếu có thay đổi
        if (logoFile) {
          try {
            await educationScholarshipService.uploadPartnerLogo(newPartnerId, logoFile);
          } catch (err) {
            console.error("Failed to upload logo:", err);
            toast("Lỗi khi tải lên logo", "warning");
          }
        }

        // 3. Upload các tài liệu đính kèm mới
        if (data.attachments && data.attachments.length > 0) {
          const newFiles = data.attachments.filter(f => f instanceof File);
          if (newFiles.length > 0) {
            const uploadPromises = newFiles.map(file => 
              educationScholarshipService.uploadPartnerAttachment(newPartnerId, {
                file,
                title: file.name,
                doc_type: "MOU"
              })
            );
            await Promise.all(uploadPromises);
          }
        }

        const successMsg = isDraft ? "Đã lưu nháp hồ sơ" : (partnerId ? "Cập nhật thành công" : "Thêm trường thành công");
        toast(successMsg, "success");
        navigate("/asxh/educational-sponsorship");
      }
    } catch (err) {
      const isDraft = statusOverride === "DRAFT";
      const defaultError = isDraft ? "Lỗi khi lưu bản nháp" : "Lỗi khi lưu dữ liệu";
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
      } else if (err.response?.data?.errors) {
        const beErrors = err.response.data.errors;
        Object.keys(beErrors).forEach((key) => {
          setError(key, { type: "server", message: beErrors[key] });
        });
        toast(isDraft ? "Vui lòng kiểm tra lại các bản nháp" : "Vui lòng kiểm tra lại các trường thông tin", "error");
      } else {
        toast(err.response?.data?.message || defaultError, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errors) => {
    console.error("Form Validation Errors:", errors);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast(firstError.message || "Vui lòng kiểm tra lại các trường bắt buộc", "error");
    } else {
      toast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value);
  const handleBack = () => navigate("/asxh/educational-sponsorship");

  const handleAddCoop = () => {
    if (!newCoopText.trim()) return;
    const label = newCoopText.trim();
    if (displayCoopItems.some(o => o.label === label || o.id === label)) {
      toast("Nội dung này đã tồn tại", "warning");
      return;
    }
    
    setDisplayCoopItems(prev => [...prev, { id: label, label: label, type: "Bổ sung", isDefault: false }]);
    const currentVal = getValues("cooperation_contents") || [];
    setValue("cooperation_contents", [...currentVal, label]);
    setNewCoopText("");
  };

  const handleRemoveCoop = (id) => {
    setDisplayCoopItems(prev => prev.filter(v => v.id !== id));
    const currentVal = getValues("cooperation_contents") || [];
    setValue("cooperation_contents", currentVal.filter(v => v !== id));
  };

  const handleDelete = () => {
    if (!partnerId) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      const res = await educationScholarshipService.deletePartner(partnerId);
      if (res.success) {
        toast("Đã xóa trường đối tác thành công", "success");
        setDeleteDialogOpen(false);
        handleBack();
      }
    } catch (err) {
      toast("Lỗi khi xóa dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}><CircularProgress /></Box>;

  return (
    <>
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
            {partnerId ? "Cập nhật Trường Đại học Hợp tác" : "Thêm Trường Đại học Hợp tác"}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Thiết lập quan hệ hợp tác và chương trình học bổng với trường đại học
        </Typography>
      </Box>

      <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        
        {/* 1. Thông tin trường đại học */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">1</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Thông tin trường đại học</Typography>
            </SectionHeader>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  id="logo-upload" 
                  style={{ display: "none" }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast("Ảnh vượt quá 2MB", "error");
                        return;
                      }
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                      setValue("logo", file.name); // Just to trigger form state dirty
                    }
                  }} 
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <label htmlFor="logo-upload" style={{ cursor: "pointer", display: "block" }}>
                    <LogoUploadBox>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px", padding: "4px" }} />
                      ) : (
                        <UploadFileIcon sx={{ color: "#94a3b8" }} />
                      )}
                    </LogoUploadBox>
                  </label>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Logo trường</Typography>
                    <Typography variant="caption" color="#64748b">Tải lên logo chính thức · PNG hoặc JPG · Tối đa 2MB</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <FormLabel required>Tên trường đại học</FormLabel>
                <FormInput placeholder="VD: Đại học Tôn Đức Thắng" {...register("name")} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel required>Tên viết tắt</FormLabel>
                <FormInput placeholder="VD: TDTU" {...register("short_name")} error={!!errors.short_name} helperText={errors.short_name?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel required>Mã trường</FormLabel>
                <FormInput placeholder="VD: QST" {...register("code")} error={!!errors.code} helperText={errors.code?.message} />
              </Grid>
              <Grid item xs={12}>
                <FormLabel required>Địa chỉ</FormLabel>
                <FormInput placeholder="Số 19 Nguyễn Hữu Thọ, Q.7, TP.HCM" {...register("address")} error={!!errors.address} helperText={errors.address?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Website</FormLabel>
                <FormInput placeholder="https://tdtu.edu.vn" {...register("website")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Lĩnh vực đào tạo chính</FormLabel>
                <Controller
                  name="main_field"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field}>
                      <MenuItem value="Chọn lĩnh vực...">Chọn lĩnh vực...</MenuItem>
                      <MenuItem value="Kỹ thuật – Công nghệ">Kỹ thuật – Công nghệ</MenuItem>
                      <MenuItem value="Đa ngành">Đa ngành</MenuItem>
                      <MenuItem value="Kinh tế – Quản trị">Kinh tế – Quản trị</MenuItem>
                      <MenuItem value="Y – Dược">Y – Dược</MenuItem>
                      <MenuItem value="Sư phạm">Sư phạm</MenuItem>
                    </FormSelect>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* 2. Biên bản ghi nhớ (MOU) */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">2</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Biên bản ghi nhớ (MOU)</Typography>
            </SectionHeader>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormLabel required>Trạng thái hợp tác</FormLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field}>
                      <MenuItem value="NEGOTIATING">Đang thương lượng</MenuItem>
                      <MenuItem value="ACTIVE">Đã ký MOU</MenuItem>
                      <MenuItem value="PENDING">Chờ ký MOU</MenuItem>
                      <MenuItem value="PAUSED">Tạm dừng</MenuItem>
                    </FormSelect>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Số MOU</FormLabel>
                <FormInput placeholder="VD: MOU-2026/003" {...register("mou_number")} />
              </Grid>
              <Grid item xs={6}>
                <FormLabel required>Ngày ký kết MOU</FormLabel>
                <Controller
                  name="sign_date"
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
                          error: !!errors.sign_date,
                          helperText: errors.sign_date?.message,
                          sx: { 
                            "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" }
                          }
                        } 
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <FormLabel required>Ngày hết hạn</FormLabel>
                <Controller
                  name="expiry_date"
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
                          error: !!errors.expiry_date,
                          helperText: errors.expiry_date?.message,
                          sx: { 
                            "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" }
                          }
                        } 
                      }}
                    />
                  )}
                />
                <Typography variant="caption" sx={{ color: "#94a3b8", mt: 0.5, display: "block" }}>Thời hạn hợp tác: 3 năm</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Người ký phía TCSG</FormLabel>
                <Controller
                  name="signatory_tcsg"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field}>
                      <MenuItem value="Chọn...">Chọn...</MenuItem>
                      <MenuItem value="Nguyễn Phúc Nguyên – TGĐ">Nguyễn Phúc Nguyên – TGĐ</MenuItem>
                      <MenuItem value="Vũ Đức Anh – P.TGĐ">Vũ Đức Anh – P.TGĐ</MenuItem>
                    </FormSelect>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Người ký phía trường</FormLabel>
                <FormInput placeholder="Họ tên – Chức vụ" {...register("signatory_school")} />
              </Grid>
              <Grid item xs={12}>
                <FormLabel>Mục tiêu hợp tác</FormLabel>
                <FormInput 
                  multiline 
                  rows={3}
                  placeholder="Cấp học bổng cho sinh viên ngành Hàng hải, Logistics, Kỹ thuật xây dựng công trình biển. Tiếp nhận sinh viên thực tập tại các đơn vị trực thuộc TCSG. Phối hợp nghiên cứu ứng dụng trong lĩnh vực cảng biển." 
                  {...register("cooperation_goals")}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* 3. Phân bổ học bổng theo ngành */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">3</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Phân bổ học bổng theo ngành</Typography>
            </SectionHeader>
            <Button size="small" sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }} onClick={() => appendQuota({})}>
              + Thêm ngành
            </Button>
          </Box>

          <StyledTableHead>
            <span className="label">Ngành / Chuyên ngành</span>
            <span className="label">Số suất</span>
            <span className="label">Mức HB / Suất</span>
            <span className="label">Tổng ngân sách</span>
            <span></span>
          </StyledTableHead>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            {quotaFields.map((field, index) => (
              <Box key={field.id} sx={{ display: "grid", gridTemplateColumns: "2fr 100px 150px 180px 40px", gap: 2, mb: 2, alignItems: "center" }}>
                <FormInput placeholder="VD: Kỹ thuật Hàng hải" {...register(`quotas.${index}.major_name`)} />
                <FormInput type="number" sx={{ textAlign: "center" }} {...register(`quotas.${index}.slots`)} />
                <FormInput type="text" {...register(`quotas.${index}.amount_per_slot`)} value={formatCurrency(watchedQuotas[index]?.amount_per_slot || 0)} onChange={() => {}} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#9333ea", textAlign: "right" }}>
                  {formatCurrency((watchedQuotas[index]?.slots || 0) * (watchedQuotas[index]?.amount_per_slot || 0))}
                </Typography>
                <IconButton size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "#ef4444" } }} onClick={() => removeQuota(index)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 2, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" fontWeight={600} color="#64748b">{totalSlots} suất học bổng · {quotaFields.length} ngành</Typography>
            <Typography variant="body2" color="#64748b">
              Tổng ngân sách: <strong style={{ color: "#9333ea", fontSize: "15px" }}>{formatCurrency(totalBudget)} VND</strong>
            </Typography>
          </Box>

          <Box sx={{ p: 3, pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormLabel>Điều kiện GPA tối thiểu</FormLabel>
                <FormInput placeholder="3.0" {...register("min_gpa")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormLabel>Đối tượng ưu tiên</FormLabel>
                <Controller
                  name="priority_group"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field}>
                      <MenuItem value="Không ưu tiên">Không ưu tiên</MenuItem>
                      <MenuItem value="Hộ nghèo / Cận nghèo">Hộ nghèo / Cận nghèo</MenuItem>
                      <MenuItem value="Dân tộc thiểu số">Dân tộc thiểu số</MenuItem>
                      <MenuItem value="Vùng sâu vùng xa">Vùng sâu vùng xa</MenuItem>
                      <MenuItem value="Con em CBCNV TCSG">Con em CBCNV TCSG</MenuItem>
                    </FormSelect>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* 4. Đầu mối liên hệ */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">4</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Đầu mối liên hệ tại trường</Typography>
            </SectionHeader>
            <Button size="small" sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }} onClick={() => appendContact({})}>
              + Thêm
            </Button>
          </Box>
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {contactFields.map((field, index) => {
                const nameStr = watchedContacts[index]?.name || "";
                const initials = nameStr ? nameStr.split(' ').map(n=>n[0]).join('').slice(-2).toUpperCase() : "?";
                let avatarColor = "#d97706"; // default orange for empty (?)
                if (initials === "TH") avatarColor = "#8b5cf6"; // purple
                else if (initials === "NL") avatarColor = "#0d9488"; // green

                return (
                  <Box key={field.id} sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", gap: 3, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: avatarColor, width: 44, height: 44, fontWeight: 700, fontSize: "15px" }}>
                      {initials}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={6}><FormInput placeholder="Họ tên" {...register(`contacts.${index}.name`)} /></Grid>
                        <Grid item xs={12} md={6}><FormInput placeholder="Chức vụ" {...register(`contacts.${index}.position`)} /></Grid>
                        <Grid item xs={12} md={6}><FormInput placeholder="Số điện thoại" {...register(`contacts.${index}.phone`)} /></Grid>
                        <Grid item xs={12} md={6}><FormInput placeholder="Email" {...register(`contacts.${index}.email`)} /></Grid>
                      </Grid>
                    </Box>
                    <IconButton size="small" sx={{ alignSelf: "flex-start", color: "#cbd5e1", mt: -0.5, "&:hover": { color: "#ef4444" } }} onClick={() => removeContact(index)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Paper>

        {/* 5. Nội dung hợp tác */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">5</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Nội dung hợp tác</Typography>
            </SectionHeader>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={1}>
              {displayCoopItems.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Controller
                    name="cooperation_contents"
                    control={control}
                    render={({ field }) => {
                      const isChecked = (field.value || []).includes(item.id);
                      return (
                        <CoopItem checked={isChecked}>
                          <FormControlLabel
                            control={<Checkbox size="small" checked={isChecked} onChange={(e) => field.onChange(e.target.checked ? [...(field.value || []), item.id] : (field.value || []).filter(v => v !== item.id))} sx={{ color: "#cbd5e1", "&.Mui-checked": { color: "#8b5cf6" } }} />}
                            label={<Typography variant="body2" color="#334155">{item.label}</Typography>}
                          />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>{item.type}</Typography>
                            <IconButton size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "#ef4444" } }} onClick={() => handleRemoveCoop(item.id)}>
                              <CloseIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </CoopItem>
                      );
                    }}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Box sx={{ mt: 1, p: 2, borderRadius: "8px", border: "1px dashed #cbd5e1", bgcolor: "#f8fafc" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField 
                      fullWidth 
                      size="small" 
                      placeholder="Thêm nội dung hợp tác khác..." 
                      value={newCoopText}
                      onChange={(e) => setNewCoopText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCoop(); } }}
                      sx={{ 
                        bgcolor: "#fff",
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" }
                      }}
                    />
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleAddCoop}
                      startIcon={<AddIcon />}
                      sx={{ 
                        height: "40px", 
                        px: 3, 
                        borderRadius: "8px", 
                        textTransform: "none",
                        bgcolor: "#7c3aed",
                        "&:hover": { bgcolor: "#6d28d9" }
                      }}
                    >
                      Thêm
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* 6. Tài liệu đính kèm */}
        <Paper sx={{ p: 0, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <SectionHeader sx={{ mb: 0 }}>
              <div className="step-number">6</div>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">Tài liệu đính kèm</Typography>
            </SectionHeader>
          </Box>
          <Box sx={{ p: 3 }}>
            <Box>
              <input type="file" multiple id="upload-files" style={{ display: "none" }} onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                setValue("attachments", [...(watchedAttachments || []), ...newFiles]);
              }} />
              <label htmlFor="upload-files" style={{ cursor: "pointer", display: "block" }}>
                <Box sx={{ border: "1px dashed #cbd5e1", borderRadius: "8px", p: 4, mb: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, bgcolor: "#fff", transition: "0.2s", "&:hover": { bgcolor: "#f8fafc" } }}>
                  <CloudUploadIcon sx={{ color: "#94a3b8", fontSize: "32px", mb: 0 }} />
                  <Typography variant="body2" color="#475569" fontWeight={500}>MOU bản nháp, Thư ngỏ, Hồ sơ năng lực trường</Typography>
                  <Typography variant="caption" color="#94a3b8">PDF, Word – Tối đa 20MB</Typography>
                </Box>
              </label>

              {watchedAttachments && watchedAttachments.length > 0 && (
                <Stack spacing={1.5}>
                  {watchedAttachments.map((file, idx) => {
                    const isPdf = (file.name || file.title)?.toLowerCase().endsWith(".pdf");
                    const fileName = file.name || file.title || "Tài liệu đính kèm";
                    const fileSize = file.size ? (file.size / (1024 * 1024)).toFixed(1) : "---";

                    return (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", gap: 1.5, alignItems: "center", bgcolor: "#f8fafc" }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: isPdf ? "#ef4444" : "#3b82f6", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: 700 }}>
                          {isPdf ? "PDF" : "DOC"}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="#334155" sx={{ lineHeight: 1.2 }}>{fileName}</Typography>
                          <Typography variant="caption" color="#94a3b8">{fileSize} MB</Typography>
                        </Box>
                        <IconButton size="small" sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }} onClick={async () => {
                          if (file.id) {
                            // Xóa trên server nếu là file đã có
                            try {
                              const res = await educationScholarshipService.deletePartnerAttachment(file.id);
                              if (res.success) toast("Đã xóa tài liệu trên hệ thống", "success");
                            } catch (err) {
                              toast("Lỗi khi xóa tài liệu", "error");
                              return;
                            }
                          }
                          const newArr = [...watchedAttachments];
                          newArr.splice(idx, 1);
                          setValue("attachments", newArr);
                        }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Form Actions Foot */}
          <Box sx={{ p: 2.5, bgcolor: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<DeleteOutlineIcon fontSize="small" />} sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }} onClick={handleBack}>
                Huỷ bỏ
              </Button>
              {partnerId && (
                <Button 
                  startIcon={<DeleteOutlineIcon fontSize="small" />} 
                  sx={{ color: "#ef4444", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#fef2f2" } }} 
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Xóa trường
                </Button>
              )}
            </Stack>
            <Stack direction="row" spacing={2}>
              {!partnerId && (
                <Button 
                  variant="outlined" 
                  onClick={handleSubmit(data => onSubmit(data, "DRAFT"), onInvalid)}
                  disabled={saving}
                  sx={{ bgcolor: "#fff", borderColor: "#e2e8f0", color: "#475569", textTransform: "none", fontWeight: 600, borderRadius: "6px", "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" } }}
                >
                  {saving ? <CircularProgress size={16} color="inherit" /> : "Lưu nháp"}
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={handleSubmit(data => onSubmit(data, "SUBMITTED"), onInvalid)}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
                sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669", boxShadow: "none" }, textTransform: "none", fontWeight: 600, borderRadius: "6px", boxShadow: "none" }}
              >
                {partnerId ? "Cập nhật thông tin" : "Thêm trường hợp tác"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
    
    {/* Dialog xác nhận xóa */}
    <Dialog 
      open={deleteDialogOpen} 
      onClose={() => !saving && setDeleteDialogOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={700} color="#1e293b">Xác nhận xóa</Typography>
        <IconButton size="small" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
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
          <Typography variant="body1" fontWeight={600} gutterBottom>
            Xác nhận xóa trường đại học này?
          </Typography>
          <Typography variant="body2" color="#64748b">
            Thao tác này sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          onClick={() => setDeleteDialogOpen(false)}
          disabled={saving}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, borderColor: "#e2e8f0", color: "#475569", py: 1 }}
        >
          Hủy bỏ
        </Button>
        <SkySubmitButton 
          fullWidth 
          variant="contained" 
          onClick={handleConfirmDelete}
          showLoading={saving}
          sx={{ 
            borderRadius: "10px", 
            py: 1,
            bgcolor: "#ef4444",
            "&:hover": { bgcolor: "#dc2626" }
          }}
        >
          {saving ? "Đang xóa..." : "Xác nhận xóa"}
        </SkySubmitButton>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default PartnerFormPage;
