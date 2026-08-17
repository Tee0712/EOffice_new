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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Pagination,
} from "@mui/material";
import {
  ArrowForward,
  Block,
  Bolt,
  Circle,
  Close,
  Done,
  MoreHoriz,
  PendingActions,
  PublishedWithChanges,
  RuleFolder,
  SaveOutlined,
  Schedule,
  Settings,
} from "@mui/icons-material";
import bulletinService from "@services/bulletinService";
import { useToast } from "@components/common/ToastProvider";

const STATUS_COLUMNS = [
  { key: "DRAFT", label: "Nháp", color: "#94a3b8" },
  { key: "PENDING", label: "Chờ duyệt", color: "#d97706" },
  { key: "APPROVED", label: "Đã duyệt", color: "#2563eb" },
  { key: "PUBLISHED", label: "Đã đăng tải", color: "#16a34a" },
  { key: "REJECTED", label: "Từ chối", color: "#dc2626" },
];

const DEFAULT_WORKFLOW_STEPS = [
  {
    step_order: 1,
    step_name: "Nháp",
    approver_type: "BY_USER",
    approver_id: "",
    sla_hours: null,
    is_required: true,
    min_approvals: 1,
    can_auto_publish: false,
    publish_channel: "INTERNAL",
    notify_scope: "DEPARTMENT",
    on_reject_action: "RETURN_TO_DRAFT",
    is_active: true,
  },
  {
    step_order: 2,
    step_name: "Chờ phê duyệt",
    approver_type: "BY_ROLE",
    approver_id: "",
    sla_hours: 8,
    is_required: true,
    min_approvals: 1,
    can_auto_publish: false,
    publish_channel: "INTERNAL",
    notify_scope: "DEPARTMENT",
    on_reject_action: "RETURN_TO_DRAFT",
    is_active: true,
  },
  {
    step_order: 3,
    step_name: "Duyệt cấp 2",
    approver_type: "BY_ROLE",
    approver_id: "",
    sla_hours: null,
    is_required: false,
    min_approvals: 1,
    can_auto_publish: false,
    publish_channel: "INTERNAL",
    notify_scope: "DEPARTMENT",
    on_reject_action: "RETURN_TO_DRAFT",
    is_active: false,
  },
  {
    step_order: 4,
    step_name: "Đăng tải",
    approver_type: "BY_ROLE",
    approver_id: "",
    sla_hours: null,
    is_required: true,
    min_approvals: 1,
    can_auto_publish: true,
    publish_channel: "INTERNAL",
    notify_scope: "ALL_DEPARTMENTS",
    on_reject_action: "RETURN_TO_DRAFT",
    is_active: true,
  },
];

const normalizeWorkflowStep = (step, index) => ({
  step_order: step.step_order || index + 1,
  step_name: step.step_name || `Bước ${index + 1}`,
  approver_type: step.approver_type || "BY_ROLE",
  approver_id: step.approver_id || "",
  sla_hours: typeof step.sla_hours === "number" ? step.sla_hours : null,
  is_required: step.is_required !== false,
  min_approvals: Number(step.min_approvals || 1),
  can_auto_publish: !!step.can_auto_publish,
  publish_channel: step.publish_channel || "INTERNAL",
  notify_scope: step.notify_scope || "DEPARTMENT",
  on_reject_action: step.on_reject_action || "RETURN_TO_DRAFT",
  is_active: step.is_active !== false,
});

const parseConfigJson = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
};

