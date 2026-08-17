import React from "react";
import { 
  Box, 
  InputAdornment, 
  MenuItem, 
  Grid 
} from "@mui/material";
import { 
  Search as SearchIcon,
} from "@mui/icons-material";
import { 
  SkyTextField, 
  SkySelect, 
  SkyFormControl, 
} from "@styles/SkyStyles";

const FUNDING_TYPES = [
  { value: "all", label: "Tất cả loại hình" },
  { value: "Bang_tien", label: "Tiền mặt" },
  { value: "Hien_vat", label: "Hiện vật" },
  { value: "Giao_duc", label: "Giáo dục/Hợp tác" },
];

const STATUSES = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "lap_ke_hoach", label: "Đang lập kế hoạch" },
  { value: "dang_trien_khai", label: "Đang triển khai" },
  { value: "dang_giai_ngan", label: "Đang giải ngân" },
  { value: "hoan_thanh", label: "Hoàn thành" },
];

/**
 * Thanh lọc dữ liệu cho trang Quản lý chương trình ASXH
 */
const FilterBar = ({ filters = {}, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <Box sx={{ 
      mb: 1.5, 
      p: 1.5, 
      bgcolor: "white", 
      borderRadius: 1.5, 
      border: "1px solid",
      borderColor: "grey.200",
    }}>
      <Grid container spacing={1.5} alignItems="center">
        {/* Tìm kiếm */}
        <Grid item xs={12} md={4}>
          <SkyTextField
            fullWidth
            name="keyword"
            placeholder="Tìm theo mã, tên chương trình..."
            value={filters.keyword || ""}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94a3b8", fontSize: "1.1rem" }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 1.5, 
                bgcolor: "#f0f2f5", 
                height: "40px", 
                fontSize: 14,
                "& fieldset": { border: "none" }
              }
            }}
          />
        </Grid>

        {/* Loại hình */}
        <Grid item xs={12} sm={6} md={2}>
          <SkyFormControl fullWidth size="small">
            <SkySelect
              name="funding_type"
              value={filters.funding_type || "all"}
              onChange={handleChange}
              displayEmpty
              sx={{ borderRadius: 1.5, height: "40px", fontSize: 14, bgcolor: "#f8f9fb" }}
            >
              {FUNDING_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </SkySelect>
          </SkyFormControl>
        </Grid>

        {/* Trạng thái */}
        <Grid item xs={12} sm={6} md={2}>
          <SkyFormControl fullWidth size="small">
            <SkySelect
              name="status"
              value={filters.status || "all"}
              onChange={handleChange}
              displayEmpty
              sx={{ borderRadius: 1.5, height: "40px", fontSize: 14, bgcolor: "#f8f9fb" }}
            >
              {STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
              ))}
            </SkySelect>
          </SkyFormControl>
        </Grid>

        {/* Địa phương */}
        <Grid item xs={12} sm={6} md={2.5}>
          <SkyTextField
            fullWidth
            name="locality"
            placeholder="Địa phương..."
            value={filters.locality || ""}
            onChange={handleChange}
            size="small"
            InputProps={{ sx: { borderRadius: 1.5, height: "40px", fontSize: 14, bgcolor: "#f8f9fb" } }}
          />
        </Grid>

        {/* Năm */}
        <Grid item xs={12} sm={6} md={1.5}>
          <SkySelect
            fullWidth
            size="small"
            name="year"
            value={filters.year || 2026}
            onChange={handleChange}
            sx={{ borderRadius: 1.5, height: "40px", fontSize: 14, bgcolor: "#f8f9fb" }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </SkySelect>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilterBar;
