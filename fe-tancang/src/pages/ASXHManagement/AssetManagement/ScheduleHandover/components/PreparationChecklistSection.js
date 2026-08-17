import React, { useState } from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Stack,
  Checkbox,
  IconButton,
  TextField,
  Button,
  Chip
} from "@mui/material";
import { Add, DeleteOutline, DragIndicator } from "@mui/icons-material";

const PreparationChecklistSection = ({ checklists, onChange }) => {
  const [newItem, setNewItem] = useState("");
  const [newItemType, setNewItemType] = useState("OPTIONAL");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onChange([...checklists, { name: newItem, checklist_type: newItemType, id: Date.now(), is_checked: true }]);
    setNewItem("");
    setNewItemType("OPTIONAL");
  };

  const handleToggleType = (id) => {
    onChange(checklists.map(c => 
      c.id === id 
        ? { ...c, checklist_type: c.checklist_type === "MANDATORY" ? "OPTIONAL" : "MANDATORY" } 
        : c
    ));
  };

  const handleRemove = (id) => {
    onChange(checklists.filter(c => c.id !== id));
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#3b82f6", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          5
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Checklist chuẩn bị
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ color: "#64748b", mb: 3, display: "block" }}>
        Các hạng mục công việc cần hoàn thành trước ngày bàn giao
      </Typography>

      <Stack spacing={1} sx={{ mb: 2 }}>
        {checklists.map((item) => (
          <Box key={item.id} sx={{ 
            p: 1.5, borderRadius: "12px", 
            display: "flex", alignItems: "center", justifyContent: "space-between",
            bgcolor: "#FFFFFF",
            border: "1px solid #f1f5f9",
            "&:hover": { bgcolor: "#f8fafc" }
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
              <Checkbox 
                checked={!!item.is_checked}
                onChange={(e) => {
                  onChange(checklists.map(c => c.id === item.id ? { ...c, is_checked: e.target.checked } : c));
                }}
                sx={{ 
                  color: "#e2e8f0", 
                  "&.Mui-checked": { color: "#10b981" },
                  padding: 0
                }}
              />
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: "#1e293b"
              }}>
                {item.name}
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={item.checklist_type === "MANDATORY" ? "Bắt buộc" : "Tùy chọn"} 
                size="small" 
                onClick={() => handleToggleType(item.id)}
                sx={{ 
                  height: 24, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                  bgcolor: item.checklist_type === "MANDATORY" ? "#FEE2E2" : "#F1F5F9", 
                  color: item.checklist_type === "MANDATORY" ? "#B91C1C" : "#64748B",
                  border: "1px solid transparent",
                  "&:hover": { border: `1px solid ${item.checklist_type === "MANDATORY" ? "#FECACA" : "#CBD5E1"}` }
                }} 
              />
              <IconButton size="small" onClick={() => handleRemove(item.id)}>
                <DeleteOutline fontSize="small" sx={{ color: "#94a3b8" }} />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      {/* Ghost Add Button */}
      {!isAdding ? (
        <Button 
          startIcon={<Add />} 
          variant="text" 
          onClick={() => setIsAdding(true)}
          sx={{ 
            textTransform: "none", fontWeight: 700, color: "#3b82f6",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
          }}
        >
          Thêm mục checklist
        </Button>
      ) : (
        <Stack spacing={2} sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Nhập hạng mục công việc..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAdd()}
            sx={{ 
              "& .MuiOutlinedInput-root": { bgcolor: "white", borderRadius: "8px" }
            }}
          />
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1}>
              <Chip 
                label="Bắt buộc" 
                size="small"
                variant={newItemType === "MANDATORY" ? "filled" : "outlined"}
                onClick={() => setNewItemType("MANDATORY")}
                sx={{ 
                  cursor: "pointer", 
                  fontWeight: 600,
                  bgcolor: newItemType === "MANDATORY" ? "#FEE2E2" : "transparent",
                  color: newItemType === "MANDATORY" ? "#B91C1C" : "#64748B",
                  borderColor: newItemType === "MANDATORY" ? "transparent" : "#E2E8F0",
                  "&:hover": { bgcolor: newItemType === "MANDATORY" ? "#FEE2E2" : "#F8FAFC" }
                }}
              />
              <Chip 
                label="Tùy chọn" 
                size="small"
                variant={newItemType === "OPTIONAL" ? "filled" : "outlined"}
                onClick={() => setNewItemType("OPTIONAL")}
                sx={{ 
                  cursor: "pointer",
                  fontWeight: 600,
                  bgcolor: newItemType === "OPTIONAL" ? "#F1F5F9" : "transparent",
                  color: newItemType === "OPTIONAL" ? "#64748B" : "#64748B",
                  borderColor: newItemType === "OPTIONAL" ? "transparent" : "#E2E8F0",
                  "&:hover": { bgcolor: newItemType === "OPTIONAL" ? "#F1F5F9" : "#F8FAFC" }
                }}
              />
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setIsAdding(false)} sx={{ color: "#64748b", fontWeight: 600 }}>Hủy</Button>
              <Button variant="contained" size="small" onClick={handleAdd} sx={{ borderRadius: "8px", bgcolor: "#1e293b", px: 3 }}>
                Lưu
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Paper>

  );
};

export default PreparationChecklistSection;
