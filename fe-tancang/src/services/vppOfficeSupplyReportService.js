import { callApi } from "./api";
import {
  exportReportFile,
  getActualVsQuotaReport,
  getByDepartmentReport,
  getCategories,
  getCostSummaryReport,
  getInventoryPicker,
  getInventoryList,
  getReportSummary,
  getRequestList,
  getStockMovementReport,
} from "./vppService";

const DEPARTMENT_APIS = ["/api/organization-units", "/api/v1/departments"];
const DEFAULT_PAGE_SIZE = 500;

const REPORT_TYPE_EXPORT_MAP = {
  inventory: "stock",
  department: "department",
  quota: "usage-vs-quota",
  cost: "cost",
};

const PERIOD_MAP = {
  week: { period: "current_week", timeFilter: "this_week" },
  month: { period: "current_month", timeFilter: "this_month" },
  quarter: { period: "quarter", timeFilter: "this_quarter" },
  year: { period: "year", timeFilter: "this_year" },
  custom: { period: "custom", timeFilter: "custom" },
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toText = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const text = String(value);
  return text || fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);
const normalizeKey = (value) => toText(value).trim().toLowerCase();
const normalizeSearchText = (value) =>
  toText(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0111]/g, "d");
const toSignedNumber = (value, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  const cleaned = text.replace(/\./g, "").replace(",", ".");
  const match = cleaned.match(/[-+]?\d+(\.\d+)?/);
  if (!match) return fallback;
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const isAllValue = (value) => {
  if (!value) return true;
  const normalized = normalizeKey(value);
  return (
    normalized === "all" ||
    normalized === "tatca" ||
    normalized.startsWith("tatca")
  );
};

const extractPayload = (response) => {
  if (!response) return null;
  if (
    response.success !== undefined &&
    Object.prototype.hasOwnProperty.call(response, "data")
  ) {
    return response.data;
  }
  return response.data !== undefined ? response.data : response;
};

const extractRows = (payload) => {
  const source = extractPayload(payload);
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.items)) return source.items;
  if (Array.isArray(source?.rows)) return source.rows;
  if (Array.isArray(source?.content)) return source.content;
  if (Array.isArray(source?.list)) return source.list;
  if (Array.isArray(source?.data)) return source.data;
  return [];
};

const extractSummary = (payload) => {
  const source = extractPayload(payload);
  if (!source || typeof source !== "object") return {};
  if (source.summary && typeof source.summary === "object")
    return source.summary;
  if (source.kpis && typeof source.kpis === "object") return source.kpis;
  if (source.totals && typeof source.totals === "object") return source.totals;
  return source;
};

const extractTotalCostCandidate = (payload) => {
  const source = extractPayload(payload);
  const summary = extractSummary(payload);
  const candidates = [
    summary.total,
    summary.total_cost,
    summary.totalCost,
    summary.cost,
    summary.value,
    summary.total_export_value,
    source?.total,
    source?.total_cost,
    source?.totalCost,
    source?.cost,
    source?.value,
    source?.total_export_value,
  ];

  for (const candidate of candidates) {
    const numeric = toSignedNumber(candidate, Number.NaN);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
};

const dedupeBy = (rows, keyGetter) => {
  const map = new Map();
  rows.forEach((item) => {
    const key = keyGetter(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return Array.from(map.values());
};

const safeCall = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    return null;
  }
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveEffectivePeriod = (filters = {}) => {
  const now = new Date();
  const selectedPeriod = toText(filters.period || "").toLowerCase();

  if (filters.periodType === "custom" && filters.fromDate && filters.toDate) {
    return {
      periodType: "custom",
      periodKey: "custom",
      year: toNumber(filters.year, now.getFullYear()),
      month: toNumber(filters.month, now.getMonth() + 1),
      quarter: toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1),
    };
  }

  if (selectedPeriod === "last_month") {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      periodType: "month",
      periodKey: "last_month",
      year: lastMonthDate.getFullYear(),
      month: lastMonthDate.getMonth() + 1,
      quarter: Math.floor(lastMonthDate.getMonth() / 3) + 1,
    };
  }

  if (selectedPeriod === "quarter") {
    return {
      periodType: "quarter",
      periodKey: "quarter",
      year: toNumber(filters.year, now.getFullYear()),
      month: now.getMonth() + 1,
      quarter: toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1),
    };
  }

  if (selectedPeriod === "week") {
    return {
      periodType: "week",
      periodKey: "week",
      year: toNumber(filters.year, now.getFullYear()),
      month: toNumber(filters.month, now.getMonth() + 1),
      quarter: toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1),
    };
  }

  if (selectedPeriod === "year") {
    return {
      periodType: "year",
      periodKey: "year",
      year: toNumber(filters.year, now.getFullYear()),
      month: toNumber(filters.month, now.getMonth() + 1),
      quarter: toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1),
    };
  }

  return {
    periodType: filters.periodType || "month",
    periodKey: "current_month",
    year: toNumber(filters.year, now.getFullYear()),
    month: toNumber(filters.month, now.getMonth() + 1),
    quarter: toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1),
  };
};

const resolveDateRange = (filters = {}) => {
  const effectivePeriod = resolveEffectivePeriod(filters);

  if (
    effectivePeriod.periodType === "custom" &&
    filters.fromDate &&
    filters.toDate
  ) {
    return { fromDate: filters.fromDate, toDate: filters.toDate };
  }

  const now = new Date();
  const periodType = effectivePeriod.periodType;
  const year = toNumber(effectivePeriod.year, now.getFullYear());
  let from = new Date(now);
  let to = new Date(now);

  if (periodType === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    from = new Date(now);
    from.setDate(now.getDate() + diffToMonday);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  } else if (periodType === "quarter") {
    const quarter = Math.min(
      4,
      Math.max(1, toNumber(filters.quarter, Math.floor(now.getMonth() / 3) + 1))
    );
    const startMonth = (quarter - 1) * 3;
    from = new Date(year, startMonth, 1);
    to = new Date(year, startMonth + 3, 0);
  } else if (periodType === "year") {
    from = new Date(year, 0, 1);
    to = new Date(year, 11, 31);
  } else {
    const month = Math.min(
      12,
      Math.max(1, toNumber(effectivePeriod.month, now.getMonth() + 1))
    );
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 0);
  }

  return { fromDate: formatDate(from), toDate: formatDate(to) };
};

const toTime = (value) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

const createDateRangeMatcher = (fromDate, toDate) => {
  const fromTime = toTime(fromDate);
  const toTimeValue = toTime(toDate);
  const endTime =
    toTimeValue === null ? null : toTimeValue + 24 * 60 * 60 * 1000 - 1;

  return (value) => {
    const time = toTime(value);
    if (time === null) return true;
    if (fromTime !== null && time < fromTime) return false;
    if (endTime !== null && time > endTime) return false;
    return true;
  };
};

