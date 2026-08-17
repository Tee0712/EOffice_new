import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from "@mui/material";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";

const FUNDING_TYPES = [
  { value: "Bang_tien", label: "Tiền mặt" },
  { value: "Hien_vat", label: "Hiện vật" },
  { value: "Giao_duc", label: "Giáo dục/Hợp tác" },
];

const STATUSES = [
  { value: "lap_ke_hoach", label: "Đang lập kế hoạch" },
  { value: "dang_trien_khai", label: "Đang triển khai" },
  { value: "dang_giai_ngan", label: "Đang giải ngân" },
  { value: "hoan_thanh", label: "Hoàn thành" },
];

const ProgramFormModal = ({ open, onClose, programId, mode, onSaved }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    funding_type: "Bang_tien",
    locality: "",
    specific_address: "",
    description: "",
    beneficiary: "",
    budget: "",
    start_date: "",
    end_date: "",
    status: "lap_ke_hoach",
  });

  useEffect(() => {
    if (open && programId) {
      fetchDetail();
    }
  }, [open, programId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await asxhService.getProgramDetail(programId);
      if (res.success) {
        setFormData({
          ...res.data,
          budget: res.data.budget || res.data.total_budget || 0,
        });
      } else {
        toast("Lỗi tải chi tiết chương trình", "error");
        onClose();
      }
    } catch (err) {
      toast("Lỗi hệ thống", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        funding_type: formData.funding_type,
        locality: formData.locality,
        specific_address: formData.specific_address,
        description: formData.description,
        beneficiary: formData.beneficiary,
        budget: Number(formData.budget),
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
      };

      const res = await asxhService.updateProgram(programId, payload);
      if (res.success) {
        toast("Cập nhật thành công", "success");
        onSaved();
      } else {
        toast(res.message || "Cập nhật thất bại", "error");
      }
    } catch (err) {
      toast("Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isReadOnly ? "Chi tiết chương trình" : "Cập nhật chương trình"}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên chương trình"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Loại hình"
                name="funding_type"
                value={formData.funding_type || "Bang_tien"}
                onChange={handleChange}
                disabled={isReadOnly}
              >
                {FUNDING_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Trạng thái"
                name="status"
                value={formData.status || "lap_ke_hoach"}
                onChange={handleChange}
                disabled={isReadOnly}
              >
                {STATUSES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Địa phương"
                name="locality"
                value={formData.locality || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngân sách"
                name="budget"
                type="number"
                value={formData.budget || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                name="start_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.start_date || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày kết thúc"
                name="end_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.end_date || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mô tả"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Đóng
        </Button>
        {!isReadOnly && (
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading || saving}>
            Lưu thay đổi
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProgramFormModal;
