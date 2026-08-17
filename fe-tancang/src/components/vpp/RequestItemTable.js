import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Box,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

const RequestItemTable = ({ items, onQuantityChange, readonly = false }) => {
  const totalApproved = items.reduce((sum, it) => sum + Number(it.approved_quantity || 0), 0);
  const totalIssued = items.reduce((sum, it) => sum + Number(it.issue_quantity || 0), 0);
  const totalValue = items.reduce((sum, it) => sum + (Number(it.issue_quantity || 0) * Number(it.unit_price || 0)), 0);

  return (
    <Box sx={{ bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #e2e8f0', py: 2 }}>MẶT HÀNG</TableCell>
              <TableCell align="center" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>SL DUYỆT</TableCell>
              <TableCell align="center" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>SL CẤP</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>TỒN KHO</TableCell>
              <TableCell align="center" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>TRẠNG THÁI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const isLowStock = item.stock_quantity <= item.approved_quantity;

              return (
                <TableRow key={item.item_id}>
                  {/* Mặt hàng */}
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <Inventory2OutlinedIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {item.product_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {item.product_code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* SL Duyệt */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>
                    {item.approved_quantity}
                  </TableCell>

                  {/* SL Cấp */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={item.issue_quantity}
                        disabled={readonly}
                        onChange={(e) => onQuantityChange(item.item_id, e.target.value)}
                        sx={{
                          width: 50,
                          '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', borderRadius: 1 },
                          '& input': { textAlign: 'center', fontWeight: 600, p: '6px' }
                        }}
                      />
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', minWidth: 24, textAlign: 'left' }}>
                        {item.unit}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Tồn kho */}
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: isLowStock ? '#d97706' : '#16a34a', fontSize: '0.85rem' }}>
                        {item.stock_quantity}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isLowStock ? '#d97706' : '#16a34a' }} />
                        <Box sx={{ width: 20, height: 3, borderRadius: 1, bgcolor: isLowStock ? '#fef3c7' : '#dcfce7' }}>
                          <Box sx={{ width: '50%', height: '100%', bgcolor: isLowStock ? '#d97706' : '#16a34a', borderRadius: 1 }} />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{
                      px: 1.5, py: 0.5,
                      bgcolor: isLowStock ? '#fef3c7' : '#dcfce7',
                      color: isLowStock ? '#d97706' : '#15803d',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {isLowStock ? 'Thiếu hàng' : 'Đủ kho'}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Total Row */}
      <Box sx={{
        bgcolor: '#f8fafc',
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #e2e8f0'
      }}>
        <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>
          Tổng: {totalIssued}/{totalApproved} đơn vị
        </Typography>
        <Typography sx={{ color: '#2563eb', fontWeight: 700, fontSize: '1rem' }}>
          {Number(totalValue || 0).toLocaleString('vi-VN')} ₫
        </Typography>
      </Box>
    </Box>
  );
};

export default RequestItemTable;
