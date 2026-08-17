import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  Paper,
  Pagination,
  Container,
  Fade,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  NavigateNext as NextIcon,
  FileUpload as ExportIcon,
  CheckCircle as ApproveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { exportRequestList } from "../../services/vppService";
import { downloadBlob } from "../../helper";
import { useRequestData } from "./hooks/useRequestData";
import { useToast } from "../../components/common/ToastProvider";
import StatusTabs from "./components/StatusTabs";
import ActionBar from "./components/ActionBar";
import RequestTable from "./components/RequestTable";

const RequestList = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const {
    data,
    loading,
    total,
    stats,
    filters,
    setFilters,
    refresh,
    handleBulkApprove,
    handleBulkDelete,
    handleDelete,
    isApprover,
  } = useRequestData();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.user || parsed;
      }
    } catch (e) {}
    return null;
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = useCallback(
    (event) => {
      if (event.target.checked) setSelectedIds(data.map((item) => item.id));
      else setSelectedIds([]);
    },
    [data]
  );

  const handleSelectRow = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleOpenDetail = useCallback(
    (id) => {
      navigate(`/office-supply-request/detail/${id}`);
    },
    [navigate]
  );

  const handleOpenReview = useCallback(
    (id) => {
      navigate(`/office-supply-request/review/${id}`);
    },
    [navigate]
  );

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field !== "page" ? { page: 1 } : {}),
    }));
    setSelectedIds([]);
  };

  const handleDeleteSingle = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu nháp này?")) {
      const success = await handleDelete(id);
      if (success) {
        showToast("Xóa phiếu thành công", "success");
      } else {
        showToast("Có lỗi xảy ra khi xóa phiếu", "error");
      }
    }
  };

  const handleBulkAction = async (action) => {
    let success = false;
    if (action === "approve")
      success = await handleBulkApprove(
        selectedIds,
        "APPROVE",
        "Duyệt hàng loạt"
      );
    else if (action === "delete") {
      if (
        window.confirm(
          `Bạn có chắc muốn xóa ${selectedIds.length} phiếu đã chọn?`
        )
      ) {
        success = await handleBulkDelete(selectedIds);
        if (success)
          showToast(`Đã xóa ${selectedIds.length} phiếu thành công`, "success");
        else showToast("Lỗi khi xóa hàng loạt", "error");
      }
    }
    if (success) {
      setSelectedIds([]);
      refresh();
    }
  };

  const [exportLoading, setExportLoading] = useState(false);
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const blob = await exportRequestList(filters);
      downloadBlob(blob, `VPP_Requests_${new Date().getTime()}.xlsx`);
      showToast("Xuất Excel thành công", "success");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi xuất Excel", "error");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", pt: 4, pb: 8 }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          {/* Top Actions: Breadcrumbs (Left) & Buttons (Right) */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{
                "& .MuiBreadcrumbs-li": { fontSize: 13, fontWeight: 500 },
              }}
            >
              <Link
                underline="hover"
                onClick={() => navigate("/")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                  cursor: "pointer",
                }}
              >
                Trang chủ
              </Link>
              <Typography
                color="text.secondary"
                sx={{ fontSize: 13, fontWeight: 500 }}
              >
                Văn phòng phẩm
              </Typography>
              <Typography
                color="primary.main"
                sx={{ fontSize: 13, fontWeight: 600 }}
              >
                Phiếu đề nghị
              </Typography>
            </Breadcrumbs>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={
                  exportLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <ExportIcon />
                  )
                }
                onClick={handleExport}
                disabled={exportLoading}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#374151",
                  borderColor: "#D1D5DB",
                  bgcolor: "white",
                  px: 2.5,
                  height: 40,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
                }}
              >
                {exportLoading ? "Đang xuất..." : "Xuất Excel"}
              </Button>
              {!isApprover && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/office-supply-request/create")}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2.5,
                    height: 40,
                    bgcolor: "#2563EB",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    "&:hover": { bgcolor: "#1D4ED8" },
                  }}
                >
                  Tạo phiếu mới
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Title Area */}
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                color: "#111827",
                mb: 0.5,
                letterSpacing: "-0.01em",
              }}
            >
              Danh sách phiếu đề nghị cấp VPP
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500 }}
            >
              Quản lý tất cả phiếu đề nghị, theo dõi trạng thái duyệt và cấp
              phát
            </Typography>
          </Box>
        </Box>

        {/* Status Segmented Controls */}
        <StatusTabs
          activeTab={filters.status}
          counts={stats}
          onChange={(val) => handleFilterChange("status", val)}
        />

        {/* Action Bar (Search & Selects) */}
        <ActionBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={refresh}
        />

        {/* Table & Bulk Actions Container */}
        <Box sx={{ position: "relative" }}>
          {/* Bulk Action Overlay */}
          <Fade in={selectedIds.length > 0}>
            <Box
              sx={{
                position: "absolute",
                top: -75,
                left: 0,
                right: 0,
                zIndex: 10,
                bgcolor: "#1e293b",
                color: "white",
                py: 1.2,
                px: 3,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px -6px rgba(15, 23, 42, 0.4)",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Đã chọn{" "}
                  <Box component="span" sx={{ color: "#60a5fa" }}>
                    {selectedIds.length}
                  </Box>{" "}
                  mục
                </Typography>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: "#475569", height: 16 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ApproveIcon />}
                  color="success"
                  onClick={() => handleBulkAction("approve")}
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#10b981",
                  }}
                >
                  Duyệt đã chọn
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleBulkAction("delete")}
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#ef4444",
                  }}
                >
                  Xóa đã chọn
                </Button>
              </Stack>
              <IconButton
                size="small"
                onClick={() => setSelectedIds([])}
                sx={{ color: "#94a3b8", "&:hover": { color: "white" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Fade>

          {/* Table */}
          <RequestTable
            data={data}
            loading={loading}
            onView={handleOpenDetail}
            onReview={handleOpenReview}
            onEdit={handleOpenReview}
            onDelete={handleDeleteSingle}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            currentUser={currentUser}
          />
        </Box>

        {/* Pagination Section */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3, px: 2 }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontWeight: 600 }}
          >
            Hiển thị{" "}
            <b>
              {(filters.page - 1) * filters.limit + 1} -{" "}
              {Math.min(filters.page * filters.limit, total)}
            </b>{" "}
            trong <b>{total}</b> đề nghị
          </Typography>
          <Pagination
            count={Math.ceil(total / filters.limit) || 1}
            page={filters.page}
            onChange={(e, p) => handleFilterChange("page", p)}
            color="primary"
            shape="rounded"
            size="medium"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: 700,
                borderRadius: "8px",
              },
              "& .Mui-selected": {
                bgcolor: "#1a73e8 !important",
                color: "white",
              },
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
};

export default RequestList;
