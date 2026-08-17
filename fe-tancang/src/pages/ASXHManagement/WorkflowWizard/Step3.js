import React, { useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  ArrowForward as ArrowIcon,
  TripOrigin as StepIcon,
} from "@mui/icons-material";

const Step3 = ({ data, updateData }) => {
  // Initialize one step if empty
  useEffect(() => {
    if (data.workflowSteps.length === 0) {
      updateData({ workflowSteps: [{ stepOrder: 1, roleCode: "", name: "" }] });
    }
  }, []);

  const handleAddStep = () => {
    const newSteps = [
      ...data.workflowSteps, 
      { stepOrder: data.workflowSteps.length + 1, roleCode: "", name: "" }
    ];
    updateData({ workflowSteps: newSteps });
  };

  const handleRemoveStep = (index) => {
    const newSteps = data.workflowSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepOrder: i + 1 }));
    updateData({ workflowSteps: newSteps });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...data.workflowSteps];
    if (field === "roleCode") {
      const selectedRole = data.roles.find(r => r.roleCode === value);
      newSteps[index].roleCode = value;
      newSteps[index].name = selectedRole?.name || "";
    } else {
      newSteps[index][field] = value;
    }
    updateData({ workflowSteps: newSteps });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#475569" }}>
          Bước 3: Thiết kế luồng xử lý
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={handleAddStep}
          sx={{ borderRadius: 1.5, textTransform: "none", bgcolor: "#2563eb" }}
        >
          Thêm bước duyệt
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Left column: Step list */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Danh sách trình tự bước
          </Typography>
          <Stack spacing={2}>
            {data.workflowSteps.map((step, index) => (
              <Paper 
                key={index} 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: "1px solid #e2e8f0", 
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  "&:hover": { borderColor: "#2563eb" }
                }}
              >
                <Box 
                  sx={{ 
                    minWidth: 32, 
                    height: 32, 
                    borderRadius: "50%", 
                    bgcolor: "#f1f5f9", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center",
                    fontWeight: 700,
                    color: "#2563eb"
                  }}
                >
                  {index + 1}
                </Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Chọn vai trò đảm nhận</InputLabel>
                  <Select
                    label="Chọn vai trò đảm nhận"
                    value={step.roleCode}
                    onChange={(e) => handleStepChange(index, "roleCode", e.target.value)}
                  >
                    {data.roles.filter(r => r.roleCode).map((role) => (
                      <MenuItem key={role.roleCode} value={role.roleCode}>
                        {role.name} ({role.roleCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={() => handleRemoveStep(index)}
                  disabled={data.workflowSteps.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        </Grid>

        {/* Right column: Visual preview */}
        <Grid item xs={12} md={7}>
          <Box 
            sx={{ 
              p: 4, 
              bgcolor: "#ffffff", 
              borderRadius: 3, 
              border: "1px dashed #cbd5e1",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 4, fontWeight: 700, color: "#64748b" }}>
              Xem trước luồng phê duyệt
            </Typography>

            <Box 
              sx={{ 
                width: "100%", 
                display: "flex", 
                flexWrap: "wrap", 
                justifyContent: "center", 
                alignItems: "center",
                gap: 2 
              }}
            >
              {data.workflowSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <Stack alignItems="center" spacing={1}>
                    <Box 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: "50%", 
                        border: "2.5px solid",
                        borderColor: step.roleCode ? "#2563eb" : "#e2e8f0",
                        bgcolor: step.roleCode ? "#eff6ff" : "white",
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center",
                        boxShadow: step.roleCode ? "0 4px 6px -1px rgb(37 99 235 / 0.1)" : "none"
                      }}
                    >
                      <StepIcon sx={{ color: step.roleCode ? "#2563eb" : "#e2e8f0", fontSize: 24 }} />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 700, 
                        color: step.roleCode ? "#1e293b" : "#94a3b8",
                        textAlign: "center",
                        maxWidth: 100
                      }}
                    >
                      {step.name || "(Bước " + (index + 1) + ")"}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: "#94a3b8", fontSize: "0.65rem", fontWeight: 500 }}
                    >
                      Step {index + 1}
                    </Typography>
                  </Stack>
                  {index < data.workflowSteps.length - 1 && (
                    <ArrowIcon sx={{ color: "#cbd5e1", mb: 2 }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Step3;
