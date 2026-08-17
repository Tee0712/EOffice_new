import React from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
} from "@mui/material";

const Step1 = ({ data, updateData, isEdit }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: "#475569" }}>
        Bước 1: Thông tin chung quy trình
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Tên quy trình"
            name="name"
            variant="outlined"
            value={data.name}
            onChange={handleChange}
            placeholder="Nhập tên quy trình (ví dụ: Quy trình hỗ trợ thiên tai)"
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            disabled={isEdit}
            label="Mã quy trình"
            name="processKey"
            variant="outlined"
            value={data.processKey}
            onChange={handleChange}
            placeholder="Nhập mã quy trình (ví dụ: ASXH_HO_TRO_THIEN_TAI)"
            helperText={isEdit ? "Không thể thay đổi mã quy trình khi đang chỉnh sửa" : ""}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mô tả"
            name="description"
            variant="outlined"
            value={data.description}
            onChange={handleChange}
            placeholder="Mô tả ngắn gọn về quy trình..."
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Step1;
