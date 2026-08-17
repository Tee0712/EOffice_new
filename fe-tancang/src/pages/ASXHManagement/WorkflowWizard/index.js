import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Stack,
  Divider,
  CircularProgress
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import workflowWizardService from "@services/workflowWizardService";
import { useToast } from "@components/common/ToastProvider";

const steps = ["Thông tin chung", "Tạo vai trò", "Thiết kế luồng"];

const WorkflowWizard = () => {
  const navigate = useNavigate();
  const { processKey } = useParams();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Unified State for all steps
  const [formData, setFormData] = useState({
    // Step 1
    name: "",
    processKey: "",
    description: "",
    // Step 2
    roles: [{ name: "", roleCode: "", groupIds: [] }],
    // Step 3
    workflowSteps: [],
  });

  useEffect(() => {
    const loadDetail = async () => {
      if (processKey) {
        setIsEdit(true);
        setLoading(true);
        try {
          const res = await workflowWizardService.getDetail(processKey);
          if (res.success) {
            setFormData({
              name: res.data.name,
              processKey: res.data.processKey,
              description: res.data.description,
              roles: res.data.roles,
              workflowSteps: res.data.steps,
            });
          }
        } catch (err) {
          toast("Không thể tải thông tin quy trình", "error");
          navigate("/asxh/workflow-management");
        } finally {
          setLoading(false);
        }
      }
    };
    loadDetail();
  }, [processKey, navigate, toast]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSave();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        processKey: formData.processKey,
        description: formData.description,
        roles: formData.roles,
        steps: formData.workflowSteps,
      };

      const res = await workflowWizardService.saveWorkflow(payload);
      if (res.success) {
        toast(`${isEdit ? "Cập nhật" : "Lưu"} luồng xử lý thành công`, "success");
        navigate("/asxh/workflow-management");
      }
    } catch (error) {
      console.error("Save workflow failed:", error);
      toast(error.response?.data?.message || "Lưu thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  if (loading && activeStep === 0 && isEdit) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: "#f8f9fc", minHeight: "100vh" }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e4ec" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: "#1a202c" }}>
          {isEdit ? "Chỉnh sửa luồng xử lý" : "Tạo luồng mới"} - Module An sinh xã hội
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel 
                sx={{ 
                  "& .MuiStepLabel-label": { fontWeight: 600, fontSize: "0.95rem" },
                  "& .Mui-active": { color: "#2563eb !important" },
                  "& .Mui-completed": { color: "#10b981 !important" }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, minHeight: "400px" }}>
          {activeStep === 0 && <Step1 data={formData} updateData={updateFormData} isEdit={isEdit} />}
          {activeStep === 1 && <Step2 data={formData} updateData={updateFormData} />}
          {activeStep === 2 && <Step3 data={formData} updateData={updateFormData} />}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" justifyContent="space-between">
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none", px: 4, fontWeight: 600 }}
          >
            Quay lại
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => navigate("/asxh/workflow-management")}
              variant="text"
              color="inherit"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{ 
                borderRadius: 2, 
                textTransform: "none", 
                px: 6, 
                fontWeight: 600, 
                bgcolor: "#2563eb",
                "&:hover": { bgcolor: "#1d4ed8" }
              }}
            >
              {activeStep === steps.length - 1 ? (loading ? "Đang lưu..." : "Lưu quy trình") : "Tiếp tục"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default WorkflowWizard;
