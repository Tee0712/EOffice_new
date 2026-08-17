/**
 * Filter Bar Component - Thanh lọc
 */
import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';

const FilterBar = ({
  filters,
  onChange,
  showDateRange = true,
  showStatus = true,
  showQuickChips = false,
  quickChipOptions = [],
}) => {
  const defaultQuickChips = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
  ];

  const chips = quickChipOptions.length > 0 ? quickChipOptions : defaultQuickChips;

  const handleQuickChipClick = (value) => {
    const today = dayjs();
    switch (value) {
      case 'today':
        onChange({
          ...filters,
          start_date: today.format('YYYY-MM-DD'),
          end_date: today.format('YYYY-MM-DD'),
        });
        break;
      case 'week':
        onChange({
          ...filters,
          start_date: today.startOf('week').format('YYYY-MM-DD'),
          end_date: today.endOf('week').format('YYYY-MM-DD'),
        });
        break;
      case 'month':
        onChange({
          ...filters,
          start_date: today.startOf('month').format('YYYY-MM-DD'),
          end_date: today.endOf('month').format('YYYY-MM-DD'),
        });
        break;
      default:
        break;
    }
  };

  const handleDateChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {/* Date Range */}
        {showDateRange && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <TextField
              type="date"
              size="small"
              label="Từ ngày"
              value={filters.start_date || ''}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <Typography color="text.secondary">-</Typography>
            <TextField
              type="date"
              size="small"
              label="Đến ngày"
              value={filters.end_date || ''}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
          </Stack>
        )}

        {/* Status Filter */}
        {showStatus && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={filters.status || ''}
              label="Trạng thái"
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="upcoming">Sắp tới</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="completed">Đã hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
              <MenuItem value="auto_cut">Tự động cắt</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Quick Chips */}
        {showQuickChips && (
          <Stack direction="row" spacing={1}>
            {chips.map((chip) => (
              <Chip
                key={chip.value}
                label={chip.label}
                onClick={() => handleQuickChipClick(chip.value)}
                variant="outlined"
                size="small"
                icon={<FilterListIcon sx={{ fontSize: 16 }} />}
              />
            ))}
          </Stack>
        )}

        {/* Search */}
        <TextField
          size="small"
          placeholder="Tìm kiếm..."
          value={filters.keyword || ''}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ flexGrow: 1, maxWidth: 300 }}
        />
      </Stack>
    </Box>
  );
};

export default FilterBar;
