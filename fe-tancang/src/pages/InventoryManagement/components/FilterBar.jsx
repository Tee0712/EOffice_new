import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  Stack
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { fetchVPPCategories } from "../../../services/inventoryService";
import useDebounce from "../../../hooks/useDebounce";

const FilterBar = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState(filters.keyword || "");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchVPPCategories();
        if (res?.success && res.data?.items) {
          setCategories(res.data.items);
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách nhóm hàng:", error);
      }
    };
    loadCategories();
  }, []);

  const debouncedSearch = useDebounce((val) => {
    onFilterChange("keyword", val);
  }, 500);

  // Sync with external filter changes (e.g. refresh)
  useEffect(() => {
    setSearchValue(filters.keyword || "");
  }, [filters.keyword]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    debouncedSearch(val);
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: "1px solid", 
        borderColor: "grey.200", 
        borderRadius: 3, 
        p: 2, 
        mb: 3.5,
        bgcolor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}
    >
      <Stack 
        direction={{ xs: "column", md: "row" }} 
        justifyContent="space-between" 
        alignItems="center" 
        spacing={2.5}
      >
        {/* Khối Tìm kiếm linh hoạt chiều dài */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo tên, mã mặt hàng..."
            value={searchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: "#f8f9fb",
                borderRadius: 2.5,
                "& fieldset": { borderColor: 'transparent' },
                "&:hover fieldset": { borderColor: 'grey.300' },
                "&.Mui-focused fieldset": { borderColor: 'primary.main' },
                fontSize: 14,
                px: 0.5
              }
            }}
          />
        </Box>

        {/* Khối Bộ lọc bên phải */}
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' }, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select 
              value={filters.category || "all"} 
              onChange={(e) => onFilterChange("category", e.target.value)}
              displayEmpty
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: "#f8f9fb",
                color: "text.primary",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "grey.200" },
                fontSize: 14,
                fontWeight: 600,
                height: 40
              }}
            >
              <MenuItem value="all">Tất cả nhóm hàng</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value} sx={{ fontSize: 14 }}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Toggle Buttons */}
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={filters.stockStatus || "all"}
            exclusive
            onChange={(e, val) => onFilterChange("stockStatus", val !== null ? val : "all")}
            sx={{
              height: 40,
              bgcolor: "#f0f2f5",
              p: 0.5,
              borderRadius: 2.5,
              "& .MuiToggleButton-root": {
                border: "none",
                px: 2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                color: 'text.secondary',
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  color: "primary.main",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  "&:hover": {
                    bgcolor: "#fff",
                  }
                }
              }
            }}
          >
            <ToggleButton value="all">Tất cả</ToggleButton>
            <ToggleButton value="ENOUGH">Đủ hàng</ToggleButton>
            <ToggleButton value="LOW">Sắp hết</ToggleButton>
            <ToggleButton value="OUT">Hết hàng</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
    </Card>
  );
};

export default FilterBar;
