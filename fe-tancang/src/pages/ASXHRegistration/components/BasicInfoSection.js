import React from "react";
import { Grid, TextField, Autocomplete, Box, Typography } from "@mui/material";
import { AttachMoney, Inventory, School } from "@mui/icons-material";
import RadioCategoryCard from "./RadioCategoryCard";

/**
 * Helper component for Form Fields with Labels Above
 */
const FormField = ({ label, required, children, sx = {} }) => (
  <Box sx={{ mb: 2.5, ...sx }}>
    <Typography 
      variant="body2" 
      sx={{ 
        fontWeight: 600, 
        color: "#344054", 
        mb: 1, 
        display: "flex", 
        alignItems: "center",
        fontSize: "0.875rem"
      }}
    >
      {label} {required && <Box component="span" sx={{ color: "#F04438", ml: 0.5 }}>*</Box>}
    </Typography>
    {children}
  </Box>
);

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.95rem",
    minHeight: "44px",
    "& fieldset": {
      borderColor: "#D0D5DD",
    },
    "&:hover fieldset": {
      borderColor: "#2563EB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
    },
    "& .MuiAutocomplete-input": {
      padding: "0 4px !important",
    }
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#98A2B3",
    opacity: 1,
  },
  "& .MuiAutocomplete-inputRoot": {
    pt: "4px !important",
    pb: "4px !important",
    pl: "10px !important",
  }
};

const BasicInfoSection = ({ values, errors, onChange, provinces = [] }) => {
  const fundingTypes = [
    { id: "Bang_tien", title: "Bằng tiền", subtitle: "Giải ngân trực tiếp", icon: <AttachMoney /> },
    { id: "Hien_vat", title: "Hiện vật", subtitle: "Mua sắm & bàn giao", icon: <Inventory /> },
    { id: "Giao_duc", title: "Giáo dục", subtitle: "Học bổng, hợp tác ĐH", icon: <School /> },
  ];

  const handleFieldChange = (field) => (e) => {
    onChange(field, e.target.value);
  };

  const handleSelectChange = (field) => (event, newValue) => {
    onChange(field, newValue);
  };

  return (
    <Grid container spacing={0}>
      {/* Loại hình tài trợ */}
      <Grid item xs={12}>
        <FormField label="Loại hình tài trợ" required>
          <Grid container spacing={2}>
            {fundingTypes.map((type) => (
              <Grid item xs={12} md={4} key={type.id}>
                <RadioCategoryCard
                  id={type.id}
                  icon={type.icon}
                  title={type.title}
                  subtitle={type.subtitle}
                  selected={values.funding_type === type.id}
                  onClick={() => onChange("funding_type", type.id)}
                />
              </Grid>
            ))}
          </Grid>
        </FormField>
      </Grid>

      {/* Tên chương trình */}
      <Grid item xs={12}>
        <FormField label="Tên chương trình" required>
          <TextField
            fullWidth
            placeholder="VD: Hỗ trợ xây dựng cầu đường nông thôn Châu Thành"
            value={values.name || ""}
            onChange={handleFieldChange("name")}
            error={!!errors.name}
            helperText={errors.name}
            sx={inputStyles}
          />
        </FormField>
      </Grid>

      {/* Mô tả */}
      <Grid item xs={12}>
        <FormField label="Mô tả chương trình" required>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Mục tiêu, phạm vi, đối tượng thụ hưởng, kết quả dự kiến..."
            value={values.description || ""}
            onChange={handleFieldChange("description")}
            sx={inputStyles}
          />
        </FormField>
      </Grid>

      {/* Địa phương & Địa chỉ */}
      <Grid container item xs={12} spacing={2.5}>
        <Grid item xs={12} md={6}>
          <FormField label="Địa phương" required>
            <Autocomplete
              options={provinces.map(p => p.name || p) || []}
              value={values.locality || null}
              onChange={handleSelectChange("locality")}
              sx={inputStyles}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Chọn tỉnh / thành phố..." 
                  error={!!errors.locality} 
                  helperText={errors.locality} 
                />
              )}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormField label="Địa chỉ cụ thể">
            <TextField
              fullWidth
              placeholder="Huyện, xã, thôn..."
              value={values.specific_address || ""}
              onChange={handleFieldChange("specific_address")}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Thời gian */}
      <Grid container item xs={12} spacing={2.5}>
        <Grid item xs={12} md={6}>
          <FormField label="Ngày bắt đầu" required>
            <TextField
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={values.start_date || ""}
              onChange={handleFieldChange("start_date")}
              error={!!errors.start_date}
              helperText={errors.start_date}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormField label="Ngày kết thúc (dự kiến)" required>
            <TextField
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={values.end_date || ""}
              onChange={handleFieldChange("end_date")}
              error={!!errors.end_date}
              helperText={errors.end_date}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
      </Grid>

      {/* Đối tác địa phương */}
      <Grid item xs={12}>
        <FormField label="Đối tác địa phương">
          <TextField
            fullWidth
            placeholder="UBND, Hội Chữ thập đỏ, Sở GD&ĐT..."
            value={values.local_partner || ""}
            onChange={handleFieldChange("local_partner")}
            sx={inputStyles}
          />
        </FormField>
      </Grid>

      {/* Số người thụ hưởng & Từ khóa */}
      <Grid container item xs={12} spacing={2.5}>
        <Grid item xs={12} md={6}>
          <FormField label="Số người thụ hưởng (dự kiến)">
            <TextField
              fullWidth
              placeholder="VD: 500"
              value={values.beneficiary || ""}
              onChange={handleFieldChange("beneficiary")}
              sx={inputStyles}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormField label="Từ khóa phân loại">
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={values.classification_keywords || []}
              onChange={handleSelectChange("classification_keywords")}
              sx={inputStyles}
              renderInput={(params) => (
                <TextField {...params} placeholder="Nhập rồi nhấn Enter..." />
              )}
            />
          </FormField>
        </Grid>
      </Grid>


    </Grid>
  );
};

export default BasicInfoSection;
