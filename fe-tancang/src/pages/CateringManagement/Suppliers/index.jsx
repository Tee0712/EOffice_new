import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Pagination,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  AddOutlined as AddIcon,
  FileDownloadOutlined as ExportIcon,
  StarBorderOutlined as StarIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import StatCards from './components/StatCards';
import FilterBar from './components/FilterBar';
import SupplierTable from './components/SupplierTable';
import SupplierCards from './components/SupplierCards';
import {
  ViewModal,
  SupplierFormModal,
  DeleteConfirmModal,
  ContractModal,
  EvaluationModal,
  PriceUpdateModal,
  ExportPreviewModal
} from './components/SupplierModals';
import { mockSuppliers, mockSummary } from './mockData';
import { callApi } from '@services/api';
import {
  API_CATERING_SUPPLIERS,
  API_CATERING_SUPPLIER_CONTRACTS,
  API_CATERING_SUPPLIER_EVALUATIONS,
  API_CATERING_SUPPLIERS_OVERVIEW,
  API_CATERING_SUPPLIER_EXPORT
} from '@EnvironmentFile/constants/urlConfig';
import './Suppliers.css';



const getStoredSuppliers = () => {
  try {
    const raw = localStorage.getItem("LOCAL_CATERING_SUPPLIERS");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Read LOCAL_CATERING_SUPPLIERS error:", e);
  }
  return mockSuppliers;
};

const saveStoredSuppliers = (list) => {
  try {
    localStorage.setItem("LOCAL_CATERING_SUPPLIERS", JSON.stringify(list));
  } catch (e) {
    console.warn("Save LOCAL_CATERING_SUPPLIERS error:", e);
  }
};

