import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Stack, 
  Chip,
  Skeleton
} from '@mui/material';

const ReportCardItem = ({ label, value, color = 'text.primary', bold = false }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 1 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 500} color={color}>{value}</Typography>
  </Stack>
);

const ReportCard = ({ activeTab, data, loading }) => {
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={150} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography color="text.secondary">Không có dữ liệu.</Typography>
      </Box>
    );
  }

  const list = Array.isArray(data) ? data : [data];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {list.map((item, index) => (
        <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {activeTab === 0 && (
              <>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  {item.code} - {item.name}
                </Typography>
                <Divider />
                <ReportCardItem label="Đơn vị tính" value={item.unit} />
                <ReportCardItem label="Tồn đầu" value={item.opening_stock?.toLocaleString()} />
                <ReportCardItem label="Nhập" value={item.receipt_qty?.toLocaleString()} color="success.main" />
                <ReportCardItem label="Xuất" value={item.issue_qty?.toLocaleString()} color="error.main" />
                <Divider />
                <ReportCardItem label="Tồn cuối" value={item.closing_stock?.toLocaleString()} bold />
              </>
            )}

            {activeTab === 1 && (
              <>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  {item.department_name}
                </Typography>
                <Divider />
                <ReportCardItem label="Số lượng cấp" value={item.total_qty?.toLocaleString()} />
                <ReportCardItem label="Tổng giá trị" value={item.total_value?.toLocaleString() + ' đ'} />
                <ReportCardItem label="Tỷ trọng" value={item.percentage + '%'} color="primary.main" bold />
              </>
            )}

            {activeTab === 2 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary.main">
                    {item.product_name}
                  </Typography>
                  <Chip 
                    label={item.actual_quantity > item.limit_quantity ? "Vượt ĐM" : "Trong ĐM"} 
                    size="small" 
                    color={item.actual_quantity > item.limit_quantity ? "error" : "success"}
                    sx={{ fontWeight: 600, height: 20, fontSize: 10 }}
                  />
                </Box>
                <Divider />
                <ReportCardItem label="Mã hàng" value={item.product_code} />
                <ReportCardItem label="Định mức" value={item.limit_quantity} />
                <ReportCardItem label="Thực tế cấp" value={item.actual_quantity} bold />
                <ReportCardItem label="Tỷ lệ sử dụng" value={item.usage_ratio + '%'} color="primary.main" />
              </>
            )}

            {activeTab === 3 && (
              <>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  {item.period || "Tổng hợp chi phí"}
                </Typography>
                <Divider />
                <ReportCardItem label="Số phiếu" value={item.total_requests} />
                <ReportCardItem label="Mặt hàng" value={item.total_items || "-"} />
                <ReportCardItem label="Đã hoàn tất" value={item.completed} color="success.main" />
                <Divider />
                <ReportCardItem label="Tổng chi phí" value={item.total_cost?.toLocaleString() + ' đ'} bold />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ReportCard;
