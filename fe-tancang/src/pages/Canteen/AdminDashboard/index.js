import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/vi';
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mealBookingService as canteenService } from '../../../services/mealBookingService';

moment.locale('vi');

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const MEAL_LABEL = {
  breakfast: 'Sáng',
  lunch: 'Trưa',
  dinner: 'Tối',
};

const formatDelta = (value = 0) => (value > 0 ? `+${value}` : `${value}`);

const DashboardCard = ({ title, value, delta, border }) => (
  <Box
    sx={{
      bgcolor: 'white',
      borderRadius: 2,
      p: 2.5,
      borderLeft: `4px solid ${border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      height: '100%',
    }}
  >
    <Stack direction='row' justifyContent='space-between' alignItems='center'>
      <Typography fontSize={42 < String(value).length ? 32 : 38} fontWeight={800}>
        {value}
      </Typography>
      <Typography fontSize={13} fontWeight={700} color={delta >= 0 ? 'success.main' : 'error.main'}>
        {formatDelta(delta)}
      </Typography>
    </Stack>
    <Typography fontSize={13} color='text.secondary'>
      {title}
    </Typography>
  </Box>
);

const MOCK_DATA_BY_VIEW = {
  day: {
    cards: {
      breakfast: { value: 148, delta: 12 },
      lunch: { value: 385, delta: 24 },
      dinner: { value: 92, delta: 5 },
      total: { value: 625, delta: 41 },
    },
    trend: [
      { label: '06:30 - 08:00 (Sáng)', total: 148 },
      { label: '11:00 - 13:00 (Trưa)', total: 385 },
      { label: '17:30 - 19:00 (Tối)', total: 92 },
    ],
    departmentDistribution: [
      { name: 'Khối Khai thác Cảng', count: 240, percent: 38 },
      { name: 'Khối Văn phòng & Hành chính', count: 185, percent: 30 },
      { name: 'Khối Kỹ thuật & Công nghệ', count: 120, percent: 19 },
      { name: 'Khối Hậu cần & Dịch vụ', count: 80, percent: 13 },
    ],
    statusRatio: { registeredRate: 94, cancelledRate: 4, autoCutRate: 2 },
  },
  week: {
    cards: {
      breakfast: { value: 950, delta: 45 },
      lunch: { value: 2450, delta: 120 },
      dinner: { value: 580, delta: 30 },
      total: { value: 3980, delta: 195 },
    },
    trend: [
      { label: 'Thứ 2', total: 580 },
      { label: 'Thứ 3', total: 610 },
      { label: 'Thứ 4', total: 595 },
      { label: 'Thứ 5', total: 630 },
      { label: 'Thứ 6', total: 640 },
      { label: 'Thứ 7', total: 520 },
      { label: 'Chủ nhật', total: 405 },
    ],
    departmentDistribution: [
      { name: 'Khối Khai thác Cảng', count: 1520, percent: 38 },
      { name: 'Khối Văn phòng & Hành chính', count: 1180, percent: 30 },
      { name: 'Khối Kỹ thuật & Công nghệ', count: 760, percent: 19 },
      { name: 'Khối Hậu cần & Dịch vụ', count: 520, percent: 13 },
    ],
    statusRatio: { registeredRate: 96, cancelledRate: 3, autoCutRate: 1 },
  },
  month: {
    cards: {
      breakfast: { value: 4100, delta: 180 },
      lunch: { value: 10850, delta: 450 },
      dinner: { value: 2600, delta: 110 },
      total: { value: 17550, delta: 740 },
    },
    trend: [
      { label: 'Tuần 1', total: 4200 },
      { label: 'Tuần 2', total: 4450 },
      { label: 'Tuần 3', total: 4380 },
      { label: 'Tuần 4', total: 4520 },
    ],
    departmentDistribution: [
      { name: 'Khối Khai thác Cảng', count: 6650, percent: 38 },
      { name: 'Khối Văn phòng & Hành chính', count: 5250, percent: 30 },
      { name: 'Khối Kỹ thuật & Công nghệ', count: 3330, percent: 19 },
      { name: 'Khối Hậu cần & Dịch vụ', count: 2320, percent: 13 },
    ],
    statusRatio: { registeredRate: 95, cancelledRate: 3.5, autoCutRate: 1.5 },
  },
};

const MOCK_TODAY_ROWS = [
  { stt: 1, userName: 'Nguyễn Văn An', departmentName: 'Phòng Công nghệ Thông tin', meals: [{ slot: 'breakfast' }, { slot: 'lunch' }], note: 'Ăn tại bếp 1' },
  { stt: 2, userName: 'Trần Thị Bích', departmentName: 'Phòng Kế hoạch Tổng hợp', meals: [{ slot: 'lunch' }], note: 'Ăn kiêng' },
  { stt: 3, userName: 'Lê Hoàng Cường', departmentName: 'Ban Giám đốc', meals: [{ slot: 'lunch' }, { slot: 'dinner' }], note: 'Tiếp khách' },
  { stt: 4, userName: 'Phạm Thị Dung', departmentName: 'Phòng Tổ chức Cán bộ', meals: [{ slot: 'breakfast' }, { slot: 'lunch' }], note: '' },
  { stt: 5, userName: 'Hoàng Minh Đức', departmentName: 'Đội Khai thác Bến 1', meals: [{ slot: 'breakfast' }, { slot: 'lunch' }, { slot: 'dinner' }], note: 'Trực ca 24h' },
  { stt: 6, userName: 'Vũ Hải Đăng', departmentName: 'Phòng Kỹ thuật Thiết bị', meals: [{ slot: 'lunch' }], note: '' },
  { stt: 7, userName: 'Đặng Thị Hạnh', departmentName: 'Phòng Tài chính Kế toán', meals: [{ slot: 'breakfast' }, { slot: 'lunch' }], note: '' },
  { stt: 8, userName: 'Bùi Quang Huy', departmentName: 'Phòng Pháp chế & Đối ngoại', meals: [{ slot: 'lunch' }], note: '' },
];

const CanteenAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('day');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [slotFilter, setSlotFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [customRegs, setCustomRegs] = useState(() => {
    try {
      const raw = localStorage.getItem("LOCAL_MY_REGISTRATIONS");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem("LOCAL_MY_REGISTRATIONS");
        setCustomRegs(raw ? JSON.parse(raw) : []);
      } catch {}
    };
    handleSync();
    window.addEventListener("storage", handleSync);
    window.addEventListener("canteen_registrations_updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("canteen_registrations_updated", handleSync);
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await canteenService.getAdminDashboard({ date, view });
      if (res?.success && res?.data) {
        setData(res.data);
      }
    } catch (error) {
      console.warn('Using local mock dashboard data');
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const viewData = MOCK_DATA_BY_VIEW[view] || MOCK_DATA_BY_VIEW.day;

  const dynamicStats = useMemo(() => {
    const baseCards = data?.cards || viewData.cards;

    let addedBreakfast = 0;
    let addedLunch = 0;
    let addedDinner = 0;

    const startOfPeriod =
      view === "day"
        ? moment(date).startOf("day")
        : view === "week"
        ? moment(date).startOf("isoWeek")
        : moment(date).startOf("month");

    const endOfPeriod =
      view === "day"
        ? moment(date).endOf("day")
        : view === "week"
        ? moment(date).endOf("isoWeek")
        : moment(date).endOf("month");

    (customRegs || []).forEach((reg) => {
      if (String(reg?.status || "").toLowerCase() === "cancelled") return;
      const regDate = moment(reg?.date);
      if (!regDate.isValid()) return;
      if (regDate.isBetween(startOfPeriod, endOfPeriod, null, "[]")) {
        const sids = (reg.meal_sessions || reg.items || [])
          .map((s) => Number(s.id || s.meal_session_id || s.mealSessionId))
          .concat(reg.mealSessionIds || []);
        const uniqueSids = new Set(sids.filter(Boolean));
        if (uniqueSids.has(1)) addedBreakfast += 1;
        if (uniqueSids.has(2)) addedLunch += 1;
        if (uniqueSids.has(3)) addedDinner += 1;
      }
    });

    const totalAdded = addedBreakfast + addedLunch + addedDinner;

    return {
      cards: {
        breakfast: {
          value: (baseCards.breakfast?.value || 0) + addedBreakfast,
          delta: (baseCards.breakfast?.delta || 0) + addedBreakfast,
        },
        lunch: {
          value: (baseCards.lunch?.value || 0) + addedLunch,
          delta: (baseCards.lunch?.delta || 0) + addedLunch,
        },
        dinner: {
          value: (baseCards.dinner?.value || 0) + addedDinner,
          delta: (baseCards.dinner?.delta || 0) + addedDinner,
        },
        total: {
          value: (baseCards.total?.value || 0) + totalAdded,
          delta: (baseCards.total?.delta || 0) + totalAdded,
        },
      },
    };
  }, [data, viewData, customRegs, date, view]);

  const displayCards = dynamicStats.cards;

  const displayTrend = useMemo(() => {
    if (view === "day") {
      return [
        { label: "06:30 - 08:00 (Sáng)", total: displayCards.breakfast.value },
        { label: "11:00 - 13:00 (Trưa)", total: displayCards.lunch.value },
        { label: "17:30 - 19:00 (Tối)", total: displayCards.dinner.value },
      ];
    }
    return data?.trend
      ? data.trend.map((t) => ({ ...t, label: moment(t.date).format("DD/MM") }))
      : viewData.trend;
  }, [view, displayCards, data, viewData]);

  const displayDepartment = data?.departmentDistribution || viewData.departmentDistribution;
  const displayStatusRatio = data?.statusRatio || viewData.statusRatio;

  const combinedRows = useMemo(() => {
    const userRegsForDay = (customRegs || []).filter((r) => {
      if (String(r?.status || "").toLowerCase() === "cancelled") return false;
      const rDate = moment(r?.date).format("YYYY-MM-DD");
      const targetDate = moment(date).format("YYYY-MM-DD");
      return rDate === targetDate;
    });

    const otherUsersList = MOCK_TODAY_ROWS.filter((r) => r.userName !== "Nguyễn Văn An");

    let myRows = [];
    if (userRegsForDay.length > 0) {
      userRegsForDay.forEach((reg) => {
        const sids = (reg.meal_sessions || reg.items || [])
          .map((s) => Number(s.id || s.meal_session_id || s.mealSessionId))
          .concat(reg.mealSessionIds || []);
        const uniqueSids = Array.from(new Set(sids.filter(Boolean))).sort();

        const userMeals = [];
        if (uniqueSids.includes(1)) userMeals.push({ slot: "breakfast", name: "Sáng", id: 1 });
        if (uniqueSids.includes(2)) userMeals.push({ slot: "lunch", name: "Trưa", id: 2 });
        if (uniqueSids.includes(3)) userMeals.push({ slot: "dinner", name: "Tối", id: 3 });

        if (userMeals.length > 0) {
          myRows.push({
            userName: "Nguyễn Văn An (Tôi)",
            departmentName: "Phòng Công nghệ Thông tin",
            meals: userMeals,
            note: reg.note || "Đăng ký của Tôi",
          });
        }
      });
    } else {
      myRows.push({
        userName: "Nguyễn Văn An (Tôi)",
        departmentName: "Phòng Công nghệ Thông tin",
        meals: [
          { slot: "breakfast", name: "Sáng", id: 1 },
          { slot: "lunch", name: "Trưa", id: 2 },
        ],
        note: "Ăn tại bếp Cảng",
      });
    }

    return [...myRows, ...otherUsersList].map((row, i) => ({
      ...row,
      stt: i + 1,
    }));
  }, [customRegs, date]);

  const filteredRows = useMemo(() => {
    return combinedRows.filter((row) => {
      const matchesKeyword =
        !searchKeyword ||
        row.userName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.departmentName.toLowerCase().includes(searchKeyword.toLowerCase());

      const hasBreakfast = (row.meals || []).some(
        (m) =>
          m.slot === "breakfast" ||
          m.id === 1 ||
          m.meal_session_id === 1 ||
          String(m.name || m.slot).toLowerCase().includes("sáng") ||
          String(m.name || m.slot).toLowerCase().includes("breakfast")
      );
      const hasLunch = (row.meals || []).some(
        (m) =>
          m.slot === "lunch" ||
          m.id === 2 ||
          m.meal_session_id === 2 ||
          String(m.name || m.slot).toLowerCase().includes("trưa") ||
          String(m.name || m.slot).toLowerCase().includes("lunch")
      );
      const hasDinner = (row.meals || []).some(
        (m) =>
          m.slot === "dinner" ||
          m.id === 3 ||
          m.meal_session_id === 3 ||
          String(m.name || m.slot).toLowerCase().includes("tối") ||
          String(m.name || m.slot).toLowerCase().includes("dinner")
      );

      let matchesSlot = true;
      if (slotFilter === "breakfast") matchesSlot = hasBreakfast;
      else if (slotFilter === "lunch") matchesSlot = hasLunch;
      else if (slotFilter === "dinner") matchesSlot = hasDinner;

      return matchesKeyword && matchesSlot;
    });
  }, [combinedRows, searchKeyword, slotFilter]);

  const handlePrevDate = () => {
    setDate((prev) => moment(prev).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const handleNextDate = () => {
    setDate((prev) => moment(prev).add(1, 'day').format('YYYY-MM-DD'));
  };

  const handleTodayDate = () => {
    setDate(moment().format('YYYY-MM-DD'));
    setView('day');
  };

  const getRangeLabel = () => {
    if (view === 'day') return `Ngày ${moment(date).format('DD/MM/YYYY')}`;
    if (view === 'week') return `Tuần này (${moment(date).startOf('week').format('DD/MM')} → ${moment(date).endOf('week').format('DD/MM/YYYY')})`;
    return `Tháng ${moment(date).format('MM/YYYY')}`;
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', pb: 8 }}>
      <Container maxWidth='xl' sx={{ py: 2.5, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2.5} flexWrap='wrap' gap={1.5}>
        <Box>
          <Typography fontSize={32} fontWeight={800}>
            Dashboard Tổng hợp Suất ăn
          </Typography>
          <Typography color='text.secondary'>
            {getRangeLabel()} • Cập nhật realtime lúc {moment().format('HH:mm:ss')}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' alignItems='center'>
          <Button variant='outlined' size='small' onClick={handlePrevDate} sx={{ minWidth: 36, px: 1 }}>
            &lt;
          </Button>
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <Button variant='outlined' size='small' onClick={handleNextDate} sx={{ minWidth: 36, px: 1 }}>
            &gt;
          </Button>
          <Select size='small' value={view} onChange={(e) => setView(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value='day'>Hôm nay</MenuItem>
            <MenuItem value='week'>Tuần này</MenuItem>
            <MenuItem value='month'>Tháng này</MenuItem>
          </Select>
          <Button variant={view === 'day' && date === moment().format('YYYY-MM-DD') ? 'contained' : 'outlined'} size='small' onClick={handleTodayDate}>
            Hôm nay
          </Button>
          <Button variant='contained' color='primary' size='small' onClick={() => navigate('/canteen/menu-setup')}>
            Thiết lập menu
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn sáng' value={displayCards?.breakfast?.value || 0} delta={displayCards?.breakfast?.delta || 0} border='#F59E0B' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn trưa' value={displayCards?.lunch?.value || 0} delta={displayCards?.lunch?.delta || 0} border='#10B981' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Suất ăn tối' value={displayCards?.dinner?.value || 0} delta={displayCards?.dinner?.delta || 0} border='#8B5CF6' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title='Tổng suất ăn' value={displayCards?.total?.value || 0} delta={displayCards?.total?.delta || 0} border='#3B82F6' />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1}>
              <Typography fontWeight={800} fontSize={20}>Xu hướng suất ăn ({view === 'day' ? 'Theo ca' : view === 'week' ? 'Theo ngày' : 'Theo tuần'})</Typography>
              <Chip label={getRangeLabel()} size='small' color='primary' variant='outlined' />
            </Stack>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={displayTrend}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='label' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='total' fill='#3B82F6' radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.2, borderRadius: 2.5, height: '100%' }}>
            <Typography fontWeight={800} fontSize={20} mb={1.2}>Phân bổ theo Bộ phận</Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={displayDepartment} dataKey='count' nameKey='name' cx='50%' cy='50%' outerRadius={75}>
                    {displayDepartment.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {(displayDepartment || []).map((d, idx) => (
              <Stack key={`${d.name}-${idx}`} direction='row' justifyContent='space-between' mb={0.5}>
                <Typography fontSize={12}>{d.name}</Typography>
                <Typography fontSize={12} fontWeight={700}>
                  {d.count.toLocaleString()} ({d.percent}%)
                </Typography>
              </Stack>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tỷ lệ đăng ký</Typography>
            <Typography fontSize={28} fontWeight={800} color='success.main'>{displayStatusRatio?.registeredRate || 0}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tỷ lệ hủy</Typography>
            <Typography fontSize={28} fontWeight={800} color='warning.main'>{displayStatusRatio?.cancelledRate || 0}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2.5 }}>
            <Typography fontSize={13} color='text.secondary'>Tự động cắt (công tác/nghỉ)</Typography>
            <Typography fontSize={28} fontWeight={800} color='error.main'>{displayStatusRatio?.autoCutRate || 0}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1.5} flexWrap='wrap' gap={1}>
          <Typography fontWeight={800} fontSize={20}>Danh sách đăng ký ({getRangeLabel()})</Typography>
          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
            <input
              type='text'
              placeholder='Tìm tên, phòng ban...'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                minWidth: 180,
              }}
            />
            <Stack direction='row' spacing={0.5}>
              <Chip
                label='Tất cả ca'
                clickable
                color={slotFilter === 'ALL' ? 'primary' : 'default'}
                onClick={() => setSlotFilter('ALL')}
                size='small'
              />
              <Chip
                label='Sáng'
                clickable
                color={slotFilter === 'breakfast' ? 'warning' : 'default'}
                onClick={() => setSlotFilter('breakfast')}
                size='small'
              />
              <Chip
                label='Trưa'
                clickable
                color={slotFilter === 'lunch' ? 'success' : 'default'}
                onClick={() => setSlotFilter('lunch')}
                size='small'
              />
              <Chip
                label='Tối'
                clickable
                color={slotFilter === 'dinner' ? 'secondary' : 'default'}
                onClick={() => setSlotFilter('dinner')}
                size='small'
              />
            </Stack>
            <Button variant='contained' size='small' onClick={() => navigate('/canteen/registrations')}>
              Đăng ký suất ăn
            </Button>
          </Stack>
        </Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bộ phận</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bữa ăn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                    Không tìm thấy nhân viên phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={`${row.stt}-${row.userName}`} hover>
                    <TableCell>{row.stt}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.userName}</TableCell>
                    <TableCell>{row.departmentName || '-'}</TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={0.8} flexWrap='wrap'>
                        {(row.meals || []).map((m, idx) => {
                          const isBreakfast =
                            m.slot === "breakfast" ||
                            m.id === 1 ||
                            m.meal_session_id === 1 ||
                            String(m.name || m.slot).toLowerCase().includes("sáng");
                          const isLunch =
                            m.slot === "lunch" ||
                            m.id === 2 ||
                            m.meal_session_id === 2 ||
                            String(m.name || m.slot).toLowerCase().includes("trưa");
                          const isDinner =
                            m.slot === "dinner" ||
                            m.id === 3 ||
                            m.meal_session_id === 3 ||
                            String(m.name || m.slot).toLowerCase().includes("tối");

                          const label = isBreakfast
                            ? "Sáng"
                            : isLunch
                            ? "Trưa"
                            : isDinner
                            ? "Tối"
                            : m.name || "Bữa ăn";
                          const color = isBreakfast
                            ? "warning"
                            : isLunch
                            ? "success"
                            : "secondary";

                          return (
                            <Chip
                              key={`${row.stt}-${idx}`}
                              label={label}
                              size='small'
                              color={color}
                              variant='outlined'
                              sx={{ fontWeight: 700, borderRadius: 1.5 }}
                            />
                          );
                        })}
                      </Stack>
                    </TableCell>
                    <TableCell>{row.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Container>
  </Box>
);
};

export default CanteenAdminDashboardPage;
