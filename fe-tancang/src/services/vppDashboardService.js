import {
  getCostSummaryReport,
  getInventoryList,
  getReportSummary,
  getRequestDetail,
  getRequestList,
  getStockMovementReport,
} from "./vppService";
import { officeSupplyReportService } from "./vppOfficeSupplyReportService";

const DEPARTMENT_COLORS = [
  "#be185d",
  "#d97706",
  "#0d9488",
  "#7c3aed",
  "#2563eb",
  "#64748b",
  "#16a34a",
  "#e11d48",
  "#0ea5e9",
  "#22c55e",
];

const CATEGORY_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0d9488",
  "#d97706",
  "#16a34a",
  "#94a3b8",
];

const STATUS = {
  FINISHED: new Set([
    "FINISHED",
    "COMPLETED",
    "completed",
    "finished",
    "ISSUED",
    "issued",
  ]),
  PENDING: new Set([
    "PENDING",
    "WAITING_APPROVAL",
    "waiting_approval",
    "PENDING_APPROVAL",
    "pending_approval",
    "pending_dept_approval",
    "pending_hc_approval",
    "DRAFT",
    "draft",
  ]),
  WAIT_ISSUE: new Set([
    "APPROVED",
    "approved",
    "pending_issue",
    "PENDING_ISSUE",
    "WAITING_ISSUE",
    "waiting_issue",
    "PARTIAL_ISSUED",
    "partial_issued",
  ]),
  REJECTED: new Set(["REJECTED", "rejected"]),
};

const PERIOD_MAP = {
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
};

const DASHBOARD_CACHE_TTL_MS = 60 * 1000;
const dashboardCache = new Map();
const dashboardInflight = new Map();

const EMPTY_DASHBOARD = {
  kpis: {
    cost: { value: 0, growthPercent: 0, previousValue: 0, budgetValue: 0 },
    requests: { total: 0, issued: 0, pending: 0, growthPercent: 0 },
    lowStock: { total: 0, almostOut: 0, outOfStock: 0 },
    inventory: {
      totalQuantity: 0,
      totalItems: 0,
      totalCategories: 0,
      growthPercent: 0,
    },
    overdue: { total: 0, avgProcessingDays: 0 },
  },
  monthlyCost: [],
  costByDepartment: [],
  costByCategory: [],
  topItems: [],
  alerts: [],
  usageVsQuota: [],
  recentRequests: [],
};

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toText = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const text = String(value);
  return text || fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const extractData = (response) => {
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
  const source = extractData(payload);
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.items)) return source.items;
  if (Array.isArray(source?.rows)) return source.rows;
  if (Array.isArray(source?.content)) return source.content;
  if (Array.isArray(source?.list)) return source.list;
  if (Array.isArray(source?.data)) return source.data;
  return [];
};

const extractSummary = (payload) => {
  const source = extractData(payload);
  if (!source || typeof source !== "object") return {};
  if (source.summary && typeof source.summary === "object")
    return source.summary;
  if (source.kpis && typeof source.kpis === "object") return source.kpis;
  if (source.totals && typeof source.totals === "object") return source.totals;
  return source;
};

const safeCall = async (fn, options = {}) => {
  const timeoutMs = Math.max(0, toNumber(options.timeoutMs, 0));

  try {
    if (timeoutMs <= 0) {
      return await fn();
    }

    let timeoutId = null;
    const timeoutPromise = new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve(null), timeoutMs);
    });

    const requestPromise = Promise.resolve()
      .then(fn)
      .catch(() => null);

    const result = await Promise.race([requestPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    return null;
  }
};

const mapWithConcurrency = async (items = [], limit = 6, mapper) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const safeLimit = Math.max(1, Math.min(limit, items.length));
  const results = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: safeLimit }, () =>
    (async () => {
      while (currentIndex < items.length) {
        const index = currentIndex;
        currentIndex += 1;
        // eslint-disable-next-line no-await-in-loop
        results[index] = await mapper(items[index], index);
      }
    })()
  );

  await Promise.all(workers);
  return results;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateRelative = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  const diffDay = Math.round((today - target) / (24 * 60 * 60 * 1000));

  if (diffDay === 0) return formatTimeLabel(date);
  if (diffDay === 1) return "Hôm qua";
  return formatDate(date);
};

const normalizePeriod = (period) => {
  const normalized = toText(period).trim().toLowerCase();
  const periodAlias = {
    tuần: "week",
    tháng: "month",
    quý: "quarter",
    năm: "year",
  };

  return PERIOD_MAP[normalized] || periodAlias[normalized] || "month";
};

const shiftByPeriod = (date, periodType, offset) => {
  const d = new Date(date);
  if (periodType === "week") {
    d.setDate(d.getDate() + offset * 7);
  } else if (periodType === "quarter") {
    d.setMonth(d.getMonth() + offset * 3);
  } else if (periodType === "year") {
    d.setFullYear(d.getFullYear() + offset);
  } else {
    d.setMonth(d.getMonth() + offset);
  }
  return d;
};

const getPeriodRange = (periodType = "month", offset = 0) => {
  const normalized = normalizePeriod(periodType);
  const base = shiftByPeriod(new Date(), normalized, offset);

  let from = new Date(base);
  let to = new Date(base);

  if (normalized === "week") {
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    from = new Date(base);
    from.setDate(base.getDate() + diffToMonday);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  } else if (normalized === "quarter") {
    const quarterStartMonth = Math.floor(base.getMonth() / 3) * 3;
    from = new Date(base.getFullYear(), quarterStartMonth, 1);
    to = new Date(base.getFullYear(), quarterStartMonth + 3, 0);
  } else if (normalized === "year") {
    from = new Date(base.getFullYear(), 0, 1);
    to = new Date(base.getFullYear(), 11, 31);
  } else {
    from = new Date(base.getFullYear(), base.getMonth(), 1);
    to = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  }

  return {
    fromDate: formatDate(from),
    toDate: formatDate(to),
    from,
    to,
    periodType: normalized,
  };
};

