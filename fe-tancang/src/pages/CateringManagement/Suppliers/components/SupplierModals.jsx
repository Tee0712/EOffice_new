import React, { useEffect, useState } from "react";
import { callApi } from "@services/api";
import { API_CATERING_CATEGORIES } from "@EnvironmentFile/constants/urlConfig";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
  MenuItem,
  Rating,
  FormHelperText,
  InputLabel,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  AddCircle as AddCircleIcon,
  LockOutlined as LockIcon,
  InfoOutlined as InfoIcon,
  PersonOutline as PersonIcon,
  AssignmentOutlined as ContractDetailIcon,
  Apartment as OfficeIcon,
  EditOutlined as EditIcon,
  FileDownloadOutlined as ExportIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as SuccessIcon,
  SaveOutlined as SaveIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { supplierSchema, contractSchema, evaluationSchema } from "../constants";

const ModalHeader = ({ title, onClose, icon: Icon = AddCircleIcon }) => (
  <DialogTitle
    sx={{
      m: 0,
      p: 2.5,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        sx={{
          bgcolor: "#e6f7ff",
          p: 0.5,
          borderRadius: "50%",
          display: "flex",
        }}
      >
        <Icon sx={{ color: "#1890ff", fontSize: 24 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a3353" }}>
        {title}
      </Typography>
    </Box>
    <IconButton
      onClick={onClose}
      size="small"
      sx={{ bgcolor: "#f1f5f9", borderRadius: "8px" }}
    >
      <CloseIcon sx={{ fontSize: 20 }} />
    </IconButton>
  </DialogTitle>
);

const FieldLabel = ({ label, required }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "#334155" }}>
    {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
  </Typography>
);

const DetailSection = ({ icon: Icon, title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Icon sx={{ color: "#1890ff", fontSize: 20 }} />
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: "#1a3353" }}
      >
        {title}
      </Typography>
    </Box>
    <Divider sx={{ mb: 2, borderColor: "#f1f5f9" }} />
    <Grid container spacing={2.5}>
      {children}
    </Grid>
  </Box>
);

const DetailItem = ({ label, value, span = 6, children }) => (
  <Grid item xs={span}>
    <Typography
      variant="caption"
      sx={{
        color: "#64748b",
        fontWeight: 600,
        textTransform: "uppercase",
        display: "block",
        mb: 0.5,
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </Typography>
    {children ? (
      children
    ) : (
      <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a3353" }}>
        {value || "---"}
      </Typography>
    )}
  </Grid>
);

export const ViewModal = ({ open, onClose, onEdit, supplier }) => {
  if (!supplier) return null;

  const getStatusBadge = (status) => {
    const isActive = status === "APPROVED" || status === "ACTIVE";
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          bgcolor: isActive ? "#e6fffb" : "#fff1f0",
          color: isActive ? "#52c41a" : "#f5222d",
          px: 1.5,
          py: 0.25,
          borderRadius: "100px",
          border: `1px solid ${isActive ? "#b7eb8f" : "#ffa39e"}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: isActive ? "#52c41a" : "#f5222d",
          }}
        />
        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
          {isActive ? "Đang hiệu lực" : "Chưa có/Hết hạn"}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "standard-font",
        sx: {
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #eef2f6",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "12px",
              bgcolor: "#e0f2fe",
              color: "#0ea5e9",
              display: "flex",
            }}
          >
            <OfficeIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}
            >
              Chi tiết Nhà cung cấp
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 500 }}
            >
              Mã NCC: NCC-{supplier.id?.toString().padStart(3, "0")}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            bgcolor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 4 }}>
        {/* Basic Info */}
        <DetailSection icon={InfoIcon} title="Thông tin cơ bản">
          <DetailItem label="TÊN CÔNG TY CC" value={supplier.name} span={8} />
          <DetailItem label="M� S� THU�" value={supplier.taxCode} span={4} />
          <DetailItem
            label="LOẠI HÌNH"
            value={
              supplier.type === "INDUSTRIAL_LUNCH"
                ? "Suất ăn công nghiệp"
                : supplier.type === "FRESH_FOOD"
                  ? "Thực phẩm tươi sống"
                  : supplier.type === "BEVERAGE"
                    ? "Đồ uống"
                    : "---"
            }
            span={4}
          />
          <DetailItem label="ĐỊA CHỈ" value={supplier.address} span={8} />
        </DetailSection>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <DetailSection icon={PersonIcon} title="Thông tin liên hệ">
              <DetailItem
                label="NGƯỜI LIÊN HỆ"
                value={supplier.contactPerson}
                span={12}
              />
              <DetailItem
                label="SỐ ĐIỆN THOẠI"
                value={supplier.phone}
                span={12}
              />
              <DetailItem
                label="EMAIL"
                value={supplier.email || "---"}
                span={12}
              />
            </DetailSection>
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailSection icon={ContractDetailIcon} title="Dịch vụ & Đánh giá">
              <DetailItem label="TRẠNG THÁI CC" span={12}>
                {getStatusBadge(supplier.contractStatusCached)}
              </DetailItem>
              <DetailItem label="ĐÁNH GIÁ TB" span={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Rating
                    value={Number(supplier.ratingAvgCached) || 0}
                    readOnly
                    precision={0.5}
                    size="small"
                  />
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 700, ml: 0.5 }}
                  >
                    {supplier.ratingAvgCached || 0}{" "}
                    <span style={{ fontWeight: 400, color: "#64748b" }}>
                      ({supplier.ratingCountCached || 0} đánh giá)
                    </span>
                  </Typography>
                </Box>
              </DetailItem>
              <DetailItem
                label="NGÀY HẾT HẠN HĐ"
                value={supplier.contractEndAtCached}
                span={12}
              />
            </DetailSection>
          </Grid>
        </Grid>

        {supplier.notes && (
          <Box
            sx={{
              p: 2,
              bgcolor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #eef0f4",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: 0.5, display: "block" }}
            >
              GHI CHÚ
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "#334155" }}
            >
              "{supplier.notes}"
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          gap: 1.5,
          justifyContent: "flex-end",
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            px: 4,
            py: 1,
            color: "#64748b",
            borderColor: "#d1d5db",
          }}
        >
          Đóng
        </Button>
        <Button
          onClick={() => {
            onEdit(supplier);
            onClose();
          }}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            py: 1,
            bgcolor: "#22c55e",
            "&:hover": { bgcolor: "#16a34a" },
          }}
        >
          Chỉnh sửa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DEFAULT_SUPPLIER_CATEGORIES = [
  { code: "FOOD", name: "Suất ăn công nghiệp & Bếp nấu" },
  { code: "FRESH_FOOD", name: "Nông sản & Thực phẩm tươi sống" },
  { code: "MEAT_SEAFOOD", name: "Thịt, Cá & Hải sản tươi" },
  { code: "DRY_FOOD", name: "Gia vị, Gạo & Đồ khô" },
  { code: "BEVERAGE", name: "Nước uống & Tráng miệng" },
];

export const SupplierFormModal = ({
  open,
  onClose,
  onSubmit,
  supplier,
  mode = "ADD",
}) => {
  const isEdit = mode === "EDIT";
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      name: "",
      taxCode: "",
      contactName: "",
      phone: "",
      email: "",
      type: "FOOD",
      address: "",
      startDate: null,
      endDate: null,
      notes: "",
    },
  });

  const [categories, setCategories] = useState(DEFAULT_SUPPLIER_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await callApi("get", API_CATERING_CATEGORIES);
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setCategories(res.data);
        } else if (Array.isArray(res) && res.length > 0) {
          setCategories(res);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (supplier && isEdit) {
      const rawStartDate =
        supplier.contractStartAtCached ||
        supplier.updatedAt ||
        supplier.createdAt;
      const formattedStartDate = rawStartDate ? dayjs(rawStartDate) : null;
      const formattedEndDate = supplier.contractEndAtCached
        ? dayjs(supplier.contractEndAtCached)
        : null;

      reset({
        name: supplier.name,
        taxCode: supplier.taxCode,
        contactName: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        type: supplier.type || "FOOD",
        address: supplier.address || "",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        notes: supplier.notes || "",
      });
    } else {
      reset({
        name: "",
        taxCode: "",
        contactName: "",
        phone: "",
        email: "",
        type: "FOOD",
        address: "",
        startDate: null,
        endDate: null,
        notes: "",
      });
    }
  }, [supplier, isEdit, reset, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      PaperProps={{ className: "standard-font", sx: { borderRadius: "16px" } }}
    >
      <ModalHeader
        title={isEdit ? "Chỉnh sửa nhà cung cấp" : "Thêm mới nhà cung cấp"}
        onClose={onClose}
      />
      <Divider />
      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Tên nhà cung cấp" required />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập tên công ty..."
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Mã số thuế" required />
            <Controller
              name="taxCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập mã số thuế..."
                  error={!!errors.taxCode}
                  helperText={errors.taxCode?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Người liên hệ" required />
            <Controller
              name="contactName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập họ tên người liên hệ..."
                  error={!!errors.contactName}
                  helperText={errors.contactName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Số điện thoại" required />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập số điện thoại..."
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Grid>
          {/* Row 3 */}
          <Grid item xs={12} md={6}>
            <FieldLabel label="Email" required />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập địa chỉ email..."
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Loại hình cung cấp" required />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.type}>
                  <Select {...field} displayEmpty>
                    <MenuItem value="" disabled>
                      -- Chọn loại hình --
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.code} value={cat.code}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.type && (
                    <FormHelperText>{errors.type.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          {/* Row 4 - Address */}
          <Grid item xs={12}>
            <FieldLabel label="Địa chỉ" required />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  placeholder="Nhập địa chỉ công ty..."
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              )}
            />
          </Grid>
          {/* Row 5 - Dates */}
          <Grid item xs={12} md={6}>
            <FieldLabel label="Ngày bắt đầu HĐ" required />
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      error: !!errors.startDate,
                      helperText: errors.startDate?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel label="Ngày kết thúc HĐ" required />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      error: !!errors.endDate,
                      helperText: errors.endDate?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>
          {/* Row 6 - Notes */}
          <Grid item xs={12}>
            {/* <FieldLabel label="Ghi chú" /> */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ghi chú"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  placeholder="Nhập ghi chú thêm về nhà cung cấp..."
                  multiline
                  rows={4}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          p: 4,
          gap: 1.5,
          borderTop: "0.5px solid #f1f5f9",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            px: 4,
            py: 1,
            color: "#64748b",
            borderColor: "#d1d5db",
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            px: 4,
            py: 1,
            bgcolor: "#22c55e",
            "&:hover": { bgcolor: "#16a34a" },
          }}
        >
          Lưu thông tin
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ContractModal = ({ open, onClose, onSubmit, supplier }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(contractSchema),
    defaultValues: {
      contractNo: "",
      signDate: null,
      effectiveDate: null,
      expiryDate: null,
      amount: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        contractNo: "",
        signDate: null,
        effectiveDate: null,
        expiryDate: null,
        amount: 0,
      });
    }
  }, [open, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      PaperProps={{ className: "standard-font" }}
    >
      <ModalHeader
        title={`Ký hợp đồng - ${supplier?.name}`}
        onClose={onClose}
      />
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="contractNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Số hợp đồng"
                  size="small"
                  error={!!errors.contractNo}
                  helperText={errors.contractNo?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="signDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Ngày ký"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  error={!!errors.signDate}
                  value={field.value || ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="effectiveDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Ngày hiệu lực"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  error={!!errors.effectiveDate}
                  value={field.value || ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="expiryDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Ngày hết hạn"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  error={!!errors.expiryDate}
                  value={field.value || ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Giá trị hợp đồng (VNĐ)"
                  size="small"
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button type="submit" variant="contained">
          Lưu hợp đồng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const EvaluationModal = ({ open, onClose, onSubmit, supplier }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(evaluationSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      evaluationDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        rating: 5,
        comment: "",
        evaluationDate: new Date(),
      });
    }
  }, [open, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      PaperProps={{ className: "standard-font" }}
    >
      <ModalHeader
        title={`Đánh giá Nhà cung cấp - ${supplier?.name}`}
        onClose={onClose}
      />
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Đánh giá chất lượng dịch vụ
          </Typography>
          <Controller
            name="rating"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Rating
                value={value}
                onChange={(event, newValue) => onChange(newValue)}
                size="large"
              />
            )}
          />
          {errors.rating && (
            <FormHelperText error>{errors.rating.message}</FormHelperText>
          )}
        </Box>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nội dung đánh giá"
              multiline
              rows={4}
              error={!!errors.comment}
              helperText={errors.comment?.message}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button type="submit" variant="contained">
          Gửi đánh giá
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const PriceUpdateModal = ({ open, onClose, onSubmit, supplier }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "standard-font" }}
    >
      <ModalHeader
        title={`Cập nhật bảng giá - ${supplier?.name}`}
        onClose={onClose}
      />
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            border: "2px dashed #d9d9d9",
            borderRadius: "8px",
            p: 4,
            textAlign: "center",
            bgcolor: "#fafafa",
            cursor: "pointer",
            "&:hover": { borderColor: "#1890ff", bgcolor: "#f0f7ff" },
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: "#bfbfbf", mb: 1 }} />
          <Typography variant="body1">
            Click hoặc kéo thả file bảng giá vào đây
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hỗ trợ định dạng .xlsx, .xls
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ mt: 2, display: "block", color: "#1890ff", cursor: "pointer" }}
        >
          Tải file mẫu bảng giá tại đây
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button variant="contained" disabled>
          Xác nhận tải lên
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  supplierName,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      className: "standard-font",
      sx: { borderRadius: "20px", p: 1 },
    }}
  >
    <DialogContent sx={{ textAlign: "center", pt: 4, pb: 2 }}>
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: "#fff1f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          border: "1px solid #ffa39e",
        }}
      >
        <DeleteIcon sx={{ color: "#f5222d", fontSize: 32 }} />
      </Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 800, color: "#1a3353", mb: 1 }}
      >
        Xác nhận xóa
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", px: 2 }}>
        Bạn có chắc chắn muốn xóa nhà cung cấp{" "}
        <strong style={{ color: "#1e293b" }}>{supplierName}</strong>?
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 3, justifyContent: "center", gap: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          textTransform: "none",
          borderRadius: "10px",
          px: 3,
          color: "#64748b",
          borderColor: "#d1d5db",
        }}
      >
        Quay lại
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        sx={{
          textTransform: "none",
          borderRadius: "10px",
          px: 4,
          bgcolor: "#ff4d4f",
          "&:hover": { bgcolor: "#f5222d" },
          boxShadow: "0 4px 12px rgba(245, 34, 45, 0.35)",
        }}
      >
        Xác nhận xóa
      </Button>
    </DialogActions>
  </Dialog>
);

export const ExportPreviewModal = ({
  open,
  onClose,
  onConfirm,
  data = [],
  filters = {},
}) => {
  const previewData = data.slice(0, 5);
  const today = dayjs().startOf("day");
  const isAll = filters.keyword === "Tất cả hệ thống";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "standard-font", sx: { borderRadius: "20px" } }}
    >
      <ModalHeader
        title="Xác nhận xuất dữ liệu Excel"
        onClose={onClose}
        icon={ExportIcon}
      />
      <Divider />
      <DialogContent sx={{ p: 4 }}>
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #eef2f6",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                }}
              >
                TỔNG SỐ BẢN GHI
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: "#0f172a", fontWeight: 800 }}
              >
                {data.length} Nhà cung cấp
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                }}
              >
                PHẠM VI XUẤT DỮ LIỆU
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SuccessIcon sx={{ color: "#52c41a", fontSize: "18px" }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#1e293b" }}
                >
                  {isAll
                    ? "Toàn bộ hệ thống"
                    : "Danh sách theo bộ lọc hiện tại"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1.5, color: "#475569" }}
        >
          Xem trước dữ liệu (5 dòng đầu tiên):
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 700, fontSize: "11px", color: "#64748b" }}
                >
                  TÊN NCC
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, fontSize: "11px", color: "#64748b" }}
                >
                  MST
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, fontSize: "11px", color: "#64748b" }}
                >
                  SĐT
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, fontSize: "11px", color: "#64748b" }}
                >
                  TRẠNG THÁI
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((item) => {
                const endDate = item.contractEndAtCached
                  ? dayjs(item.contractEndAtCached)
                  : null;
                const isExpired =
                  endDate && endDate.isValid() ? today.isAfter(endDate) : false;
                const statusLabel = isExpired ? "Hết hạn" : "Đang hiệu lực";
                const statusColor = isExpired ? "#cf1322" : "#0369a1";
                const statusBg = isExpired ? "#fff1f0" : "#f0f9ff";

                return (
                  <TableRow
                    key={item.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ fontSize: "13px", color: "#64748b" }}>
                      {item.taxCode}
                    </TableCell>
                    <TableCell sx={{ fontSize: "13px", color: "#64748b" }}>
                      {item.phone}
                    </TableCell>
                    <TableCell sx={{ fontSize: "13px" }}>
                      <Chip
                        label={statusLabel}
                        size="small"
                        sx={{
                          height: "20px",
                          fontSize: "11px",
                          bgcolor: statusBg,
                          color: statusColor,
                          border: "none",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length > 5 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      bgcolor: "#f8fafc",
                      fontStyle: "italic",
                      py: 1.5,
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    ... và {data.length - 5} bản ghi khác sẽ được xuất ra file
                    Excel
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          gap: 1.5,
          borderTop: "1px solid #f1f5f9",
          bgcolor: "#f8fafc",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            px: 3,
            color: "#64748b",
            borderColor: "#d1d5db",
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          startIcon={<ExportIcon />}
          sx={{
            bgcolor: "#1890ff",
            borderRadius: "10px",
            textTransform: "none",
            px: 4,
            "&:hover": { bgcolor: "#40a9ff" },
          }}
        >
          Xác nhận xuất Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