const parseDateOnly = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const shiftDateByDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const shiftDateByMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const resolvePreviousDateRange = (filters = {}) => {
  const effectivePeriod = resolveEffectivePeriod(filters);
  const currentRange = resolveDateRange(filters);
  const currentFrom = parseDateOnly(currentRange.fromDate);
  const currentTo = parseDateOnly(currentRange.toDate);

  if (!currentFrom || !currentTo) return null;

  if (effectivePeriod.periodType === "week") {
    return {
      fromDate: formatDate(shiftDateByDays(currentFrom, -7)),
      toDate: formatDate(shiftDateByDays(currentTo, -7)),
    };
  }

  if (effectivePeriod.periodType === "quarter") {
    return {
      fromDate: formatDate(shiftDateByMonths(currentFrom, -3)),
      toDate: formatDate(shiftDateByMonths(currentTo, -3)),
    };
  }

  if (effectivePeriod.periodType === "year") {
    return {
      fromDate: formatDate(shiftDateByMonths(currentFrom, -12)),
      toDate: formatDate(shiftDateByMonths(currentTo, -12)),
    };
  }

  if (effectivePeriod.periodType === "custom") {
    const rangeDays = Math.max(
      1,
      Math.round(
        (currentTo.getTime() - currentFrom.getTime()) / (24 * 60 * 60 * 1000)
      ) + 1
    );
    const previousTo = shiftDateByDays(currentFrom, -1);
    const previousFrom = shiftDateByDays(previousTo, -(rangeDays - 1));
    return {
      fromDate: formatDate(previousFrom),
      toDate: formatDate(previousTo),
    };
  }

  const previousMonthStart = new Date(
    currentFrom.getFullYear(),
    currentFrom.getMonth() - 1,
    1
  );
  const previousMonthEnd = new Date(
    previousMonthStart.getFullYear(),
    previousMonthStart.getMonth() + 1,
    0
  );
  return {
    fromDate: formatDate(previousMonthStart),
    toDate: formatDate(previousMonthEnd),
  };
};

const buildReportParams = (filters = {}, reportType = "inventory") => {
  const now = new Date();
  const effectivePeriod = resolveEffectivePeriod(filters);
  const periodType = effectivePeriod.periodType;
  const periodMeta = PERIOD_MAP[periodType] || PERIOD_MAP.month;
  const dateRange = resolveDateRange(filters);
  const selectedPeriod = effectivePeriod.periodKey;

  const params = {
    periodType,
    period: selectedPeriod === "last_month" ? "last_month" : periodMeta.period,
    timeFilter:
      selectedPeriod === "last_month" ? "last_month" : periodMeta.timeFilter,
    year: toNumber(effectivePeriod.year, now.getFullYear()),
    reportType: REPORT_TYPE_EXPORT_MAP[reportType] || "stock",
    tab: REPORT_TYPE_EXPORT_MAP[reportType] || "stock",
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
  };

  const referenceDate = new Date(dateRange.fromDate || new Date());
  const refMonth = Number.isFinite(referenceDate.getTime())
    ? referenceDate.getMonth() + 1
    : now.getMonth() + 1;
  const refYear = Number.isFinite(referenceDate.getTime())
    ? referenceDate.getFullYear()
    : now.getFullYear();
  // Backward-compatible params for VPP report endpoints on some backends.
  params.period_month = refMonth;
  params.period_year = refYear;

  if (periodType === "month") {
    params.month = toNumber(effectivePeriod.month, now.getMonth() + 1);
  }

  if (periodType === "quarter") {
    params.quarter = toNumber(
      effectivePeriod.quarter,
      Math.floor(now.getMonth() / 3) + 1
    );
  }

  if (filters.keyword) params.keyword = filters.keyword;
  if (filters.viewMode)
    params.viewMode = filters.viewMode === "group" ? "grouped" : "detail";
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;

  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (!isAllValue(filters.department)) {
    params.department = filters.department;
    params.departmentCode = filters.department;
  }

  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (!isAllValue(filters.category)) {
    params.category = filters.category;
    params.categoryCode = filters.category;
  }

  return params;
};

const normalizeDepartmentOptions = (payload) =>
  dedupeBy(
    extractRows(payload).map((item) => {
      const id = toNumber(
        item.id || item.departmentId || item.orgId || item.organizationId
      );
      const label = toText(
        item.departmentName ||
          item.nameVn ||
          item.name ||
          item.title ||
          item.organizationName
      );
      const value = toText(
        item.departmentCode || item.code || item.orgCode || label
      );
      return {
        id,
        value: value || label,
        label: label || value,
      };
    }),
    (item) => `${item.id}-${item.value}-${item.label}`
  ).filter((item) => item.value || item.label);

const normalizeCategoryOptions = (payload) =>
  dedupeBy(
    extractRows(payload).map((item) => {
      const id = toNumber(item.id || item.categoryId);
      const label = toText(
        item.categoryName || item.name || item.category || item.title
      );
      const value = toText(item.categoryCode || item.code || label);
      return {
        id,
        value: value || label,
        label: label || value,
      };
    }),
    (item) => `${item.id}-${item.value}-${item.label}`
  ).filter((item) => item.value || item.label);

const normalizeDepartmentOptionsFromRequests = (requestRows = []) =>
  dedupeBy(
    requestRows
      .map((item, index) => {
        const departmentName = toText(item.department_name).trim();
        return {
          id: item.id || index + 1,
          value: departmentName,
          label: departmentName,
        };
      })
      .filter((item) => item.value),
    (item) => normalizeKey(item.value)
  ).sort((a, b) => a.label.localeCompare(b.label, "vi"));

const mergeOptionLists = (...optionGroups) =>
  dedupeBy(
    optionGroups
      .flat()
      .map((item) => ({
        id: toNumber(item?.id),
        value: toText(item?.value || item?.code || item?.label).trim(),
        label: toText(item?.label || item?.name || item?.value).trim(),
      }))
      .filter((item) => item.value || item.label)
      .map((item) => ({
        ...item,
        value: item.value || item.label,
        label: item.label || item.value,
      })),
    (item) => normalizeKey(item.value || item.label)
  ).sort((a, b) =>
    toText(a.label).localeCompare(toText(b.label), "vi", {
      sensitivity: "base",
    })
  );

const mergeDepartmentRows = (apiRows = [], requestDerivedRows = []) => {
  const merged = [...apiRows];
  const existing = new Set(
    apiRows.map((item) =>
      normalizeKey(item.department_name || item.department || "")
    )
  );

  requestDerivedRows.forEach((item) => {
    const key = normalizeKey(item.department_name || item.department || "");
    if (!key || existing.has(key)) return;
    merged.push(item);
    existing.add(key);
  });

  return merged.sort((a, b) => toNumber(b.cost) - toNumber(a.cost));
};

