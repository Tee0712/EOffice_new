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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  DeleteOutline,
  NotificationsActive,
  Save,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDepartments,
  getEventDetail,
} from "@services/eventManagementService";

const buildItem = (index = 1) => ({
  id: `item-${Date.now()}-${index}`,
  content: "",
  required: false,
  departmentId: "",
  dueDate: "",
});

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDaysLeft = (value) => {
  if (!value) return 0;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24)));
};

const CreateChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [checklistName, setChecklistName] = useState("");
  const [stepName, setStepName] = useState("Bước 1");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [exportPdf, setExportPdf] = useState(false);

  const [items, setItems] = useState([
    buildItem(1),
    buildItem(2),
    buildItem(3),
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const [eventRes, deptRes] = await Promise.all([
          getEventDetail(id),
          getDepartments({ page: 0, size: 100 }),
        ]);

        const event = eventRes?.data || null;
        const depts = Array.isArray(deptRes?.data) ? deptRes.data : [];

        setEventData(event);
        setDepartments(depts);

        const fallbackStep = event?.programs?.[0]?.title
          ? event.programs[0].title
          : "Bước 1";
        setStepName(fallbackStep);

        const eventName = event?.name ? event.name : "Sự kiện";
        setChecklistName(`Checklist ${eventName}`);
        setDeadline(formatDate(event?.startDatetime));

        setItems((prev) =>
          prev.map((it, idx) => ({
            ...it,
            departmentId: depts[idx]?.id ? String(depts[idx].id) : "",
            dueDate: formatDate(event?.startDatetime),
          }))
        );
      } catch (e) {
        setEventData(null);
        setDepartments([]);
        setError("Không tải được dữ liệu sự kiện/phòng ban.");
      }
    };

    init();
  }, [id]);

  const updateItem = (itemId, key, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item
      )
    );
  };

  const addItem = () =>
    setItems((prev) => [...prev, buildItem(prev.length + 1)]);

  const removeItem = (itemId) => {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((item) => item.id !== itemId)
    );
  };

  const requiredCount = useMemo(
    () => items.filter((item) => item.required).length,
    [items]
  );

  const receiverCount = useMemo(
    () => new Set(items.map((item) => item.departmentId).filter(Boolean)).size,
    [items]
  );

  const saveAndNotify = () => {
    const hasInvalidItem = items.some(
      (item) => !item.content.trim() || !item.departmentId || !item.dueDate
    );

    if (!checklistName.trim()) {
      setError("Vui lòng nhập tên checklist.");
      return;
    }

    if (!deadline) {
      setError("Vui lòng chọn hạn chót hoàn thành.");
      return;
    }

    if (hasInvalidItem) {
      setError(
        "Vui lòng nhập đầy đủ nội dung, ban phụ trách và thời hạn cho các hạng mục."
      );
      return;
    }

    setError("");

    // TODO: backend hiện chưa có endpoint checklist riêng, tạm thời quay về trang chi tiết sự kiện.
    navigate(`/event-management/events/${id}`);
  };

  return (
    <Box sx={{ p: 2.5, bgcolor: "#EEF3F8", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Typography color="text.secondary">
          Quy trình {eventData?.code || "--"} · Tạo & Gán Checklist
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<Save />}
            onClick={saveAndNotify}
          >
            Lưu & Gửi thông báo
          </Button>
        </Stack>
      </Stack>

      <Typography variant="h4" fontWeight={800} color="#0F2B5B">
        Tạo & Gán Checklist Công việc
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Xây dựng danh sách việc cần làm và phân công cho từng ban/phòng tham gia
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={9.8}>
          <Stack spacing={1.8}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Thông tin Checklist
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tên Checklist *"
                      value={checklistName}
                      onChange={(e) => setChecklistName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Sự kiện liên kết *"
                      value={eventData?.name || ""}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Giai đoạn / Bước quy trình"
                      value={stepName}
                      onChange={(e) => setStepName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Hạn chót hoàn thành *"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Ghi chú / Hướng dẫn chung"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Danh sách Hạng mục công việc
                </Typography>

                <Stack spacing={1}>
                  <Grid container spacing={1} sx={{ px: 1 }}>
                    <Grid item xs={0.5}>
                      <Typography fontWeight={700}>#</Typography>
                    </Grid>
                    <Grid item xs={6.8}>
                      <Typography fontWeight={700}>
                        NỘI DUNG CÔNG VIỆC
                      </Typography>
                    </Grid>
                    <Grid item xs={1.2}>
                      <Typography fontWeight={700}>BẮT BUỘC</Typography>
                    </Grid>
                    <Grid item xs={1.7}>
                      <Typography fontWeight={700}>BAN PHỤ TRÁCH</Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography fontWeight={700}>THỜI HẠN</Typography>
                    </Grid>
                    <Grid item xs={0.3} />
                  </Grid>

                  {items.map((item, idx) => (
                    <Grid
                      key={item.id}
                      container
                      spacing={1}
                      alignItems="center"
                    >
                      <Grid item xs={0.5}>
                        <Chip label={idx + 1} color="primary" size="small" />
                      </Grid>
                      <Grid item xs={6.8}>
                        <TextField
                          fullWidth
                          size="small"
                          value={item.content}
                          onChange={(e) =>
                            updateItem(item.id, "content", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={1.2}>
                        <Checkbox
                          checked={item.required}
                          onChange={(e) =>
                            updateItem(item.id, "required", e.target.checked)
                          }
                        />
                      </Grid>
                      <Grid item xs={1.7}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Ban</InputLabel>
                          <Select
                            label="Ban"
                            value={item.departmentId}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "departmentId",
                                e.target.value
                              )
                            }
                          >
                            {departments.map((dept) => (
                              <MenuItem key={dept.id} value={String(dept.id)}>
                                {dept.name || dept.code}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={1.5}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          value={item.dueDate}
                          onChange={(e) =>
                            updateItem(item.id, "dueDate", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={0.3}>
                        <IconButton
                          color="error"
                          onClick={() => removeItem(item.id)}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>

                <Button sx={{ mt: 1.2 }} onClick={addItem}>
                  + Thêm hạng mục
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={2.2}>
          <Stack spacing={1.5}>
            <Paper
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#0F2B5B",
                color: "#fff",
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                CHECKLIST ĐANG TẠO
              </Typography>
              <Typography variant="h6" fontWeight={800} mt={0.5}>
                {checklistName || "Checklist mới"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Hạn: {deadline || "--"} · {eventData?.code || "--"}
              </Typography>
              <Grid container spacing={1} mt={1}>
                <Grid item xs={6}>
                  <SummaryBox label="Hạng mục" value={items.length} />
                </Grid>
                <Grid item xs={6}>
                  <SummaryBox label="Ban nhận" value={receiverCount} />
                </Grid>
                <Grid item xs={6}>
                  <SummaryBox label="Bắt buộc" value={requiredCount} />
                </Grid>
                <Grid item xs={6}>
                  <SummaryBox
                    label="Ngày còn lại"
                    value={getDaysLeft(deadline)}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={800} mb={1}>
                Phương thức gửi thông báo
              </Typography>
              <Stack spacing={0.8}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={notifyInApp}
                    onChange={(e) => setNotifyInApp(e.target.checked)}
                  />
                  <Typography>Thông báo trong hệ thống</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                  />
                  <Typography>Email cho Trưởng ban</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={exportPdf}
                    onChange={(e) => setExportPdf(e.target.checked)}
                  />
                  <Typography>Xuất file PDF</Typography>
                </Stack>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#fff9db",
                border: "1px solid #fde68a",
              }}
            >
              <Typography fontWeight={700} color="#b45309">
                Hạn nộp {deadline || "--"} còn {getDaysLeft(deadline)} ngày.
              </Typography>
              <Typography variant="body2" color="#92400e">
                Nhớ nhắc nhở các ban trước 3 ngày.
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="success"
              startIcon={<NotificationsActive />}
              onClick={saveAndNotify}
            >
              Lưu & Gửi thông báo
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const SummaryBox = ({ label, value }) => (
  <Paper
    sx={{
      p: 1,
      bgcolor: "rgba(255,255,255,0.08)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.12)",
    }}
  >
    <Typography variant="h5" fontWeight={800} lineHeight={1}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ opacity: 0.85 }}>
      {label}
    </Typography>
  </Paper>
);

export default CreateChecklist;
