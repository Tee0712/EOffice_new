import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Pagination
} from "@mui/material";
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  TableRows as TableIcon,
  Dashboard as KanbanIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationIcon,
  Settings as SettingIcon,
} from "@mui/icons-material";
import StatsOverview from "./components/StatsOverview";
import FilterBar from "./components/FilterBar";
import ProgramTable from "./components/ProgramTable";
import ProgramKanban from "./components/ProgramKanban";
import ProgramFormModal from "./components/ProgramFormModal";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";

/**
 * Trang quản lý chương trình An sinh Xã hội (ASXH)
 */
const ASXHManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedProgramId, setSelectedProgramId] = useState(null);

  // State dữ liệu
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 8, // Thiết lập 8 mục mỗi trang theo yêu cầu
    total: 0,
    total_pages: 0
  });

  // State bộ lọc
  const [filters, setFilters] = useState({
    keyword: "",
    funding_type: "all",
    status: "all",
    locality: "",
    year: 2026
  });

  // Hàm lấy dữ liệu từ API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        page_size: viewMode === "kanban" ? 100 : pagination.page_size,
        funding_type: filters.funding_type === "all" ? undefined : filters.funding_type,
        status: filters.status === "all" ? undefined : filters.status
      };

      const res = await asxhService.getPrograms(params);
      if (res.success) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {});
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          total_pages: res.data.pagination.total_pages
        }));
      }
    } catch (error) {
      console.error("Fetch ASXH data failed:", error);
      toast("Không thể tải dữ liệu chương trình", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.page_size, viewMode, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleEdit = (item) => {
    navigate(`/asxh-registration/edit/${item.id}`);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chương trình ${item.code} không?`)) {
      try {
        const res = await asxhService.deleteProgram(item.id);
        if (res.success) {
          toast("Xóa chương trình thành công", "success");
          fetchData();
        } else {
          toast(res.message || "Xóa thất bại", "error");
        }
      } catch (err) {
        toast("Có lỗi xảy ra khi xóa", "error");
      }
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        funding_type: filters.funding_type === "all" ? undefined : filters.funding_type,
        status: filters.status === "all" ? undefined : filters.status
      };
      
      const response = await asxhService.exportPrograms(params);
      
      if (response && response.size > 0) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Danh_sach_chuong_trinh_ASXH_${new Date().getFullYear()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast("Xuất báo cáo thành công", "success");
      }
    } catch (err) {
      toast("Xuất báo cáo thất bại", "error");
    } finally {
      setLoading(false);
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
      {/* 1. Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: "#0f172a", 
            mb: 1
          }}>
            Quản lý Chương trình ASXH
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hệ thống theo dõi và quản lý dữ liệu an sinh xã hội tập trung.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            sx={{
              bgcolor: "#f8f9fb",
              "& .MuiToggleButton-root": {
                border: "1px solid",
                borderColor: "grey.200",
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                color: "text.secondary",
                fontSize: 13,
              },
              "& .Mui-selected": {
                bgcolor: "#255df2 !important",
                color: "#fff !important",
              }
            }}
          >
            <ToggleButton value="table" aria-label="table view">
              <TableIcon fontSize="small" sx={{ mr: 1 }} /> Bảng
            </ToggleButton>
            <ToggleButton value="kanban" aria-label="kanban view">
              <KanbanIcon fontSize="small" sx={{ mr: 1 }} /> Kanban
            </ToggleButton>
          </ToggleButtonGroup>

          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={handleExport}
            startIcon={<ExportIcon />}
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
            Xuất báo cáo
          </Button>

          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate("/asxh/workflow-management")}
            startIcon={<SettingIcon />}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: 14,
              px: 2,
            }}
          >
            Quản lý luồng
          </Button>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate("/asxh-registration")}
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
            Tạo chương trình
          </Button>
        </Stack>
      </Stack>

      {/* 2. Stats Cards */}
      <StatsOverview summary={summary} />

      {/* 3. Filter Bar */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* 4. Data View */}
      <Box sx={{ mt: 0 }}>
        {viewMode === "table" ? (
          <ProgramTable
            items={items}
            pagination={pagination}
            onPageChange={handlePageChange}
            onView={(item) => navigate(`/asxh/programs/${item.id}`)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProgramKanban 
            items={items} 
            onView={(item) => navigate(`/asxh/programs/${item.id}`)}
          />
        )}
      </Box>

      {/* Global Pagination for Kanban (Table has its own internal pagination) */}
      {viewMode === "kanban" && pagination.total_pages > 1 && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          bgcolor: "white",
          borderRadius: 1.5,
          border: "1px solid",
          borderColor: "grey.200"
        }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {pagination.total > 0 ? (pagination.page - 1) * pagination.page_size + 1 : 0} - {Math.min(pagination.page * pagination.page_size, pagination.total)} của {pagination.total} bản ghi
          </Typography>
          <Pagination
            count={pagination.total_pages || 1}
            page={pagination.page || 1}
            onChange={(e, page) => handlePageChange(page)}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      )}

      {modalOpen && (
        <ProgramFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          programId={selectedProgramId}
          mode={modalMode}
          onSaved={() => {
            setModalOpen(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default ASXHManagement;
