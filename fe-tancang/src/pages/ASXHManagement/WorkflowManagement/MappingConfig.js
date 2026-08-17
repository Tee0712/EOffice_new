import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Pagination,
  Autocomplete,
  createFilterOptions
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Settings as SettingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CancelIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../services/api-client";
import { useToast } from "@components/common/ToastProvider";
import { Chip, Tooltip } from "@mui/material";

// Define filter outside to avoid recreation on every render
const filterConfig = createFilterOptions({ 
  limit: 5,
  stringify: (option) => `${option.name} ${option.processKey}`
});

const MappingConfig = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [mappings, setMappings] = useState({}); // { menuId: workflowKey }
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [editingRowId, setEditingRowId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modulesRes, workflowsRes, mappingsRes] = await Promise.all([
        apiClient.get("/module-workflow/modules"),
        apiClient.get("/module-workflow/workflows"),
        apiClient.get("/module-workflow/mappings")
      ]);

      if (modulesRes.success) {
        setModules(modulesRes.data || []);
      }
      if (workflowsRes.success) {
        setWorkflows(workflowsRes.data || []);
      }
      if (mappingsRes.success) {
        const initialMappings = {};
        if (Array.isArray(mappingsRes.data)) {
          mappingsRes.data.forEach(m => {
            const menuIdRaw = m.menuId || m.menu_id;
            const workflowKeyRaw = m.workflowKey || m.workflow_key;
            if (menuIdRaw && workflowKeyRaw) {
              const mId = String(menuIdRaw).trim().toUpperCase();
              const wKey = String(workflowKeyRaw).trim();
              initialMappings[mId] = wKey;
            }
          });
        }
        setMappings(initialMappings);
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredModules = useMemo(() => {
    let result = modules;
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = modules.filter(m => 
        m.name?.toLowerCase().includes(lowSearch) || 
        m.code?.toLowerCase().includes(lowSearch)
      );
    }
    return result;
  }, [modules, searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const paginatedModules = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredModules.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredModules, page]);

  const handleMappingChange = (menuId, workflowKey) => {
    const mId = String(menuId).trim().toUpperCase();
    setMappings(prev => ({
      ...prev,
      [mId]: workflowKey
    }));
  };

  const handleCancel = () => {
    setEditingRowId(null);
    fetchData(); // Reset to original mappings
  };

  const handleSave = async (menuId) => {
    const mIdClean = String(menuId).trim().toUpperCase();
    const workflowKey = mappings[mIdClean];
    
    if (!workflowKey) {
      toast("Vui lòng chọn luồng quy trình", "warning");
      return;
    }

    try {
      const res = await apiClient.post("/module-workflow/mapping", {
        menuId: mIdClean,
        workflowKey
      });
      if (res.success) {
        toast("Lưu cấu hình thành công", "success");
        setEditingRowId(null);
      } else {
        toast(res.message || "Lưu thất bại", "error");
      }
    } catch (err) {
      toast("Đã có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (menuId) => {
    const mIdClean = String(menuId).trim().toUpperCase();
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình luồng cho Module này?")) return;

    try {
      const res = await apiClient.post("/module-workflow/delete-mapping", {
        menuId: mIdClean
      });
      if (res.success) {
        toast("Đã xóa cấu hình thành công", "success");
        // Clear mapping from state
        setMappings(prev => {
          const newMappings = { ...prev };
          delete newMappings[mIdClean];
          return newMappings;
        });
        setEditingRowId(null);
      }
    } catch (err) {
      toast("Xóa thất bại", "error");
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: "#f4f7fa", 
      minHeight: "100vh",
      fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
      "& *": { fontFamily: "inherit" }
    }}>
      {/* 1. Header Area */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }}>
        <Box>
          <Breadcrumbs separator="/" sx={{ fontSize: 13, mb: 1, '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}>
            <Link 
              underline="hover" 
              color="inherit" 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate("/asxh/workflow-management"); }}
            >
              Quản lý luồng
            </Link>
            <Typography color="text.primary" sx={{ fontSize: 13 }}>Thiết lập luồng Module</Typography>
          </Breadcrumbs>
          
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
            Thiết lập luồng Module
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gán quy trình phê duyệt động cho từng Module lớn để quản lý tập trung.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
              placeholder="Tìm kiếm module..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                  width: 280,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                    fontSize: 14,
                    height: 40
                  }
              }}
              InputProps={{
                  startAdornment: (
                      <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                  ),
              }}
          />
          <Button
            variant="outlined"
            onClick={fetchData}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ 
                borderRadius: 1.5, 
                textTransform: 'none', 
                borderColor: 'grey.300',
                bgcolor: 'background.paper',
                fontWeight: 600,
                fontSize: 14,
                px: 2,
                color: "text.primary",
                height: 40,
                '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' }
            }}
          >
            Làm mới
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate("/asxh/workflow-management")}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none', 
              bgcolor: '#255df2',
              fontWeight: 600,
              fontSize: 14,
              px: 2.5,
              height: 40,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
            }}
          >
            Quay lại
          </Button>
        </Stack>
      </Stack>

      {/* 2. Main Table Area */}
      <Paper elevation={0} sx={{ 
          border: "1px solid", 
          borderColor: "grey.200", 
          borderRadius: 1.5, 
          overflow: "hidden" 
      }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  TÊN MODULE (MENU CHA)
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  MÃ MODULE
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  LUỒNG PHÊ DUYỆT ĐƯỢC GÁN
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5, width: 140 }}>
                  THAO TÁC
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={28} sx={{ color: "primary.main", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Đang tải dữ liệu...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedModules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" color="text.secondary">
                        Không tìm thấy dữ liệu phù hợp
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModules.map((mod) => (
                  <TableRow 
                    key={mod.id} 
                    hover 
                    sx={{ "& td": { borderBottom: "1px solid", borderColor: "grey.100" }, "&:last-child td": { border: 0 } }}
                  >
                    <TableCell sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight="600" color="#0f172a">
                        {mod.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: 1.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#64748b", fontWeight: 600 }}>
                        {mod.code}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: 1.5, minWidth: 320 }}>
                      {editingRowId === mod.id ? (
                        <FormControl fullWidth size="small">
                          <Autocomplete
                            size="small"
                            options={workflows}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              return option.name || option.processKey || "";
                            }}
                            value={workflows.find(wf => wf.processKey === (mappings[String(mod.id).trim().toUpperCase()] || mappings[String(mod.code).trim().toUpperCase()])) || null}
                            onChange={(e, newValue) => handleMappingChange(mod.id, newValue?.processKey || null)}
                            isOptionEqualToValue={(option, value) => option.processKey === (typeof value === 'string' ? value : value?.processKey)}
                            filterOptions={filterConfig}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} sx={{ fontSize: 13 }}>
                                <Stack>
                                  <Typography variant="body2" fontWeight="600">{option.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{option.processKey}</Typography>
                                </Stack>
                              </Box>
                            )}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                autoFocus
                                placeholder="Tìm kiếm luồng (Tên hoặc Mã)..." 
                                variant="outlined"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: 13,
                                    py: 0.5,
                                    bgcolor: "#fff",
                                    borderRadius: 1
                                  }
                                }}
                              />
                            )}
                            sx={{ width: '100%' }}
                          />
                        </FormControl>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {(() => {
                            const mKey = mappings[String(mod.id).trim().toUpperCase()] || mappings[String(mod.code).trim().toUpperCase()];
                            const wf = workflows.find(w => w.processKey === mKey);
                            if (wf) {
                              return (
                                <Stack>
                                  <Typography variant="body2" fontWeight="600" color="primary.main">
                                    {wf.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {wf.processKey}
                                  </Typography>
                                </Stack>
                              );
                            }
                            return (
                              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                Chưa thiết lập
                              </Typography>
                            );
                          })()}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {editingRowId === mod.id ? (
                          <>
                            <Tooltip title="Lưu">
                              <IconButton size="small" color="primary" onClick={() => handleSave(mod.id)}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hủy">
                              <IconButton size="small" color="error" onClick={handleCancel}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Sửa cấu hình">
                              <IconButton size="small" color="info" onClick={() => setEditingRowId(mod.id)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa cấu hình">
                              <IconButton size="small" color="error" onClick={() => handleDelete(mod.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Footer */}
        <Box sx={{ 
          p: 2, 
          borderTop: "1px solid", 
          borderColor: "grey.200", 
          bgcolor: "#fff", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
           <Typography variant="body2" color="text.secondary">
              Hiển thị {filteredModules.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} - {Math.min(page * PAGE_SIZE, filteredModules.length)} của {filteredModules.length} bản ghi
           </Typography>
           <Pagination 
            count={Math.ceil(filteredModules.length / PAGE_SIZE)} 
            page={page} 
            onChange={(e, p) => setPage(p)} 
            color="primary" 
            shape="rounded" 
            size="small" 
          />
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled">
              &copy; 2024 EOFFICE - Hệ thống quản lý quy trình nghiệp vụ thông minh
          </Typography>
      </Box>
    </Box>
  );
};

export default MappingConfig;
