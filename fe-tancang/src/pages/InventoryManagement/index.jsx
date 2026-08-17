import React, { useState } from "react";
import { 
  Box, Stack, Typography, Breadcrumbs, Link, Button, useMediaQuery, useTheme 
} from "@mui/material";
import { 
  Add as AddIcon, FileDownloadOutlined as FileDownloadOutlinedIcon 
} from "@mui/icons-material";
import { useToast } from "../../components/common/ToastProvider";
import { useInventoryData } from "../../hooks/useInventoryData";
import { exportInventory } from "../../services/vppService";
import StatsCard from "./components/StatsCard";
import FilterBar from "./components/FilterBar";
import InventoryTable from "./components/InventoryTable";
import ImportInventoryModal from "./components/ImportInventoryModal";
import TransactionHistoryDrawer from "./components/TransactionHistoryDrawer";

const InventoryManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showToast = useToast();
  const { 
    data, categories, loading, filters, stats, handleFilterChange, refetch 
  } = useInventoryData();

  // Popup States
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openHistoryDrawer, setOpenHistoryDrawer] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [initialImportProduct, setInitialImportProduct] = useState(null);

  // Gọi API Export Excel
  const handleExport = async () => {
    try {
      const res = await exportInventory(filters);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `VPP_Kho_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast("Xuất Excel thành công", "success");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      showToast("Xuất Excel thất bại", "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc" }}>
      {/* 1. Header & Breadcrumbs */}
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", sm: "center" }} 
        sx={{ mb: 4 }}
        spacing={2}
      >
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1.5, "& .MuiBreadcrumbs-li": { fontSize: 13, fontWeight: 500 } }}>
            <Link underline="hover" color="text.secondary" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
              Trang chủ
            </Link>
            <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 500 }}>Văn phòng phẩm</Typography>
            <Typography color="primary.main" sx={{ fontSize: 13, fontWeight: 600 }}>Tồn kho</Typography>
          </Breadcrumbs>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', mb: 0.5 }}>
            Quản lý Tồn kho
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            Theo dõi số lượng hàng tồn, biến động và định mức kho thời gian thực.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            fullWidth={isMobile}
            variant="outlined" 
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              borderColor: '#D1D5DB', 
              bgcolor: 'white', 
              fontWeight: 600,
              px: 3,
              py: 1,
              color: '#374151',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              "&:hover": { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' }
            }}
          >
            Xuất Excel
          </Button>
          <Button 
            fullWidth={isMobile}
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedProductId(null);
              setOpenImportModal(true);
            }}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              bgcolor: '#2563EB', 
              fontWeight: 600, 
              px: 3,
              py: 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              "&:hover": { bgcolor: '#1D4ED8' }
            }}
          >
            Nhập kho
          </Button>
        </Stack>
      </Stack>

      {/* 2. Stats Cards */}
      <StatsCard stats={stats} />

      {/* 3. FilterBar */}
      <FilterBar 
         filters={filters} 
         categories={categories}
         onFilterChange={handleFilterChange} 
      />

      {/* 4. Table */}
      <Box sx={{ mt: 0 }}>
        <InventoryTable 
           data={data} 
           loading={loading}
           page={filters.page}
           size={filters.limit}
           total={stats.totalItems}
           onChangePage={(newPage) => handleFilterChange("page", newPage)}
           onOpenHistory={(productId) => {
             setSelectedProductId(productId);
             setOpenHistoryDrawer(true);
           }}
           onQuickImport={(product) => {
             if (product.status === 'hidden' || product.status === 'inactive') {
               showToast(`Mặt hàng "${product.productName}" hiện đang bị ẩn hoặc ngừng sử dụng. Không thể thực hiện nhập kho.`, "warning");
               return;
             }
             setInitialImportProduct({
               id: product.productId,
               name: product.productName,
               code: product.productCode,
               category: product.category,
               unit: product.unit,
               inventory: { quantity: product.quantity }
             });
             setOpenImportModal(true);
           }}
        />
      </Box>

      {/* 5. Drawers & Modals */}
      {openImportModal && (
        <ImportInventoryModal
          open={openImportModal}
           onClose={() => {
              setOpenImportModal(false);
              setInitialImportProduct(null);
           }}
           initialProduct={initialImportProduct}
          categories={categories}
          onSuccess={() => {
             refetch();
          }}
        />
      )}

      {openHistoryDrawer && (
        <TransactionHistoryDrawer
           open={openHistoryDrawer}
           onClose={() => {
              setOpenHistoryDrawer(false);
              setSelectedProductId(null);
           }}
           productId={selectedProductId}
        />
      )}
    </Box>
  );
};

export default InventoryManagement;
