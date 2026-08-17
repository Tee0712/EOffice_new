import { useState, useEffect, useCallback, useContext } from 'react';
import { getDistributionQueue } from '../services/vppService';
import { AuthContext } from '../AuthContext/AuthProvider';

export const useDistributionData = (activeTab, keyword, page, limit) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ pending: 0, partial: 0, finished: 0, overdue: 0 });
  const { user } = useContext(AuthContext);

  const fetchDistributionData = useCallback(async () => {
    setLoading(true);
    try {
      // Map activeTab to actual API status
      let apiStatus = '';
      if (activeTab === 'WAITING') apiStatus = 'APPROVED';
      else if (activeTab === 'PARTIAL') apiStatus = 'PARTIAL';
      else if (activeTab === 'COMPLETED') apiStatus = 'FINISHED';

      // Example specific reviewer_id filter matching user context request / Backend capability
      const userId = user?.user?._id || user?.user?.user?._id;

      const params = {
        page,
        limit,
        status: apiStatus,
        keyword: keyword || undefined,
        reviewer_id: userId, 
        is_distribution: 1, // Flag cho api backend biết đang ở màn hình cấp phát
      };

      const res = await getDistributionQueue(params);
      
      const resultData = res?.data?.content || res?.data?.items || res?.content || res?.data || [];
      setData(Array.isArray(resultData) ? resultData : []);
      
      let totalItems = res?.data?.totalElements || res?.data?.total || res?.totalElements || 0;
      
      // Auto-correct backend total if list is smaller than limit on page 1
      if (page === 1 && resultData.length < limit) {
        totalItems = resultData.length;
      }
      setTotal(totalItems);

      // Thống kê đếm tạm / fetch rieng tu API common nếu có (giả lập / update based on actual meta)
      if (res?.data?.summary) {
        setSummary({
          pending:  res.data.summary.approved || res.data.summary.APPROVED || 0,
          partial: res.data.summary.partial || res.data.summary.PARTIAL || 0,
          finished: res.data.summary.finished || res.data.summary.completed || res.data.summary.FINISHED || 0,
          overdue: res.data.summary.overdue || 0
        });
      } else {
         // Fallback and dynamic active tab count
         setSummary(prev => {
           const newSummary = { ...prev };
           if (activeTab === 'WAITING') newSummary.pending = totalItems;
           if (activeTab === 'PARTIAL') newSummary.partial = totalItems;
           if (activeTab === 'COMPLETED') newSummary.finished = totalItems;
           return newSummary;
         });
      }
    } catch (error) {
      console.error('Error fetching distribution data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, keyword, page, limit, user]);

  useEffect(() => {
    fetchDistributionData();
  }, [fetchDistributionData]);

  return { data, loading, total, summary, refresh: fetchDistributionData };
};

export default useDistributionData;
