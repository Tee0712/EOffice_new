import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 15px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid ${props => props.color || '#cbd5e1'};
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &::after {
    content: '';
    position: absolute;
    right: -18px;
    top: -18px;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    opacity: 0.07;
    background: ${props => props.color || '#cbd5e1'};
  }
`;

const Label = styled.div`
  font-size: 11.5px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.valueColor || '#1e3a8a'};
  line-height: 1;
`;

const SubText = styled.div`
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 5px;
  
  strong {
    color: #64748b;
  }
`;

const ProgressTrack = styled.div`
  background: #f1f5f9;
  border-radius: 5px;
  height: 7px;
  margin-top: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 5px;
  background: #10b981;
  transition: width 0.4s ease;
  width: ${props => props.percent || 0}%;
`;

const CateringStatCard = ({ icon, label, value, subText, color, valueColor, progress }) => {
  return (
    <Card color={color}>
      <Label>{icon} {label}</Label>
      <Value valueColor={valueColor}>{value}</Value>
      {subText && <SubText dangerouslySetInnerHTML={{ __html: subText }} />}
      {progress !== undefined && (
        <ProgressTrack>
          <ProgressFill percent={progress} />
        </ProgressTrack>
      )}
    </Card>
  );
};

export default CateringStatCard;
