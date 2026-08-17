import React from "react";
import { 
  Box, 
  Typography, 
  Stack, 
  Paper
} from "@mui/material";
import { styled } from "@mui/material/styles";

const PipelineContainer = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  border: `1px solid #e2e8f0`,
  backgroundColor: "#fff",
  overflow: "hidden",
  display: "flex",
  width: "100%"
}));

const StepBox = styled(Box)(({ theme, color, isLast }) => ({
  flex: 1,
  padding: theme.spacing(3, 2, 4, 2), // Tăng padding bottom để có không gian cho thanh màu
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  borderRight: isLast ? "none" : "1px solid #f1f5f9",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "16px", // Nâng thanh màu lên cách đáy 16px
    left: "15%",
    right: "15%",
    height: "4px",
    backgroundColor: color || "#cbd5e1",
    borderRadius: "4px" // Bo tròn cả 4 góc cho thanh nổi
  }
}));

const StepValue = styled(Typography)(({ theme, color }) => ({
  fontSize: "28px",
  fontWeight: 800,
  color: color || "#1e293b",
  lineHeight: 1.2,
  marginBottom: "4px"
}));

const StepLabel = styled(Typography)(({ theme }) => ({
  fontSize: "11px",
  fontWeight: 700,
  color: "#94a3b8",
  textAlign: "center",
  letterSpacing: "0.5px",
  textTransform: "uppercase"
}));

/**
 * Pipeline xét duyệt học bổng (5 bước) - Layout dạng Boxed theo yêu cầu
 */
const ScholarshipPipeline = ({ steps = [] }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
        Pipeline xét duyệt học bổng
      </Typography>

      <PipelineContainer>
        {steps.map((step, index) => (
          <StepBox 
            key={step.status} 
            color={step.color} 
            isLast={index === steps.length - 1}
          >
            <StepValue color={step.color}>
              {step.count}
            </StepValue>
            <StepLabel>
              {step.label}
            </StepLabel>
          </StepBox>
        ))}
      </PipelineContainer>
    </Box>
  );
};

export default ScholarshipPipeline;