const normalizeInventoryRows = (payload) =>
  extractRows(payload).map((item, index) => {
    const closingRaw =
      item.closing_stock ??
      item.closingStock ??
      item.closing ??
      item.quantity_on_hand ??
      item.quantity;
    const closing = toNumber(closingRaw);
    const opening = toNumber(
      item.opening_stock ||
        item.openingStock ||
        item.opening ||
        item.beginning_stock,
      closing
    );
    const receipt = Math.abs(
      toSignedNumber(
        item.receipt_qty ||
          item.receiptQty ||
          item.import_qty ||
          item.import ||
          item.total_in ||
          item.in_qty ||
          item.inQty ||
          item.last_import_qty
      )
    );
    const issue = Math.abs(
      toSignedNumber(
        item.issue_qty ||
          item.issueQty ||
          item.export_qty ||
          item.export ||
          item.total_out ||
          item.out_qty ||
          item.outQty ||
          item.last_export_qty
      )
    );
    const adjustment = toSignedNumber(
      item.adjustment || item.adjustment_qty || item.adjust_qty
    );
    const price = toNumber(
      item.price ||
        item.unit_price ||
        item.unitPrice ||
        item.unit_cost ||
        item.standard_cost ||
        item.average_cost ||
        item.standardCost ||
        item.reference_price ||
        item.referencePrice
    );
    const totalValue = toNumber(
      item.total_value || item.totalValue || item.stock_value,
      Math.max(closing, 0) * price
    );

    return {
      id:
        item.id ||
        item.item_id ||
        item.itemId ||
        item.product_id ||
        item.productId ||
        index + 1,
      code: toText(
        item.code ||
          item.item_code ||
          item.itemCode ||
          item.product_code ||
          item.productCode ||
          "-"
      ),
      name: toText(
        item.name ||
          item.item_name ||
          item.itemName ||
          item.product_name ||
          item.productName ||
          "-"
      ),
      category_name: toText(
        item.category_name || item.categoryName || item.category || "Khac"
      ),
      unit: toText(item.unit || item.unit_name || item.unitName || "DVT"),
      opening_stock: opening,
      receipt_qty: receipt,
      issue_qty: issue,
      adjustment,
      closing_stock: closing,
      min_stock: toNumber(
        item.min_stock ||
          item.minStock ||
          item.min_stock_quantity ||
          item.minStockQuantity,
        0
      ),
      total_value: totalValue,
      export_value: toNumber(
        item.export_value ||
          item.exportValue ||
          item.issue_value ||
          item.issueValue
      ),
      reference_price: toNumber(
        item.reference_price || item.referencePrice || price
      ),
      price,
      cost: toNumber(
        item.cost || item.total_cost || item.totalCost || issue * price
      ),
      qty: Math.abs(toSignedNumber(item.qty || item.quantity, issue)),
      trend: toNumber(item.trend || item.trend_percent || item.trendPercent, 0),
      department_name: toText(
        item.department_name || item.departmentName || item.department || ""
      ),
      requests: toNumber(
        item.requests || item.request_count || item.requestCount
      ),
      items: toNumber(item.items || item.item_count || item.itemCount),
      percentage: toNumber(item.percentage || item.percent || item.ratio),
      quota: toNumber(
        item.quota || item.limit || item.budget || item.limitAmount
      ),
      actual: toNumber(item.actual || item.used || item.actualAmount),
      staff: toNumber(item.staff || item.staffCount || item.userCount),
      last_transaction_type: toText(
        item.last_transaction_type ||
          item.transaction_type ||
          item.lastTransactionType ||
          ""
      ),
      last_transaction_quantity: toNumber(
        item.last_transaction_quantity ||
          item.actual_quantity ||
          item.lastTransactionQuantity ||
          0
      ),
      last_transaction_date: toText(
        item.last_transaction_date ||
          item.created_at ||
          item.lastTransactionDate ||
          ""
      ),
    };
  });

const applyLastTransactionFallback = (rows = [], params = {}) => {
  const matchDate = createDateRangeMatcher(params.fromDate, params.toDate);

  return rows.map((item) => {
    if (toNumber(item.receipt_qty) > 0 || toNumber(item.issue_qty) > 0)
      return item;

    const txType = toText(item.last_transaction_type).toUpperCase();
    const txQty = toNumber(item.last_transaction_quantity);
    if (!txType || txQty <= 0) return item;
    if (!matchDate(item.last_transaction_date)) return item;

    if (txType === "RECEIPT" || txType === "IMPORT" || txType === "IN") {
      return { ...item, receipt_qty: txQty };
    }
    if (
      txType === "ISSUE" ||
      txType === "ISSUE_REQUEST" ||
      txType === "EXPORT" ||
      txType === "OUT"
    ) {
      return {
        ...item,
        issue_qty: txQty,
        qty: toNumber(item.qty) > 0 ? item.qty : txQty,
      };
    }
    return item;
  });
};

const reconcileInventoryBalanceRows = (rows = []) =>
  rows.map((item) => {
    const opening = toNumber(item.opening_stock);
    const receipt = Math.abs(toSignedNumber(item.receipt_qty));
    const issue = Math.abs(toSignedNumber(item.issue_qty));
    const adjustment = toSignedNumber(item.adjustment);
    const closing = toNumber(item.closing_stock);

    const balanceFromOpening = opening + receipt - issue + adjustment;
    const hasValidClosing = Number.isFinite(closing);
    const hasValidOpening = Number.isFinite(opening);
    const isBalanced =
      hasValidClosing &&
      hasValidOpening &&
      Math.abs(balanceFromOpening - closing) < 0.0001;

    const normalizedItem = {
      ...item,
      receipt_qty: receipt,
      issue_qty: issue,
      adjustment,
      qty: Math.abs(toSignedNumber(item.qty, issue)),
    };

    if (isBalanced) return normalizedItem;

    // Closing stock is treated as current snapshot truth from inventory/report APIs.
    // Re-derive opening so rows always satisfy balance equation.
    const reconciledOpening = Math.max(
      closing - receipt + issue - adjustment,
      0
    );
    return {
      ...normalizedItem,
      opening_stock: reconciledOpening,
    };
  });

const normalizeRequestRows = (payload) =>
  extractRows(payload).map((item, index) => {
    const rawItems = toArray(
      item.items || item.details || item.lines || item.request_items
    );
    const qtyFromItems = rawItems.reduce(
      (sum, detail) =>
        sum +
        toSignedNumber(
          detail.requested_quantity ||
            detail.approved_quantity ||
            detail.quantity ||
            detail.qty ||
            detail.actual_quantity
        ),
      0
    );
    const costFromItems = rawItems.reduce((sum, detail) => {
      const quantity = toSignedNumber(
        detail.requested_quantity ||
          detail.approved_quantity ||
          detail.quantity ||
          detail.qty ||
          detail.actual_quantity
      );
      const lineTotal = toSignedNumber(
        detail.total || detail.total_cost || detail.totalCost || detail.amount,
        quantity *
          toSignedNumber(
            detail.price || detail.unit_price || detail.unitPrice || detail.cost
          )
      );
      return sum + lineTotal;
    }, 0);

    return {
      id: item.id || item.request_id || item.requestId || index + 1,
      request_code: toText(
        item.request_number || item.requestCode || item.code || ""
      ),
      department_name: toText(
        item.department_name || item.departmentName || item.department || ""
      ),
      requests: 1,
      items: toSignedNumber(
        item.total_items ||
          item.totalItems ||
          item.items_count ||
          item.item_count,
        rawItems.length
      ),
      qty: toSignedNumber(
        item.total_quantity || item.quantity || item.qty,
        qtyFromItems
      ),
      cost: toSignedNumber(
        item.estimated_value ||
          item.estimatedValue ||
          item.total_cost ||
          item.totalCost ||
          item.amount,
        costFromItems
      ),
      quota: toSignedNumber(
        item.quota || item.department_quota || item.limit || 0
      ),
      actual: toSignedNumber(
        item.actual ||
          item.used ||
          item.actualAmount ||
          item.estimated_value ||
          item.estimatedValue ||
          0
      ),
      staff: toSignedNumber(
        item.staff || item.staff_count || item.user_count || 0
      ),
      category_name: toText(
        item.category_name || item.categoryName || item.category || ""
      ),
      created_at: toText(item.created_at || item.createdAt || ""),
      raw_items: rawItems,
    };
  });

const normalizeDepartmentApiRows = (rows = []) => {
  const mapped = rows.map((item, index) => ({
    id: item.id || item.departmentId || index + 1,
    department_name: toText(
      item.department_name ||
        item.departmentName ||
        item.department ||
        item.name ||
        "-"
    ),
    requests: toNumber(
      item.requests || item.request_count || item.requestCount
    ),
    items: toNumber(
      item.items || item.items_count || item.item_count || item.itemCount
    ),
    qty: toNumber(
      item.qty || item.quantity || item.total_qty || item.totalQuantity
    ),
    cost: toNumber(
      item.cost ||
        item.total_cost ||
        item.totalCost ||
        item.total ||
        item.amount ||
        item.value
    ),
    percentage: toNumber(item.percentage || item.percent || item.ratio),
  }));

  const totalCost = mapped.reduce((sum, item) => sum + item.cost, 0);
  return mapped.map((item) => ({
    ...item,
    percentage:
      item.percentage ||
      (totalCost > 0 ? Math.round((item.cost / totalCost) * 100) : 0),
  }));
};

