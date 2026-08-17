import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  Checkbox,
  Pagination,
} from "@mui/material";
import {
  CreateOutlined as EditIcon,
  VisibilityOffOutlined as HideIcon,
  DeleteOutline as DeleteIcon,
  Create,
  DescriptionOutlined as PaperIcon,
  FolderOutlined as FolderIcon,
  PrintOutlined as PrintIcon,
  Inventory2Outlined as BoxIcon,
  LocalDrinkOutlined as DrinkIcon,
  CleaningServicesOutlined as CleanIcon
} from "@mui/icons-material";

// Helper lấy icon theo danh mục
const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('bút') || cat.includes('mực') || cat.includes('xóa')) return <Create sx={{ color: 'grey.600' }} />;
  if (cat.includes('giấy') || cat.includes('note')) return <PaperIcon sx={{ color: 'grey.600' }} />;
  if (cat.includes('bìa') || cat.includes('hồ sơ') || cat.includes('file')) return <FolderIcon sx={{ color: 'grey.600' }} />;
  if (cat.includes('máy') || cat.includes('in') || cat.includes('mực in')) return <PrintIcon sx={{ color: 'grey.600' }} />;
  if (cat.includes('nước') || cat.includes('uống') || cat.includes('trà') || cat.includes('cafe')) return <DrinkIcon sx={{ color: 'grey.600' }} />;
  if (cat.includes('vệ sinh') || cat.includes('rửa')) return <CleanIcon sx={{ color: 'grey.600' }} />;
  return <BoxIcon sx={{ color: 'grey.600' }} />;
};

// Dữ liệu mock tĩnh
const MOCK_DATA = [
  { id: 1, sku: "VPP-BV-001", name: "Bút bi Thiên Long TL-027", unit: "Cây", categoryText: "Bút viết", categoryTheme: "info", status: "active", price: 5000, quota: "2 / người" },
  { id: 2, sku: "VPP-BV-002", name: "Bút bi Thiên Long TL-089", unit: "Cây", categoryText: "Bút viết", categoryTheme: "info", status: "active", price: 8500, quota: "2 / người" },
  { id: 3, sku: "VPP-BV-003", name: "Bút chì gỗ Staedtler 2B", unit: "Cây", categoryText: "Bút viết", categoryTheme: "info", status: "active", price: 12000, quota: "3 / người" },
  { id: 4, sku: "VPP-BV-004", name: "Bút xóa Thiên Long CP-01", unit: "Cây", categoryText: "Bút viết", categoryTheme: "info", status: "active", price: 15000, quota: "1 / người" },
  { id: 5, sku: "VPP-GI-001", name: "Giấy in A4 Double A 70gsm", unit: "Ram", categoryText: "Giấy in / Giấy note", categoryTheme: "success", status: "active", price: 62000, quota: "1 / người" },
];

const ItemTable = ({ data, loading, onEdit, onDelete, onHide, filters, totalCount, onPageChange }) => {
  // Dữ liệu hiển thị (ưu tiên props, nếu k có thì lấy Mock)
  const displayData = data && data.length > 0 ? data : [];

  // Data hiển thị đã được phân trang từ server
  const paginatedData = displayData;
  const page = filters?.page ? filters.page - 1 : 0;
  const rowsPerPage = filters?.limit || 10;
  const total = totalCount || displayData.length;

  const handleChangePage = (event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const renderCapsule = (text, theme) => {
    const bgColor = theme === 'info' ? '#e0f2fe' : '#dcfce7';
    const color = theme === 'info' ? '#0284c7' : '#16a34a';
    return (
      <Box 
        sx={{ 
          display: 'inline-block',
          px: 1.5, 
          py: 0.5, 
          borderRadius: 20,
          bgcolor: bgColor,
          color: color,
          fontSize: 12,
          fontWeight: 600
        }}
      >
        {text}
      </Box>
    );
  };

  const renderStatus = (status) => {
    if (status === "active") {
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant="body2" color="success.main" fontWeight="600">Hoạt động</Typography>
        </Stack>
      );
    }
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary" fontWeight="600">Đã ẩn</Typography>
      </Stack>
    );
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, overflow: "hidden" }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 800 }} aria-label="stationery table">
            <TableHead>
              <TableRow>

                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>MẶT HÀNG</TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>NHÓM HÀNG</TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>ĐƠN VỊ TÍNH</TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>ĐƠN GIÁ TK</TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>ĐỊNH MỨC / THÁNG</TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200" }}>TRẠNG THÁI</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, width: 120, borderBottom: "1px solid", borderColor: "grey.200" }}>THAO TÁC</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress color="primary" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Đang tải dữ liệu...</Typography>
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">Không tìm thấy dữ liệu.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  return (
                    <TableRow 
                      key={row.id} 
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      
                      {/* Tên mặt hàng & Icon & SKU */}
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ p: 0, bgcolor: "grey.100", borderRadius: 2, display: "flex", border: '1px solid', borderColor: 'grey.300', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            {getCategoryIcon(row.category || row.categoryText)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="600" color="#0f172a">
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ letterSpacing: 0.5 }}>
                              {row.code}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {renderCapsule(row.category, row.categoryTheme)}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="#475569">{row.unit}</Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="700" color="#0f172a" fontFamily="monospace">
                          {new Intl.NumberFormat("vi-VN").format(row.reference_price)} ₫
                        </Typography>
                      </TableCell>

                      <TableCell>
                         <Typography variant="body2" color="#475569" sx={{ letterSpacing: 0.5 }}>
                          {row.quotaValue ? `${row.quotaValue} / ${row.quotaUnit === 'phongban' ? 'phòng' : 'người'}` : 'Không có'}
                         </Typography>
                      </TableCell>
                      
                      <TableCell>{renderStatus(row.status)}</TableCell>
                      
                      <TableCell align="center">
                        <Stack direction="row" spacing={0} justifyContent="center">
                          <Tooltip title="Xem chi tiết / Chỉnh sửa">
                            <IconButton size="small" onClick={() => onEdit && onEdit(row)}>
                              <EditIcon fontSize="small" sx={{ color: "action.active" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={row.status === "active" ? "Ẩn mặt hàng" : "Hiện mặt hàng"}>
                            <IconButton size="small" onClick={() => onHide && onHide(row)}>
                              <HideIcon fontSize="small" sx={{ color: "action.active" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa mặt hàng">
                            <IconButton size="small" onClick={() => onDelete && onDelete(row)}>
                              <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Footer */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "grey.200", bgcolor: "#fff" }}>
           <Typography variant="body2" color="text.secondary">
              Hiển thị {total > 0 ? page * rowsPerPage + 1 : 0} - {Math.min((page + 1) * rowsPerPage, total)} của {total} kết quả
           </Typography>
           <Pagination 
              count={Math.ceil(total / rowsPerPage) || 1} 
              page={page + 1} 
              onChange={handleChangePage} 
              color="primary" 
              shape="rounded" 
              size="small" 
           />
        </Box>
      </Paper>
    </Box>
  );
};

export default ItemTable;
