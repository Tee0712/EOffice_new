import React from 'react';
import { Box, TextField, MenuItem, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const FilterBar = ({ filters, onFilterChange, departments }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <TextField
        placeholder="Tìm theo tên, email..."
        size="small"
        value={filters.keyword}
        onChange={(e) => onFilterChange('keyword', e.target.value)}
        sx={{ flexGrow: 1, minWidth: '250px' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        select
        size="small"
        label="Bộ phận"
        value={filters.dept}
        onChange={(e) => onFilterChange('dept', e.target.value)}
        sx={{ minWidth: '180px' }}
      >
        <MenuItem value="">Tất cả bộ phận</MenuItem>
        {departments.map((dept) => (
          <MenuItem key={dept.id} value={dept.id}>{dept.name || dept.id}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Bữa ăn"
        value={filters.slot}
        onChange={(e) => onFilterChange('slot', e.target.value)}
        sx={{ minWidth: '150px' }}
      >
        <MenuItem value="">Tất cả bữa</MenuItem>
        <MenuItem value="breakfast">Bữa sáng</MenuItem>
        <MenuItem value="lunch">Bữa trưa</MenuItem>
        <MenuItem value="dinner">Bữa tối</MenuItem>
      </TextField>
    </Box>
  );
};

export default FilterBar;
