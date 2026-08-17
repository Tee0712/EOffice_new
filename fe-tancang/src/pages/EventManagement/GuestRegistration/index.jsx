import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  Check,
  DeleteOutline,
  Person,
  UploadFile,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  checkGuestDuplicate,
  confirmParticipation,
  deleteGuest,
  getDepartments,
  getEvents,
  getEventDetail,
  getGuestsByDepartment,
  getNotificationDetail,
  getNotificationsByEvent,
  getRecipientConfirmation,
  registerGuest,
} from '@services/eventManagementService';

const decodeUnicodeText = (value) => {
  if (typeof value !== 'string' || !value) return value || '';
  let output = value;
  output = output.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  output = output.replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_, prefix, hex) => `${prefix}${String.fromCharCode(parseInt(hex, 16))}`);
  return output;
};

const guestTypeLabel = {
  VIP: 'VIP',
  PARTNER: 'Đối tác',
  REGULAR: 'Thường',
};

const emptyForm = {
  fullName: '',
  title: '',
  organization: '',
  email: '',
  phone: '',
  guestType: 'PARTNER',
  note: '',
};

const GuestRegistration = () => {
  const { id: routeEventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventIdRaw = routeEventId || searchParams.get('eventId') || searchParams.get('id');
  const eventId = eventIdRaw && eventIdRaw !== 'undefined' && eventIdRaw !== 'null' ? eventIdRaw : '';

  const [eventData, setEventData] = useState(null);
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [recipientByDepartment, setRecipientByDepartment] = useState({});

  const [confirmation, setConfirmation] = useState({ status: 'PENDING' });
  const [guests, setGuests] = useState([]);
  const [quota, setQuota] = useState({ used: 0, total: 0, remaining: 0 });

  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingGuests, setLoadingGuests] = useState(false);

  useEffect(() => {
    if (!eventId) {
      loadEventsForPicker();
      return;
    }
    bootstrap();
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !selectedDepartmentId) return;
    loadDepartmentGuests();
    loadConfirmationStatus();
  }, [eventId, selectedDepartmentId, recipientByDepartment]);

  const bootstrap = async () => {
    try {
      setError('');
      const [eventRes, deptRes, notificationsRes] = await Promise.all([
        getEventDetail(eventId),
        getDepartments({ page: 0, size: 200 }),
        getNotificationsByEvent(eventId),
      ]);

      const event = eventRes?.data || null;
      setEventData(event);

      const deptItems = Array.isArray(deptRes?.data) ? deptRes.data : [];
      setDepartments(deptItems);
      if (deptItems.length) {
        setSelectedDepartmentId((prev) => prev || String(deptItems[0].id || deptItems[0]._id));
      }

      const notifications = Array.isArray(notificationsRes?.data) ? notificationsRes.data : [];
      if (notifications.length) {
        const latestNotificationId = notifications[0]?.id;
        if (latestNotificationId) {
          const detailRes = await getNotificationDetail(latestNotificationId);
          const recipients = Array.isArray(detailRes?.data?.recipients) ? detailRes.data.recipients : [];
          const map = {};
          recipients.forEach((r) => {
            map[String(r.departmentId)] = {
              recipientId: r.id,
              maxGuests: Number(r.maxGuests || 0),
            };
          });
          setRecipientByDepartment(map);
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Không tải được dữ liệu khách mời.');
    }
  };

  const loadEventsForPicker = async () => {
    try {
      const res = await getEvents({ page: 0, size: 200 });
      const items = Array.isArray(res?.data) ? res.data : [];
      setEventOptions(items);
      if (items.length) {
        setSelectedEventId(String(items[0].id));
      }
    } catch (e) {
      setEventOptions([]);
      setError(e?.response?.data?.message || 'Không tải được danh sách sự kiện.');
    }
  };

  const loadDepartmentGuests = async () => {
    try {
      setLoadingGuests(true);
      const res = await getGuestsByDepartment(eventId, selectedDepartmentId, { page: 0, size: 100 });
      setGuests(Array.isArray(res?.data) ? res.data : []);
      setQuota(res?.quotaSummary || { used: 0, total: 0, remaining: 0 });
    } catch (e) {
      setGuests([]);
      setQuota({ used: 0, total: 0, remaining: 0 });
      setError(e?.response?.data?.message || 'Không tải được danh sách khách mời.');
    } finally {
      setLoadingGuests(false);
    }
  };

  const loadConfirmationStatus = async () => {
    const recipientId = recipientByDepartment[selectedDepartmentId]?.recipientId;
    if (!recipientId) {
      setConfirmation({ status: 'PENDING' });
      return;
    }

    try {
      const res = await getRecipientConfirmation(recipientId);
      setConfirmation(res?.data || { status: 'PENDING' });
    } catch {
      setConfirmation({ status: 'PENDING' });
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddGuest = async () => {
    if (!selectedDepartmentId) {
      setError('Vui lòng chọn phòng ban.');
      return;
    }
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên khách mời.');
      return;
    }

    try {
      setError('');
      setMessage('');

      const duplicateRes = await checkGuestDuplicate(eventId, {
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      });

      const duplicate = duplicateRes?.data?.isDuplicate;
      let forceAdd = false;
      if (duplicate) {
        forceAdd = window.confirm('Khách mời đã tồn tại trong sự kiện. Bạn có muốn thêm tiếp?');
        if (!forceAdd) return;
      }

      await registerGuest(eventId, selectedDepartmentId, {
        ...formData,
        fullName: formData.fullName.trim(),
        title: formData.title?.trim() || undefined,
        organization: formData.organization?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        note: formData.note?.trim() || undefined,
        forceAdd,
      });

      setMessage('Thêm khách mời thành công.');
      setFormData(emptyForm);
      await loadDepartmentGuests();
    } catch (e) {
      setError(e?.response?.data?.message || 'Không thể thêm khách mời.');
    }
  };

  const handleDelete = async (registrationId) => {
    try {
      await deleteGuest(eventId, registrationId);
      await loadDepartmentGuests();
    } catch (e) {
      setError(e?.response?.data?.message || 'Không thể hủy đăng ký khách mời.');
    }
  };

  const handleConfirm = async (status) => {
    const recipientId = recipientByDepartment[selectedDepartmentId]?.recipientId;
    if (!recipientId) {
      setError('Phòng ban chưa có trong danh sách nhận thông báo của sự kiện.');
      return;
    }

    try {
      const payload =
        status === 'CONFIRMED'
          ? { status: 'CONFIRMED', attendeeCount: Number(quota.used || 0) }
          : { status: 'DECLINED', declineReason: 'Không tham dự' };

      await confirmParticipation(recipientId, payload);
      await loadConfirmationStatus();
      setMessage(status === 'CONFIRMED' ? 'Đã xác nhận tham dự.' : 'Đã từ chối tham dự.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Không thể cập nhật trạng thái xác nhận.');
    }
  };

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d.id || d._id) === String(selectedDepartmentId)),
    [departments, selectedDepartmentId],
  );

  const usedPercent = quota.total > 0 ? Math.min((quota.used / quota.total) * 100, 100) : 0;

  if (!eventId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>Chọn sự kiện để đăng ký khách mời</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sự kiện</InputLabel>
                <Select
                  value={selectedEventId}
                  label="Sự kiện"
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {eventOptions.map((event) => (
                    <MenuItem key={event.id} value={String(event.id)}>
                      {decodeUnicodeText(event.name || event.code || event.id)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={!selectedEventId}
                onClick={() => setSearchParams({ eventId: selectedEventId })}
              >
                Mở trang đăng ký
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fb' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body1" color="text.secondary">
          Sự kiện · {decodeUnicodeText(eventData?.code || '')} · Xác nhận & Đăng ký khách mời
          {selectedDepartment ? ` - ${decodeUnicodeText(selectedDepartment.name || '')}` : ''}
        </Typography>
        <Button variant="contained" color="success" onClick={loadDepartmentGuests}>Lưu danh sách</Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Thêm khách mời</Typography>
                  <FormControl size="small" sx={{ minWidth: 280 }}>
                    <InputLabel>Phòng ban</InputLabel>
                    <Select
                      value={selectedDepartmentId}
                      label="Phòng ban"
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.id || dept._id} value={String(dept.id || dept._id)}>
                          {decodeUnicodeText(dept.name || dept.code || dept.id)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth required label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChangeField} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Chức vụ" name="title" value={formData.title} onChange={handleChangeField} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Đơn vị / Tổ chức" name="organization" value={formData.organization} onChange={handleChangeField} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChangeField} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChangeField} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Loại khách</InputLabel>
                      <Select label="Loại khách" name="guestType" value={formData.guestType} onChange={handleChangeField}>
                        <MenuItem value="VIP">VIP</MenuItem>
                        <MenuItem value="PARTNER">Đối tác</MenuItem>
                        <MenuItem value="REGULAR">Thường</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                  <Button variant="outlined" onClick={() => setFormData(emptyForm)}>Xóa trắng</Button>
                  <Button variant="contained" startIcon={<Add />} color="success" onClick={handleAddGuest}>Thêm vào danh sách</Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={700}>Danh sách khách mời đã đăng ký</Typography>
                  <Button variant="outlined" startIcon={<UploadFile />} size="small">Nhập từ Excel</Button>
                </Stack>

                <Typography variant="body2" mb={1}>Chỗ đã dùng: <b>{quota.used} / {quota.total} khách</b></Typography>
                <LinearProgress variant="determinate" value={usedPercent} sx={{ height: 10, borderRadius: 8, mb: 1 }} />
                <Typography variant="body2" color={quota.remaining >= 0 ? 'success.main' : 'error.main'}>
                  {quota.remaining >= 0 ? `Còn ${quota.remaining} chỗ trống` : `Vượt ${Math.abs(quota.remaining)} chỗ`}
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Họ tên & chức danh</TableCell>
                        <TableCell>Đơn vị</TableCell>
                        <TableCell>Số điện thoại</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Loại khách</TableCell>
                        <TableCell align="center">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!guests.length ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">{loadingGuests ? 'Đang tải dữ liệu...' : 'Chưa có khách mời'}</TableCell>
                        </TableRow>
                      ) : (
                        guests.map((guest, idx) => (
                          <TableRow key={guest.registrationId || guest.guestId || idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <Typography fontWeight={700}>{decodeUnicodeText(guest.fullName || '')}</Typography>
                              <Typography variant="caption" color="text.secondary">{decodeUnicodeText(guest.title || '')}</Typography>
                            </TableCell>
                            <TableCell>{decodeUnicodeText(guest.organization || '-')}</TableCell>
                            <TableCell>{guest.phone || '-'}</TableCell>
                            <TableCell>{guest.email || '-'}</TableCell>
                            <TableCell>
                              <Chip size="small" color={guest.guestType === 'VIP' ? 'success' : 'default'} label={guestTypeLabel[guest.guestType] || guest.guestType || '-'} />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => handleDelete(guest.registrationId)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {error ? <Alert severity="error">{decodeUnicodeText(error)}</Alert> : null}
            {message ? <Alert severity="success">{decodeUnicodeText(message)}</Alert> : null}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={1}>Trạng thái xác nhận</Typography>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" color="success" startIcon={<Check />} onClick={() => handleConfirm('CONFIRMED')}>
                    Xác nhận
                  </Button>
                  <Button fullWidth variant="outlined" color="error" onClick={() => handleConfirm('DECLINED')}>
                    Từ chối
                  </Button>
                </Stack>

                <Box mt={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf3' }}>
                  <Typography fontWeight={700} color="success.dark">
                    {confirmation?.status === 'CONFIRMED' ? 'Đã xác nhận tham dự' : confirmation?.status === 'DECLINED' ? 'Đã từ chối tham dự' : 'Chưa xác nhận'}
                  </Typography>
                  {confirmation?.confirmedAt ? (
                    <Typography variant="body2" color="text.secondary">
                      Ngày xác nhận: {new Date(confirmation.confirmedAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  ) : null}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="body1" fontWeight={700} color="warning.dark">
                  Hạn đăng ký khách mời: {eventData?.guestRegDeadline ? new Date(eventData.guestRegDeadline).toLocaleDateString('vi-VN') : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Sau hạn này danh sách khách mời sẽ bị khóa theo cấu hình sự kiện.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={1}>Thông tin sự kiện</Typography>
                <InfoRow label="Sự kiện" value={decodeUnicodeText(eventData?.name || '--')} />
                <InfoRow label="Ngày tổ chức" value={eventData?.startDatetime ? new Date(eventData.startDatetime).toLocaleDateString('vi-VN') : '--'} />
                <InfoRow label="Địa điểm" value={decodeUnicodeText(eventData?.location || '--')} />
                <InfoRow label="Hạn xác nhận" value={eventData?.confirmationDeadline ? new Date(eventData.confirmationDeadline).toLocaleDateString('vi-VN') : '--'} />
                <InfoRow
                  label="Giới hạn khách"
                  value={`${recipientByDepartment[selectedDepartmentId]?.maxGuests ?? quota.total ?? 0} khách / ${decodeUnicodeText(selectedDepartment?.name || '--')}`}
                />
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              startIcon={<Person />}
              onClick={() => navigate(eventId ? `/event-management/events/${eventId}` : '/event-management/events')}
            >
              Về chi tiết sự kiện
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const InfoRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={700} textAlign="right">{value}</Typography>
  </Stack>
);

export default GuestRegistration;
