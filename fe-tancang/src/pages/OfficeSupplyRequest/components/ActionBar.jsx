import React, { useState, useEffect } from 'react';
import { 
  Box, Stack, TextField, InputAdornment, 
  MenuItem, IconButton, Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import useDebounce from '../../../hooks/useDebounce';
import { getGoodsIssueDepartments } from '../../../services/vppService';

const ActionBar = ({ filters, onFilterChange, onRefresh }) => {
  const [localSearch, setLocalSearch] = React.useState(filters.keyword || '');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getGoodsIssueDepartments();
        if (res?.success) {
          setDepartments(res.data || []);
        }
      } catch (e) {
        console.error("Fetch departments error:", e);
      }
    };
    fetchDepts();
  }, []);

  const debouncedSearch = useDebounce((val) => {
    onFilterChange('keyword', val);
  }, 500);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  React.useEffect(() => {
    setLocalSearch(filters.keyword || '');
  }, [filters.keyword]);

  return (
    <Box 
      sx={{ 
        mb: 3, 
        bgcolor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0', 
        p: 2 
      }}
    >
      <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
        {/* Search Bar */}
        <TextField
          placeholder="Tìm theo mã phiếu, người đề nghị..."
          size="small"
          fullWidth
          value={localSearch}
          onChange={handleSearchChange}
          sx={{ 
            bgcolor: '#f8fafc',
            flexGrow: 1, 
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a73e8' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            )
          }}
        />

        {/* Filters Group */}
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <TextField
            select
            size="small"
            value={filters.department || 'all'}
            onChange={(e) => onFilterChange('department', e.target.value)}
            sx={{ 
              width: 220, 
              bgcolor: '#f8fafc', 
              '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } 
            }}
            SelectProps={{ IconComponent: ArrowDownIcon }}
          >
            <MenuItem value="all">Tất cả phòng ban</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.name} value={dept.name}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            value={filters.timeRange || 'month'}
            onChange={(e) => onFilterChange('timeRange', e.target.value)}
            sx={{ 
              width: 160, 
              bgcolor: '#f8fafc',
              '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } 
            }}
            SelectProps={{ IconComponent: ArrowDownIcon }}
          >
             <MenuItem value="all">Tất cả thời gian</MenuItem>
            <MenuItem value="today">Hôm nay</MenuItem>
            <MenuItem value="week">Tuần này</MenuItem>
            <MenuItem value="month">Tháng này</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            sx={{ 
              width: 160, 
              bgcolor: '#f8fafc',
              '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } 
            }}
            SelectProps={{ IconComponent: ArrowDownIcon }}
          >
            <MenuItem value="all">Tất cả ưu tiên</MenuItem>
            <MenuItem value="Bình thường">Bình thường</MenuItem>
            <MenuItem value="Khẩn">Gấp</MenuItem>
          </TextField>

          <Tooltip title="Làm mới">
            <IconButton 
              onClick={onRefresh} 
              sx={{ 
                bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', p: '8.5px',
                '&:hover': { bgcolor: 'white', color: '#1a73e8' }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ActionBar;
