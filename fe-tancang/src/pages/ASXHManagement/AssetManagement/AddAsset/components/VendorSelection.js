import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  FormHelperText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, DeleteOutline } from "@mui/icons-material";
import { Switch, Avatar } from "@mui/material";
import NewVendorModal from "./NewVendorModal";

const VendorCard = ({
  vendor,
  selected,
  onSelect,
  onDelete,
  isAddBtn,
  onAddClick,
}) => {
  if (isAddBtn) {
    return (
      <Box
        onClick={onAddClick}
        sx={{
          p: 1.5,
          borderRadius: "10px",
          border: "1px dashed #CBD5E1",
          bgcolor: "#F8FAFC",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: "72px",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#E2E8F0",
            color: "#64748B",
            width: 40,
            height: 40,
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          <AddIcon />
        </Avatar>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#475569" }}
          >
            Nhập nhà cung cấp mới
          </Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            Thêm NCC chưa có trong hệ thống
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      onClick={() => onSelect(vendor.id)}
      sx={{
        p: 1.5,
        borderRadius: "10px",
        border: selected ? "2px solid #3B82F6" : "1px solid #E2E8F0",
        bgcolor: selected ? "#EFF6FF" : "white",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        "&:hover": {
          borderColor: "#3B82F6",
          "& .delete-btn": { opacity: 1 },
        },
        display: "flex",
        alignItems: "center",
        gap: 2,
        minHeight: "72px",
      }}
    >
      <Avatar
        sx={{
          bgcolor: selected ? "#DBEAFE" : "#F1F5F9",
          color: selected ? "#2563EB" : "#64748B",
          width: 40,
          height: 40,
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {vendor.code?.substring(0, 2) ||
          vendor.notes?.split(": ")?.[1]?.substring(0, 2) ||
          "NC"}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: selected ? "#1E40AF" : "#1E293B" }}
        >
          {vendor.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: selected ? "#3B82F6" : "#64748B" }}
        >
          {vendor.supplierType || vendor.supplier_type || "—"}
        </Typography>
      </Box>

      <IconButton
        className="delete-btn"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(vendor);
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          opacity: 0,
          transition: "opacity 0.2s",
          color: "#EF4444",
          "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)" },
        }}
      >
        <DeleteOutline sx={{ fontSize: "18px" }} />
      </IconButton>
    </Box>
  );
};

const VendorSelection = ({
  vendors,
  selectedId,
  onChange,
  error,
  onVendorCreated,
  onRefresh,
  hasQuotation,
  onQuotationToggle,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    vendor: null,
  });
  const [deleting, setDeleting] = useState(false);
  const asxhService = require("@services/asxhService").default;
  const { useToast } = require("@components/common/ToastProvider");
  const toast = useToast();

  const handleDeleteClick = (vendor) => {
    setDeleteDialog({ open: true, vendor });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.vendor) return;
    setDeleting(true);
    try {
      const resp = await asxhService.deleteSupplier(deleteDialog.vendor.id);
      if (resp?.success || resp) {
        toast("Đã xóa nhà cung cấp thành công", "success");
        if (onRefresh) onRefresh();
        if (selectedId === deleteDialog.vendor.id) onChange(null);
      }
    } catch (error) {
      console.error("Delete supplier error:", error);
      toast("Không thể xóa nhà cung cấp này.", "error");
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, vendor: null });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: "#F97316",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            4
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1E293B", fontSize: "18px" }}
          >
            Nhà cung cấp
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
          Chọn nhà cung cấp
        </Typography>

        <Grid container spacing={2}>
          {vendors.map((vendor) => (
            <Grid item xs={12} md={6} key={vendor.id}>
              <VendorCard
                vendor={vendor}
                selected={selectedId === vendor.id}
                onSelect={onChange}
                onDelete={handleDeleteClick}
              />
            </Grid>
          ))}
          <Grid item xs={12} md={6}>
            <VendorCard isAddBtn onAddClick={() => setModalOpen(true)} />
          </Grid>
        </Grid>

        {error && (
          <FormHelperText error sx={{ mt: 1 }}>
            {error}
          </FormHelperText>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="body2"
            sx={{ color: "#64748B", mb: 1.5, fontWeight: 600 }}
          >
            Trạng thái báo giá
          </Typography>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#1E293B" }}
              >
                Đã có báo giá chính thức
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                Nếu có, vui lòng đính kèm bên dưới
              </Typography>
            </Box>
            <Switch
              checked={hasQuotation}
              onChange={(e) => onQuotationToggle(e.target.checked)}
              color="primary"
            />
          </Stack>
        </Box>
      </Box>

      <NewVendorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newVendor) => {
          if (onVendorCreated) onVendorCreated(newVendor);
          setModalOpen(false);
        }}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          !deleting && setDeleteDialog({ open: false, vendor: null })
        }
        PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: "360px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#1e293b",
            pb: 1,
            fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
          }}
        >
          Xóa nhà cung cấp?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "#475569",
              fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
            }}
          >
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteDialog.vendor?.name}</strong>? Hành động này không
            thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, vendor: null })}
            disabled={deleting}
            sx={{
              fontWeight: 600,
              color: "#64748b",
              textTransform: "none",
              fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{
              borderRadius: "8px",
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "#EF4444",
              fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
            }}
          >
            {deleting ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VendorSelection;
