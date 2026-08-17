import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button as MuiButton,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { SkySubmitButton } from "@styles/SkyStyles";
import AssetTable from "./components/AssetTable";
import AssetFilter from "./components/AssetFilter";
import BudgetSummary from "./components/BudgetSummary";
import HandoverTimeline from "./components/HandoverTimeline";
import VendorList from "./components/VendorList";
import ProgramSummaryCard from "./components/ProgramSummaryCard";
import WorkflowPhases from "./components/WorkflowPhases";
import AssetDetailModal from "./components/AssetDetailModal";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";
import { useParams, useNavigate } from "react-router-dom";

/**
 * MÀN 6 – QUẢN LÝ HIỆN VẬT
 * Luồng "bằng hiện vật": Phòng Truyền thông tiếp nhận yêu cầu → Phòng Hành chính theo dõi mua sắm → bàn giao tại địa phương.
 */
const AssetManagement = () => {
  const { programId: paramId } = useParams();
  const programId = paramId && paramId !== ":programId" ? paramId : "7";
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({
    total_value: 0,
    program_budget: 0,
    remaining: 0,
  });
  const [programInfo, setProgramInfo] = useState({});
  const [steps, setSteps] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    page: 1,
    limit: 10,
  });

  // Modal State
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleViewAsset = (id) => {
    setSelectedAssetId(id);
    setIsDetailModalOpen(true);
  };

  // 1. Fetch Static Context (Program Info, Batches, Suppliers)
  const fetchContext = useCallback(async () => {
    // Helper to wrap individual calls
    const safeFetch = async (promise, setter, errorMessage) => {
      try {
        const resp = await promise;
        if (resp?.success) {
          setter(resp.data);
          return resp.data;
        }
      } catch (e) {
        console.warn(errorMessage, e);
      }
      return null;
    };

    try {
      // Overview (Header, KPIs, Steps)
      await safeFetch(
        asxhService.getInKindOverview(programId),
        (data) => {
          setSummary({
            total_value: data.kpi?.total_asset_value || 0,
            program_budget: data.kpi?.total_budget || 0,
            remaining: data.kpi?.remaining_budget || 0,
          });
          setSteps(data.steps || []);
          if (data.program) {
            setProgramInfo({
              ...data.program,
              total_budget: data.kpi?.total_budget || 0,
              location:
                data.program.locality ||
                data.program.location ||
                "Đang cập nhật",
            });
          }
        },
        "Failed to fetch overview"
      );

      // Handover Batches
      await safeFetch(
        asxhService.getHandoverBatches(programId),
        (data) => {
          if (Array.isArray(data)) {
            setBatches(data);
          } else if (data?.items && Array.isArray(data.items)) {
            setBatches(data.items);
          } else {
            setBatches([]);
          }
        },
        "Failed to fetch handover batches"
      );

      // Supplier Summary
      await safeFetch(
        asxhService.getSupplierSummary(programId),
        (data) => setSuppliers(data || { items: [], total_contract_value: 0 }),
        "Failed to fetch supplier summary"
      );
    } catch (error) {
      console.error("Context fetch error:", error);
    }
  }, [programId]);

  // 2. Fetch Dynamic Data (Assets List - Depends on Filters)
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await asxhService.getAssets(programId, filters);
      if (resp?.success) {
        setAssets(resp.data?.items || []);
      }
    } catch (e) {
      console.warn("Failed to fetch assets", e);
    } finally {
      setLoading(false);
    }
  }, [programId, filters]);

  // Trigger Context Fetch (Only when programId changes)
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Trigger Assets Fetch (On mount and filter change)
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleRefresh = useCallback(() => {
    fetchContext();
    fetchAssets();
  }, [fetchContext, fetchAssets]);

  const handleExportConfirm = async () => {
    try {
      setExporting(true);
      const response = await asxhService.exportAssets(programId);

      // Handle blob download
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Danh_sach_hien_vat_${programId}_${new Date().getTime()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast("Xuất danh sách hiện vật thành công!", "success");
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast("Không thể xuất danh sách hiện vật.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // 3. Computed - Local Filtering (for extra responsiveness and backend fallback)
  const filteredAssets = React.useMemo(() => {
    return assets.filter((item) => {
      // Filter by Status (English key)
      if (
        filters.status &&
        filters.status !== "all" &&
        item.status !== filters.status
      ) {
        return false;
      }

      // Filter by Keyword (Name, Code or Specs)
      if (filters.keyword) {
        const k = filters.keyword.toLowerCase();
        const nameMatch = (item.name || "").toLowerCase().includes(k);
        const codeMatch = (item.code || "").toLowerCase().includes(k);
        const specMatch = (item.specifications || []).some(
          (s) =>
            (s.parameterName || "").toLowerCase().includes(k) ||
            (s.parameterValue || "").toLowerCase().includes(k)
        );

        if (!nameMatch && !codeMatch && !specMatch) {
          return false;
        }
      }

      return true;
    });
  }, [assets, filters.keyword, filters.status]);

  return (
    <Box
      sx={{
        "& *": {
          fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
        },
        p: 4,
        bgcolor: "#f8fafc",
        flexGrow: 1,
        overflowY: "auto",
        height: "0px", // HACK: allow box to shrink/expand in flex container with overflow
        minHeight: "100%",
      }}
    >
      {/* 1. Thông tin chương trình & Nút Back */}
      <ProgramSummaryCard programInfo={programInfo} />

      {/* 2. Các giai đoạn Workflow */}
      <WorkflowPhases steps={steps} />

      {/* 3. Khu vực chính: Danh sách hiện vật */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "16px",
          mb: 4,
          border: "1px solid #e2e8f0",
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box component="span" sx={{ display: "flex", color: "#64748b" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </Box>
            Danh sách hiện vật
          </Typography>
          <Stack direction="row" spacing={2}>
            <AssetFilter onFilterChange={handleFilterChange} />
            <SkySubmitButton
              startIcon={<AddIcon />}
              sx={{ borderRadius: "8px", px: 3 }}
              onClick={() => {
                if (summary.remaining <= 0) {
                  toast(
                    "Ngân sách chương trình đã hết. Không thể thêm hạng mục mới.",
                    "warning"
                  );
                  return;
                }
                navigate(`/asxh/programs/${programId}/assets/add`);
              }}
            >
              Thêm hạng mục
            </SkySubmitButton>
          </Stack>
        </Box>

        <AssetTable
          loading={loading}
          data={filteredAssets}
          onRefresh={handleRefresh}
          onView={handleViewAsset}
        />

        <Divider sx={{ my: 3 }} />

        <BudgetSummary
          itemsCount={filteredAssets.length}
          summary={summary}
          onExport={() => setIsExportModalOpen(true)}
        />
      </Paper>

      {/* 4. Hàng dưới: Lịch bàn giao & Nhà cung cấp */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <HandoverTimeline batches={batches} onRefresh={handleRefresh} />
        </Grid>
        <Grid item xs={12} md={5}>
          <VendorList suppliers={suppliers} />
        </Grid>
      </Grid>

      {/* Asset Detail Popup */}
      <AssetDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        assetId={selectedAssetId}
        programId={programId}
      />

      {/* Export Confirmation Popup */}
      <Dialog
        open={isExportModalOpen}
        onClose={() => !exporting && setIsExportModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            minWidth: "400px",
            "& *": {
              fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1e293b" }}>
          Xác nhận xuất danh sách
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569" }}>
            Hệ thống sẽ tổng hợp và trích xuất danh sách hiện vật của chương
            trình này sang định dạng Excel (.xlsx). Bạn có muốn tiếp tục không?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <MuiButton
            onClick={() => setIsExportModalOpen(false)}
            disabled={exporting}
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
          >
            Hủy bỏ
          </MuiButton>
          <SkySubmitButton
            onClick={handleExportConfirm}
            loading={exporting}
            sx={{ px: 3, borderRadius: "8px" }}
          >
            Xác nhận xuất
          </SkySubmitButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetManagement;
