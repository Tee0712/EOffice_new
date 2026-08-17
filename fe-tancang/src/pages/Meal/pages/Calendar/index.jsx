/**
 * Calendar Page - Lịch đăng ký suất ăn
 * Sử dụng FullCalendar
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import AddIcon from '@mui/icons-material/Add';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import { mealBookingService } from '@services/mealBookingService';
import RegisterModal from '../../components/RegisterModal';
import QuickPanel from '../../components/QuickPanel';
import dayjs from 'dayjs';

const SESSION_COLORS = {
  1: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Sáng
  2: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Trưa
  3: { bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' }, // Tối
};

const CalendarPage = () => {
  const calendarRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState({ menus: [], registrations: [] });
  const [selectedDate, setSelectedDate] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dayGridMonth');

  // Fetch calendar data
  const fetchCalendarData = useCallback(async (startStr, endStr) => {
    setLoading(true);
    try {
      const res = await mealBookingService.getCalendar(startStr, endStr);
      if (res?.success) {
        setCalendarData(res.data || { menus: [], registrations: [] });
      }
    } catch (error) {
      console.error('Fetch calendar error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = (dateInfo) => {
    fetchCalendarData(
      dayjs(dateInfo.start).format('YYYY-MM-DD'),
      dayjs(dateInfo.end).subtract(1, 'day').format('YYYY-MM-DD')
    );
  };

  const handleDateClick = (clickInfo) => {
    setSelectedDate(clickInfo.dateStr);
    setRegisterModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    // Handle event click - show registration details
    console.log('Event clicked:', clickInfo.event);
  };

  // Convert data to FullCalendar events
  const events = React.useMemo(() => {
    const eventList = [];

    // Add menu items as events
    (calendarData.menus || []).forEach((menu) => {
      const sessionColor = SESSION_COLORS[menu.session_id] || SESSION_COLORS[1];
      eventList.push({
        id: `menu-${menu.id}`,
        title: menu.dish_name || menu.name || 'Menu',
        start: menu.date,
        allDay: true,
        backgroundColor: sessionColor.bg,
        borderColor: sessionColor.border,
        textColor: sessionColor.text,
        extendedProps: {
          type: 'menu',
          session_id: menu.session_id,
          dishes: menu.dishes,
        },
      });
    });

    // Add user registrations
    (calendarData.registrations || []).forEach((reg) => {
      const sessionIds = reg.sessions || reg.meal_session_ids || [];
      sessionIds.forEach((sessionId) => {
        const sessionColor = SESSION_COLORS[sessionId] || SESSION_COLORS[1];
        eventList.push({
          id: `reg-${reg.id}-${sessionId}`,
          title: `✓ ${reg.session_name || `Ca ${sessionId}`}`,
          start: reg.date,
          allDay: true,
          backgroundColor: sessionColor.border,
          borderColor: sessionColor.border,
          textColor: 'white',
          extendedProps: {
            type: 'registration',
            registration: reg,
            session_id: sessionId,
          },
        });
      });
    });

    return eventList;
  }, [calendarData]);

  const navigateCalendar = (direction) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      if (direction === 'prev') api.prev();
      else if (direction === 'next') api.next();
      else if (direction === 'today') api.today();
    }
  };

  const changeView = (view) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
      setCurrentView(view);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Lịch đăng ký suất ăn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem và đăng ký suất ăn theo ngày
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setQuickPanelOpen(true)}
          >
            Đăng ký nhanh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedDate(dayjs().format('YYYY-MM-DD'));
              setRegisterModalOpen(true);
            }}
          >
            Đăng ký mới
          </Button>
        </Stack>
      </Stack>

      {/* Legend */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Chú thích:
          </Typography>
          {Object.entries(SESSION_COLORS).map(([id, colors]) => (
            <Chip
              key={id}
              label={
                id === '1' ? 'Ăn sáng (06:30-08:00)' :
                id === '2' ? 'Ăn trưa (11:00-13:00)' : 'Ăn tối (17:30-19:00)'
              }
              size="small"
              sx={{
                bgcolor: colors.bg,
                borderColor: colors.border,
                border: '1px solid',
                color: colors.text,
                fontWeight: 600,
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Calendar */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {/* Calendar Toolbar */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigateCalendar('today')}
            >
              <TodayIcon fontSize="small" />
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigateCalendar('prev')}>
              <NavigateBeforeIcon />
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigateCalendar('next')}>
              <NavigateNextIcon />
            </Button>
            <Typography variant="h6" fontWeight={700} ml={1}>
              {dayjs().format('MMMM YYYY')}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip
              label="Tháng"
              onClick={() => changeView('dayGridMonth')}
              variant={currentView === 'dayGridMonth' ? 'filled' : 'outlined'}
              color={currentView === 'dayGridMonth' ? 'primary' : 'default'}
            />
            <Chip
              label="Tuần"
              onClick={() => changeView('timeGridWeek')}
              variant={currentView === 'timeGridWeek' ? 'filled' : 'outlined'}
              color={currentView === 'timeGridWeek' ? 'primary' : 'default'}
            />
            <Chip
              label="Ngày"
              onClick={() => changeView('timeGridDay')}
              variant={currentView === 'timeGridDay' ? 'filled' : 'outlined'}
              color={currentView === 'timeGridDay' ? 'primary' : 'default'}
            />
          </Stack>
        </Stack>

        {/* Calendar Component */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ '& .fc': { fontFamily: 'inherit' } }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={events}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            locale="vi"
            buttonText={{
              today: 'Hôm nay',
              month: 'Tháng',
              week: 'Tuần',
              day: 'Ngày',
            }}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
          />
        </Box>
      </Paper>

      {/* Modals */}
      <RegisterModal
        open={registerModalOpen}
        onClose={() => {
          setRegisterModalOpen(false);
          setSelectedDate(null);
        }}
        defaultDate={selectedDate}
      />

      <QuickPanel
        open={quickPanelOpen}
        onClose={() => setQuickPanelOpen(false)}
      />
    </Container>
  );
};

export default CalendarPage;
