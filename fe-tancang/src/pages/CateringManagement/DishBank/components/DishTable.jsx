import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Avatar, 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Rating
} from '@mui/material';
import { 
  VisibilityOutlined as ViewIcon, 
  EditOutlined as EditIcon, 
  DeleteOutline as DeleteIcon,
  Block as StopIcon,
  CheckCircleOutline as ActiveIcon
} from '@mui/icons-material';
import { getDishImage } from '../constants';

const DishTable = ({ dishes, onView, onEdit, onToggle }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b', width: 60 }}>STT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Món ăn</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Phân loại</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Nhà cung cấp</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Đơn giá</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Trạng thái</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: '#1e293b' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dishes.map((item, index) => (
            <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    variant="rounded" 
                    src={getDishImage(item.imageUrl, item.category)} 
                    onError={(e) => { e.target.src = getDishImage(null, item.category); }}
                    sx={{ width: 44, height: 44, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>#{item.code}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={item.category === 'com' ? 'Món cơm' : item.category === 'bun_pho' ? 'Bún/Phở' : item.category === 'canh' ? 'Canh/Soup' : 'Khác'} 
                  size="small" 
                  sx={{ 
                    bgcolor: item.category === 'com' ? '#fff7ed' : item.category === 'bun_pho' ? '#f0fdf4' : item.category === 'canh' ? '#e0f2fe' : '#f5f3ff', 
                    color: item.category === 'com' ? '#c2410c' : item.category === 'bun_pho' ? '#15803d' : item.category === 'canh' ? '#0369a1' : '#6d28d9',
                    fontWeight: 600,
                    borderRadius: '8px'
                  }} 
                />
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{item.supplierName || 'N/A'}</TableCell>
              <TableCell>
                <Typography sx={{ color: '#27ae60', fontWeight: 700 }}>{item.price?.toLocaleString('vi-VN')} đ</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>/ {item.unit}</Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={item.isActive === 1 ? 'Đang phục vụ' : 'Ngưng phục vụ'}
                  size="small"
                  sx={{ 
                    bgcolor: item.isActive === 1 ? '#f0fdf4' : '#f1f5f9', 
                    color: item.isActive === 1 ? '#22c55e' : '#94a3b8',
                    border: '1px solid',
                    borderColor: item.isActive === 1 ? '#bbf7d0' : '#e2e8f0',
                    fontWeight: 700,
                    borderRadius: '100px'
                  }} 
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Tooltip title="Xem chi tiết">
                    <IconButton size="small" onClick={() => onView(item)} sx={{ color: '#0ea5e9' }}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: '#22c55e' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.isActive === 1 ? "Ngưng phục vụ" : "Kích hoạt"}>
                    <IconButton size="small" onClick={() => onToggle(item)} sx={{ color: '#ef4444' }}>
                      {item.isActive === 1 ? <StopIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DishTable;
