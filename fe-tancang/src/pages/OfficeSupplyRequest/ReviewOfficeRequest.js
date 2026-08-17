import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Breadcrumbs,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Chip,
  Divider,
  Avatar,
  Button,
  TextField,
  Tooltip,
  Checkbox,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import {
  ChevronLeft,
  Print,
  Assignment,
  FactCheck,
  AccessTime,
  AccountCircle,
  TrendingFlat,
  ErrorOutline,
  CheckCircleOutline,
  InfoOutlined,
  WarningAmberOutlined,
  Close,
  CallMade,
  ArrowUpward,
} from "@mui/icons-material";
import { useToast } from "../../components/common/ToastProvider";
import {
  getRequestDetail,
  getExpectedApprovalFlow,
  getApprovalFlowConfig,
  approveRequest,
  rejectRequest,
  escalateRequest,
  resubmitRequest,
} from "../../services/vppService";
import moment from "moment";

// --- Styled Tokens ---
const TOKENS = {
  accent: "#2563eb",
  accentLight: "#dbeafe",
  bg: "#f0f4f9",
  border: "#d8e3f0",
  textSecondary: "#475569",
  textTertiary: "#94a3b8",
  green: "#16a34a",
  greenBg: "#dcfce7",
  amber: "#d97706",
  amberBg: "#fef3c7",
  red: "#dc2626",
  redBg: "#fee2e2",
  purple: "#7c3aed",
  purpleBg: "#ede9fe",
  teal: "#0d9488",
};
const FLOW_MODULE_TYPE = "VPP";

const normalizeFlowSteps = (configuredSteps = [], fallbackUsers = []) => {
  if (!configuredSteps.length) return [];
  return configuredSteps.map((step, index) => {
    const userId = step.userId || step.id || step._id;
    const match = fallbackUsers.find(
      (user) => user.id === userId || user.username === step.username
    );
    return {
      id: userId,
      name: match?.name || step.name || step.username || "Người duyệt",
      username: match?.username || step.username,
      departmentName: match?.departmentName || step.departmentName,
      departmentCode: match?.departmentCode || step.departmentCode,
      order: step.order ?? index + 1,
    };
  });
};

const mapExpectedFlow = (users = []) =>
  users
    .map((user) => ({
      id: user.id || user._id || user.approved_id,
      approved_id: user.approved_id,
      name: user.name,
      username: user.username,
      departmentName: user.departmentName,
      departmentCode: user.departmentCode,
      stepOrder: user.stepOrder || 0,
    }))
    .sort((a, b) => a.stepOrder - b.stepOrder);

const determineNextApprover = (flow = [], currentUserId, currentUsername) => {
  if (!flow.length) return null;
  // Sort by stepOrder
  const sorted = [...flow].sort((a, b) => a.stepOrder - b.stepOrder);
  const currentIndex = sorted.findIndex(
    (item) =>
      (item.id && currentUserId && String(item.id) === String(currentUserId)) ||
      (item.approved_id &&
        currentUserId &&
        String(item.approved_id) === String(currentUserId)) ||
      (item.userId &&
        currentUserId &&
        String(item.userId) === String(currentUserId)) ||
      (item.username && currentUsername && item.username === currentUsername)
  );
  if (currentIndex === -1) {
    // Not found → assign to first step
    return sorted[0]?.id || sorted[0]?.approved_id || null;
  }
  const next = sorted[currentIndex + 1];
  return next?.id || next?.approved_id || null;
};

const getNextApproverInfo = (flow = [], currentUserId, currentUsername) => {
  if (!flow.length) return null;
  const sorted = [...flow].sort((a, b) => a.stepOrder - b.stepOrder);
  const currentIndex = sorted.findIndex(
    (item) =>
      (item.id && currentUserId && String(item.id) === String(currentUserId)) ||
      (item.approved_id &&
        currentUserId &&
        String(item.approved_id) === String(currentUserId)) ||
      (item.userId &&
        currentUserId &&
        String(item.userId) === String(currentUserId)) ||
      (item.username && currentUsername && item.username === currentUsername)
  );
  return currentIndex !== -1
    ? sorted[currentIndex + 1] || null
    : sorted[0] || null;
};

// --- Reusable ModernCard ---
const ModernCard = ({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  children,
  extra,
  loading,
}) => (
  <Card
    sx={{
      mb: 2,
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      border: "1px solid",
      borderColor: TOKENS.border,
      overflow: "hidden",
      position: "relative",
    }}
  >
    {loading && (
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: "rgba(255,255,255,0.7)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} />
      </Box>
    )}
    <Box
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid",
        borderColor: "#f1f5f9",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {Icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: iconBg,
              color: iconColor,
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}
        <Typography variant="subtitle2" fontWeight="700" color="#0f1a2e">
          {title}
        </Typography>
      </Stack>
      {extra}
    </Box>
    <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
  </Card>
);

