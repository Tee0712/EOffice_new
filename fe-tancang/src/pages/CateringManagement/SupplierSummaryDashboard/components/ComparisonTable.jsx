import React from 'react';
import * as XLSX from 'xlsx';
import moment from 'moment';
import {
  Star,
  GetApp,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { Button } from '@mui/material';

const ComparisonTable = ({ data }) => {
  if (!data) return null;

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      'Nhà cung cấp': item.name,
      'Số đơn hàng': item.orderCount || 0,
      'Số suất ăn': item.mealCount || 0,
      'Doanh số (VNĐ)': item.revenue || 0,
      'Điểm đánh giá': item.rating || 0,
      'Chất lượng': item.qualityRating || 0,
      'Đúng giờ': item.ontimeRating || 0,
      'Xu hướng (%)': (item.trendValue || 0) + '%',
      'Hiệu suất (%)': (item.performance || Math.round(((item.rating || 0) / 5) * 100)) + '%'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So sanh NCC');
    
    // Auto-size columns
    const maxWidths = Object.keys(exportData[0]).map(key => {
      const headerLen = key.length;
      const dataLen = exportData.reduce((max, item) => Math.max(max, String(item[key]).length), 0);
      return { wch: Math.max(headerLen, dataLen) + 5 };
    });
    ws['!cols'] = maxWidths;

    XLSX.writeFile(wb, `Bao_cao_so_sanh_NCC_${moment().format('YYYYMMDD_HHmm')}.xlsx`);
  };

  const formatCurrency = (val) => {
    if (!val) return '0 VNĐ';
    if (typeof val === 'string' && val.includes('VNĐ')) return val;
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)} tỷ`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} tr`;
    return num.toLocaleString() + ' VNĐ';
  };

  const renderTrend = (val) => {
    const isUp = typeof val === 'string' ? val.startsWith('+') : val >= 0;
    const displayVal = typeof val === 'string' ? val : `${Math.abs(val)}%`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isUp ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
        {isUp ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
        <span>{displayVal}</span>
      </div>
    );
  };

  return (
    <div className="table-container">
      <div className="card-header">
        <div className="card-title">So sánh Chi tiết Nhà cung cấp</div>
        <Button
          className="btn-outline"
          startIcon={<GetApp />}
          size="small"
          onClick={handleExportExcel}
        >
          Xuất Excel
        </Button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>NHÀ CUNG CẤP</th>
              <th style={{ minWidth: '100px' }}>SỐ ĐƠN</th>
              <th style={{ minWidth: '100px' }}>SUẤT ĂN</th>
              <th style={{ minWidth: '140px' }}>DOANH SỐ</th>
              <th style={{ minWidth: '100px' }}>ĐÁNH GIÁ</th>
              <th style={{ minWidth: '110px' }}>CHẤT LƯỢNG</th>
              <th style={{ minWidth: '110px' }}>ĐÚNG GIỜ</th>
              <th style={{ minWidth: '120px' }}>XU HƯỚNG</th>
              <th style={{ minWidth: '140px' }}>HIỆU SUẤT</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const perf = item.performance || Math.round(((Number(item.rating) || 0) / 5) * 100);
              let perfColor = 'var(--success)';
              if (perf < 70) perfColor = 'var(--error)';
              else if (perf < 90) perfColor = 'var(--warning)';

              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#64748b'
                      }}>
                        {item.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</span>
                    </div>
                  </td>
                  <td>{item.orderCount ?? item.orders ?? 0}</td>
                  <td>{(item.mealCount ?? item.meals ?? 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(item.revenue || 0)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star sx={{ fontSize: 14, color: 'var(--warning)' }} />
                      <span style={{ fontWeight: 800 }}>{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>{typeof (item.qualityRating ?? item.quality) === 'number' ? (item.qualityRating ?? item.quality).toFixed(1) : (item.qualityRating ?? item.quality ?? '5.0')}</td>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>{typeof (item.ontimeRating ?? item.onTime) === 'number' ? `${(item.ontimeRating ?? item.onTime).toFixed(1)}%` : (item.ontimeRating ?? item.onTime ?? '100%')}</td>
                  <td>{renderTrend(item.trendValue ?? item.trend ?? 0)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${perf}%`,
                          height: '100%',
                          backgroundColor: perfColor,
                          borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: perfColor }}>
                        {perf}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
