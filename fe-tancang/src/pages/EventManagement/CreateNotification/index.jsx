import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  Groups,
  LocationOn,
  Search,
} from '@mui/icons-material';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createNotification, getDepartments, getEventDetail, getEvents } from '@services/eventManagementService';

const decodeUnicodeText = (value) => {
  if (typeof value !== 'string' || !value) return value || '';

  let output = value;
  output = output.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  output = output.replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_, prefix, hex) => `${prefix}${String.fromCharCode(parseInt(hex, 16))}`);
  return output;
};

const extractApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message;
  if (Array.isArray(message)) return message.join('; ');
  if (message && typeof message === 'object') {
    return message.message || JSON.stringify(message);
  }
  return message || fallback;
};

const toLocalDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIso = (value) => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

const DEFAULT_PAGE_SIZE = 8;
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 'auto !important',
    minHeight: '44px',
  },
  '& .MuiInputBase-input': {
    lineHeight: 1.45,
    py: 1.25,
    boxSizing: 'border-box',
  },
};

const multilineFieldSx = {
  ...fieldSx,
  '& .MuiInputBase-root.MuiInputBase-multiline': {
    height: 'auto !important',
    alignItems: 'flex-start',
    py: 0,
  },
  '& .MuiInputBase-inputMultiline': {
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    py: 1.25,
    boxSizing: 'border-box',
  },
};

