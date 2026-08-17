import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Select, 
  IconButton, 
  Typography, 
  Stack,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_CATERING_SUPPLIERS } from '@EnvironmentFile/constants/urlConfig';
import { CATEGORIES, STATUS_OPTIONS, PRICE_RANGE_OPTIONS } from '../constants';

const FilterBar = ({ filters, onFilterChange, viewMode, setViewMode, categoryCounts }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPage, setSupplierPage] = useState(0);
  const [hasMoreSuppliers, setHasMoreSuppliers] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const fetchSuppliers = useCallback(async (page, isFirst = false) => {
    if (loadingSuppliers || (!hasMoreSuppliers && !isFirst)) return;
    
    setLoadingSuppliers(true);
    try {
      const token = localStorage.getItem("token_app");
      const response = await axios.get(API_CATERING_SUPPLIERS, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page,
          size: 5,
          is_active: 1
        }
      });

      if (response.data && response.data.items) {
        const newItems = response.data.items;
        setSuppliers(prev => isFirst ? newItems : [...prev, ...newItems]);
        setHasMoreSuppliers(newItems.length === 5);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [loadingSuppliers, hasMoreSuppliers]);

  useEffect(() => {
    fetchSuppliers(0, true);
  }, []);

  const handleMenuScroll = (event) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 5) {
      if (hasMoreSuppliers && !loadingSuppliers) {
        const nextPage = supplierPage + 1;
        setSupplierPage(nextPage);
        fetchSuppliers(nextPage);
      }
    }
  };

  const getCategoryCount = (value) => {
    if (!categoryCounts) return 0;
    if (value === 'ALL') return categoryCounts.all || 0;
    if (value === 'com') return categoryCounts.com || 0;
    if (value === 'bun_pho') return categoryCounts.bun_pho || 0;
    if (value === 'canh') return categoryCounts.canh || 0;
    if (value === 'mon_khac') {
       const otherCount = (categoryCounts.canh || 0) + (categoryCounts.other || 0) + ((categoryCounts.all || 0) - (categoryCounts.com || 0) - (categoryCounts.bun_pho || 0) - (categoryCounts.canh || 0) - (categoryCounts.other || 0));
       return otherCount >= 0 ? otherCount : 0;
    }
    return categoryCounts[value] || 0;
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Category Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '4px' } }}>
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.value;
          return (
            <Box
              key={cat.value}
              onClick={() => onFilterChange('category', cat.value)}
              sx={{
                cursor: 'pointer',
                px: 2,
                py: 0.8,
                borderRadius: '100px',
                bgcolor: isActive ? '#1890ff' : 'white',
                border: '1px solid',
                borderColor: isActive ? '#1890ff' : '#e2e8f0',
                color: isActive ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 10px rgba(24, 144, 255, 0.2)' : 'none',
                '&:hover': {
                  borderColor: '#1890ff',
                  bgcolor: isActive ? '#1890ff' : '#f0f9ff'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{cat.label}</Typography>
              <Box sx={{ 
                bgcolor: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9', 
                color: isActive ? 'white' : '#64748b',
                px: 1, py: 0.2, 
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {getCategoryCount(cat.value)}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Main Filter Row */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'flex-end'
      }}>
        <Box sx={{ flexGrow: 1, minWidth: '300px' }}>
            <TextField
              placeholder="Tìm kiếm theo tên món, mã món..."
              size="small"
              fullWidth
              value={filters.keyword}
              onChange={(e) => onFilterChange('keyword', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '8px', bgcolor: '#f8fafc' }
              }}
            />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 0.5, display: 'block', px: 0.5 }}>NHÀ CUNG CẤP</Typography>
            <Select
              size="small"
              value={filters.supplierId || 'ALL'}
              onChange={(e) => onFilterChange('supplierId', e.target.value)}
              sx={{ minWidth: '180px', borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '14px' }}
              MenuProps={{
                PaperProps: {
                  onScroll: handleMenuScroll,
                  sx: { maxHeight: 250 }
                }
              }}
            >
              <MenuItem value="ALL">Tất cả NCC</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
              {loadingSuppliers && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </Select>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 0.5, display: 'block', px: 0.5 }}>TRẠNG THÁI</Typography>
            <Select
              size="small"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              sx={{ minWidth: '140px', borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '14px' }}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 0.5, display: 'block', px: 0.5 }}>KHOẢNG GIÁ</Typography>
            <Select
              size="small"
              value={filters.priceRange || 'ALL'}
              onChange={(e) => onFilterChange('priceRange', e.target.value)}
              sx={{ minWidth: '140px', borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '14px' }}
            >
              {PRICE_RANGE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: 0.4, borderRadius: '8px', height: '40px' }}>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('GRID')}
              sx={{ 
                bgcolor: viewMode === 'GRID' ? 'white' : 'transparent',
                borderRadius: '6px',
                boxShadow: viewMode === 'GRID' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: viewMode === 'GRID' ? '#1890ff' : '#64748b',
                px: 1
              }}
            >
              <GridViewIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('TABLE')}
              sx={{ 
                bgcolor: viewMode === 'TABLE' ? 'white' : 'transparent',
                borderRadius: '6px',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: viewMode === 'TABLE' ? '#1890ff' : '#64748b',
                px: 1
              }}
            >
              <TableViewIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FilterBar;
