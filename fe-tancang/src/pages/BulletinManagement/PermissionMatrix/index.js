import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Assessment,
  Check,
  CheckCircle,
  Close,
  Delete,
  Edit,
  Info,
  Lock,
  PeopleAlt,
  Refresh,
  Save,
  Settings,
  Upload,
} from "@mui/icons-material";
import bulletinService from "@services/bulletinService";

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const PERMISSION_BLUEPRINTS = [
  { key: "create", label: "Tạo bản tin", icon: <Add />, aliases: ["create", "tao ban tin", "tao"] },
  { key: "edit", label: "Chỉnh sửa", icon: <Edit />, aliases: ["edit", "chinh sua", "sua"] },
  { key: "approve", label: "Phê duyệt", icon: <CheckCircle />, aliases: ["approve", "phe duyet", "duyet"] },
  { key: "publish", label: "Đăng tải", icon: <Upload />, aliases: ["publish", "dang tai", "dang bai"] },
  { key: "remove", label: "Gỡ bài", icon: <Delete />, aliases: ["remove", "go bai", "xoa bai", "delete"] },
  { key: "statistics", label: "Xem thống kê", icon: <Assessment />, aliases: ["statistics", "thong ke", "xem thong ke"] },
  { key: "members", label: "Quản lý thành viên", icon: <PeopleAlt />, aliases: ["member", "thanh vien", "quan ly thanh vien"] },
];

const ROLE_BLUEPRINTS = [
  {
    key: "admin",
    label: "Quản trị bản tin",
    short: "QT",
    group: "NHÓM QUẢN TRỊ",
    description: "Toàn quyền quản lý",
    aliases: ["quan tri ban tin", "quan tri vien", "admin", "administrator"],
    color: "error.main",
    lockAllPermissions: true,
  },
  {
    key: "approver",
    label: "Phê duyệt viên",
    short: "PD",
    group: "BIÊN TẬP & PHÊ DUYỆT",
    description: "Duyệt và kiểm soát nội dung",
    aliases: ["phe duyet vien", "duyet vien", "approver", "reviewer"],
    color: "secondary.main",
  },
  {
    key: "editor",
    label: "Biên tập viên",
    short: "BT",
    group: "BIÊN TẬP & PHÊ DUYỆT",
    description: "Soạn và chỉnh sửa bản tin",
    aliases: ["bien tap vien", "editor"],
    color: "primary.main",
  },
  {
    key: "viewer",
    label: "Người xem",
    short: "NX",
    group: "CHỈ XEM",
    description: "Chỉ đọc bản tin",
    aliases: ["nguoi xem", "chi xem", "viewer", "read only"],
    color: "grey.600",
  },
];

const OTHER_ROLE_GROUP = "VAI TRÒ KHÁC";
const GROUP_ORDER = ["NHÓM QUẢN TRỊ", "BIÊN TẬP & PHÊ DUYỆT", "CHỈ XEM", OTHER_ROLE_GROUP];
const tabColors = ["primary.main", "info.main", "secondary.main", "warning.main", "error.main", "success.main"];
const permBgColors = ["#dbeafe", "#d9f2ff", "#ede9fe", "#dcfce7", "#fee2e2", "#fef3c7", "#d1fae5"];
const permMainColors = ["#1d4ed8", "#0369a1", "#6d28d9", "#15803d", "#dc2626", "#b45309", "#0f766e"];

const matchByAliases = (target, aliases = []) => aliases.some((a) => target.includes(normalizeText(a)));

const resolvePermissions = (apiPermissions = []) =>
  PERMISSION_BLUEPRINTS.map((blueprint) => {
    const found = apiPermissions.find((perm) => {
      const code = normalizeText(perm?.code);
      const name = normalizeText(perm?.name);
      return matchByAliases(code, blueprint.aliases) || matchByAliases(name, blueprint.aliases);
    });
    return {
      ...blueprint,
      id: found?.id || `missing-${blueprint.key}`,
      name: found?.name || blueprint.label,
      missing: !found,
    };
  });

