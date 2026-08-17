import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline,
  ArrowBack,
  AssignmentTurnedIn,
  Business,
  DeleteOutline,
  Event,
  SaveOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createEvent,
  getDepartments,
  getEventDetail,
  updateEvent,
} from "@services/eventManagementService";

const ROLE_OPTIONS = [
  { value: "LEAD", label: "Chủ trì" },
  { value: "COORD", label: "Phối hợp" },
  { value: "SUPPORT", label: "Hỗ trợ" },
];

const ALL_DEPARTMENTS_KEY = "__ALL_DEPARTMENTS__";
const DEPARTMENT_PAGE_SIZE = 12;

const createEmptyTask = (index = 1) => ({
  id: `task-${Date.now()}-${index}`,
  title: "",
  departmentId: ALL_DEPARTMENTS_KEY,
  dueDate: "",
});

const toLocalDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoFromDate = (dateValue, hour = 8, minute = 0) => {
  if (!dateValue) return undefined;
  const local = new Date(
    `${dateValue}T${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}:00`
  );
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const eventId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [departmentTotalPages, setDepartmentTotalPages] = useState(1);

  const [mainCoordinator, setMainCoordinator] = useState("");
  const [secretary, setSecretary] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    processName: "",
    prepDate: "",
    eventDate: "",
    endDate: "",
    location: "",
    locationDetail: "",
    description: "",
    maxTotalGuests: "",
    confirmationDeadline: "",
    guestRegDeadline: "",
    allowGuestReg: true,
  });

  const [tasks, setTasks] = useState([createEmptyTask(1)]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await getDepartments({
          page: Math.max(departmentPage - 1, 0),
          size: DEPARTMENT_PAGE_SIZE,
        });
        setDepartments(Array.isArray(res?.data) ? res.data : []);
        setDepartmentTotalPages(Number(res?.pagination?.totalPages || 1));
      } catch (e) {
        setDepartments([]);
        setDepartmentTotalPages(1);
      }
    };
    loadDepartments();
  }, [departmentPage]);

  useEffect(() => {
    if (departmentPage > departmentTotalPages) {
      setDepartmentPage(Math.max(departmentTotalPages, 1));
    }
  }, [departmentPage, departmentTotalPages]);

  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        setLoading(true);
        const res = await getEventDetail(eventId);
        const event = res?.data;
        if (!event) return;

        const eventDate = toLocalDateInput(event.startDatetime);
        const loadedTasks = (event.programs || [])
          .slice()
          .sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0))
          .map((item, idx) => ({
            id: `task-edit-${idx + 1}`,
            title: item.title || "",
            departmentId: ALL_DEPARTMENTS_KEY,
            dueDate: toLocalDateInput(item.startTime),
          }));

        setFormData({
          name: event.name || "",
          processName: `QTPH-${event.code || "SK"}`,
          prepDate: toLocalDateInput(event.startDatetime),
          eventDate,
          endDate: toLocalDateInput(event.endDatetime),
          location: event.location || "",
          locationDetail: event.locationDetail || "",
          description: event.description || "",
          maxTotalGuests: event.maxTotalGuests ?? "",
          confirmationDeadline: toLocalDateInput(event.confirmationDeadline),
          guestRegDeadline: toLocalDateInput(event.guestRegDeadline),
          allowGuestReg: event.allowGuestReg ?? true,
        });

        setTasks(loadedTasks.length ? loadedTasks : [createEmptyTask(1)]);
      } catch (e) {
        setError("Không tải được dữ liệu sự kiện để chỉnh sửa.");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (formData.name && !formData.processName) {
      setFormData((prev) => ({
        ...prev,
        processName: `QTPH-${prev.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toUpperCase()}`,
      }));
    }
  }, [formData.name, formData.processName]);

  const departmentMap = useMemo(() => {
    const map = new Map();
    departments.forEach((d) => map.set(String(d.id), d));
    return map;
  }, [departments]);

  const selectedDepartmentItems = useMemo(
    () =>
      selectedDepartments
        .map((item) => ({
          ...item,
          department: departmentMap.get(String(item.departmentId)),
        }))
        .filter((item) => item.department),
    [departmentMap, selectedDepartments]
  );

  const progressPercent = useMemo(() => {
    const step1Done = Boolean(
      formData.name && formData.eventDate && formData.location
    );
    const step2Done = selectedDepartmentItems.length > 0;
    const step3Done = tasks.some((t) => t.title && t.dueDate);
    const done = [step1Done, step2Done, step3Done].filter(Boolean).length;
    return Math.round((done / 3) * 100);
  }, [formData, selectedDepartmentItems.length, tasks]);

  const handleChangeField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDepartment = (departmentId) => {
    const existing = selectedDepartments.find(
      (item) => String(item.departmentId) === String(departmentId)
    );

    if (existing) {
      setSelectedDepartments((prev) =>
        prev.filter(
          (item) => String(item.departmentId) !== String(departmentId)
        )
      );
      return;
    }

    const defaultRole = selectedDepartments.some((item) => item.role === "LEAD")
      ? "COORD"
      : "LEAD";

    setSelectedDepartments((prev) => [
      ...prev,
      {
        departmentId: String(departmentId),
        role: defaultRole,
      },
    ]);
  };

  const updateDepartmentRole = (departmentId, role) => {
    setSelectedDepartments((prev) =>
      prev.map((item) =>
        String(item.departmentId) === String(departmentId)
          ? { ...item, role }
          : item
      )
    );
  };

  const updateTask = (taskId, key, value) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, [key]: value } : task
      )
    );
  };

  const addTask = () => {
    setTasks((prev) => [...prev, createEmptyTask(prev.length + 1)]);
  };

  const removeTask = (taskId) => {
    setTasks((prev) =>
      prev.length === 1 ? prev : prev.filter((task) => task.id !== taskId)
    );
  };

  const buildProgramsFromTasks = () => {
    return tasks
      .filter((task) => task.title && task.dueDate)
      .map((task, idx) => {
        const departmentName =
          task.departmentId === ALL_DEPARTMENTS_KEY
            ? "Tất cả ban"
            : departmentMap.get(String(task.departmentId))?.name ||
              "Chưa xác định";

        return {
          orderNo: idx + 1,
          title: task.title.trim(),
          description: `Ban phụ trách: ${departmentName}`,
          startTime: toIsoFromDate(task.dueDate, 8, 0),
          endTime: toIsoFromDate(task.dueDate, 17, 0),
          presenter: departmentName,
        };
      });
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên sự kiện.");
      return;
    }
    if (!formData.eventDate) {
      setError("Vui lòng chọn ngày diễn ra sự kiện.");
      return;
    }
    if (!formData.location.trim()) {
      setError("Vui lòng nhập địa điểm tổ chức.");
      return;
    }
    if (selectedDepartmentItems.length === 0) {
      setError("Vui lòng chọn ít nhất một ban/phòng tham gia.");
      return;
    }

    const programs = buildProgramsFromTasks();
    if (!programs.length) {
      setError("Vui lòng thêm ít nhất một bước công việc có thời hạn.");
      return;
    }

    const roleText = selectedDepartmentItems
      .map((item) => {
        const role =
          ROLE_OPTIONS.find((r) => r.value === item.role)?.label || "Phối hợp";
        return `- ${item.department.name}: ${role}`;
      })
      .join("\n");

    const workflowNote = [
      "",
      "[Quy trình phối hợp]",
      `Tên quy trình: ${formData.processName || "Không đặt tên"}`,
      mainCoordinator ? `Trưởng ban tổ chức: ${mainCoordinator}` : "",
      secretary ? `Thư ký quy trình: ${secretary}` : "",
      "Phân công ban/phòng:",
      roleText,
    ]
      .filter(Boolean)
      .join("\n");

    const startDate = formData.prepDate || formData.eventDate;
    const endDate = formData.endDate || formData.eventDate;

    const payload = {
      name: formData.name.trim(),
      description: `${formData.description || ""}${workflowNote}`.trim(),
      startDatetime: toIsoFromDate(startDate, 8, 0),
      endDatetime: toIsoFromDate(endDate, 17, 0),
      location: formData.location.trim(),
      locationDetail: formData.locationDetail?.trim() || undefined,
      maxTotalGuests:
        formData.maxTotalGuests === ""
          ? undefined
          : Number(formData.maxTotalGuests),
      confirmationDeadline: toIsoFromDate(formData.confirmationDeadline, 17, 0),
      guestRegDeadline: toIsoFromDate(formData.guestRegDeadline, 17, 0),
      allowGuestReg: !!formData.allowGuestReg,
      programs,
    };

    try {
      setLoading(true);
      if (eventId) {
        await updateEvent(eventId, payload);
        setSuccess("Cập nhật sự kiện thành công.");
      } else {
        await createEvent(payload);
        setSuccess("Tạo sự kiện thành công.");
      }
      setTimeout(() => navigate("/event-management/events"), 500);
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        "Lưu sự kiện thất bại. Vui lòng kiểm tra dữ liệu và thử lại.";
      setError(typeof message === "string" ? message : "Lưu sự kiện thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#EFF3F8", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography color="text.secondary">
          Quản lý Sự kiện {`>`}{" "}
          {eventId ? "Chỉnh sửa Sự kiện" : "Tạo Quy trình Phối hợp"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveOutlined />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {eventId ? "Lưu cập nhật" : "Lưu & Tạo quy trình"}
          </Button>
        </Stack>
      </Stack>

      <Typography variant="h4" fontWeight={800} color="#0F2B5B">
        {eventId
          ? "Chỉnh sửa Sự kiện"
          : "Tạo Quy trình Phối hợp Tổ chức Sự kiện"}
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Thiết lập thông tin, phân công ban/phòng và lịch trình triển khai
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3} lg={2.6}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: "hidden" }}
          >
            <Box sx={{ p: 2, bgcolor: "#0F2B5B", color: "#fff" }}>
              <Typography fontWeight={700}>Các bước thiết lập</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Hoàn thành lần lượt 3 bước
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ p: 2 }}>
              <StepItem
                index={1}
                title="Thông tin sự kiện"
                subtitle="Chọn sự kiện & mô tả"
                done={Boolean(
                  formData.name && formData.eventDate && formData.location
                )}
              />
              <StepItem
                index={2}
                title="Phân công ban/phòng"
                subtitle="Gán vai trò & trách nhiệm"
                done={selectedDepartmentItems.length > 0}
              />
              <StepItem
                index={3}
                title="Lịch trình & tiến độ"
                subtitle="Các bước và thời hạn"
                done={tasks.some((t) => t.title && t.dueDate)}
              />
            </Stack>

            <Box sx={{ p: 2, pt: 0 }}>
              <Typography variant="body2" color="text.secondary" mb={0.8}>
                Tiến trình hoàn thành
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ height: 8, borderRadius: 999 }}
              />
              <Typography
                variant="body2"
                mt={1}
                fontWeight={700}
                color="success.main"
              >
                {progressPercent}% hoàn tất
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9} lg={9.4}>
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Event color="primary" />
                  <Typography variant="h6" fontWeight={800}>
                    Bước 1 · Thông tin Sự kiện
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tên sự kiện *"
                      value={formData.name}
                      onChange={(e) =>
                        handleChangeField("name", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tên quy trình *"
                      value={formData.processName}
                      onChange={(e) =>
                        handleChangeField("processName", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày bắt đầu chuẩn bị"
                      value={formData.prepDate}
                      onChange={(e) =>
                        handleChangeField("prepDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày diễn ra sự kiện *"
                      value={formData.eventDate}
                      onChange={(e) =>
                        handleChangeField("eventDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày kết thúc"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleChangeField("endDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Địa điểm *"
                      value={formData.location}
                      onChange={(e) =>
                        handleChangeField("location", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Chi tiết địa điểm"
                      value={formData.locationDetail}
                      onChange={(e) =>
                        handleChangeField("locationDetail", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Mô tả / Mục tiêu quy trình"
                      value={formData.description}
                      onChange={(e) =>
                        handleChangeField("description", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số khách tối đa"
                      value={formData.maxTotalGuests}
                      onChange={(e) =>
                        handleChangeField("maxTotalGuests", e.target.value)
                      }
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Hạn xác nhận tham dự"
                      value={formData.confirmationDeadline}
                      onChange={(e) =>
                        handleChangeField(
                          "confirmationDeadline",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Hạn đăng ký khách mời"
                      value={formData.guestRegDeadline}
                      onChange={(e) =>
                        handleChangeField("guestRegDeadline", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={!!formData.allowGuestReg}
                        onChange={(e) =>
                          handleChangeField("allowGuestReg", e.target.checked)
                        }
                      />
                      <Typography>
                        Cho phép đăng ký khách mời ngoài đơn vị
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Business color="primary" />
                  <Typography variant="h6" fontWeight={800}>
                    Bước 2 · Phân công Ban/Phòng tham gia
                  </Typography>
                </Stack>

                <Typography color="text.secondary" mb={2}>
                  Chọn các ban/phòng tham gia và gán vai trò phù hợp.
                </Typography>

                <Grid container spacing={1.5}>
                  {departments.map((department) => {
                    const selected = selectedDepartments.some(
                      (item) =>
                        String(item.departmentId) === String(department.id)
                    );
                    const selectedItem = selectedDepartments.find(
                      (item) =>
                        String(item.departmentId) === String(department.id)
                    );

                    return (
                      <Grid key={department.id} item xs={12} md={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            borderColor: selected ? "success.main" : "divider",
                            bgcolor: selected ? "#EEF9F5" : "#fff",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Checkbox
                                checked={selected}
                                onChange={() => toggleDepartment(department.id)}
                              />
                              <Box>
                                <Typography fontWeight={700}>
                                  {department.name || department.code}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {department.code || "Không mã"}
                                  {" · "}
                                  {department.memberCount || 0} thành viên
                                </Typography>
                              </Box>
                            </Stack>
                          </Stack>

                          {selected ? (
                            <FormControl size="small" fullWidth>
                              <InputLabel>Vai trò</InputLabel>
                              <Select
                                label="Vai trò"
                                value={selectedItem?.role || "COORD"}
                                onChange={(e) =>
                                  updateDepartmentRole(
                                    department.id,
                                    e.target.value
                                  )
                                }
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : null}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1.5}
                  mb={0.5}
                >
                  <Typography variant="body2" color="text.secondary">
                    Trang {departmentPage} / {Math.max(departmentTotalPages, 1)}
                  </Typography>
                  <Pagination
                    size="small"
                    color="primary"
                    page={departmentPage}
                    count={Math.max(departmentTotalPages, 1)}
                    onChange={(_, value) => setDepartmentPage(value)}
                  />
                </Stack>

                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Trưởng ban tổ chức"
                      value={mainCoordinator}
                      onChange={(e) => setMainCoordinator(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Thư ký quy trình"
                      value={secretary}
                      onChange={(e) => setSecretary(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <AssignmentTurnedIn color="primary" />
                  <Typography variant="h6" fontWeight={800}>
                    Bước 3 · Lịch trình các bước thực hiện
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {tasks.map((task, idx) => (
                    <Paper
                      key={task.id}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 1.5 }}
                    >
                      <Grid container spacing={1.2} alignItems="center">
                        <Grid item xs={12} md={1}>
                          <Chip color="primary" label={idx + 1} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tên bước công việc"
                            value={task.title}
                            onChange={(e) =>
                              updateTask(task.id, "title", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Ban phụ trách</InputLabel>
                            <Select
                              label="Ban phụ trách"
                              value={task.departmentId}
                              onChange={(e) =>
                                updateTask(
                                  task.id,
                                  "departmentId",
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value={ALL_DEPARTMENTS_KEY}>
                                Tất cả ban
                              </MenuItem>
                              {selectedDepartmentItems.map((item) => (
                                <MenuItem
                                  key={item.departmentId}
                                  value={String(item.departmentId)}
                                >
                                  {item.department.name || item.department.code}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={1.6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Thời hạn"
                            value={task.dueDate}
                            onChange={(e) =>
                              updateTask(task.id, "dueDate", e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={1.4}>
                          <IconButton
                            color="error"
                            onClick={() => removeTask(task.id)}
                            disabled={tasks.length === 1}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>

                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutline />}
                  sx={{ mt: 1.5 }}
                  onClick={addTask}
                >
                  Thêm bước công việc
                </Button>
              </CardContent>
            </Card>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const StepItem = ({ index, title, subtitle, done }) => (
  <Stack direction="row" spacing={1.2} alignItems="center">
    <Chip
      label={done ? "✓" : index}
      color={done ? "success" : "default"}
      sx={{ width: 30, height: 30, fontWeight: 700 }}
    />
    <Box>
      <Typography fontWeight={700}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  </Stack>
);

export default CreateEvent;