const normalizeQuotaApiRows = (rows = []) =>
  rows.map((item, index) => {
    const quota = toNumber(
      item.quota || item.limit || item.budget || item.limitAmount
    );
    const actual = toNumber(
      item.actual || item.used || item.actualAmount || item.cost
    );
    return {
      id: item.id || item.departmentId || index + 1,
      department_name: toText(
        item.department_name ||
          item.departmentName ||
          item.department ||
          item.name ||
          "-"
      ),
      staff: toNumber(item.staff || item.staffCount || item.userCount),
      quota,
      actual,
      diff: actual - quota,
      percentage: toNumber(
        item.percentage || item.percent || item.ratio,
        quota > 0 ? Math.round((actual / quota) * 100) : 0
      ),
    };
  });

const normalizeCostApiRows = (rows = []) =>
  rows.map((item, index) => ({
    id: item.id || item.productId || index + 1,
    code: toText(
      item.code || item.product_code || item.productCode || item.item_code || ""
    ),
    name: toText(
      item.name ||
        item.product_name ||
        item.productName ||
        item.item_name ||
        "-"
    ),
    category_name: toText(
      item.category_name || item.categoryName || item.category || "Khác"
    ),
    unit: toText(item.unit || item.unit_name || item.unitName || "ĐVT"),
    department_name: toText(
      item.department_name || item.departmentName || item.department || ""
    ),
    department_code: toText(
      item.department_code || item.departmentCode || item.departmentId || ""
    ),
    qty: toNumber(
      item.qty || item.quantity || item.total_qty || item.totalQuantity
    ),
    cost: toNumber(
      item.cost || item.total_cost || item.totalCost || item.amount
    ),
    trend: toNumber(item.trend || item.trend_percent || item.trendPercent),
    percentage: toNumber(item.percentage || item.percent || item.ratio),
  }));

const normalizePickerRows = (payload) =>
  extractRows(payload).map((item, index) => ({
    id:
      item.id ||
      item.product_id ||
      item.productId ||
      item.item_id ||
      item.itemId ||
      index + 1,
    code: toText(
      item.code ||
        item.product_code ||
        item.productCode ||
        item.item_code ||
        item.itemCode ||
        ""
    ),
    name: toText(
      item.name ||
        item.product_name ||
        item.productName ||
        item.item_name ||
        item.itemName ||
        ""
    ),
    price: toNumber(
      item.price ||
        item.unit_price ||
        item.unitPrice ||
        item.unit_cost ||
        item.reference_price ||
        item.referencePrice ||
        item.standard_cost ||
        item.standardCost
    ),
    reference_price: toNumber(
      item.reference_price || item.referencePrice || item.price
    ),
  }));

const setMapValue = (map, key, value) => {
  if (!key) return;
  const normalized = normalizeKey(key);
  if (!normalized) return;
  if (!map.has(normalized) || toNumber(map.get(normalized)) <= 0) {
    map.set(normalized, toNumber(value));
  }
};

const buildPriceMapFromPickerRows = (pickerRows = []) => {
  const map = new Map();
  pickerRows.forEach((item) => {
    const price = toNumber(item.price || item.reference_price);
    if (price <= 0) return;
    setMapValue(map, item.code, price);
    setMapValue(map, item.name, price);
    setMapValue(map, item.id, price);
  });
  return map;
};

const buildPriceMapFromRequestRows = (requestRows = []) => {
  const aggregate = new Map();

  requestRows.forEach((request) => {
    toArray(request.raw_items).forEach((detail) => {
      const code = toText(
        detail.product_code ||
          detail.item_code ||
          detail.code ||
          detail.productCode ||
          detail.itemCode ||
          ""
      );
      const name = toText(
        detail.product_name ||
          detail.item_name ||
          detail.name ||
          detail.productName ||
          detail.itemName ||
          ""
      );
      const key = normalizeKey(code || name);
      if (!key) return;

      const quantity = Math.max(
        1,
        toNumber(
          detail.actual_quantity ||
            detail.approved_quantity ||
            detail.requested_quantity ||
            detail.quantity ||
            detail.qty
        )
      );
      const unitPrice = toNumber(
        detail.price ||
          detail.unit_price ||
          detail.unitPrice ||
          detail.reference_price ||
          detail.referencePrice ||
          toNumber(
            detail.total ||
              detail.total_cost ||
              detail.totalCost ||
              detail.amount
          ) / quantity
      );
      if (unitPrice <= 0) return;

      const current = aggregate.get(key) || {
        totalPrice: 0,
        totalQty: 0,
        code,
        name,
      };
      current.totalPrice += unitPrice * quantity;
      current.totalQty += quantity;
      aggregate.set(key, current);
    });
  });

  const priceMap = new Map();
  Array.from(aggregate.values()).forEach((item) => {
    const avgPrice = item.totalQty > 0 ? item.totalPrice / item.totalQty : 0;
    if (avgPrice <= 0) return;
    setMapValue(priceMap, item.code, avgPrice);
    setMapValue(priceMap, item.name, avgPrice);
  });
  return priceMap;
};

const resolvePriceForInventoryItem = (
  item,
  requestPriceMap,
  pickerPriceMap
) => {
  const currentPrice = toNumber(item.price || item.reference_price);
  if (currentPrice > 0) return currentPrice;

  const keys = [item.code, item.name, item.id];
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (!normalized) continue;
    const requestPrice = toNumber(requestPriceMap.get(normalized), 0);
    if (requestPrice > 0) return requestPrice;
    const pickerPrice = toNumber(pickerPriceMap.get(normalized), 0);
    if (pickerPrice > 0) return pickerPrice;
  }

  return 0;
};

const applyPriceToInventoryRows = (
  rows = [],
  requestRows = [],
  pickerRows = []
) => {
  const requestPriceMap = buildPriceMapFromRequestRows(requestRows);
  const pickerPriceMap = buildPriceMapFromPickerRows(pickerRows);

  return rows.map((item) => {
    const resolvedPrice = resolvePriceForInventoryItem(
      item,
      requestPriceMap,
      pickerPriceMap
    );
    const closing = toNumber(item.closing_stock);
    const issue = toNumber(item.issue_qty);
    const currentTotalValue = toNumber(item.total_value);
    const currentCost = toNumber(item.cost);
    const totalValue =
      currentTotalValue > 0 ? currentTotalValue : closing * resolvedPrice;
    const cost = currentCost > 0 ? currentCost : issue * resolvedPrice;

    return {
      ...item,
      price: resolvedPrice,
      reference_price: toNumber(item.reference_price, resolvedPrice),
      total_value: totalValue,
      cost,
    };
  });
};

const buildIssueMapByProduct = (requestRows = []) => {
  const map = new Map();

  requestRows.forEach((request) => {
    toArray(request.raw_items).forEach((detail) => {
      const code = toText(
        detail.product_code ||
          detail.item_code ||
          detail.code ||
          detail.productCode ||
          detail.itemCode ||
          ""
      );
      const name = toText(
        detail.product_name ||
          detail.item_name ||
          detail.name ||
          detail.productName ||
          detail.itemName ||
          ""
      );
      const key = normalizeKey(code || name);
      if (!key) return;

      const qty = toNumber(
        detail.actual_quantity ||
          detail.approved_quantity ||
          detail.requested_quantity ||
          detail.quantity ||
          detail.qty
      );
      const amount = toNumber(
        detail.total || detail.total_cost || detail.totalCost || detail.amount,
        qty *
          toNumber(
            detail.price || detail.unit_price || detail.unitPrice || detail.cost
          )
      );

      const current = map.get(key) || { qty: 0, cost: 0 };
      current.qty += qty;
      current.cost += amount;
      map.set(key, current);
    });
  });

  return map;
};

