import React from "react";
import { Box, Container, Stack, Button, CircularProgress } from "@mui/material";
import { Save, Send, Delete } from "@mui/icons-material";

const HandoverFooter = ({ onCancel, onDraft, onSubmit, onDelete, isEdit, submitting }) => {
  return (
    <Box sx={{ 
      position: "fixed", 
      bottom: 0, 
      left: 0, 
      right: 0, 
      bgcolor: "white", 
      boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.05)",
      borderTop: "1px solid #E2E8F0",
      py: 2,
      px: { xs: 2, sm: 0 },
      zIndex: 2000,
      width: "100%"
    }}>
      <Box sx={{ px: 4, width: "100%" }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
          <Button 
            variant="outlined" 
            onClick={onCancel}
            sx={{ 
              borderRadius: "10px", 
              px: 3, 
              fontWeight: 700, 
              textTransform: "none",
              borderColor: "#CBD5E1",
              color: "#64748B"
            }}
          >
            Hủy bỏ
          </Button>

          {isEdit && onDelete && (
             <Button 
              variant="outlined" 
              color="error"
              startIcon={<Delete />}
              onClick={onDelete}
              disabled={submitting}
              sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
            >
              Xóa lịch
            </Button>
          )}

          {!isEdit && (
            <Button 
              variant="outlined" 
              startIcon={<Save />}
              onClick={onDraft}
              disabled={submitting}
              sx={{ 
                borderRadius: "10px", 
                px: 3, 
                fontWeight: 700, 
                textTransform: "none",
                borderColor: "#CBD5E1",
                color: "#1E293B"
              }}
            >
              Lưu nháp
            </Button>
          )}
          
          <Button 
            variant="contained" 
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
            onClick={onSubmit}
            disabled={submitting}
            sx={{ 
              borderRadius: "10px", 
              px: 4, 
              fontWeight: 700, 
              textTransform: "none",
              bgcolor: "#1E293B",
              "&:hover": { bgcolor: "#334155" }
            }}
          >
            {isEdit ? "Cập nhật lịch" : "Hoàn tất & Lên lịch"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default HandoverFooter;
