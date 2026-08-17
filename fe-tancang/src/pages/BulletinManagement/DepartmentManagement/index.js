import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Article, Business, CheckCircle, Close, DeleteOutline, Edit, FilterAlt, People, Search, Visibility } from "@mui/icons-material";
import { useToast } from "@components/common/ToastProvider";
import bulletinService from "@services/bulletinService";
import BulletinLayout from "../components/BulletinLayout";

const COLORS = ["#4461F2", "#00B8D9", "#9B51E0", "#F2994A", "#EB5757", "#006B3F", "#D63384", "#3A86FF"];

const PERMISSIONS = [
  { id: "create", label: "Tạo bản tin" },
  { id: "edit", label: "Chỉnh sửa" },
  { id: "approve", label: "Phê duyệt" },
  { id: "publish", label: "Đăng tải" },
  { id: "remove", label: "Gỡ bài" },
  { id: "view", label: "Xem" },
  { id: "stats", label: "Xem thống kê" },
  { id: "manage_members", label: "Quản lý thành viên" },
];

const PERMISSION_LABEL_MAP = PERMISSIONS.reduce((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

const getPermissionLabel = (permissionKey = "") => {
  const key = String(permissionKey).trim().toLowerCase();
  return PERMISSION_LABEL_MAP[key] || permissionKey;
};

const parsePermissions = (value) => {
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (_) {
    return [];
  }
  return [];
};

const normalizeDepartment = (dept = {}) => ({
  id: String(dept.id || dept._id || ""),
  name: dept.name || "",
  code: dept.code || "",
  description: dept.description || "",
  color: dept.color || COLORS[5],
  member_count: Number(dept.member_count || 0),
  bulletin_count: Number(dept.bulletin_count || 0),
  isActive: typeof dept.isActive === "boolean" ? dept.isActive : dept.is_active !== false,
  defaultPermissions: parsePermissions(dept.defaultPermissions ?? dept.default_permissions ?? dept.defaultPermission),
});

const recalculateStats = (list = []) => ({
  total: list.length,
  active: list.filter((d) => d.isActive).length,
  members: list.reduce((acc, d) => acc + d.member_count, 0),
  bulletins: list.reduce((acc, d) => acc + d.bulletin_count, 0),
});

const DepartmentManagement = () => {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, members: 0, bulletins: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [permissionFilter, setPermissionFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    isActive: true,
    description: "",
    color: COLORS[5],
    defaultPermissions: ["create", "edit", "view", "stats"],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await bulletinService.getDepartments();
      const list = (Array.isArray(res) ? res : [])
        .map(normalizeDepartment)
        .sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
      setDepartments(list);
      setStats(recalculateStats(list));
    } catch (error) {
      console.error("Failed to fetch departments", error);
      // toast("Không thể tải danh sách phòng ban", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      isActive: true,
      description: "",
      color: COLORS[5],
      defaultPermissions: ["create", "edit", "view", "stats"],
    });
  };

  const handleOpen = (mode = "add", dept = null) => {
    setDialogMode(mode);
    const normalized = dept ? normalizeDepartment(dept) : null;
    setSelectedDept(normalized);

    if (!normalized) {
      resetForm();
      setOpen(true);
      return;
    }

    setFormData({
      name: normalized.name,
      code: normalized.code,
      isActive: normalized.isActive,
      description: normalized.description,
      color: normalized.color,
      defaultPermissions: normalized.defaultPermissions,
    });
    setOpen(true);
  };

  const handlePermissionChange = (permId) => {
    if (dialogMode === "view") return;
    setFormData((prev) => ({
      ...prev,
      defaultPermissions: prev.defaultPermissions.includes(permId)
        ? prev.defaultPermissions.filter((id) => id !== permId)
        : [...prev.defaultPermissions, permId],
    }));
  };

  const handleSubmit = async () => {
    if (dialogMode === "view") {
      setOpen(false);
      return;
    }

    if (!formData.name.trim() || !formData.code.trim()) {
      toast("Vui lòng nhập tên và mã phòng ban", "warning");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description,
        color: formData.color,
        is_active: formData.isActive,
        default_permissions: JSON.stringify(formData.defaultPermissions),
      };

      let savedRaw;
      if (dialogMode === "edit" && selectedDept?.id) {
        savedRaw = await bulletinService.updateDepartment(selectedDept.id, payload);
      } else {
        savedRaw = await bulletinService.createDepartment(payload);
      }

      const saved = normalizeDepartment(savedRaw?.data || savedRaw || {});
      if (saved?.id) {
        setDepartments((prev) => {
          const existed = prev.some((item) => item.id === saved.id);
          const next = existed
            ? prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item))
            : [saved, ...prev];
          setStats(recalculateStats(next));
          return next;
        });
      }

      toast("Lưu phòng ban thành công", "success");
      setOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error(error);
      toast("Không thể lưu phòng ban", "error");
    }
  };

  const handleDelete = async (dept) => {
    if (!dept?.id) return;
    const ok = window.confirm(`Bạn có chắc muốn xóa phòng ban "${dept.name}"?`);
    if (!ok) return;

    try {
      await bulletinService.deleteDepartment(dept.id);
      const next = departments.filter((item) => item.id !== dept.id);
      setDepartments(next);
      setStats(recalculateStats(next));
      toast("Xóa phòng ban thành công", "success");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Không thể xóa phòng ban. Có thể phòng ban đang được sử dụng.";
      toast(message, "error");
    }
  };

  const filteredDepartments = departments.filter((item) => {
    const keyword = searchKeyword.trim().toLowerCase();
    const passKeyword = !keyword || `${item.name} ${item.code}`.toLowerCase().includes(keyword);

    // logic: AND (Must have all selected permissions)
    const passPermission = permissionFilter.length === 0 ||
      permissionFilter.every(p => item.defaultPermissions.includes(p));

    return passKeyword && passPermission;
  });

  const pagedDepartments = filteredDepartments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <BulletinLayout activeTab="departments">
      <Box sx={{ p: 3, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">Trang chủ</Link>
          <Typography color="text.primary">Quản lý Phòng ban</Typography>
        </Breadcrumbs>

        <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", mb: 3 }}>Hệ thống Quản lý Phòng ban</Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "6px solid #1976d2" }}>
              <Avatar sx={{ bgcolor: "blue", width: 56, height: 56 }}><Business /></Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng số phòng ban</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "6px solid #2e7d32" }}>
              <Avatar sx={{ bgcolor: "green", width: 56, height: 56 }}><CheckCircle /></Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{stats.active}</Typography>
                <Typography variant="body2" color="text.secondary">Bộ phận đang hoạt động</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "6px solid #f9a825" }}>
              <Avatar sx={{ bgcolor: "orange", width: 56, height: 56 }}><People /></Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{stats.members}</Typography>
                <Typography variant="body2" color="text.secondary">Tổng nhân sự</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "6px solid #d32f2f" }}>
              <Avatar sx={{ bgcolor: "red", width: 56, height: 56 }}><Article /></Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800}>{stats.bulletins}</Typography>
                <Typography variant="body2" color="text.secondary">Bản tin tháng này</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ p: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                placeholder="Tìm kiếm phòng ban..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <Select
                  multiple
                  displayEmpty
                  value={permissionFilter}
                  onChange={(e) => {
                    setPermissionFilter(e.target.value);
                    setPage(0);
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FilterAlt fontSize="small" color="disabled" />
                          <Typography variant="body2" color="text.secondary">Lọc theo nhiều quyền...</Typography>
                        </Stack>
                      );
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => (
                          <Chip key={val} label={getPermissionLabel(val)} size="small" variant="outlined" color="primary" />
                        ))}
                      </Box>
                    );
                  }}
                >
                  {PERMISSIONS.map((perm) => (
                    <MenuItem key={perm.id} value={perm.id} sx={{ py: 0.2 }}>
                      <Checkbox size="small" checked={permissionFilter.includes(perm.id)} />
                      <Typography variant="body2">{perm.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(searchKeyword || permissionFilter.length > 0) && (
                <Button size="small" color="error" onClick={() => { setSearchKeyword(""); setPermissionFilter([]); }}>
                  Xóa lọc
                </Button>
              )}
            </Stack>
            <Button variant="contained" startIcon={<Add />} sx={{ borderRadius: 2 }} onClick={() => handleOpen("add")}>
              Tạo mới
            </Button>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" width={40}>
                    <Checkbox size="small" />
                  </TableCell>
                  <TableCell>Tên Bộ phận / Phòng ban</TableCell>
                  <TableCell align="center">Thành viên</TableCell>
                  <TableCell>Quyền hạn</TableCell>
                  <TableCell align="center">Bản tin</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedDepartments.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell align="center">
                        <Checkbox size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: item.color || "primary.light" }}>{item.name?.[0] || "P"}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.code}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{item.member_count}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {(item.defaultPermissions || []).map((p) => (
                            <Chip key={p} label={getPermissionLabel(p)} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.bulletin_count}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.isActive ? "Đang hoạt động" : "Tạm dừng"}
                          color={item.isActive ? "success" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Sửa">
                          <IconButton size="small" color="primary" onClick={() => handleOpen("edit", item)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xem">
                          <IconButton size="small" color="info" onClick={() => handleOpen("view", item)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredDepartments.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="Số dòng"
          />
        </Card>

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ m: 0, p: 2, fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {dialogMode === "add" ? "Thêm phòng ban" : dialogMode === "edit" ? "Cập nhật phòng ban" : "Thông tin phòng ban"}
            <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tên phòng ban"
                  disabled={dialogMode === "view"}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mã phòng ban"
                  disabled={dialogMode === "view"}
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: "block", textTransform: "uppercase", color: "text.secondary" }}>
                  Trạng thái
                </Typography>
                <FormControl fullWidth size="small">
                  <Select disabled={dialogMode === "view"} value={formData.isActive} onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value }))}>
                    <MenuItem value>Hoạt động</MenuItem>
                    <MenuItem value={false}>Tạm dừng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: "block", textTransform: "uppercase", color: "text.secondary" }}>
                  Màu đại diện
                </Typography>
                <Stack direction="row" spacing={1}>
                  {COLORS.map((c) => (
                    <Box
                      key={c}
                      onClick={() => dialogMode !== "view" && setFormData((prev) => ({ ...prev, color: c }))}
                      sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: c, cursor: dialogMode === "view" ? "default" : "pointer", border: formData.color === c ? "2px solid #111" : "none" }}
                    />
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Mô tả"
                  disabled={dialogMode === "view"}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={700} sx={{ mt: 2, mb: 1, display: "block", textTransform: "uppercase", color: "text.secondary" }}>
                  Quyền hạn mặc định
                </Typography>
                <Grid container>
                  {PERMISSIONS.map((perm) => (
                    <Grid item xs={6} key={perm.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            disabled={dialogMode === "view"}
                            checked={formData.defaultPermissions.includes(perm.id)}
                            onChange={() => handlePermissionChange(perm.id)}
                          />
                        }
                        label={<Typography variant="body2">{perm.label}</Typography>}
                        sx={{ width: "95%", m: 0.5, p: 0.5, borderRadius: 1, bgcolor: formData.defaultPermissions.includes(perm.id) ? "action.hover" : "transparent" }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
              {dialogMode === "view" ? "Đóng" : "Hủy"}
            </Button>
            {dialogMode !== "view" && (
              <Button onClick={handleSubmit} variant="contained" startIcon={dialogMode === "add" ? <Add /> : <CheckCircle />} sx={{ borderRadius: 2, px: 3 }}>
                {dialogMode === "add" ? "Lưu" : "Lưu thay đổi"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </BulletinLayout>
  );
};

export default DepartmentManagement;
