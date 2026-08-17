import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { CircularProgress, Box, Typography, Button, Divider } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-toastify';
import RequestItemTable from '../../../components/vpp/RequestItemTable';
import { AuthContext } from '../../../AuthContext/AuthProvider';
import { API_VPP_GOODS_ISSUES, APP_BASE } from '../../../EnvironmentFile/constants/urlConfig';
import { formatValidationErrors } from '../../../utils/utils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3156/api/v1';

const formatSignatureUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;

  // Use APP_BASE from urlConfig which is the source of truth for backend address
  const baseUrl = (APP_BASE || "").replace('/api/v1', '');

  // Handle absolute URLs by extracting the path and prepending the current baseUrl
  if (url.startsWith('http')) {
    try {
      const sigUrl = new URL(url);
      // Switch from /raw/ to /view/ to allow inline display in <img> tags
      const path = sigUrl.pathname.replace('/api/files/raw/', '/api/files/view/');
      return `${baseUrl}${path}${sigUrl.search}`;
    } catch (e) {
      console.error("Invalid signature URL:", url);
      return url;
    }
  }

  // If it's a relative path, prepend the base URL and ensure it uses /view/
  let formattedPath = url.replace('/api/files/raw/', '/api/files/view/');

  // Fix double upload prefix in legacy data
  if (formattedPath.includes('upload/TCSG/VPP/')) {
    formattedPath = formattedPath.replace('upload/', '');
  }

  return `${baseUrl}${formattedPath.startsWith('/') ? '' : '/'}${formattedPath}`;
};

const DistributionDetail = ({ requestId, requestNumber, onRefresh, isFinished }) => {
  const { user } = useContext(AuthContext);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const sigPad = useRef(null);

  const currentUserId = String(user?.user?.id || user?.user?._id || user?.user?.user?.id || user?.user?.user?._id || '');
  const isCreator = detail ? (currentUserId === String(detail.requester_id || '')) : false;

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('token_app');
      const res = await axios.get(`${API_VPP_GOODS_ISSUES}/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Map data fields to match RequestItemTable expectations
        const mappedItems = res.data.data.items.map(item => {
          const isFinishedStatus = res.data.data.status === 'FINISHED' || res.data.data.status === 'COMPLETED' || res.data.data.status === 'PARTIAL';
          const actual = item.actual_quantity != null ? Number(item.actual_quantity) : 0;
          const requested = Number(item.requested_quantity || 0);

          return {
            ...item,
            issue_quantity: isFinishedStatus ? actual : (actual > 0 ? actual : requested),
            requested_quantity: requested,
            approved_quantity: isFinishedStatus ? requested : (actual > 0 ? actual : requested),
          };
        });
        setDetail({ ...res.data.data, items: mappedItems });
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (itemId, val) => {
    let numVal = parseInt(val, 10);
    if (isNaN(numVal) || numVal < 0) numVal = 0;

    setDetail(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it.item_id === itemId) {
          // Prevent issuing more than approved
          if (numVal > it.approved_quantity) {
            numVal = it.approved_quantity;
          }
          return { ...it, issue_quantity: numVal };
        }
        return it;
      })
    }));
  };

  const handleConfirm = async () => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      toast.warning('Vui lòng ký xác nhận trước khi cấp phát');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token_app');
      const signature = sigPad.current.toDataURL('image/png');

      const submitItems = detail.items.map(item => ({
        product_id: item.product_id,
        actual_quantity: Number(item.issue_quantity),
        is_finished: Number(item.issue_quantity) >= Number(item.approved_quantity)
      }));

      const res = await axios.post(`${API_VPP_GOODS_ISSUES}/${requestId}/confirm`, {
        signature,
        items: submitItems
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Xác nhận cấp phát thành công');
        onRefresh();
      }
    } catch (err) {
      console.error('Error confirming:', err);
      const message = formatValidationErrors(err, 'Có lỗi xảy ra khi xác nhận cấp phát');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearSignature = () => {
    sigPad.current?.clear();
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
  if (!detail) return <Box sx={{ p: 4 }}><Typography color="error">Không tìm thấy thông tin chi tiết</Typography></Box>;

  return (
    <Box sx={{ p: 1 }}>
      <RequestItemTable
        items={detail.items}
        onQuantityChange={handleQtyChange}
        readonly={isFinished}
        totalValue={detail.estimated_value}
      />

      {!isFinished && isCreator && (
        <Box sx={{ mt: 3 }}>
          {/* Người nhận input */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, bgcolor: '#f1f5f9', p: 1, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem', width: 120, pl: 2 }}>
              NGƯỜI NHẬN
            </Typography>
            <Box sx={{ flex: 1, bgcolor: '#ffffff', borderRadius: 1, px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                {detail.requester_name || '...'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 3,
                  bgcolor: '#ffffff',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 120,
                  cursor: 'crosshair',
                  '&:hover': { borderColor: '#94a3b8' }
                }}
              >
                {!sigPad?.current?.toData()?.length && (
                  <Box sx={{ position: 'absolute', pointerEvents: 'none', textAlign: 'center', color: '#94a3b8' }}>
                    <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>✍️</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Nhấn để ký xác nhận nhận hàng</Typography>
                    <Typography sx={{ fontSize: '0.75rem' }}>(hoặc ký trên thiết bị cảm ứng)</Typography>
                  </Box>
                )}
                <SignatureCanvas
                  ref={sigPad}
                  penColor='black'
                  canvasProps={{ width: 800, height: 120, className: 'signature-area' }}
                  onEnd={() => setSubmitting(false)} // simply trigger a render if needed
                />
                <Button
                  size="small"
                  onClick={clearSignature}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    minWidth: 'auto',
                    color: 'error.main',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { bgcolor: '#ffe4e6' }
                  }}
                >
                  Xóa
                </Button>
              </Box>
            </Box>
          </Box>

          {/* User Review and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Duyệt bởi: <span style={{ fontWeight: 600, color: '#475569' }}>{user?.user?.fullname || 'Admin'} - {user?.user?.department_name || 'HC'}</span>
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: '8px',
                  color: '#334155',
                  borderColor: '#e2e8f0',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                🖨️ In phiếu
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                disabled={submitting}
                sx={{
                  borderRadius: '8px',
                  px: 3,
                  bgcolor: '#16a34a',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#15803d' }
                }}
              >
                {submitting ? 'Đang xử lý...' : '✓ Xác nhận cấp phát'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {detail.signature && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#64748b">
              CHỮ KÝ NGƯỜI NHẬN:
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => {
                const url = formatSignatureUrl(detail.signature).replace('/view/', '/download/');
                window.open(url, '_blank');
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              📥 Tải chữ ký
            </Button>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', bgcolor: '#fff', p: 2, borderRadius: 1 }}>
            <img
              src={formatSignatureUrl(detail.signature)}
              alt="Chữ ký"
              style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                console.error("Failed to load signature image:", detail.signature);
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DistributionDetail;
