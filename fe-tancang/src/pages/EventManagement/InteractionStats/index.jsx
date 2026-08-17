import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  getEventInteractionStats,
  getEvents,
  getEventSatisfactionSurvey,
  submitEventSatisfactionResponse,
  upsertEventSatisfactionSurvey,
} from '@services/eventManagementService';

const DEFAULT_SURVEY_FORM = {
  title: 'Khảo sát mức độ hài lòng sau sự kiện',
  question: 'Bạn hài lòng với chất lượng tổ chức sự kiện ở mức nào?',
  optionsText: 'Nội dung chương trình\nKhâu tổ chức\nCông tác truyền thông\nTrải nghiệm tổng thể',
  isActive: true,
  allowComment: true,
  isAnonymous: false,
};

const ratingLabels = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

const formFieldSx = {
  '& .MuiOutlinedInput-input': {
    lineHeight: 1.45,
    py: 1.25,
  },
  '& .MuiOutlinedInput-inputMultiline': {
    lineHeight: 1.5,
    py: 1.25,
  },
};

const plainTextareaSx = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid #b9c2cf',
  padding: '12px 14px',
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: 'inherit',
  color: '#0f172a',
  backgroundColor: '#fff',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const StatCard = ({ title, value, subtitle, color = '#1d4ed8' }) => (
  <Card variant="outlined" sx={{ borderRadius: 2, borderColor: '#dbeafe' }}>
    <CardContent sx={{ pb: '16px !important' }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.15, mt: 0.6 }}>
        {value}
      </Typography>
      {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
    </CardContent>
  </Card>
);

