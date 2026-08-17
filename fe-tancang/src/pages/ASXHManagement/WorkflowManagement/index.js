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
  IconButton,
  Button,
  Stack,
  Tooltip,
  Chip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Pagination
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Settings as SettingIcon,
  NavigateNext as NavigateNextIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import workflowWizardService from "@services/workflowWizardService";
import { useToast } from "@components/common/ToastProvider";
import moment from "moment";

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowWizardService.getList();
      if (res.success) {
        setWorkflows(res.data || []);
      } else {
        toast(res.message || "Không thể tải danh sách luồng", "error");
      }
    } catch (err) {
      toast("Đã có lỗi xảy ra khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Derived paginated workflows
  const paginatedWorkflows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return workflows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [workflows, page]);

  const totalPages = Math.ceil(workflows.length / PAGE_SIZE);

  const handleDelete = async (processKey) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa luồng quy trình "${processKey}"? Hành động này không thể hoàn tác.`)) {
      try {
        const res = await workflowWizardService.deleteWorkflow(processKey);
        if (res.success) {
          toast("Xóa luồng quy trình thành công", "success");
          fetchWorkflows();
        } else {
          toast(res.message || "Xóa thất bại", "error");
        }
      } catch (err) {
        toast("Có lỗi xảy ra khi xóa", "error");
      }
    }
  };

  const handleEdit = (processKey) => {
    navigate(`/asxh/workflow-wizard/${processKey}`);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: "#f4f7fa", 
      minHeight: "100vh",
      fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
      "& *": { fontFamily: "inherit" }
    }}>
      {/* 1. Header & Breadcrumbs */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }}>
        <Box>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            sx={{ mb: 1, "& .MuiTypography-root": { fontSize: 13, fontWeight: 500 } }}
          >
            <Link underline="hover" color="inherit" onClick={() => navigate("/dashboard-asxh")} sx={{ cursor: 'pointer' }}>
              An sinh xã hội
            </Link>
            <Typography color="text.primary">Quản lý luồng xử lý</Typography>
          </Breadcrumbs>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: "#0f172a", 
            mb: 1 
          }}>
            Quản lý Luồng Quy trình
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thiết kế và quản lý các luồng phê duyệt nghiệp vụ tập trung.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchWorkflows}
            disabled={loading}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none', 
              borderColor: 'grey.300',
              bgcolor: 'background.paper',
              fontWeight: 600,
              fontSize: 14,
              px: 2,
              '&:hover': { bgcolor: 'grey.50' }
            }}
          >
            Làm mới
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingIcon />}
            onClick={() => navigate("/asxh/workflow-mapping")}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: 14,
              px: 2,
            }}
          >
            Cấu hình luồng Module
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/asxh/workflow-wizard")}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none',
              bgcolor: '#255df2',
              fontWeight: 600,
              fontSize: 14,
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
            }}
          >
            Tạo luồng mới
          </Button>
        </Stack>
      </Stack>

      {/* 2. Table Content */}
      <TableContainer component={Paper} sx={{ 
        borderRadius: 2, 
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        border: "1px solid",
        borderColor: "grey.200",
        overflow: "hidden" 
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: 13, py: 1.5 }}>Tên quy trình</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: 13, py: 1.5 }}>Mã quy trình</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: 13, py: 1.5 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: 13, py: 1.5 }}>Cập nhật lần cuối</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", fontSize: 13, py: 1.5 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={32} sx={{ color: '#255df2' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>Đang nạp dữ liệu...</Typography>
                </TableCell>
              </TableRow>
            ) : workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Box sx={{ opacity: 0.6, mb: 2 }}>
                    <SearchIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>Chưa có quy trình nào</Typography>
                  <Button 
                    variant="text" 
                    onClick={() => navigate("/asxh/workflow-wizard")}
                    sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}
                  >
                    Bắt đầu thiết kế luồng đầu tiên
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              paginatedWorkflows.map((row) => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {row.name}
                    </Typography>
                    {row.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {row.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.processKey} 
                      size="small" 
                      sx={{ 
                        bgcolor: "#f1f5f9", 
                        color: "#64748b", 
                        fontWeight: 700, 
                        borderRadius: 1,
                        fontSize: 11
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status === 1 ? "Hoạt động" : "Tạm ngưng"} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: 11,
                        bgcolor: row.status === 1 ? "#ecfdf5" : "#f1f5f9",
                        color: row.status === 1 ? "#059669" : "#64748b",
                        border: "1px solid",
                        borderColor: row.status === 1 ? "#10b98133" : "grey.200"
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
                      {moment(row.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Chỉnh sửa luồng">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(row.processKey)}
                          sx={{ color: "#2563eb", "&:hover": { bgcolor: "#eff6ff" } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa quy trình">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(row.processKey)}
                          sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3. Global Pagination */}
      {!loading && workflows.length > PAGE_SIZE && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "grey.200"
        }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, workflows.length)} của {workflows.length} bản ghi
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default WorkflowManagement;
