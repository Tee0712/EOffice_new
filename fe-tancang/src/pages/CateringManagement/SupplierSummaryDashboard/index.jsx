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
import { canteenService } from "@services/canteenService";
import SummaryCards from "./components/SummaryCards";
import RankingAndTrend from "./components/RankingAndTrend";
import CostAndOrderCharts from "./components/CostAndOrderCharts";
import CriteriaAndActivities from "./components/CriteriaAndActivities";
import ComparisonTable from "./components/ComparisonTable";
import "./styles.css";

dayjs.extend(quarterOfYear);

const MOCK_SUPPLIER_DASHBOARD = {
  kpis: {
    totalSuppliers: { value: 2, trend: "up", trendValue: 0 },
    monthlyOrders: { value: 128, trend: "down", trendValue: 0.5 },
    mealsProvided: { value: 18450, trend: "down", trendValue: 0.2 },
    totalCost: { value: 461250000, trend: "down", trendValue: 0.4 },
    overallRating: { value: 4.8, trend: "up", trendValue: 0 },
    supplierCount: 2,
    totalMeals: 18450,
    averageRating: 4.8,
  },
  ranking: [
    { id: 1, name: "Nhà bếp Tân Cảng", rating: 4.8, orders: 84, meals: 12500 },
    { id: 2, name: "Công ty CP Suất ăn Cảng Nghĩa Hiệp", rating: 4.5, orders: 44, meals: 5950 },
  ],
  trends: {
    months: ["03/2026", "04/2026", "05/2026", "06/2026", "07/2026", "08/2026"],
    series: [
      { name: "Nhà bếp Tân Cảng", data: [4.6, 4.7, 4.7, 4.8, 4.8, 4.8] },
      { name: "Công ty CP Suất ăn Cảng Nghĩa Hiệp", data: [4.3, 4.4, 4.4, 4.5, 4.5, 4.5] },
    ],
  },
  costDistribution: [
    { name: "Nhà bếp Tân Cảng", value: 312500000 },
    { name: "Công ty CP Suất ăn Cảng Nghĩa Hiệp", value: 148750000 },
  ],
  criteriaAverages: {
    taste: 4.8,
    hygiene: 4.9,
    portion: 4.7,
    diversity: 4.6,
    service: 4.8,
  },
  recentActivities: [
    { id: 1, title: "Cập nhật thực đơn tuần 34", time: "15 phút trước", user: "Bếp trưởng", type: "menu" },
    { id: 2, title: "Hoàn tất đối soát suất ăn tháng 7", time: "2 giờ trước", user: "Kế toán", type: "reconcile" },
    { id: 3, title: "Đánh giá chất lượng bữa ăn ca trưa", time: "4 giờ trước", user: "NV Nguyễn Văn An", type: "review" },
  ],
  alerts: [
    { id: 1, title: "Hợp đồng NCC Cảng Nghĩa Hiệp sắp đáo hạn (còn 20 ngày)", severity: "warning" },
    { id: 2, title: "Tỷ lệ đúng giờ ca trưa hôm nay đạt 100%", severity: "success" },
  ],
  comparisonTable: [
    {
      id: 1,
      name: "Nhà bếp Tân Cảng",
      orders: 84,
      meals: 12500,
      revenue: "312.500.000 VNĐ",
      rating: 4.8,
      quality: 4.8,
      onTime: "99.4%",
      trend: "+2.4%",
      performance: 96,
    },
    {
      id: 2,
      name: "Công ty CP Suất ăn Cảng Nghĩa Hiệp",
      orders: 44,
      meals: 5950,
      revenue: "148.750.000 VNĐ",
      rating: 4.5,
      quality: 4.5,
      onTime: "98.1%",
      trend: "+1.2%",
      performance: 91,
    },
  ],
};

const MOCK_ORDER_CHART_DATA = [
  { name: "Nhà bếp Tân Cảng", breakfast: 2800, lunch: 7500, dinner: 2200 },
  { name: "Công ty CP Suất ăn Cảng Nghĩa Hiệp", breakfast: 1200, lunch: 3600, dinner: 1150 },
];

const SupplierSummaryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [data, setData] = useState(MOCK_SUPPLIER_DASHBOARD);
  const [orderChartData, setOrderChartData] = useState(MOCK_ORDER_CHART_DATA);
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
          setOrderChartData(MOCK_ORDER_CHART_DATA);
        }
      } else {
        setData(MOCK_SUPPLIER_DASHBOARD);
        setOrderChartData(MOCK_ORDER_CHART_DATA);
      }
    } catch (err) {
      console.warn("Using mock supplier dashboard data:", err);
      setData(MOCK_SUPPLIER_DASHBOARD);
      setOrderChartData(MOCK_ORDER_CHART_DATA);
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
