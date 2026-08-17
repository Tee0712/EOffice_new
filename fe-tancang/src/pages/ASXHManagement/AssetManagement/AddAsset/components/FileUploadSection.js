import React, { useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  FormHelperText,
} from "@mui/material";
import { CloudUpload, InsertDriveFile, Delete } from "@mui/icons-material";

const FileUploadSection = ({ files, onChange, error, required }) => {
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const newFiles = Array.from(e.dataTransfer.files);
      onChange([...files, ...newFiles]);
    },
    [files, onChange]
  );

  const onFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index) => {
    const newList = [...files];
    newList.splice(index, 1);
    onChange(newList);
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 4, borderRadius: "12px", border: "1px solid #E2E8F0" }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "#F97316",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          5
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#1E293B", fontSize: "18px" }}
        >
          Tài liệu đính kèm
        </Typography>
        {required && (
          <Chip
            label="Bắt buộc"
            size="small"
            sx={{
              bgcolor: "#FEF2F2",
              color: "#EF4444",
              fontWeight: 700,
              fontSize: "11px",
              height: "20px",
            }}
          />
        )}
      </Stack>

      <Box
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        sx={{
          border: error ? "2px dashed #EF4444" : "2px dashed #CBD5E1",
          borderRadius: "12px",
          p: 4,
          textAlign: "center",
          bgcolor: error ? "#FFF5F5" : "#F8FAFC",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": { borderColor: "#64748B", bgcolor: "#F1F5F9" },
        }}
        onClick={() => document.getElementById("file-input").click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: "#64748B", mb: 2 }} />
        <Typography variant="body1" fontWeight="bold">
          Click để tải lên hoặc kéo thả tệp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hỗ trợ: PDF, JPG, PNG, DOC (Max 10MB/file)
        </Typography>
        <input
          id="file-input"
          type="file"
          multiple
          hidden
          onChange={onFileChange}
        />
      </Box>

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: "#F1F5F9",
                borderRadius: "8px",
                mb: 1,
                border: "1px solid #E2E8F0",
              }}
              secondaryAction={
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => removeFile(index)}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {error && (
        <FormHelperText
          error
          sx={{ mt: 1, fontSize: "0.8rem", fontWeight: 500 }}
        >
          ⚠ {error}
        </FormHelperText>
      )}
    </Paper>
  );
};

export default FileUploadSection;
