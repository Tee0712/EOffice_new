import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  Box,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterAltOutlined as FilterIcon,
  RestartAlt as ResetIcon 
} from '@mui/icons-material';

const FilterBar = ({ filters: parentFilters, onFilter, onReset }) => {
  // Local state to hold input values before clicking "Lọc"
  const [localFilters, setLocalFilters] = useState(parentFilters);

  // Sync with parent filters when they change (e.g., on Reset)
  useEffect(() => {
    setLocalFilters(parentFilters);
  }, [parentFilters]);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilter = () => {
    onFilter(localFilters);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        mb: 3, 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0',
        bgcolor: '#f8fafc'
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo tên, mã hoặc MST..."
            value={localFilters.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              sx: { bgcolor: 'white' }
            }}
          />
        </Grid>
        <Grid item xs={12} md={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Trạng thái HĐ</InputLabel>
            <Select
              value={localFilters.status}
              label="Trạng thái HĐ"
              onChange={(e) => handleChange('status', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="ACTIVE">Đang hiệu lực</MenuItem>
              <MenuItem value="EXPIRING_SOON">Sắp hết hạn</MenuItem>
              <MenuItem value="EXPIRED">Hết hạn</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Đánh giá</InputLabel>
            <Select
              value={localFilters.rating}
              label="Đánh giá"
              onChange={(e) => handleChange('rating', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="HIGH">5 sao</MenuItem>
              <MenuItem value="MID">Trên 4 sao</MenuItem>
              <MenuItem value="LOW">Trên 3 sao</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              fullWidth
              variant="contained" 
              startIcon={<FilterIcon />}
              onClick={handleApplyFilter}
              sx={{ 
                bgcolor: '#1890ff', 
                textTransform: 'none',
                height: '40px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                '&:hover': { bgcolor: '#40a9ff' }
              }}
            >
              Lọc
            </Button>
            <Button 
              fullWidth
              variant="outlined" 
              startIcon={<ResetIcon />}
              onClick={onReset}
              sx={{ 
                color: '#64748b', 
                borderColor: '#cbd5e1',
                textTransform: 'none',
                height: '40px',
                fontWeight: 600,
                bgcolor: 'white',
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' }
              }}
            >
              Reset
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterBar;
