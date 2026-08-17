import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  Stack, 
  TextField, 
  MenuItem, 
  Button, 
  InputAdornment, 
  Typography,
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  RestartAlt as ResetIcon, 
  FilterAlt as FilterIcon 
} from '@mui/icons-material';

const FilterField = ({ label, children, sx }) => (
  <Stack spacing={0.6} sx={{ flex: 1, minWidth: 100, ...sx }}>
    <Typography variant="caption" fontWeight={700} sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>
      {label}
    </Typography>
    {children}
  </Stack>
);

const FilterBar = ({ onFilter, filters, categories }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    onFilter(localFilters);
  };

  const handleReset = () => {
    const initialFilters = {
      fromDate: '',
      toDate: '',
      department: 'All',
      category: 'All',
      keyword: '',
      period: 'current_month'
    };
    setLocalFilters(initialFilters);
    onFilter(initialFilters);
  };

  const inputStyle = {
    '& .MuiInputBase-root': { 
      borderRadius: '8px', 
      backgroundColor: '#f8fafc',
      height: 40,
      fontSize: 14,
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' }
    }
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        p: 2.5, 
        mb: 4, 
        borderRadius: '16px', 
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
      }}
    >
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={2.5} 
        alignItems="flex-end"
      >
        <FilterField label="Kỳ báo cáo" sx={{ minWidth: 160 }}>
          <TextField
            select
            name="period"
            value={localFilters.period || 'current_month'}
            onChange={handleChange}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="current_month">Tháng này (3/2026)</MenuItem>
            <MenuItem value="last_month">Tháng trước (2/2026)</MenuItem>
            <MenuItem value="quarter">Quý 1/2026</MenuItem>
          </TextField>
        </FilterField>

        <FilterField label="Phòng ban" sx={{ minWidth: 200 }}>
          <TextField
            select
            name="department"
            value={localFilters.department}
            onChange={handleChange}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="All">Tất cả phòng ban</MenuItem>
            <MenuItem value="CNT">Phòng CNTT</MenuItem>
            <MenuItem value="MKT">Phòng Marketing</MenuItem>
            <MenuItem value="HC">Phòng Hành chính</MenuItem>
          </TextField>
        </FilterField>

        <FilterField label="Nhóm hàng" sx={{ minWidth: 160 }}>
          <TextField
            select
            name="category"
            value={localFilters.category}
            onChange={handleChange}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="All">Tất cả nhóm</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        
        <FilterField label="Tìm kiếm nhanh" sx={{ flex: 2 }}>
          <TextField
            placeholder="Tên mặt hàng, mã hàng..."
            name="keyword"
            value={localFilters.keyword}
            onChange={handleChange}
            size="small"
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={inputStyle}
          />
        </FilterField>

        <Stack direction="row" spacing={1} sx={{ height: 40 }}>
          <Button 
            variant="contained" 
            disableElevation
            startIcon={<FilterIcon />}
            onClick={handleFilter}
            sx={{ 
              borderRadius: '8px', 
              px: 3,
              backgroundColor: '#2563eb',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 6px -2px rgba(37, 99, 235, 0.2)',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            Lọc báo cáo
          </Button>
          <Button 
            variant="text" 
            startIcon={<ResetIcon />}
            onClick={handleReset}
            sx={{ 
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
          >
            Đặt lại
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default FilterBar;
