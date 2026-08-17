import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
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
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getEvents, getNotificationsByEvent } from '@services/eventManagementService';

const decodeUnicodeText = (value) => {
  if (typeof value !== 'string' || !value) return value || '';
  let output = value;
  output = output.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  output = output.replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_, prefix, hex) => `${prefix}${String.fromCharCode(parseInt(hex, 16))}`);
  return output;
};

const NotificationInbox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchNotifications(selectedEventId);
      setSearchParams({ eventId: selectedEventId });
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const res = await getEvents({ page: 0, size: 200 });
      const items = Array.isArray(res?.data) ? res.data : [];
      setEvents(items);

      const queryEventId = searchParams.get('eventId');
      const hasQuery = queryEventId && items.some((e) => String(e.id) === String(queryEventId));
      if (hasQuery) {
        setSelectedEventId(String(queryEventId));
      } else if (items.length) {
        setSelectedEventId(String(items[0].id));
      }
    } catch (error) {
      setEvents([]);
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchNotifications = async (eventId) => {
    setLoading(true);
    try {
      const res = await getNotificationsByEvent(eventId);
      setNotifications(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      setNotifications([]);
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = (type) => {
    const map = {
      SYSTEM: 'Thông báo trong hệ thống',
      EMAIL: 'Email',
      PDF_EXPORT: 'Xuất PDF',
    };
    return map[type] || decodeUnicodeText(type || '');
  };

  const selectedEventName = useMemo(() => {
    const event = events.find((e) => String(e.id) === String(selectedEventId));
    return event?.name || '';
  }, [events, selectedEventId]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Danh sách thông báo sự kiện</Typography>
        <Button
          variant="contained"
          onClick={() =>
            selectedEventId
              ? navigate(`/event-management/events/${selectedEventId}/notifications/create`)
              : navigate('/event-management/events')
          }
        >
          Tạo thông báo
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <FormControl fullWidth size="small">
            <InputLabel>Sự kiện</InputLabel>
            <Select
              value={selectedEventId}
              label="Sự kiện"
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={String(event.id)}>
                  {decodeUnicodeText(event.name || '')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {!selectedEventId ? (
            <Typography color="text.secondary">Vui lòng chọn một sự kiện để xem thông báo.</Typography>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Sự kiện: {decodeUnicodeText(selectedEventName)}</Typography>
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tiêu đề</strong></TableCell>
                      <TableCell><strong>Loại thông báo</strong></TableCell>
                      <TableCell><strong>Trạng thái</strong></TableCell>
                      <TableCell><strong>Ngày gửi</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!notifications.length ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{decodeUnicodeText(row.title || '')}</TableCell>
                          <TableCell>{typeLabel(row.sendType)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={row.status || '-'} color={row.status === 'SENT' ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell>{row.sentAt ? new Date(row.sentAt).toLocaleString('vi-VN') : ''}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationInbox;
