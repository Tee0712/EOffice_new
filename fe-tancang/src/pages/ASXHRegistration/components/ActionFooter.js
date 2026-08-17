import React from "react";
import { Box, Button, Container, Stack } from "@mui/material";
import { Save, Visibility, Check, DeleteOutline } from "@mui/icons-material";

const ActionFooter = ({ onDraft, onPreview, onSubmit, loading, onCancel, isEditMode }) => {
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#F1F5F9", 
        borderTop: "1px solid",
        borderColor: "#E2E8F0",
        py: 2,
        px: 3,
        zIndex: 1000,
        boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.1), 0 -2px 4px -1px rgba(0,0,0,0.06)"
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Left side actions */}
          <Button
            variant="text"
            startIcon={<DeleteOutline />}
            onClick={onCancel}
            sx={{ 
              color: "#64748B", 
              textTransform: "none", 
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": { backgroundColor: "transparent", color: "#475569" }
            }}
          >
            Huỷ bỏ
          </Button>

          {/* Right side actions */}
          <Stack direction="row" spacing={1.5}>
            {!isEditMode && (
              <Button
                variant="outlined"
                onClick={onDraft}
                startIcon={<Save sx={{ fontSize: 18 }} />}
                sx={{ 
                  px: 2.5, 
                  borderRadius: "10px", 
                  borderColor: "#D0D5DD", 
                  backgroundColor: "white",
                  color: "#344054",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" }
                }}
              >
                Lưu nháp
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={onPreview}
              startIcon={<Visibility sx={{ fontSize: 18 }} />}
              sx={{ 
                px: 2.5, 
                borderRadius: "10px", 
                borderColor: "#2B5CE6", 
                backgroundColor: "white",
                color: "#2B5CE6",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                "&:hover": { backgroundColor: "#F5F8FF", borderColor: "#2B5CE6" }
              }}
            >
              Xem trước
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              loading={loading}
              startIcon={<Check sx={{ fontSize: 18 }} />}
              sx={{ 
                px: 3.5, 
                borderRadius: "10px", 
                backgroundColor: "#16A34A", 
                color: "white",
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                "&:hover": { backgroundColor: "#15803D" }
              }}
            >
              {isEditMode ? "Cập nhật chương trình" : "Tạo chương trình"}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default ActionFooter;