const applyMovementFromRequests = (inventoryRows = [], requestRows = []) => {
  const issueMap = buildIssueMapByProduct(requestRows);
  if (issueMap.size === 0) return inventoryRows;

  return inventoryRows.map((item) => {
    const key = normalizeKey(item.code || item.name);
    const mapped = issueMap.get(key);
    if (!mapped) return item;

    const issueQty = mapped.qty;
    const opening = Math.max(
      toNumber(item.opening_stock, 0) ||
        toNumber(item.closing_stock, 0) +
          issueQty -
          toNumber(item.receipt_qty, 0) -
          toNumber(item.adjustment, 0),
      0
    );
    const mappedPrice = issueQty > 0 ? toNumber(mapped.cost) / issueQty : 0;
    const resolvedPrice = toNumber(
      item.price || item.reference_price,
      mappedPrice
    );
    const derivedCost =
      mapped.cost || toNumber(item.cost, issueQty * resolvedPrice);
    const closing = toNumber(item.closing_stock);
    const currentTotalValue = toNumber(item.total_value);

    return {
      ...item,
      opening_stock:
        toNumber(item.opening_stock) > 0
          ? toNumber(item.opening_stock)
          : opening,
      issue_qty:
        toNumber(item.issue_qty) > 0 ? toNumber(item.issue_qty) : issueQty,
      qty: toNumber(item.qty) > 0 ? toNumber(item.qty) : issueQty,
      cost: toNumber(item.cost) > 0 ? toNumber(item.cost) : derivedCost,
      price: resolvedPrice,
      reference_price: toNumber(item.reference_price, resolvedPrice),
      total_value:
        currentTotalValue > 0 ? currentTotalValue : closing * resolvedPrice,
    };
  });
};

const deriveDepartmentRows = (requestRows = [], inventoryRows = []) => {
  const map = new Map();
  const hasRequestMetrics =
    requestRows.length > 0 &&
    requestRows.some(
      (item) =>
        toNumber(item.cost) > 0 ||
        toNumber(item.qty) > 0 ||
        toNumber(item.items) > 0
    );

  if (hasRequestMetrics) {
    requestRows.forEach((item) => {
      const department = toText(item.department_name);
      if (!department) return;

      const current = map.get(department) || {
        id: department,
        department_name: department,
        requests: 0,
        items: 0,
        qty: 0,
        cost: 0,
        staff: 0,
        quota: 0,
        actual: 0,
        percentage: 0,
      };

      current.requests += toNumber(item.requests, 1);
      current.items += toNumber(item.items, 0);
      current.qty += toNumber(item.qty, 0);
      current.cost += toNumber(item.cost, 0);
      current.staff += toNumber(item.staff, 0);
      current.quota += toNumber(item.quota, 0);
      current.actual += toNumber(item.actual, toNumber(item.cost, 0));
      map.set(department, current);
    });
  } else {
    inventoryRows.forEach((item) => {
      const department = toText(
        item.department_name || item.department || item.departmentName,
        "Toàn đơn vị"
      );
      const current = map.get(department) || {
        id: department,
        department_name: department,
        requests: 0,
        items: 0,
        qty: 0,
        cost: 0,
        staff: 0,
        quota: 0,
        actual: 0,
        percentage: 0,
      };
      current.items += 1;
      current.qty += toNumber(item.qty || item.issue_qty, 0);
      current.cost += toNumber(item.cost || item.total_value, 0);
      map.set(department, current);
    });
  }

  const grouped = Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  const totalCost = grouped.reduce((sum, item) => sum + item.cost, 0);

  return grouped.map((item) => ({
    ...item,
    percentage: totalCost > 0 ? Math.round((item.cost / totalCost) * 100) : 0,
  }));
};

const extractQuotaRowsFromSummary = (payload) => {
  const source = extractPayload(payload) || {};
  const candidates = [
    source.usageVsQuotaByDepartment,
    source.actualVsQuotaByDepartment,
    source.usageVsQuota,
    source.actualVsQuota,
    source.charts?.usageVsQuotaByDepartment,
  ];

  const list = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(list)) return [];

  return list.map((item, index) => {
    const quota = toNumber(item.quota || item.limit || item.target || 0);
    const actual = toNumber(item.actual || item.used || item.value || 0);
    return {
      id: item.id || item.departmentId || index + 1,
      department_name: toText(
        item.department_name ||
          item.departmentName ||
          item.department ||
          item.dept ||
          "-"
      ),
      staff: toNumber(item.staff || item.staffCount || item.userCount, 0),
      quota,
      actual,
      diff: actual - quota,
      percentage: quota > 0 ? Math.round((actual / quota) * 100) : 0,
    };
  });
};

const deriveQuotaRows = (departmentRows = []) =>
  departmentRows.map((item, index) => {
    const quota = toNumber(item.quota, 0);
    const actual = toNumber(item.actual, toNumber(item.cost, 0));
    return {
      id: item.id || index + 1,
      department_name: item.department_name,
      staff: toNumber(item.staff, 0),
      requests: toNumber(item.requests, 0),
      qty: toNumber(item.qty, 0),
      quota,
      actual,
      diff: actual - quota,
      percentage: quota > 0 ? Math.round((actual / quota) * 100) : 0,
    };
  });

const mergeQuotaRowsWithDepartmentMetrics = (
  quotaRows = [],
  departmentRows = []
) => {
  const map = new Map();

  quotaRows.forEach((item, index) => {
    const departmentName = toText(
      item.department_name || item.departmentName || item.department || "-"
    );
    const key = normalizeKey(departmentName || `${index}`);
    if (!key) return;
    map.set(key, {
      id: item.id || index + 1,
      department_name: departmentName,
      staff: toNumber(item.staff, 0),
      requests: toNumber(item.requests, 0),
      qty: toNumber(item.qty, 0),
      quota: toNumber(item.quota, 0),
      actual: toNumber(item.actual, 0),
      diff: toNumber(item.actual, 0) - toNumber(item.quota, 0),
      percentage: toNumber(
        item.percentage,
        toNumber(item.quota, 0) > 0
          ? Math.round(
              (toNumber(item.actual, 0) / toNumber(item.quota, 0)) * 100
            )
          : 0
      ),
    });
  });

  departmentRows.forEach((item, index) => {
    const departmentName = toText(
      item.department_name || item.departmentName || item.department || "-"
    );
    const key = normalizeKey(departmentName || `dept-${index}`);
    if (!key) return;

    const current = map.get(key) || {
      id: item.id || index + 1,
      department_name: departmentName,
      staff: 0,
      requests: 0,
      qty: 0,
      quota: 0,
      actual: 0,
      diff: 0,
      percentage: 0,
    };

    const actualFromDepartment = toNumber(item.actual, toNumber(item.cost, 0));
    const currentActual = toNumber(current.actual, 0);
    const actual =
      currentActual > 0 ? currentActual : Math.max(actualFromDepartment, 0);

    const currentQuota = toNumber(current.quota, 0);
    const quotaFromDepartment = toNumber(item.quota, 0);
    const quota =
      currentQuota > 0 ? currentQuota : Math.max(quotaFromDepartment, 0);

    const merged = {
      ...current,
      id: current.id || item.id || index + 1,
      department_name: current.department_name || departmentName,
      staff: Math.max(toNumber(current.staff), toNumber(item.staff, 0)),
      requests: Math.max(
        toNumber(current.requests),
        toNumber(item.requests, 0)
      ),
      qty: Math.max(toNumber(current.qty), toNumber(item.qty, 0)),
      quota,
      actual,
      diff: actual - quota,
      percentage: quota > 0 ? Math.round((actual / quota) * 100) : 0,
    };

    map.set(key, merged);
  });

  return Array.from(map.values()).sort(
    (a, b) => toNumber(b.actual) - toNumber(a.actual)
  );
};

