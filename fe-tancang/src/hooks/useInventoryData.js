import { useState, useEffect, useCallback } from "react";
import { getInventoryList, getCategories } from "../services/vppService";

export const useInventoryData = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    keyword: "",
    category: "all",
    stockStatus: "all",
    page: 1,
    limit: 10,
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      if (res?.success) {
        setCategories(res.data.items || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        keyword: filters.keyword || undefined,
        category: (filters.category && filters.category !== "all") ? filters.category : undefined,
        stockStatus: (filters.stockStatus && filters.stockStatus !== "all") ? filters.stockStatus : undefined,
        page: filters.page,
        limit: filters.limit
      };

      const res = await getInventoryList(apiParams);
      if (res?.success) {
        // Map data về camelCase để UI dùng sạch hơn
        const mappedItems = (res.data.items || []).map(item => ({
          id: item.id,
          productId: item.id, // Dùng ID làm productID nếu API chưa tách
          productName: item.product_name,
          productCode: item.product_code,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          minStock: item.min_stock,
          maxStock: 500, // item.max_stock, Force 500 theo yêu cầu người dùng
          lastInOutDate: item.last_transaction_date,
          lastTransactionType: item.last_transaction_type, // 'RECEIPT' or 'ISSUE'
          lastTransactionQuantity: item.last_transaction_quantity,
          lastTransactionSupplier: item.last_transaction_supplier,
          stockStatus: item.stock_status,
          status: item.status,
        }));

        setData(mappedItems);
        if (res.data.summary) {
          setStats({
            totalItems: res.data.summary.total_items || 0,
            enoughStock: res.data.summary.enough_stock || 0,
            lowStock: res.data.summary.low_stock || 0,
            outOfStock: res.data.summary.out_of_stock || 0,
            totalValue: res.data.summary.total_value || 0
          });
        }
      }
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra khi tải dữ liệu tồn khi.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  return {
    data,
    categories,
    loading,
    error,
    filters,
    stats,
    handleFilterChange,
    refetch: fetchData
  };
};

export default useInventoryData;
