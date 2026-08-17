import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const FilterField = ({ label, children, sx }) => (
  <Stack spacing={0.6} sx={{ flex: 1, minWidth: 100, ...sx }}>
    <Typography
      variant="caption"
      fontWeight={700}
      sx={{
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontSize: 10,
      }}
    >
      {label}
    </Typography>
    {children}
  </Stack>
);

const buildPeriodOptions = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();

  return [
    {
      value: "current_month",
      label: `Tháng ${String(currentMonth).padStart(2, "0")}/${currentYear}`,
    },
    {
      value: "last_month",
      label: `Tháng ${String(lastMonth).padStart(2, "0")}/${lastMonthYear}`,
    },
    { value: "quarter", label: "Quý hiện tại" },
  ];
};

const normalizeDepartmentValue = (dept) =>
  dept?.value || dept?.id || dept?.label || "";
const normalizeDepartmentLabel = (dept) =>
  dept?.label || dept?.name || dept?.value || "";
const MAX_KEYWORD_LENGTH = 100;

const normalizeKeyword = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

const FilterBar = ({
  onFilter,
  filters,
  categories = [],
  departments = [],
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [keywordError, setKeywordError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    setLocalFilters(filters);
    setKeywordError("");
  }, [filters]);

  useEffect(() => {
    const deptValues = new Set(
      (departments || []).map((dept) => String(normalizeDepartmentValue(dept)))
    );
    const catValues = new Set(
      (categories || []).map((cat) => String(cat?.value || ""))
    );
    let nextFilters = null;
    if (
      localFilters.department &&
      localFilters.department !== "All" &&
      !deptValues.has(String(localFilters.department))
    ) {
      nextFilters = { ...(nextFilters || localFilters), department: "All" };
    }
    if (
      localFilters.category &&
      localFilters.category !== "All" &&
      !catValues.has(String(localFilters.category))
    ) {
      nextFilters = { ...(nextFilters || localFilters), category: "All" };
    }
    if (nextFilters) {
      setLocalFilters(nextFilters);
      onFilter(nextFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments, categories]);

  const periodOptions = useMemo(() => buildPeriodOptions(), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "keyword") {
      const normalizedValue = value.replace(/\s+/g, " ");
      if (normalizedValue.length > MAX_KEYWORD_LENGTH) {
        setKeywordError(`Từ khóa tối đa ${MAX_KEYWORD_LENGTH} ký tự`);
      } else {
        setKeywordError("");
      }
      setLocalFilters((prev) => ({ ...prev, keyword: normalizedValue }));
      return;
    }
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyImmediateFilter = (name, value) => {
    const nextFilters = { ...localFilters, [name]: value };
    setLocalFilters(nextFilters);
    onFilter(nextFilters);
  };

  const handleFilter = () => {
    const normalized = {
      ...localFilters,
      keyword: normalizeKeyword(localFilters.keyword || ""),
    };
    if (normalized.keyword.length > MAX_KEYWORD_LENGTH) {
      setKeywordError(`Từ khóa tối đa ${MAX_KEYWORD_LENGTH} ký tự`);
      return;
    }
    setKeywordError("");
    setLocalFilters(normalized);
    onFilter(normalized);
  };

  const handleReset = () => {
    const initialFilters = {
      fromDate: "",
      toDate: "",
      department: "All",
      category: "All",
      keyword: "",
      period: "current_month",
    };
    setKeywordError("");
    setLocalFilters(initialFilters);
    onFilter(initialFilters);
  };

  const inputStyle = {
    "& .MuiInputBase-root": {
      borderRadius: "8px",
      backgroundColor: "#f1f5f9",
      height: 40,
      fontSize: 14,
      "& fieldset": { border: "none" },
      "&:hover fieldset": { border: "none" },
      "&.Mui-focused fieldset": { border: "none" },
    },
  };

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 1,
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
      }}
    >
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2.5}
        alignItems="flex-end"
      >
        <FilterField label="Kỳ báo cáo" sx={{ minWidth: 180 }}>
          <TextField
            select
            name="period"
            value={localFilters.period || "current_month"}
            onChange={(e) => applyImmediateFilter("period", e.target.value)}
            size="small"
            sx={inputStyle}
          >
            {periodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="Phòng ban" sx={{ minWidth: 220 }}>
          <TextField
            select
            name="department"
            value={localFilters.department || "All"}
            onChange={(e) => applyImmediateFilter("department", e.target.value)}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="All">Tất cả phòng ban</MenuItem>
            {departments.map((dept) => {
              const value = normalizeDepartmentValue(dept);
              const label = normalizeDepartmentLabel(dept);
              return (
                <MenuItem key={`${value}-${label}`} value={value}>
                  {label}
                </MenuItem>
              );
            })}
          </TextField>
        </FilterField>

        <FilterField label="Nhóm hàng" sx={{ minWidth: 180 }}>
          <TextField
            select
            name="category"
            value={localFilters.category || "All"}
            onChange={(e) => applyImmediateFilter("category", e.target.value)}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="All">Tất cả nhóm hàng</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="Tìm kiếm nhanh" sx={{ flex: 2 }}>
          <TextField
            placeholder="Tên mặt hàng, mã hàng..."
            name="keyword"
            value={localFilters.keyword || ""}
            onChange={handleChange}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleFilter();
              }
            }}
            size="small"
            autoComplete="off"
            error={Boolean(keywordError)}
            helperText={keywordError || ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            FormHelperTextProps={{
              sx: { m: 0, minHeight: 0, lineHeight: 1.2 },
            }}
            sx={inputStyle}
          />
        </FilterField>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.5} sx={{ height: 40 }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<SearchIcon />}
            onClick={handleFilter}
            sx={{
              borderRadius: "8px",
              px: 3,
              backgroundColor: "#2563eb",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Lọc báo cáo
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              borderRadius: "8px",
              borderColor: "#e2e8f0",
              color: "#334155",
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#fff",
              "&:hover": { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
            }}
          >
            Đặt lại
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default FilterBar;
