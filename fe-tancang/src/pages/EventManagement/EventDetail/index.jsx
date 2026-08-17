import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AddTask,
  Campaign,
  CheckCircle,
  Circle,
  Edit,
  KeyboardArrowLeft,
  People,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getEventDetail } from "@services/eventManagementService";

const decodeUnicodeText = (value) => {
  if (typeof value !== "string" || !value) return value || "";
  let output = value;
  output = output.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  output = output.replace(
    /([A-Za-z])u([0-9a-fA-F]{4})/g,
    (_, prefix, hex) => `${prefix}${String.fromCharCode(parseInt(hex, 16))}`
  );
  return output;
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
};

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const parseWorkflowMeta = (rawDescription = "") => {
  const description = decodeUnicodeText(rawDescription || "");
  const lines = description.split("\n").map((line) => line.trim());

  const processName =
    lines
      .find((line) => line.startsWith("Tên quy trình:"))
      ?.replace("Tên quy trình:", "")
      .trim() || "";
  const head =
    lines
      .find((line) => line.startsWith("Trưởng ban tổ chức:"))
      ?.replace("Trưởng ban tổ chức:", "")
      .trim() || "";
  const secretary =
    lines
      .find((line) => line.startsWith("Thư ký quy trình:"))
      ?.replace("Thư ký quy trình:", "")
      .trim() || "";

  const roleLines = lines.filter((line) => line.startsWith("- "));
  const departmentRoles = roleLines.map((line) => {
    const cleaned = line.replace("- ", "");
    const [name, role] = cleaned.split(":");
    return {
      name: (name || "").trim(),
      role: (role || "Phối hợp").trim(),
    };
  });

  const plainDescription = lines
    .filter(
      (line) =>
        !line.startsWith("[Quy trình phối hợp]") &&
        !line.startsWith("Tên quy trình:") &&
        !line.startsWith("Trưởng ban tổ chức:") &&
        !line.startsWith("Thư ký quy trình:") &&
        !line.startsWith("Phân công ban/phòng:") &&
        !line.startsWith("- ")
    )
    .join("\n")
    .trim();

  return {
    processName,
    head,
    secretary,
    departmentRoles,
    plainDescription,
  };
};

