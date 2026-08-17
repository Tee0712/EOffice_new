import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RequestItemTable from './RequestItemTable';
import StatusBadge from './StatusBadge';

const ExpandableRequestCard = ({ request, onConfirm, onPrint }) => {
  const [items, setItems] = useState(request.items || []);

  const handleQtyChange = (itemId, val) => {
    setItems((prev) =>
      prev.map((it) => (it.item_id === itemId ? { ...it, issue_quantity: val } : it))
    );
  };

  return (
    <Accordion
      elevation={0}
      sx={{
        mb: 2,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px !important',
        boxShadow: 'var(--glass-shadow)',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Avatar sx={{ bgcolor: 'var(--primary-accent)', width: 40, height: 40 }}>
            {request.receiver_name?.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {request.transaction_code}
              </Typography>
              <StatusBadge label={request.is_overdue ? 'Quá hạn' : 'Đúng hạn'} type={request.is_overdue ? 'overdue' : 'completed'} />
              {request.priority === 'urgent' && <StatusBadge label="GẤP" type="urgent" />}
            </Box>
            <Typography variant="body2" color="textSecondary">
              {request.receiver_name} • {request.receiver_department}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" display="block" color="textSecondary">
              Số mặt hàng
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {request.item_count}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" display="block" color="textSecondary">
              Ngày cần
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {request.needed_date}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Divider />
        <RequestItemTable items={items} onQuantityChange={handleQtyChange} />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" color="primary" onClick={() => onPrint(request.id)}>
            In phiếu
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onConfirm(request.id, items)}
            sx={{ px: 4, borderRadius: 2 }}
          >
            Xác nhận cấp phát
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ExpandableRequestCard;
