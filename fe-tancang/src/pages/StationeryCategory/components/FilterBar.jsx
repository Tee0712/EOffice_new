import React, { useState, useEffect } from "react";
import { 
  Box, Stack, TextField, InputAdornment, MenuItem, 
  Select, FormControl, ToggleButtonGroup, ToggleButton, Card 
} from "@mui/material";
import { Search as SearchIcon, ViewList, GridViewOutlined } from "@mui/icons-material";
import useDebounce from "../../../hooks/useDebounce";

const FilterBar = ({ filters, categories = [], onFilterChange, view, onViewChange }) => {
  const [localSearch, setLocalSearch] = useState(filters?.search || "");
  
  const debouncedSearch = useDebounce((val) => {
    onFilterChange("search", val);
  }, 500);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };
  
  // Update localSearch if filters.search changes from outside
  useEffect(() => {
    setLocalSearch(filters?.search || "");
  }, [filters?.search]);

  const handleGroupChange = (e) => {
    onFilterChange("categoryId", e.target.value);
  };

  const handleStatusChange = (e) => {
    onFilterChange("status", e.target.value);
  };

  const handleViewChange = (event, nextView) => {
    if (nextView !== null && onViewChange) {
      onViewChange(nextView);
    }
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, p: 1.5 }}>
      <Stack 
        direction={{ xs: "column", md: "row" }} 
        justifyContent="space-between" 
        alignItems="center" 
        spacing={2}
      >
        {/* Khối Tìm kiếm linh hoạt chiều dài */}
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 400 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo tên, mã mặt hàng..."
            value={localSearch}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              sx: {
                bgcolor: "#f0f2f5",
                borderRadius: 1.5,
                "& fieldset": { border: "none" },
                fontSize: 14,
              }
            }}
          />
        </Box>

        {/* Khối Bộ lọc bên phải */}
        <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select 
              value={filters?.categoryId || "all"} 
              onChange={handleGroupChange}
              displayEmpty
              sx={{ 
                borderRadius: 1.5, 
                bgcolor: "#f8f9fb",
                color: "text.primary",
                "& fieldset": { borderColor: "grey.200" },
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MenuItem value="all">Tất cả nhóm hàng</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select 
              value={filters?.status || "all"} 
              onChange={handleStatusChange}
              displayEmpty
              sx={{ 
                borderRadius: 1.5, 
                bgcolor: "#f8f9fb",
                color: "text.primary",
                "& fieldset": { borderColor: "grey.200" },
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="hidden">Đã ẩn</MenuItem>
            </Select>
          </FormControl>

          {/* Toggle Button Group */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '1px', height: 24, bgcolor: 'grey.300', mx: 1 }} />
            <ToggleButtonGroup
              size="small"
              value={view}
              exclusive
              onChange={handleViewChange}
              sx={{
                bgcolor: "#f8f9fb",
                "& .MuiToggleButton-root": {
                  border: "1px solid",
                  borderColor: "grey.200",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                },
                "& .Mui-selected": {
                  bgcolor: "#255df2 !important",
                  color: "#fff !important",
                }
              }}
            >
              <ToggleButton value="list" aria-label="list view">
                <ViewList fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewOutlined fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
};

export default FilterBar;