const getTimelineStatus = (program) => {
  const now = Date.now();
  const start = program?.startTime
    ? new Date(program.startTime).getTime()
    : null;
  const end = program?.endTime ? new Date(program.endTime).getTime() : start;

  if (end && end < now)
    return {
      key: "DONE",
      label: "Hoàn thành",
      progress: 100,
      color: "success",
    };
  if (start && start <= now)
    return {
      key: "IN_PROGRESS",
      label: "Đang thực hiện",
      progress: 57,
      color: "warning",
    };
  return {
    key: "NOT_STARTED",
    label: "Chưa bắt đầu",
    progress: 0,
    color: "default",
  };
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isCreateProcessMode = searchParams.get("mode") === "create-process";
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await getEventDetail(id);
        setEventData(res?.data || null);
      } catch (error) {
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const workflowMeta = useMemo(
    () => parseWorkflowMeta(eventData?.description || ""),
    [eventData?.description]
  );

  const sortedPrograms = useMemo(() => {
    const programs = Array.isArray(eventData?.programs)
      ? eventData.programs
      : [];
    return programs.slice().sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
  }, [eventData?.programs]);

  const timelineItems = useMemo(
    () =>
      sortedPrograms.map((program, index) => {
        const status = getTimelineStatus(program);
        return {
          id: program.id || `${index + 1}`,
          index: index + 1,
          title: decodeUnicodeText(program.title || ""),
          subtitle: decodeUnicodeText(program.description || ""),
          owner: decodeUnicodeText(program.presenter || "Tất cả ban"),
          date: formatDate(program.startTime),
          status,
        };
      }),
    [sortedPrograms]
  );

  const stats = useMemo(() => {
    const done = timelineItems.filter((i) => i.status.key === "DONE").length;
    const inProgress = timelineItems.filter(
      (i) => i.status.key === "IN_PROGRESS"
    ).length;
    const notStarted = timelineItems.filter(
      (i) => i.status.key === "NOT_STARTED"
    ).length;
    const total = timelineItems.length;
    const progress = total
      ? Math.round(
          timelineItems.reduce((sum, item) => sum + item.status.progress, 0) /
            total
        )
      : 0;
    return { total, done, inProgress, notStarted, progress };
  }, [timelineItems]);

  const participantStats = useMemo(() => {
    const roleMap = new Map();
    workflowMeta.departmentRoles.forEach((item) =>
      roleMap.set(item.name, item.role)
    );

    const owners = timelineItems
      .map((item) => item.owner)
      .filter(Boolean)
      .filter((owner) => owner !== "Tất cả ban");

    const uniqueOwners = Array.from(new Set(owners));

    return uniqueOwners.map((owner) => {
      const ownerItems = timelineItems.filter((item) => item.owner === owner);
      const progress = ownerItems.length
        ? Math.round(
            ownerItems.reduce((sum, item) => sum + item.status.progress, 0) /
              ownerItems.length
          )
        : 0;
      return {
        name: owner,
        role: roleMap.get(owner) || "Phối hợp",
        progress,
      };
    });
  }, [timelineItems, workflowMeta.departmentRoles]);

  if (loading) {
    return <Box sx={{ p: 3 }}>Đang tải dữ liệu...</Box>;
  }

  if (!eventData) {
    return <Box sx={{ p: 3 }}>Không tìm thấy dữ liệu sự kiện.</Box>;
  }

  const eventCode = decodeUnicodeText(eventData.code || "--");
  const eventName = decodeUnicodeText(eventData.name || "");
  const startDateText = formatDate(eventData.startDatetime);
  const processName = workflowMeta.processName || `QTPH-${eventCode}`;
  const createdDate = formatDate(eventData.createdAt);

  return (
    <Box sx={{ p: 2.5, bgcolor: "#EEF3F8", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Typography color="text.secondary">
          Sự kiện <strong>{eventCode}</strong> ·{" "}
          {isCreateProcessMode ? "Tạo Quy trình" : "Chi tiết Quy trình"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<AddTask />}
            onClick={() =>
              navigate(`/event-management/events/${id}/checklist/create`)
            }
          >
            Tạo Checklist
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<Campaign />}
            onClick={() =>
              navigate(`/event-management/events/${id}/notifications/create`)
            }
          >
            Gửi thông báo
          </Button>
          {isCreateProcessMode ? null : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() =>
                navigate(`/event-management/events/create?id=${id}`)
              }
            >
              Chỉnh sửa
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<KeyboardArrowLeft />}
            onClick={() => navigate("/event-management/events")}
          >
            Quay lại
          </Button>
        </Stack>
      </Stack>

      <Paper
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          color: "#fff",
          background:
            "linear-gradient(135deg, #0E2A57 0%, #103A77 70%, #1B4D93 100%)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Chip
              size="small"
              label={`${processName} · ${eventData.status === "COMPLETED" ? "Hoàn thành" : "Đang thực hiện"}`}
              sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 700, mb: 1 }}
            />
            <Typography variant="h5" fontWeight={800}>
              Quy trình phối hợp: {eventName}
            </Typography>
            <Stack direction="row" spacing={2} mt={0.8} flexWrap="wrap">
              <Typography variant="body2">Sự kiện: {startDateText}</Typography>
              <Typography variant="body2">
                Chủ trì: {participantStats[0]?.name || "--"}
              </Typography>
              <Typography variant="body2">
                {participantStats.length} ban tham gia
              </Typography>
              <Typography variant="body2">
                Trưởng ban: {workflowMeta.head || "--"}
              </Typography>
            </Stack>
          </Box>

          <Box textAlign="right">
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Tiến độ tổng thể
            </Typography>
            <Typography variant="h2" fontWeight={800} lineHeight={1}>
              {stats.progress}
              <Typography component="span" variant="h4">
                %
              </Typography>
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} mt={2}>
          <StatChip value={stats.total} label="Tổng bước" />
          <StatChip value={stats.done} label="Đã hoàn thành" color="#22c55e" />
          <StatChip
            value={stats.inProgress}
            label="Đang thực hiện"
            color="#f59e0b"
          />
          <StatChip
            value={stats.notStarted}
            label="Chưa bắt đầu"
            color="#94a3b8"
          />
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={9.8}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Lịch trình triển khai
                  </Typography>
                  <Typography color="text.secondary">
                    {stats.total} bước · từ{" "}
                    {formatDate(eventData.startDatetime)} đến{" "}
                    {formatDate(eventData.endDatetime)}
                  </Typography>
                </Box>
                <Button variant="contained" color="success" size="small">
                  + Thêm bước
                </Button>
              </Stack>

              <Stack spacing={1.2}>
                {timelineItems.map((item) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 1.5,
                      p: 1.2,
                      borderColor:
                        item.status.key === "DONE"
                          ? "#10b981"
                          : item.status.key === "IN_PROGRESS"
                            ? "#f59e0b"
                            : "#cbd5e1",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="flex-start"
                    >
                      <Box sx={{ minWidth: 58, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          {item.date}
                        </Typography>
                        <Box mt={0.5}>
                          {item.status.key === "DONE" ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Circle
                              color={
                                item.status.key === "IN_PROGRESS"
                                  ? "warning"
                                  : "disabled"
                              }
                              fontSize="small"
                            />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography fontWeight={800}>
                            {item.index}. {item.title}
                          </Typography>
                          <Chip
                            size="small"
                            color={item.status.color}
                            label={item.status.label}
                          />
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          <People
                            sx={{
                              fontSize: 14,
                              mr: 0.3,
                              verticalAlign: "text-top",
                            }}
                          />
                          {item.owner}
                        </Typography>

                        {item.subtitle ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.4}
                          >
                            {item.subtitle}
                          </Typography>
                        ) : null}

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mt={0.8}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={item.status.progress}
                            sx={{ flex: 1, height: 6, borderRadius: 999 }}
                          />
                          <Typography variant="body2" fontWeight={700}>
                            {item.status.progress}%
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2.2}>
          <Stack spacing={1.5}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Trạng thái các Ban tham gia
                </Typography>
                <Stack spacing={1}>
                  {participantStats.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Chưa có dữ liệu ban tham gia.
                    </Typography>
                  ) : (
                    participantStats.map((item) => (
                      <Box key={item.name}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography fontWeight={700}>{item.name}</Typography>
                          <Chip size="small" label={item.role} />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            sx={{ flex: 1, height: 5, borderRadius: 999 }}
                          />
                          <Typography variant="caption" fontWeight={700}>
                            {item.progress}%
                          </Typography>
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Thông tin quy trình
                </Typography>
                <InfoRow label="Mã quy trình" value={processName} />
                <InfoRow label="Ngày tạo" value={createdDate} />
                <InfoRow
                  label="Người tạo"
                  value={decodeUnicodeText(eventData.createdBy || "--")}
                />
                <InfoRow
                  label="Trưởng ban tổ chức"
                  value={workflowMeta.head || "--"}
                />
                <InfoRow
                  label="Thư ký"
                  value={workflowMeta.secretary || "--"}
                />
                <Divider sx={{ my: 1 }} />
                <InfoRow
                  label="Ngân sách dự kiến"
                  value={
                    eventData?.maxTotalGuests
                      ? `${Number(eventData.maxTotalGuests).toLocaleString("vi-VN")} khách`
                      : "--"
                  }
                />
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Hoạt động gần đây
                </Typography>
                <Stack spacing={1}>
                  {timelineItems.slice(0, 3).map((item) => (
                    <Box key={`activity-${item.id}`}>
                      <Typography variant="body2" fontWeight={700}>
                        {item.owner} · {item.status.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.title}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const StatChip = ({ value, label, color = "#fff" }) => (
  <Paper
    sx={{
      px: 1.2,
      py: 0.8,
      minWidth: 98,
      bgcolor: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#fff",
    }}
  >
    <Typography variant="h6" fontWeight={800} color={color}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ opacity: 0.85 }}>
      {label}
    </Typography>
  </Paper>
);

const InfoRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={1} py={0.3}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={700} textAlign="right">
      {value}
    </Typography>
  </Stack>
);

export default EventDetail;
