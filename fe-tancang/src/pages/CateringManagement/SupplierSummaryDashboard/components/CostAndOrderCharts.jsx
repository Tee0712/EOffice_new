import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PieChart as PieIcon, BarChart as BarIcon } from '@mui/icons-material';

const CostAndOrderCharts = ({ costData = [], orderData = [] }) => {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '13px' }}>{payload[0].name}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            {payload[0].value.toLocaleString()} VND ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const EmptyState = ({ message }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: '12px', color: '#94a3b8' }}>
      <PieIcon sx={{ fontSize: 48, opacity: 0.2 }} />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
    </div>
  );

  return (
    <div className="dashboard-row">
      {/* Cost Distribution (Donut Chart) */}
      <div className="dashboard-card shadow-sm">
        <div className="card-header">
          <div className="card-title">
            <PieIcon sx={{ color: 'var(--primary)' }} />
            Phân bổ Chi phí theo NCC
          </div>
        </div>
        <div className="card-body" style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {costData && costData.length > 0 ? (
            <>
              <div style={{ width: '55%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '10px' }}>
                {costData.slice(0, 6).map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: COLORS[i % COLORS.length], borderRadius: '50%' }}></div>
                    <div style={{ flex: 1, fontWeight: 500, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="Chưa có dữ liệu chi phí hợp đồng" />
          )}
        </div>
      </div>

      {/* Order Quantities (Stacked Bar Chart) */}
      <div className="dashboard-card shadow-sm">
        <div className="card-header">
          <div className="card-title">
            <BarIcon sx={{ color: '#22c55e' }} />
            Số lượng Đơn hàng
          </div>
        </div>
        <div className="card-body" style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {orderData && orderData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="supplierName" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b' }}
                  interval={0}
                  tickFormatter={(value) => value && value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 500 }} />
                <Bar 
                  dataKey="breakfast" 
                  name="Bữa sáng" 
                  stackId="a" 
                  fill="#f39c12" 
                  barSize={32} 
                />
                <Bar 
                  dataKey="lunch" 
                  name="Bữa trưa" 
                  stackId="a" 
                  fill="#e74c3c" 
                  barSize={32} 
                />
                <Bar 
                  dataKey="dinner" 
                  name="Bữa tối" 
                  stackId="a" 
                  fill="#8e44ad" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chưa có dữ liệu số lượng đơn hàng" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CostAndOrderCharts;
