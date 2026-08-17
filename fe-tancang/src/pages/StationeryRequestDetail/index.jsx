import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  NavigateNext,
  PendingActionsOutlined as PendingIcon,
  ScheduleOutlined as TimeIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import { useToast } from "../../components/common/ToastProvider";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRequestDetail,
  getExpectedApprovalFlow,
  deleteRequest,
  approveRequest,
} from "../../services/vppService";
import moment from "moment";

const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.user || parsed;
    }
  } catch (e) {}
  return null;
};

const StationeryRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [data, setData] = useState(null);
  const [expectedUsers, setExpectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, flowRes] = await Promise.all([
        getRequestDetail(id),
        getExpectedApprovalFlow({ moduleType: "VPP" }),
      ]);

      if (res?.success) {
        setData(res.data);
      }
      if (flowRes?.success) {
        setExpectedUsers(flowRes.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tải chi tiết đề nghị", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu nháp này?")) {
      try {
        const res = await deleteRequest(id);
        if (res?.success) {
          showToast("Xóa phiếu thành công", "success");
          navigate("/office-supply-request/list");
        } else {
          showToast(res?.message || "Lỗi khi xóa phiếu", "error");
        }
      } catch (err) {
        showToast("Lỗi hệ thống khi xóa phiếu", "error");
      }
    }
  };

  const handleEdit = () => {
    navigate(`/office-supply-request/review/${id}`);
  };

  if (loading)
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (!data)
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography>Không tìm thấy dữ liệu đề nghị</Typography>
      </Box>
    );

  // Check if current user is involved (creator, approver or has VPP management role)
  const currentUserIdStr = String(currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.user || '');
  const isRequester = currentUserIdStr === String(data.requester_id || '');
  const isApprover = currentUserIdStr === String(data.approver || '') || currentUser?.username === data.approver_username;
  
  // Check if user is any reviewer in the expected flow
  const isReviewer = expectedUsers.some(u => 
    String(u.id || u._id || u.approved_id) === currentUserIdStr || 
    u.username === currentUser?.username
  );

  const isAdmin = currentUser?.roles?.some(r => 
    (typeof r === 'string' && (r === 'ADMIN' || r === 'admin_vpp' || r === 'user_vpp')) ||
    (r?.code && (r.code === 'ADMIN' || r.code === 'admin_vpp' || r.code === 'user_vpp'))
  ) || currentUser?.role === "ADMIN";

  const statusUpper = data.status?.toUpperCase() || "";
  const PENDING_STATUSES = [
    "PENDING",
    "PENDING_APPROVAL",
    "PENDING_DEPT_APPROVAL",
    "PENDING_HC_APPROVAL",
  ];
  const isPending = PENDING_STATUSES.includes(statusUpper);

  const STATUS_LABELS = {
    DRAFT: "Nháp",
    PENDING: "Chờ duyệt",
    PENDING_APPROVAL: "Chờ duyệt",
    PENDING_DEPT_APPROVAL: "Chờ duyệt",
    PENDING_HC_APPROVAL: "Chờ duyệt",
    APPROVED: "Chờ cấp phát",
    PENDING_ISSUE: "Chờ cấp phát",
    REJECTED: "Từ chối",
    FINISHED: "Hoàn thành",
    COMPLETED: "Hoàn thành",
  };

  if (!isRequester && !isApprover && !isAdmin && !isReviewer) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Bạn không có quyền truy cập thông tin phiếu này.
        </Typography>
        <Button
          onClick={() => navigate("/office-supply-request/list")}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d.-]/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const stripDiacritics = (value) => {
    if (!value) return "";
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return "---";
    const upper = String(priority).toUpperCase().trim();
    if (upper === "CRITICAL") return "KHẨN CẤP";
    if (upper === "URGENT") return "GẤP";
    if (upper === "NORMAL") return "BÌNH THƯỜNG";

    const normalized = stripDiacritics(priority);
    if (normalized.includes("khan")) return "GẤP";
    if (normalized.includes("gap")) return "GẤP";
    if (normalized.includes("binh thuong")) return "BÌNH THƯỜNG";

    return String(priority);
  };

  const isUrgentPriority = (priority) => {
    const upper = String(priority || "")
      .toUpperCase()
      .trim();
    if (upper === "CRITICAL" || upper === "URGENT") return true;
    const normalized = stripDiacritics(priority);
    return normalized.includes("khan") || normalized.includes("gap");
  };

  // Ưu tiên actual_quantity (SL người duyệt xác nhận) nếu có, fallback về requested_quantity nếu chưa được duyệt (bằng 0 hoặc null)
  const getActualQuantity = (item) => {
    const actual = toNumber(item?.actual_quantity);
    if (actual > 0) return actual;
    return getRequestedQuantity(item);
  };
  const getRequestedQuantity = (item) =>
    toNumber(item?.requested_quantity ?? item?.quantity ?? 0);

  // Kiểm tra xem phiếu đã được duyệt (có actual_quantity) chưa
  const isApprovedStatus = [
    "APPROVED",
    "PENDING_ISSUE",
    "FINISHED",
    "COMPLETED",
  ].includes(statusUpper);

  const totalAmount = (data.items || []).reduce((sum, item) => {
    const price = toNumber(item?.price);
    const quantity = getActualQuantity(item);
    return sum + price * quantity;
  }, 0);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 1 }}
          >
            <Link
              color="inherit"
              onClick={() => navigate("/")}
              sx={{ cursor: "pointer" }}
              underline="hover"
            >
              Trang chủ
            </Link>
            <Link
              color="inherit"
              onClick={() => navigate("/office-supply-request/list")}
              sx={{ cursor: "pointer" }}
              underline="hover"
            >
              Văn phòng phẩm
            </Link>
            <Typography color="text.primary">Chi tiết đề nghị</Typography>
          </Breadcrumbs>
          <Typography variant="h5" fontWeight="bold">
            Phiếu đề nghị: {data.request_number}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {isRequester &&
            (statusUpper === "DRAFT" || statusUpper === "REJECTED") && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Chỉnh sửa
              </Button>
            )}

          {isRequester && statusUpper === "DRAFT" && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Xóa phiếu
            </Button>
          )}

          <Chip
            label={
              isPending
                ? "ĐANG CHỜ DUYỆT"
                : STATUS_LABELS[statusUpper] || statusUpper
            }
            color={
              isPending
                ? "warning"
                : statusUpper === "REJECTED"
                  ? "error"
                  : "success"
            }
            sx={{ fontWeight: "bold" }}
          />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column: Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Thông tin chung
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Người đề nghị
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {data.requester_name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phòng ban
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {data.department_name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ngày đề nghị
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {moment(data.created_at).format("DD/MM/YYYY")}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Mức ưu tiên
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      color={
                        isUrgentPriority(data.priority)
                          ? "error.main"
                          : "text.primary"
                      }
                    >
                      {getPriorityLabel(data.priority)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Lý do sử dụng
                    </Typography>
                    <Typography variant="body1">
                      {data.reason || "---"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Danh sách mặt hàng
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                variant="outlined"
              >
                <Table>
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Mặt hàng</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        ĐVT
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        SL đề nghị
                      </TableCell>
                      {isApprovedStatus && (
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, color: "success.main" }}
                        >
                          SL được duyệt
                        </TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Đơn giá (TK)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Thành tiền
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items?.map((item, index) => {
                      const requestedQty = getRequestedQuantity(item);
                      const actualQty = getActualQuantity(item);
                      const price = toNumber(item?.price);
                      const lineTotal = price * actualQty;
                      const isAdjusted =
                        isApprovedStatus &&
                        item.actual_quantity != null &&
                        actualQty !== requestedQty;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {item.product_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.product_code}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.unit}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: isAdjusted
                                ? "text.secondary"
                                : "text.primary",
                              textDecoration: isAdjusted
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {new Intl.NumberFormat("vi-VN").format(
                              requestedQty
                            )}
                          </TableCell>
                          {isApprovedStatus && (
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, color: "success.main" }}
                            >
                              {new Intl.NumberFormat("vi-VN").format(actualQty)}
                            </TableCell>
                          )}
                          <TableCell align="right">
                            {new Intl.NumberFormat("vi-VN").format(price)} ₫
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: "bold", color: "primary.main" }}
                          >
                            {new Intl.NumberFormat("vi-VN").format(lineTotal)} ₫
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ bgcolor: "primary.50" }}>
                      <TableCell
                        colSpan={isApprovedStatus ? 5 : 4}
                        align="right"
                        sx={{ fontWeight: "bold" }}
                      >
                        TỔNG ƯỚC TÍNH:
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: "bold",
                          color: "primary.main",
                          fontSize: "1rem",
                        }}
                      >
                        {new Intl.NumberFormat("vi-VN").format(totalAmount)} ₫
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Workflow & Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Quyền phê duyệt & Theo dõi
              </Typography>
              <Stack spacing={2}>
                {/* Người tạo phiếu: Quyền theo dõi */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{ width: 36, height: 36, bgcolor: "primary.light" }}
                  >
                    {data.requester_name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {data.requester_name}
                    </Typography>
                    <Chip
                      label="Người tạo / Theo dõi"
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
                    />
                  </Box>
                </Stack>

                <Divider />

                {/* Danh sách người có quyền duyệt */}
                {expectedUsers
                  .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
                  .map((user, idx) => {
                    const userId = String(
                      user.id || user._id || user.approved_id || ""
                    );
                    const currentApproverId = String(data.approver || "");
                    const isCurrentApprover =
                      currentApproverId !== "" &&
                      (currentApproverId === userId ||
                        currentApproverId === user.username);

                    return (
                      <Stack
                        direction="row"
                        spacing={2}
                        key={idx}
                        alignItems="center"
                        sx={{
                          p: isCurrentApprover ? 1.5 : 0,
                          borderRadius: 2,
                          bgcolor: isCurrentApprover
                            ? "rgba(2, 136, 209, 0.08)"
                            : "transparent",
                          border: isCurrentApprover ? "1px dashed" : "none",
                          borderColor: "info.main",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isCurrentApprover
                              ? "info.main"
                              : "grey.300",
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                          }}
                        >
                          {user.name?.charAt(0) ||
                            user.username?.charAt(0) ||
                            "D"}
                        </Avatar>
                        <Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={
                                isCurrentApprover ? "info.main" : "text.primary"
                              }
                            >
                              {user.name ||
                                user.username ||
                                `Người duyệt ${user.approved_id || idx + 1}`}
                            </Typography>
                            {isCurrentApprover && isPending && (
                              <Chip
                                label="Đang chờ duyệt"
                                size="small"
                                color="info"
                                variant="filled"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  fontWeight: 900,
                                }}
                              />
                            )}
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {user.departmentName || "Bộ phận phê duyệt"}
                          </Typography>
                          <Chip
                            label={`Người duyệt (Bậc ${user.stepOrder})`}
                            size="small"
                            variant="soft"
                            sx={{
                              height: 18,
                              fontSize: "0.625rem",
                              fontWeight: 700,
                              mt: 0.5,
                              bgcolor: isCurrentApprover
                                ? "info.50"
                                : "#f1f5f9",
                              color: isCurrentApprover
                                ? "info.main"
                                : "text.secondary",
                              border: "none",
                            }}
                          />
                        </Box>
                      </Stack>
                    );
                  })}

                {expectedUsers.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    Chưa cấu hình luồng duyệt cho phiếu này.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Tiến độ phê duyệt
              </Typography>
              <Stack spacing={2.5}>
                {data.logs?.map((log, i) => (
                  <Stack direction="row" spacing={2} key={i}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        bgcolor:
                          log.status === "APPROVED"
                            ? "success.main"
                            : log.status === "REJECTED"
                              ? "error.main"
                              : "grey.400",
                      }}
                    >
                      {i + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">{log.actor_name || 'Hệ thống'}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{log.actor_role || 'Thành viên'}</Typography>
                      {log.comment && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontStyle: "italic",
                            bgcolor: "grey.100",
                            px: 1,
                            borderRadius: 0.5,
                            display: "block",
                            mt: 0.5,
                          }}
                        >
                          "{log.comment}"
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.disabled",
                          display: "flex",
                          alignItems: "center",
                          mt: 0.5,
                        }}
                      >
                        <TimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {moment(log.created_at).fromNow()}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationeryRequestDetail;
