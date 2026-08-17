import { useState, useEffect, useCallback } from "react";
import { getStationeryList, getCategories } from "../services/stationeryService";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3156/api/v1';

export const useStationeryData = (status, keyword, page = 1, limit = 15) => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quản lý trạng thái bộ lọc
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "all",
    status: "all",
    page: 1,
    limit: 10,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        keyword: filters.search || undefined,
        category: filters.categoryId !== "all" ? filters.categoryId : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        page: filters.page,
        limit: filters.limit
      };

      const listRes = await getStationeryList(apiParams);
      // Hỗ trợ nhiều cấu trúc JSON API trả về
      const resultData = 
          listRes?.data?.content || 
          listRes?.data?.items || 
          listRes?.content || 
          listRes?.items || 
          listRes?.data || 
          (Array.isArray(listRes) ? listRes : []);
          
      setData(Array.isArray(resultData) ? resultData : []);
      
      // Thử bóc tách thông tin thống kê/phân trang nếu API trả về
      const totalItems = listRes?.data?.totalElements || listRes?.data?.total || listRes?.totalElements || listRes?.total || null;
      if (listRes?.data?.stats) {
        setStats(listRes.data.stats);
      } else {
        setStats(totalItems !== null ? { total: totalItems } : null);
      }
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hàm update nhanh Param để tự động re-fetch
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  return {
    data,
    loading,
    error,
    filters,
    stats,
    handleFilterChange,
    refetch: fetchData
  };
};

export default useStationeryData;
