import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Grid,
  MenuItem,
  Autocomplete,
  Stack,
  Divider
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  fetchCatalogItems,
  importInventory
} from "../../../services/inventoryService";
import moment from "moment";
import { toast } from "react-toastify";
import { formatValidationErrors } from "../../../utils/utils";

const ImportInventoryModal = ({ open, onClose, initialProduct, onSuccess }) => {
  const MAX_IMPORT_QUANTITY = 500;
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(moment().format("YYYY-MM-DD"));
  const [errors, setErrors] = useState({});

  const validateQuantity = (value, product) => {
    if (value === "" || value === null || typeof value === "undefined") return null;
    const num = Number(value);
    if (Number.isNaN(num)) return "Số lượng không hợp lệ";
    if (num <= 0) return "Số lượng phải lớn hơn 0";

    // Check against total stock limit of 500
    const currentStock = Number(product?.inventory?.quantity || 0);
    const maxAllowed = MAX_IMPORT_QUANTITY - currentStock;

    if (num > maxAllowed) {
      if (maxAllowed <= 0) {
        return `Tổng tồn kho đã đạt giới hạn ${MAX_IMPORT_QUANTITY}. Không thể nhập thêm.`;
      }
      return `Tổng tồn kho không được vượt quá ${MAX_IMPORT_QUANTITY}. Hiện tại đang có ${currentStock}, chỉ có thể nhập thêm tối đa ${maxAllowed}.`;
    }

    return null;
  };

  useEffect(() => {
    if (open) {
      loadProducts();
      if (initialProduct) {
        setSelectedProduct(initialProduct);
      }
    } else {
      resetForm();
    }
  }, [open, initialProduct]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetchCatalogItems({ page: 1, limit: 1000 });
      const resultData =
        res?.data?.content ||
        res?.data?.items ||
        res?.content ||
        res?.items ||
        res?.data ||
        (Array.isArray(res) ? res : []);

      setProducts(Array.isArray(resultData) ? resultData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity("");
    setSupplier("");
    setInvoiceNo("");
    setUnitPrice("");
    setNote("");
    setTransactionDate(moment().format("YYYY-MM-DD"));
    setErrors({});
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!selectedProduct) newErrors.selectedProduct = "Vui lòng chọn mặt hàng";
    if (!quantity) {
      newErrors.quantity = "Vui lòng nhập số lượng";
    } else {
      const quantityError = validateQuantity(quantity, selectedProduct);
      if (quantityError) newErrors.quantity = quantityError;
    }
    if (!transactionDate) newErrors.transactionDate = "Vui lòng chọn ngày nhập";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const payload = {
      productId: selectedProduct.id,
      quantity: Number(quantity),
      transactionDate: transactionDate,
      supplier,
      invoiceNo,
      unitPrice: unitPrice ? Number(unitPrice) : null,
      note
    };

    try {
      setIsSaving(true);
      const res = await importInventory(payload);
      if (res?.success) {
        toast.success(`Nhập kho thành công: Mã phiếu ${res.data.transactionCode}`);
        onSuccess();
        onClose();
      } else {
        toast.error("Có lỗi xảy ra khi nhập kho");
      }
    } catch (error) {
      const message = formatValidationErrors(error, "Có lỗi xảy ra khi gọi API Nhập kho");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1300 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 580 },
          borderRadius: { xs: 0, sm: "24px 0 0 24px" },
          boxShadow: "-10px 0 30px rgba(0,0,0,0.08)"
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "grey.100",
          bgcolor: "#fff"
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ letterSpacing: "-0.01em" }}>
            Nhập Kho Văn Phòng Phẩm
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            Tăng số lượng tồn kho cho các mặt hàng hiện có
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "grey.50", '&:hover': { bgcolor: "grey.100" } }}>
          <CloseIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </IconButton>
      </Box>

      {/* Drawer Content */}
      <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto", bgcolor: "#fff" }}>
        <Grid container spacing={3.5}>
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Mặt hàng nhập kho <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </Typography>
            <Autocomplete
              options={products}
              getOptionLabel={(option) =>
                `${option.code || ''} - ${option.name || ''}`
              }
              value={products.find(p => p.id === selectedProduct?.id) || selectedProduct || null}
              onChange={(e, val) => {
                setSelectedProduct(val);
                if (errors.selectedProduct)
                  setErrors(err => ({ ...err, selectedProduct: null }));

                // Re-validate quantity when product changes
                if (quantity) {
                  const nextError = validateQuantity(quantity, val);
                  setErrors((err) => ({ ...err, quantity: nextError }));
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              loading={loadingProducts}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Tìm kiếm theo tên hoặc mã mặt hàng..."
                  size="small"
                  fullWidth
                  error={!!errors.selectedProduct}
                  helperText={errors.selectedProduct}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      "& fieldset": { borderColor: "grey.200" },
                      "&:hover fieldset": { borderColor: "primary.light" },
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Số lượng nhập <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              placeholder="0"
              size="small"
              type="number"
              value={quantity}
              onChange={(e) => {
                const nextValue = e.target.value;
                setQuantity(nextValue);
                const nextError = validateQuantity(nextValue, selectedProduct);
                setErrors((err) => ({ ...err, quantity: nextError }));
              }}
              inputProps={{ min: 1, max: MAX_IMPORT_QUANTITY }}
              error={!!errors.quantity}
              helperText={errors.quantity}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  fontWeight: 700
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Ngày nhập kho <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={transactionDate}
              onChange={(e) => {
                setTransactionDate(e.target.value);
                if (errors.transactionDate) setErrors(err => ({ ...err, transactionDate: null }));
              }}
              error={!!errors.transactionDate}
              helperText={errors.transactionDate}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc"
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Nhà cung cấp
            </Typography>
            <TextField
              fullWidth
              placeholder="Tên NCC..."
              size="small"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#f8fafc" } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Số hóa đơn
            </Typography>
            <TextField
              fullWidth
              placeholder="Mã HD..."
              size="small"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#f8fafc" } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Đơn giá nhập (VNĐ)
            </Typography>
            <TextField
              fullWidth
              placeholder="0"
              size="small"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              InputProps={{
                endAdornment: <Typography color="text.secondary" fontWeight="700" sx={{ fontSize: 13, ml: 1 }}>VNĐ</Typography>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#f8fafc", fontWeight: 700 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="700" color="#334155" sx={{ mb: 1.2 }}>
              Ghi chú nội bộ
            </Typography>
            <TextField
              fullWidth
              placeholder="Nội dung ghi chú..."
              size="small"
              multiline
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#f8fafc" } }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Drawer Footer */}
      <Divider sx={{ borderColor: 'grey.100' }} />
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          bgcolor: "#fff",
        }}
      >
        <Button
          variant="text"
          color="inherit"
          onClick={onClose}
          disabled={isSaving}
          sx={{ borderRadius: 2.5, textTransform: 'none', px: 4, fontWeight: 700, color: 'text.secondary' }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSaving}
          sx={{
            borderRadius: 2.5,
            bgcolor: 'primary.main',
            textTransform: 'none',
            px: 4,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(37, 93, 242, 0.2)',
            "&:hover": { bgcolor: 'primary.dark', boxShadow: '0 6px 16px rgba(37, 93, 242, 0.3)' }
          }}
        >
          {isSaving ? "Đang xử lý..." : "Xác nhận nhập kho"}
        </Button>
      </Box>
    </Drawer>
  );
};

export default ImportInventoryModal;
