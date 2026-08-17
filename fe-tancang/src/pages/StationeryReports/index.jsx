import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Card,
  Breadcrumbs, 
  Link, 
  Typography, 
  useTheme,
  useMediaQuery,
  Alert,
  Tabs, 
  Tab,
  Stack,
  Button
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import ReportHeader from './components/ReportHeader';
import ReportTabs from './components/ReportTabs';
import KPIGrid from './components/KPIGrid';
import FilterBar from './components/FilterBar';
import ReportTable from './components/ReportTable';
import ReportCard from './components/ReportCard';
import { useReportData } from '../../hooks/useReportData';

const StationeryReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [subTab, setSubTab] = useState(0); 
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    department: 'All',
    category: 'All',
    keyword: '',
    period: 'current_month'
  });

  const { data, loading, error, categories } = useReportData(activeTab, filters);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, backgroundColor: '#f8fafc', minHeight: '100vh', overflowX: 'auto' }}>
      <Container maxWidth={false} sx={{ px: isMobile ? 1 : 2, minWidth: isMobile ? 'auto' : 1300 }}>
        {/* 1. Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: '#94a3b8' }} />} sx={{ mb: 2 }}>
          <Link underline="hover" color="#64748b" href="/" sx={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500 }}><HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />Trang chủ</Link>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Văn phòng phẩm</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>Báo cáo</Typography>
        </Breadcrumbs>

        {/* 2. Header Title & Actions */}
        <ReportHeader filters={filters} activeTab={activeTab} />
        
        {/* 3. Main Navigation Tab Cards */}
        <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Error Handling */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* 4. Filter Bar (Search Block) - Modern Style */}
        <FilterBar 
          onFilter={handleFilterChange} 
          filters={filters} 
          categories={categories}
        />

        {/* 5. Main Content Block */}
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            overflow: 'hidden'
          }}
        >
          {/* Block Header */}
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            sx={{ 
              px: 3, 
              py: 2, 
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#fff'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ color: '#2563eb', display: 'flex' }}>
                <NavigateNextIcon sx={{ transform: 'rotate(90deg)', fontSize: 20 }} /> 
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e293b' }}>
                  Báo cáo Xuất – Nhập – Tồn kho
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box 
                sx={{ 
                  display: 'flex', 
                  backgroundColor: '#f1f5f9', 
                  p: 0.5, 
                  borderRadius: '8px' 
                }}
              >
                <Button 
                  size="small"
                  onClick={() => setSubTab(0)}
                  sx={{ 
                    px: 3,
                    borderRadius: '6px',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: subTab === 0 ? '#2563eb' : 'transparent',
                    color: subTab === 0 ? '#fff' : '#64748b',
                    '&:hover': { backgroundColor: subTab === 0 ? '#1d4ed8' : '#e2e8f0' }
                  }}
                >
                  Chi tiết
                </Button>
                <Button 
                  size="small"
                  onClick={() => setSubTab(1)}
                  sx={{ 
                    px: 3,
                    borderRadius: '6px',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: subTab === 1 ? '#2563eb' : 'transparent',
                    color: subTab === 1 ? '#fff' : '#64748b',
                    '&:hover': { backgroundColor: subTab === 1 ? '#1d4ed8' : '#e2e8f0' }
                  }}
                >
                  Theo nhóm
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', ml: 2, fontWeight: 600 }}>
                Tháng 03/2026
              </Typography>
            </Stack>
          </Stack>

          {/* KPI Stats Row Integrated Below Header */}
          <Box sx={{ p: 3, pb: 0 }}>
             <KPIGrid activeTab={activeTab} data={data} variant="row" />
          </Box>

          {/* Table Area */}
          <Box sx={{ p: 0 }}>
            <ReportTable activeTab={activeTab} data={data} loading={loading} />
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default StationeryReports;
