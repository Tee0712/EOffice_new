import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Skeleton,
  Stack,
} from "@mui/material";

const HEADER_STYLE = {
  fontSize: "11px",
  fontWeight: 800,
  color: "#64748b",
  py: 2,
  borderBottom: "1px solid #e2e8f0",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  letterSpacing: "0.02em",
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (value) =>
  `${toNumber(value).toLocaleString("vi-VN")} đ`;

const StatusPill = ({ label, type = "success" }) => {
  const statusMap = {
    success: { color: "#16a34a", bgColor: "#f0fdf4" },
    warning: { color: "#f59e0b", bgColor: "#fffbeb" },
    danger: { color: "#dc2626", bgColor: "#fee2e2" },
  };
  const { color, bgColor } = statusMap[type] || statusMap.success;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.5,
        py: 0.5,
        borderRadius: "20px",
        backgroundColor: bgColor,
        border: "1px solid",
        borderColor: `${color}30`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          mr: 1,
        }}
      />
      <Typography variant="caption" fontWeight={700} sx={{ color }}>
        {label}
      </Typography>
    </Box>
  );
};

const resolveInventoryStatus = (item = {}) => {
  const closing = toNumber(item.closing_stock);
  const minStock = Math.max(
    1,
    toNumber(item.min_stock || item.minStock || item.min_stock_quantity, 10)
  );

  if (closing <= 0) return { label: "Hết hàng", type: "danger" };
  if (closing <= minStock) return { label: "Sắp hết", type: "warning" };
  return { label: "Đủ hàng", type: "success" };
};

const ProgressBar = ({ value, color = "#3b82f6" }) => {
  const numericValue = toNumber(value);
  const label =
    numericValue > 0 && numericValue < 0.01
      ? "<0.01%"
      : `${numericValue.toFixed(2)}%`;
  const widthPercent = Math.min(100, Math.max(0, numericValue));
  const showMinBar = numericValue > 0 && widthPercent < 1;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      spacing={1}
    >
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{ color: "#64748b", minWidth: 44, textAlign: "right" }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          width: 80,
          height: 6,
          backgroundColor: "#e2e8f0",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: showMinBar ? "2px" : `${widthPercent}%`,
            height: "100%",
            backgroundColor: color,
          }}
        />
      </Box>
    </Stack>
  );
};

