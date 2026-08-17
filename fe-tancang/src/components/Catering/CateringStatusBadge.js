import React from 'react';
import styled from 'styled-components';

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 18px;
  font-size: 12.5px;
  font-weight: 600;
  
  &.status-registered { background: #e0f2fe; color: #0369a1; }
  &.status-checked { background: #dcfce7; color: #16a34a; }
  &.status-absent { background: #fee2e2; color: #dc2626; }
  &.status-cancelled { background: #f1f5f9; color: #64748b; }
  &.status-auto_cut { background: #fef3c7; color: #d97706; }
`;

const CateringStatusBadge = ({ status, label }) => {
  const getStatusClass = (s) => `status-${s}`;
  
  return (
    <Pill className={getStatusClass(status)}>
      {label || status}
    </Pill>
  );
};

export default CateringStatusBadge;
