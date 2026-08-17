import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography, 
  Skeleton, 
  Stack,
  Chip,
  TablePagination
} from '@mui/material';

const StatusPill = ({ label, type }) => {
  // ... (previous StatusPill code)
  const color = type === 'success' ? '#16a34a' : '#f59e0b';
  const bgColor = type === 'success' ? '#f0fdf4' : '#fffbeb';
  return (
    <Box 
      sx={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        px: 1.5, 
        py: 0.5, 
        borderRadius: '20px', 
        backgroundColor: bgColor,
        border: '1px solid',
        borderColor: color + '30'
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, mr: 1 }} />
      <Typography variant="caption" fontWeight={700} sx={{ color: color }}>
        {label}
      </Typography>
    </Box>
  );
};

const ReportTable = ({ activeTab, data, loading }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    // ...
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  const renderContent = () => {
    // ... (same as before)
    switch (activeTab) {
      case 0:
        return {
          headers: ["#", "MẶT HÀNG", "NHÓM HÀNG", "ĐVT", "TỒN ĐẦU KỲ", "NHẬP", "XUẤT", "ĐIỀU CHỈNH", "TỒN CUỐI KỲ", "TRẠNG THÁI", "GIÁ TRỊ TỒN"],
          rows: data.map((item, index) => (
            <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
              <TableCell sx={{ fontSize: 13, color: '#64748b' }}>{index + 1}</TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ p: 0.8, borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex' }}>
                    <Box component="span" sx={{ fontSize: 16 }}>{index % 3 === 0 ? '📄' : index % 3 === 1 ? '🖋️' : '📦'}</Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>{item.name}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: '#94a3b8', fontSize: 10 }}>{item.code}</Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell sx={{ fontSize: 13, color: '#475569' }}>{item.category_name || "Vật tư"}</TableCell>
              <TableCell sx={{ fontSize: 12, color: '#64748b' }}>{item.unit}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>{item.opening_stock?.toLocaleString()}</TableCell>
              
              <TableCell align="center">
                <Box sx={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, borderRadius: '4px', p: 0.5, px: 1, display: 'inline-block' }}>
                  +{item.receipt_qty?.toLocaleString() || 0}
                </Box>
              </TableCell>

              <TableCell align="center">
                <Box sx={{ backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 700, borderRadius: '4px', p: 0.5, px: 1, display: 'inline-block' }}>
                  -{item.issue_qty?.toLocaleString() || 0}
                </Box>
              </TableCell>

              <TableCell align="center" sx={{ color: '#94a3b8' }}>{item.adjustment || '—'}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>{item.closing_stock?.toLocaleString()}</TableCell>
              
              <TableCell align="center">
                <StatusPill label={item.closing_stock > 10 ? "Đủ hàng" : "Sắp hết"} type={item.closing_stock > 10 ? 'success' : 'warning'} />
              </TableCell>

              <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {(item.closing_stock * 15000).toLocaleString()} đ
              </TableCell>
            </TableRow>
          ))
        };
      default:
        return { headers: [], rows: [] };
    }
  };

  const { headers, rows } = renderContent();
  if (headers.length === 0) return null;

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              {headers.map((header, i) => (
                <TableCell 
                  key={i} 
                  align={i === 1 ? "left" : i === headers.length - 1 ? "right" : "center"}
                  sx={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    color: '#475569', 
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    textTransform: 'uppercase'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={100} // Mocked total
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số dòng mỗi trang:"
        sx={{ borderTop: '1px solid #f1f5f9' }}
      />
    </Box>
  );
};

export default ReportTable;
