import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import {
  Add,
  Article,
  AssignmentTurnedIn,
  Block,
  Campaign,
  Circle,
  CloudOff,
  DescriptionOutlined,
  Description,
  DeleteForever,
  Download,
  Edit,
  Event,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  Fullscreen,
  FullscreenExit,
  Link as LinkIcon,
  PendingActions,
  RemoveRedEye,
  RuleFolder,
  ReportProblem,
  Search,
  Sort,
  Title,
  Upload,
} from "@mui/icons-material";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import bulletinService from "@services/bulletinService";
import { useToast } from "@components/common/ToastProvider";
import BulletinLayout from "../components/BulletinLayout";

const TYPE_OPTIONS = [
  {
    value: "NEWS",
    label: "Tin tức",
    icon: <Description fontSize="small" />,
    color: "#2563eb",
  },
  {
    value: "NOTICE",
    label: "Thông báo",
    icon: <Campaign fontSize="small" />,
    color: "#d97706",
  },
  {
    value: "REPORT",
    label: "Báo cáo",
    icon: <Article fontSize="small" />,
    color: "#0f766e",
  },
  {
    value: "EVENT",
    label: "Sự kiện",
    icon: <Event fontSize="small" />,
    color: "#7c3aed",
  },
  {
    value: "SAFETY",
    label: "An toàn",
    icon: <ReportProblem fontSize="small" />,
    color: "#dc2626",
  },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp" },
  { value: "NORMAL", label: "Bình thường" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn" },
];

const STATUS_LABELS = {
  DRAFT: {
    label: "Bản nháp",
    color: "default",
    icon: <Edit fontSize="small" />,
  },
  PENDING: {
    label: "Chờ duyệt",
    color: "warning",
    icon: <PendingActions fontSize="small" />,
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "info",
    icon: <AssignmentTurnedIn fontSize="small" />,
  },
  PUBLISHED: {
    label: "Đã đăng tải",
    color: "success",
    icon: <RuleFolder fontSize="small" />,
  },
  REJECTED: {
    label: "Từ chối",
    color: "error",
    icon: <Block fontSize="small" />,
  },
  REQUIRE_EDIT: {
    label: "Yêu cầu sửa",
    color: "secondary",
    icon: <Edit fontSize="small" />,
  },
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isEditorContentEmpty = (html = "") => {
  const plain = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !plain;
};

const BulletinList = () => {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [roles, setRoles] = useState([]);

  const [activeDept, setActiveDept] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [createForm, setCreateForm] = useState({
    title: "",
    bulletin_type: "NEWS",
    department_id: "",
    priority: "NORMAL",
    content: "",
    tags: [],
    attachments: [],
    auto_schedule: false,
    scheduled_publish_at: "",
    scheduled_publish_at: "",
    viewer_department_ids: [],
  });

  const [editingId, setEditingId] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const { dataUser } = useSelector((state) => state.auth || {});

  const [openView, setOpenView] = useState(false);
  const [viewingBulletin, setViewingBulletin] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const roleMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(roles) ? roles : []).forEach((role) =>
      map.set(role.id, role)
    );
    return map;
  }, [roles]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content: "",
    onUpdate: ({ editor: instance }) => {
      setCreateForm((prev) => ({ ...prev, content: instance.getHTML() }));
    },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (openCreate) {
      editor?.commands.setContent(createForm.content || "");
    } else {
      setIsEditorFullscreen(false);
    }
  }, [openCreate, editor]);

  const fetchInitialData = async () => {
    try {
      const [depts, bltns] = await Promise.all([
        bulletinService.getDepartments(),
        bulletinService.getBulletins(),
      ]);

      const [rolesResult, myRolesResult] = await Promise.allSettled([
        bulletinService.getRoles(),
        bulletinService.getUserRoles(),
      ]);

      const deptList = Array.isArray(depts) ? depts : [];
      const bulletinList = (Array.isArray(bltns) ? bltns : []).map((item) => ({
        ...item,
        tags: parseJsonArray(item.tags),
        attachments: parseJsonArray(item.attachments),
      }));

      setDepartments(deptList);
      setBulletins(bulletinList);
      setRoles(
        rolesResult.status === "fulfilled" && Array.isArray(rolesResult.value)
          ? rolesResult.value
          : []
      );
      setUserRoles(
        myRolesResult.status === "fulfilled" &&
          Array.isArray(myRolesResult.value)
          ? myRolesResult.value
          : []
      );
      setCreateForm((prev) => ({
        ...prev,
        department_id: prev.department_id || deptList[0]?.id || "",
      }));
    } catch (error) {
      // toast("Không thể tải dữ liệu bản tin", "error");
      console.error(error);
    }
  };

  const filteredBulletins = useMemo(() => {
    const key = normalizeText(searchKeyword);

    return bulletins.filter((item) => {
      const viewerDepts = parseJsonArray(
        item.viewerDepartmentIds || item.viewer_department_ids
      );
      const isVisibleToDept =
        activeDept === "ALL" ||
        item.department_id === activeDept ||
        viewerDepts.includes(activeDept) ||
        viewerDepts.includes("ALL");

      const passDept = isVisibleToDept;
      const passStatus = !statusFilter || item.status === statusFilter;
      const passType =
        !typeFilter ||
        (item.bulletinType || item.bulletin_type || "NEWS") === typeFilter;
      const passKeyword =
        !key ||
        normalizeText(item.title).includes(key) ||
        normalizeText(item.content).includes(key) ||
        normalizeText(item.department?.name || "").includes(key);

      return passDept && passStatus && passType && passKeyword;
    });
  }, [activeDept, bulletins, searchKeyword, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(0);
  }, [activeDept, searchKeyword, statusFilter, typeFilter]);

  const pagedBulletins = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredBulletins.slice(start, start + rowsPerPage);
  }, [filteredBulletins, page, rowsPerPage]);

  const stats = useMemo(() => {
    const total = filteredBulletins.length;
    const draft = filteredBulletins.filter((b) => b.status === "DRAFT").length;
    const pending = filteredBulletins.filter(
      (b) => b.status === "PENDING"
    ).length;
    const published = filteredBulletins.filter(
      (b) => b.status === "PUBLISHED"
    ).length;
    const rejected = filteredBulletins.filter(
      (b) => b.status === "REJECTED"
    ).length;
    return { total, draft, pending, published, rejected };
  }, [filteredBulletins]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const canUnpublishBulletin = (bulletin) => {
    const departmentId = bulletin?.department_id;
    if (!departmentId) return false;

    const matched = (Array.isArray(userRoles) ? userRoles : []).find(
      (ur) => ur.department_id === departmentId
    );
    if (!matched) return false;

    if (matched.role_id === "fallback-admin") return true;

    const role = roleMap.get(matched.role_id);
    if (role?.code === "ADMIN") return true;

    return normalizeText(role?.name || "").includes("quan tri");
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (createForm.tags.includes(value)) {
      setTagInput("");
      return;
    }
    setCreateForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
    setTagInput("");
  };

  const removeTag = (tag) => {
    setCreateForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const nextFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setCreateForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...nextFiles],
    }));
    event.target.value = "";
  };

  const removeAttachment = (name) => {
    setCreateForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((item) => item.name !== name),
    }));
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      bulletin_type: "NEWS",
      department_id: departments[0]?.id || "",
      priority: "NORMAL",
      content: "",
      tags: [],
      attachments: [],
      auto_schedule: false,
      scheduled_publish_at: "",
      viewer_department_ids: [],
    });
    setEditingId(null);
    setTagInput("");
    editor?.commands.setContent("");
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    const parseMetaArr = (str) => {
      try {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    };
    setCreateForm({
      title: item.title || "",
      bulletin_type: item.bulletinType || item.bulletin_type || "NEWS",
      department_id:
        item.department_id || item.department?.id || departments[0]?.id || "",
      priority: item.priority || "NORMAL",
      content: item.content || "",
      tags: parseMetaArr(item.tags),
      attachments: parseMetaArr(item.attachments),
      auto_schedule: !!(item.scheduledPublishAt || item.scheduled_publish_at),
      scheduled_publish_at:
        item.scheduledPublishAt || item.scheduled_publish_at
          ? new Date(item.scheduledPublishAt || item.scheduled_publish_at)
            .toISOString()
            .slice(0, 16)
          : "",
      viewer_department_ids: parseMetaArr(
        item.viewerDepartmentIds || item.viewer_department_ids
      ),
    });
    setOpenCreate(true);
  };

  const handleCreate = async (mode) => {
    if (
      !createForm.title.trim() ||
      !createForm.department_id ||
      isEditorContentEmpty(createForm.content)
    ) {
      toast("Vui lòng nhập đủ tiêu đề, phòng ban và nội dung", "warning");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title: createForm.title.trim(),
        content: createForm.content,
        department_id: createForm.department_id,
        bulletin_type: createForm.bulletin_type,
        priority: createForm.priority,
        tags: createForm.tags,
        attachments: createForm.attachments,
        auto_schedule: createForm.auto_schedule,
        scheduled_publish_at:
          createForm.auto_schedule && createForm.scheduled_publish_at
            ? new Date(createForm.scheduled_publish_at).toISOString()
            : undefined,
        viewer_department_ids: createForm.viewer_department_ids,
      };

      if (editingId) {
        await bulletinService.updateBulletin(editingId, payload);
        if (mode === "submit") {
          await bulletinService.submitBulletin(editingId);
        }
        toast(
          mode === "submit" ? "Đã gửi phê duyệt lại" : "Đã cập nhật bản tin",
          "success"
        );
      } else {
        const created = await bulletinService.createBulletin(payload);
        if (mode === "submit" && created?.id) {
          await bulletinService.submitBulletin(created.id);
        }
        toast(
          mode === "submit" ? "Đã gửi phê duyệt" : "Đã lưu bản nháp",
          "success"
        );
      }

      setOpenCreate(false);
      resetCreateForm();
      await fetchInitialData();
    } catch (error) {
      toast("Không thể tạo bản tin", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = async (id) => {
    try {
      setIsLoadingDetail(true);
      const [detail] = await Promise.all([
        bulletinService.getBulletinById(id),
        bulletinService.increaseBulletinView(id).catch(() => { }), // Ignore error if view increase fails
      ]);
      setViewingBulletin(detail);
      setOpenView(true);
      // Refresh list to update view count in table
      fetchInitialData();
    } catch (error) {
      toast("Không thể tải thông tin bản tin", "error");
      console.error(error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleUnpublish = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn gỡ bản tin này xuống không?"))
      return;
    try {
      await bulletinService.unpublishBulletin(id);
      toast("Đã gỡ bản tin thành công", "success");
      fetchInitialData();
    } catch (error) {
      toast("Không thể gỡ bản tin", "error");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn bản tin này không? Cảnh báo: Hành động này không thể hoàn tác."
      )
    )
      return;
    try {
      await bulletinService.deleteBulletin(id);
      toast("Đã xóa bản tin thành công", "success");
      fetchInitialData();
    } catch (error) {
      toast("Không thể xóa bản tin hoặc bạn không có quyền", "error");
      console.error(error);
    }
  };

  const statusChip = (status) => {
    const cfg = STATUS_LABELS[status] || {
      label: status || "--",
      color: "default",
      icon: <Description fontSize="small" />,
    };
    return (
      <Chip
        size="small"
        icon={cfg.icon}
        label={cfg.label}
        color={cfg.color}
        variant={cfg.color === "default" ? "outlined" : "filled"}
      />
    );
  };

  return (
    <BulletinLayout activeTab="dashboard">
      <Box sx={{ p: 3, bgcolor: "#f3f6fb", minHeight: "100vh" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <DescriptionOutlined color="primary" />
              Danh sách Bản tin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý bản tin theo phòng ban phụ trách, theo dõi trạng thái phê
              duyệt và đăng tải
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<Download />}>
              Xuất báo cáo
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCreate(true)}
            >
              Tạo bản tin mới
            </Button>
          </Stack>
        </Stack>

        <Card
          sx={{ p: 1.2, borderRadius: 2, mb: 2, border: "1px solid #dbe3ef" }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              startIcon={<DescriptionOutlined fontSize="small" />}
              variant={activeDept === "ALL" ? "contained" : "text"}
              onClick={() => setActiveDept("ALL")}
              sx={{ borderRadius: 2 }}
            >
              Tất cả ({bulletins.length})
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept.id}
                size="small"
                startIcon={
                  <Circle
                    sx={{ fontSize: 10, color: dept.color || "primary.main" }}
                  />
                }
                variant={activeDept === dept.id ? "contained" : "text"}
                onClick={() => setActiveDept(dept.id)}
                sx={{ borderRadius: 2 }}
              >
                {dept.name} ({dept.member_count || 0})
              </Button>
            ))}
          </Stack>
        </Card>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            {
              label: "Tổng bản tin",
              value: stats.total,
              icon: <DescriptionOutlined fontSize="small" />,
              color: "#2563eb",
            },
            {
              label: "Bản nháp",
              value: stats.draft,
              icon: <Edit fontSize="small" />,
              color: "#7c3aed",
            },
            {
              label: "Chờ duyệt",
              value: stats.pending,
              icon: <PendingActions fontSize="small" />,
              color: "#d97706",
            },
            {
              label: "Đã đăng tải",
              value: stats.published,
              icon: <RuleFolder fontSize="small" />,
              color: "#16a34a",
            },
            {
              label: "Từ chối",
              value: stats.rejected,
              icon: <Block fontSize="small" />,
              color: "#dc2626",
            },
          ].map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={2.4}>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #dbe3ef",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: `${item.color}20`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Avatar>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ lineHeight: 1 }}
                  >
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm bản tin..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {Object.entries(STATUS_LABELS).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>
                  {cfg.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Loại bản tin</InputLabel>
            <Select
              value={typeFilter}
              label="Loại bản tin"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {TYPE_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Sort />} sx={{ minWidth: 120 }}>
            Mới nhất
          </Button>
        </Stack>

        <Card sx={{ borderRadius: 2, border: "1px solid #dbe3ef" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>TIÊU ĐỀ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PHÒNG BAN</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>NGƯỜI TẠO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>TRẠNG THÁI</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>NGÀY TẠO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>LƯỢT XEM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>THAO TÁC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedBulletins.map((item) => {
                  const typeMeta =
                    TYPE_OPTIONS.find(
                      (t) =>
                        t.value ===
                        (item.bulletinType || item.bulletin_type || "NEWS")
                    ) || TYPE_OPTIONS[0];
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.2}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: `${typeMeta.color}22`,
                              color: typeMeta.color,
                            }}
                          >
                            {typeMeta.icon}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={700}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.id?.slice(0, 10)} • {typeMeta.label}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.department?.name || "--"}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {(item.author?.name || "U")[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {item.author?.name || "--"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{statusChip(item.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString("vi-VN")
                            : "--"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.viewCount || item.view_count || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleView(item.id)}
                              disabled={isLoadingDetail}
                              sx={{ color: "primary.main" }}
                            >
                              <RemoveRedEye fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {(item.status === "DRAFT" ||
                            item.status === "REJECTED" ||
                            item.status === "REQUIRE_EDIT") && (
                              <Tooltip title="Sửa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          {item.status === "PUBLISHED" &&
                            canUnpublishBulletin(item) && (
                              <Tooltip title="Gỡ bản tin">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleUnpublish(item.id)}
                                >
                                  <CloudOff fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          {(canUnpublishBulletin(item) ||
                            item.status === "DRAFT" ||
                            item.status === "REJECTED" ||
                            item.status === "REQUIRE_EDIT") && (
                              <Tooltip title="Xóa vĩnh viễn">
                                <IconButton
                                  size="small"
                                  sx={{ color: "error.main" }}
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <DeleteForever fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredBulletins.length && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography
                        sx={{ py: 3, textAlign: "center" }}
                        color="text.secondary"
                      >
                        Không có bản tin phù hợp
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredBulletins.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Dòng/trang:"
          />
        </Card>

        <Dialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          maxWidth={isEditorFullscreen ? false : "sm"}
          fullWidth
          fullScreen={isEditorFullscreen}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {editingId ? "Cập nhật bản tin" : "Tạo bản tin mới"}
            <Tooltip
              title={
                isEditorFullscreen ? "Thoát toàn màn hình" : "Soạn toàn màn hình"
              }
            >
              <IconButton
                onClick={() => setIsEditorFullscreen((prev) => !prev)}
                size="small"
              >
                {isEditorFullscreen ? (
                  <FullscreenExit fontSize="small" />
                ) : (
                  <Fullscreen fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <TextField
                label="Tiêu đề bản tin *"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Nhập tiêu đề bản tin..."
              />

              <Box>
                <Typography variant="caption" fontWeight={700}>
                  LOẠI BẢN TIN *
                </Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {TYPE_OPTIONS.map((option) => (
                    <Grid item xs={2.4} key={option.value}>
                      <Card
                        onClick={() =>
                          setCreateForm((p) => ({
                            ...p,
                            bulletin_type: option.value,
                          }))
                        }
                        sx={{
                          p: 1,
                          textAlign: "center",
                          cursor: "pointer",
                          border: "1px solid",
                          borderColor:
                            createForm.bulletin_type === option.value
                              ? "primary.main"
                              : "divider",
                          bgcolor:
                            createForm.bulletin_type === option.value
                              ? "#eef4ff"
                              : "#fff",
                        }}
                      >
                        <Box sx={{ color: option.color }}>{option.icon}</Box>
                        <Typography variant="caption">{option.label}</Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Phòng ban phụ trách *</InputLabel>
                  <Select
                    value={createForm.department_id}
                    label="Phòng ban phụ trách *"
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        department_id: e.target.value,
                      }))
                    }
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Mức độ ưu tiên</InputLabel>
                  <Select
                    value={createForm.priority}
                    label="Mức độ ưu tiên"
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, priority: e.target.value }))
                    }
                  >
                    {PRIORITY_OPTIONS.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <FormControl fullWidth>
                <InputLabel>
                  Phạm vi hiển thị (Những phòng ban được xem) *
                </InputLabel>
                <Select
                  multiple
                  label="Phạm vi hiển thị (Những phòng ban được xem) *"
                  value={createForm.viewer_department_ids}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      viewer_department_ids: e.target.value,
                    }))
                  }
                  renderValue={(selected) => (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {selected.map((val) => {
                        const dept = departments.find((d) => d.id === val);
                        return (
                          <Chip
                            key={val}
                            label={dept?.name || val}
                            size="small"
                          />
                        );
                      })}
                    </Stack>
                  )}
                >
                  <MenuItem value="ALL">
                    <em>Tất cả phòng ban</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="caption" fontWeight={700}>
                  NỘI DUNG BẢN TIN *
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, mb: 0.8 }}>
                  <IconButton
                    size="small"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    color={editor?.isActive("bold") ? "primary" : "default"}
                  >
                    <FormatBold fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    color={editor?.isActive("italic") ? "primary" : "default"}
                  >
                    <FormatItalic fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    color={
                      editor?.isActive("heading", { level: 2 })
                        ? "primary"
                        : "default"
                    }
                  >
                    <Title fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    color={editor?.isActive("bulletList") ? "primary" : "default"}
                  >
                    <FormatListBulleted fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const url = window.prompt("Nhập liên kết:");
                      if (!url) return;
                      editor?.chain().focus().setLink({ href: url }).run();
                    }}
                    color={editor?.isActive("link") ? "primary" : "default"}
                  >
                    <LinkIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    minHeight: isEditorFullscreen ? "52vh" : 220,
                    px: 1.5,
                    py: 1,
                    "& .ProseMirror": {
                      outline: "none",
                      minHeight: isEditorFullscreen ? "48vh" : 180,
                      fontSize: 14,
                      lineHeight: 1.6,
                    },
                  }}
                >
                  <EditorContent editor={editor} />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700}>
                  TỪ KHÓA / TAG
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Nhập tag rồi nhấn Enter"
                  sx={{ mt: 0.5 }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 1 }}
                >
                  {createForm.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700}>
                  TỆP ĐÍNH KÈM
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<Upload />}
                  sx={{ mt: 0.5 }}
                >
                  Chọn tệp
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleAttachmentChange}
                  />
                </Button>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {createForm.attachments.map((file) => (
                    <Stack
                      key={file.name}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">{file.name}</Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeAttachment(file.name)}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Card variant="outlined" sx={{ p: 1.25 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Hẹn giờ đăng tải tự động
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bản tin sẽ tự động publish sau khi được phê duyệt
                    </Typography>
                  </Box>
                  <Switch
                    checked={createForm.auto_schedule}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        auto_schedule: e.target.checked,
                      }))
                    }
                  />
                </Stack>
                {createForm.auto_schedule && (
                  <TextField
                    type="datetime-local"
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                    value={createForm.scheduled_publish_at}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        scheduled_publish_at: e.target.value,
                      }))
                    }
                  />
                )}
              </Card>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => handleCreate("draft")}
              disabled={isSaving}
            >
              Lưu nháp
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleCreate("submit")}
              disabled={isSaving}
            >
              Gửi phê duyệt
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Bulletin Dialog */}
        <Dialog
          open={openView}
          onClose={() => setOpenView(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: "1px solid #eee", pb: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight={800} color="primary">
                Chi tiết Bản tin
              </Typography>
              {statusChip(viewingBulletin?.status)}
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {viewingBulletin && (
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ mb: 1, color: "#1e293b" }}
                  >
                    {viewingBulletin.title}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 14,
                          bgcolor: "primary.main",
                        }}
                      >
                        {(viewingBulletin.author?.name || "U")[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {viewingBulletin.author?.name || "Người dùng hệ thống"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tác giả
                        </Typography>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        width: 1,
                        height: 24,
                        bgcolor: "divider",
                        flexShrink: 0,
                        mx: 1,
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {viewingBulletin.department?.name || "--"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Phòng ban phụ trách
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Ngày tạo:{" "}
                      {new Date(viewingBulletin.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </Typography>
                  </Stack>
                </Box>

                <Card
                  variant="outlined"
                  sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        LOẠI BẢN TIN
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {TYPE_OPTIONS.find(
                          (t) => t.value === viewingBulletin.bulletinType
                        )?.label || viewingBulletin.bulletinType}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        MỨC ĐỘ ƯU TIÊN
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {PRIORITY_OPTIONS.find(
                          (p) => p.value === viewingBulletin.priority
                        )?.label || viewingBulletin.priority}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        LƯỢT XEM
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary"
                      >
                        {viewingBulletin.viewCount || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>

                <Box
                  sx={{
                    "& img": {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 1,
                    },
                    "& table": {
                      borderCollapse: "collapse",
                      width: "100%",
                      mb: 2,
                    },
                    "& th, & td": { border: "1px solid #ddd", p: 1 },
                    "& blockquote": {
                      borderLeft: "4px solid #ddd",
                      pl: 2,
                      py: 1,
                      my: 2,
                      color: "text.secondary",
                    },
                    fontSize: "1.05rem",
                    lineHeight: 1.7,
                    color: "#334155",
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: viewingBulletin.content }}
                  />
                </Box>

                {parseJsonArray(viewingBulletin.tags).length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Tags:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {parseJsonArray(viewingBulletin.tags).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {parseJsonArray(viewingBulletin.attachments).length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Tệp đính kèm:
                    </Typography>
                    <Grid container spacing={1}>
                      {parseJsonArray(viewingBulletin.attachments).map(
                        (file, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Card
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                "&:hover": { bgcolor: "#f1f5f9" },
                                cursor: "pointer",
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.light",
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                <Download fontSize="small" />
                              </Avatar>
                              <Box sx={{ overflow: "hidden" }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  noWrap
                                >
                                  {file.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {(file.size / 1024).toFixed(1)} KB
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: "1px solid #eee" }}>
            <Button
              variant="contained"
              onClick={() => setOpenView(false)}
              size="large"
              sx={{ px: 4 }}
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BulletinLayout>
  );
};

export default BulletinList;