const ApprovalWorkflow = () => {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [activeDeptId, setActiveDeptId] = useState("ALL");
  const [bulletins, setBulletins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [openConfig, setOpenConfig] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState(DEFAULT_WORKFLOW_STEPS);
  const [rejectPolicy, setRejectPolicy] = useState("RETURN_TO_DRAFT");
  const [warningAmber, setWarningAmber] = useState("70_PERCENT");
  const [warningRed, setWarningRed] = useState("OVERDUE");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [pageByStatus, setPageByStatus] = useState({
    DRAFT: 1,
    PENDING: 1,
    APPROVED: 1,
    PUBLISHED: 1,
    REJECTED: 1,
  });
  const PAGE_SIZE = 4;

  const handlePageChange = (status, newPage) => {
    setPageByStatus((prev) => ({ ...prev, [status]: newPage }));
  };

  const activeDepartment = useMemo(
    () => departments.find((d) => d.id === activeDeptId) || null,
    [departments, activeDeptId]
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!activeDepartment?.id) {
      setWorkflowConfig(DEFAULT_WORKFLOW_STEPS);
      return;
    }
    fetchWorkflows(activeDepartment.id);
  }, [activeDepartment?.id]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [depts, bltns, rls, userResp] = await Promise.all([
        bulletinService.getDepartments(),
        bulletinService.getBulletins(),
        bulletinService.getRoles(),
        bulletinService.getUsers(),
      ]);

      const deptList = Array.isArray(depts) ? depts : [];
      setDepartments(deptList);
      setBulletins(Array.isArray(bltns) ? bltns : []);
      setRoles(Array.isArray(rls) ? rls : []);

      const usersList = Array.isArray(userResp)
        ? userResp
        : Array.isArray(userResp?.data)
          ? userResp.data
          : [];
      setUsers(usersList);

      if (deptList.length && activeDeptId === "ALL") {
        setActiveDeptId(deptList[0].id);
      }
    } catch (error) {
      toast("Không thể tải dữ liệu quy trình", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflows = async (departmentId) => {
    if (!departmentId) return;

    try {
      const data = await bulletinService.getWorkflows(departmentId);
      const firstConfig = parseConfigJson(
        Array.isArray(data) && data.length ? data[0]?.config_json : null
      );
      const list = Array.isArray(data) && data.length
        ? data.map((item, idx) => normalizeWorkflowStep(item, idx))
        : DEFAULT_WORKFLOW_STEPS.map((item, idx) => normalizeWorkflowStep(item, idx));
      setWorkflowConfig(list);
      setRejectPolicy(
        firstConfig.reject_policy
        || (list.some((step) => step.on_reject_action === "RETURN_TO_PREV_STEP")
          ? "RETURN_TO_PREV_STEP"
          : "RETURN_TO_DRAFT")
      );
      setWarningAmber(firstConfig.warning_amber || "70_PERCENT");
      setWarningRed(firstConfig.warning_red || "OVERDUE");
    } catch (error) {
      console.error(error);
      setWorkflowConfig(DEFAULT_WORKFLOW_STEPS);
      setRejectPolicy("RETURN_TO_DRAFT");
      setWarningAmber("70_PERCENT");
      setWarningRed("OVERDUE");
    }
  };

  const visibleBulletins = useMemo(() => {
    if (activeDeptId === "ALL") return bulletins;
    return bulletins.filter((item) => item.department_id === activeDeptId);
  }, [activeDeptId, bulletins]);

  const bulletinsByStatus = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach((col) => {
      map[col.key] = visibleBulletins.filter((item) => item.status === col.key);
    });
    return map;
  }, [visibleBulletins]);

  const currentStepTitle = (status) => {
    switch (status) {
      case "DRAFT":
        return "Chưa gửi duyệt";
      case "PENDING":
        return "Đang chờ phê duyệt";
      case "APPROVED":
        return "Đã duyệt - chờ đăng";
      case "PUBLISHED":
        return "Đã đăng tải";
      case "REJECTED":
        return "Bị từ chối";
      default:
        return "";
    }
  };

  const pendingStep = workflowConfig.find((s) => s.step_order === 2) || workflowConfig[1];

  const isOverSla = (bulletin) => {
    if (!pendingStep?.sla_hours || bulletin.status !== "PENDING") return false;
    const created = bulletin.createdAt ? new Date(bulletin.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    const diffHours = (Date.now() - created.getTime()) / 1000 / 3600;
    return diffHours > pendingStep.sla_hours;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const performAction = async (type, bulletin) => {
    try {
      if (type === "submit") {
        await bulletinService.submitBulletin(bulletin.id);
        toast("Đã gửi duyệt", "success");
      }
      if (type === "approve") {
        await bulletinService.approveBulletin(bulletin.id);
        toast("Đã duyệt bản tin", "success");
      }
      if (type === "reject") {
        await bulletinService.rejectBulletin(bulletin.id, "Từ chối từ màn Workflow");
        toast("Đã từ chối bản tin", "warning");
      }
      if (type === "publish") {
        await bulletinService.publishBulletin(bulletin.id);
        toast("Đã đăng tải bản tin", "success");
      }
      await fetchInitialData();
    } catch (error) {
      toast("Thao tác thất bại", "error");
      console.error(error);
    }
  };

  const updateStep = (index, field, value) => {
    setWorkflowConfig((prev) =>
      prev.map((step, idx) => (idx === index ? { ...step, [field]: value } : step))
    );
  };

  const saveWorkflowConfig = async () => {
    if (!activeDepartment?.id) {
      toast("Vui lòng chọn phòng ban", "warning");
      return;
    }

    try {
      setIsSavingConfig(true);
      const rejectAction =
        rejectPolicy === "RETURN_TO_PREV_STEP" ? "RETURN_TO_PREV_STEP" : "RETURN_TO_DRAFT";
      const payload = workflowConfig.map((step, index) => ({
        ...step,
        step_order: index + 1,
        on_reject_action: rejectAction,
        config_json: JSON.stringify({
          publish_channel: step.publish_channel,
          notify_scope: step.notify_scope,
          on_reject_action: rejectAction,
          reject_policy: rejectPolicy,
          warning_amber: warningAmber,
          warning_red: warningRed,
        }),
      }));
      await bulletinService.updateWorkflow(activeDepartment.id, payload);
      toast("Đã lưu cấu hình quy trình", "success");
      setOpenConfig(false);
      await fetchWorkflows(activeDepartment.id);
    } catch (error) {
      toast("Không thể lưu cấu hình", "error");
      console.error(error);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f3f6fb", minHeight: "100vh", fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", mb: 0.5 }}>
            Quy trình Phê duyệt & Đăng tải
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, lineHeight: 1.6 }}>
            Theo dõi luồng phê duyệt bản tin theo từng phòng ban - kéo thả hoặc dùng nút thao tác để chuyển trạng thái
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Settings />} onClick={() => setOpenConfig(true)}>
          Cấu hình quy trình
        </Button>
      </Stack>

      <Card sx={{ p: 1.2, borderRadius: 2, mb: 2, border: "1px solid #dbe3ef" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant={activeDeptId === "ALL" ? "contained" : "text"}
            onClick={() => setActiveDeptId("ALL")}
          >
            Tất cả
          </Button>
          {departments.map((dept) => (
            <Button
              key={dept.id}
              size="small"
              startIcon={<Circle sx={{ fontSize: 10, color: dept.color || "primary.main" }} />}
              variant={activeDeptId === dept.id ? "contained" : "text"}
              onClick={() => setActiveDeptId(dept.id)}
            >
              {dept.name}
            </Button>
          ))}
        </Stack>
      </Card>

      <Card sx={{ p: 2, borderRadius: 2, mb: 2, border: "1px solid #dbe3ef" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          {STATUS_COLUMNS.map((step, idx) => (
            <Stack key={step.key} direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 30, height: 30, bgcolor: `${step.color}22`, color: step.color, fontWeight: 700 }}>
                {idx + 1}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{step.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.key === "DRAFT" && "Tác viên soạn bản tin"}
                  {step.key === "PENDING" && "Gửi lên phê duyệt"}
                  {step.key === "APPROVED" && "Sẵn sàng đăng tải"}
                  {step.key === "PUBLISHED" && "Hiển thị trên hệ thống"}
                  {step.key === "REJECTED" && "Yêu cầu chỉnh sửa lại"}
                </Typography>
              </Box>
              {idx < STATUS_COLUMNS.length - 1 && <ArrowForward sx={{ color: "#94a3b8" }} />}
            </Stack>
          ))}
        </Stack>
      </Card>

      <Grid container spacing={2} sx={{ alignItems: "stretch", flex: 1, mb: 2 }}>
        {STATUS_COLUMNS.map((col) => (
          <Grid item xs={12} md={2.4} key={col.key}>
            <Card sx={{ p: 1.5, borderRadius: 2, border: "1px solid #dbe3ef", height: "100%", display: "flex", flexDirection: "column", minHeight: 520 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 4, height: 24, borderRadius: 3, bgcolor: col.color }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>{col.label}</Typography>
                </Stack>
                <Chip label={bulletinsByStatus[col.key]?.length || 0} size="small" />
              </Stack>

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Stack
                  spacing={1.2}
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 0.5,
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: 4 },
                  }}
                >
                  {(bulletinsByStatus[col.key] || []).slice((pageByStatus[col.key] - 1) * PAGE_SIZE, pageByStatus[col.key] * PAGE_SIZE).map((item) => (
                    <Card key={item.id} sx={{ p: 1.2, border: "1px solid #dbe3ef", borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>{item.title}</Typography>
                        <IconButton size="small"><MoreHoriz fontSize="small" /></IconButton>
                      </Stack>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3, mb: 0.8 }}>
                        {item.id?.slice(0, 10)} • {currentStepTitle(item.status)}
                      </Typography>

                      <Chip size="small" label={item.department?.name || "--"} sx={{ mb: 1, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }} />

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>{(item.author?.name || "U")[0]}</Avatar>
                        <Typography variant="body2" sx={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.author?.name || "--"}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatDate(item.createdAt)}</Typography>
                      </Stack>

                    {col.key === "PENDING" && (
                      <Chip
                        size="small"
                        icon={<Schedule fontSize="small" />}
                        color={isOverSla(item) ? "error" : "warning"}
                        label={isOverSla(item) ? "Quá hạn SLA" : "Trong hạn SLA"}
                        sx={{ mb: 1 }}
                      />
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Stack direction="row" spacing={1}>
                      {col.key === "DRAFT" && (
                        <Button fullWidth size="small" variant="outlined" onClick={() => performAction("submit", item)}>
                          Gửi duyệt
                        </Button>
                      )}
                      {col.key === "PENDING" && (
                        <>
                          <Button fullWidth size="small" variant="contained" color="success" startIcon={<Done />} onClick={() => performAction("approve", item)}>
                            Duyệt
                          </Button>
                          <Button fullWidth size="small" variant="outlined" color="error" startIcon={<Close />} onClick={() => performAction("reject", item)}>
                            Từ chối
                          </Button>
                        </>
                      )}
                      {col.key === "APPROVED" && (
                        <Button fullWidth size="small" variant="contained" startIcon={<PublishedWithChanges />} onClick={() => performAction("publish", item)}>
                          Đăng tải
                        </Button>
                      )}
                      {(col.key === "PUBLISHED" || col.key === "REJECTED") && (
                        <Button fullWidth size="small" variant="text" startIcon={col.key === "PUBLISHED" ? <RuleFolder /> : <Block />}>
                          {col.key === "PUBLISHED" ? "Đã hoàn tất" : "Cần chỉnh sửa"}
                        </Button>
                      )}
                    </Stack>
                  </Card>
                ))}

                  {!isLoading && !(bulletinsByStatus[col.key] || []).length && (
                    <Box sx={{ py: 6, textAlign: "center", color: "text.disabled", flex: 1 }}>
                      <PendingActions sx={{ fontSize: 32, mb: 0.6 }} />
                      <Typography variant="caption">Không có bản tin</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {Math.ceil((bulletinsByStatus[col.key] || []).length / PAGE_SIZE) > 1 && (
                <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <Pagination
                    count={Math.ceil((bulletinsByStatus[col.key] || []).length / PAGE_SIZE)}
                    page={pageByStatus[col.key] || 1}
                    onChange={(_, val) => handlePageChange(col.key, val)}
                    color="primary"
                    size="small"
                    siblingCount={0}
                  />
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Cấu hình quy trình Phê duyệt
          <IconButton size="small" onClick={() => setOpenConfig(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.2}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155" }}>
                ÁP DỤNG CHO PHÒNG BAN *
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.8 }} flexWrap="wrap" useFlexGap>
                {departments.map((dept) => (
                  <Chip
                    key={dept.id}
                    clickable
                    icon={<Circle sx={{ fontSize: 9, color: dept.color || "#2563eb !important" }} />}
                    label={dept.name}
                    color={activeDeptId === dept.id ? "primary" : "default"}
                    variant={activeDeptId === dept.id ? "filled" : "outlined"}
                    onClick={() => setActiveDeptId(dept.id)}
                    sx={{ borderRadius: 5, fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155" }}>
                CÁC BƯỚC TRONG QUY TRÌNH
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.3, color: "#94a3b8" }}>
                Cấu hình từng bước phê duyệt, người duyệt và thời hạn xử lý (SLA)
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 1.1 }}>
                {workflowConfig.map((step, index) => (
                  <Card
                    key={`${step.step_order}-${index}`}
                    sx={{
                      p: 1.5,
                      pl: 2.1,
                      border: "1px solid #dbe3ef",
                      borderRadius: 2,
                      position: "relative",
                      overflow: "visible",
                    }}
                  >
                    <Avatar
                      sx={{
                        position: "absolute",
                        left: -15,
                        top: 14,
                        width: 28,
                        height: 28,
                        fontSize: 13,
                        fontWeight: 700,
                        bgcolor: index === 0 ? "#94a3b8" : index === 1 ? "#d97706" : index === 2 ? "#2563eb" : "#16a34a",
                      }}
                    >
                      {index + 1}
                    </Avatar>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700}>{step.step_name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {index === 0 && <Chip size="small" label="Bước mặc định" variant="outlined" />}
                        {index === workflowConfig.length - 1 && <Chip size="small" label="Bước cuối" variant="outlined" />}
                        {index !== 0 && index !== workflowConfig.length - 1 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" color="text.secondary">Bắt buộc</Typography>
                            <Switch
                              size="small"
                              checked={step.is_required}
                              onChange={(e) => updateStep(index, "is_required", e.target.checked)}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Stack>

                    <Grid container spacing={1.2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tên bước"
                          value={step.step_name}
                          onChange={(e) => updateStep(index, "step_name", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Thời hạn xử lý (SLA)</InputLabel>
                          <Select
                            value={step.sla_hours ?? "NO_LIMIT"}
                            label="Thời hạn xử lý (SLA)"
                            onChange={(e) => updateStep(index, "sla_hours", e.target.value === "NO_LIMIT" ? null : Number(e.target.value))}
                          >
                            <MenuItem value="NO_LIMIT">Không giới hạn</MenuItem>
                            <MenuItem value={24}>1 ngày</MenuItem>
                            <MenuItem value={72}>3 ngày</MenuItem>
                            <MenuItem value={168}>7 ngày</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {index === 1 && (
                        <>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Kiểu duyệt</InputLabel>
                              <Select
                                value={step.approver_type}
                                label="Kiểu duyệt"
                                onChange={(e) => updateStep(index, "approver_type", e.target.value)}
                              >
                                <MenuItem value="BY_ROLE">Theo vai trò</MenuItem>
                                <MenuItem value="BY_USER">Theo người dùng</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Người phê duyệt</InputLabel>
                              <Select
                                value={step.approver_id}
                                label="Người phê duyệt"
                                onChange={(e) => updateStep(index, "approver_id", e.target.value)}
                              >
                                <MenuItem value="">-- Chọn --</MenuItem>
                                {(step.approver_type === "BY_ROLE" ? roles : users).map((item) => (
                                  <MenuItem key={item.id} value={item.id}>
                                    {item.name || item.code || item.username}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Yêu cầu số lượng duyệt tối thiểu</InputLabel>
                              <Select
                                value={step.min_approvals}
                                label="Yêu cầu số lượng duyệt tối thiểu"
                                onChange={(e) => updateStep(index, "min_approvals", Number(e.target.value || 1))}
                              >
                                <MenuItem value={1}>Bất kỳ 1 trong danh sách</MenuItem>
                                <MenuItem value={2}>Ít nhất 2 người duyệt</MenuItem>
                                <MenuItem value={3}>Ít nhất 3 người duyệt</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </>
                      )}

                      {index === workflowConfig.length - 1 && (
                        <>
                          <Grid item xs={12}>
                            <Card variant="outlined" sx={{ p: 1.2, borderRadius: 2, borderColor: "#86efac", bgcolor: "#f0fdf4" }}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.1} alignItems="center">
                                  <Avatar sx={{ width: 28, height: 28, bgcolor: "#dcfce7", color: "#16a34a" }}>
                                    <Bolt fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography fontWeight={700} color="#16a34a">Tự động đăng tải sau khi duyệt</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Bản tin sẽ tự động publish ngay khi bước phê duyệt cuối hoàn tất
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Switch
                                  size="small"
                                  checked={step.can_auto_publish}
                                  onChange={(e) => updateStep(index, "can_auto_publish", e.target.checked)}
                                />
                              </Stack>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Kênh đăng tải</InputLabel>
                              <Select
                                value={step.publish_channel}
                                label="Kênh đăng tải"
                                onChange={(e) => updateStep(index, "publish_channel", e.target.value)}
                              >
                                <MenuItem value="INTERNAL">Cổng nội bộ</MenuItem>
                                <MenuItem value="WEBSITE">Website</MenuItem>
                                <MenuItem value="BOTH">Cả hai</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Thông báo sau khi đăng</InputLabel>
                              <Select
                                value={step.notify_scope}
                                label="Thông báo sau khi đăng"
                                onChange={(e) => updateStep(index, "notify_scope", e.target.value)}
                              >
                                <MenuItem value="DEPARTMENT">Gửi cho phòng ban hiện tại</MenuItem>
                                <MenuItem value="ALL_DEPARTMENTS">Gửi cho toàn bộ phòng ban</MenuItem>
                                <MenuItem value="NONE">Không gửi</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Card variant="outlined" sx={{ p: 1.5, borderColor: "#fecaca", bgcolor: "#fff5f5" }}>
              <Typography sx={{ color: "#dc2626", fontWeight: 700, mb: 1 }}>Khi bản tin bị từ chối</Typography>
              <RadioGroup value={rejectPolicy} onChange={(e) => setRejectPolicy(e.target.value)}>
                <FormControlLabel
                  value="RETURN_TO_DRAFT"
                  control={<Radio size="small" />}
                  label="Quay về bước Nháp - Tác viên chỉnh sửa và gửi lại"
                />
                <FormControlLabel
                  value="RETURN_TO_PREV_STEP"
                  control={<Radio size="small" />}
                  label="Quay về bước trước đó - Giữ nguyên tiến trình"
                />
                <FormControlLabel
                  value="REQUIRE_REASON"
                  control={<Radio size="small" />}
                  label="Yêu cầu nhập lý do từ chối bắt buộc"
                />
              </RadioGroup>
            </Card>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 0.8 }}>
                CẢNH BÁO QUÁ HẠN
              </Typography>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cảnh báo vàng khi</InputLabel>
                    <Select value={warningAmber} label="Cảnh báo vàng khi" onChange={(e) => setWarningAmber(e.target.value)}>
                      <MenuItem value="50_PERCENT">Đạt 50% thời hạn</MenuItem>
                      <MenuItem value="70_PERCENT">Đạt 70% thời hạn</MenuItem>
                      <MenuItem value="90_PERCENT">Đạt 90% thời hạn</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cảnh báo đỏ khi</InputLabel>
                    <Select value={warningRed} label="Cảnh báo đỏ khi" onChange={(e) => setWarningRed(e.target.value)}>
                      <MenuItem value="AT_DEADLINE">Đến hạn</MenuItem>
                      <MenuItem value="OVERDUE">Quá hạn</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ display: "block", mt: 0.8, color: "text.secondary" }}>
                Hệ thống sẽ gửi email nhắc nhở cho người phê duyệt khi bản tin đạt ngưỡng cảnh báo
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setOpenConfig(false)} color="inherit">Hủy</Button>
          <Button variant="contained" startIcon={<SaveOutlined />} onClick={saveWorkflowConfig} disabled={isSavingConfig}>
            Lưu cấu hình
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalWorkflow;
