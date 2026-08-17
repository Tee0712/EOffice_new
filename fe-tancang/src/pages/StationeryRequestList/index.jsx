import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Box, Stack, Typography, Breadcrumbs, Link, Button, Grid, Card, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Chip, Pagination, CircularProgress
} from "@mui/material";
import {
  Add as AddIcon, VisibilityOutlined as ViewIcon,
  CheckCircle as SuccessIcon, Pending as PendingIcon, Cancel as ErrorIcon,
  Timeline as TimelineIcon, LocalShipping as ShippingIcon,
  FactCheck as FactCheckIcon,
  ModeEditOutlineOutlined as EditIcon,
  DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useToast } from "../../components/common/ToastProvider";
import { useNavigate } from "react-router-dom";
import { getRequests, deleteRequest } from "../../services/vppService";
import { AuthContext } from "../../AuthContext/AuthProvider";
import moment from "moment";

const StationeryRequestList = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "all",
    search: ""
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    finished: 0,
    draft: 0
  });

  const { user: authData } = useContext(AuthContext);
  const currentUserId = authData?.user?.user || authData?.user?._id;

  const fetchData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const apiParams = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== "all" ? filters.status : undefined,
        keyword: filters.search || undefined,
        requester_id: currentUserId,
        approver: currentUserId
      };
      const res = await getRequests(apiParams);
      if (res?.success) {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
        if (res.data.summary) {
          setStats({
            total: res.data.summary.total || 0,
            pending: res.data.summary.pending || 0,
            approved: res.data.summary.approved || 0,
            rejected: res.data.summary.rejected || 0,
            finished: res.data.summary.finished || 0,
            draft: res.data.summary.draft || 0
          });
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tải danh sách đề nghị", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, currentUserId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phiếu nháp này?")) return;
    
    try {
      const res = await deleteRequest(id);
      if (res?.success) {
        showToast("Xóa phiếu thành công", "success");
        fetchData();
      } else {
        showToast(res?.message || "Lỗi khi xóa phiếu", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi hệ thống khi xóa phiếu", "error");
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "DRAFT":
        return <Chip size="small" icon={<TimelineIcon />} label="Nháp" color="default" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "PENDING":
        return <Chip size="small" icon={<PendingIcon />} label="Chờ duyệt" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "PENDING_APPROVAL":
        return <Chip size="small" icon={<PendingIcon />} label="Chờ duyệt" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "APPROVED":
        return <Chip size="small" icon={<SuccessIcon />} label="Đã duyệt" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "REJECTED":
        return <Chip size="small" icon={<ErrorIcon />} label="Từ chối" color="error" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "FINISHED":
        return <Chip size="small" icon={<SuccessIcon />} label="Hoàn tất" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
      case "COMPLETED":
        return <Chip size="small" icon={<SuccessIcon />} label="Hoàn tất" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip size="small" label={status} variant="outlined" />;
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f4f7fa", minHeight: "90vh" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, typography: 'body2' }}>
            <Link underline="hover" color="text.secondary" href="/">Trang chủ</Link>
            <Typography color="text.secondary">Văn phòng phẩm</Typography>
            <Typography color="text.primary" fontWeight="600">Đề nghị cấp phát</Typography>
          </Breadcrumbs>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#111827', mb: 0.5, letterSpacing: '-0.01em' }}>
            Danh sách phiếu đề nghị cấp VPP
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate("/office-supply-request/create")}
          sx={{ borderRadius: 1.5, textTransform: 'none', bgcolor: '#255df2', fontWeight: 600, boxShadow: 'none' }}
        >
          Tạo đề nghị mới
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Tổng số phiếu", value: stats.total, status: "all", color: "#255df2", bg: "#e8effe", icon: <TimelineIcon /> },
          { label: "Phiếu nháp", value: stats.draft, status: "DRAFT", color: "#64748b", bg: "#f1f5f9", icon: <EditIcon /> },
          { label: "Chờ phê duyệt", value: stats.pending, status: "PENDING", color: "#d97706", bg: "#fef3c7", icon: <PendingIcon /> },
          { label: "Đã phê duyệt", value: stats.approved, status: "APPROVED", color: "#0284c7", bg: "#e0f2fe", icon: <SuccessIcon /> },
          { label: "Hoàn thành", value: stats.finished, status: "FINISHED", color: "#16a34a", bg: "#e6f8f1", icon: <ShippingIcon /> }
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={2.4} key={i}>
            <Card 
              elevation={0} 
              onClick={() => setFilters(prev => ({ ...prev, status: s.status, page: 1 }))}
              sx={{ 
                borderRadius: 1.5, 
                border: "1px solid", 
                borderColor: filters.status === s.status ? s.color : "grey.200", 
                p: 2,
                cursor: "pointer",
                transition: "all 0.2s",
                bgcolor: filters.status === s.status ? s.bg : "white",
                '&:hover': {
                  borderColor: s.color,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar variant="rounded" sx={{ bgcolor: filters.status === s.status ? "white" : s.bg, color: s.color, borderRadius: 1.5 }}>
                  {s.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" color={filters.status === s.status ? s.color : "inherit"}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">{s.label}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "#f8f9fb" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>SỐ PHIẾU / NGÀY TẠO</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>NGƯỜI ĐỀ NGHỊ</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>PHÒNG BAN</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>MẶT HÀNG / GIÁ TRỊ</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>TRẠNG THÁI</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.secondary", fontSize: 13 }}>THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Đang tải...</Typography>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" color="primary.main">{row.request_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{moment(row.created_at).format("DD/MM/YYYY HH:mm")}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{row.requester_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.department_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">{row.total_items} mặt hàng</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        {new Intl.NumberFormat("vi-VN").format(row.estimated_value || 0)} ₫
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(row.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/office-supply-request/detail/${row.id}`)}
                            sx={{ bgcolor: "grey.100", '&:hover': { bgcolor: "primary.light", color: "primary.main" } }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {(row.status === "PENDING" || row.status === "DRAFT" || row.status === "REJECTED") && (
                          <Tooltip title="Cập nhật">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/office-supply-request/review/${row.id}`)}
                              sx={{
                                bgcolor: "#eff6ff",
                                color: "#2563eb",
                                '&:hover': { bgcolor: "#dbeafe" }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {row.status === "DRAFT" && (
                          <Tooltip title="Xóa nháp">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(row.id)}
                              sx={{
                                bgcolor: "#fef2f2",
                                color: "#ef4444",
                                '&:hover': { bgcolor: "#fee2e2" }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Chưa có dữ liệu đề nghị</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "grey.200" }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {filters.page * filters.limit - filters.limit + 1} - {Math.min(filters.page * filters.limit, total)} của {total} kết quả
          </Typography>
          <Pagination
            count={Math.ceil(total / filters.limit) || 1}
            page={filters.page}
            onChange={(e, p) => setFilters(prev => ({ ...prev, page: p }))}
            color="primary" shape="rounded" size="small"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default StationeryRequestList;
