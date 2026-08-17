import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Stack,
  CircularProgress,
} from "@mui/material";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";

const SkyTextField = (props) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    autoComplete="off"
    inputProps={{
      autoComplete: "new-password",
      ...props.inputProps,
    }}
    InputLabelProps={{
      ...props.InputLabelProps,
    }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        "& fieldset": { borderColor: "#e2e8f0" },
      },
      "& .MuiInputBase-input": {
        fontSize: "0.875rem",
        padding: props.multiline ? "0 !important" : "12px 14px",
      },
      "& .MuiInputBase-root.MuiInputBase-multiline": {
        padding: "12px 14px",
      },
      "& .MuiInputBase-input::placeholder": {
        opacity: 0.6,
        color: "#64748b",
      },
      "& .MuiInputLabel-root": {
        backgroundColor: "#FFFFFF",
        paddingLeft: "4px",
        paddingRight: "4px",
        lineHeight: "1.2",
      },
      ...props.sx,
    }}
  />
);

const NewVendorModal = ({ open, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState({
    name: "",
    code: "",
    tax_code: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    supplier_type: "",
  });
  const [errors, setErrors] = useState({});

  const renderLabel = (text) => (
    <span>
      {text} <span style={{ color: "#ef4444", fontWeight: "bold" }}>*</span>
    </span>
  );

  const validate = () => {
    const newErrors = {};
    if (!vendor.name.trim()) newErrors.name = "Vui lòng nhập tên nhà cung cấp";
    if (!vendor.supplier_type.trim())
      newErrors.supplier_type = "Vui lòng nhập loại hình";
    if (!vendor.code.trim()) newErrors.code = "Vui lòng nhập mã định danh";
    if (!vendor.tax_code.trim()) {
      newErrors.tax_code = "Vui lòng nhập mã số thuế";
    } else if (!/^[0-9A-Z-]+$/.test(vendor.tax_code)) {
      newErrors.tax_code = "MST chỉ chứa số, chữ in hoa và '-'";
    }

    if (!vendor.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(vendor.phone.trim())) {
      newErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }

    if (!vendor.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!vendor.contact_name.trim())
      newErrors.contact_name = "Vui lòng nhập người liên hệ";
    if (!vendor.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setVendor({
      name: "",
      code: "",
      tax_code: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      supplier_type: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast("Vui lòng hoàn thiện các thông tin bắt buộc", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: vendor.name.trim(),
        tax_code: vendor.tax_code.trim(),
        phone: vendor.phone.trim(),
        email: vendor.email.trim(),
        address: vendor.address.trim(),
        contact_person: vendor.contact_name.trim(),
        supplier_type: vendor.supplier_type.trim(),
        notes: `Mã định danh: ${vendor.code.trim()}`,
      };

      const response = await asxhService.createSupplier(payload);

      if (response?.success) {
        toast("Thêm nhà cung cấp thành công!", "success");
        onSuccess(response.data);
        resetForm();
        onClose();
      } else {
        toast(response?.message || "Lỗi khi thêm nhà cung cấp", "error");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast(
        error.response?.data?.message || "Có lỗi xảy ra khi gọi API",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setVendor({ ...vendor, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          "& *": { fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important" },
        },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 800, fontSize: "22px", color: "#0f172a", pb: 2 }}
      >
        Nhập nhà cung cấp mới
      </DialogTitle>
      <DialogContent sx={{ pt: "28px", pb: 2, overflow: "visible" }}>
        <Grid container spacing={2.5}>
          {/* Hàng 1: Tên nhà cung cấp */}
          <Grid item xs={12}>
            <SkyTextField
              fullWidth
              label={renderLabel("Tên nhà cung cấp")}
              placeholder="Nhập đầy đủ tên pháp nhân..."
              value={vendor.name}
              onChange={handleChange("name")}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>

          {/* Hàng 2: Loại hình & Mã định danh */}
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Loại hình nhà cung cấp")}
              placeholder="VD: Công ty, Đại lý..."
              value={vendor.supplier_type}
              onChange={handleChange("supplier_type")}
              error={!!errors.supplier_type}
              helperText={errors.supplier_type}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Mã định danh")}
              placeholder="VD: PV, SV..."
              value={vendor.code}
              onChange={handleChange("code")}
              error={!!errors.code}
              helperText={errors.code}
            />
          </Grid>

          {/* Hàng 3: Mã số thuế & Số điện thoại */}
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Mã số thuế")}
              placeholder="Mã số thuế công ty..."
              value={vendor.tax_code}
              onChange={handleChange("tax_code")}
              error={!!errors.tax_code}
              helperText={errors.tax_code}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Số điện thoại")}
              placeholder="10 chữ số..."
              value={vendor.phone}
              onChange={handleChange("phone")}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>

          {/* Hàng 4: Email & Người liên hệ */}
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Email")}
              placeholder="example@domain.com"
              value={vendor.email}
              onChange={handleChange("email")}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SkyTextField
              fullWidth
              label={renderLabel("Người liên hệ")}
              placeholder="Tên người đại diện..."
              value={vendor.contact_name}
              onChange={handleChange("contact_name")}
              error={!!errors.contact_name}
              helperText={errors.contact_name}
            />
          </Grid>

          {/* Hàng 5: Địa chỉ */}
          <Grid item xs={12}>
            <SkyTextField
              fullWidth
              label={renderLabel("Địa chỉ")}
              placeholder="Địa chỉ trụ sở/văn phòng..."
              multiline
              rows={2}
              value={vendor.address}
              onChange={handleChange("address")}
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 1, justifyContent: "flex-end" }}>
        <Button
          onClick={handleClose}
          sx={{
            color: "#64748b",
            fontWeight: 600,
            textTransform: "none",
            mr: 2,
          }}
          disabled={loading}
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
          sx={{
            borderRadius: "10px",
            px: 4,
            py: 1,
            bgcolor: "#2563eb",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "15px",
            boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)",
            "&:hover": {
              bgcolor: "#1d4ed8",
              boxShadow: "0 6px 14px rgba(29, 78, 216, 0.3)",
            },
          }}
        >
          {loading ? "Đang lưu..." : "Lưu thông tin nhà cung cấp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewVendorModal;
