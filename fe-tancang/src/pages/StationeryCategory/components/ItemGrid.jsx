import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Pagination,
  Chip
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

const ItemGrid = ({ data, loading, onEdit, onDelete, onHide }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(12);

  // Dữ liệu hiển thị (ưu tiên props, nếu k có thì lấy Mock)
  const displayData = data && data.length > 0 ? data : [];
  // Lấy danh sách record đang nằm trên trang hiện tại
  const paginatedData = displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
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

  if (loading) {
    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", py: 6, mt: 2, bgcolor: "#fff", border: "1px solid", borderColor: "grey.200", borderRadius: 1.5 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (displayData.length === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 6, mt: 2, bgcolor: "#fff", border: "1px solid", borderColor: "grey.200", borderRadius: 1.5 }}>
        <Typography variant="body2" color="text.secondary">Không tìm thấy dữ liệu.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Grid container spacing={2}>
        {paginatedData.map((row) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={row.id}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ p: 2, flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                   {renderCapsule(row.category, row.categoryTheme)}
                   {renderStatus(row.status)}
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ p: 0, bgcolor: "grey.100", borderRadius: 1, display: "flex", border: '1px solid', borderColor: 'grey.300', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {getCategoryIcon(row.category || row.categoryText)}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="700" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ letterSpacing: 0.5 }}>
                      {row.code}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 'auto', bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                   <Box>
                     <Typography variant="caption" color="text.secondary" display="block">Đơn giá</Typography>
                     <Typography variant="body2" fontWeight="700" color="#0f172a" fontFamily="monospace">
                        {new Intl.NumberFormat("vi-VN").format(row.reference_price)} ₫
                     </Typography>
                   </Box>
                   <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" display="block">Định mức</Typography>
                    <Typography variant="body2" color="#475569" sx={{ letterSpacing: 0.5 }}>
                      {row.quotaValue ? `${row.quotaValue} / ${row.quotaUnit === 'phongban' ? 'phòng' : 'người'}` : 'Không có'}
                     </Typography>
                   </Box>
                </Stack>
              </CardContent>
              <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid", borderColor: "grey.100", px: 1, py: 0.5, bgcolor: '#fff' }}>
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
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination Footer */}
      <Box sx={{ mt: 2, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, bgcolor: "#fff" }}>
         <Typography variant="body2" color="text.secondary">
            Hiển thị {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, displayData.length)} của {displayData.length} kết quả
         </Typography>
         <Pagination 
            count={Math.ceil(displayData.length / rowsPerPage)} 
            page={page + 1} 
            onChange={handleChangePage} 
            color="primary" 
            shape="rounded" 
            size="small" 
         />
      </Box>
    </Box>
  );
};

export default ItemGrid;