const InteractionStatsPage = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [surveyForm, setSurveyForm] = useState(DEFAULT_SURVEY_FORM);
  const [responseForm, setResponseForm] = useState({
    ratingValue: 0,
    selectedOption: '',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadDetail(selectedEventId);
    }
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((item) => String(item.id) === String(selectedEventId)) || null,
    [events, selectedEventId],
  );

  const surveyOptions = useMemo(() => {
    const options = surveyData?.survey?.options;
    return Array.isArray(options) ? options : [];
  }, [surveyData?.survey?.options]);

  const loadEvents = async () => {
    try {
      const res = await getEvents({ page: 0, size: 200 });
      const items = Array.isArray(res?.data) ? res.data : [];
      setEvents(items);
      if (items.length > 0) {
        const queryEventId = searchParams.get('eventId');
        const hasQuery = queryEventId && items.some((item) => String(item.id) === String(queryEventId));
        setSelectedEventId(String(hasQuery ? queryEventId : items[0].id));
      }
    } catch {
      setEvents([]);
      setError('Không tải được danh sách sự kiện.');
    }
  };

  const loadDetail = async (eventId) => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, surveyRes] = await Promise.all([
        getEventInteractionStats(eventId),
        getEventSatisfactionSurvey(eventId),
      ]);
      setStats(statsRes?.data || null);
      setSurveyData(surveyRes?.data || null);

      const survey = surveyRes?.data?.survey;
      const currentUserResponse = surveyRes?.data?.currentUserResponse;
      if (survey) {
        setSurveyForm({
          title: survey.title || DEFAULT_SURVEY_FORM.title,
          question: survey.question || DEFAULT_SURVEY_FORM.question,
          optionsText: Array.isArray(survey.options) ? survey.options.join('\n') : '',
          isActive: survey.isActive ?? true,
          allowComment: survey.allowComment ?? true,
          isAnonymous: survey.isAnonymous ?? false,
        });
      } else {
        setSurveyForm(DEFAULT_SURVEY_FORM);
      }

      if (currentUserResponse) {
        setResponseForm({
          ratingValue: Number(currentUserResponse.ratingValue || 0),
          selectedOption: currentUserResponse.selectedOption || '',
          comment: currentUserResponse.comment || '',
        });
      } else {
        setResponseForm({ ratingValue: 0, selectedOption: '', comment: '' });
      }
    } catch {
      setStats(null);
      setSurveyData(null);
      setError('Không tải được thống kê tương tác hoặc khảo sát.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurvey = async () => {
    if (!selectedEventId) return;
    setSavingSurvey(true);
    setError('');
    try {
      const options = surveyForm.optionsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      await upsertEventSatisfactionSurvey(selectedEventId, {
        title: surveyForm.title.trim(),
        question: surveyForm.question.trim(),
        options,
        isActive: surveyForm.isActive,
        allowComment: surveyForm.allowComment,
        isAnonymous: surveyForm.isAnonymous,
      });
      await loadDetail(selectedEventId);
    } catch (e) {
      setError(e?.response?.data?.message || 'Lưu khảo sát thất bại.');
    } finally {
      setSavingSurvey(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedEventId) return;
    if (!responseForm.ratingValue) {
      setError('Vui lòng chọn mức điểm hài lòng từ 1 đến 5.');
      return;
    }
    setSubmittingResponse(true);
    setError('');
    try {
      await submitEventSatisfactionResponse(selectedEventId, {
        ratingValue: Number(responseForm.ratingValue),
        selectedOption: responseForm.selectedOption || undefined,
        comment: responseForm.comment || undefined,
      });
      await loadDetail(selectedEventId);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gửi phản hồi thất bại.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const distribution = surveyData?.stats?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalResponses = Number(surveyData?.stats?.totalResponses || 0);

  return (
    <Box sx={{ p: 3, bgcolor: '#f3f6fb', minHeight: '100vh' }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Thống kê tương tác sự kiện</Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi mức độ phản hồi thông báo và khảo sát hài lòng nội bộ
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: { xs: '100%', md: 360 } }} size="small">
            <InputLabel>Sự kiện</InputLabel>
            <Select value={selectedEventId} label="Sự kiện" onChange={(e) => setSelectedEventId(e.target.value)}>
              {events.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ` : ''}{item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={2.4}><StatCard title="Thông báo đã gửi" value={stats?.notifications?.sent ?? 0} subtitle={`Tổng: ${stats?.notifications?.total ?? 0}`} /></Grid>
          <Grid item xs={12} md={2.4}><StatCard title="Xác nhận tham dự" value={stats?.confirmations?.confirmed ?? 0} subtitle={`Tỷ lệ: ${stats?.confirmations?.confirmationRate ?? 0}%`} color="#16a34a" /></Grid>
          <Grid item xs={12} md={2.4}><StatCard title="Từ chối tham dự" value={stats?.confirmations?.declined ?? 0} subtitle={`Chờ phản hồi: ${stats?.confirmations?.pending ?? 0}`} color="#dc2626" /></Grid>
          <Grid item xs={12} md={2.4}><StatCard title="Khách đã đăng ký" value={stats?.guests?.registered ?? 0} color="#ea580c" /></Grid>
          <Grid item xs={12} md={2.4}><StatCard title="Điểm tương tác" value={`${stats?.engagementScore ?? 0}/100`} color="#7c3aed" /></Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="h6" fontWeight={800}>Cấu hình khảo sát hài lòng</Typography>
                  {surveyData?.survey ? <Chip label="Đã thiết lập" color="success" size="small" /> : <Chip label="Chưa thiết lập" size="small" />}
                </Stack>
                <Stack spacing={1.3}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Tiêu đề khảo sát
                  </Typography>
                  <TextField
                    placeholder="Nhập tiêu đề khảo sát"
                    size="small"
                    value={surveyForm.title}
                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, title: e.target.value }))}
                    sx={formFieldSx}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Câu hỏi chính
                  </Typography>
                  <TextField
                    placeholder="Nhập câu hỏi khảo sát"
                    size="small"
                    multiline
                    minRows={2}
                    value={surveyForm.question}
                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, question: e.target.value }))}
                    sx={formFieldSx}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Danh mục đánh giá (mỗi dòng 1 mục)
                  </Typography>
                  <Box
                    component="textarea"
                    rows={4}
                    placeholder="Ví dụ: Nội dung chương trình"
                    value={surveyForm.optionsText}
                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, optionsText: e.target.value }))}
                    sx={plainTextareaSx}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <FormControlLabel control={<Switch checked={surveyForm.isActive} onChange={(e) => setSurveyForm((prev) => ({ ...prev, isActive: e.target.checked }))} />} label="Kích hoạt khảo sát" />
                    <FormControlLabel control={<Switch checked={surveyForm.allowComment} onChange={(e) => setSurveyForm((prev) => ({ ...prev, allowComment: e.target.checked }))} />} label="Cho phép góp ý" />
                    <FormControlLabel control={<Switch checked={surveyForm.isAnonymous} onChange={(e) => setSurveyForm((prev) => ({ ...prev, isAnonymous: e.target.checked }))} />} label="Ẩn danh" />
                  </Stack>

                  <Button variant="contained" onClick={handleSaveSurvey} disabled={savingSurvey || !selectedEventId}>
                    {savingSurvey ? 'Đang lưu...' : 'Lưu cấu hình khảo sát'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={1}>Gửi phản hồi hài lòng</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    {surveyData?.survey?.question || 'Chưa có khảo sát cho sự kiện này.'}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Chip
                        key={value}
                        clickable
                        color={Number(responseForm.ratingValue) === value ? 'primary' : 'default'}
                        label={`${value} - ${ratingLabels[value]}`}
                        onClick={() => setResponseForm((prev) => ({ ...prev, ratingValue: value }))}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>

                  {surveyOptions.length > 0 ? (
                    <FormControl fullWidth size="small" sx={{ mb: 1.2 }}>
                      <InputLabel>Danh mục bạn quan tâm</InputLabel>
                      <Select
                        value={responseForm.selectedOption}
                        label="Danh mục bạn quan tâm"
                        onChange={(e) => setResponseForm((prev) => ({ ...prev, selectedOption: e.target.value }))}
                      >
                        {surveyOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : null}

                  {surveyData?.survey?.allowComment ? (
                    <>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Ý kiến bổ sung
                      </Typography>
                      <Box
                        component="textarea"
                        rows={3}
                        placeholder="Nhập góp ý thêm (không bắt buộc)"
                        value={responseForm.comment}
                        onChange={(e) => setResponseForm((prev) => ({ ...prev, comment: e.target.value }))}
                        sx={plainTextareaSx}
                      />
                    </>
                  ) : null}

                  <Button
                    sx={{ mt: 1.5 }}
                    variant="contained"
                    color="success"
                    onClick={handleSubmitResponse}
                    disabled={submittingResponse || !surveyData?.survey?.isActive}
                  >
                    {submittingResponse ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </Button>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={1}>Phân bổ điểm hài lòng</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Trung bình: <strong>{surveyData?.stats?.averageRating ?? 0}/5</strong> · Tổng phản hồi: <strong>{totalResponses}</strong>
                  </Typography>
                  <Stack spacing={1}>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = Number(distribution?.[rating] || 0);
                      const percent = totalResponses ? Math.round((count / totalResponses) * 100) : 0;
                      return (
                        <Box key={`dist-${rating}`}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{rating} sao</Typography>
                            <Typography variant="body2" fontWeight={700}>{count} ({percent}%)</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 999 }} />
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {loading ? <LinearProgress /> : null}
        {selectedEvent ? (
          <Typography variant="caption" color="text.secondary">
            Đang xem dữ liệu cho sự kiện: {selectedEvent.code ? `${selectedEvent.code} - ` : ''}{selectedEvent.name}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
};

export default InteractionStatsPage;
