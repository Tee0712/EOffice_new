import React from 'react';
import { Grid, Box, Typography, IconButton, Tooltip, Rating, Stack } from '@mui/material';
import { 
  VisibilityOutlined as ViewIcon, 
  EditOutlined as EditIcon, 
  DeleteOutline as DeleteIcon,
  DescriptionOutlined as ContractIcon,
  StarOutline as EvalIcon,
  MonetizationOnOutlined as PriceIcon
} from '@mui/icons-material';

const SupplierCard = ({ supplier, onView, onEdit, onDelete, onContract, onPrice, onEval }) => {
  const getStatusClass = (status) => {
    switch(status) {
      case 'active': return 'top-bar-active';
      case 'inactive': return 'top-bar-inactive';
      default: return 'top-bar-disabled';
    }
  };

  return (
    <Box className="premium-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box className={`supplier-card-top-bar ${getStatusClass(supplier.status || 'active')}`} />
      
      <Box sx={{ p: 2.5, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
           <Typography sx={{ 
             fontSize: '11px', 
             fontWeight: 700, 
             color: '#64748b', 
             bgcolor: '#f1f5f9', 
             px: 1, py: 0.5, 
             borderRadius: '4px' 
           }}>
             {supplier.type || 'NHÀ CUNG CẤP'}
           </Typography>
           <Box sx={{ color: '#3fbb7d', display: 'flex', alignItems: 'center', gap: 0.5 }}>
             <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>ĐANG HỢP TÁC</Typography>
           </Box>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3353', mb: 0.5, lineHeight: 1.3 }}>
          {supplier.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#8c8c8c', mb: 2, fontWeight: 500 }}>
          Mã: {supplier.supplier_code || supplier.id}
        </Typography>

        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '13px', color: '#64748b' }}>Đánh giá:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={Number(supplier.ratingAvgCached) || 0} readOnly size="small" precision={0.5} />
                <Typography sx={{ fontSize: '13px', fontWeight: 700, ml: 0.5 }}>{supplier.ratingAvgCached || 0}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '13px', color: '#64748b' }}>Mã số thuế:</Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{supplier.taxCode || '---'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '13px', color: '#64748b' }}>Liên hệ:</Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{supplier.contactPerson || '---'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '13px', color: '#64748b' }}>Hợp đồng:</Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1890ff' }}>
              {supplier.contractStatusCached === 'APPROVED' ? 'Còn hạn' : 'Chưa có/Hết hạn'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Action Buttons Footer */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid #eef0f4', 
        bgcolor: '#f8fafc',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <Tooltip title="Xem chi tiết">
          <IconButton onClick={() => onView(supplier)} size="small" sx={{ color: '#1890ff', '&:hover': { bgcolor: '#e6f7ff' } }}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Chỉnh sửa">
          <IconButton onClick={() => onEdit(supplier)} size="small" sx={{ color: '#faad14', '&:hover': { bgcolor: '#fffbe6' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bảng giá">
          <IconButton onClick={() => onPrice(supplier)} size="small" sx={{ color: '#13c2c2', '&:hover': { bgcolor: '#e6fffb' } }}>
            <PriceIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Hợp đồng">
          <IconButton onClick={() => onContract(supplier)} size="small" sx={{ color: '#722ed1', '&:hover': { bgcolor: '#f9f0ff' } }}>
            <ContractIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Đánh giá">
          <IconButton onClick={() => onEval(supplier)} size="small" sx={{ color: '#eb2f96', '&:hover': { bgcolor: '#fff0f6' } }}>
            <EvalIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa">
          <IconButton onClick={() => onDelete(supplier.id)} size="small" sx={{ color: '#ff4d4f', '&:hover': { bgcolor: '#fff1f0' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

const SupplierCards = ({ suppliers, onView, onEdit, onDelete, onContract, onPrice, onEval }) => {
  return (
    <Grid container spacing={3} sx={{ p: 2.5 }}>
      {suppliers.map(supplier => (
        <Grid item xs={12} sm={6} md={4} key={supplier.id}>
          <SupplierCard 
            supplier={supplier}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onContract={onContract}
            onPrice={onPrice}
            onEval={onEval}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default SupplierCards;
