import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Star, TrendingUp, EmojiEvents } from '@mui/icons-material';
import { Box } from '@mui/material';

const RankingAndTrend = ({ ranking, trends, activeId, onActiveChange }) => {
  if (!ranking || !trends) return null;

  const chartData = useMemo(() => {
    return trends.months.map((month, idx) => {
      const obj = { name: month };
      trends.series.forEach(s => {
        obj[s.supplierName] = s.data[idx];
      });
      return obj;
    });
  }, [trends]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 8px', fontSize: '13px' }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
              <span>{p.name}: <strong style={{ color: '#1e293b' }}>{p.value}</strong></span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-row">
      {/* Ranking Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <div className="card-title">
            <EmojiEvents sx={{ color: '#f59e0b' }} />
            Xếp hạng Nhà cung cấp
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Theo điểm đánh giá</span>
        </div>
        <div className="card-body">
          <div className="ranking-list">
            {ranking.slice(0, 5).map((item, idx) => (
              <div 
                key={item.id} 
                className={`ranking-item ${activeId === item.id ? 'active' : ''}`}
                onClick={() => onActiveChange(activeId === item.id ? null : item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`rank-badge top-${idx + 1}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.orderCount} đơn • {(item.mealCount / 1000).toFixed(1)}k suất
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--warning)' }}>{item.rating.toFixed(1)}</div>
                  <div style={{ display: 'flex', gap: '1px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} sx={{ fontSize: 13, color: i < Math.floor(item.rating) ? 'var(--warning)' : '#e2e8f0' }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation Trend Chart */}
      <div className="dashboard-card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp sx={{ color: 'var(--primary)' }} />
            Xu hướng Đánh giá
          </div>
        </div>
        <div className="card-body" style={{ height: '360px', padding: '24px 12px 12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                domain={[0, 5]} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 500 }} 
                align="center"
              />
              {trends.series.map((s, i) => {
                const isHighlighted = activeId === null || ranking.find(r => r.id === activeId)?.name === s.supplierName;
                return (
                  <Line
                    key={s.supplierName}
                    type="monotone"
                    dataKey={s.supplierName}
                    stroke={colors[i % colors.length]}
                    strokeWidth={isHighlighted ? 4 : 1.5}
                    strokeOpacity={isHighlighted ? 1 : 0.2}
                    dot={isHighlighted ? { r: 4, strokeWidth: 2, fill: 'white' } : false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={500}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RankingAndTrend;
