/**
 * Custom hook for My Registrations feature
 * Tách business logic ra khỏi component theo chuẩn LIFETEX ER
 */
import { useState, useCallback, useEffect } from 'react';
import { mealBookingService } from '@services/mealBookingService';

const SESSION_META = {
  1: { name: 'Ăn sáng', timeStart: '06:30', timeEnd: '08:00', color: '#F59E0B' },
  2: { name: 'Ăn trưa', timeStart: '11:00', timeEnd: '13:00', color: '#10B981' },
  3: { name: 'Ăn tối', timeStart: '17:30', timeEnd: '19:00', color: '#8B5CF6' },
};

const STATUS_CONFIG = {
  upcoming: { label: 'Sắp tới', color: 'info' },
  active: { label: 'Đang hoạt động', color: 'success' },
  completed: { label: 'Đã hoàn thành', color: 'default' },
  cancelled: { label: 'Đã hủy', color: 'error' },
  auto_cut: { label: 'Tự động cắt', color: 'warning' },
};

export function useMyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({
    total_registered: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
    total_cost: 0,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    start_date: null,
    end_date: null,
    status: '',
  });

  const fetchRegistrations = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await mealBookingService.getMyRegistrations({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      });
      if (res?.success) {
        setRegistrations(res.data?.items || []);
        setPagination(prev => ({
          ...prev,
          total: res.data?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Fetch registrations error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await mealBookingService.getMyStats(
        filters.start_date,
        filters.end_date
      );
      if (res?.success) {
        setStats(res.data || {});
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [fetchRegistrations, fetchStats]);

  const register = useCallback(async (data) => {
    try {
      const res = await mealBookingService.register(data);
      if (res?.success) {
        fetchRegistrations();
        fetchStats();
        return { success: true, data: res.data };
      }
      return { success: false, message: res?.message || 'Đăng ký thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi đăng ký' };
    }
  }, [fetchRegistrations, fetchStats]);

  const cancelRegistration = useCallback(async (id, reason) => {
    try {
      const res = await mealBookingService.cancelRegistration(id, reason);
      if (res?.success) {
        fetchRegistrations();
        fetchStats();
        return { success: true, refund_amount: res.data?.refund_amount };
      }
      return { success: false, message: res?.message || 'Hủy đăng ký thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi hủy đăng ký' };
    }
  }, [fetchRegistrations, fetchStats]);

  const updateRegistration = useCallback(async (id, data) => {
    try {
      const res = await mealBookingService.updateRegistration(id, data);
      if (res?.success) {
        fetchRegistrations();
        fetchStats();
        return { success: true };
      }
      return { success: false, message: res?.message || 'Cập nhật thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi cập nhật' };
    }
  }, [fetchRegistrations, fetchStats]);

  return {
    registrations,
    stats,
    loading,
    pagination,
    filters,
    setFilters,
    setPagination,
    register,
    cancelRegistration,
    updateRegistration,
    refresh: () => {
      fetchRegistrations();
      fetchStats();
    },
    SESSION_META,
    STATUS_CONFIG,
  };
}

export default useMyRegistrations;