const makeRecentMonthKeys = (count = 6) => {
  const now = new Date();
  const keys = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    keys.push({
      key,
      label: `T${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
  }

  return keys;
};

const statusIn = (status, set) => set.has(toText(status));

const getRequestIdKey = (request = {}) => {
  if (request.id === undefined || request.id === null) return "";
  return String(request.id);
};

const normalizeInventoryItems = (payload) =>
  extractRows(payload).map((item, index) => ({
    id: item.id || item.product_id || item.productId || index + 1,
    code: toText(
      item.product_code ||
        item.productCode ||
        item.item_code ||
        item.itemCode ||
        item.code ||
        ""
    ),
    name: toText(
      item.product_name ||
        item.productName ||
        item.item_name ||
        item.itemName ||
        item.name ||
        ""
    ),
    category: toText(
      item.category || item.category_name || item.categoryName || "Khác"
    ),
    quantity: toNumber(
      item.quantity || item.closing_stock || item.closingStock || 0
    ),
    minStock: toNumber(
      item.min_stock ||
        item.minStock ||
        item.min_stock_quantity ||
        item.minStockQuantity,
      0
    ),
    status: toText(item.stock_status || item.stockStatus || ""),
    price: toNumber(
      item.price ||
        item.unit_price ||
        item.unitPrice ||
        item.unit_cost ||
        item.reference_price ||
        item.referencePrice ||
        item.standard_cost ||
        item.standardCost,
      0
    ),
    totalValue: toNumber(
      item.total_value || item.totalValue || item.stock_value,
      0
    ),
    unit: toText(item.unit || item.unit_name || item.unitName || ""),
  }));

const normalizeRequestRows = (payload) =>
  extractRows(payload).map((item, index) => ({
    id: item.id || item.request_id || item.requestId || index + 1,
    code: toText(item.request_number || item.requestCode || item.code || ""),
    requester: toText(
      item.requester_name ||
        item.requester ||
        item.created_by ||
        item.createdBy ||
        ""
    ),
    department: toText(
      item.department_name || item.departmentName || item.department || ""
    ),
    status: toText(item.status || ""),
    estimatedValue: toNumber(
      item.estimated_value ||
        item.estimatedValue ||
        item.total_cost ||
        item.totalCost ||
        0
    ),
    totalItems: toNumber(
      item.total_items ||
        item.totalItems ||
        item.item_count ||
        item.items_count ||
        0
    ),
    totalQuantity: toNumber(
      item.total_quantity ||
        item.totalQuantity ||
        item.quantity ||
        item.qty ||
        0
    ),
    createdAt: item.created_at || item.createdAt || null,
    neededDate: item.need_date || item.needed_date || item.neededDate || null,
    updatedAt: item.updated_at || item.updatedAt || null,
    items: toArray(item.items || item.details || item.lines),
  }));

const normalizeRequestDetailItems = (items = [], request = {}) => {
  const requestIdKey = getRequestIdKey(request);
  const requestCode = toText(
    request.code || request.requestCode || request.request_code || ""
  );

  return toArray(items).map((item, index) => {
    const quantity = toNumber(
      item.actual_quantity ||
        item.approved_quantity ||
        item.requested_quantity ||
        item.quantity ||
        item.qty,
      0
    );
    const unitPrice = toNumber(
      item.price ||
        item.unit_price ||
        item.unitPrice ||
        item.reference_price ||
        item.referencePrice ||
        0
    );
    const lineValue = toNumber(
      item.total || item.total_cost || item.totalCost || item.amount,
      quantity * unitPrice
    );

    return {
      id: item.id || `${request.id || "req"}-${index}`,
      code: toText(
        item.product_code ||
          item.productCode ||
          item.item_code ||
          item.itemCode ||
          item.code ||
          ""
      ),
      name: toText(
        item.product_name ||
          item.productName ||
          item.item_name ||
          item.itemName ||
          item.name ||
          ""
      ),
      category: toText(
        item.category_name || item.categoryName || item.category || "Khác"
      ),
      unit: toText(item.unit || item.unit_name || item.unitName || ""),
      quantity,
      unitPrice,
      value: lineValue,
      department: toText(request.department),
      requestId: request.id || null,
      requestIdKey,
      requestCode,
    };
  });
};

const buildRequestStatusSummary = (requests = []) =>
  requests.reduce(
    (acc, item) => {
      if (statusIn(item.status, STATUS.FINISHED)) {
        acc.finished += 1;
      } else if (statusIn(item.status, STATUS.WAIT_ISSUE)) {
        acc.waitIssue += 1;
      } else if (statusIn(item.status, STATUS.REJECTED)) {
        acc.rejected += 1;
      } else if (statusIn(item.status, STATUS.PENDING)) {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, waitIssue: 0, finished: 0, rejected: 0 }
  );

const sumRequestCost = (requests = []) =>
  requests.reduce((sum, request) => sum + toNumber(request.estimatedValue), 0);

const buildRequestValueMap = (lineItems = []) => {
  const map = new Map();

  lineItems.forEach((item) => {
    const key = toText(item.requestIdKey || item.requestId);
    if (!key) return;
    map.set(key, toNumber(map.get(key), 0) + toNumber(item.value));
  });

  return map;
};

const applyResolvedRequestValues = (
  requests = [],
  requestValueMap = new Map()
) =>
  requests.map((request) => {
    const key = getRequestIdKey(request);
    const derivedValue = key ? toNumber(requestValueMap.get(key), 0) : 0;
    const estimatedValue = toNumber(request.estimatedValue, 0);
    const resolvedValue = estimatedValue > 0 ? estimatedValue : derivedValue;

    return {
      ...request,
      estimatedValue: resolvedValue,
    };
  });

const dedupeRequestsById = (requests = []) => {
  const seen = new Set();
  const result = [];

  requests.forEach((request, index) => {
    const key = getRequestIdKey(request) || `__no_id_${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(request);
  });

  return result;
};

const pickLineItemsForRequests = (lineItems = [], requests = []) => {
  const requestKeys = new Set(
    requests.map((request) => getRequestIdKey(request)).filter(Boolean)
  );
  if (requestKeys.size === 0) return [];
  return lineItems.filter(
    (item) => item.requestIdKey && requestKeys.has(item.requestIdKey)
  );
};

const calcGrowth = (current, previous) => {
  const c = toNumber(current);
  const p = toNumber(previous);
  if (p <= 0) return c > 0 ? 100 : 0;
  return Number((((c - p) / p) * 100).toFixed(1));
};

const bucketCostByMonth = (requests = [], monthKeys = []) => {
  const map = new Map(monthKeys.map((item) => [item.key, 0]));

  requests.forEach((request) => {
    const date = request.createdAt ? new Date(request.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) return;
    map.set(key, toNumber(map.get(key)) + toNumber(request.estimatedValue));
  });

  return monthKeys.map((item) => ({
    period: item.label,
    value: toNumber(map.get(item.key), 0),
  }));
};

const aggregateCostByDepartment = (requests = []) => {
  const map = new Map();

  requests.forEach((request) => {
    const department = toText(request.department || "Chưa rõ phòng ban");
    const current = map.get(department) || 0;
    map.set(department, current + toNumber(request.estimatedValue));
  });

  return Array.from(map.entries())
    .map(([department, value], index) => ({
      department,
      value,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
};

const aggregateCostByCategory = (lineItems = [], inventoryItems = []) => {
  const map = new Map();

  const sourceItems = lineItems.length
    ? lineItems
    : inventoryItems.map((item) => ({
        category: item.category,
        value: toNumber(
          item.totalValue,
          toNumber(item.quantity) * toNumber(item.price)
        ),
      }));

  sourceItems.forEach((item) => {
    const category = toText(item.category || "Khác");
    const value = toNumber(item.value);
    const current = map.get(category) || 0;
    map.set(category, current + value);
  });

  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(map.entries())
    .map(([name, value], index) => ({
      name,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
};

const aggregateTopItems = (lineItems = [], inventoryItems = []) => {
  const map = new Map();

  const sourceItems = lineItems.length
    ? lineItems
    : inventoryItems.map((item) => ({
        code: item.code,
        name: item.name,
        unit: item.unit,
        quantity: toNumber(item.quantity),
        value: toNumber(
          item.totalValue,
          toNumber(item.quantity) * toNumber(item.price)
        ),
      }));

  sourceItems.forEach((item) => {
    const key = toText(item.code || item.name);
    if (!key) return;

    const quantity = toNumber(item.quantity);
    const value = toNumber(item.value, quantity * toNumber(item.unitPrice));
    const current = map.get(key) || {
      code: toText(item.code || ""),
      name: toText(item.name || ""),
      unit: toText(item.unit || ""),
      quantity: 0,
      value: 0,
      icon: "*",
    };

    current.quantity += quantity;
    current.value += value;
    map.set(key, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7);
};

const deriveUsageVsQuota = (departmentCosts = [], totalBudget = 0) => {
  const totalCost = departmentCosts.reduce(
    (sum, item) => sum + toNumber(item.value),
    0
  );

  return departmentCosts.slice(0, 7).map((item) => {
    const actual = Math.round(toNumber(item.value) / 1000000);
    const share = totalCost > 0 ? toNumber(item.value) / totalCost : 0;
    const quotaFromBudget = Math.round(
      (toNumber(totalBudget) * share) / 1000000
    );
    const quota = quotaFromBudget > 0 ? quotaFromBudget : actual;

    return {
      department: item.department,
      actual,
      quota,
    };
  });
};

const mapRecentRequests = (requests = []) => {
  const sorted = [...requests].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return sorted.slice(0, 5).map((request) => {
    let status = "Chờ duyệt";
    let statusColor = "#d97706";
    let statusBg = "#fef3c7";

    if (statusIn(request.status, STATUS.FINISHED)) {
      status = "Đã cấp phát";
      statusColor = "#16a34a";
      statusBg = "#dcfce7";
    } else if (statusIn(request.status, STATUS.WAIT_ISSUE)) {
      status = "Chờ cấp";
      statusColor = "#2563eb";
      statusBg = "#dbeafe";
    } else if (statusIn(request.status, STATUS.REJECTED)) {
      status = "Từ chối";
      statusColor = "#dc2626";
      statusBg = "#fee2e2";
    }

    return {
      id: request.id || request.code,
      code: request.code,
      requester: request.requester,
      department: request.department,
      status,
      statusColor,
      statusBg,
      time: formatDateRelative(request.createdAt),
    };
  });
};

const buildAlerts = ({ lowStock, outOfStock, pending, waitIssue, overdue }) => {
  const alerts = [];

  if (outOfStock > 0) {
    alerts.push({
      icon: "!",
      text: `${outOfStock} mặt hàng đã hết tồn kho`,
      status: "Hết kho",
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
      iconBg: "#fee2e2",
    });
  }

  if (lowStock > 0) {
    alerts.push({
      icon: "!",
      text: `${lowStock} mặt hàng dưới ngưỡng tối thiểu`,
      status: "Sắp hết",
      badgeColor: "#d97706",
      badgeBg: "#fef3c7",
      iconBg: "#fef3c7",
    });
  }

  if (overdue > 0) {
    alerts.push({
      icon: "!",
      text: `${overdue} phiếu quá hạn cấp phát`,
      status: "Quá hạn",
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
      iconBg: "#fee2e2",
    });
  }

  if (pending > 0) {
    alerts.push({
      icon: "!",
      text: `${pending} phiếu đang chờ duyệt`,
      status: "Chờ duyệt",
      badgeColor: "#d97706",
      badgeBg: "#fef3c7",
      iconBg: "#fef3c7",
    });
  }

  if (waitIssue > 0) {
    alerts.push({
      icon: "!",
      text: `${waitIssue} phiếu chờ cấp phát`,
      status: "Chờ cấp",
      badgeColor: "#2563eb",
      badgeBg: "#dbeafe",
      iconBg: "#dbeafe",
    });
  }

  return alerts;
};

const averageOverdueDays = (requests = []) => {
  const now = new Date().getTime();
  const overdueDays = requests
    .map((item) => {
      const need = item.neededDate ? new Date(item.neededDate).getTime() : null;
      if (!need || Number.isNaN(need)) return null;
      if (need >= now) return null;
      return (now - need) / (24 * 60 * 60 * 1000);
    })
    .filter((value) => value !== null);

  if (overdueDays.length === 0) return 0;
  return Number(
    (
      overdueDays.reduce((sum, value) => sum + value, 0) / overdueDays.length
    ).toFixed(1)
  );
};

const collectRequestLineItems = async (requests = [], options = {}) => {
  const maxRequests = Math.max(0, toNumber(options.maxRequests, 120));
  const fetchDetails = Boolean(options.fetchDetails);
  const detailTimeoutMs = Math.max(
    1500,
    toNumber(options.detailTimeoutMs, 4000)
  );
  const directItems = [];
  const needFetch = [];

  requests.forEach((request) => {
    const rawItems = toArray(request.items);
    if (rawItems.length > 0) {
      directItems.push(...normalizeRequestDetailItems(rawItems, request));
    } else if (request.id) {
      needFetch.push(request);
    }
  });

  if (!fetchDetails || maxRequests === 0 || needFetch.length === 0) {
    return directItems;
  }

  const fetched = await mapWithConcurrency(
    needFetch.slice(0, maxRequests),
    5,
    async (request) => {
      const detail = await safeCall(() => getRequestDetail(request.id), {
        timeoutMs: detailTimeoutMs,
      });
      if (!detail) return [];
      const payload = extractData(detail) || {};
      const items = toArray(payload.items || payload.details || payload.lines);
      return normalizeRequestDetailItems(items, request);
    }
  );

  return [...directItems, ...fetched.flat()];
};

const getInventoryStats = (inventoryItems = [], summary = {}) => {
  const totalItems = getSummaryNumber(
    summary,
    [
      "total_items",
      "totalItems",
      "item_count",
      "total_products",
      "products_total",
    ],
    inventoryItems.length
  );
  const totalQuantity = inventoryItems.reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0
  );
  const categories = new Set(
    inventoryItems.map((item) => toText(item.category)).filter(Boolean)
  );

  const outOfStock = getSummaryNumber(
    summary,
    ["out_of_stock", "outOfStock", "out_of_stock_items", "outOfStockItems"],
    inventoryItems.filter((item) => toNumber(item.quantity) <= 0).length
  );

  const lowStock = getSummaryNumber(
    summary,
    ["low_stock", "lowStock", "low_stock_items", "lowStockItems"],
    inventoryItems.filter(
      (item) =>
        toNumber(item.quantity) > 0 &&
        toNumber(item.quantity) <= toNumber(item.minStock)
    ).length
  );

  return {
    totalItems,
    totalQuantity,
    totalCategories: categories.size,
    outOfStock,
    lowStock,
  };
};

const getBudgetValue = (reportSummary = {}, totalCost = 0) => {
  const budget = toNumber(
    reportSummary.budgetValue ||
      reportSummary.budget ||
      reportSummary.total_budget ||
      reportSummary.totalBudget ||
      reportSummary.quota ||
      0
  );

  if (budget > 0) return budget;
  if (totalCost > 0) return Math.round(totalCost * 1.15);
  return 0;
};

const buildCustomReportFilters = (range = {}) => ({
  periodType: "custom",
  period: "custom",
  fromDate: range.fromDate,
  toDate: range.toDate,
  department: "All",
  category: "All",
});

const buildMonthRangeFromKey = (year, month) => {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return {
    fromDate: formatDate(from),
    toDate: formatDate(to),
  };
};

const aggregateCostByCategoryFromRows = (rows = []) => {
  const map = new Map();
  rows.forEach((item) => {
    const category = toText(
      item.category_name || item.categoryName || item.category || "Khác"
    );
    const value = toNumber(
      item.cost || item.total || item.total_cost || item.totalCost || item.value
    );
    map.set(category, toNumber(map.get(category), 0) + value);
  });

  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(map.entries())
    .map(([name, value], index) => ({
      name,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
};

const aggregateTopItemsFromCostRows = (rows = []) =>
  rows
    .map((item) => ({
      code: toText(item.code || item.item_code || item.product_code || ""),
      name: toText(item.name || item.item_name || item.product_name || "-"),
      unit: toText(item.unit || item.unit_name || item.unitName || ""),
      quantity: toNumber(item.qty || item.quantity || 0),
      value: toNumber(
        item.cost ||
          item.total ||
          item.total_cost ||
          item.totalCost ||
          item.value
      ),
      icon: "*",
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7);

const sumRowsByKeys = (rows = [], valueKeys = []) =>
  toArray(rows).reduce((sum, row) => {
    const value = valueKeys.reduce((picked, key) => {
      if (picked > 0) return picked;
      return toNumber(row?.[key], 0);
    }, 0);
    return sum + value;
  }, 0);

const pickFirstFiniteNumber = (values = [], fallback = 0) => {
  for (let index = 0; index < values.length; index += 1) {
    const parsed = Number(values[index]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return toNumber(fallback, 0);
};

const getSummaryNumber = (summary = {}, keys = [], fallback = 0) =>
  pickFirstFiniteNumber(
    keys.map((key) =>
      summary && typeof summary === "object" ? summary[key] : undefined
    ),
    fallback
  );

const mapKpisToOverview = (kpis = {}) => ({
  total_cost: toNumber(kpis?.cost?.value, 0),
  cost_variation: toNumber(kpis?.cost?.growthPercent, 0),
  budget_value: toNumber(kpis?.cost?.budgetValue, 0),
  previous_cost: toNumber(kpis?.cost?.previousValue, 0),
  pending_requests: toNumber(kpis?.requests?.total, 0),
  issued_requests: toNumber(kpis?.requests?.issued, 0),
  request_waiting: toNumber(kpis?.requests?.pending, 0),
  request_variation: toNumber(kpis?.requests?.growthPercent, 0),
  low_stock_items: toNumber(kpis?.lowStock?.total, 0),
  almost_out_of_stock: toNumber(kpis?.lowStock?.almostOut, 0),
  out_of_stock: toNumber(kpis?.lowStock?.outOfStock, 0),
  total_inventory_items: toNumber(kpis?.inventory?.totalQuantity, 0),
  inventory_item_count: toNumber(kpis?.inventory?.totalItems, 0),
  inventory_groups: toNumber(kpis?.inventory?.totalCategories, 0),
  inventory_variation: toNumber(kpis?.inventory?.growthPercent, 0),
  overdue_issues: toNumber(kpis?.overdue?.total, 0),
  avg_processing_days: toNumber(kpis?.overdue?.avgProcessingDays, 0),
});

export const dashboardService = {
  async getDashboardData(period = "month") {
    const periodKey = normalizePeriod(period);
    const nowTs = Date.now();
    const cached = dashboardCache.get(periodKey);
    if (cached && cached.expiresAt > nowTs) {
      return cached.data;
    }

    if (dashboardInflight.has(periodKey)) {
      return dashboardInflight.get(periodKey);
    }

    const loadPromise = (async () => {
      const currentRange = getPeriodRange(periodKey, 0);
      const previousRange = getPeriodRange(periodKey, -1);
      const monthKeys = makeRecentMonthKeys(6);

      const oldestMonth = monthKeys[0];
      const oldestRange = {
        fromDate: `${oldestMonth.year}-${String(oldestMonth.month).padStart(2, "0")}-01`,
        toDate: currentRange.toDate,
      };

      const [
        inventoryRes,
        currentReqRes,
        previousReqRes,
        recentReqRes,
        stockReportRes,
        departmentReportRes,
        quotaReportRes,
        currentCostReportRes,
        previousCostReportRes,
      ] = await Promise.all([
        safeCall(
          () => getInventoryList({ page: 1, limit: 500, pageSize: 500 }),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            getRequestList({
              page: 1,
              limit: 5000,
              fromDate: currentRange.fromDate,
              toDate: currentRange.toDate,
            }),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            getRequestList({
              page: 1,
              limit: 5000,
              fromDate: previousRange.fromDate,
              toDate: previousRange.toDate,
            }),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            getRequestList({
              page: 1,
              limit: 5000,
              fromDate: oldestRange.fromDate,
              toDate: oldestRange.toDate,
            }),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            officeSupplyReportService.getReportData(
              "inventory",
              buildCustomReportFilters(currentRange)
            ),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            officeSupplyReportService.getReportData(
              "department",
              buildCustomReportFilters(currentRange)
            ),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            officeSupplyReportService.getReportData(
              "quota",
              buildCustomReportFilters(currentRange)
            ),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            officeSupplyReportService.getReportData(
              "cost",
              buildCustomReportFilters(currentRange)
            ),
          { timeoutMs: 12000 }
        ),
        safeCall(
          () =>
            officeSupplyReportService.getReportData(
              "cost",
              buildCustomReportFilters(previousRange)
            ),
          { timeoutMs: 12000 }
        ),
      ]);

      const inventoryItemsFromInventoryApi =
        normalizeInventoryItems(inventoryRes);
      const inventoryItemsFromReportApi =
        normalizeInventoryItems(stockReportRes);
      const inventoryItems =
        inventoryItemsFromInventoryApi.length > 0
          ? inventoryItemsFromInventoryApi
          : inventoryItemsFromReportApi;
      const currentRequests = normalizeRequestRows(currentReqRes);
      const previousRequests = normalizeRequestRows(previousReqRes);
      const recentRequestsForMonths = normalizeRequestRows(recentReqRes);
      const allRequestRows = dedupeRequestsById([
        ...currentRequests,
        ...previousRequests,
        ...recentRequestsForMonths,
      ]);
      const requestLineItemsAll = await collectRequestLineItems(
        allRequestRows,
        {
          maxRequests: 0,
          fetchDetails: false,
          detailTimeoutMs: 2500,
        }
      );
      const requestValueMap = buildRequestValueMap(requestLineItemsAll);
      const currentRequestsResolved = applyResolvedRequestValues(
        currentRequests,
        requestValueMap
      );
      const previousRequestsResolved = applyResolvedRequestValues(
        previousRequests,
        requestValueMap
      );
      const recentRequestsResolved = applyResolvedRequestValues(
        recentRequestsForMonths,
        requestValueMap
      );
      const requestLineItems = pickLineItemsForRequests(
        requestLineItemsAll,
        currentRequestsResolved
      );

      const inventorySummary = {
        ...extractSummary(stockReportRes),
        ...extractSummary(inventoryRes),
      };
      const quotaSummary = extractSummary(quotaReportRes);
      const currentCostSummary = extractSummary(currentCostReportRes);
      const previousCostSummary = extractSummary(previousCostReportRes);
      const departmentRows = toArray(departmentReportRes?.rows);
      const quotaRows = toArray(quotaReportRes?.rows);
      const costRows = toArray(currentCostReportRes?.rows);
      const previousCostRows = toArray(previousCostReportRes?.rows);

      const inventoryStats = getInventoryStats(
        inventoryItems,
        inventorySummary
      );
      const requestStatusSummary = buildRequestStatusSummary(
        currentRequestsResolved
      );
      const previousRequestStatusSummary = buildRequestStatusSummary(
        previousRequestsResolved
      );

      const totalCostCurrent = getSummaryNumber(
        currentCostSummary,
        ["total", "total_cost", "totalCost", "cost"],
        sumRowsByKeys(costRows, ["cost", "total", "total_cost", "value"])
      );
      const totalCostPrevious = getSummaryNumber(
        previousCostSummary,
        ["total", "total_cost", "totalCost", "cost"],
        sumRowsByKeys(previousCostRows, [
          "cost",
          "total",
          "total_cost",
          "value",
        ])
      );

      const requestTotalCurrentFromSummary = getSummaryNumber(
        currentCostSummary,
        ["total_requests", "totalRequests", "request_total", "requests"],
        0
      );
      const requestTotalPreviousFromSummary = getSummaryNumber(
        previousCostSummary,
        ["total_requests", "totalRequests", "request_total", "requests"],
        0
      );

      const requestPendingFromSummary = getSummaryNumber(
        currentCostSummary,
        ["pending_requests", "request_waiting", "pending"],
        0
      );
      const requestIssuedFromSummary = getSummaryNumber(
        currentCostSummary,
        [
          "issued_requests",
          "completed_requests",
          "finished_requests",
          "approved_requests",
        ],
        0
      );
      const requestWaitIssueFromSummary = getSummaryNumber(
        currentCostSummary,
        [
          "wait_issue_requests",
          "waiting_issue_requests",
          "pending_issue_requests",
        ],
        0
      );

      const requestCountCurrentFromList =
        requestStatusSummary.finished +
        requestStatusSummary.pending +
        requestStatusSummary.waitIssue;
      const requestCountPreviousFromList =
        previousRequestStatusSummary.finished +
        previousRequestStatusSummary.pending +
        previousRequestStatusSummary.waitIssue;

      const hasCurrentSummaryNumbers =
        requestTotalCurrentFromSummary > 0 ||
        requestPendingFromSummary > 0 ||
        requestIssuedFromSummary > 0 ||
        requestWaitIssueFromSummary > 0;
      const hasPreviousSummaryNumbers = requestTotalPreviousFromSummary > 0;

      const requestPendingCurrent = hasCurrentSummaryNumbers
        ? requestPendingFromSummary
        : requestStatusSummary.pending;
      const requestIssuedCurrent = hasCurrentSummaryNumbers
        ? requestIssuedFromSummary
        : requestStatusSummary.finished;
      const requestWaitIssueCurrent = hasCurrentSummaryNumbers
        ? requestWaitIssueFromSummary
        : requestStatusSummary.waitIssue;

      const requestCountCurrent = hasCurrentSummaryNumbers
        ? pickFirstFiniteNumber(
            [
              requestTotalCurrentFromSummary,
              requestIssuedCurrent +
                requestPendingCurrent +
                requestWaitIssueCurrent,
            ],
            0
          )
        : requestCountCurrentFromList;
      const requestCountPrevious = hasPreviousSummaryNumbers
        ? requestTotalPreviousFromSummary
        : requestCountPreviousFromList;

      const quotaFromSummary = getSummaryNumber(
        quotaSummary,
        ["total_quota", "quota", "budget", "totalBudget", "total_budget"],
        0
      );
      const quotaFromRows = quotaRows.reduce(
        (sum, item) => sum + toNumber(item.quota),
        0
      );
      const budgetValue =
        quotaFromSummary > 0
          ? quotaFromSummary
          : getBudgetValue({ budget: quotaFromRows }, totalCostCurrent);

      let monthlyDistribution = bucketCostByMonth(
        recentRequestsResolved,
        monthKeys
      );
      const hasMonthlyDataFromRequests = monthlyDistribution.some(
        (item) => toNumber(item.value) > 0
      );

      if (!hasMonthlyDataFromRequests) {
        const monthlyCostFromReports = await mapWithConcurrency(
          monthKeys,
          3,
          async (monthItem) => {
            const monthRange = buildMonthRangeFromKey(
              monthItem.year,
              monthItem.month
            );
            const monthReport = await safeCall(
              () =>
                officeSupplyReportService.getReportData(
                  "cost",
                  buildCustomReportFilters(monthRange)
                ),
              { timeoutMs: 12000 }
            );
            const monthSummary = extractSummary(monthReport);
            const monthRows = toArray(monthReport?.rows);
            const monthValue = getSummaryNumber(
              monthSummary,
              ["total", "total_cost", "totalCost", "cost"],
              sumRowsByKeys(monthRows, ["cost", "total", "total_cost", "value"])
            );
            return {
              period: monthItem.label,
              value: monthValue,
            };
          }
        );

        monthlyDistribution = monthlyCostFromReports;
      }

      const monthlyCost = monthlyDistribution.map((item) => ({
        period: item.period,
        distribution: toNumber(item.value),
        extra: 0,
        budget: budgetValue,
      }));

      const costByDepartmentRows = departmentRows
        .map((item) => ({
          department: toText(
            item.department_name || item.department || "Unknown department"
          ),
          value: toNumber(item.cost),
        }))
        .filter((item) => item.department);
      const costByDepartmentRowsFromQuota = quotaRows
        .map((item) => ({
          department: toText(
            item.department_name ||
              item.department ||
              item.dept ||
              "Unknown department"
          ),
          value: toNumber(
            item.actual ??
              item.actual_cost ??
              item.actualCost ??
              item.cost ??
              item.value,
            0
          ),
        }))
        .filter((item) => item.department && item.value > 0);
      const costByDepartment = (
        costByDepartmentRows.length > 0
          ? costByDepartmentRows
          : costByDepartmentRowsFromQuota.length > 0
            ? costByDepartmentRowsFromQuota
            : aggregateCostByDepartment(currentRequestsResolved)
      )
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
          ...item,
          color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
        }));

      const costByCategory =
        costRows.length > 0
          ? aggregateCostByCategoryFromRows(costRows)
          : aggregateCostByCategory(requestLineItems, inventoryItems);
      const topItems =
        costRows.length > 0
          ? aggregateTopItemsFromCostRows(costRows)
          : aggregateTopItems(requestLineItems, inventoryItems);

      const overdueRequests = currentRequestsResolved.filter((request) => {
        if (!request.neededDate) return false;
        if (
          statusIn(request.status, STATUS.FINISHED) ||
          statusIn(request.status, STATUS.REJECTED)
        )
          return false;
        const needed = new Date(request.neededDate).getTime();
        if (!Number.isFinite(needed)) return false;
        return needed < Date.now();
      });
      const overdueTotal =
        overdueRequests.length > 0 || currentRequestsResolved.length > 0
          ? overdueRequests.length
          : getSummaryNumber(
              currentCostSummary,
              ["overdue_requests", "overdue_issues", "overdue"],
              0
            );
      const overdueAvgProcessingDays =
        overdueRequests.length > 0
          ? averageOverdueDays(overdueRequests)
          : getSummaryNumber(
              currentCostSummary,
              ["avg_processing_days", "average_processing_days"],
              0
            );

      const alerts = buildAlerts({
        lowStock: inventoryStats.lowStock,
        outOfStock: inventoryStats.outOfStock,
        pending: requestPendingCurrent,
        waitIssue: requestWaitIssueCurrent,
        overdue: overdueTotal,
      });

      const usageVsQuota =
        quotaRows.length > 0
          ? quotaRows.map((item) => {
              const actualRaw = toNumber(
                item.actual ??
                  item.actual_cost ??
                  item.actualCost ??
                  item.used ??
                  item.value ??
                  item.cost,
                0
              );
              const quotaRaw = toNumber(
                item.quota ??
                  item.quota_cost ??
                  item.quotaCost ??
                  item.limit ??
                  item.target ??
                  item.budget,
                0
              );
              const actual = Math.round(actualRaw / 1000000);
              const quota = Math.round(
                (quotaRaw > 0 ? quotaRaw : actualRaw) / 1000000
              );

              return {
                department: toText(
                  item.department_name ||
                    item.department ||
                    item.dept ||
                    "Unknown department"
                ),
                actual,
                quota,
              };
            })
          : deriveUsageVsQuota(costByDepartment, budgetValue);
      const recentRequests = mapRecentRequests(currentRequestsResolved);

      const dashboardData = {
        ...EMPTY_DASHBOARD,
        kpis: {
          cost: {
            value: totalCostCurrent,
            growthPercent: calcGrowth(totalCostCurrent, totalCostPrevious),
            previousValue: totalCostPrevious,
            budgetValue,
          },
          requests: {
            total: requestCountCurrent,
            issued: requestIssuedCurrent,
            pending: requestPendingCurrent,
            growthPercent: calcGrowth(
              requestCountCurrent,
              requestCountPrevious
            ),
          },
          lowStock: {
            total: inventoryStats.lowStock + inventoryStats.outOfStock,
            almostOut: inventoryStats.lowStock,
            outOfStock: inventoryStats.outOfStock,
          },
          inventory: {
            totalQuantity: inventoryStats.totalQuantity,
            totalItems: inventoryStats.totalItems,
            totalCategories: inventoryStats.totalCategories,
            growthPercent: 0,
          },
          overdue: {
            total: overdueTotal,
            avgProcessingDays: overdueAvgProcessingDays,
          },
        },
        monthlyCost,
        costByDepartment,
        costByCategory,
        topItems,
        alerts,
        usageVsQuota,
        recentRequests,
      };
      dashboardCache.set(periodKey, {
        data: dashboardData,
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
      });
      return dashboardData;
    })();

    dashboardInflight.set(periodKey, loadPromise);
    try {
      return await loadPromise;
    } finally {
      dashboardInflight.delete(periodKey);
    }
  },

  async getKpiOverview(period = "month") {
    const periodKey = normalizePeriod(period);
    const nowTs = Date.now();
    const cached = dashboardCache.get(periodKey);
    if (cached && cached.expiresAt > nowTs) {
      return mapKpisToOverview(cached.data?.kpis || EMPTY_DASHBOARD.kpis);
    }

    const currentRange = getPeriodRange(periodKey, 0);
    const previousRange = getPeriodRange(periodKey, -1);

    const currentParams = buildCustomReportFilters(currentRange);
    const previousParams = buildCustomReportFilters(previousRange);

    const [summaryRes, stockRes, currentCostRes, previousCostRes] =
      await Promise.all([
        safeCall(() => getReportSummary(currentParams), { timeoutMs: 7000 }),
        safeCall(() => getStockMovementReport(currentParams), {
          timeoutMs: 7000,
        }),
        safeCall(() => getCostSummaryReport(currentParams), {
          timeoutMs: 7000,
        }),
        safeCall(() => getCostSummaryReport(previousParams), {
          timeoutMs: 7000,
        }),
      ]);

    const hasFastSource =
      !!summaryRes || !!stockRes || !!currentCostRes || !!previousCostRes;
    if (!hasFastSource) {
      const data = await this.getDashboardData(period);
      return mapKpisToOverview(data.kpis);
    }

    const summary = extractSummary(summaryRes);
    const stockSummary = extractSummary(stockRes);
    const currentCostSummary = extractSummary(currentCostRes);
    const previousCostSummary = extractSummary(previousCostRes);

    const stockRows = extractRows(stockRes);
    const currentCostRows = extractRows(currentCostRes);
    const previousCostRows = extractRows(previousCostRes);

    const totalCostCurrent = getSummaryNumber(
      currentCostSummary,
      ["total", "total_cost", "totalCost", "cost"],
      sumRowsByKeys(currentCostRows, ["cost", "total", "total_cost", "value"])
    );
    const totalCostPrevious = getSummaryNumber(
      previousCostSummary,
      ["total", "total_cost", "totalCost", "cost"],
      sumRowsByKeys(previousCostRows, ["cost", "total", "total_cost", "value"])
    );

    const issuedRequests = getSummaryNumber(
      summary,
      ["issued_requests", "completed_requests", "finished_requests"],
      getSummaryNumber(
        currentCostSummary,
        [
          "issued_requests",
          "completed_requests",
          "finished_requests",
          "approved_requests",
        ],
        0
      )
    );
    const pendingRequests = getSummaryNumber(
      summary,
      ["pending_requests", "request_waiting", "pending"],
      getSummaryNumber(
        currentCostSummary,
        ["pending_requests", "request_waiting", "pending"],
        0
      )
    );
    const totalRequestsRaw = getSummaryNumber(
      summary,
      ["total_requests", "totalRequests", "request_total", "requests"],
      getSummaryNumber(
        currentCostSummary,
        ["total_requests", "totalRequests", "request_total", "requests"],
        0
      )
    );
    const totalRequests =
      totalRequestsRaw > 0
        ? totalRequestsRaw
        : issuedRequests + pendingRequests;
    const previousRequests = getSummaryNumber(
      previousCostSummary,
      ["total_requests", "totalRequests", "request_total", "requests"],
      0
    );

    const lowStock = getSummaryNumber(
      stockSummary,
      ["low_stock", "lowStock", "low_stock_items", "lowStockItems"],
      getSummaryNumber(
        summary,
        ["low_stock", "lowStock", "low_stock_items", "lowStockItems"],
        0
      )
    );
    const outOfStock = getSummaryNumber(
      stockSummary,
      ["out_of_stock", "outOfStock", "out_of_stock_items", "outOfStockItems"],
      getSummaryNumber(
        summary,
        ["out_of_stock", "outOfStock", "out_of_stock_items", "outOfStockItems"],
        0
      )
    );

    const inventoryItemCount = getSummaryNumber(
      stockSummary,
      [
        "total_items",
        "totalItems",
        "item_count",
        "total_products",
        "products_total",
      ],
      getSummaryNumber(
        summary,
        [
          "total_items",
          "totalItems",
          "item_count",
          "total_products",
          "products_total",
        ],
        0
      )
    );
    const inventoryTotalQuantity = getSummaryNumber(
      stockSummary,
      [
        "total_quantity",
        "total_qty",
        "totalQuantity",
        "totalQty",
        "closing_stock",
        "stock_total",
      ],
      sumRowsByKeys(stockRows, [
        "closing_stock",
        "quantity",
        "qty",
        "total_qty",
      ])
    );
    const inventoryGroups = getSummaryNumber(
      stockSummary,
      ["total_categories", "totalCategories", "category_count"],
      getSummaryNumber(
        summary,
        ["total_categories", "totalCategories", "category_count"],
        0
      )
    );

    const overdueIssues = getSummaryNumber(
      summary,
      ["overdue_requests", "overdue_issues", "overdue"],
      getSummaryNumber(
        currentCostSummary,
        ["overdue_requests", "overdue_issues", "overdue"],
        0
      )
    );
    const avgProcessingDays = getSummaryNumber(
      summary,
      ["avg_processing_days", "average_processing_days"],
      getSummaryNumber(
        currentCostSummary,
        ["avg_processing_days", "average_processing_days"],
        0
      )
    );

    const budgetFromSummary = getSummaryNumber(
      summary,
      ["total_quota", "quota", "budget", "totalBudget", "total_budget"],
      getSummaryNumber(
        currentCostSummary,
        ["total_quota", "quota", "budget", "totalBudget", "total_budget"],
        0
      )
    );
    const budgetValue =
      budgetFromSummary > 0
        ? budgetFromSummary
        : getBudgetValue({ budget: budgetFromSummary }, totalCostCurrent);

    return {
      total_cost: totalCostCurrent,
      cost_variation: calcGrowth(totalCostCurrent, totalCostPrevious),
      budget_value: budgetValue,
      previous_cost: totalCostPrevious,
      pending_requests: totalRequests,
      issued_requests: issuedRequests,
      request_waiting: pendingRequests,
      request_variation: calcGrowth(totalRequests, previousRequests),
      low_stock_items: lowStock + outOfStock,
      almost_out_of_stock: lowStock,
      out_of_stock: outOfStock,
      total_inventory_items: inventoryTotalQuantity,
      inventory_item_count: inventoryItemCount,
      inventory_groups: inventoryGroups,
      inventory_variation: 0,
      overdue_issues: overdueIssues,
      avg_processing_days: avgProcessingDays,
    };
  },

  async getCostChart(period = "month") {
    const data = await this.getDashboardData(period);
    return data.monthlyCost.map((item) => ({
      period: item.period,
      capPhat: Number((toNumber(item.distribution) / 1000000).toFixed(1)),
      muaSam: Number((toNumber(item.extra) / 1000000).toFixed(1)),
      nganSach: Number((toNumber(item.budget) / 1000000).toFixed(1)),
    }));
  },

  async getCostByDepartment(period = "month") {
    const data = await this.getDashboardData(period);
    return data.costByDepartment.map((item) => ({
      department: item.department,
      cost: item.value,
      color: item.color,
    }));
  },

  async getCostByCategory(period = "month") {
    const data = await this.getDashboardData(period);
    return data.costByCategory.map((item) => ({
      name: item.name,
      value: item.value,
      percent: item.percent,
      color: item.color,
    }));
  },

  async getTopConsumedItems(period = "month") {
    const data = await this.getDashboardData(period);
    return data.topItems.map((item) => ({
      id: item.code,
      name: item.name,
      code: item.code,
      qty: item.quantity,
      unit: item.unit,
      total: item.value,
      icon: item.icon,
    }));
  },

  async getAlerts(period = "month") {
    const data = await this.getDashboardData(period);
    return data.alerts;
  },

  async getRecentRequests(period = "month") {
    const data = await this.getDashboardData(period);
    return data.recentRequests;
  },

  async getActualVsQuota(period = "month") {
    const data = await this.getDashboardData(period);
    return data.usageVsQuota.map((item) => ({
      dept: item.department,
      actual: item.actual,
      quota: item.quota,
    }));
  },
};
