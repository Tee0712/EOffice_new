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
import { mockSummary } from './mockData';
import { callApi } from '@services/api';
import {
  API_CATERING_SUPPLIERS,
  API_CATERING_SUPPLIER_CONTRACTS,
  API_CATERING_SUPPLIER_EVALUATIONS,
  API_CATERING_SUPPLIERS_OVERVIEW,
  API_CATERING_SUPPLIER_EXPORT
} from '@EnvironmentFile/constants/urlConfig';
import './Suppliers.css';

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

  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState(mockSummary);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL',
    rating: 'ALL'
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [total, setTotal] = useState(0);

  const [viewMode, setViewMode] = useState('LIST'); // 'CARD' or 'LIST'

  // Modals state
  const [modalType, setModalType] = useState(null); // 'VIEW', 'ADD', 'EDIT', 'DELETE', 'CONTRACT', 'PRICE', 'EVAL'
  const [selectedSupplier, setSelectedSupplier] = useState(null);


  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await callApi('get', API_CATERING_SUPPLIERS, {
        keyword: filters.keyword,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        rating: filters.rating !== 'ALL' ? filters.rating : undefined,
        page: 0, // Always get all data from the beginning for client-side pagination
        size: 1000 // Get all data for client-side filtering and pagination to avoid empty pages
      });

      // Support both direct array and paginated object (res.content or res.data.content)
      let content = [];
      let totalElements = 0;

      if (Array.isArray(res)) {
        content = res;
        totalElements = res.length;
      } else if (res?.data && Array.isArray(res.data)) {
        content = res.data;
        totalElements = res.data.length;
      } else {
        content = res?.content || res?.data?.content || res?.items || [];
        totalElements = res?.totalElements || res?.data?.totalElements || res?.total || content.length || 0;
      }

      setSuppliers(Array.isArray(content) ? content : []);
      setTotal(totalElements);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách từ hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await callApi('get', API_CATERING_SUPPLIERS_OVERVIEW);
      console.log("Supplier Overview Response:", res);
      if (res) {
        // Handle both { data: { ... } } and direct { ... } structures
        const data = res.data || (res.success === undefined ? res : null);
        if (data) {
          setSummary({
            total: data.total ?? data.total_suppliers ?? 0,
            active: data.active ?? data.active_contracts ?? 0,
            expiringSoon: data.expiringSoon ?? data.expiring_soon ?? 0,
            expired: data.expired ?? data.expired_contracts ?? 0
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải tổng quan nhà cung cấp', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchSummary();
  }, [filters]); // Remove page from dependencies to handle pagination purely on the client

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
    return suppliers.filter(item => {
      // Keyword matching
      const matchKeyword = (item.name || '').toLowerCase().includes(filters.keyword.toLowerCase()) ||
        (item.supplierCode || '').toLowerCase().includes(filters.keyword.toLowerCase()) ||
        (item.taxCode || '').includes(filters.keyword);

      // Status matching - logic should match SupplierTable.jsx
      let matchStatus = true;
      if (filters.status !== 'ALL') {
        const today = dayjs().startOf('day');
        const endDate = item.contractEndAtCached ? dayjs(item.contractEndAtCached) : null;

        let calculatedStatus = 'ACTIVE';
        if (endDate && endDate.isValid()) {
          if (today.isAfter(endDate)) {
            calculatedStatus = 'EXPIRED';
          } else if (endDate.diff(today, 'day') <= 3) {
            calculatedStatus = 'EXPIRING_SOON';
          }
        }

        matchStatus = calculatedStatus === filters.status;
      }

      // Rating matching
      let matchRating = true;
      const rating = Number(item.ratingAvgCached) || 0;
      if (filters.rating === 'HIGH') matchRating = rating === 5;
      else if (filters.rating === 'MID') matchRating = rating >= 4;
      else if (filters.rating === 'LOW') matchRating = rating >= 3;

      return matchKeyword && matchStatus && matchRating;
    });
  }, [filters, suppliers]);

  const paginatedSuppliers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, page]);

  // Logic handlers
  const handleView = (item) => {
    navigate(`/catering/supplier-detail/${item.id}`, { state: { id: item.id } });
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
    fetchSuppliers();
    fetchSummary(); // Refresh overview after any change (Add/Edit/Delete/Contract/Eval)
  };

  const handleExportClick = () => {
    setModalType('EXPORT');
  };

  const onExportConfirm = async () => {
    try {
      setLoading(true);
      toast.info('Hệ thống đang trích xuất dữ liệu, vui lòng đợi trong giây lát...');

      // Fetch file as blob to include Authorization header
      const blob = await callApi('get', API_CATERING_SUPPLIER_EXPORT, {}, { responseType: 'blob' });

      // Create local URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_sach_Nha_cung_cap_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
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
      // Auto-generate supplier code if it's a new supplier
      const payload = {
        ...data,
        startDate: data.startDate?.$d ? dayjs(data.startDate).format('YYYY-MM-DD') : data.startDate,
        endDate: data.endDate?.$d ? dayjs(data.endDate).format('YYYY-MM-DD') : data.endDate,
        supplier_code: modalType === 'EDIT' && selectedSupplier?.supplierCode
          ? selectedSupplier.supplierCode
          : `SUP_${Date.now()}`
      };

      if (modalType === 'EDIT') {
        await callApi('put', `${API_CATERING_SUPPLIERS}/${selectedSupplier.id}`, payload);
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await callApi('post', API_CATERING_SUPPLIERS, payload);
        toast.success('Thêm nhà cung cấp thành công');
      }
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error('Thao tác thất bại. Vui lòng thử lại');
    }
  };

  const onContractSubmit = async (data) => {
    try {
      await callApi('post', API_CATERING_SUPPLIER_CONTRACTS(selectedSupplier.id), data);
      toast.success('Ký hợp đồng thành công');
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error('Lỗi khi ký hợp đồng');
    }
  };

  const onEvalSubmit = async (data) => {
    try {
      await callApi('post', API_CATERING_SUPPLIER_EVALUATIONS(selectedSupplier.id), data);
      toast.success('Gửi đánh giá thành công');
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error('Lỗi khi gửi đánh giá');
    }
  };

  const confirmDelete = async () => {
    try {
      await callApi('delete', `${API_CATERING_SUPPLIERS}/${selectedSupplier.id}`);
      toast.success('Đã xóa nhà cung cấp');
      handleCloseModal();
      fetchSuppliers();
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
