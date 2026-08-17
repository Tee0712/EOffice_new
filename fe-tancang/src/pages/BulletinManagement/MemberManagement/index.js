import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Business,
  DeleteOutline,
  Download,
  Group,
  Search,
  Shield,
  Article,
  RotateLeft,
} from "@mui/icons-material";
import bulletinService from "@services/bulletinService";
import { useToast } from "@components/common/ToastProvider";
import BulletinLayout from "../components/BulletinLayout";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const normalizeUsersResponse = (resp) => {
  if (Array.isArray(resp)) return resp;
  if (resp?.success && Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp?.data)) return resp.data;
  return [];
};

const AVATAR_COLORS = ["#ef4444", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarColor = (seed = "") => {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash << 5) - hash + str.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const MemberManagement = () => {
  const [activeDeptId, setActiveDeptId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const [departmentSearch, setDepartmentSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ userId: "", roleId: "" });

  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");

  const [userDepartmentsMap, setUserDepartmentsMap] = useState({});
  const [memberPage, setMemberPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const toast = useToast();
  const { dataUser } = useSelector((state) => state.auth || {});

  const activeDept = useMemo(
    () => departments.find((item) => item.id === activeDeptId) || null,
    [departments, activeDeptId]
  );

  const roleMap = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => map.set(role.id, role));
    return map;
  }, [roles]);

  const isDeptAdmin = useMemo(() => {
    if (!dataUser?.id) return false;
    const currentUserMember = members.find((m) => m.user_id === dataUser.id);
    if (!currentUserMember) return false;
    const roleName = roleMap.get(currentUserMember.role_id)?.name || "";
    return roleName.toLowerCase().includes("quản trị");
  }, [dataUser, members, roleMap]);

  const assignedUserIds = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members]
  );

  const assignableUsers = useMemo(
    () => users.filter((user) => !assignedUserIds.has(user.id)),
    [users, assignedUserIds]
  );

  const filteredDepartments = useMemo(() => {
    const key = normalize(departmentSearch);
    if (!key) return departments;
    return departments.filter((d) => normalize(d.name).includes(key));
  }, [departmentSearch, departments]);

  const filteredMembers = useMemo(() => {
    const key = normalize(keyword);

    return members.filter((member) => {
      const userName = member.user?.name || member.user_name || "";
      const email = member.user?.emailUser || member.email || "";
      const roleName = roleMap.get(member.role_id)?.name || "";

      const passKeyword = !key || [userName, email, roleName].some((item) => normalize(item).includes(key));
      const passRole = roleFilter === "all" || member.role_id === roleFilter;
      return passKeyword && passRole;
    });
  }, [keyword, members, roleFilter, roleMap]);

  const roleStats = useMemo(() => {
    const counts = {};
    members.forEach((member) => {
      const role = roleMap.get(member.role_id);
      const roleName = role?.name || "Không rõ";
      counts[roleName] = (counts[roleName] || 0) + 1;
    });
    return Object.entries(counts);
  }, [members, roleMap]);

  const multiDepartmentCount = useMemo(
    () => members.filter((m) => (userDepartmentsMap[m.user_id] || []).length > 1).length,
    [members, userDepartmentsMap]
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (openAddDialog) {
      const timer = setTimeout(() => {
        searchUsers(userSearchText, 1, false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [userSearchText, openAddDialog]);

  const searchUsers = async (name, pageNum = 1, append = false) => {
    if (pageNum > 1 && !hasMoreUsers && append) return;
    try {
      setIsSearchingUsers(true);
      const resp = await bulletinService.getUsers({ name, limit: 10, page: pageNum });
      const data = resp || {};
      const list = normalizeUsersResponse(data);
      const total = data.total || 0;

      if (append) {
        setUsers((prev) => [...prev, ...list]);
      } else {
        setUsers(list);
      }
      setTotalUsersCount(total);
      setUserPage(pageNum);
      setHasMoreUsers(append ? (users.length + list.length) < total : list.length < total);
    } catch (error) {
      console.error("Failed to search users", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const loadMoreUsers = () => {
    if (isSearchingUsers || !hasMoreUsers) return;
    searchUsers(userSearchText, userPage + 1, true);
  };

  const handleUserListScroll = (event) => {
    const listboxNode = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = listboxNode;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      loadMoreUsers();
    }
  };

  const fetchMembers = async (departmentId, pageNum = 1, append = false) => {
    if (!departmentId) return;

    try {
      setIsLoadingMembers(true);
      const resp = await bulletinService.getMembers(departmentId, { page: pageNum, limit: 10 });
      // bulletinService.getMembers now returns the raw response { items, total }
      const data = resp || {};
      const newItems = Array.isArray(data.items) ? data.items : [];
      const total = data.total || 0;

      if (append) {
        setMembers((prev) => [...prev, ...newItems]);
      } else {
        setMembers(newItems);
      }

      setTotalMembers(total);
      setMemberPage(pageNum);
      setHasMore(append ? (members.length + newItems.length) < total : newItems.length < total);
    } catch (error) {
      toast("Không thể tải danh sách thành viên", "error");
      console.error("Failed to fetch members", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadMoreMembers = () => {
    if (!activeDeptId || isLoadingMembers || !hasMore) return;
    fetchMembers(activeDeptId, memberPage + 1, true);
  };

  const fetchUserDepartmentMap = async (deptList) => {
    try {
      const result = await Promise.all(
        deptList.map(async (dept) => {
          const resp = await bulletinService.getMembers(dept.id).catch(() => ({ items: [] }));
          const list = resp?.items || (Array.isArray(resp) ? resp : []);
          return { dept, members: list };
        })
      );

      const map = {};
      result.forEach(({ dept, members: deptMembers }) => {
        deptMembers.forEach((member) => {
          if (!map[member.user_id]) map[member.user_id] = [];
          map[member.user_id].push({ id: dept.id, name: dept.name });
        });
      });

      setUserDepartmentsMap(map);
    } catch (error) {
      console.error("Failed to fetch cross-department memberships", error);
    }
  };

  const fetchDepartments = async () => {
    const depts = await bulletinService.getDepartments();
    const deptList = Array.isArray(depts) ? depts : [];

    setDepartments(deptList);

    if (!deptList.length) {
      setActiveDeptId("");
      setMembers([]);
      setUserDepartmentsMap({});
      return;
    }

    const nextActiveId =
      activeDeptId && deptList.some((dept) => dept.id === activeDeptId)
        ? activeDeptId
        : deptList[0].id;

    setActiveDeptId(nextActiveId);
    await Promise.all([fetchMembers(nextActiveId), fetchUserDepartmentMap(deptList)]);
  };

  const fetchInitialData = async () => {
    try {
      setIsLoadingMeta(true);
      const [depts, rls] = await Promise.all([
        bulletinService.getDepartments(),
        bulletinService.getRoles(),
      ]);

      const deptList = Array.isArray(depts) ? depts : [];
      const roleList = Array.isArray(rls) ? rls : [];

      setDepartments(deptList);
      setRoles(roleList);

      if (deptList.length > 0) {
        const firstId = deptList[0].id;
        setActiveDeptId(firstId);
        await Promise.all([fetchMembers(firstId), fetchUserDepartmentMap(deptList)]);
      }
    } catch (error) {
      // toast("Không thể tải dữ liệu thành viên", "error");
      console.error("Failed to fetch initial data", error);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleDeptChange = (dept) => {
    setActiveDeptId(dept.id);
    setMemberPage(1);
    fetchMembers(dept.id, 1, false);
  };

  const handleChangeRole = async (member, roleId) => {
    if (!activeDeptId || member.role_id === roleId) return;

    try {
      setPendingUserId(member.user_id);
      await bulletinService.updateMemberRole(activeDeptId, member.user_id, roleId);
      setMembers((prev) =>
        prev.map((item) =>
          item.user_id === member.user_id ? { ...item, role_id: roleId } : item
        )
      );
      toast("Cập nhật vai trò thành công", "success");
    } catch (error) {
      toast("Không thể cập nhật vai trò", "error");
      console.error("Failed to update member role", error);
    } finally {
      setPendingUserId("");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!activeDeptId) return;

    const userName = member.user?.name || member.user_name || "thành viên này";
    if (!window.confirm(`Xóa ${userName} khỏi phòng ban hiện tại?`)) return;

    try {
      setPendingUserId(member.user_id);
      await bulletinService.removeMember(activeDeptId, member.user_id);
      toast("Đã xóa thành viên", "success");
      await fetchDepartments();
    } catch (error) {
      toast("Không thể xóa thành viên", "error");
      console.error("Failed to remove member", error);
    } finally {
      setPendingUserId("");
    }
  };

  const handleOpenAddDialog = () => {
    setAddForm({ userId: "", roleId: roles[0]?.id || "" });
    setUserSearchText("");
    setUsers([]);
    setUserPage(1);
    setHasMoreUsers(false);
    setOpenAddDialog(true);
  };

  const handleAddMember = async () => {
    if (!activeDeptId || !addForm.userId || !addForm.roleId) {
      toast("Vui lòng chọn người dùng và vai trò", "warning");
      return;
    }

    try {
      setPendingUserId(addForm.userId);
      await bulletinService.addMember(activeDeptId, addForm.userId, addForm.roleId);
      toast("Thêm thành viên thành công", "success");
      setOpenAddDialog(false);
      setAddForm({ userId: "", roleId: roles[0]?.id || "" });
      await fetchDepartments();
    } catch (error) {
      toast("Không thể thêm thành viên", "error");
      console.error("Failed to add member", error);
    } finally {
      setPendingUserId("");
    }
  };

  const formatJoinDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("vi-VN");
  };

  const exportMembers = () => {
    const rows = filteredMembers.map((member) => {
      const userName = member.user?.name || member.user_name || "";
      const email = member.user?.emailUser || member.email || "";
      const roleName = roleMap.get(member.role_id)?.name || "";
      const joinedDate = formatJoinDate(member.joinedAt || member.joined_at);
      const departmentsText = (userDepartmentsMap[member.user_id] || []).map((d) => d.name).join("; ");
      return [userName, email, roleName, joinedDate, departmentsText].join(",");
    });

    const csv = ["Ho ten,Email,Vai tro,Ngay tham gia,Phong ban", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${activeDept?.name || "department"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BulletinLayout activeTab="members">
      <Box sx={{ p: 3, bgcolor: "#f3f6fb", minHeight: "100vh", fontFamily: "'Inter', 'Roboto', sans-serif" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", mb: 0.5 }}>
              Quản lý Thành viên
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, lineHeight: 1.6 }}>
              Gán người dùng vào phòng ban và phân vai trò trong quy trình bản tin
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<Download />} onClick={exportMembers}>
              Xuất danh sách
            </Button>
            {!isDeptAdmin ? (
              <Tooltip title="Chỉ Quản trị viên mới được thêm thành viên">
                <span>
                  <Button variant="contained" startIcon={<Add />} disabled>
                    Thêm thành viên
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog} disabled={!activeDeptId}>
                Thêm thành viên
              </Button>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, p: 0, border: "1px solid #dbe3ef" }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#64748b", mb: 1 }}>
                  PHÒNG BAN
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm phòng ban..."
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Divider />
              <List sx={{ p: 0 }}>
                {filteredDepartments.map((dept) => (
                  <ListItem key={dept.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleDeptChange(dept)}
                      selected={activeDeptId === dept.id}
                      sx={{
                        py: 1.4,
                        borderLeft: "3px solid transparent",
                        "&.Mui-selected": {
                          bgcolor: "#eef4ff",
                          borderLeftColor: "#2563eb",
                        },
                      }}
                    >
                      <ListItemText
                        primary={dept.name}
                        primaryTypographyProps={{ fontSize: 15, fontWeight: 600 }}
                      />
                      <Chip label={dept.member_count || 0} size="small" sx={{ bgcolor: "#e2e8f0", fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>

          <Grid item xs={12} md={9}>
            <Card sx={{ borderRadius: 3, mb: 2, p: 2.5, border: "1px solid #dbe3ef" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 48, height: 48, bgcolor: "#4f46e5", fontWeight: 800 }}>
                    {getInitials(activeDept?.name || "PB")}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{activeDept?.name || "--"}</Typography>
                    <Typography variant="body2" color="text.secondary">DEPT - {activeDept?.code || activeDept?.id?.slice(0, 6) || "--"}</Typography>
                  </Box>
                </Stack>
                <Chip label="Hoạt động" color="success" variant="outlined" />
              </Stack>

              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={6} md={3}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "#e0e7ff", color: "#3730a3" }}><Group fontSize="small" /></Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{members.length}</Typography>
                      <Typography variant="caption" color="text.secondary">Thành viên</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "#ede9fe", color: "#6d28d9" }}><Shield fontSize="small" /></Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{roles.length}</Typography>
                      <Typography variant="caption" color="text.secondary">Vai trò</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "#d1fae5", color: "#047857" }}><Article fontSize="small" /></Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{activeDept?.bulletin_count || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Bản tin</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "#ffedd5", color: "#c2410c" }}><Business fontSize="small" /></Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{multiDepartmentCount}</Typography>
                      <Typography variant="caption" color="text.secondary">Đa phòng ban</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1.25 }} />
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {roleStats.map(([roleName, count]) => (
                  <Typography key={roleName} variant="body2" color="text.secondary">
                    {roleName}: <b style={{ color: "#0f172a" }}>{count}</b>
                  </Typography>
                ))}
                {!roleStats.length && <Typography variant="body2" color="text.secondary">Chưa có dữ liệu vai trò</Typography>}
              </Stack>
            </Card>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm thành viên..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 220 }}>
                <MenuItem value="all">Tất cả vai trò</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </Stack>

            <Card sx={{ borderRadius: 3, border: "1px solid #dbe3ef" }}>
              {isLoadingMembers || isLoadingMeta ? (
                <Stack alignItems="center" py={8}>
                  <CircularProgress size={28} />
                </Stack>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 700 }}>THÀNH VIÊN</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>VAI TRÒ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>PHÒNG BAN KHÁC</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>NGÀY THAM GIA</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 100 }}>BẢN TIN</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }}>THAO TÁC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMembers.map((member) => {
                        const userName = member.user?.name || member.user_name || "--";
                        const email = member.user?.emailUser || member.email || "--";
                        const memberships = userDepartmentsMap[member.user_id] || [];

                        return (
                          <TableRow key={member.id} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: getAvatarColor(userName), width: 34, height: 34, fontSize: 13 }}>
                                  {getInitials(userName)}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontWeight: 700 }}>{userName}</Typography>
                                  <Typography variant="body2" color="text.secondary">{email}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={member.role_id}
                                disabled={!isDeptAdmin || pendingUserId === member.user_id}
                                onChange={(e) => handleChangeRole(member, e.target.value)}
                                sx={{ minWidth: 150, fontWeight: 700 }}
                              >
                                {roles.map((role) => (
                                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                {memberships.slice(0, 3).map((dept) => (
                                  <Chip
                                    key={`${member.id}-${dept.id}`}
                                    size="small"
                                    label={dept.name}
                                    color={dept.id === activeDeptId ? "primary" : "default"}
                                    variant={dept.id === activeDeptId ? "filled" : "outlined"}
                                  />
                                ))}
                                {memberships.length > 3 && <Chip size="small" label={`+${memberships.length - 3}`} />}
                              </Stack>
                            </TableCell>
                            <TableCell>{formatJoinDate(member.joinedAt || member.joined_at)}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{member.bulletin_count || 0}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Làm mới">
                                  <IconButton size="small" onClick={() => fetchMembers(activeDeptId, 1, false)}>
                                    <RotateLeft fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={!isDeptAdmin ? "Chỉ Quản trị viên mới có quyền xóa" : "Xóa khỏi phòng ban"}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={!isDeptAdmin || pendingUserId === member.user_id}
                                      onClick={() => handleRemoveMember(member)}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!filteredMembers.length && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                              Không có thành viên phù hợp.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {hasMore && (
                <Box sx={{ p: 2, textAlign: "center", borderTop: "1px solid #eee" }}>
                  <Button
                    size="small"
                    onClick={loadMoreMembers}
                    disabled={isLoadingMembers}
                    startIcon={isLoadingMembers ? <CircularProgress size={16} /> : null}
                  >
                    {isLoadingMembers ? "Đang tải..." : `Xem thêm (${totalMembers - members.length} thành viên còn lại)`}
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm thành viên vào phòng ban</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={assignableUsers}
                value={assignableUsers.find((user) => user.id === addForm.userId) || null}
                onChange={(_, value) => setAddForm((prev) => ({ ...prev, userId: value?.id || "" }))}
                onInputChange={(_, value, reason) => {
                  if (reason === "input" || reason === "clear") {
                    setUserSearchText(value || "");
                  }
                }}
                loading={isSearchingUsers}
                filterOptions={(x) => x}
                getOptionLabel={(option) => `${option.name || option.username || ""} (${option.emailUser || option.id})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                ListboxProps={{
                  onScroll: handleUserListScroll,
                  sx: { maxHeight: 300 }
                }}
                renderOption={(props, option, state) => {
                  const isLoader = hasMoreUsers && state.index === assignableUsers.length - 1;
                  return (
                    <React.Fragment key={option.id}>
                      <ListItem {...props}>
                        <ListItemButton sx={{ p: 0 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', py: 0.5 }}>
                            <Avatar sx={{ bgcolor: getAvatarColor(option.name), width: 32, height: 32, fontSize: 13 }}>
                              {getInitials(option.name)}
                            </Avatar>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name || option.username}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {option.emailUser || "Không có email"} • {option.id?.slice(0, 8)}
                              </Typography>
                            </Box>
                          </Stack>
                        </ListItemButton>
                      </ListItem>
                      {isLoader && isSearchingUsers && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      )}
                    </React.Fragment>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tìm kiếm người dùng..."
                    placeholder="Nhập tên hoặc email người dùng"
                    autoFocus
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {isSearchingUsers && !users.length ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
                noOptionsText={userSearchText ? "Không tìm thấy người dùng nào phù hợp" : "Nhập để tìm kiếm..."}
                fullWidth
              />

              <Select
                value={addForm.roleId}
                onChange={(e) => setAddForm((prev) => ({ ...prev, roleId: e.target.value }))}
                displayEmpty
              >
                {!roles.length && <MenuItem value="">Không có vai trò</MenuItem>}
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)} color="inherit">Hủy</Button>
            <Button variant="contained" onClick={handleAddMember} disabled={!addForm.userId || !addForm.roleId || !!pendingUserId}>
              Thêm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BulletinLayout>
  );
};

export default MemberManagement;
