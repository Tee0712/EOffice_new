import React from 'react';
import {
  AssignmentInd,
  NotificationsActive,
  TrendingUp,
  Schedule,
  CheckCircle,
  ErrorOutline,
  ChevronRight,
} from '@mui/icons-material';
import { Button, Box } from '@mui/material';

const CriteriaAndActivities = ({
  criteria,
  activities,
  alerts,
  onAlertAction,
  onViewAllActivities,
  onActivityClick,
}) => {
  if (!criteria || !activities || !alerts) return null;

  return (
    <div className="dashboard-row">
      <div className="dashboard-card shadow-sm">
        <div className="card-header">
          <div className="card-title">
            <AssignmentInd sx={{ color: '#8b5cf6' }} />
            Điểm TB theo tiêu chí
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {criteria.map((item) => (
              <div key={item.code}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.name}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.value.toFixed(1)} / 5</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(item.value / 5) * 100}%`,
                      height: '100%',
                      backgroundColor:
                        item.value >= 4.5 ? '#22c55e' : item.value >= 4 ? '#3b82f6' : '#f59e0b',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Box mt={5} mb={2}>
            <div className="card-title" style={{ paddingBottom: '16px' }}>
              <NotificationsActive sx={{ color: 'var(--warning)' }} />
              Cảnh báo & Nhắc nhở
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor:
                      alert.type === 'error'
                        ? '#fef2f2'
                        : alert.type === 'warning'
                        ? '#fffbeb'
                        : '#f0f9ff',
                    border: `1px solid ${
                      alert.type === 'error'
                        ? '#fee2e2'
                        : alert.type === 'warning'
                        ? '#fef3c7'
                        : '#e0f2fe'
                    }`,
                  }}
                >
                  <div
                    style={{
                      color:
                        alert.type === 'error'
                          ? 'var(--error)'
                          : alert.type === 'warning'
                          ? 'var(--warning)'
                          : 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {alert.type === 'error' ? <ErrorOutline /> : <NotificationsActive />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{alert.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{alert.description}</div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => onAlertAction?.(alert)}
                    sx={{
                      minWidth: 'auto',
                      textTransform: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                    }}
                  >
                    {alert.actionLabel || 'Chi tiết'}
                  </Button>
                </div>
              ))}
            </div>
          </Box>
        </div>
      </div>

      <div className="dashboard-card shadow-sm">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp sx={{ color: 'var(--success)' }} />
            Hoạt động Gần đây
          </div>
          <Button
            size="small"
            onClick={onViewAllActivities}
            sx={{ textTransform: 'none', color: 'var(--text-secondary)' }}
          >
            Xem tất cả
          </Button>
        </div>
        <div className="card-body">
          <div className="activity-timeline" style={{ paddingLeft: '10px' }}>
            {activities.map((act, i) => (
              <div
                key={act.id}
                onClick={() => onActivityClick?.(act)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onActivityClick?.(act);
                  }
                }}
                style={{
                  display: 'flex',
                  gap: '20px',
                  position: 'relative',
                  marginBottom: '24px',
                  cursor: onActivityClick ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor:
                      act.type === 'success' ? '#dcfce7' : act.type === 'alert' ? '#fef2f2' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    color: act.type === 'success' ? '#16a34a' : act.type === 'alert' ? '#dc2626' : '#2563eb',
                  }}
                >
                  {act.type === 'success' ? (
                    <CheckCircle sx={{ fontSize: 18 }} />
                  ) : act.type === 'alert' ? (
                    <ErrorOutline sx={{ fontSize: 18 }} />
                  ) : (
                    <Schedule sx={{ fontSize: 18 }} />
                  )}
                </div>
                {i < activities.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '15px',
                      top: '32px',
                      bottom: '-24px',
                      width: '2px',
                      backgroundColor: '#e2e8f0',
                      zIndex: 1,
                    }}
                  ></div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{act.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{act.timeLabel}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{act.description}</div>
                </div>
                <ChevronRight sx={{ color: '#cbd5e1', fontSize: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaAndActivities;
