import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Pagination,
  Stack,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownloadOutlined as ExportIcon,
} from "@mui/icons-material";
import { useDistributionData } from "../../hooks/useDistributionData";
import useDebounce from "../../hooks/useDebounce";
import VppPageHeader from "@components/vpp/VppPageHeader";
import SummaryCards from "./components/SummaryCards";
import StatusTabs from "./components/StatusTabs";
import RequestCard from "./components/RequestCard";
import { exportDistributionQueue } from "../../services/vppService";
import { downloadBlob } from "../../helper";
import "./StationeryDistribution.css";

const StationeryDistribution = () => {
  const [activeTab, setActiveTab] = useState("WAITING");
  const [keyword, setKeyword] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const debouncedSearch = useDebounce((val) => {
    setKeyword(val);
    setPage(1);
  }, 500);

  const { data, loading, total, summary, refresh } = useDistributionData(
    activeTab,
    keyword,
    page,
    limit
  );

  const [exportLoading, setExportLoading] = useState(false);
  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      const blob = await exportDistributionQueue({
        status: activeTab,
        keyword: keyword,
      });
      downloadBlob(
        blob,
        `VPP_Distribution_PickList_${new Date().getTime()}.xlsx`
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xuất báo cáo");
    } finally {
      setExportLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1); // Reset page on tab change
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  return (
    <Box sx={{ backgroundColor: "#f1f5f9", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <VppPageHeader
          title="Cấp phát / Xuất kho VPP"
          subtitle="Xử lý cấp phát các phiếu đã được duyệt, xác nhận xuất kho và ghi nhận người nhận"
          actions={
            <Button
              variant="outlined"
              startIcon={
                exportLoading ? <CircularProgress size={18} /> : <ExportIcon />
              }
              onClick={handleExportReport}
              disabled={exportLoading}
              sx={{
                borderRadius: "8px",
                borderColor: "#cbd5e1",
                color: "#334155",
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                height: 42,
                backgroundColor: "#fff",
                fontSize: "13px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                "&:hover": {
                  borderColor: "#2563eb",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                },
              }}
            >
              {exportLoading ? "Đang xuất..." : "Xuất báo cáo"}
            </Button>
          }
        />

        {/* Summary Cards */}
        <SummaryCards summary={summary} loading={loading} />

        {/* Tabs Box */}
        <Box sx={{ mb: 3 }}>
          <StatusTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            summary={summary}
          />
        </Box>

        {/* List Section */}
        {loading && page === 1 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <div className="requests-list">
            {data.length > 0 ? (
              data.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onRefresh={refresh}
                />
              ))
            ) : (
              <Box
                sx={{
                  p: 8,
                  textAlign: "center",
                  bgcolor: "white",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                }}
              >
                Không có phiếu nào trong danh sách này
              </Box>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <Stack spacing={2} sx={{ mt: 4, alignItems: "center" }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
              size="large"
            />
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default StationeryDistribution;
