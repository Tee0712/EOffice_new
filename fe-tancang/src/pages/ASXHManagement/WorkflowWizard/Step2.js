import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import { 
  Delete as DeleteIcon, 
  Add as AddIcon,
  HelpOutline as HelpIcon 
} from "@mui/icons-material";
import workflowWizardService from "@services/workflowWizardService";

const Step2 = ({ data, updateData }) => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch groups for searching
  const fetchGroups = async (keyword = "") => {
    setLoadingGroups(true);
    try {
      const res = await workflowWizardService.getGroups({ keyword, limit: 5 });
      if (res.data) {
        setGroups(res.data);
      }
    } catch (error) {
      console.error("Fetch groups failed:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddRole = () => {
    const newRoles = [...data.roles, { name: "", roleCode: "", groupIds: [] }];
    updateData({ roles: newRoles });
  };

  const handleRemoveRole = (index) => {
    const newRoles = data.roles.filter((_, i) => i !== index);
    updateData({ roles: newRoles });
  };

  const handleRoleChange = (index, field, value) => {
    const newRoles = [...data.roles];
    newRoles[index][field] = value;
    updateData({ roles: newRoles });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#475569" }}>
          Bước 2: Định nghĩa vai trò quy trình
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={handleAddRole}
          sx={{ borderRadius: 1.5, textTransform: "none", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
        >
          Thêm vai trò
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f1f5f9" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: "30%" }}>Tên vai trò</TableCell>
              <TableCell sx={{ fontWeight: 700, width: "25%" }}>Mã vai trò</TableCell>
              <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                Nhóm người dùng đảm nhận
                <Tooltip title="Tất cả người dùng trong nhóm sẽ được gán vai trò này cho quy trình hiện tại">
                   <IconButton size="small"><HelpIcon fontSize="small" /></IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: "10%" }}>Xóa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.roles.map((role, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ví dụ: Người soạn thảo"
                    value={role.name}
                    onChange={(e) => handleRoleChange(index, "name", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ví dụ: NGUOI_SOAN_THAO"
                    value={role.roleCode}
                    onChange={(e) => handleRoleChange(index, "roleCode", e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    multiple
                    size="small"
                    options={groups}
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={groups.filter(g => (role.groupIds || []).includes(g.id))}
                    onChange={(event, newValue) => {
                      handleRoleChange(index, "groupIds", newValue.map(v => v.id));
                    }}
                    onInputChange={(event, newInputValue) => {
                      fetchGroups(newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Tìm kiếm nhóm..." />
                    )}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="error" 
                    size="small" 
                    onClick={() => handleRemoveRole(index)}
                    disabled={data.roles.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Step2;