// --- MODAL COMPONENTS ---
const ActionModal = ({
  open,
  onClose,
  title,
  icon: Icon,
  color,
  bg,
  children,
  onConfirm,
  confirmText,
  confirmIcon,
  loading,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: { borderRadius: "16px", p: 1 },
    }}
  >
    <Box
      sx={{
        p: 2,
        pb: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Icon sx={{ color, fontSize: 24 }} />
        <Typography
          variant="h6"
          fontWeight="800"
          color="#0f1a2e"
          sx={{ fontSize: "1.1rem" }}
        >
          {title}
        </Typography>
      </Stack>
      <IconButton onClick={onClose} size="small" type="button">
        <Close />
      </IconButton>
    </Box>
    <DialogContent sx={{ mt: 1, px: 2.5 }}>{children}</DialogContent>
    <DialogActions sx={{ p: 2, pt: 1, px: 2.5, gap: 1.5 }}>
      <Button
        variant="outlined"
        onClick={onClose}
        type="button"
        fullWidth
        sx={{
          textTransform: "none",
          fontWeight: 700,
          borderRadius: "10px",
          py: 1,
          color: TOKENS.textSecondary,
          borderColor: TOKENS.border,
        }}
      >
        Hủy
      </Button>
      <Button
        variant="contained"
        onClick={(e) => {
          e.preventDefault();
          onConfirm();
        }}
        disabled={loading}
        type="button"
        startIcon={!loading && confirmIcon}
        fullWidth
        sx={{
          bgcolor: color,
          fontWeight: 700,
          borderRadius: "10px",
          py: 1,
          "&:hover": { bgcolor: color },
          textTransform: "none",
          boxShadow: "none",
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Review Sheet Implementation ---
const ReviewOfficeRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [flowData, setFlowData] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [lineState, setLineState] = useState([]);
  const [note, setNote] = useState("");
  const loadApprovalFlow = useCallback(async (_unused) => {
    setFlowLoading(true);
    try {
      const [expectedRes, configRes] = await Promise.allSettled([
        getExpectedApprovalFlow({ moduleType: FLOW_MODULE_TYPE }),
        getApprovalFlowConfig({ moduleType: FLOW_MODULE_TYPE }),
      ]);
      const expectedUsers =
        expectedRes.status === "fulfilled" && expectedRes.value?.success
          ? expectedRes.value.data || []
          : [];
      const configuredSteps =
        configRes.status === "fulfilled" && configRes.value?.success
          ? configRes.value.data?.steps || []
          : [];
      const normalized = normalizeFlowSteps(configuredSteps, expectedUsers);
      const fallback = mapExpectedFlow(expectedUsers);
      setFlowData(normalized.length ? normalized : fallback);
    } catch (err) {
      console.error("Load approval flow error:", err);
      setFlowData([]);
    } finally {
      setFlowLoading(false);
    }
  }, []);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateRecipient, setEscalateRecipient] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const detailRes = await getRequestDetail(id);

      if (detailRes?.success) {
        setRequestData(detailRes.data);
        const itemData = detailRes.data.items || [];
        setItems(itemData);
        setLineState(
          itemData.map((it) => ({
            product_id: it.product_id || it.id,
            checked: true,
            approvedQty:
              it.actual_quantity != null
                ? it.actual_quantity
                : it.requested_quantity || it.qty || 0,
          }))
        );
        // Always load flow - VPP flow is module-wide, no departmentId needed
        loadApprovalFlow(true);
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " ₫";

  const toggleLine = (idx, checked) => {
    const newState = [...lineState];
    newState[idx].checked = checked;
    setLineState(newState);
  };

  const setApprovedQty = (idx, val) => {
    const newState = [...lineState];
    newState[idx].approvedQty = Math.max(0, parseInt(val) || 0);
    setLineState(newState);
  };

  const handleAction = async (actionType) => {
    const checkedItems = lineState.filter((l) => l.checked);
    if (actionType === "APPROVE" && checkedItems.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 mặt hàng để duyệt", "warning");
      return;
    }

    setActionLoading(true);
    try {
      let currentUserId = null;
      let currentUserUsername = null;
      try {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
          const ud = JSON.parse(userDataString);
          currentUserId = ud?.user?.id || ud?.user?._id;
          currentUserUsername = ud?.user?.username;
        }
      } catch (e) {}

      // Người tạo phiếu không có quyền duyệt/từ chối/chuyển bước
      if (
        isRequester &&
        (actionType === "APPROVE" ||
          actionType === "REJECT" ||
          actionType === "ESCALATE")
      ) {
        showToast("Người tạo phiếu không có quyền duyệt phiếu", "error");
        return;
      }

      let payload = {
        note:
          actionType === "REJECT"
            ? rejectReason
            : actionType === "ESCALATE"
              ? escalateReason
              : note,
      };

      if (actionType === "ESCALATE") {
        // Auto-escalate to the next person in flowData sorted by stepOrder
        const autoNextId = determineNextApprover(
          flowData,
          currentUserId,
          currentUserUsername
        );
        if (!autoNextId) {
          showToast(
            "Không xác định được người duyệt kế tiếp trong luồng",
            "error"
          );
          return;
        }
        payload.approver = autoNextId;
      } else if (actionType === "APPROVE") {
        // Luôn chuyển sang trạng thái "Chờ cấp phát" (Duyệt hoàn tất)
        payload.reviewer = currentUserId;
      } else if (actionType === "REJECT") {
        payload.reject_id = currentUserId;
      }

      if (actionType === "APPROVE") {
        payload.items = lineState.map((ls) => ({
          product_id: ls.product_id,
          actual_quantity: ls.checked ? ls.approvedQty : 0,
        }));
      }

      let res;
      if (actionType === "APPROVE") res = await approveRequest(id, payload);
      else if (actionType === "REJECT") res = await rejectRequest(id, payload);
      else if (actionType === "ESCALATE")
        res = await escalateRequest(id, payload);
      else if (actionType === "RESUBMIT") {
        const nextApproverId = determineNextApprover(
          flowData,
          currentUserId,
          currentUserUsername
        );
        const resubmitPayload = {
          approver: nextApproverId,
          reason: requestData.reason,
          priority: requestData.priority,
          need_date: moment(requestData.need_date).format("YYYY-MM-DD"),
          items: lineState.map((ls) => ({
            product_id: ls.product_id,
            requested_quantity: ls.approvedQty,
            note: ls.note || "",
          })),
        };
        res = await resubmitRequest(id, resubmitPayload);
      }

      if (res?.success) {
        showToast("Thao tác thành công", "success");
        navigate("/office-supply-request/list");
      } else {
        showToast(res?.message || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
      setShowRejectModal(false);
      setShowEscalateModal(false);
    }
  };

  // Summary logic
  const totalApprovedValue = items.reduce((acc, it, i) => {
    if (!lineState[i]) return acc;
    return (
      acc +
      (lineState[i].checked ? lineState[i].approvedQty * (it.price || 0) : 0)
    );
  }, 0);

  const totalApprovedQty = lineState.reduce(
    (acc, ls) => acc + (ls.checked ? ls.approvedQty : 0),
    0
  );
  const checkedCount = lineState.filter((l) => l.checked).length;

  const warnings = items
    .map((it, i) => {
      const ls = lineState[i];
      if (!ls || !ls.checked) return null;
      let msgs = [];
      if (it.stock === 0) msgs.push(`${it.name}: hết tồn kho`);
      else if (ls.approvedQty > it.stock)
        msgs.push(`${it.name}: tôn kho còn ${it.stock}`);
      if (it.quota > 0 && ls.approvedQty > it.quota)
        msgs.push(`${it.name}: vượt định mức (${ls.approvedQty}/${it.quota})`);
      return msgs;
    })
    .flat()
    .filter(Boolean);

  // --- Determine current user's position in flow ---
  let currentUserId = null;
  let currentUsername = null;
  try {
    const ud = JSON.parse(localStorage.getItem("userData") || "{}");
    currentUserId = ud?.user?.id || ud?.user?._id || null;
    currentUsername = ud?.user?.username || null;
  } catch (e) {}

  const sortedFlow = [...flowData].sort(
    (a, b) => (a.stepOrder || 0) - (b.stepOrder || 0)
  );
  const isLastApprover =
    sortedFlow.length > 0 &&
    (() => {
      const lastStep = sortedFlow[sortedFlow.length - 1];
      return (
        (lastStep.id &&
          currentUserId &&
          String(lastStep.id) === String(currentUserId)) ||
        (lastStep.approved_id &&
          currentUserId &&
          String(lastStep.approved_id) === String(currentUserId)) ||
        (lastStep.username &&
          currentUsername &&
          lastStep.username === currentUsername)
      );
    })();

  const nextApproverInfo = getNextApproverInfo(
    flowData,
    currentUserId,
    currentUsername
  );

  // Check if current user is authorized to perform actions (must match gi.approver)
  const isAuthorizedToReview =
    requestData &&
    ((requestData.approver &&
      currentUserId &&
      String(requestData.approver) === String(currentUserId)) ||
      (requestData.approver &&
        currentUsername &&
        requestData.approver === currentUsername));

  const isRequester =
    requestData &&
    (String(requestData.requester_id || requestData.created_by_id || "") ===
      String(currentUserId || "") ||
      requestData.requester_username === currentUsername);

  const isRejected =
    requestData && ["REJECTED", "rejected"].includes(requestData.status);
  const isDraft =
    requestData && ["DRAFT", "draft"].includes(requestData.status);
  const canReviewActions = Boolean(
    isAuthorizedToReview && !isRequester && !isRejected && !isDraft
  );

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: TOKENS.bg,
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (!requestData)
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          Không tìm thấy thông tin phiếu
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Quay lại
        </Button>
      </Box>
    );

  return (
    <Box
      sx={{
        bgcolor: TOKENS.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Topbar Placeholder if needed or just breadcrumbs */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: 12, flex: 1 }}>
        <Link
          onClick={() => navigate(-1)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: TOKENS.textSecondary,
            textDecoration: "none",
            cursor: "pointer",
            mb: 2,
            fontSize: "0.875rem",
          }}
        >
          <ChevronLeft fontSize="small" /> Quay lại danh sách phiếu chờ duyệt
        </Link>

        {/* Header Row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              variant="h4"
              fontWeight="800"
              color={TOKENS.accent}
              sx={{ fontFamily: "JetBrains Mono", letterSpacing: "-1px" }}
            >
              {requestData.request_number}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={
                  {
                    DRAFT: "Nháp",
                    draft: "Nháp",
                    PENDING: "Chờ duyệt",
                    PENDING_APPROVAL: "Chờ duyệt",
                    pending_approval: "Chờ duyệt",
                    pending_dept_approval: "Chờ duyệt",
                    pending_hc_approval: "Chờ duyệt",
                    APPROVED: "Chờ cấp phát",
                    approved: "Chờ cấp phát",
                    pending_issue: "Chờ cấp phát",
                    REJECTED: "Từ chối",
                    rejected: "Từ chối",
                    FINISHED: "Hoàn thành",
                    completed: "Hoàn thành",
                  }[requestData.status] || requestData.status
                }
                size="small"
                sx={{
                  bgcolor: ["REJECTED", "rejected"].includes(requestData.status)
                    ? TOKENS.redBg
                    : [
                          "FINISHED",
                          "completed",
                          "APPROVED",
                          "approved",
                          "pending_issue",
                        ].includes(requestData.status)
                      ? TOKENS.greenBg
                      : ["DRAFT", "draft"].includes(requestData.status)
                        ? "#f1f5f9"
                        : TOKENS.amberBg,
                  color: ["REJECTED", "rejected"].includes(requestData.status)
                    ? TOKENS.red
                    : [
                          "FINISHED",
                          "completed",
                          "APPROVED",
                          "approved",
                          "pending_issue",
                        ].includes(requestData.status)
                      ? TOKENS.green
                      : ["DRAFT", "draft"].includes(requestData.status)
                        ? TOKENS.textSecondary
                        : TOKENS.amber,
                  fontWeight: "bold",
                }}
              />
              {requestData.priority === "Khẩn" && (
                <Chip
                  label="⚡ Gấp"
                  size="small"
                  sx={{
                    bgcolor: TOKENS.redBg,
                    color: TOKENS.red,
                    fontWeight: "bold",
                  }}
                />
              )}
            </Stack>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<Print />}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              borderColor: TOKENS.border,
              color: "#334155",
            }}
          >
            In phiếu
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* LEFT COL */}
          <Grid item xs={12} lg={8.2}>
            {/* Info Card */}
            <ModernCard
              title="Thông tin phiếu đề nghị"
              icon={Assignment}
              iconColor={TOKENS.accent}
              iconBg={TOKENS.accentLight}
              extra={
                <Typography variant="caption" color={TOKENS.textTertiary}>
                  Tạo lúc{" "}
                  {moment(requestData.created_at).format("DD/MM/YYYY HH:mm")}
                </Typography>
              }
            >
              <Grid container spacing={1.5}>
                {[
                  { label: "Người đề nghị", val: requestData.requester_name },
                  { label: "Phòng ban", val: requestData.department_name },
                  {
                    label: "Ngày cần",
                    val: moment(requestData.need_date).format("DD/MM/YYYY"),
                  },
                  { label: "Mức ưu tiên", val: requestData.priority },
                ].map((f, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Box
                      sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "8px" }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          color: "#94a3b8",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        {f.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        sx={{
                          fontFamily: i === 2 ? "JetBrains Mono" : "inherit",
                        }}
                      >
                        {f.val || "–"}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "8px" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: "uppercase",
                        color: "#94a3b8",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Lý do / Mục đích sử dụng
                    </Typography>
                    <Typography
                      variant="body2"
                      color={TOKENS.textSecondary}
                      lineHeight={1.6}
                    >
                      {requestData.reason || "Không có lý do cụ thể."}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </ModernCard>

            {/* Items Card */}
            <ModernCard
              title="Xét duyệt mặt hàng"
              icon={FactCheck}
              iconColor={TOKENS.purple}
              iconBg={TOKENS.purpleBg}
              extra={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    sx={{ textTransform: "none", fontSize: 11 }}
                    onClick={() =>
                      setLineState(
                        lineState.map((l) => ({ ...l, checked: true }))
                      )
                    }
                  >
                    Duyệt tất cả
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    sx={{ textTransform: "none", fontSize: 11 }}
                    onClick={() =>
                      setLineState(
                        lineState.map((l) => ({ ...l, checked: false }))
                      )
                    }
                  >
                    Bỏ chọn
                  </Button>
                </Stack>
              }
            >
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid #f1f5f9", borderRadius: "8px" }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell padding="checkbox" align="center">
                        <Checkbox
                          size="small"
                          checked={
                            checkedCount === items.length && items.length > 0
                          }
                          indeterminate={
                            checkedCount > 0 && checkedCount < items.length
                          }
                          onChange={(e) =>
                            setLineState(
                              lineState.map((l) => ({
                                ...l,
                                checked: e.target.checked,
                              }))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        MẶT HÀNG
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        YÊU CẦU
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        {isDraft ? "SỐ LƯỢNG" : "DUYỆT SL"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        ĐỊNH MỨC CÒN
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        TỒN KHO
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                      >
                        ĐÁNH GIÁ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((it, i) => {
                      console.log(it, "ádasdasdas");
                      const ls = lineState[i];
                      if (!ls) return null;
                      const opacity = ls.checked ? 1 : 0.45;
                      const isOverQuota =
                        it.limit_quantity > 0 &&
                        ls.approvedQty > it.limit_quantity;
                      const isOutStock = (it.stock_quantity || 0) <= 0;
                      const requestedQty = it.requested_quantity || it.qty || 0;

                      return (
                        <TableRow
                          key={it.id || i}
                          sx={{ transition: "opacity 0.2s", opacity }}
                        >
                          <TableCell align="center">
                            <Checkbox
                              size="small"
                              checked={ls.checked}
                              onChange={(e) => toggleLine(i, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: "#f1f5f9",
                                  borderRadius: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 16,
                                }}
                              >
                                {it.icon || it.category_name?.charAt(0) || "📦"}
                              </Box>
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight="700"
                                  sx={{ color: "#334155" }}
                                >
                                  {it.name || it.product_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#94a3b8",
                                    fontFamily: "JetBrains Mono",
                                  }}
                                >
                                  {it.code || it.sku}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              sx={{ fontFamily: "JetBrains Mono" }}
                            >
                              {requestedQty}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {it.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              <TextField
                                size="small"
                                type="number"
                                value={ls.approvedQty}
                                onChange={(e) =>
                                  setApprovedQty(i, e.target.value)
                                }
                                disabled={!ls.checked}
                                sx={{
                                  width: 50,
                                  "& .MuiInputBase-input": {
                                    p: "4px 6px",
                                    textAlign: "center",
                                    fontWeight: 700,
                                    fontFamily: "JetBrains Mono",
                                    fontSize: 13,
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {it.unit}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              sx={{ fontFamily: "JetBrains Mono" }}
                            >
                              {it.limit_quantity > 0 ? it.limit_quantity : "–"}
                            </Typography>
                            <Chip
                              label={
                                it.limit_quantity === 0
                                  ? "Theo PB"
                                  : isOverQuota
                                    ? "Vượt ĐM"
                                    : "Trong ĐM"
                              }
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 9,
                                fontWeight: 800,
                                bgcolor: isOverQuota
                                  ? TOKENS.redBg
                                  : TOKENS.greenBg,
                                color: isOverQuota ? TOKENS.red : TOKENS.green,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              sx={{
                                fontFamily: "JetBrains Mono",
                                color: isOutStock ? TOKENS.red : "inherit",
                              }}
                            >
                              {isOutStock ? "Hết" : it.stock_quantity || 0}
                            </Typography>
                            <Chip
                              label={isOutStock ? "Hết kho" : "Đủ kho"}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 9,
                                fontWeight: 800,
                                bgcolor: isOutStock
                                  ? TOKENS.redBg
                                  : TOKENS.greenBg,
                                color: isOutStock ? TOKENS.red : TOKENS.green,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {!ls.checked ? (
                              <Chip
                                label="Loại bỏ"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  bgcolor: TOKENS.redBg,
                                  color: TOKENS.red,
                                }}
                              />
                            ) : ls.approvedQty !== requestedQty ? (
                              <Chip
                                label="Điều chỉnh"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  bgcolor: TOKENS.amberBg,
                                  color: TOKENS.amber,
                                }}
                              />
                            ) : (
                              <Chip
                                label="OK"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  bgcolor: TOKENS.greenBg,
                                  color: TOKENS.green,
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderTop: "2px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    color="#64748b"
                  >
                    {isDraft ? "Tổng giá trị đề nghị" : "Tổng giá trị duyệt"}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="800"
                    color={TOKENS.accent}
                    sx={{ fontFamily: "JetBrains Mono" }}
                  >
                    {formatVND(totalApprovedValue)}
                  </Typography>
                </Box>
              </TableContainer>
            </ModernCard>

            <ModernCard
              title="Ghi chú phê duyệt"
              icon={CallMade}
              iconColor={TOKENS.teal}
              iconBg="#ccfbf1"
            >
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder=""
                value={note}
                onChange={(e) => setNote(e.target.value)}
                sx={{ bgcolor: "#f8fafc" }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Ghi chú sẽ hiển thị trong lịch sử phê duyệt của phiếu.
              </Typography>
            </ModernCard>
          </Grid>

          {/* RIGHT COL */}
          <Grid item xs={12} lg={3.8}>
            {/* Requester Profile Sidebar */}
            <Card
              sx={{
                mb: 2,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: TOKENS.border,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 1.5, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  NGƯỜI ĐỀ NGHỊ
                </Typography>
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: "#be185d", fontWeight: "bold" }}>
                    {(requestData.requester_name || "U").charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="800">
                      {requestData.requester_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {requestData.department_name}
                    </Typography>
                  </Box>
                </Stack>
                <Stack
                  spacing={1}
                  sx={{ bgcolor: "#f8fafc", p: 1.5, borderRadius: "8px" }}
                >
                  {[
                    {
                      l: "Tên Tài khoản",
                      v: requestData.requester_username || "–",
                    },
                    {
                      l: "Kỳ cấp phát",
                      v: `Tháng ${moment(requestData.created_at).format("MM/YYYY")}`,
                    },
                    { l: "Mã nội bộ", v: requestData.requester_id || "–" },
                    {
                      l: "Giá trị dự kiến",
                      v: formatVND(requestData.estimated_value),
                      highlight: TOKENS.accent,
                    },
                  ].map((r, i) => (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      key={i}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {r.l}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          color: r.highlight,
                          fontFamily: "JetBrains Mono",
                        }}
                      >
                        {r.v}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Approval Flow */}
            <Card
              sx={{
                mb: 2,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: TOKENS.border,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 1.5, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  LUỒNG PHÊ DUYỆT DỰ KIẾN
                </Typography>
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={2.5} sx={{ pl: 1, position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 4,
                      top: 4,
                      bottom: 4,
                      width: 2,
                      bgcolor: "#f1f5f9",
                    }}
                  />
                  {flowLoading ? (
                    <Skeleton variant="rectangular" height={120} />
                  ) : flowData.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Chưa có cấu hình luồng duyệt VPP
                    </Typography>
                  ) : (
                    <>
                      {/* Step 0: Creator */}
                      <Box sx={{ position: "relative", pl: 3 }}>
                        <Box
                          sx={{
                            position: "absolute",
                            left: -9,
                            top: 2,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: TOKENS.green,
                            border: "2px solid",
                            borderColor: TOKENS.green,
                            zIndex: 1,
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight="800"
                          display="block"
                        >
                          Bước 0: Người đề nghị
                          <Chip
                            label="✓ XONG"
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: 8,
                              bgcolor: TOKENS.greenBg,
                              color: TOKENS.green,
                              fontWeight: 900,
                              ml: 1,
                              px: 0,
                            }}
                          />
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {requestData.requester_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: 9,
                            fontFamily: "JetBrains Mono",
                            color: "#94a3b8",
                          }}
                        >
                          {requestData.department_name}
                        </Typography>
                      </Box>

                      {(() => {
                        const approvalStatus = Number(requestData.approval_status) || 0;
                        const isApproved = ['APPROVED', 'approved', 'FINISHED', 'completed', 'pending_issue'].includes(requestData.status);
                        const isRejected = ['REJECTED', 'rejected'].includes(requestData.status);

                        let currentStepIndex = -1;

                        if (isApproved) {
                          currentStepIndex = 999;
                        } else if (isRejected) {
                          // Nếu từ chối, tìm bước của người từ chối
                          currentStepIndex = flowData.findIndex(s => 
                            requestData.reject_id && (
                              (s.id && String(s.id) === String(requestData.reject_id)) ||
                              (s.username && s.username === requestData.reject_id) ||
                              (s.approved_id && String(s.approved_id) === String(requestData.reject_id))
                            )
                          );
                          // Fallback nếu không thấy reject_id rõ ràng thì dùng approver
                          if (currentStepIndex === -1) {
                            currentStepIndex = flowData.findIndex(s => 
                              requestData.approver && (
                                (s.id && String(s.id) === String(requestData.approver)) ||
                                (s.username && s.username === requestData.approver) ||
                                (s.approved_id && String(s.approved_id) === String(requestData.approver))
                              )
                            );
                          }
                          // Cùng lắm thì dùng approvalStatus
                          if (currentStepIndex === -1 && approvalStatus >= 2) {
                            currentStepIndex = approvalStatus - 2;
                          }
                        } else {
                          // Nếu đang chờ duyệt, tìm bước hiện tại theo approver
                          currentStepIndex = flowData.findIndex(s => 
                            requestData.approver && (
                              (s.id && String(s.id) === String(requestData.approver)) ||
                              (s.username && s.username === requestData.approver) ||
                              (s.approved_id && String(s.approved_id) === String(requestData.approver))
                            )
                          );
                          if (currentStepIndex === -1 && approvalStatus >= 2) {
                            currentStepIndex = approvalStatus - 2;
                          }
                        }

                        // Nếu không thấy thì gán mặc định cho khỏi lỗi (chưa xử lý)
                        if (currentStepIndex === -1 && !isApproved && flowData.length > 0) {
                          currentStepIndex = 0;
                        }

                        return flowData.map((s, i) => {
                          const isCurrent = i === currentStepIndex;
                          // Chỉ xong khi là bước trước currentStepIndex (nếu bị từ chối thì người từ chối KHÔNG xong)
                          const isDone = isApproved || (i < currentStepIndex);
                          
                          return (
                            <Box key={i} sx={{ position: 'relative', pl: 3 }}>
                              <Box sx={{
                                position: 'absolute', left: -9, top: 2,
                                width: 12, height: 12, borderRadius: '50%',
                                bgcolor: isRejected && isCurrent ? TOKENS.red : isDone ? TOKENS.green : isCurrent ? TOKENS.amber : '#e2e8f0',
                                border: '2px solid',
                                borderColor: isRejected && isCurrent ? TOKENS.red : isDone ? TOKENS.green : isCurrent ? TOKENS.amber : '#e2e8f0',
                                zIndex: 1,
                                boxShadow: isCurrent ? `0 0 0 4px ${isRejected ? TOKENS.red : TOKENS.amber}26` : 'none'
                              }} />
                              <Typography variant="caption" fontWeight="800" display="block">
                                Bước {i + 1}: {s.departmentName || s.name || 'Người duyệt'}
                                {isCurrent && !isRejected && <Chip label="← ĐANG CHỜ" size="small" sx={{ height: 14, fontSize: 8, bgcolor: TOKENS.amberBg, color: TOKENS.amber, fontWeight: 900, ml: 1, px: 0 }} />}
                                {isCurrent && isRejected && <Chip label="TỪ CHỐI" size="small" sx={{ height: 14, fontSize: 8, bgcolor: TOKENS.redBg, color: TOKENS.red, fontWeight: 900, ml: 1, px: 0 }} />}
                                {isDone && !isCurrent && <Chip label="✓ XONG" size="small" sx={{ height: 14, fontSize: 8, bgcolor: TOKENS.greenBg, color: TOKENS.green, fontWeight: 900, ml: 1, px: 0 }} />}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{s.name}</Typography>
                              <Typography variant="caption" sx={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>{s.departmentCode}</Typography>
                            </Box>
                          );
                        });
                      })()}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Warnings Summary */}
            <Card
              sx={{
                borderRadius: "12px",
                border: "1px solid",
                borderColor: TOKENS.border,
              }}
            >
              <Box sx={{ p: 1.5, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  TỔNG HỢP CẢNH BÁO
                </Typography>
              </Box>
              <CardContent sx={{ p: 2 }}>
                {warnings.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    Không có cảnh báo vi phạm định mức hay tồn kho.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {warnings.map((w, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          gap: 1,
                          p: 1,
                          bgcolor: TOKENS.amberBg,
                          borderRadius: "6px",
                          border: `1px solid ${TOKENS.amber}33`,
                        }}
                      >
                        <WarningAmberOutlined
                          sx={{ fontSize: 14, color: TOKENS.amber, mt: 0.2 }}
                        />
                        <Typography
                          variant="caption"
                          color="#92400e"
                          fontWeight="600"
                        >
                          {w}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* STICKY BOTTOM DECISION PANEL */}
      {(canReviewActions || (isRequester && (isRejected || isDraft))) && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            right: 0,
            left: { xs: 0, lg: "260px" }, // Assuming sidebar width is ~260px based on typical layouts
            zIndex: 1000,
            bgcolor: "#fff",
            borderTop: "1px solid",
            borderColor: TOKENS.border,
            p: 2,
            px: { xs: 2, md: 4 },
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
            transition: "left 0.3s ease",
          }}
        >
          <Box
            sx={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ fontFamily: "JetBrains Mono" }}
                >
                  {checkedCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: 10 }}
                >
                  Mặt hàng
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ fontFamily: "JetBrains Mono" }}
                >
                  {totalApprovedQty}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: 10 }}
                >
                  Tổng SL duyệt
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  fontWeight="800"
                  color={TOKENS.accent}
                  sx={{ fontFamily: "JetBrains Mono" }}
                >
                  {formatVND(totalApprovedValue)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: 10 }}
                >
                  {isDraft ? "Giá trị yêu cầu" : "Giá trị duyệt"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5}>
              {isRequester && (isRejected || isDraft) && (
                <Button
                  variant="contained"
                  startIcon={<ArrowUpward />}
                  onClick={() => setShowResubmitModal(true)}
                  sx={{
                    bgcolor: TOKENS.accent,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { bgcolor: "#1e40af" },
                  }}
                >
                  Gửi duyệt phiếu
                </Button>
              )}
              {canReviewActions && !isLastApprover && (
                <Button
                  variant="contained"
                  onClick={() => setShowEscalateModal(true)}
                  sx={{
                    bgcolor: TOKENS.amber,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { bgcolor: "#92400e" },
                  }}
                >
                  Chuyển cấp trên
                </Button>
              )}
              {canReviewActions && (
                <Button
                  variant="contained"
                  onClick={() => setShowRejectModal(true)}
                  sx={{
                    bgcolor: TOKENS.red,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { bgcolor: "#991b1b" },
                  }}
                >
                  Từ chối
                </Button>
              )}
              {canReviewActions && (
                <Button
                  variant="contained"
                  onClick={() => setShowApproveModal(true)}
                  sx={{
                    bgcolor: TOKENS.green,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { bgcolor: "#15803d" },
                  }}
                >
                  Duyệt phiếu
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      )}

      {/* APPROVE MODAL */}
      <ActionModal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Xác nhận duyệt phiếu"
        icon={CheckCircleOutline}
        color={TOKENS.green}
        confirmText="Xác nhận duyệt"
        loading={actionLoading}
        onConfirm={() => handleAction("APPROVE")}
      >
        <Box sx={{ bgcolor: TOKENS.greenBg, p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" color="#065f46">
            Bạn sẽ duyệt{" "}
            <strong>
              {checkedCount}/{items.length} mặt hàng
            </strong>{" "}
            với tổng số lượng <strong>{totalApprovedQty}</strong>, giá trị ước
            tính <strong>{formatVND(totalApprovedValue)}</strong>.
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Sau khi duyệt, phiếu sẽ chuyển sang trạng thái{" "}
          <strong>Chờ cấp phát</strong> để thực hiện xuất kho.
        </Typography>
      </ActionModal>

      {/* REJECT MODAL */}
      <ActionModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Từ chối phê duyệt"
        icon={Close}
        color={TOKENS.red}
        confirmText="Xác nhận từ chối"
        loading={actionLoading}
        onConfirm={() => handleAction("REJECT")}
      >
        <Box sx={{ bgcolor: TOKENS.redBg, p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" color="#991b1b">
            Hành động này sẽ hủy phiếu yêu cầu và thông báo tới người đề nghị.
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#64748b",
              mb: 1,
              display: "block",
              textTransform: "uppercase",
            }}
          >
            Lý do từ chối
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Nhập lý do cụ thể để người đề nghị nắm rõ..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#f8fafc",
              },
            }}
          />
        </Box>
      </ActionModal>

      {/* ESCALATE MODAL */}
      <ActionModal
        open={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        title="Chuyển cấp trên phê duyệt"
        icon={ArrowUpward}
        color={TOKENS.amber}
        confirmText="Xác nhận chuyển"
        confirmIcon={<ArrowUpward fontSize="small" />}
        loading={actionLoading}
        onConfirm={() => handleAction("ESCALATE")}
      >
        <Box
          sx={{
            bgcolor: "#fef3c7",
            p: 2,
            borderRadius: 2,
            mb: 2.5,
            border: "1px solid #fcd34d",
          }}
        >
          <Typography variant="body2" color="#b45309" fontWeight="600">
            Sau khi duyệt, phiếu sẽ được chuyển tới người phê duyệt kế tiếp
            trong luồng.
          </Typography>
        </Box>
        {nextApproverInfo && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              bgcolor: "#f8fafc",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: TOKENS.amberBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: TOKENS.amber,
              }}
            >
              {(nextApproverInfo.name || "N").charAt(0)}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="700">
                {nextApproverInfo.name || "Người dưyệt kế tiếp"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {nextApproverInfo.departmentName} — Bước{" "}
                {nextApproverInfo.stepOrder}
              </Typography>
            </Box>
          </Box>
        )}
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="LÝ DO CHUYỂN TIẾP (tuỳ chọn)"
            value={escalateReason || ""}
            onChange={(e) => setEscalateReason(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#f8fafc",
              },
            }}
          />
        </Box>
      </ActionModal>

      {/* RESUBMIT MODAL */}
      <ActionModal
        open={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        title="Gửi lại phiếu đề nghị"
        icon={ArrowUpward}
        color={TOKENS.accent}
        confirmText="Gửi lại duyệt"
        loading={actionLoading}
        onConfirm={() => handleAction("RESUBMIT")}
      >
        <Box sx={{ bgcolor: TOKENS.accentLight, p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" color="#1e40af">
            Phiếu sẽ được cập nhật thông tin và danh sách mặt hàng đã chỉnh sửa,
            sau đó gửi lại luồng phê duyệt từ đầu.
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Bạn có chắc chắn muốn gửi lại phiếu này không?
        </Typography>
      </ActionModal>
    </Box>
  );
};

export default ReviewOfficeRequest;
