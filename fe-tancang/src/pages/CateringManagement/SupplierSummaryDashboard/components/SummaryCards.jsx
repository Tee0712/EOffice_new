import React from 'react';
import {
  LocalShipping,
  Description,
  Restaurant,
  Payments,
  Star as StarIcon,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

const iconMap = {
  totalSuppliers: { icon: <LocalShipping />, color: '#eff6ff', text: '#3b82f6' },
  monthlyOrders: { icon: <Description />, color: '#f0fdf4', text: '#22c55e' },
  mealsProvided: { icon: <Restaurant />, color: '#fff7ed', text: '#f97316' },
  totalCost: { icon: <Payments />, color: '#f5f3ff', text: '#8b5cf6' },
  overallRating: { icon: <StarIcon />, color: '#fffbeb', text: '#f59e0b' },
};

const labelMap = {
  totalSuppliers: 'Nhà cung cấp',
  monthlyOrders: 'Đơn hàng tháng',
  mealsProvided: 'Suất ăn cung cấp',
  totalCost: 'Tổng chi phí',
  overallRating: 'Điểm TB chung',
};

const SummaryCards = ({ data }) => {
  if (!data) return null;

  const renderTrend = (key, trend, value) => {
    if (value === undefined || value === null) return null;
    const isUp = trend === 'up';
    return (
      <div className={`trend-indicator ${isUp ? 'up' : 'down'}`}>
        {isUp ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
        <span>{isUp ? '+' : '-'}{value}{typeof value === 'number' && key !== 'overallRating' ? '%' : ''}</span>
      </div>
    );
  };

  const formatValue = (key, val) => {
    if (key === 'totalCost') {
      if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ`;
      if (val >= 1000000) return `${(val / 1000000).toFixed(0)} tr`;
      return val.toLocaleString();
    }
    if (key === 'overallRating') return val.toFixed(1);
    return val.toLocaleString();
  };

  return (
    <div className="kpi-grid">
      {Object.entries(labelMap).map(([key, label]) => {
        const item = data?.[key] || { value: 0 };
        return (
          <div key={key} className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: iconMap[key].color, color: iconMap[key].text }}>
              {iconMap[key].icon}
            </div>
            <div className="kpi-info">
              <p>{label}</p>
              <h3>{formatValue(key, item.value)}</h3>
              {renderTrend(key, item.trend, item.trendValue)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
