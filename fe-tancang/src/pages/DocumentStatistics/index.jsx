import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Box, Typography, CircularProgress, Skeleton } from '@mui/material';
import { 
  Description as DocIcon, 
  MarkAsUnread as UnreadIcon, 
  Create as CreateIcon, 
  MoveToInbox as InboxIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_USER_INBOX_STATISTICS } from '@EnvironmentFile/constants/urlConfig';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 4, 
      borderRadius: '24px', 
      border: '1px solid #eef2f6',
      background: `linear-gradient(135deg, white 0%, #fafafa 100%)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: `0 12px 24px ${color}15`,
        borderColor: color,
      }
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', zIndex: 1 }}>
      <Box sx={{ 
        width: 64, 
        height: 64, 
        borderRadius: '18px', 
        bgcolor: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '32px',
        color: 'white',
        boxShadow: `0 8px 20px ${color}33`
      }}>
        <Icon sx={{ fontSize: 32 }} />
      </Box>
      <Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, mb: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {title}
        </Typography>
        {loading ? (
            <Skeleton width="60%" height={48} sx={{ bgcolor: '#f1f5f9' }} />
        ) : (
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a3353' }}>
              {value.toLocaleString()}
            </Typography>
        )}
      </Box>
    </Box>
    
    <Icon sx={{ 
      position: 'absolute', 
      bottom: -20, 
      right: -20, 
      fontSize: '120px', 
      opacity: 0.04,
      color: color,
      transform: 'rotate(-15deg)'
    }} />
  </Paper>
);

const DocumentStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token_app");
        const response = await axios.get(API_USER_INBOX_STATISTICS, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data) {
          // Axios returns data in .data property
          // Based on image, the fields are receivedCount, readCount, createdCount
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching doc statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            <HomeIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Trang chủ</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>/</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a3353' }}>Thống kê văn bản</Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a3353', mb: 1 }}>Thống kê văn bản cá nhân</Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>Tổng hợp tình trạng xử lý văn bản đến và đi của bạn trong hệ thống.</Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Văn bản chưa đọc" 
              value={(stats?.receivedCount || 0) - (stats?.readCount || 0)} 
              icon={UnreadIcon} 
              color="#ff4d4f" 
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Văn bản đã tạo" 
              value={stats?.createdCount || 0} 
              icon={CreateIcon} 
              color="#52c41a" 
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Văn bản đã nhận" 
              value={stats?.receivedCount || 0} 
              icon={InboxIcon} 
              color="#1890ff" 
              loading={loading}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DocumentStatistics;