const UsageBar = ({ value }) => {
  const percentage = Math.max(0, toNumber(value));
  const color =
    percentage > 100 ? "#dc2626" : percentage >= 95 ? "#d97706" : "#16a34a";
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 140,
          height: 10,
          backgroundColor: "#e2e8f0",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${Math.min(100, percentage)}%`,
            height: "100%",
            backgroundColor: color,
          }}
        />
      </Box>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color, minWidth: 40, textAlign: "right" }}
      >
        {percentage.toFixed(0)}%
      </Typography>
    </Stack>
  );
};

const EvaluationBadge = ({ value }) => {
  const percentage = toNumber(value);
  const over = percentage > 100;
  const near = percentage >= 95 && percentage <= 100;
  const label = over ? "Vượt định mức" : near ? "Gần ngưỡng" : "Trong định mức";
  const color = over ? "#dc2626" : near ? "#d97706" : "#16a34a";
  const bg = over ? "#fee2e2" : near ? "#fef3c7" : "#dcfce7";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.4,
        py: 0.5,
        borderRadius: "999px",
        color,
        backgroundColor: bg,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
};

const EmptyRow = ({ colSpan }) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      align="center"
      sx={{ py: 6, color: "#94a3b8" }}
    >
      <Typography variant="body2">
        Không có dữ liệu phù hợp với bộ lọc
      </Typography>
    </TableCell>
  </TableRow>
);

const groupByCategory = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.category_name || row.category || "Khác";
    const current = map.get(key) || {
      category: key,
      count: 0,
      opening: 0,
      receipt: 0,
      issue: 0,
      closing: 0,
      total_value: 0,
      total_cost: 0,
      qty: 0,
    };

    current.count += 1;
    current.opening += toNumber(row.opening_stock);
    current.receipt += Math.abs(toNumber(row.receipt_qty));
    current.issue += Math.abs(toNumber(row.issue_qty));
    current.closing += toNumber(row.closing_stock);
    current.total_value += toNumber(row.total_value);
    current.total_cost += toNumber(row.cost);
    current.qty += toNumber(row.qty);
    map.set(key, current);
  });
  const grouped = Array.from(map.values());
  const total = grouped.reduce((sum, item) => sum + item.total_cost, 0);
  return grouped.map((item) => ({
    ...item,
    percentage:
      total > 0 ? Number(((item.total_cost / total) * 100).toFixed(2)) : 0,
  }));
};

const groupDepartmentByCostRange = (rows = []) => {
  const ranges = [
    { label: "Chi phí thấp (< 5 triệu)", min: 0, max: 5_000_000 },
    {
      label: "Chi phí trung bình (5 - 10 triệu)",
      min: 5_000_000,
      max: 10_000_000,
    },
    {
      label: "Chi phí cao (> 10 triệu)",
      min: 10_000_000,
      max: Number.POSITIVE_INFINITY,
    },
  ];
  const total = rows.reduce((sum, item) => sum + toNumber(item.cost), 0);
  return ranges
    .map((range, index) => {
      const matched = rows.filter((item) => {
        const cost = toNumber(item.cost);
        return cost >= range.min && cost < range.max;
      });
      const cost = matched.reduce((sum, item) => sum + toNumber(item.cost), 0);
      return {
        id: index + 1,
        label: range.label,
        count: matched.length,
        total: cost,
        percentage: total > 0 ? Number(((cost / total) * 100).toFixed(2)) : 0,
      };
    })
    .filter((item) => item.count > 0);
};

const groupQuotaByStatus = (rows = []) => {
  const safeRows = rows.filter(
    (item) => toNumber(item.actual) <= toNumber(item.quota)
  );
  const overRows = rows.filter(
    (item) => toNumber(item.actual) > toNumber(item.quota)
  );

  const build = (items, label, type, id) => ({
    id,
    label,
    type,
    count: items.length,
    actual: items.reduce((sum, item) => sum + toNumber(item.actual), 0),
    quota: items.reduce((sum, item) => sum + toNumber(item.quota), 0),
    diff: items.reduce(
      (sum, item) => sum + (toNumber(item.quota) - toNumber(item.actual)),
      0
    ),
  });

  return [
    build(safeRows, "An toàn", "success", 1),
    build(overRows, "Vượt định mức", "warning", 2),
  ].filter((item) => item.count > 0);
};

const ReportTable = ({ activeTab, data = [], loading, subTab = 0 }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(() => {
    setPage(0);
  }, [activeTab, subTab, data.length]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(6)].map((_, idx) => (
          <Skeleton key={idx} height={58} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  let rows = data;
  let headers = [];
  let renderer = () => null;

  if (activeTab === 0 && subTab === 1) rows = groupByCategory(data);
  if (activeTab === 1 && subTab === 1) rows = groupDepartmentByCostRange(data);
  if (activeTab === 2 && subTab === 1) rows = groupQuotaByStatus(data);
  if (activeTab === 3 && subTab === 1) rows = groupByCategory(data);

  if (activeTab === 0 && subTab === 0) {
    headers = [
      "#",
      "Mặt hàng",
      "Nhóm hàng",
      "ĐVT",
      "Tồn đầu kỳ",
      "Nhập",
      "Xuất",
      "Điều chỉnh",
      "Tồn cuối kỳ",
      "Trạng thái",
      "Giá trị tồn",
    ];
    renderer = (item, index) => {
      const status = resolveInventoryStatus(item);
      return (
        <TableRow key={item.id || index} hover>
          <TableCell align="center">{index + 1}</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>{item.name || "-"}</TableCell>
          <TableCell align="center">
            {item.category_name || item.category || "Khác"}
          </TableCell>
          <TableCell align="center">{item.unit || "-"}</TableCell>
          <TableCell align="center">
            {toNumber(item.opening_stock).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center" sx={{ color: "#16a34a", fontWeight: 700 }}>
            +{Math.abs(toNumber(item.receipt_qty)).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center" sx={{ color: "#dc2626", fontWeight: 700 }}>
            -{Math.abs(toNumber(item.issue_qty)).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center">
            {toNumber(item.adjustment).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 700 }}>
            {toNumber(item.closing_stock).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center">
            <StatusPill label={status.label} type={status.type} />
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            {formatCurrency(item.total_value)}
          </TableCell>
        </TableRow>
      );
    };
  } else if (activeTab === 0 && subTab === 1) {
    headers = [
      "#",
      "Nhóm hàng",
      "Số mặt hàng",
      "Tồn đầu kỳ",
      "Nhập",
      "Xuất",
      "Tồn cuối kỳ",
      "Giá trị tồn",
    ];
    renderer = (item, index) => (
      <TableRow key={item.category || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 700 }}>{item.category}</TableCell>
        <TableCell align="center">{item.count} mặt hàng</TableCell>
        <TableCell align="center">
          {toNumber(item.opening).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ color: "#16a34a", fontWeight: 700 }}>
          +{Math.abs(toNumber(item.receipt)).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ color: "#dc2626", fontWeight: 700 }}>
          -{Math.abs(toNumber(item.issue)).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>
          {toNumber(item.closing).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>
          {formatCurrency(item.total_value)}
        </TableCell>
      </TableRow>
    );
  } else if (activeTab === 1 && subTab === 0) {
    headers = [
      "#",
      "Phòng ban",
      "Số phiếu yêu cầu",
      "Số lượng VPP",
      "Chi phí (VNĐ)",
      "Tỷ trọng",
    ];
    renderer = (item, index) => (
      <TableRow key={item.id || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 700 }}>
          {item.department_name || "-"}
        </TableCell>
        <TableCell align="center">
          {toNumber(item.requests).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center">
          {toNumber(item.qty).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: "#dc2626" }}>
          {formatCurrency(item.cost)}
        </TableCell>
        <TableCell align="right">
          <ProgressBar value={toNumber(item.percentage)} />
        </TableCell>
      </TableRow>
    );
  } else if (activeTab === 1 && subTab === 1) {
    headers = [
      "#",
      "Nhóm chi phí",
      "Số phòng ban",
      "Tổng chi phí (VNĐ)",
      "Tỷ lệ",
    ];
    renderer = (item, index) => (
      <TableRow key={item.id || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 700 }}>{item.label}</TableCell>
        <TableCell align="center">{item.count}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: "#dc2626" }}>
          {formatCurrency(item.total)}
        </TableCell>
        <TableCell align="right">
          <ProgressBar value={item.percentage} />
        </TableCell>
      </TableRow>
    );
  } else if (activeTab === 2 && subTab === 0) {
    headers = [
      "#",
      "Phòng ban",
      "Nhân sự",
      "Định mức (₫)",
      "Thực tế (₫)",
      "Chênh lệch",
      "Tỷ lệ sử dụng",
      "Đánh giá",
    ];
    renderer = (item, index) => {
      const actual = toNumber(item.actual);
      const quota = toNumber(item.quota);
      const diff = actual - quota;
      const usage = quota > 0 ? (actual / quota) * 100 : 0;
      return (
        <TableRow key={item.id || index} hover>
          <TableCell align="center">{index + 1}</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>
            {item.department_name || "-"}
          </TableCell>
          <TableCell align="center">
            {toNumber(item.staff).toLocaleString("vi-VN")}
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 700 }}>
            {formatCurrency(quota)}
          </TableCell>
          <TableCell align="center" sx={{ color: "#2563eb", fontWeight: 700 }}>
            {formatCurrency(actual)}
          </TableCell>
          <TableCell
            align="center"
            sx={{ fontWeight: 700, color: diff > 0 ? "#dc2626" : "#16a34a" }}
          >
            {diff > 0 ? "+" : ""}
            {formatCurrency(diff)}
          </TableCell>
          <TableCell align="center">
            <UsageBar value={usage} />
          </TableCell>
          <TableCell align="center">
            <EvaluationBadge value={usage} />
          </TableCell>
        </TableRow>
      );
    };
  } else if (activeTab === 2 && subTab === 1) {
    headers = [
      "#",
      "Trạng thái",
      "Số phòng ban",
      "Tổng thực tế (VNĐ)",
      "Tổng định mức (VNĐ)",
      "Chênh lệch",
    ];
    renderer = (item, index) => (
      <TableRow key={item.id || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell>
          <StatusPill label={item.label} type={item.type} />
        </TableCell>
        <TableCell align="center">{item.count}</TableCell>
        <TableCell align="center" sx={{ color: "#dc2626", fontWeight: 700 }}>
          {formatCurrency(item.actual)}
        </TableCell>
        <TableCell align="center" sx={{ color: "#16a34a", fontWeight: 700 }}>
          {formatCurrency(item.quota)}
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>
          {formatCurrency(item.diff)}
        </TableCell>
      </TableRow>
    );
  } else if (activeTab === 3 && subTab === 0) {
    headers = [
      "#",
      "Mặt hàng",
      "Nhóm hàng",
      "ĐVT",
      "Số lượng",
      "Chi phí (VNĐ)",
      "Biến động",
      "Tỷ trọng",
    ];
    renderer = (item, index) => (
      <TableRow key={item.id || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 700 }}>{item.name || "-"}</TableCell>
        <TableCell>{item.category_name || item.category || "Khác"}</TableCell>
        <TableCell align="center">{item.unit || "-"}</TableCell>
        <TableCell align="center">
          {toNumber(item.qty).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>
          {formatCurrency(item.cost)}
        </TableCell>
        <TableCell align="center">{toNumber(item.trend)}%</TableCell>
        <TableCell align="right">
          <ProgressBar value={toNumber(item.percentage)} color="#8b5cf6" />
        </TableCell>
      </TableRow>
    );
  } else {
    headers = [
      "#",
      "Nhóm hàng",
      "Số mặt hàng",
      "Tổng số lượng",
      "Tổng chi phí (VNĐ)",
      "Tỷ trọng",
    ];
    renderer = (item, index) => (
      <TableRow key={item.category || index} hover>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 700 }}>{item.category}</TableCell>
        <TableCell align="center">{item.count}</TableCell>
        <TableCell align="center">
          {toNumber(item.qty).toLocaleString("vi-VN")}
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>
          {formatCurrency(item.total_cost || item.cost)}
        </TableCell>
        <TableCell align="right">
          <ProgressBar value={item.percentage} color="#8b5cf6" />
        </TableCell>
      </TableRow>
    );
  }

  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const showQuotaTotalRow = activeTab === 2 && subTab === 0 && rows.length > 0;
  const quotaTotals = showQuotaTotalRow
    ? rows.reduce(
        (acc, item) => {
          acc.staff += toNumber(item.staff);
          acc.quota += toNumber(item.quota);
          acc.actual += toNumber(item.actual);
          return acc;
        },
        { staff: 0, quota: 0, actual: 0 }
      )
    : null;
  const totalUsage =
    quotaTotals && quotaTotals.quota > 0
      ? (quotaTotals.actual / quotaTotals.quota) * 100
      : 0;
  const totalDiff = quotaTotals ? quotaTotals.actual - quotaTotals.quota : 0;

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ overflowX: "auto", width: "100%" }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ backgroundColor: "#f8fafc" }}>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell
                  key={`${header}-${index}`}
                  align={index <= 1 ? "left" : "center"}
                  sx={HEADER_STYLE}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <EmptyRow colSpan={Math.max(1, headers.length)} />
            ) : (
              paginatedRows.map((item, index) =>
                renderer(item, page * rowsPerPage + index)
              )
            )}
            {showQuotaTotalRow && quotaTotals && (
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell />
                <TableCell sx={{ fontWeight: 800 }}>Tổng cộng</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  {quotaTotals.staff.toLocaleString("vi-VN")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  {formatCurrency(quotaTotals.quota)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, color: "#2563eb" }}
                >
                  {formatCurrency(quotaTotals.actual)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 800,
                    color: totalDiff > 0 ? "#dc2626" : "#16a34a",
                  }}
                >
                  {totalDiff > 0 ? "+" : ""}
                  {formatCurrency(totalDiff)}
                </TableCell>
                <TableCell align="center">
                  <UsageBar value={totalUsage} />
                </TableCell>
                <TableCell align="center">
                  <EvaluationBadge value={totalUsage} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Số dòng mỗi trang:"
      />
    </Box>
  );
};

export default ReportTable;
