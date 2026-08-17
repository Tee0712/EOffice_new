import React, { useState } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Checkbox,
  InputAdornment,
  Box,
  Typography,
  Chip,
  CircularProgress
} from "@mui/material";
import asxhService from "@services/asxhService";
import { Search, Person } from "@mui/icons-material";

const MemberSelectionModal = ({ open, onClose, selectedIds, onConfirm, currentAttendees = [] }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tempSelected, setTempSelected] = useState(selectedIds);
  const [memberRoles, setMemberRoles] = useState({});

  const fetchUsers = React.useCallback(async (name = "") => {
    setLoading(true);
    try {
      const resp = await asxhService.getUsersLimit({ 
        page: 1, 
        limit: 100, 
        name 
      });
      // The API returns { success: true, items, total_count } or { success: true, data: { items } }
      const userData = resp?.items || resp?.data?.items || (Array.isArray(resp?.data) ? resp.data : []);
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial state setup when open
  React.useEffect(() => {
    if (open) {
      setTempSelected(selectedIds || []);
      setMemberRoles(currentAttendees.reduce((acc, a) => ({ ...acc, [a.id]: a.role || a.user_role }), {}));
      setSearch("");
    }
  }, [open, selectedIds, currentAttendees]);

  // Single effect for fetching (Handles both initial load and search)
  React.useEffect(() => {
    if (!open) return;

    // Use a shorter delay (or 0) for the initial empty search to make it feel responsive
    const delay = search === "" ? 0 : 500;

    const timeoutId = setTimeout(() => {
      fetchUsers(search);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [search, open, fetchUsers]);

  const roles = ["Thành viên", "Trưởng đoàn", "Hành chính", "Kỹ thuật IT", "Truyền thông", "Điều phối"];

  // Since we use server-side search, 'users' already contains the filtered list.
  // But we can keep an additional client-side check if needed for instantaneous feedback, 
  // though it's better to show what the server returned.
  const filtered = users.filter(m => 
    (m.name || m.full_name)?.toLowerCase().includes(search.toLowerCase()) || 
    m.username?.toLowerCase().includes(search.toLowerCase()) ||
    (m.parent?.name || m.organization_name)?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id) => {
    setTempSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRoleCycle = (id) => {
    setMemberRoles(prev => {
      const currentRole = prev[id] || "Thành viên";
      const nextIdx = (roles.indexOf(currentRole) + 1) % roles.length;
      return { ...prev, [id]: roles[nextIdx] };
    });
  };

  const handleConfirm = () => {
    const selectedWithRoles = tempSelected.map(id => {
      const member = users.find(m => m.id === id);
      return {
        ...member,
        name: member?.name || member?.full_name,
        organization_name: member?.parent?.name || member?.organization_name,
        role: memberRoles[id] || "Thành viên"
      };
    }).filter(Boolean);
    onConfirm(selectedWithRoles);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: "#1e293b", pb: 1 }}>
        Chọn thành viên đoàn
        <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 500 }}>
          {tempSelected.length} thành viên đang được chọn
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm cán bộ, phòng ban..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8" }} /></InputAdornment>
          }}
        />

        <Box sx={{ maxHeight: 400, overflow: "auto", minHeight: 200 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress size={32} thickness={5} sx={{ color: "#3b82f6" }} />
            </Box>
          ) : (
            <List>
              {filtered.map((m) => {
                const isSelected = tempSelected.includes(m.id);
                return (
                  <ListItem 
                    key={m.id} 
                    sx={{ 
                      borderRadius: "10px", mb: 1, border: "1px solid #f1f5f9",
                      bgcolor: isSelected ? "#f8fafc" : "transparent"
                    }}
                    secondaryAction={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isSelected && (
                          <Chip 
                            label={memberRoles[m.id] || "Thành viên"} 
                            size="small" 
                            onClick={() => handleRoleCycle(m.id)}
                            sx={{ 
                              height: 24, fontSize: "0.65rem", fontWeight: 700, 
                              bgcolor: "#fef9c3", color: "#854d0e", cursor: "pointer"
                            }}
                          />
                        )}
                        <Checkbox edge="end" checked={isSelected} onChange={() => handleToggle(m.id)} />
                      </Box>
                    }
                  >
                    <ListItemAvatar onClick={() => handleToggle(m.id)} sx={{ cursor: "pointer" }}>
                      <Avatar sx={{ bgcolor: isSelected ? "#3b82f6" : "#f1f5f9", color: isSelected ? "white" : "#64748b" }}>
                        <Person fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      onClick={() => handleToggle(m.id)}
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                          {m.name || m.full_name}
                        </Typography>
                      }
                      secondary={m.parent?.name || m.organization_name || m.username}
                      secondaryTypographyProps={{ variant: "caption", sx: { color: "#64748b" } }}
                      sx={{ cursor: "pointer" }}
                    />
                  </ListItem>
                );
              })}
              {filtered.length === 0 && (
                <Box sx={{ p: 4, textAlign: "center", color: "#64748b" }}>
                  Không tìm thấy nhân sự phù hợp
                </Box>
              )}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
        <Button onClick={onClose} sx={{ color: "#64748b", fontWeight: 700 }}>Hủy</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          sx={{ bgcolor: "#1e293b", borderRadius: "10px", px: 4 }}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberSelectionModal;
