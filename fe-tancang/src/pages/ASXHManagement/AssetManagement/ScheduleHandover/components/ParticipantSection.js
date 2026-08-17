import React, { useState } from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Stack,
  Button,
  Chip,
  Avatar,
  IconButton,
  Grid
} from "@mui/material";
import { Add, Close, Person } from "@mui/icons-material";

const ParticipantSection = ({ attendees, locality, onAdd, onRemove, onRoleChange }) => {
  const getInitials = (name) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(-2) || "??";
  };

  const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", bgcolor: "#3b82f6", 
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.875rem"
        }}>
          4
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          Đoàn tham dự (phía TCSG)
        </Typography>
      </Stack>

      <Box sx={{ 
        p: 2.5, borderRadius: "16px", border: "1px solid #f1f5f9", 
        bgcolor: "#FFFFFF", minHeight: 80
      }}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
          {attendees.map((person, idx) => (
            <Box key={person.id} sx={{ 
              display: "flex", alignItems: "center", bgcolor: "#f1f5f9", 
              borderRadius: "50px", pr: 1.5, pl: 0.5, py: 0.5, border: "1px solid #e2e8f0",
              height: 44
            }}>
              <Avatar sx={{ 
                bgcolor: colors[idx % colors.length], color: "white", 
                width: 34, height: 34, fontSize: "0.75rem", fontWeight: 800, mr: 1.5
              }}>
                {getInitials(person.name || person.full_name)}
              </Avatar>
              <Box sx={{ mr: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                  {person.name || person.full_name}
                </Typography>
                <Typography 
                  variant="caption" 
                  onClick={() => onRoleChange(person.id)}
                  sx={{ 
                    color: "#64748b", fontWeight: 600, fontSize: "0.7rem", 
                    cursor: "pointer", "&:hover": { color: "#3b82f6" } 
                  }}
                >
                  {person.role || "Thành viên"}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => onRemove(person.id)} sx={{ padding: 0.25 }}>
                <Close sx={{ fontSize: "0.9rem", color: "#94a3b8" }} />
              </IconButton>
            </Box>
          ))}

          <Button 
            variant="text"
            onClick={onAdd}
            sx={{ 
              height: 44, borderRadius: "50px", border: "1px dashed #cbd5e1",
              textTransform: "none", color: "#94a3b8", px: 3,
              "&:hover": { borderStyle: "solid", bgcolor: "#f8fafc" }
            }}
          >
            + Thêm thành viên
          </Button>
        </Stack>
      </Box>

      {attendees.length > 0 && (
        <Typography variant="caption" sx={{ mt: 2, display: "block", color: "#64748b", fontWeight: 500, fontStyle: "italic" }}>
          Đoàn {attendees.length} người · Cần sắp xếp phương tiện di chuyển TP.HCM → {locality || "Đắk Hà, Kon Tum"}
        </Typography>
      )}
    </Paper>
  );
};

export default ParticipantSection;
