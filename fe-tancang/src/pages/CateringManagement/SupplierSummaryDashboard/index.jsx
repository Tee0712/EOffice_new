import React, { useState, useEffect, useCallback } from "react";
import {
  FileDownload,
  Refresh,
  Search,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { canteenService } from "../../../services/canteenService";
import SummaryCards from "./components/SummaryCards";
import RankingAndTrend from "./components/RankingAndTrend";
import CostAndOrderCharts from "./components/CostAndOrderCharts";
import CriteriaAndActivities from "./components/CriteriaAndActivities";
import ComparisonTable from "./components/ComparisonTable";
import "./styles.css";

dayjs.extend(quarterOfYear);

const SupplierSummaryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [orderChartData, setOrderChartData] = useState([]);
  const [highlightedSupplierId, setHighlightedSupplierId] = useState(null);

  const [filters, setFilters] = useState({
    period: "CUSTOM",
    startDate: "2025-01-01", // Mở rộng thời gian mặc định để hiển thị đủ dữ liệu từ năm 2025
    endDate: dayjs().format("YYYY-MM-DD"),
    supplierId: "",
    contractType: "",
  });

  const calculateDates = (period) => {
    const now = dayjs();
    switch (period) {
      case "THIS_MONTH":
        return {
          start: now.startOf("month").format("YYYY-MM-DD"),
          end: now.format("YYYY-MM-DD"),
        };
      case "THIS_QUARTER":
        return {
          start: now.startOf("quarter").format("YYYY-MM-DD"),
          end: now.format("YYYY-MM-DD"),
        };
      case "THIS_YEAR":
        return {
          start: now.startOf("year").format("YYYY-MM-DD"),
          end: now.format("YYYY-MM-DD"),
        };
      default:
        return null;
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        supplierId: filters.supplierId,
        contractType: filters.contractType,
      };
      const res = await canteenService.getSupplierDashboardSummary(params);
      if (res.success) {
        setData(res.data);

        // --- Fetch real data for Order Quantity Chart using specific API ---
        let targetSupplierIds = [];
        if (params.supplierId) {
          targetSupplierIds = [params.supplierId];
        } else {
          // Lấy tất cả các ID của nhà cung cấp để vẽ biểu đồ cho đầy đủ
          targetSupplierIds = (res.data.ranking || []).map((r) => r.id);
        }

        try {
            const ordersPromises = targetSupplierIds.map(async (id) => {
              const orderRes = await canteenService.getSupplierOrders(id, {
                limit: 10000,
                startDate: params.startDate,
                endDate: params.endDate,
              });
              return { id, items: orderRes.data?.items || [] };
            });

          const ordersDataArray = await Promise.all(ordersPromises);

          const aggregatedOrderData = ordersDataArray.map((supplierOrders) => {
            const supplierInfo = (res.data.ranking || []).find(
              (r) => String(r.id) === String(supplierOrders.id)
            );
            const sName = supplierInfo
              ? supplierInfo.name
              : `Nhà cung cấp ${supplierOrders.id}`;

            let breakfastCount = 0;
            let lunchCount = 0;
            let dinnerCount = 0;

            const startDateObj = params.startDate
              ? dayjs(params.startDate).startOf("day")
              : null;
            const endDateObj = params.endDate
              ? dayjs(params.endDate).endOf("day")
              : null;

            supplierOrders.items.forEach((item) => {
              let isValidDate = true;
              if (startDateObj && endDateObj && item.order_date) {
                const itemDate = dayjs(item.order_date);
                isValidDate =
                  (itemDate.isSame(startDateObj, "day") ||
                    itemDate.isAfter(startDateObj)) &&
                  (itemDate.isSame(endDateObj, "day") ||
                    itemDate.isBefore(endDateObj));
              }

              if (isValidDate) {
                const count =
                  Number(item.delivered_qty) || Number(item.expected_qty) || 0;
                if (item.meal_slot === "breakfast") breakfastCount += count;
                else if (item.meal_slot === "lunch") lunchCount += count;
                else if (item.meal_slot === "dinner") dinnerCount += count;
              }
            });

            return {
              supplierName: sName,
              breakfast: breakfastCount,
              lunch: lunchCount,
              dinner: dinnerCount,
            };
          });

          // Luôn luôn hiển thị biểu đồ thật (kể cả khi các cột bằng 0) để người dùng thấy rõ các nhà cung cấp
          setOrderChartData(aggregatedOrderData);
        } catch (apiError) {
          console.error("Lỗi tải API getSupplierOrders:", apiError);
          setOrderChartData([]);
        }
      } else {
        throw new Error(res.message || "Lỗi tải dữ liệu");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "period") {
      const dates = calculateDates(value);
      if (dates) {
        setFilters((prev) => ({
          ...prev,
          period: value,
          startDate: dates.start,
          endDate: dates.end,
        }));
      } else {
        setFilters((prev) => ({ ...prev, period: value }));
      }
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleExportReport = () => {
    if (!data) return;

    // Sheet 1: Tổng quan KPI
    const kpiData = [
      {
        "Tổng số NCC": data.kpis?.totalSuppliers?.value || 0,
        "Đơn hàng tháng": data.kpis?.monthlyOrders?.value || 0,
        "Suất ăn cung cấp": data.kpis?.mealsProvided?.value || 0,
        "Tổng chi phí (VNĐ)": data.kpis?.totalCost?.value || 0,
        "Điểm TB chung": data.kpis?.overallRating?.value || 0,
      },
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);

    // Sheet 2: Chi tiết NCC
    const nccData = (data.comparisonTable || []).map((item) => ({
      "Nhà cung cấp": item.name,
      "Số đơn hàng": item.orderCount || 0,
      "Số suất ăn": item.mealCount || 0,
      "Doanh số (VNĐ)": item.revenue || 0,
      "Điểm đánh giá": item.rating || 0,
      "Chất lượng": item.qualityRating || 0,
      "Đúng giờ": item.ontimeRating || 0,
      "Xu hướng (%)": (item.trendValue || 0) + "%",
      "Hiệu suất (%)":
        (item.performance || Math.round(((item.rating || 0) / 5) * 100)) + "%",
    }));
    const wsNcc = XLSX.utils.json_to_sheet(nccData);

    // Sheet 3: Phân bổ chi phí
    const costData = (data.costDistribution || []).map((item) => ({
      "Nhà cung cấp": item.name,
      "Chi phí (VNĐ)": item.value || 0,
    }));
    const wsCost = XLSX.utils.json_to_sheet(costData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsKpi, "Tong_quan_KPI");
    XLSX.utils.book_append_sheet(wb, wsNcc, "Chi_tiet_NCC");
    if (costData.length > 0)
      XLSX.utils.book_append_sheet(wb, wsCost, "Phan_bo_chi_phi");

    const autoSizeCols = (ws, dataset) => {
      if (!dataset || dataset.length === 0) return;
      const maxWidths = Object.keys(dataset[0]).map((key) => {
        const headerLen = key.length;
        const dataLen = dataset.reduce(
          (max, obj) => Math.max(max, String(obj[key] || "").length),
          0
        );
        return { wch: Math.max(headerLen, dataLen) + 5 };
      });
      ws["!cols"] = maxWidths;
    };

    autoSizeCols(wsKpi, kpiData);
    autoSizeCols(wsNcc, nccData);
    autoSizeCols(wsCost, costData);

    XLSX.writeFile(
      wb,
      `Bao_cao_tong_quan_NCC_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`
    );
  };

  const handleAlertAction = useCallback(
    (alert) => {
      const supplierDetailId = Number(alert?.supplierId || alert?.id);
      if (Number.isFinite(supplierDetailId) && supplierDetailId > 0) {
        navigate(`/catering/supplier-detail/${supplierDetailId}`);
        return;
      }
      navigate("/catering/suppliers");
    },
    [navigate]
  );

  const handleViewAllActivities = useCallback(() => {
    navigate("/catering/supplier-evaluation");
  }, [navigate]);

  const handleActivityClick = useCallback(
    (activity) => {
      const supplierDetailId = Number(activity?.supplierId);
      if (Number.isFinite(supplierDetailId) && supplierDetailId > 0) {
        navigate(`/catering/supplier-detail/${supplierDetailId}`);
      }
    },
    [navigate]
  );

  const renderSkeleton = () => (
    <Box sx={{ width: "100%" }}>
      <Box className="kpi-grid">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={120}
            sx={{ borderRadius: "16px" }}
          />
        ))}
      </Box>
      <Box className="dashboard-row">
        <Skeleton
          variant="rounded"
          height={400}
          sx={{ borderRadius: "16px" }}
        />
        <Skeleton
          variant="rounded"
          height={400}
          sx={{ borderRadius: "16px" }}
        />
      </Box>
    </Box>
  );

  return (
    <div className="dashboard-container">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">
          Trang chủ
        </Link>
        <Link underline="hover" color="inherit" href="/catering">
          Quản lý Ăn ca
        </Link>
        <Typography color="text.primary">Dashboard Nhà cung cấp</Typography>
      </Breadcrumbs>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Box display="flex" alignItems="center" gap={1.5}>
            <DashboardIcon sx={{ color: "var(--primary)", fontSize: 32 }} />
            <h1>Dashboard Nhà cung cấp</h1>
          </Box>
          <p>Tổng quan hiệu suất và so sánh các nhà cung cấp dịch vụ ăn ca</p>
        </div>
        <div className="header-actions">
          <Button
            className="btn-outline"
            startIcon={<FileDownload />}
            variant="outlined"
            onClick={handleExportReport}
          >
            Xuất báo cáo
          </Button>
          <Button
            className="btn-primary"
            startIcon={<Refresh />}
            onClick={fetchData}
            variant="contained"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Thời gian</label>
          <TextField
            select
            size="small"
            name="period"
            value={filters.period}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <MenuItem value="THIS_MONTH">Tháng này</MenuItem>
            <MenuItem value="THIS_QUARTER">Quý này</MenuItem>
            <MenuItem value="THIS_YEAR">Năm này</MenuItem>
            <MenuItem value="CUSTOM">Tùy chọn</MenuItem>
          </TextField>
        </div>

        {filters.period === "CUSTOM" && (
          <>
            <div className="filter-item">
              <label>Từ ngày</label>
              <TextField
                type="date"
                size="small"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Đến ngày</label>
              <TextField
                type="date"
                size="small"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </>
        )}

        <div className="filter-item" style={{ flex: 1.5 }}>
          <label>Nhà cung cấp</label>
          <TextField
            select
            size="small"
            name="supplierId"
            value={filters.supplierId}
            onChange={handleFilterChange}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Tất cả nhà cung cấp</MenuItem>
            {data?.ranking?.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className="filter-item">
          <label>Loại hợp đồng</label>
          <TextField
            select
            size="small"
            name="contractType"
            value={filters.contractType}
            onChange={handleFilterChange}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="SERVICE">Dịch vụ</MenuItem>
            <MenuItem value="RAW">Thực phẩm</MenuItem>
          </TextField>
        </div>

        <Button
          className="btn-primary"
          onClick={fetchData}
          startIcon={<Search />}
          sx={{ height: 40, minWidth: 100 }}
        >
          Lọc
        </Button>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        renderSkeleton()
      ) : (
        <>
          {/* KPI Cards */}
          <SummaryCards data={data?.kpis} />

          {/* Ranking & Trend */}
          <RankingAndTrend
            ranking={data?.ranking}
            trends={data?.trends}
            activeId={highlightedSupplierId}
            onActiveChange={setHighlightedSupplierId}
          />

          {/* Cost Distribution & Order Qty */}
          <CostAndOrderCharts
            costData={data?.costDistribution}
            orderData={orderChartData}
          />

          {/* Criteria & Activities */}
          <CriteriaAndActivities
            criteria={data?.criteriaAverages}
            activities={data?.recentActivities}
            alerts={data?.alerts}
            onAlertAction={handleAlertAction}
            onViewAllActivities={handleViewAllActivities}
            onActivityClick={handleActivityClick}
          />

          {/* Detailed Table */}
          <div className="table-container">
            <ComparisonTable data={data?.comparisonTable} />
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierSummaryDashboard;