const CreateNotification = () => {
  const { id: routeId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventIdRaw = routeId || searchParams.get('eventId') || searchParams.get('id') || location.state?.eventId;
  const eventId = eventIdRaw && eventIdRaw !== 'undefined' && eventIdRaw !== 'null' ? eventIdRaw : '';

  const [eventData, setEventData] = useState(null);
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sendType: 'SYSTEM',
    reminderEnabled: true,
    reminderDaysBefore: 2,
    confirmationEnabled: true,
    confirmationDeadline: '',
    allowGuestReg: true,
    maxTotalGuests: '',
  });

  const [keyword, setKeyword] = useState('');
  const [departmentPage, setDepartmentPage] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [deptPagination, setDeptPagination] = useState({ page: 0, size: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 });

  const [selectedRecipients, setSelectedRecipients] = useState({});

  useEffect(() => {
    if (!eventId) {
      loadEventOptions();
      setLoading(false);
      return;
    }
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDepartments();
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword, departmentPage]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const res = await getEventDetail(eventId);
      const event = res?.data;
      setEventData(event || null);

      setFormData((prev) => ({
        ...prev,
        title: event?.name ? `Thông báo sự kiện: ${decodeUnicodeText(event.name)}` : '',
        content: buildDefaultContent(event),
        confirmationEnabled: !!event?.confirmationDeadline,
        confirmationDeadline: toLocalDateInput(event?.confirmationDeadline),
        allowGuestReg: event?.allowGuestReg ?? true,
        maxTotalGuests: event?.maxTotalGuests ?? '',
      }));
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể tải thông tin sự kiện.'));
    } finally {
      setLoading(false);
    }
  };

  const loadEventOptions = async () => {
    try {
      const res = await getEvents({ page: 0, size: 200 });
      const items = Array.isArray(res?.data) ? res.data : [];
      setEventOptions(items);
      if (items.length) {
        setSelectedEventId(String(items[0].id));
      }
    } catch (error) {
      setEventOptions([]);
      setErrorMessage(extractApiErrorMessage(error, 'Không thể tải danh sách sự kiện.'));
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartments({
        page: departmentPage,
        size: DEFAULT_PAGE_SIZE,
        keyword: keyword.trim() || undefined,
      });

      setDepartments(Array.isArray(res?.data) ? res.data : []);
      setDeptPagination(res?.pagination || { page: departmentPage, size: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 });
    } catch (error) {
      setDepartments([]);
      setDeptPagination({ page: departmentPage, size: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 });
      setErrorMessage(extractApiErrorMessage(error, 'Không thể tải danh sách phòng ban.'));
    }
  };

  const buildDefaultContent = (event) => {
    if (!event) return '';

    const name = decodeUnicodeText(event.name || '');
    const start = event.startDatetime ? new Date(event.startDatetime).toLocaleString('vi-VN') : '';
    const location = decodeUnicodeText(event.location || '');

    return [
      'Kính gửi Quý đơn vị,',
      '',
      `Trân trọng kính mời tham dự sự kiện "${name}".`,
      start ? `Thời gian: ${start}` : '',
      location ? `Địa điểm: ${location}` : '',
      '',
      'Đề nghị đơn vị phản hồi xác nhận tham gia trước hạn để Ban tổ chức tổng hợp.',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const selectedIds = useMemo(() => Object.keys(selectedRecipients), [selectedRecipients]);

  const selectedDepartmentCount = selectedIds.length;
  const selectedMemberCount = useMemo(
    () => selectedIds.reduce((sum, deptId) => sum + Number(selectedRecipients[deptId]?.memberCount || 0), 0),
    [selectedIds, selectedRecipients],
  );

  const totalGuestQuota = useMemo(
    () => selectedIds.reduce((sum, deptId) => sum + Number(selectedRecipients[deptId]?.maxGuests || 0), 0),
    [selectedIds, selectedRecipients],
  );

  const handleToggleDepartment = (dept) => {
    const deptId = dept.id || dept._id;

    setSelectedRecipients((prev) => {
      const cloned = { ...prev };
      if (cloned[deptId]) {
        delete cloned[deptId];
        return cloned;
      }

      cloned[deptId] = {
        maxGuests: 0,
        isRelatedFunction: true,
        name: decodeUnicodeText(dept.name || dept.title || dept.code || deptId),
        memberCount: Number(dept.memberCount || 0),
      };
      return cloned;
    });
  };

  const handleRecipientSettingChange = (departmentId, field, value) => {
    setSelectedRecipients((prev) => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        [field]: field === 'maxGuests' ? Number(value || 0) : value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề và nội dung thông báo.');
      return;
    }

    if (!selectedDepartmentCount) {
      setErrorMessage('Vui lòng chọn ít nhất 1 phòng ban nhận thông báo.');
      return;
    }

    if (formData.reminderEnabled && Number(formData.reminderDaysBefore || 0) < 1) {
      setErrorMessage('Số ngày nhắc phải lớn hơn hoặc bằng 1.');
      return;
    }

    if (formData.confirmationEnabled && !formData.confirmationDeadline) {
      setErrorMessage('Vui lòng cấu hình hạn xác nhận tham dự.');
      return;
    }

    const recipients = selectedIds.map((deptId) => ({
      departmentId: deptId,
      maxGuests: Number(selectedRecipients[deptId]?.maxGuests || 0),
      isRelatedFunction: !!selectedRecipients[deptId]?.isRelatedFunction,
    }));

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      sendType: formData.sendType,
      reminderEnabled: !!formData.reminderEnabled,
      reminderDaysBefore: formData.reminderEnabled ? Number(formData.reminderDaysBefore || 1) : undefined,
      confirmationDeadline: formData.confirmationEnabled ? toIso(formData.confirmationDeadline) : undefined,
      allowGuestReg: !!formData.allowGuestReg,
      maxTotalGuests: formData.maxTotalGuests === '' ? undefined : Number(formData.maxTotalGuests),
      recipients,
    };

    try {
      await createNotification(eventId, payload);
      navigate(`/event-management/events/${eventId}`);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể gửi thông báo sự kiện.'));
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Đang tải dữ liệu...</Box>;
  }

  if (!eventId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>Chọn sự kiện để gửi thông báo</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <TextField
                  select
                  label="Sự kiện"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {eventOptions.map((event) => (
                    <MenuItem key={event.id} value={String(event.id)}>
                      {decodeUnicodeText(event.name || event.code || event.id)}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
              <Button
                variant="contained"
                disabled={!selectedEventId}
                onClick={() => setSearchParams({ eventId: selectedEventId })}
              >
                Mở trang gửi thông báo
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f5f7fb' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={800} color="#1565c0">
          Gửi thông báo sự kiện
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Cấu hình thông báo</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sự kiện"
                      value={decodeUnicodeText(eventData?.code ? `${eventData.code} - ${eventData.name || ''}` : eventData?.name || '')}
                      disabled
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      required
                      label="Tiêu đề thông báo"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Hạn xác nhận tham dự"
                      value={formData.confirmationDeadline}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmationDeadline: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!formData.confirmationEnabled}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      minRows={5}
                      label="Nội dung thông báo"
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={multilineFieldSx}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Đối tượng nhận thông báo</Typography>
                  <Chip color="success" label={`${selectedDepartmentCount} đã chọn`} />
                </Stack>

                <TextField
                  fullWidth
                  placeholder="Tìm theo tên phòng ban hoặc mã"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setDepartmentPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={1.5}>
                  {departments.map((dept) => {
                    const deptId = dept.id || dept._id;
                    const checked = !!selectedRecipients[deptId];
                    const title = decodeUnicodeText(dept.name || dept.title || dept.code || deptId);

                    return (
                      <Grid item xs={12} md={6} key={deptId}>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: checked ? 'success.main' : 'divider',
                            borderRadius: 1.5,
                            p: 1.5,
                            bgcolor: checked ? 'rgba(46, 125, 50, 0.06)' : 'white',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <FormControlLabel
                              control={<Checkbox checked={checked} onChange={() => handleToggleDepartment(dept)} />}
                              label={
                                <Box>
                                  <Typography fontWeight={700}>{title}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Number(dept.memberCount || 0)} thành viên
                                  </Typography>
                                </Box>
                              }
                              sx={{ m: 0 }}
                            />
                          </Stack>

                          {checked ? (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1.5}>
                              <TextField
                                size="small"
                                type="number"
                                label="Giới hạn khách mời"
                                value={selectedRecipients[deptId]?.maxGuests ?? 0}
                                onChange={(e) => handleRecipientSettingChange(deptId, 'maxGuests', e.target.value)}
                                inputProps={{ min: 0 }}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={!!selectedRecipients[deptId]?.isRelatedFunction}
                                    onChange={(e) => handleRecipientSettingChange(deptId, 'isRelatedFunction', e.target.checked)}
                                  />
                                }
                                label="Liên quan chức năng"
                              />
                            </Stack>
                          ) : null}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số người nhận dự kiến: <b>{selectedMemberCount}</b>
                  </Typography>
                  <Pagination
                    color="primary"
                    page={(deptPagination.page || 0) + 1}
                    count={Math.max(deptPagination.totalPages || 1, 1)}
                    onChange={(_, pageValue) => setDepartmentPage(Math.max(pageValue - 1, 0))}
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Cài đặt xác nhận và khách mời</Typography>
                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!formData.confirmationEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmationEnabled: e.target.checked }))}
                      />
                    }
                    label="Yêu cầu xác nhận tham dự"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!formData.reminderEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                      />
                    }
                    label="Bật nhắc nhở tự động cho người chưa phản hồi"
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Nhắc trước (ngày)"
                    value={formData.reminderDaysBefore}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reminderDaysBefore: e.target.value }))}
                    inputProps={{ min: 1 }}
                    disabled={!formData.reminderEnabled}
                    sx={{ maxWidth: 260 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!formData.allowGuestReg}
                        onChange={(e) => setFormData((prev) => ({ ...prev, allowGuestReg: e.target.checked }))}
                      />
                    }
                    label="Cho phép đăng ký khách mời"
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Tổng giới hạn khách mời"
                    value={formData.maxTotalGuests}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxTotalGuests: e.target.value }))}
                    inputProps={{ min: 0 }}
                    sx={{ maxWidth: 260 }}
                    disabled={!formData.allowGuestReg}
                  />
                </Stack>
              </CardContent>
            </Card>

            {errorMessage ? <Alert severity="error">{decodeUnicodeText(errorMessage)}</Alert> : null}

            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                    Quay lại
                  </Button>
                  <Button variant="contained" color="error" onClick={handleSubmit}>
                    Gửi thông báo đến {selectedDepartmentCount} ban
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
            <Card sx={{ borderRadius: 2, bgcolor: '#173f77', color: '#fff' }}>
              <CardContent>
                <Typography variant="overline" sx={{ opacity: 0.85 }}>Sự kiện được chọn</Typography>
                <Typography variant="h6" fontWeight={800}>
                  {decodeUnicodeText(eventData?.name || 'Chưa có sự kiện')}
                </Typography>
                <Stack spacing={1} mt={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth fontSize="small" />
                    <Typography variant="body2">{eventData?.startDatetime ? new Date(eventData.startDatetime).toLocaleString('vi-VN') : 'Chưa cấu hình'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{decodeUnicodeText(eventData?.location || 'Chưa cấu hình')}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Groups fontSize="small" />
                    <Typography variant="body2">{selectedDepartmentCount} phòng ban</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={1}>Tóm tắt</Typography>
                <Stack spacing={1}>
                  <SummaryRow label="Phòng ban nhận" value={`${selectedDepartmentCount} ban`} />
                  <SummaryRow label="Người nhận dự kiến" value={`${selectedMemberCount} người`} />
                  <SummaryRow label="Yêu cầu xác nhận" value={formData.confirmationEnabled ? 'Bật' : 'Tắt'} />
                  <SummaryRow label="Hạn xác nhận" value={formData.confirmationDeadline ? new Date(formData.confirmationDeadline).toLocaleDateString('vi-VN') : '--'} />
                  <SummaryRow label="Nhắc tự động" value={formData.reminderEnabled ? 'Bật' : 'Tắt'} />
                  <SummaryRow label="Tổng khách mời" value={`${totalGuestQuota} khách`} />
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" fontWeight={700}>Phương thức gửi</Typography>
                <FormControl>
                  <RadioGroup
                    value={formData.sendType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sendType: e.target.value }))}
                  >
                    <FormControlLabel value="SYSTEM" control={<Radio />} label="Thông báo trong hệ thống" />
                    <FormControlLabel value="EMAIL" control={<Radio />} label="Email cho trưởng ban" />
                    <FormControlLabel value="PDF_EXPORT" control={<Radio />} label="Xuất PDF đính kèm" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const SummaryRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={700}>{value}</Typography>
  </Stack>
);

export default CreateNotification;