const resolveRoles = (apiRoles = []) => {
  const baseRoles = ROLE_BLUEPRINTS.map((blueprint) => {
    const found = apiRoles.find((role) => {
      const code = normalizeText(role?.code);
      const name = normalizeText(role?.name);
      return matchByAliases(code, blueprint.aliases) || matchByAliases(name, blueprint.aliases);
    });
    return {
      ...blueprint,
      id: found?.id || `missing-${blueprint.key}`,
      name: found?.name || blueprint.label,
      missing: !found,
    };
  });

  const mappedBlueprintRoleIds = new Set(baseRoles.filter((r) => !r.missing).map((r) => r.id));
  const dynamicRoles = (Array.isArray(apiRoles) ? apiRoles : [])
    .filter((role) => role?.id && !mappedBlueprintRoleIds.has(role.id))
    .map((role, idx) => ({
      key: `dynamic-${role.id}`,
      id: role.id,
      name: role.name || role.code || `Vai trò ${idx + 1}`,
      short: (role.name || role.code || "VT").slice(0, 2).toUpperCase(),
      group: OTHER_ROLE_GROUP,
      description: role.code || "Vai trò tạo mới",
      color: "info.main",
      lockAllPermissions: false,
      missing: false,
    }));

  return [...baseRoles, ...dynamicRoles];
};
const PermissionMatrix = () => {
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activeDepartmentId, setActiveDepartmentId] = useState("");
  const [draftMatrixKeys, setDraftMatrixKeys] = useState(new Set());
  const [originalMatrixKeys, setOriginalMatrixKeys] = useState(new Set());
  const [memberCountByRole, setMemberCountByRole] = useState({});
  const [openCreateRole, setOpenCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  const resolvedPermissions = useMemo(() => resolvePermissions(permissions), [permissions]);
  const resolvedRoles = useMemo(() => resolveRoles(roles), [roles]);

  const groupedRoles = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach((group) => {
      map[group] = resolvedRoles.filter((r) => r.group === group);
    });
    return map;
  }, [resolvedRoles]);

  const activeDepartment = useMemo(
    () => departments.find((dept) => dept.id === activeDepartmentId),
    [departments, activeDepartmentId]
  );

  const changedCount = useMemo(() => {
    const union = new Set([...draftMatrixKeys, ...originalMatrixKeys]);
    let count = 0;
    union.forEach((key) => {
      if (draftMatrixKeys.has(key) !== originalMatrixKeys.has(key)) count += 1;
    });
    return count;
  }, [draftMatrixKeys, originalMatrixKeys]);

  const fetchInitialData = async () => {
    try {
      const [depts, rls, perms] = await Promise.all([
        bulletinService.getDepartments(),
        bulletinService.getRoles(),
        bulletinService.getPermissions(),
      ]);
      setDepartments(Array.isArray(depts) ? depts : []);
      setRoles(Array.isArray(rls) ? rls : []);
      setPermissions(Array.isArray(perms) ? perms : []);
      if (depts?.length) setActiveDepartmentId(depts[0].id);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  const fetchMatrixAndMembers = async (departmentId) => {
    if (!departmentId) return;
    try {
      const [entries, membersResp] = await Promise.all([
        bulletinService.getPermissionMatrix(departmentId),
        bulletinService.getMembers(departmentId),
      ]);
      const listEntries = Array.isArray(entries) ? entries : [];
      const nextKeys = new Set(listEntries.map((e) => `${e.role_id}|${e.permission_id}`));
      setDraftMatrixKeys(new Set(nextKeys));
      setOriginalMatrixKeys(new Set(nextKeys));

      const counts = {};
      const items = membersResp?.items || (Array.isArray(membersResp) ? membersResp : []);
      items.forEach((member) => {
        if (!member?.role_id) return;
        counts[member.role_id] = (counts[member.role_id] || 0) + 1;
      });
      setMemberCountByRole(counts);
    } catch (error) {
      console.error("Failed to fetch matrix/members", error);
    }
  };

  const fetchHistoryLogs = async () => {
    try {
      const resp = await bulletinService.getPermissionLogs({ limit: 10, page: 1 });
      const items = resp?.data || resp?.items || [];
      setHistoryLogs(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to fetch history logs", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchHistoryLogs();
  }, []);

  useEffect(() => {
    fetchMatrixAndMembers(activeDepartmentId);
  }, [activeDepartmentId]);

  const isGranted = (role, permission) => {
    if (role.lockAllPermissions) return true;
    return draftMatrixKeys.has(`${role.id}|${permission.id}`);
  };

  const isEditableCell = (role, permission) => !role.lockAllPermissions && !role.missing && !permission.missing;

  const togglePermission = (role, permission) => {
    if (!isEditableCell(role, permission)) return;
    const key = `${role.id}|${permission.id}`;
    setDraftMatrixKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleReset = () => {
    setDraftMatrixKeys(new Set(originalMatrixKeys));
  };

  const handleSave = async () => {
    if (!activeDepartmentId) return;
    try {
      setIsSaving(true);
      const payload = [];
      resolvedRoles.forEach((role) => {
        if (role.missing) return;
        resolvedPermissions.forEach((permission) => {
          if (permission.missing) return;
          const key = `${role.id}|${permission.id}`;
          if (role.lockAllPermissions || draftMatrixKeys.has(key)) {
            payload.push({ role_id: role.id, permission_id: permission.id });
          }
        });
      });

      await bulletinService.updatePermissionMatrix(activeDepartmentId, payload);
      setOriginalMatrixKeys(new Set(draftMatrixKeys));
      await fetchMatrixAndMembers(activeDepartmentId);
      await fetchHistoryLogs(); // Refresh logs after save
    } catch (error) {
      console.error("Failed to save permission matrix", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!newRole.name?.trim()) return;
      await bulletinService.createRole({
        name: newRole.name.trim(),
        code: normalizeText(newRole.name).replace(/\s+/g, "_"),
      });
      setOpenCreateRole(false);
      setNewRole({ name: "", description: "" });
      await fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <Dialog open={openCreateRole} onClose={() => setOpenCreateRole(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Tạo vai trò mới</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên vai trò"
            fullWidth
            variant="outlined"
            sx={{ mb: 2, mt: 1 }}
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
            placeholder="Ví dụ: Biên tập viên"
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            placeholder="Vai trò này có thể làm những gì?"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenCreateRole(false)} color="inherit">
            Hủy
          </Button>
          <Button variant="contained" disabled={!newRole.name?.trim()} onClick={handleCreateRole}>
            Xác nhận tạo
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", mb: 0.5 }}>
            Ma trận Phân quyền
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, lineHeight: 1.6 }}>
            Cấu hình quyền hạn chi tiết theo từng vai trò và phòng ban
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Edit sx={{ fontSize: 18 }} />}
          size="small"
          onClick={() => setOpenCreateRole(true)}
          sx={{ borderRadius: 2, bgcolor: "background.paper", color: "text.primary", borderColor: "divider", textTransform: "none", fontWeight: 600, py: 0.5, px: 2 }}
        >
          Tạo vai trò mới
        </Button>
      </Box>

      <Tabs
        value={Math.max(departments.findIndex((d) => d.id === activeDepartmentId), 0)}
        onChange={(_, idx) => setActiveDepartmentId(departments[idx]?.id || "")}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 40,
          mb: 3,
          "& .MuiTabs-indicator": { display: "none" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 0.5,
          bgcolor: "background.paper",
        }}
      >
        {departments.map((dept, idx) => {
          const color = tabColors[idx % tabColors.length];
          return (
            <Tab
              key={dept.id}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
                  <Typography variant="body2" fontWeight={activeDepartmentId === dept.id ? 600 : 500}>
                    {dept.name}
                  </Typography>
                  <Chip
                    label={dept.member_count || 0}
                    sx={{
                      height: 18,
                      fontSize: 11,
                      bgcolor: activeDepartmentId === dept.id ? "#e6f0fd" : "grey.100",
                      color: activeDepartmentId === dept.id ? "primary.main" : "text.secondary",
                      fontWeight: 600,
                      p: 0,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Stack>
              }
              sx={{
                minHeight: 32,
                py: 0,
                px: 1.5,
                mr: 1,
                borderRadius: 1.5,
                textTransform: "none",
                color: "text.secondary",
                border: "1px solid transparent",
                "&.Mui-selected": { color: "primary.main", bgcolor: "#f4f7fe", borderColor: "text.primary" },
              }}
            />
          );
        })}
      </Tabs>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, p: 1, px: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          Chú thích:
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "success.50", border: 1, borderColor: "success.light" }}>
            <Check color="success" sx={{ fontSize: 14 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Được cấp quyền
          </Typography>
        </Stack>
        <Box sx={{ width: "1px", height: 16, bgcolor: "divider", mx: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 22, height: 22, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.50", border: 1, borderColor: "grey.300" }}>
            <Close sx={{ color: "grey.600", fontSize: 14 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Không có quyền
          </Typography>
        </Stack>
        <Box sx={{ width: "1px", height: 16, bgcolor: "divider", mx: 1 }} />
        <Typography variant="caption" color="text.disabled" sx={{ display: "flex", alignItems: "center" }}>
          <Info sx={{ fontSize: 14, mr: 0.5 }} /> Click vào ô để thay đổi quyền
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 3, overflow: "hidden", mb: 3, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell width={300} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1 }}>
                    VAI TRÒ / QUYỀN
                  </Typography>
                </TableCell>
                {resolvedPermissions.map((perm, idx) => (
                  <TableCell key={perm.key} align="center" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack alignItems="center" spacing={0.5}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: permBgColors[idx % permBgColors.length],
                          color: permMainColors[idx % permMainColors.length],
                          border: "1px solid rgba(15,23,42,0.12)",
                          "& svg": { fontSize: 18 },
                        }}
                      >
                        {perm.icon}
                      </Box>
                      <Tooltip title={perm.missing ? "Quyền này chưa có trong dữ liệu hệ thống" : perm.name}>
                        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: "block", mt: 0.5, lineHeight: 1.2 }}>
                          {perm.label}
                          {perm.missing ? " *" : ""}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {GROUP_ORDER.map((groupName) => (
                <React.Fragment key={groupName}>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell colSpan={resolvedPermissions.length + 1} sx={{ py: 1.5 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 1 }}>
                        {groupName}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {groupedRoles[groupName]?.map((role) => (
                    <TableRow key={role.key} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 1 }}>
                          <Avatar sx={{ bgcolor: role.color, width: 36, height: 36, fontWeight: 700, fontSize: 13, borderRadius: 2 }}>
                            {role.short}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {role.label || role.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {role.description}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ ml: "auto", mr: 2, color: "text.disabled" }}>
                            {memberCountByRole[role.id] || 0}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {resolvedPermissions.map((perm) => {
                        const granted = isGranted(role, perm);
                        const editable = isEditableCell(role, perm);
                        return (
                          <TableCell key={`${role.key}-${perm.key}`} align="center">
                            <Tooltip
                              title={
                                role.lockAllPermissions
                                  ? "Vai trò quản trị được khóa toàn quyền"
                                  : !editable
                                    ? "Thiếu dữ liệu role/quyền trong hệ thống"
                                    : granted
                                      ? "Đã cấp quyền"
                                      : "Chưa có quyền"
                              }
                            >
                              <Box
                                onClick={() => togglePermission(role, perm)}
                                sx={{
                                  position: "relative",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 32,
                                  height: 32,
                                  borderRadius: 2,
                                  cursor: editable ? "pointer" : "not-allowed",
                                  bgcolor: granted ? "success.50" : "grey.100",
                                  border: "1px solid",
                                  borderColor: granted ? "success.light" : "grey.400",
                                  opacity: editable || role.lockAllPermissions ? 1 : 0.6,
                                  "&:hover": editable ? { bgcolor: granted ? "success.100" : "grey.200" } : {},
                                }}
                              >
                                {granted ? <Check color="success" sx={{ fontSize: 18 }} /> : <Close sx={{ color: "grey.600", fontSize: 16 }} />}
                                {role.lockAllPermissions && granted && (
                                  <Box sx={{ position: "absolute", top: -5, right: -5, bgcolor: "warning.main", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Lock sx={{ color: "#fff", fontSize: 10 }} />
                                  </Box>
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, bgcolor: "grey.50", borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" color={changedCount > 0 ? "warning.main" : "text.disabled"} sx={{ fontWeight: changedCount > 0 ? 600 : 500 }}>
            {changedCount > 0 ? `${changedCount} thay đổi chưa lưu` : "Không có thay đổi"}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" startIcon={<Refresh />} size="small" onClick={handleReset} disabled={changedCount === 0 || isSaving}>
              Hoàn tác
            </Button>
            <Button variant="contained" startIcon={<Save />} size="small" onClick={handleSave} disabled={changedCount === 0 || isSaving}>
              Lưu cấu hình
            </Button>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: "100%", border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
              <Info color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>
                Tổng hợp vai trò - {activeDepartment?.name || ""}
              </Typography>
              <Chip label={`${resolvedRoles.length} vai trò`} size="small" sx={{ ml: "auto" }} />
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                {resolvedRoles.map((role) => {
                  const activePermsCount = resolvedPermissions.filter((perm) => isGranted(role, perm)).length;
                  return (
                    <Box key={role.key} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", alignItems: "center", gap: 2, "&:hover": { bgcolor: "grey.50" } }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: role.color, fontSize: 13, fontWeight: 700 }}>{role.short}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {role.label || role.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activePermsCount}/{resolvedPermissions.length} quyền được cấp
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: "100%", border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
              <Settings color="warning" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>
                Lịch sử thay đổi quyền
              </Typography>
              <Chip label="Gần đây" size="small" sx={{ ml: "auto" }} />
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack spacing={0}>
                {historyLogs.map((log, idx) => {
                  const date = new Date(log.timestamp || log.createdAt);
                  const timeString = isNaN(date.getTime()) ? "--" : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                  const dateString = isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
                  let userName = log.fullName || log.userName || log.userId || log.userInfoId || log.userInfo?.fullName || log.userInfo?.name || log.userInfo?.userName || "Người dùng";
                  let detailsStr = (log.details || "").toLowerCase();
                  const color = idx % 3 === 0 ? "success.main" : idx % 3 === 1 ? "warning.main" : "info.main";
                  
                  departments.forEach((d) => {
                    if (detailsStr.includes(d.id.toLowerCase())) {
                      detailsStr = detailsStr.replace(d.id.toLowerCase(), `"${d.name}"`);
                    }
                  });
                  
                  return (
                    <Box key={log.id || idx} sx={{ display: "flex", gap: 1.5, py: 1.5, borderBottom: "1px dashed", borderColor: "divider" }}>
                      <Box sx={{ minWidth: 80, pt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
                          {timeString}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                          {dateString}
                        </Typography>
                      </Box>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, mt: 0.8 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        <strong>{userName}</strong> {detailsStr}
                      </Typography>
                    </Box>
                  );
                })}
                {!historyLogs.length && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                    Chưa có lịch sử thay đổi quyền.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PermissionMatrix;
