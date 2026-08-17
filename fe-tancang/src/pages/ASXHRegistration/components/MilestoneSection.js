import React from "react";
import { 
  Box, Typography, TextField, MenuItem, IconButton, Grid
} from "@mui/material";
import { RemoveCircleOutline } from "@mui/icons-material";

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
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#98A2B3",
    opacity: 1,
  },
};

const MilestoneSection = ({ milestones = [], onChange }) => {
  const handleRemoveMilestone = (index) => {
    const newItems = milestones.filter((_, i) => i !== index);
    onChange("milestones", newItems);
  };

  const handleMilestoneChange = (index, field, value) => {
    const newItems = [...milestones];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange("milestones", newItems);
  };

  return (
    <Box>
      {milestones.map((milestone, index) => (
        <Box 
          key={index} 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2,
            p: 1.5,
            mb: 2,
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            backgroundColor: "white",
            "&:hover": { borderColor: "#CBD5E1" }
          }}
        >
          {/* Number indicator */}
          <Box 
            sx={{ 
              minWidth: 32, 
              height: 32, 
              borderRadius: "50%", 
              backgroundColor: "#F1F5F9", 
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "0.875rem"
            }}
          >
            {index + 1}
          </Box>

          {/* Fields */}
          <Grid container spacing={2} sx={{ flex: 1, alignItems: "center" }}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="VD: Phê duyệt & ký hợp đồng"
                value={milestone.milestone_name || ""}
                onChange={(e) => handleMilestoneChange(index, "milestone_name", e.target.value)}
                sx={inputStyles}
              />
            </Grid>
            <Grid item xs={12} md={3.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={milestone.milestone_date || ""}
                onChange={(e) => handleMilestoneChange(index, "milestone_date", e.target.value)}
                sx={inputStyles}
              />
            </Grid>
            <Grid item xs={12} md={3.5}>
              <TextField
                select
                fullWidth
                size="small"
                value={milestone.milestone_type || "MANDATORY"}
                onChange={(e) => handleMilestoneChange(index, "milestone_type", e.target.value)}
                sx={inputStyles}
              >
                <MenuItem value="MANDATORY">Bắt buộc</MenuItem>
                <MenuItem value="OPTIONAL">Không bắt buộc</MenuItem>
                <MenuItem value="NOT_STARTED">Chưa bắt đầu</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Action */}
          <IconButton onClick={() => handleRemoveMilestone(index)} sx={{ color: "#94A3B8" }}>
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </Box>
      ))}

      {milestones.length === 0 && (
        <Box sx={{ py: 4, textAlign: "center", border: "2px dashed #E2E8F0", borderRadius: "12px" }}>
          <Typography variant="body2" sx={{ color: "#94A3B8" }}>
            Chưa có mốc triển khai nào. Nhấn "Thêm mốc" ở trên để bắt đầu.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MilestoneSection;
