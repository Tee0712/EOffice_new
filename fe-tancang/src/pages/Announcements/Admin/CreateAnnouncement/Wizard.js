import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  CloudUpload,
  Groups,
  HomeWork,
  Person,
  Public,
  RemoveRedEye,
  Save,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import announcementService from "@services/announcementService";
import { useToast } from "@components/common/ToastProvider";
import TiptapEditor from "../../components/TiptapEditor";

const STEPS = ["Nội dung", "Đối tượng", "Lịch gửi", "Cài đặt & Xem lại"];

const CATEGORY_OPTIONS = [
  "Chung",
  "Hành chính",
  "Kỹ thuật",
  "Nhân sự",
  "Tài chính",
  "Đào tạo",
  "An toàn lao động",
  "Sự kiện",
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "normal", label: "Bình thường" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

const TARGET_OPTIONS = [
  { value: "ALL", label: "Toàn công ty", icon: <Public color="primary" /> },
  {
    value: "DEPT",
    label: "Theo phòng ban",
    icon: <HomeWork color="primary" />,
  },
  { value: "ROLE", label: "Theo vai trò", icon: <Groups color="primary" /> },
  {
    value: "INDIVIDUAL",
    label: "Theo cá nhân",
    icon: <Person color="primary" />,
  },
];

const getUnitId = (user) => {
  const parent = user?.parent;
  if (typeof parent === "string" || typeof parent === "number")
    return String(parent);
  if (parent && typeof parent === "object")
    return String(parent.id || parent._id || "");
  return String(user?.organizationUnitId || "");
};

const mapTargetPayload = (form) => {
  if (form.targetType === "ALL")
    return [{ targetType: "all", targetId: "all" }];
  if (form.targetType === "DEPT")
    return form.targetDepartments.map((id) => ({
      targetType: "department",
      targetId: String(id),
    }));
  if (form.targetType === "ROLE")
    return form.targetRoles.map((id) => ({
      targetType: "role",
      targetId: String(id),
    }));
  return form.targetUsers.map((id) => ({
    targetType: "user",
    targetId: String(id),
  }));
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toTimeInputValue = (value) => {
  if (!value) return "08:00";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "08:00";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const getTargetTypeFromApi = (targetType) => {
  const value = String(targetType || "").toLowerCase();
  if (value === "all") return "ALL";
  if (value === "department") return "DEPT";
  if (value === "role") return "ROLE";
  return "INDIVIDUAL";
};

const hasMeaningfulContent = (html) => {
  if (!html || typeof html !== "string") return false;
  const normalized = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return normalized.length > 0;
};

const Wizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [activeStep, setActiveStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTarget, setSearchTarget] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Chung",
    content: "",
    targetType: "ALL",
    targetDepartments: [],
    targetRoles: [],
    targetUsers: [],
    scheduleType: "NOW",
    sendDate: "",
    sendTime: "08:00",
    priority: "normal",
    requireConfirm: true,
    isPinned: false,
    allowComment: true,
    sendEmail: true,
  });

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [unitsRes, usersRes] = await Promise.all([
          announcementService.getOrganizationUnits({ page: 1, limit: 200 }),
          announcementService.getAllUsers(),
        ]);
        const units = unitsRes?.data || unitsRes?.items || [];
        setDepartmentOptions(Array.isArray(units) ? units : []);
        const users = usersRes?.data || usersRes?.items || [];
        setAllUsers(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error(error);
        toast("Không thể tải danh sách phòng ban/người dùng.", "error");
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const loadEditData = async () => {
      if (!editId) return;
      try {
        const response =
          await announcementService.getAdminAnnouncementById(editId);
        const detail = response?.data || response;
        const targets = Array.isArray(detail?.targets) ? detail.targets : [];
        const resolvedTargetType = targets.length
          ? getTargetTypeFromApi(targets[0]?.targetType)
          : "ALL";
        const scheduledAt = detail?.scheduledAt || detail?.send_at || null;

        setForm((prev) => ({
          ...prev,
          title: detail?.title || "",
          category: detail?.category || "Chung",
          content: detail?.content || "",
          targetType: resolvedTargetType,
          targetDepartments:
            resolvedTargetType === "DEPT"
              ? targets.map((x) => String(x?.targetId || "")).filter(Boolean)
              : [],
          targetRoles:
            resolvedTargetType === "ROLE"
              ? targets.map((x) => String(x?.targetId || "")).filter(Boolean)
              : [],
          targetUsers:
            resolvedTargetType === "INDIVIDUAL"
              ? targets.map((x) => String(x?.targetId || "")).filter(Boolean)
              : [],
          scheduleType: scheduledAt ? "LATER" : "NOW",
          sendDate: toDateInputValue(scheduledAt),
          sendTime: toTimeInputValue(scheduledAt),
          priority: detail?.priority || "normal",
          requireConfirm: Boolean(
            detail?.requireConfirm ??
            detail?.require_confirmation ??
            detail?.requireConfirmation
          ),
          isPinned: Boolean(
            detail?.isPinned ?? detail?.pin_top ?? detail?.is_pinned
          ),
          allowComment: Boolean(detail?.allowComment ?? detail?.allow_comment),
        }));
      } catch (error) {
        console.error(error);
        toast("Không thể tải dữ liệu thông báo để chỉnh sửa.", "error");
      }
    };

    loadEditData();
  }, [editId, toast]);

  const roleOptions = useMemo(() => {
    const map = new Map();
    allUsers.forEach((u) => {
      const key = String(u?.role || u?.position || "").trim();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([role, count]) => ({ role, count }));
  }, [allUsers]);

  const filteredDepartments = useMemo(() => {
    const keyword = searchTarget.trim().toLowerCase();
    if (!keyword) return departmentOptions;
    return departmentOptions.filter((d) =>
      String(d?.name || "")
        .toLowerCase()
        .includes(keyword)
    );
  }, [departmentOptions, searchTarget]);

  const filteredRoles = useMemo(() => {
    const keyword = searchTarget.trim().toLowerCase();
    if (!keyword) return roleOptions;
    return roleOptions.filter((r) => r.role.toLowerCase().includes(keyword));
  }, [roleOptions, searchTarget]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTarget.trim().toLowerCase();
    if (!keyword) return allUsers;
    return allUsers.filter((u) => {
      const name = String(u?.name || "").toLowerCase();
      const username = String(u?.username || "").toLowerCase();
      const email = String(u?.emailUser || "").toLowerCase();
      return (
        name.includes(keyword) ||
        username.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [allUsers, searchTarget]);

  const recipientCount = useMemo(() => {
    if (form.targetType === "ALL") return allUsers.length;
    if (form.targetType === "INDIVIDUAL") return form.targetUsers.length;

    if (form.targetType === "ROLE") {
      return form.targetRoles.reduce((sum, role) => {
        const item = roleOptions.find((x) => x.role === role);
        return sum + (item?.count || 0);
      }, 0);
    }

    return allUsers.filter((u) => form.targetDepartments.includes(getUnitId(u)))
      .length;
  }, [form, allUsers, roleOptions]);

  const validateStep = () => {
    if (activeStep === 0) {
      if (!form.title.trim()) return "Vui lòng nhập tiêu đề thông báo.";
      if (!hasMeaningfulContent(form.content))
        return "Vui lòng nhập nội dung thông báo.";
    }

    if (activeStep === 1) {
      if (form.targetType === "DEPT" && !form.targetDepartments.length)
        return "Vui lòng chọn ít nhất 1 phòng ban.";
      if (form.targetType === "ROLE" && !form.targetRoles.length)
        return "Vui lòng chọn ít nhất 1 vai trò.";
      if (form.targetType === "INDIVIDUAL" && !form.targetUsers.length)
        return "Vui lòng chọn ít nhất 1 người nhận.";
    }

    if (activeStep === 2 && form.scheduleType === "LATER") {
      if (!form.sendDate) return "Vui lòng chọn ngày giờ gửi.";
      const dateTime = new Date(`${form.sendDate}T${form.sendTime || "08:00"}:00`);
      if (Number.isNaN(dateTime.getTime())) return "Ngày giờ gửi không hợp lệ.";
      if (dateTime.getTime() <= Date.now()) {
        return "Ngày giờ gửi phải lớn hơn thời điểm hiện tại.";
      }
    }

    return "";
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) return toast(error, "warning");
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) return toast(error, "warning");

    try {
      setCreating(true);
      const payload = {
        title: form.title.trim(),
        content: form.content,
        category: form.category,
        priority: form.priority,
        requireConfirmation: form.requireConfirm,
        allowComment: form.allowComment,
        isPinned: form.isPinned,
        targets: mapTargetPayload(form),
        attachments: [],
        scheduledAt:
          form.scheduleType === "LATER" && form.sendDate
            ? new Date(`${form.sendDate}T${form.sendTime || "08:00"}:00`)
            : undefined,
      };

      if (isEditMode) {
        await announcementService.updateAnnouncement(editId, payload);
        toast("Cập nhật thông báo thành công.", "success");
      } else {
        await announcementService.createAnnouncement(payload);
        toast("Tạo thông báo thành công.", "success");
      }
      navigate("/admin/announcements");
    } catch (errorSubmit) {
      console.error(errorSubmit);
      toast(
        isEditMode
          ? "Không thể cập nhật thông báo. Vui lòng thử lại."
          : "Không thể tạo thông báo. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const renderTargetOptions = () => {
    if (form.targetType === "DEPT") {
      return (
        <Grid container spacing={1.5}>
          {filteredDepartments.map((dept) => {
            const id = String(dept?.id || dept?._id || "");
            return (
              <Grid item xs={12} md={4} key={id || dept?.name}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.targetDepartments.includes(id)}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          targetDepartments: e.target.checked
                            ? [...prev.targetDepartments, id]
                            : prev.targetDepartments.filter((x) => x !== id),
                        }));
                      }}
                    />
                  }
                  label={dept?.name || "Không rõ"}
                />
              </Grid>
            );
          })}
        </Grid>
      );
    }

    if (form.targetType === "ROLE") {
      return (
        <Grid container spacing={1.5}>
          {filteredRoles.map((item) => (
            <Grid item xs={12} md={4} key={item.role}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.targetRoles.includes(item.role)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        targetRoles: e.target.checked
                          ? [...prev.targetRoles, item.role]
                          : prev.targetRoles.filter((x) => x !== item.role),
                      }))
                    }
                  />
                }
                label={`${item.role} (${item.count})`}
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (form.targetType === "INDIVIDUAL") {
      return (
        <Grid container spacing={1.5}>
          {filteredUsers.slice(0, 80).map((user) => (
            <Grid item xs={12} md={6} key={user.id}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.targetUsers.includes(String(user.id))}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          targetUsers: e.target.checked
                            ? [...prev.targetUsers, String(user.id)]
                            : prev.targetUsers.filter(
                                (x) => String(x) !== String(user.id)
                              ),
                        }))
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {user?.name || user?.username || "Không rõ tên"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.emailUser || user?.username || "-"}
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Alert severity="info">
        Thông báo sẽ gửi đến toàn bộ CBCNV trong hệ thống.
      </Alert>
    );
  };

  const renderReview = () => {
    const targetLabel =
      form.targetType === "ALL"
        ? "Toàn công ty"
        : form.targetType === "DEPT"
          ? `Theo phòng ban (${form.targetDepartments.length})`
          : form.targetType === "ROLE"
            ? `Theo vai trò (${form.targetRoles.length})`
            : `Theo cá nhân (${form.targetUsers.length})`;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Tiêu đề
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {form.title || "(Chưa nhập)"}
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Nội dung
            </Typography>
            <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: form.content || "<p>(Chưa có nội dung)</p>",
                }}
              />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Danh mục
                </Typography>
                <Typography>{form.category}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Đối tượng
                </Typography>
                <Typography>{targetLabel}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ưu tiên
                </Typography>
                <Typography>
                  {PRIORITY_OPTIONS.find((x) => x.value === form.priority)
                    ?.label || "Bình thường"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Lịch gửi
                </Typography>
                <Typography>
                  {form.scheduleType === "NOW"
                    ? "Gửi ngay"
                    : `${form.sendDate} ${form.sendTime}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ước tính người nhận
                </Typography>
                <Typography>{recipientCount} người</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ bgcolor: "#f5f7f9", minHeight: "100vh", py: 2 }}>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => navigate("/admin/announcements")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" fontWeight={800} color="primary">
              {isEditMode ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Save />}
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={() =>
                toast("Đã lưu dữ liệu nhập tạm thời trên màn hình.", "info")
              }
            >
              Lưu nháp
            </Button>
            <Button
              startIcon={<RemoveRedEye />}
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={() => setPreviewOpen((prev) => !prev)}
            >
              {previewOpen ? "Ẩn xem trước" : "Xem trước"}
            </Button>
          </Stack>
        </Stack>

        <Paper
          sx={{
            p: 3,
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography fontWeight={700}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Tiêu đề thông báo *"
                  placeholder="Nhập tiêu đề thông báo..."
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {CATEGORY_OPTIONS.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TiptapEditor
                value={form.content}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, content: html }))
                }
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  textAlign: "center",
                  borderStyle: "dashed",
                  bgcolor: "#f8fafc",
                }}
              >
                <CloudUpload color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="body1" fontWeight={700}>
                  Kéo thả hoặc chọn tệp đính kèm
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, DOC, XLSX, PNG, JPG · tối đa 25 MB/tệp
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <input
                    id="announcement-attachments"
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setAttachments(Array.from(e.target.files || []))
                    }
                  />
                  <label htmlFor="announcement-attachments">
                    <Button
                      component="span"
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: "none" }}
                    >
                      Chọn tệp
                    </Button>
                  </label>
                </Box>
                {!!attachments.length && (
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    justifyContent="center"
                    sx={{ mt: 1.5 }}
                  >
                    {attachments.map((file) => (
                      <Chip key={file.name} label={file.name} size="small" />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Chọn đối tượng nhận
              </Typography>

              <Grid container spacing={2}>
                {TARGET_OPTIONS.map((option) => (
                  <Grid item xs={12} sm={6} md={3} key={option.value}>
                    <Card
                      variant="outlined"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          targetType: option.value,
                        }))
                      }
                      sx={{
                        p: 2,
                        textAlign: "center",
                        cursor: "pointer",
                        borderColor:
                          form.targetType === option.value
                            ? "primary.main"
                            : "divider",
                        bgcolor:
                          form.targetType === option.value
                            ? "primary.lighter"
                            : "transparent",
                      }}
                    >
                      <Box sx={{ mb: 1 }}>{option.icon}</Box>
                      <Typography fontWeight={700}>{option.label}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <TextField
                size="small"
                fullWidth
                placeholder="Tìm phòng ban / vai trò / người dùng..."
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
              />

              {renderTargetOptions()}

              <Alert severity="info">
                Ước tính tổng người nhận: <strong>{recipientCount}</strong>
              </Alert>
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Lịch gửi
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={
                    form.scheduleType === "NOW" ? "contained" : "outlined"
                  }
                  onClick={() =>
                    setForm((prev) => ({ ...prev, scheduleType: "NOW" }))
                  }
                  sx={{ textTransform: "none" }}
                >
                  Gửi ngay
                </Button>
                <Button
                  variant={
                    form.scheduleType === "LATER" ? "contained" : "outlined"
                  }
                  onClick={() =>
                    setForm((prev) => ({ ...prev, scheduleType: "LATER" }))
                  }
                  sx={{ textTransform: "none" }}
                >
                  Hẹn giờ gửi
                </Button>
              </Stack>

              {form.scheduleType === "LATER" && (
                <Stack direction="row" spacing={2}>
                  <TextField
                    type="date"
                    label="Ngày gửi"
                    InputLabelProps={{ shrink: true }}
                    value={form.sendDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sendDate: e.target.value }))
                    }
                  />
                  <TextField
                    type="time"
                    label="Giờ gửi"
                    InputLabelProps={{ shrink: true }}
                    value={form.sendTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sendTime: e.target.value }))
                    }
                  />
                </Stack>
              )}

              <FormControl sx={{ maxWidth: 220 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Mức độ ưu tiên
                </Typography>
                <Select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {activeStep === 3 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>
                Cài đặt bổ sung
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.requireConfirm}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            requireConfirm: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Yêu cầu xác nhận đã đọc"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.allowComment}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            allowComment: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Cho phép bình luận"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.sendEmail}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            sendEmail: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Gửi email đồng thời"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.isPinned}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            isPinned: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Ghim thông báo"
                  />
                </Grid>
              </Grid>

              {previewOpen && (
                <Alert severity="info">
                  Chế độ xem trước đang bật — bạn có thể rà lại nội dung trước
                  khi gửi.
                </Alert>
              )}

              {renderReview()}
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
              sx={{ textTransform: "none" }}
            >
              Quay lại
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                sx={{ textTransform: "none" }}
              >
                Tiếp theo
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={creating}
                onClick={handleSubmit}
                sx={{ textTransform: "none", minWidth: 140 }}
              >
                {creating ? "Đang xử lý..." : "Hoàn thành"}
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Wizard;
