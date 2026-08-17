import React from "react";
import { Box, Stack, Button, CircularProgress } from "@mui/material";

const ActionFooter = ({ onCancel, onDraft, onSubmit, onDelete, submitting, submitLabel = "Thêm hạng mục", hideDraft = false }) => {
  return (
    <Box sx={{ 
      p: 2.5, 
      bgcolor: "white", 
      borderTop: "1px solid #E2E8F0",
      boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
      zIndex: 1000,
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0
    }}>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ maxWidth: "1600px", margin: "0 auto", px: 4 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          sx={{ 
            borderRadius: "8px", 
            px: 3, 
            borderColor: "#CBD5E1",
            color: "#64748B",
            fontWeight: 600,
            marginRight: "auto",
            "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" }
          }}
        >
          Hủy bỏ
        </Button>

        {onDelete && (
          <Button 
            variant="outlined" 
            onClick={onDelete}
            disabled={submitting}
            sx={{ 
              borderRadius: "8px", 
              px: 3,
              borderColor: "#EF4444",
              color: "#EF4444",
              fontWeight: 600,
              "&:hover": { borderColor: "#DC2626", bgcolor: "#FEF2F2" }
            }}
          >
            Xóa hiện vật
          </Button>
        )}
        {!hideDraft && (
          <Button 
            variant="outlined" 
            onClick={onDraft}
            disabled={submitting}
            sx={{ 
              borderRadius: "8px", 
              px: 4,
              borderColor: "#CBD5E1",
              color: "#475569",
              fontWeight: 600,
              "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" }
            }}
          >
            Lưu nháp
          </Button>
        )}
        <Button 
          variant="contained" 
          onClick={onSubmit}
          disabled={submitting}
          startIcon={submitting && <CircularProgress size={20} color="inherit" />}
          sx={{ 
            borderRadius: "8px", 
            px: 6,
            bgcolor: "#10B981",
            color: "white",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "#059669", boxShadow: "none" }
          }}
        >
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
};

export default ActionFooter;
