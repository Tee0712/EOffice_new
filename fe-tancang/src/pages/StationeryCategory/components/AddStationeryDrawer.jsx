import React, { useState, useEffect } from "react";
import { getStationeryItemById } from "../../../services/stationeryService";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";

const AddStationeryDrawer = ({
  open,
  onClose,
  itemData,
  categories = [],
  onSave,
  isSaving,
}) => {
  const isEditing = Boolean(itemData);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    categoryId: "",
    unit: "",
    reference_price: "",
    quotaValue: "",
    quotaUnit: "nguoi",
    notes: "",
    image_url: null,
  });

  const [errors, setErrors] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Điền dữ liệu nếu là chế độ Edit
  useEffect(() => {
    if (itemData && open) {
      const fetchDetail = async () => {
        setLoadingDetail(true);
        try {
          const detailRes = await getStationeryItemById(itemData.id);
          const detail = detailRes?.data || detailRes || itemData;
          setFormData({
            sku: detail.sku || itemData.sku || "",
            name: detail.name || itemData.name || "",
            categoryId:
              detail.category || detail.categoryId || itemData.category || "",
            unit: detail.unit || itemData.unit || "",
            reference_price:
              detail.reference_price || itemData.reference_price || "",
            quotaValue:
              detail.quotaValue ||
              (detail.quota ? detail.quota.split(" / ")[0] : ""),
            quotaUnit:
              detail.quotaUnit ||
              (detail.quota && detail.quota.includes("phòng")
                ? "phongban"
                : "nguoi"),
            notes: detail.notes || itemData.notes || "",
            image_url: detail.image_url || itemData.image_url || null,
          });
        } catch (error) {
          console.error("Lỗi khi tải chi tiết:", error);
          // Fallback to itemData
          setFormData({
            sku: itemData.sku || "",
            name: itemData.name || "",
            categoryId: itemData.category || "",
            unit: itemData.unit || "",
            reference_price: itemData.reference_price || "",
            quotaValue: itemData.quota ? itemData.quota.split(" / ")[0] : "",
            quotaUnit:
              itemData.quota && itemData.quota.includes("phòng")
                ? "phongban"
                : "nguoi",
            notes: "",
            image_url: itemData.image_url || null,
          });
        } finally {
          setLoadingDetail(false);
        }
      };

      fetchDetail();
    } else if (!open) {
      // Reset khi đóng
      setFormData({
        sku: "",
        name: "",
        categoryId: "",
        unit: "",
        reference_price: "",
        quotaValue: "",
        quotaUnit: "nguoi",
        notes: "",
        image_url: null,
      });
      setErrors({});
    }
  }, [itemData, open]);
  useEffect(() => {
    if (!open || isEditing) return;
    if (!Array.isArray(categories) || categories.length === 0) return;

    setFormData((prev) => {
      if (prev.categoryId) return prev;
      return { ...prev, categoryId: categories[0].value };
    });
  }, [open, isEditing, categories]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Tự động fill đơn vị tính dựa trên nhóm hàng (chỉ khi tạo mới)
      if (field === "categoryId" && value && !isEditing) {
        const categoryLabel =
          categories.find((c) => c.value === value)?.label || value;
        const mapping = {
          bút: "Cây",
          giấy: "Ram",
          sổ: "Quyển",
          vở: "Quyển",
          kim: "Hộp",
          kẹp: "Hộp",
          mực: "Hộp",
          file: "Cái",
          bìa: "Cái",
          "hồ sơ": "Cái",
          "băng keo": "Cái", // Fallback to Cái if Cuộn not in list
          dao: "Cái",
          kéo: "Cái",
          gôm: "Cái",
          tẩy: "Cái",
          thước: "Cái",
        };

        const lowerLabel = String(categoryLabel).toLowerCase();
        for (const [key, unit] of Object.entries(mapping)) {
          if (lowerLabel.includes(key)) {
            newData.unit = unit;
            break;
          }
        }
      }

      return newData;
    });

    // Xóa lỗi khi user bắt đầu gõ lại
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Tên mặt hàng là bắt buộc";
    if (!formData.unit.trim()) newErrors.unit = "Đơn vị tính là bắt buộc";

    // Validate định mức nếu có nhập
    if (formData.quotaValue && isNaN(Number(formData.quotaValue))) {
      newErrors.quotaValue = "Định mức phải là số";
    }

    if (formData.reference_price && Number(formData.reference_price) < 0) {
      newErrors.reference_price = "Giá tham khảo không được nhỏ hơn 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSave) {
      onSave({
        ...formData,
        reference_price: formData.reference_price
          ? Number(formData.reference_price)
          : null,
      });
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 99999 }} // 🔹 Tối ưu để đè lên Top Navbar to của hệ thống
      PaperProps={{
        sx: { width: { xs: "100%", sm: 500 }, borderRadius: "16px 0 0 16px" }, // Theo style popup hiện đại
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography variant="h6" fontWeight="700" color="#0f172a">
          {isEditing ? "Cập nhật mặt hàng" : "Thêm mặt hàng mới"}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ bgcolor: "grey.100", "&:hover": { bgcolor: "grey.200" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Drawer Content */}
      <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", bgcolor: "#fff" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography
              variant="body2"
              fontWeight="600"
              color="#0f172a"
              sx={{ mb: 1 }}
            >
              Mã mặt hàng
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="VD: VPP-BV-001"
              disabled={isEditing} // Thường mã không cho sửa
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: isEditing ? "grey.50" : "#fff",
                },
              }}
            />
            {!isEditing && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: "italic", mt: 0.5, display: "block" }}
              >
                Hệ thống sẽ tự tạo nếu để trống. Vui lòng nhập đúng định dạng
                nếu nhập tay.
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="body2"
              fontWeight="600"
              color="#0f172a"
              sx={{ mb: 1 }}
            >
              Tên mặt hàng <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên mặt hàng"
              error={!!errors.name}
              helperText={errors.name}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="#0f172a"
                sx={{ mb: 1 }}
              >
                Nhóm hàng <span style={{ color: "red" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.categoryId || ""}
                  onChange={(e) => handleChange("categoryId", e.target.value)}
                  sx={{ borderRadius: 1.5 }}
                  MenuProps={{ sx: { zIndex: 100000 } }}
                >
                  <MenuItem value="" disabled>
                    Chọn nhóm hàng
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="#0f172a"
                sx={{ mb: 1 }}
              >
                Đơn vị tính <span style={{ color: "red" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small" error={!!errors.unit}>
                <Select
                  value={formData.unit || ""}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 1.5 }}
                  MenuProps={{ sx: { zIndex: 100000 } }}
                >
                  <MenuItem value="" disabled>
                    Chọn đơn vị
                  </MenuItem>
                  <MenuItem value="Cây">Cây</MenuItem>
                  <MenuItem value="Hộp">Hộp</MenuItem>
                  <MenuItem value="Ram">Ram</MenuItem>
                  <MenuItem value="Quyển">Quyển</MenuItem>
                  <MenuItem value="Lốc">Lốc</MenuItem>
                  <MenuItem value="Cái">Cái</MenuItem>
                </Select>
                {errors.unit && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.5 }}
                  >
                    {errors.unit}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="#0f172a"
                sx={{ mb: 1 }}
              >
                Đơn giá tham khảo (VNĐ)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={formData.reference_price}
                onChange={(e) =>
                  handleChange("reference_price", e.target.value)
                }
                placeholder="0"
                error={!!errors.reference_price}
                helperText={errors.reference_price}
                InputProps={{
                  endAdornment: (
                    <Typography color="text.secondary" fontWeight={600}>
                      ₫
                    </Typography>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="#0f172a"
                sx={{ mb: 1 }}
              >
                Định mức / Tháng
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  value={formData.quotaValue}
                  onChange={(e) => handleChange("quotaValue", e.target.value)}
                  placeholder="0"
                  error={!!errors.quotaValue}
                  sx={{
                    width: 80,
                    "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                  }}
                />
                <Typography color="text.secondary" fontWeight={600}>
                  /
                </Typography>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={formData.quotaUnit || "nguoi"}
                    onChange={(e) => handleChange("quotaUnit", e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                    MenuProps={{ sx: { zIndex: 100000 } }}
                  >
                    <MenuItem value="nguoi">Người</MenuItem>
                    <MenuItem value="phongban">Phòng ban</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </Stack>

          <Box>
            <Typography
              variant="body2"
              fontWeight="600"
              color="#0f172a"
              sx={{ mb: 1 }}
            >
              Mô tả / Ghi chú
            </Typography>
            <TextField
              fullWidth
              // multiline
              // rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Drawer Footer */}
      <Divider />
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          bgcolor: "#f8f9fb",
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isSaving}
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            px: 3,
            fontWeight: 600,
            borderColor: "grey.300",
            bgcolor: "#fff",
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            borderRadius: 1.5,
            backgroundColor: "#255df2",
            textTransform: "none",
            px: 3,
            fontWeight: 600,
            boxShadow: "none",
          }}
        >
          {isSaving
            ? "Đang lưu..."
            : isEditing
              ? "Lưu thay đổi"
              : "Lưu mặt hàng"}
        </Button>
      </Box>
    </Drawer>
  );
};

export default AddStationeryDrawer;