const deriveQuotaRowsFromInventory = (inventoryRows = []) => {
  if (!Array.isArray(inventoryRows) || inventoryRows.length === 0) return [];

  const totalCost = inventoryRows.reduce(
    (sum, item) => sum + toNumber(item.cost || item.total_value),
    0
  );

  if (totalCost <= 0) return [];

  return [
    {
      id: "all-units",
      department_name: "Toàn đơn vị",
      staff: 0,
      quota: totalCost,
      actual: totalCost,
      diff: 0,
      percentage: 100,
    },
  ];
};

const deriveCostRows = (inventoryRows = [], requestRows = []) => {
  const groupedFromRequests = new Map();

  requestRows.forEach((request) => {
    const requestDepartmentName = toText(
      request.department_name ||
        request.departmentName ||
        request.department ||
        ""
    );
    const requestDepartmentCode = toText(
      request.department_code ||
        request.departmentCode ||
        request.departmentId ||
        ""
    );
    toArray(request.raw_items).forEach((detail, index) => {
      const code = toText(
        detail.product_code ||
          detail.item_code ||
          detail.code ||
          detail.productCode ||
          detail.itemCode ||
          ""
      );
      const name = toText(
        detail.product_name ||
          detail.item_name ||
          detail.name ||
          detail.productName ||
          detail.itemName ||
          ""
      );
      const departmentKey = normalizeKey(
        requestDepartmentCode || requestDepartmentName || "all-departments"
      );
      const key = normalizeKey(
        `${departmentKey}|${code || name || `${request.id}-${index}`}`
      );
      if (!key) return;

      const qty = toNumber(
        detail.actual_quantity ||
          detail.approved_quantity ||
          detail.requested_quantity ||
          detail.quantity ||
          detail.qty,
        0
      );
      const cost = toNumber(
        detail.total || detail.total_cost || detail.totalCost || detail.amount,
        qty *
          toNumber(
            detail.price || detail.unit_price || detail.unitPrice || detail.cost
          )
      );

      const current = groupedFromRequests.get(key) || {
        id: key,
        code: code || "-",
        name: name || "-",
        category_name: toText(
          detail.category_name ||
            detail.categoryName ||
            detail.category ||
            "Khac"
        ),
        unit: toText(
          detail.unit || detail.unit_name || detail.unitName || "DVT"
        ),
        department_name: requestDepartmentName,
        department_code: requestDepartmentCode,
        qty: 0,
        cost: 0,
        trend: 0,
        percentage: 0,
      };

      current.qty += qty;
      current.cost += cost;
      groupedFromRequests.set(key, current);
    });
  });

  const requestRowsDerived = Array.from(groupedFromRequests.values());
  const hasValidRequestCost = requestRowsDerived.some(
    (item) => toNumber(item.cost) > 0 || toNumber(item.qty) > 0
  );

  const rows = hasValidRequestCost
    ? requestRowsDerived
    : inventoryRows.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category_name: item.category_name,
        unit: item.unit,
        qty: toNumber(item.qty || item.issue_qty || item.closing_stock, 0),
        cost: toNumber(
          item.cost ||
            item.total_value ||
            toNumber(item.qty || item.issue_qty || item.closing_stock, 0) *
              toNumber(item.price)
        ),
        trend: toNumber(item.trend, 0),
        percentage: toNumber(item.percentage, 0),
      }));

  const totalCost = rows.reduce((sum, item) => sum + toNumber(item.cost), 0);

  return rows
    .map((item) => ({
      ...item,
      percentage:
        toNumber(item.percentage) > 0
          ? Number(toNumber(item.percentage).toFixed(2))
          : totalCost > 0
            ? Number(((toNumber(item.cost) / totalCost) * 100).toFixed(2))
            : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
};

const includesText = (value, keyword) =>
  normalizeSearchText(value).includes(normalizeSearchText(keyword));

const applyRowFilters = (rows = [], reportType, filters = {}) => {
  const keyword = toText(filters.keyword).trim();
  const department = isAllValue(filters.department)
    ? ""
    : toText(filters.department);
  const category = isAllValue(filters.category) ? "" : toText(filters.category);
  const shouldFilterDepartment =
    reportType === "department" ||
    reportType === "quota" ||
    reportType === "cost";
  const shouldFilterCategory =
    reportType === "inventory" || reportType === "cost";

  return rows.filter((item) => {
    if (shouldFilterDepartment && department) {
      const departmentName = toText(
        item.department_name || item.departmentName || item.department || ""
      );
      const departmentCode = toText(
        item.department_code || item.departmentCode || ""
      );
      if (
        !includesText(departmentName, department) &&
        !includesText(departmentCode, department)
      )
        return false;
    }

    if (shouldFilterCategory && category) {
      const categoryName = toText(
        item.category_name || item.categoryName || item.category || ""
      );
      const categoryCode = toText(
        item.category_code || item.categoryCode || ""
      );
      if (
        !includesText(categoryName, category) &&
        !includesText(categoryCode, category)
      )
        return false;
    }

    if (!keyword) return true;

    if (reportType === "department" || reportType === "quota") {
      return includesText(item.department_name || item.department, keyword);
    }

    return (
      includesText(item.code, keyword) ||
      includesText(item.name, keyword) ||
      includesText(item.category_name || item.category, keyword)
    );
  });
};

const mapReportTypeToActiveTab = (reportType) => {
  if (reportType === "department") return 1;
  if (reportType === "quota") return 2;
  if (reportType === "cost") return 3;
  return 0;
};

export const officeSupplyReportService = {
  async getFilters() {
    const reportFilterParams = {
      ...buildReportParams({ period: "current_month" }, "inventory"),
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const [stockReportRes, departmentReportRes, costReportRes, requestRes] =
      await Promise.all([
        safeCall(() => getStockMovementReport(reportFilterParams)),
        safeCall(() => getByDepartmentReport(reportFilterParams)),
        safeCall(() => getCostSummaryReport(reportFilterParams)),
        safeCall(() =>
          getRequestList({
            page: 1,
            limit: 2000,
            fromDate: reportFilterParams.fromDate,
            toDate: reportFilterParams.toDate,
          })
        ),
      ]);

    const stockReportRows = normalizeInventoryRows(stockReportRes);
    const costReportRows = normalizeCostApiRows(extractRows(costReportRes));
    const categoriesFromReports = dedupeBy(
      [...stockReportRows, ...costReportRows]
        .map((item) => {
          const category = toText(item.category_name || item.category).trim();
          return {
            id: 0,
            value: category,
            label: category,
          };
        })
        .filter((item) => item.value),
      (item) => normalizeKey(item.value)
    );
    const categoriesRes = await safeCall(() => getCategories());
    const categoriesFromApi = normalizeCategoryOptions(categoriesRes);

    const inventoryRes = await safeCall(() =>
      getInventoryList({ page: 1, limit: DEFAULT_PAGE_SIZE })
    );
    const categoriesFromInventory = dedupeBy(
      normalizeInventoryRows(inventoryRes)
        .map((item) => ({
          id: 0,
          value: toText(item.category_name),
          label: toText(item.category_name),
        }))
        .filter((item) => item.value),
      (item) => normalizeKey(item.value)
    );
    const categories = mergeOptionLists(
      categoriesFromReports,
      categoriesFromApi,
      categoriesFromInventory
    );

    const reportDepartmentRows = normalizeDepartmentApiRows(
      extractRows(departmentReportRes)
    );
    const departmentsFromReports = dedupeBy(
      reportDepartmentRows
        .map((item, index) => {
          const departmentName = toText(
            item.department_name || item.department
          ).trim();
          return {
            id: item.id || index + 1,
            value: departmentName,
            label: departmentName,
          };
        })
        .filter((item) => item.value),
      (item) => normalizeKey(item.value)
    );
    const requestRows = normalizeRequestRows(requestRes);
    const departmentsFromRequests =
      normalizeDepartmentOptionsFromRequests(requestRows);
    let departmentsFromOrgUnits = [];
    for (const endpoint of DEPARTMENT_APIS) {
      // eslint-disable-next-line no-await-in-loop
      const response = await safeCall(() =>
        callApi("get", endpoint, { isActive: true, page: 1, pageSize: 500 })
      );
      const normalized = normalizeDepartmentOptions(response);
      if (normalized.length > 0) {
        departmentsFromOrgUnits = normalized;
        break;
      }
    }
    const departments = mergeOptionLists(
      departmentsFromReports,
      departmentsFromRequests,
      departmentsFromOrgUnits
    );

    return {
      periods: [],
      departments,
      categories,
    };
  },

  async getReportData(reportType, filters = {}) {
    const params = buildReportParams(filters, reportType);
    const reportParams = {
      ...params,
      page: toNumber(params.page, 1),
      limit: toNumber(params.limit || params.pageSize, DEFAULT_PAGE_SIZE),
      pageSize: toNumber(params.pageSize || params.limit, DEFAULT_PAGE_SIZE),
    };
    const stockReportParams = {
      ...reportParams,
    };

    if (reportType === "inventory") {
      const [summaryRes, stockMovementRes] = await Promise.all([
        safeCall(() => getReportSummary(params)),
        safeCall(() => getStockMovementReport(stockReportParams)),
      ]);

      if (!stockMovementRes) {
        throw new Error(
          "Không lấy được dữ liệu chuẩn từ API báo cáo tồn kho (stock-movement)."
        );
      }

      const rows = applyRowFilters(
        reconcileInventoryBalanceRows(normalizeInventoryRows(stockMovementRes)),
        "inventory",
        filters
      );

      const summary = {
        ...extractSummary(stockMovementRes),
        ...extractSummary(summaryRes),
      };

      const computedOpening = rows.reduce(
        (sum, item) => sum + toNumber(item.opening_stock),
        0
      );
      const computedImport = rows.reduce(
        (sum, item) => sum + Math.abs(toNumber(item.receipt_qty)),
        0
      );
      const computedExport = rows.reduce(
        (sum, item) => sum + Math.abs(toNumber(item.issue_qty)),
        0
      );
      const computedAdjustment = rows.reduce(
        (sum, item) => sum + toNumber(item.adjustment),
        0
      );
      const computedClosing =
        computedOpening + computedImport - computedExport + computedAdjustment;
      const computedExportValue = rows.reduce(
        (sum, item) =>
          sum +
          toNumber(
            item.export_value,
            toNumber(item.cost, toNumber(item.issue_qty) * toNumber(item.price))
          ),
        0
      );

      summary.opening = computedOpening;
      summary.import = computedImport;
      summary.export = computedExport;
      summary.adjustment = computedAdjustment;
      summary.closing = computedClosing;
      summary.value = computedExportValue;
      summary.total_export_value = computedExportValue;

      return {
        rows,
        summary,
      };
    }

    const [
      summaryRes,
      stockMovementRes,
      departmentRes,
      quotaRes,
      costRes,
      inventoryRes,
      requestRes,
      pickerRes,
    ] = await Promise.all([
      safeCall(() => getReportSummary(params)),
      reportType === "inventory"
        ? safeCall(() => getStockMovementReport(stockReportParams))
        : Promise.resolve(null),
      reportType === "department" || reportType === "quota"
        ? safeCall(() => getByDepartmentReport(reportParams))
        : Promise.resolve(null),
      reportType === "quota"
        ? safeCall(() => getActualVsQuotaReport(reportParams))
        : Promise.resolve(null),
      reportType === "cost"
        ? safeCall(() => getCostSummaryReport(reportParams))
        : Promise.resolve(null),
      safeCall(() =>
        getInventoryList({
          category: params.category || params.categoryCode,
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          pageSize: DEFAULT_PAGE_SIZE,
        })
      ),
      safeCall(() =>
        getRequestList({
          page: 1,
          limit: 2000,
          department: params.department || params.departmentCode,
          fromDate: params.fromDate,
          toDate: params.toDate,
        })
      ),
      safeCall(() =>
        getInventoryPicker({
          category: params.category || params.categoryCode,
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
        })
      ),
    ]);

    const requestRows = normalizeRequestRows(requestRes);
    const pickerRows = normalizePickerRows(pickerRes);
    const stockMovementRows = reconcileInventoryBalanceRows(
      normalizeInventoryRows(stockMovementRes)
    );
    const stockMovementRequestFailed =
      reportType === "inventory" && !stockMovementRes;
    const departmentApiRows = normalizeDepartmentApiRows(
      departmentRes?.items || extractRows(departmentRes)
    );
    const quotaApiRows = normalizeQuotaApiRows(
      quotaRes?.items || extractRows(quotaRes)
    );
    const costApiRows = normalizeCostApiRows(
      costRes?.items || extractRows(costRes)
    );
    const inventoryRowsRaw = normalizeInventoryRows(inventoryRes);
    const inventoryRowsPriced = applyPriceToInventoryRows(
      inventoryRowsRaw,
      requestRows,
      pickerRows
    );
    const inventoryRowsFromRequests = applyMovementFromRequests(
      inventoryRowsPriced,
      requestRows
    );
    const inventoryRows = reconcileInventoryBalanceRows(
      applyLastTransactionFallback(inventoryRowsFromRequests, params)
    );
    const departmentRows = deriveDepartmentRows(requestRows, inventoryRows);
    const departmentRowsFromApi = deriveQuotaRows(departmentApiRows).map(
      (item) => ({
        ...item,
        requests: 0,
        qty: 0,
        cost: toNumber(item.actual, 0),
      })
    );
    const quotaDepartmentSource =
      departmentRows.length > 0 ? departmentRows : departmentRowsFromApi;
    const quotaRowsFromSummary = extractQuotaRowsFromSummary(summaryRes);

    let rows = [];
    if (reportType === "inventory") {
      rows = stockMovementRows;
    } else if (reportType === "department") {
      rows =
        departmentApiRows.length > 0
          ? mergeDepartmentRows(departmentApiRows, departmentRows)
          : departmentRows;
    } else if (reportType === "quota") {
      const quotaRowsFromInventory =
        deriveQuotaRowsFromInventory(inventoryRows);
      const mergedQuotaRows = mergeQuotaRowsWithDepartmentMetrics(
        quotaApiRows,
        quotaDepartmentSource
      );
      const mergedQuotaRowsFromSummary = mergeQuotaRowsWithDepartmentMetrics(
        quotaRowsFromSummary,
        quotaDepartmentSource
      );
      rows =
        mergedQuotaRowsFromSummary.length > 0
          ? mergedQuotaRowsFromSummary
          : mergedQuotaRows.length > 0
            ? mergedQuotaRows
            : departmentApiRows.length > 0
              ? deriveQuotaRows(departmentApiRows)
              : departmentRows.length > 0
                ? deriveQuotaRows(departmentRows)
                : quotaRowsFromInventory;
    } else {
      const derivedCostRows = deriveCostRows(inventoryRows, requestRows);
      const hasDepartmentFilter = !isAllValue(filters.department);
      const hasDepartmentDataFromCostApi = costApiRows.some((item) =>
        normalizeKey(item.department_name || item.department_code || "")
      );
      const shouldUseDerivedCostRows =
        costApiRows.length === 0 ||
        (hasDepartmentFilter && !hasDepartmentDataFromCostApi);

      rows = shouldUseDerivedCostRows ? derivedCostRows : costApiRows;
    }

    rows = applyRowFilters(rows, reportType, filters);

    // Ưu tiên dữ liệu tổng hợp từ API báo cáo; dữ liệu từ inventory/request chỉ dùng fallback.
    const summary = {
      ...extractSummary(requestRes),
      ...extractSummary(inventoryRes),
      ...extractSummary(departmentRes),
      ...extractSummary(quotaRes),
      ...extractSummary(costRes),
      ...extractSummary(stockMovementRes),
      ...extractSummary(summaryRes),
    };

    if (reportType === "inventory") {
      const computedOpening = rows.reduce(
        (sum, item) => sum + toNumber(item.opening_stock),
        0
      );
      const computedImport = rows.reduce(
        (sum, item) => sum + toNumber(item.receipt_qty),
        0
      );
      const computedExport = rows.reduce(
        (sum, item) => sum + toNumber(item.issue_qty),
        0
      );
      const computedAdjustment = rows.reduce(
        (sum, item) => sum + toNumber(item.adjustment),
        0
      );
      const computedClosing = rows.reduce(
        (sum, item) => sum + toNumber(item.closing_stock),
        0
      );
      const computedExportValue = rows.reduce(
        (sum, item) =>
          sum +
          toNumber(
            item.export_value,
            toNumber(item.cost, toNumber(item.issue_qty) * toNumber(item.price))
          ),
        0
      );

      summary.opening = computedOpening;
      summary.import = computedImport;
      summary.export = computedExport;
      summary.adjustment = computedAdjustment;
      summary.closing = computedClosing;
      summary.value = computedExportValue;
      summary.total_export_value = computedExportValue;
    }

    if (reportType === "department") {
      const computedRequests = rows.reduce(
        (sum, item) => sum + toNumber(item.requests),
        0
      );
      const computedItems = rows.reduce(
        (sum, item) => sum + toNumber(item.qty),
        0
      );
      const computedCost = rows.reduce(
        (sum, item) => sum + toNumber(item.cost),
        0
      );

      // Đảm bảo tính nhất quán: summary luôn được tính lại từ chính tập rows đã hiển thị.
      summary.total_requests = computedRequests;
      summary.total_items = computedItems;
      summary.total_cost = computedCost;
    }

    if (reportType === "quota") {
      const computedActual = rows.reduce(
        (sum, item) => sum + toNumber(item.actual),
        0
      );
      const computedQuota = rows.reduce(
        (sum, item) => sum + toNumber(item.quota),
        0
      );
      const computedRemain = computedQuota - computedActual;
      const computedSafeRatio =
        computedQuota > 0
          ? Number(((computedRemain / computedQuota) * 100).toFixed(1))
          : 0;
      const overQuotaDepartments = rows.filter(
        (item) => toNumber(item.actual) > toNumber(item.quota)
      ).length;
      const safeDepartments = rows.filter(
        (item) => toNumber(item.actual) <= toNumber(item.quota)
      ).length;

      summary.total_actual = computedActual;
      summary.total_quota = computedQuota;
      summary.remain = computedRemain;
      summary.safe_ratio = computedSafeRatio;
      summary.department_total = rows.length;
      summary.department_over_quota = overQuotaDepartments;
      summary.department_safe = safeDepartments;
    }

    if (reportType === "cost") {
      const computedTotal = rows.reduce(
        (sum, item) => sum + toSignedNumber(item.cost),
        0
      );
      const previousRange = resolvePreviousDateRange(filters);
      let previousTotal = 0;

      if (previousRange?.fromDate && previousRange?.toDate) {
        const previousParams = {
          ...params,
          fromDate: previousRange.fromDate,
          toDate: previousRange.toDate,
          period_month: Number(previousRange.fromDate.split("-")[1]),
          period_year: Number(previousRange.fromDate.split("-")[0]),
        };

        const [previousCostRes, previousSummaryRes] = await Promise.all([
          safeCall(() => getCostSummaryReport(previousParams)),
          safeCall(() => getReportSummary(previousParams)),
        ]);
        const previousSummary = {
          ...extractSummary(previousSummaryRes),
          ...extractSummary(previousCostRes),
        };
        const previousRows = normalizeCostApiRows(
          previousCostRes?.items || extractRows(previousCostRes)
        );
        const previousRowsFiltered = applyRowFilters(
          previousRows,
          "cost",
          filters
        );
        const previousRowsTotal = previousRowsFiltered.reduce(
          (sum, item) => sum + toSignedNumber(item.cost),
          0
        );

        previousTotal = previousRowsTotal;
        if (!Number.isFinite(previousTotal) || previousTotal <= 0)
          previousTotal = extractTotalCostCandidate(previousCostRes);
        if (!Number.isFinite(previousTotal) || previousTotal <= 0)
          previousTotal = extractTotalCostCandidate(previousSummaryRes);
        if (!Number.isFinite(previousTotal) || previousTotal <= 0)
          previousTotal = extractTotalCostCandidate(previousSummary);
        if (!Number.isFinite(previousTotal) || previousTotal <= 0) {
          previousTotal = extractRows(previousCostRes).reduce(
            (sum, item) =>
              sum +
              toSignedNumber(
                item.cost ||
                  item.total_cost ||
                  item.totalCost ||
                  item.total ||
                  item.amount ||
                  item.value
              ),
            0
          );
        }
        if (!Number.isFinite(previousTotal)) previousTotal = 0;
      }

      // Keep KPI summary connected with exactly the rows being displayed.
      summary.total = computedTotal;
      const summaryLastMonth = toNumber(summary.last_month);
      summary.last_month =
        previousTotal > 0
          ? previousTotal
          : summaryLastMonth > 0
            ? summaryLastMonth
            : 0;

      const totalCurrent = toNumber(summary.total);
      const totalPrevious = toNumber(summary.last_month);
      summary.has_previous = totalPrevious > 0;
      summary.trend =
        totalPrevious > 0
          ? Number(
              (((totalCurrent - totalPrevious) / totalPrevious) * 100).toFixed(
                1
              )
            )
          : 0;

      if (toNumber(summary.efficiency) <= 0) {
        summary.efficiency =
          totalPrevious > 0
            ? Number(
                Math.max(0, (1 - totalCurrent / totalPrevious) * 100).toFixed(1)
              )
            : 0;
      }
    }

    if (stockMovementRequestFailed) {
      throw new Error(
        "Không lấy được dữ liệu chuẩn từ API báo cáo tồn kho (stock-movement)."
      );
    }

    const hasAnySource =
      !!summaryRes ||
      !!stockMovementRes ||
      !!departmentRes ||
      !!quotaRes ||
      !!costRes ||
      inventoryRows.length > 0 ||
      requestRows.length > 0;
    if (!hasAnySource) {
      throw new Error("Không lấy được dữ liệu báo cáo từ API.");
    }

    return {
      rows,
      summary,
    };
  },

  async exportReport(reportType, format, filters = {}, activeTab = undefined) {
    const resolvedActiveTab = Number.isInteger(activeTab)
      ? activeTab
      : mapReportTypeToActiveTab(reportType);
    const params = {
      ...buildReportParams(filters, reportType),
      format,
      reportType: REPORT_TYPE_EXPORT_MAP[reportType] || "stock",
      tab: REPORT_TYPE_EXPORT_MAP[reportType] || "stock",
      activeTab: resolvedActiveTab,
    };

    const primary = await safeCall(() => exportReportFile(params));
    if (primary instanceof Blob) return primary;
    if (primary) return new Blob([primary]);

    throw new Error("Không tải được file export từ API.");
  },
};

export default officeSupplyReportService;
