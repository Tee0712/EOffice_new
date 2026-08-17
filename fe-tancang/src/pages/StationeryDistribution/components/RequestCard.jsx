import React, { useState } from 'react';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Box, 
  Typography, 
  Avatar, 
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DistributionDetail from './DistributionDetail';

const getAvatarColor = (name) => {
  const char = name?.charAt(0)?.toUpperCase() || 'U';
  const colors = {
    'L': '#0f766e',
    'T': '#86198f',
    'Đ': '#475569',
    'H': '#b45309',
    'N': '#0369a1',
  };
  return colors[char] || '#475569';
};

const StatusBadgeCustom = ({ label, type }) => {
  const styles = {
    pending: { bg: '#e0f2fe', color: '#1d4ed8' },
    partial: { bg: '#f3e8ff', color: '#7e22ce' },
    completed: { bg: '#dcfce7', color: '#15803d' },
    urgent: { bg: '#fee2e2', color: '#dc2626' },
    overdue: { bg: '#fee2e2', color: '#dc2626' }
  };
  const style = styles[type] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <Box sx={{ 
      px: 1.5, 
      py: 0.5, 
      borderRadius: '16px', 
      bgcolor: style.bg, 
      color: style.color, 
      fontSize: '0.8rem', 
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5
    }}>
      {label}
    </Box>
  );
};

const RequestCard = ({ request, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusInfo = () => {
    if (request.status === 'APPROVED') return { label: 'Chờ cấp phát', type: 'pending' };
    if (request.status === 'PARTIAL') return { label: 'Cấp một phần', type: 'partial' };
    if (request.status === 'FINISHED') {
      // Nếu hoàn tất nhưng số lượng cấp < số lượng yêu cầu -> Cấp một phần
      if (Number(request.total_actual || 0) < Number(request.total_requested || 0)) {
        return { label: 'Cấp một phần', type: 'partial' };
      }
      return { label: 'Hoàn tất', type: 'completed' };
    }
    return { label: request.status, type: 'pending' }; // default
  };

  const status = getStatusInfo();
  const isUrgent = request.priority === 'HIGH' || request.priority === 'URGENT';
  const isOverdue = new Date(request.need_date) < new Date() && request.status !== 'FINISHED';

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Tính Indicator Color
  const getIndicatorColor = () => {
    if (isUrgent) return '#ef4444'; // red
    return '#3b82f6'; // blue (default for pending)
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      elevation={0}
      sx={{
        mb: 2,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#64748b' }} />} sx={{ p: 0, '& .MuiAccordionSummary-content': { m: 0 }}}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1.5, pr: 2 }}>
          {/* Vertical Indicator */}
          <Box sx={{ width: 4, height: 40, bgcolor: getIndicatorColor(), borderRadius: '0 4px 4px 0', mr: 2 }} />

          {/* Request ID */}
          <Typography sx={{ width: '140px', fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>
            {request.request_number}
          </Typography>

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1.5, minWidth: '200px' }}>
            <Avatar sx={{ bgcolor: getAvatarColor(request.requester_name), width: 36, height: 36, fontSize: '0.9rem', fontWeight: 'bold' }}>
              {request.requester_name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.2 }}>
                {request.requester_name}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                {request.department_name}
              </Typography>
            </Box>
          </Box>

          {/* Items */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
             <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.2 }}>
              {request.total_items}
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Mặt hàng
            </Typography>
          </Box>

          {/* Value */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.2 }}>
              {Number(request.estimated_value || 0).toLocaleString('vi-VN')} ₫
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Giá trị
            </Typography>
          </Box>

          {/* Date */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: isOverdue ? '#dc2626' : '#1e293b', fontSize: '0.95rem', lineHeight: 1.2 }}>
              {formatDate(request.need_date)}
            </Typography>
            <Typography sx={{ color: isOverdue ? '#dc2626' : '#94a3b8', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
              {isOverdue && <span>⚠</span>}
              {isOverdue ? 'Quá hạn' : 'Ngày cần'}
            </Typography>
          </Box>

          {/* Status Badges */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: '180px' }}>
            {isOverdue && !isUrgent && <StatusBadgeCustom label="Quá hạn" type="overdue" />}
            {isUrgent && <StatusBadgeCustom label="⚡ Gấp" type="urgent" />}
            <StatusBadgeCustom label={status.label} type={status.type} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 3, pb: 3 }}>
        <Divider sx={{ mb: 2 }} />
        {expanded && (
          <DistributionDetail 
            requestId={request.id} 
            requestNumber={request.request_number}
            onRefresh={() => {
              setExpanded(false);
              onRefresh();
            }}
            isFinished={request.status === 'FINISHED'}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default RequestCard;
