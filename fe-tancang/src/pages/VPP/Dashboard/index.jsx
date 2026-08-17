import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import * as XLSX from "xlsx";

// Material Icons
import DownloadIcon from "@mui/icons-material/Download";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import ListAltIcon from "@mui/icons-material/ListAlt";

import { dashboardService } from "../../../services/vppDashboardService";
import "./Dashboard.css";

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  if (numeric >= 1000000) {
    return (numeric / 1000000).toFixed(1) + "tr";
  }
  return numeric.toLocaleString("vi-VN");
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const resolveUnit = (entry) => {
      if (["capPhat", "muaSam", "nganSach"].includes(entry?.dataKey))
        return "tr";
      if (
        entry?.dataKey === "cost" ||
        entry?.name?.includes("Ngân sách") ||
        entry?.name?.includes("Mua sắm")
      )
        return "đ";
      return "";
    };
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            style={{ color: entry.color, margin: "2px 0" }}
          >
            {entry.name}: {entry.value?.toLocaleString("vi-VN")}{" "}
            {resolveUnit(entry)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const mapDashboardDataToKpi = (dashboardData = {}) => ({
  total_cost: dashboardData?.kpis?.cost?.value || 0,
  cost_variation: dashboardData?.kpis?.cost?.growthPercent || 0,
  budget_value: dashboardData?.kpis?.cost?.budgetValue || 0,
  previous_cost: dashboardData?.kpis?.cost?.previousValue || 0,
  pending_requests: dashboardData?.kpis?.requests?.total || 0,
  issued_requests: dashboardData?.kpis?.requests?.issued || 0,
  request_waiting: dashboardData?.kpis?.requests?.pending || 0,
  request_variation: dashboardData?.kpis?.requests?.growthPercent || 0,
  low_stock_items: dashboardData?.kpis?.lowStock?.total || 0,
  almost_out_of_stock: dashboardData?.kpis?.lowStock?.almostOut || 0,
  out_of_stock: dashboardData?.kpis?.lowStock?.outOfStock || 0,
  total_inventory_items: dashboardData?.kpis?.inventory?.totalQuantity || 0,
  inventory_item_count: dashboardData?.kpis?.inventory?.totalItems || 0,
  inventory_groups: dashboardData?.kpis?.inventory?.totalCategories || 0,
  inventory_variation: dashboardData?.kpis?.inventory?.growthPercent || 0,
  overdue_issues: dashboardData?.kpis?.overdue?.total || 0,
  avg_processing_days: dashboardData?.kpis?.overdue?.avgProcessingDays || 0,
});

const mapKpiOverviewToState = (overview = {}) => ({
  total_cost: overview?.total_cost || 0,
  cost_variation: overview?.cost_variation || 0,
  budget_value: overview?.budget_value || 0,
  previous_cost: overview?.previous_cost || 0,
  pending_requests: overview?.pending_requests || 0,
  issued_requests: overview?.issued_requests || 0,
  request_waiting: overview?.request_waiting || 0,
  request_variation: overview?.request_variation || 0,
  low_stock_items: overview?.low_stock_items || 0,
  almost_out_of_stock: overview?.almost_out_of_stock || 0,
  out_of_stock: overview?.out_of_stock || 0,
  total_inventory_items: overview?.total_inventory_items || 0,
  inventory_item_count: overview?.inventory_item_count || 0,
  inventory_groups: overview?.inventory_groups || 0,
  inventory_variation: overview?.inventory_variation || 0,
  overdue_issues: overview?.overdue_issues || 0,
  avg_processing_days: overview?.avg_processing_days || 0,
});

const Dashboard = () => {
  const [period, setPeriod] = useState("Tháng");
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const requestRef = useRef(0);

  // Data State
  const [kpi, setKpi] = useState(null);
  const [costChart, setCostChart] = useState([]);
  const [costByDept, setCostByDept] = useState([]);
  const [costByCategory, setCostByCategory] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [actualVsQuota, setActualVsQuota] = useState([]);
  const periodSubtitle =
    period === "Tuần"
      ? "Tuần hiện tại"
      : period === "Quý"
        ? "Quý hiện tại"
        : period === "Năm"
          ? "Năm hiện tại"
          : "Tháng hiện tại";
  const totalCategoryCost = (costByCategory || []).reduce(
    (sum, item) => sum + (Number(item?.value) || 0),
    0
  );

  useEffect(() => {
    let isActive = true;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const fetchData = async () => {
      setLoading(true);
      setLoadingSections(true);
      let kpiLoaded = false;

      try {
        const kpiOverview = await dashboardService.getKpiOverview(period);
        if (!isActive || requestRef.current !== requestId) return;

        setKpi(mapKpiOverviewToState(kpiOverview));
        kpiLoaded = true;
        setLoading(false);

        const dashboardData = await dashboardService.getDashboardData(period);
        if (!isActive || requestRef.current !== requestId) return;

        const nextCostChart = (dashboardData?.monthlyCost || []).map(
          (item) => ({
            period: item.period,
            capPhat: Number(
              (Number(item.distribution || 0) / 1000000).toFixed(1)
            ),
            muaSam: Number((Number(item.extra || 0) / 1000000).toFixed(1)),
            nganSach: Number((Number(item.budget || 0) / 1000000).toFixed(1)),
          })
        );
        const nextCostByDept = (dashboardData?.costByDepartment || []).map(
          (item) => ({
            department: item.department,
            cost: item.value,
            color: item.color,
          })
        );
        const nextCostByCategory = (dashboardData?.costByCategory || []).map(
          (item) => ({
            name: item.name,
            value: item.value,
            percent: item.percent,
            color: item.color,
          })
        );
        const nextTopItems = (dashboardData?.topItems || []).map((item) => ({
          id: item.code,
          name: item.name,
          code: item.code,
          qty: item.quantity,
          unit: item.unit,
          total: item.value,
          type: item.type,
        }));
        const nextAlerts = dashboardData?.alerts || [];
        const nextRecentRequests = dashboardData?.recentRequests || [];
        const nextActualVsQuota = (dashboardData?.usageVsQuota || []).map(
          (item) => ({
            dept: item.department,
            actual: item.actual,
            quota: item.quota,
          })
        );

        setKpi(mapDashboardDataToKpi(dashboardData));
        setCostChart(nextCostChart);
        setCostByDept(nextCostByDept);
        setCostByCategory(nextCostByCategory);
        setTopItems(nextTopItems);
        setAlerts(nextAlerts);
        setRecentRequests(nextRecentRequests);
        setActualVsQuota(nextActualVsQuota);
      } catch (error) {
        if (!isActive || requestRef.current !== requestId) return;
        console.error("Error fetching dashboard data:", error);
        if (!kpiLoaded) {
          setKpi(null);
          setCostChart([]);
          setCostByDept([]);
          setCostByCategory([]);
          setTopItems([]);
          setAlerts([]);
          setRecentRequests([]);
          setActualVsQuota([]);
        }
      } finally {
        if (isActive && requestRef.current === requestId) {
          setLoading(false);
          setLoadingSections(false);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, [period]);

  const exportToExcel = () => {
    const nowLabel = new Date().toLocaleString("vi-VN");
    const safeKpi = {
      total_cost: Number(kpi?.total_cost) || 0,
      cost_variation: Number(kpi?.cost_variation) || 0,
      budget_value: Number(kpi?.budget_value) || 0,
      previous_cost: Number(kpi?.previous_cost) || 0,
      pending_requests: Number(kpi?.pending_requests) || 0,
      issued_requests: Number(kpi?.issued_requests) || 0,
      request_waiting: Number(kpi?.request_waiting) || 0,
      request_variation: Number(kpi?.request_variation) || 0,
      low_stock_items: Number(kpi?.low_stock_items) || 0,
      almost_out_of_stock: Number(kpi?.almost_out_of_stock) || 0,
      out_of_stock: Number(kpi?.out_of_stock) || 0,
      total_inventory_items: Number(kpi?.total_inventory_items) || 0,
      inventory_item_count: Number(kpi?.inventory_item_count) || 0,
      inventory_groups: Number(kpi?.inventory_groups) || 0,
      overdue_issues: Number(kpi?.overdue_issues) || 0,
      avg_processing_days: Number(kpi?.avg_processing_days) || 0,
    };

    const createSheetFromRows = (title, headers, rows = []) => {
      const wsData = [
        ["BAO CAO DASHBOARD VAN PHONG PHAM"],
        ["Noi dung", title],
        ["Ky bao cao", period],
        ["Ngay xuat", nowLabel],
        [],
        headers,
        ...rows,
      ];
      return XLSX.utils.aoa_to_sheet(wsData);
    };

    const wsKpi = createSheetFromRows(
      "Tong quan KPI",
      ["Chi so", "Gia tri"],
      [
        ["Tong chi phi VPP", safeKpi.total_cost],
        ["% bien dong chi phi", safeKpi.cost_variation],
        ["Ngan sach", safeKpi.budget_value],
        ["Chi phi ky truoc", safeKpi.previous_cost],
        ["Tong phieu de nghi", safeKpi.pending_requests],
        ["So phieu da cap", safeKpi.issued_requests],
        ["So phieu cho duyet", safeKpi.request_waiting],
        ["% bien dong phieu", safeKpi.request_variation],
        ["Tong mat hang ton thap", safeKpi.low_stock_items],
        ["Sap het", safeKpi.almost_out_of_stock],
        ["Da het", safeKpi.out_of_stock],
        ["Tong ton kho (don vi)", safeKpi.total_inventory_items],
        ["So mat hang", safeKpi.inventory_item_count],
        ["So nhom hang", safeKpi.inventory_groups],
        ["Phieu qua han cap phat", safeKpi.overdue_issues],
        ["Trung binh xu ly (ngay)", safeKpi.avg_processing_days],
      ]
    );

    const wsMonthlyCost = createSheetFromRows(
      "Chi phi VPP theo thang",
      ["Ky", "Cap phat (trieu)", "Mua sam bo sung (trieu)", "Ngan sach (trieu)"],
      (costChart || []).map((row) => [
        row.period || "",
        Number(row.capPhat) || 0,
        Number(row.muaSam) || 0,
        Number(row.nganSach) || 0,
      ])
    );

    const wsByDepartment = createSheetFromRows(
      "Chi phi theo phong ban",
      ["Phong ban", "Chi phi (VND)"],
      (costByDept || []).map((row) => [
        row.department || "",
        Number(row.cost) || 0,
      ])
    );

    const wsByCategory = createSheetFromRows(
      "Ty trong chi phi theo nhom hang",
      ["Nhom hang", "Gia tri (trieu VND)", "Ty trong (%)"],
      (costByCategory || []).map((row) => [
        row.name || "",
        Number(row.value) || 0,
        Number(row.percent) || 0,
      ])
    );

    const wsTopItems = createSheetFromRows(
      "Top mat hang tieu thu",
      ["Ma", "Ten mat hang", "So luong", "DVT", "Tong gia tri (VND)", "Loai"],
      (topItems || []).map((row) => [
        row.code || "",
        row.name || "",
        Number(row.qty) || 0,
        row.unit || "",
        Number(row.total) || 0,
        row.type || "",
      ])
    );

    const wsAlerts = createSheetFromRows(
      "Canh bao va hanh dong",
      ["Noi dung", "Trang thai"],
      (alerts || []).map((row) => [row.text || "", row.status || ""])
    );

    const wsQuota = createSheetFromRows(
      "Su dung thuc te vs dinh muc",
      ["Phong ban", "Su dung thuc te", "Dinh muc"],
      (actualVsQuota || []).map((row) => [
        row.dept || "",
        Number(row.actual) || 0,
        Number(row.quota) || 0,
      ])
    );

    const wsRecentRequests = createSheetFromRows(
      "Phieu gan day",
      ["Ma phieu", "Nguoi de nghi", "Phong ban", "Trang thai", "Thoi gian"],
      (recentRequests || []).map((row) => [
        row.code || "",
        row.requester || "",
        row.department || "",
        row.status || "",
        row.time || "",
      ])
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsKpi, "Tong quan KPI");
    XLSX.utils.book_append_sheet(wb, wsMonthlyCost, "Chi phi theo thang");
    XLSX.utils.book_append_sheet(wb, wsByDepartment, "Theo phong ban");
    XLSX.utils.book_append_sheet(wb, wsByCategory, "Theo nhom hang");
    XLSX.utils.book_append_sheet(wb, wsTopItems, "Top tieu thu");
    XLSX.utils.book_append_sheet(wb, wsAlerts, "Canh bao");
    XLSX.utils.book_append_sheet(wb, wsQuota, "Thuc te vs dinh muc");
    XLSX.utils.book_append_sheet(wb, wsRecentRequests, "Phieu gan day");

    XLSX.writeFile(
      wb,
      `BaoCao_Dashboard_VPP_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (loading && !kpi) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="vpp-dashboard-container">
      {/* Header Area */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <h1 className="dashboard-title">Dashboard Văn phòng phẩm</h1>
          <div className="live-badge">Cập nhật trực tiếp</div>
        </div>
        <div className="dashboard-actions">
          <div className="period-filter">
            {["Tuần", "Tháng", "Quý", "Năm"].map((p) => (
              <button
                key={p}
                className={`period-btn ${period === p ? "active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="export-btn" onClick={exportToExcel}>
            <DownloadIcon fontSize="small" /> Xuất báo cáo
          </button>
        </div>
      </div>
      {loadingSections && (
        <div style={{ marginBottom: 8, color: "#6b7280", fontSize: 13 }}>
          Dang tai bieu do va danh sach...
        </div>
      )}

      {/* 5 Stat Cards */}
      <div className="stat-cards-grid">
        {/* Card 1 */}
        <div className="stat-card blue">
          <div className="stat-header">
            <div className="stat-icon">
              <AccountBalanceWalletOutlinedIcon />
            </div>
            <div className="stat-variation positive">
              ↑ {kpi?.cost_variation}%
            </div>
          </div>
          <h3 className="stat-value">
            {formatCurrency(kpi?.total_cost)} <span>₫</span>
          </h3>
          <p className="stat-title">
            Chi phí VPP tháng {new Date().getMonth() + 1}
          </p>
          <div className="stat-footer">
            <span>
              Tháng trước: <strong>{formatCurrency(kpi?.previous_cost)}</strong>
            </span>
            <span>
              · Ngân sách: <strong>{formatCurrency(kpi?.budget_value)}</strong>
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="stat-card green">
          <div className="stat-header">
            <div className="stat-icon">
              <ReceiptLongOutlinedIcon />
            </div>
            <div className="stat-variation positive">
              ↑ {kpi?.request_variation}%
            </div>
          </div>
          <h3 className="stat-value">{kpi?.pending_requests}</h3>
          <p className="stat-title">Phiếu đề nghị</p>
          <div className="stat-footer">
            <span>
              Đã cấp: <strong>{kpi?.issued_requests}</strong>
            </span>
            <span>
              · Chờ duyệt: <strong>{kpi?.request_waiting}</strong>
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="stat-card orange">
          <div className="stat-header">
            <div className="stat-icon">
              <WarningAmberOutlinedIcon />
            </div>
          </div>
          <h3 className="stat-value">{kpi?.low_stock_items}</h3>
          <p className="stat-title">Mặt hàng tồn thấp</p>
          <div className="stat-footer">
            <span>
              Sắp hết: <strong>{kpi?.almost_out_of_stock}</strong>
            </span>
            <span>
              · Đã hết: <strong>{kpi?.out_of_stock}</strong>
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="stat-card purple">
          <div className="stat-header">
            <div className="stat-icon">
              <Inventory2OutlinedIcon />
            </div>
            <div className="stat-variation neutral">→ 0%</div>
          </div>
          <h3 className="stat-value">
            {kpi?.total_inventory_items?.toLocaleString("vi-VN")}
          </h3>
          <p className="stat-title">Tổng tồn kho (đơn vị)</p>
          <div className="stat-footer">
            <span>
              {(kpi?.inventory_item_count || 0).toLocaleString("vi-VN")} mặt
              hàng
            </span>
            <span>· {kpi?.inventory_groups} nhóm</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="stat-card red">
          <div className="stat-header">
            <div className="stat-icon">
              <AccessTimeOutlinedIcon />
            </div>
          </div>
          <h3 className="stat-value" style={{ color: "#DC2626" }}>
            {kpi?.overdue_issues}
          </h3>
          <p className="stat-title">Phiếu quá hạn cấp phát</p>
          <div className="stat-footer">
            <span>
              Trung bình xử lý: <strong>{kpi?.avg_processing_days} ngày</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="charts-grid-main">
        {/* Cost Chart */}
        <div className="card" style={{ gridColumn: "1 / span 2" }}>
          <div className="card-header">
            <h2 className="card-title">
              <InsertChartOutlinedIcon className="card-title-icon" /> Chi phí
              VPP theo tháng (triệu ₫)
            </h2>
            <span className="card-subtitle">{periodSubtitle}</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={costChart}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value} tr`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="square" align="left" verticalAlign="bottom" />
                <Bar
                  dataKey="capPhat"
                  name="Cấp phát"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="muaSam"
                  name="Mua sắm bổ sung"
                  fill="#93C5FD"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="nganSach"
                  name="Ngân sách"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid-secondary">
        {/* Cost by Dept */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <PeopleAltOutlinedIcon className="card-title-icon" /> Chi phí VPP
              theo phòng ban
            </h2>
            <span className="card-subtitle">{periodSubtitle}</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costByDept}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="department"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={20}>
                  {costByDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by Category */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <PieChartOutlineIcon className="card-title-icon" /> Tỷ trọng chi
              phí theo nhóm hàng
            </h2>
          </div>
          <div
            className="chart-container"
            style={{ display: "flex", alignItems: "center" }}
          >
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={costByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label
                    value={totalCategoryCost.toLocaleString("vi-VN", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    position="centerBottom"
                    className="donut-label-value"
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      fill: "#111827",
                    }}
                  />
                  <Label
                    value="triệu ₫"
                    position="centerTop"
                    className="donut-label-unit"
                    style={{ fontSize: 12, fill: "#6B7280" }}
                  />
                </Pie>
                <RechartsTooltip formatter={(value) => `${value} tr`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: "50%", paddingLeft: 20 }}>
              {costByCategory.map((cat, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: cat.color,
                      }}
                    ></div>
                    <span style={{ fontSize: 14, color: "#374151" }}>
                      {cat.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {cat.value} tr
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid-secondary">
        {/* Top Items List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <StarBorderIcon className="card-title-icon" /> Top mặt hàng tiêu
              thụ
            </h2>
            <span className="card-subtitle">{periodSubtitle}</span>
          </div>
          <div className="top-items-list">
            {topItems.map((item, idx) => (
              <div key={item.id} className="top-item">
                <div className={`item-rank top-${idx + 1}`}>{idx + 1}</div>
                <div className="item-icon">
                  {item.type === "paper"
                    ? "📄"
                    : item.type === "pen"
                      ? "🖊️"
                      : item.type === "ink"
                        ? "🖨️"
                        : item.type === "folder"
                          ? "📁"
                          : "📎"}
                </div>
                <div className="item-info">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-code">{item.code}</p>
                </div>
                <div className="item-stats">
                  <div className="item-qty">
                    {item.qty} {item.unit}
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.total)} ₫
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <NotificationsActiveOutlinedIcon className="card-title-icon" />{" "}
              Cảnh báo & Hành động
            </h2>
            <span
              className="live-badge"
              style={{
                color: "#EF4444",
                backgroundColor: "#FEF2F2",
                padding: "2px 8px",
              }}
            >
              {alerts.length}
            </span>
          </div>
          <div className="alerts-list">
            {alerts.map((alert) => {
              const alertText =
                typeof alert?.text === "string" ? alert.text : "";
              const alertStatus =
                typeof alert?.status === "string" ? alert.status : "";
              const statusLower = alertStatus.toLowerCase();
              const colorClass =
                statusLower.includes("hết kho") ||
                statusLower.includes("quá hạn")
                  ? "red"
                  : statusLower.includes("sắp hết") ||
                      statusLower.includes("chờ duyệt")
                    ? "orange"
                    : statusLower.includes("chờ cấp")
                      ? "blue"
                      : "purple";
              const numberMatch = alertText.match(/\d+/);
              const alertLimit = numberMatch ? Number(numberMatch[0]) : 0;
              const textWithoutNumber = alertText
                .replace(/^\s*\d+\s*/, "")
                .trim();

              return (
                <div
                  key={alert?.id || `${alertText}-${alertLimit}`}
                  className={`alert-item ${colorClass}`}
                >
                  <div className="alert-icon">
                    {colorClass === "red" ? (
                      <WarningAmberOutlinedIcon style={{ color: "#EF4444" }} />
                    ) : colorClass === "orange" ? (
                      <Inventory2OutlinedIcon style={{ color: "#F59E0B" }} />
                    ) : colorClass === "blue" ? (
                      <ListAltIcon style={{ color: "#3B82F6" }} />
                    ) : (
                      <TimelineIcon style={{ color: "#8B5CF6" }} />
                    )}
                  </div>
                  <div className="alert-content">
                    <strong>{alertLimit} </strong>
                    {textWithoutNumber}
                  </div>
                  <div className={`alert-badge ${colorClass}`}>
                    {alertStatus}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="charts-grid-main">
        {/* Actual vs Quota */}
        <div className="card" style={{ gridColumn: "1 / span 2" }}>
          <div className="card-header">
            <h2 className="card-title">
              <TimelineIcon className="card-title-icon" /> Sử dụng thực tế vs.
              Định mức theo phòng ban
            </h2>
            <span className="card-subtitle">{periodSubtitle}</span>
          </div>
          <div className="chart-container" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={actualVsQuota}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dept" axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip />
                <Legend iconType="square" />
                <Bar
                  dataKey="actual"
                  name="Sử dụng thực tế"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="quota"
                  name="Định mức 100%"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="card recent-requests">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h2 className="card-title">
            <AccessTimeOutlinedIcon className="card-title-icon" /> Phiếu gần đây
          </h2>
        </div>
        <div>
          {recentRequests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="req-main">
                <span className="req-code">{req.code}</span>
                <span className="req-user">
                  {req.requester} · {req.department}
                </span>
              </div>
              <div className="req-meta">
                <span className={`status-badge ${req.statusColor}`}>
                  {req.status}
                </span>
                <span className="req-time">{req.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