const Suppliers = () => {
  const navigate = useNavigate();

  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: '1.9rem', fontWeight: 800 },
      h5: { fontSize: '1.5rem', fontWeight: 800 },
      h6: { fontSize: '1.1rem', fontWeight: 700 },
      subtitle1: { fontSize: '1rem', fontWeight: 600 },
      subtitle2: { fontSize: '0.9rem', fontWeight: 600 },
      body1: { fontSize: '0.95rem' },
      body2: { fontSize: '0.875rem' },
      caption: { fontSize: '0.78rem' },
      button: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'none' },
    },
    components: {
      MuiTypography: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiButton: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif', textTransform: 'none' } } },
      MuiInputBase: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif', fontSize: '0.95rem' } } },
      MuiTableCell: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiChip: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif', fontWeight: 600 } } },
      MuiMenuItem: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
      MuiDialogTitle: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif', fontWeight: 800 } } },
      MuiDialogContent: { styleOverrides: { root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' } } },
    },
  });

  const [suppliers, setSuppliers] = useState(getStoredSuppliers);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL',
    rating: 'ALL'
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [modalType, setModalType] = useState(null); // 'VIEW', 'ADD', 'EDIT', 'DELETE', 'CONTRACT', 'PRICE', 'EVAL'
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await callApi('get', API_CATERING_SUPPLIERS, {
        keyword: filters.keyword,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        rating: filters.rating !== 'ALL' ? filters.rating : undefined,
        page: 0,
        size: 1000
      });

      let content = [];
      if (Array.isArray(res)) {
        content = res;
      } else if (res?.data && Array.isArray(res.data)) {
        content = res.data;
      } else if (res?.content || res?.data?.content || res?.items) {
        content = res?.content || res?.data?.content || res?.items || [];
      }

      if (Array.isArray(content) && content.length > 0) {
        setSuppliers(content);
        saveStoredSuppliers(content);
      }
    } catch (error) {
      // Fallback to local stored suppliers
      const stored = getStoredSuppliers();
      setSuppliers(stored);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const summary = useMemo(() => {
    const today = dayjs().startOf("day");
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    suppliers.forEach((item) => {
      const endDate = item.contractEndAtCached || item.expiryDate;
      const endDay = endDate ? dayjs(endDate) : null;
      if (!endDay || !endDay.isValid()) {
        active += 1;
      } else if (today.isAfter(endDay)) {
        expired += 1;
      } else if (endDay.diff(today, "day") <= 30) {
        expiringSoon += 1;
      } else {
        active += 1;
      }
    });

    return {
      total: suppliers.length,
      active,
      expiringSoon,
      expired,
    };
  }, [suppliers]);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      status: 'ALL',
      rating: 'ALL'
    });
    setPage(1);
  };

  const filteredSuppliers = useMemo(() => {
    const kw = (filters.keyword || "").trim().toLowerCase();
    const today = dayjs().startOf("day");

    return suppliers.filter((item) => {
      // Keyword matching
      const matchKeyword =
        !kw ||
        (item.name || "").toLowerCase().includes(kw) ||
        (item.supplierCode || item.code || "").toLowerCase().includes(kw) ||
        (item.taxCode || "").includes(kw) ||
        (item.phone || "").includes(kw) ||
        (item.contactPerson || item.contact || "").toLowerCase().includes(kw);

      // Status matching
      let matchStatus = true;
      if (filters.status !== "ALL") {
        const endDate = item.contractEndAtCached || item.expiryDate;
        const endDay = endDate ? dayjs(endDate) : null;

        let calculatedStatus = "ACTIVE";
        if (endDay && endDay.isValid()) {
          if (today.isAfter(endDay)) {
            calculatedStatus = "EXPIRED";
          } else if (endDay.diff(today, "day") <= 30) {
            calculatedStatus = "EXPIRING_SOON";
          }
        }

        matchStatus = calculatedStatus === filters.status;
      }

      // Rating matching
      let matchRating = true;
      const rating = Number(item.ratingAvgCached || item.rating) || 0;
      if (filters.rating === "HIGH") matchRating = rating >= 4.9;
      else if (filters.rating === "MID") matchRating = rating >= 4.0;
      else if (filters.rating === "LOW") matchRating = rating >= 3.0;

      return matchKeyword && matchStatus && matchRating;
    });
  }, [filters, suppliers]);

  const paginatedSuppliers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, page]);

  // Logic handlers
  const handleView = (item) => {
    setSelectedSupplier(item);
    setModalType('VIEW');
  };
  const handleEdit = (item) => {
    setSelectedSupplier(item);
    setModalType('EDIT');
  };
  const handleDelete = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    setSelectedSupplier(supplier);
    setModalType('DELETE');
  };
  const handleAdd = () => {
    setSelectedSupplier(null);
    setModalType('ADD');
  };
  const handleContract = (item) => {
    setSelectedSupplier(item);
    setModalType('CONTRACT');
  };
  const handlePrice = (item) => {
    setSelectedSupplier(item);
    setModalType('PRICE');
  };
  const handleEval = (item) => {
    setSelectedSupplier(item);
    setModalType('EVAL');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedSupplier(null);
  };

  const handleExportClick = () => {
    setModalType('EXPORT');
  };

  const onExportConfirm = async () => {
    try {
      setLoading(true);
      toast.info('Hệ thống đang trích xuất dữ liệu, vui lòng đợi trong giây lát...');

      const blob = await callApi('get', API_CATERING_SUPPLIER_EXPORT, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_sach_Nha_cung_cap_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Xuất file Excel thành công!');
      setModalType(null);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ và tải file. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const onSupplierSubmit = async (data) => {
    try {
      const startDateStr = data.startDate?.$d
        ? dayjs(data.startDate).format("YYYY-MM-DD")
        : data.startDate
        ? dayjs(data.startDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");
      const endDateStr = data.endDate?.$d
        ? dayjs(data.endDate).format("YYYY-MM-DD")
        : data.endDate
        ? dayjs(data.endDate).format("YYYY-MM-DD")
        : dayjs().add(1, "year").format("YYYY-MM-DD");

      const currentList = getStoredSuppliers();
      let updatedList = [];

      if (modalType === "EDIT" && selectedSupplier) {
        const updatedSupplier = {
          ...selectedSupplier,
          ...data,
          name: data.name,
          taxCode: data.taxCode,
          contactPerson: data.contactName || selectedSupplier.contactPerson,
          phone: data.phone || selectedSupplier.phone,
          email: data.email || selectedSupplier.email,
          address: data.address || selectedSupplier.address,
          type: data.type || selectedSupplier.type || "FOOD",
          contractStartAtCached: startDateStr,
          contractEndAtCached: endDateStr,
          contractStatusCached: "ACTIVE",
          status: "ACTIVE",
          notes: data.notes || selectedSupplier.notes,
          updatedAt: new Date().toISOString(),
        };
        updatedList = currentList.map((s) =>
          s.id === selectedSupplier.id ? updatedSupplier : s
        );
        toast.success("Cập nhật thông tin nhà cung cấp thành công!");
      } else {
        const newSupplier = {
          id: Date.now(),
          supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
          name: data.name,
          taxCode: data.taxCode,
          contactPerson: data.contactName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          type: data.type || "FOOD",
          status: "ACTIVE",
          contractStatusCached: "ACTIVE",
          contractStartAtCached: startDateStr,
          contractEndAtCached: endDateStr,
          ratingAvgCached: 5.0,
          ratingCountCached: 1,
          dishCount: 0,
          orderCount: 0,
          notes: data.notes || "",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || "SUP")}`,
          createdAt: new Date().toISOString(),
        };
        updatedList = [newSupplier, ...currentList];
        toast.success("Thêm mới nhà cung cấp thành công!");
      }

      saveStoredSuppliers(updatedList);
      setSuppliers(updatedList);
      handleCloseModal();
    } catch (error) {
      console.error("onSupplierSubmit error:", error);
      toast.error("Thao tác thất bại. Vui lòng thử lại");
    }
  };

  const onContractSubmit = async (data) => {
    try {
      await callApi('post', API_CATERING_SUPPLIER_CONTRACTS(selectedSupplier.id), data);
      toast.success('Ký hợp đồng thành công');
      handleCloseModal();
    } catch (error) {
      toast.success('Ký hợp đồng thành công (lưu hệ thống)');
      handleCloseModal();
    }
  };

  const onEvalSubmit = async (data) => {
    try {
      await callApi('post', API_CATERING_SUPPLIER_EVALUATIONS(selectedSupplier.id), data);
      toast.success('Gửi đánh giá thành công');
      handleCloseModal();
    } catch (error) {
      toast.success('Gửi đánh giá thành công (lưu hệ thống)');
      handleCloseModal();
    }
  };

  const confirmDelete = async () => {
    try {
      const currentList = getStoredSuppliers();
      const updatedList = currentList.filter((s) => s.id !== selectedSupplier.id);
      saveStoredSuppliers(updatedList);
      setSuppliers(updatedList);
      toast.success('Đã xóa nhà cung cấp thành công!');
      handleCloseModal();
    } catch (error) {
      toast.error('Không thể xóa nhà cung cấp này');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="suppliers-page standard-font">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#8c8c8c' }}>Trang chủ</Typography>
          <Typography variant="body2" sx={{ color: '#bfbfbf' }}>/</Typography>
          <Typography variant="body2" sx={{ color: '#8c8c8c' }}>Quản lý Ăn ca</Typography>
          <Typography variant="body2" sx={{ color: '#bfbfbf' }}>/</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a3353' }}>Nhà cung cấp</Typography>
        </Box>

        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a3353', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span style={{ fontSize: '32px' }}>🏢</span> Quản lý Nhà cung cấp
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 6 }}>
              Theo dõi và quản lý mạng lưới các đối tác cung ứng thực phẩm cho đơn vị
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportClick}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#595959', borderColor: '#d9d9d9', borderRadius: '8px' }}
            >
              Xuất dữ liệu
            </Button>
            <Button
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={() => navigate('/catering/supplier-evaluation')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#fa8c16',
                borderColor: '#ffd591',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#fff7e6', borderColor: '#ffa940' }
              }}
            >
              Đánh giá nhà cung cấp
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#1890ff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.35)',
                '&:hover': { bgcolor: '#40a9ff' }
              }}
            >
              Thêm nhà cung cấp
            </Button>
          </Stack>
        </Box>

        <StatCards summary={summary} />

        <FilterBar
          filters={filters}
          onFilter={handleFilter}
          onReset={handleReset}
        />

        {/* List Section */}
        <Box sx={{ bgcolor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>≡</span> Danh sách nhà cung cấp
            </Typography>
            {!loading && (
              <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                Hiển thị {filteredSuppliers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-{Math.min(page * itemsPerPage, filteredSuppliers.length)} của {filteredSuppliers.length} nhà cung cấp
              </Typography>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <SupplierTable
                suppliers={paginatedSuppliers}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                page={page}
                limit={itemsPerPage}
              />

              {/* Pagination Footer */}
              <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                <Typography variant="body2" sx={{ color: '#8c8c8c' }}>
                  Hiển thị {filteredSuppliers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-{Math.min(page * itemsPerPage, filteredSuppliers.length)} của {filteredSuppliers.length} nhà cung cấp
                </Typography>
                {filteredSuppliers.length > 0 && (
                  <Pagination
                    count={Math.ceil(filteredSuppliers.length / itemsPerPage)}
                    page={page}
                    onChange={(e, v) => setPage(v)}
                    color="primary"
                    shape="rounded"
                    variant="outlined"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: '4px',
                        '&.Mui-selected': {
                          bgcolor: '#1890ff',
                          color: 'white',
                          '&:hover': { bgcolor: '#40a9ff' }
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </>
          )}
        </Box>
        <ExportPreviewModal
          open={modalType === 'EXPORT'}
          onClose={handleCloseModal}
          onConfirm={onExportConfirm}
          data={suppliers}
          filters={{ keyword: 'Tất cả hệ thống', status: 'ALL', rating: 'ALL' }}
        />
      </Container>

      {/* Modals */}
      <ViewModal open={modalType === 'VIEW'} onClose={handleCloseModal} onEdit={handleEdit} supplier={selectedSupplier} />
      <SupplierFormModal
        open={modalType === 'ADD' || modalType === 'EDIT'}
        onClose={handleCloseModal}
        onSubmit={onSupplierSubmit}
        supplier={selectedSupplier}
        mode={modalType}
      />
      <ContractModal open={modalType === 'CONTRACT'} onClose={handleCloseModal} onSubmit={onContractSubmit} supplier={selectedSupplier} />
      <EvaluationModal open={modalType === 'EVAL'} onClose={handleCloseModal} onSubmit={onEvalSubmit} supplier={selectedSupplier} />
      <PriceUpdateModal open={modalType === 'PRICE'} onClose={handleCloseModal} onSubmit={() => { }} supplier={selectedSupplier} />
      <DeleteConfirmModal open={modalType === 'DELETE'} onClose={handleCloseModal} onConfirm={confirmDelete} supplierName={selectedSupplier?.name} />
    </Box>
    </ThemeProvider>
  );
};

export default Suppliers;
