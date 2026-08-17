import React from "react";
import { Box, Typography, Paper, Grid, TextField, IconButton, Button, Stack } from "@mui/material";
import { Add, DeleteOutline } from "@mui/icons-material";

// Local refined components for tight design control
const SkyTextField = (props) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    InputLabelProps={{ shrink: true, style: { display: "none" }, ...props.InputLabelProps }}
    sx={{ 
      "& .MuiOutlinedInput-root": { 
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        "& fieldset": { borderColor: "#E2E8F0" },
        "&:hover fieldset": { borderColor: "#3B82F6" },
        "&.Mui-focused fieldset": { borderColor: "#3B82F6" }
      },
      "& .MuiInputBase-input": { 
        padding: props.multiline ? "0px" : "8.5px 14px",
        fontSize: "14px"
      },
      "& .MuiInputBase-multiline": {
        padding: "8.5px 14px",
      },
      "& .MuiInputBase-input::placeholder": {
        opacity: 0.6,
        color: "#64748b",
      },
      ...props.sx 
    }}
  />
);


const TechnicalSpecsSection = ({ specs, onChange }) => {
  const handleAdd = () => {
    onChange([...specs, { key: "", value: "" }]);
  };

  const handleDelete = (index) => {
    const newList = [...specs];
    newList.splice(index, 1);
    onChange(newList);
  };

  const handleUpdate = (index, field, value) => {
    const newList = [...specs];
    newList[index][field] = value;
    onChange(newList);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            width: 28, 
            height: 28, 
            borderRadius: "50%", 
            bgcolor: "#F97316", 
            color: "white", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px"
          }}>2</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "18px" }}>
            Quy cách kỹ thuật
          </Typography>
        </Stack>
        <Button 
          startIcon={<Add />} 
          variant="outlined" 
          size="small"
          onClick={handleAdd}
          sx={{ borderRadius: "8px" }}
        >
          Thêm thông số
        </Button>
      </Stack>

      <Stack spacing={2}>
        {specs.map((spec, index) => (
          <Grid container spacing={2} key={index} alignItems="center">
            <Grid item xs={5}>
              <SkyTextField
                fullWidth
                placeholder="Tên thông số"
                value={spec.key}
                onChange={(e) => handleUpdate(index, "key", e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <SkyTextField
                fullWidth
                placeholder="Giá trị thông số"
                value={spec.value}
                onChange={(e) => handleUpdate(index, "value", e.target.value)}
              />
            </Grid>

            <Grid item xs={1}>
              <IconButton 
                color="error" 
                onClick={() => handleDelete(index)}
                disabled={specs.length <= 1}
              >
                <DeleteOutline />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        {specs.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            Chưa có thông số kỹ thuật nào. Nhấn nút Thêm để bắt đầu.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default TechnicalSpecsSection;
