import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarMonthRounded,
  DownloadRounded,
  FastfoodRounded,
  InsertChartOutlinedRounded,
  PrintRounded,
  SearchRounded,
  StorefrontRounded,
  WatchLaterRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import mealReviewService from "@services/mealReviewService";

import {
  canAccessRoleFeature,
  ROLE_ACCESS_FEATURE,
} from "@utils/permissionUtils";
import {
  buildMealOptionLabel,
  formatRatingStars,
  mealCriteria,
  resolveMealTypeLabel,
  reviewStatusLabels,
  reviewStatusTones,
  scoreColor,
} from "./constants";
import "./MealFeedback.css";

const formatDateOption = (dateString) => {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
};

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildSortedDateOptions = (menus = [], maxDate = "") =>
  [
    ...new Set(
      menus
        .map((item) => item?.menuDate)
        .filter((date) => typeof date === "string" && date.trim() !== "")
    ),
  ]
    .filter((date) => !maxDate || date <= maxDate)
    .sort((first, second) => second.localeCompare(first));

const DEFAULT_SUPPLIER_LABEL = "Chưa chọn nhà cung cấp";
const DEFAULT_MENU_SUMMARY = "Chưa cập nhật thực đơn";
const ALL_DATES_VALUE = "__ALL_DATES__";
const ALL_MEAL_TYPES_VALUE = "__ALL_MEAL_TYPES__";
const ALL_SUPPLIERS_VALUE = "__ALL_SUPPLIERS__";

const BROKEN_TEXT_PATTERN = /\u00c3|\u00c2|\u00c4|\u00e1\u00ba|\u00e1\u00bb|\u00c6|\u00e2\u20ac|\ufffd/;
const hasBrokenText = (value) =>
  typeof value === "string" && BROKEN_TEXT_PATTERN.test(value);

const extractSupplierId = (item = {}) =>
  item?.supplierId ?? item?.supplier_id ?? item?.id ?? null;

const extractSupplierName = (item = {}) =>
  item?.name || item?.supplierName || item?.supplier_name || "";

const buildSupplierNameMap = (suppliers = []) =>
  suppliers.reduce((acc, item) => {
    const supplierId = extractSupplierId(item);
    const supplierName = extractSupplierName(item);
    if (!supplierId || !supplierName || hasBrokenText(supplierName)) return acc;

    acc[String(supplierId)] = supplierName.trim();
    return acc;
  }, {});

const getSupplierLabel = (supplierId, supplierNameMap, fallbackName = "") => {
  const mappedName = supplierNameMap[String(supplierId)];
  if (mappedName) return mappedName;
  if (fallbackName && !hasBrokenText(fallbackName)) return fallbackName;
  return DEFAULT_SUPPLIER_LABEL;
};

const getSafeMenuSummary = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || hasBrokenText(trimmed)) return "";
  return trimmed;
};

const parseSupplierId = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    value === ALL_SUPPLIERS_VALUE
  ) {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const normalizeSupplierOptions = (items = []) => {
  const seen = new Set();
  return items.reduce((acc, item) => {
    const supplierId = extractSupplierId(item);
    if (supplierId === null || supplierId === undefined) return acc;

    const key = String(supplierId);
    if (seen.has(key)) return acc;
    seen.add(key);

    acc.push({
      supplierId,
      supplierName: extractSupplierName(item),
    });
    return acc;
  }, []);
};

const buildReviewQuery = ({
  page,
  keyword,
  selectedMenu,
  selectedSupplierId,
  selectedDate,
  selectedMealTypeId,
  department,
  chip,
  sort,
  includeMealScope = true,
}) => {
  const sortLabel = String(sort || "")
    .split(":")
    .slice(1)
    .join(":")
    .trim()
    .toLowerCase();
  const query = {
    page,
    pageSize: 5,
    keyword: keyword || undefined,
  };

  if (includeMealScope) {
    if (selectedDate) {
      query.mealDate = selectedDate;
    }
    if (selectedMealTypeId && selectedMealTypeId !== ALL_MEAL_TYPES_VALUE) {
      query.mealTypeId = Number(selectedMealTypeId);
    }
    if (
      selectedSupplierId !== null &&
      selectedSupplierId !== undefined &&
      selectedSupplierId !== ""
    ) {
      query.supplierId = selectedSupplierId;
    }
    if (selectedMenu?.id) {
      query.menuId = selectedMenu.id;
    }
  }

  if (department?.id) {
    query.departmentId = department.id;
  }

  if (chip === "pending_reply") {
    query.hasReply = false;
  }

  if (chip === "has_images") {
    query.hasImages = true;
  }

  if (chip === "low_score") {
    query.maxScore = 2.9;
  }

  switch (true) {
    case sortLabel.includes("cũ"):
      query.sortBy = "submittedAt";
      query.sortOrder = "asc";
      break;
    case sortLabel.includes("thấp"):
      query.sortBy = "overallScore";
      query.sortOrder = "asc";
      break;
    case sortLabel.includes("cao"):
      query.sortBy = "overallScore";
      query.sortOrder = "desc";
      break;
    default:
      query.sortBy = "submittedAt";
      query.sortOrder = "desc";
      break;
  }

  return query;
};

const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatReviewTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const localSortReviews = (items = [], sortValue = "") => {
  const sortLabel = String(sortValue || "")
    .split(":")
    .slice(1)
    .join(":")
    .trim()
    .toLowerCase();
  const next = [...items];

  if (sortLabel.includes("cũ")) {
    return next.sort(
      (first, second) =>
        toTimestamp(first?.submittedAt || first?.createdAt) -
        toTimestamp(second?.submittedAt || second?.createdAt)
    );
  }

  if (sortLabel.includes("thấp")) {
    return next.sort(
      (first, second) =>
        Number(first?.scores?.overallScore || 0) -
        Number(second?.scores?.overallScore || 0)
    );
  }

  if (sortLabel.includes("cao")) {
    return next.sort(
      (first, second) =>
        Number(second?.scores?.overallScore || 0) -
        Number(first?.scores?.overallScore || 0)
    );
  }

  return next.sort(
    (first, second) =>
      toTimestamp(second?.submittedAt || second?.createdAt) -
      toTimestamp(first?.submittedAt || first?.createdAt)
  );
};

const sortRepliesByTime = (replies = []) =>
  [...replies].sort(
    (first, second) =>
      toTimestamp(first?.repliedAt || first?.createdAt) -
      toTimestamp(second?.repliedAt || second?.createdAt)
  );

const resolveReplyTone = (reply = {}) => {
  const replyType = String(reply?.replyType || "").toLowerCase();
  const isOfficial =
    reply?.isOfficial === true ||
    replyType.includes("kitchen") ||
    replyType.includes("admin") ||
    replyType.includes("manager");

  if (isOfficial) {
    return {
      bg: "#eef4ff",
      color: "#1d4ed8",
      border: "#dbeafe",
    };
  }

  return {
    bg: "#ecfdf3",
    color: "#166534",
    border: "#bbf7d0",
  };
};

const downloadBlob = (response, fileName) => {
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const MealFeedbackDetailPage = () => {
  const navigate = useNavigate();
  const userPermissions = useSelector((state) => state.users.userPermissions);
  const isAuthorized = React.useMemo(
    () =>
      canAccessRoleFeature(
        ROLE_ACCESS_FEATURE.MEAL_FEEDBACK_DETAIL,
        userPermissions
      ),
    [userPermissions]
  );
  const [menus, setMenus] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierNameMap, setSupplierNameMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    mealTypeId: "",
    supplierId: "",
  });
  const [department, setDepartment] = useState({
    id: "",
    name: "Tất cả phòng ban",
  });
  const [sort, setSort] = useState("Sắp xếp: Mới nhất");
  const [chip, setChip] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [criteriaAverages, setCriteriaAverages] = useState(null);
  const [reviewResponse, setReviewResponse] = useState({ data: [], meta: {} });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const latestFetchIdRef = useRef(0);
  const todayDate = useMemo(() => getTodayDateValue(), []);
  const availableDates = useMemo(
    () => buildSortedDateOptions(menus, todayDate),
    [menus, todayDate]
  );

  useEffect(() => {
    if (userPermissions && !isAuthorized) {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/canteen/my-registrations");
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);

      try {
        const [menuResponse, optionsResponse] = await Promise.all([
          mealReviewService.getMenus({
            status: "published",
            page: 1,
            pageSize: 100,
          }),
          mealReviewService.getFilterOptions(),
        ]);

        const menuItems = menuResponse?.data || [];
        const departmentItems = optionsResponse?.data?.departments || [];
        let supplierItems = [];
        try {
          const supplierResponse = await mealReviewService.getCateringSuppliers(
            {
              page: 0,
              size: 200,
            }
          );
          supplierItems = normalizeSupplierOptions(
            supplierResponse?.data || []
          );
        } catch (supplierError) {
          supplierItems = [];
        }

        const fallbackSupplierItems = normalizeSupplierOptions(
          menuItems.map((item) => ({
            supplierId: item?.supplierId,
            supplierName: item?.supplierName,
          }))
        );
        const effectiveSuppliers =
          supplierItems.length > 0 ? supplierItems : fallbackSupplierItems;
        const supplierMap = buildSupplierNameMap(effectiveSuppliers);

        setMenus(menuItems);
        setSuppliers(effectiveSuppliers);
        setSupplierNameMap(supplierMap);
        setDepartments(departmentItems);

        if (menuItems.length > 0 || effectiveSuppliers.length > 0) {
          const sortedDates = buildSortedDateOptions(menuItems, todayDate);
          const defaultDate = sortedDates.includes(todayDate)
            ? todayDate
            : sortedDates[0] || "";
          setFilters({
            date: defaultDate,
            mealTypeId: ALL_MEAL_TYPES_VALUE,
            supplierId: ALL_SUPPLIERS_VALUE,
          });
        }
      } catch (error) {
        toast.error("Không thể tải dữ liệu đánh giá bữa ăn.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [todayDate]);

  const dateOptions = useMemo(() => {
    return availableDates;
  }, [availableDates]);

  const isAllDatesSelected = filters.date === ALL_DATES_VALUE;
  const isAllMealsSelected = filters.mealTypeId === ALL_MEAL_TYPES_VALUE;
  const isAllSuppliersSelected = filters.supplierId === ALL_SUPPLIERS_VALUE;
  const selectedDateValue = isAllDatesSelected ? "" : filters.date;
  const selectedMealTypeValue = isAllMealsSelected ? "" : filters.mealTypeId;
  const selectedSupplierValue = isAllSuppliersSelected
    ? ""
    : filters.supplierId;

  const mealOptions = useMemo(() => {
    const sourceMenus = isAllDatesSelected
      ? menus
      : menus.filter((item) => item.menuDate === selectedDateValue);
    if (sourceMenus.length === 0) return [];

    return [
      ...new Map(sourceMenus.map((item) => [item.mealTypeId, item])).values(),
    ];
  }, [isAllDatesSelected, menus, selectedDateValue]);

  const supplierOptions = useMemo(() => suppliers, [suppliers]);

  const selectedMenu = useMemo(() => {
    if (!selectedDateValue || !selectedMealTypeValue) return null;

    const candidates = menus.filter(
      (item) =>
        item.menuDate === selectedDateValue &&
        String(item.mealTypeId) === String(selectedMealTypeValue)
    );

    if (candidates.length === 0) return null;

    if (!selectedSupplierValue) {
      return candidates[0];
    }

    const exact = candidates.find(
      (item) => String(item.supplierId) === String(selectedSupplierValue)
    );

    return exact || candidates[0];
  }, [menus, selectedDateValue, selectedMealTypeValue, selectedSupplierValue]);

  useEffect(() => {
    if (!filters.date && dateOptions.length > 0) {
      const defaultDate = dateOptions.includes(todayDate)
        ? todayDate
        : dateOptions[0];
      setFilters((prev) => ({ ...prev, date: defaultDate }));
    }
  }, [dateOptions, filters.date, todayDate]);

  useEffect(() => {
    if (isAllDatesSelected) {
      if (!filters.mealTypeId) {
        setFilters((prev) => ({
          ...prev,
          mealTypeId: ALL_MEAL_TYPES_VALUE,
        }));
      }
      return;
    }

    if (mealOptions.length === 0) return;
    if (filters.mealTypeId === ALL_MEAL_TYPES_VALUE) return;

    const hasMeal = mealOptions.some(
      (item) => String(item.mealTypeId) === String(filters.mealTypeId)
    );

    if (!hasMeal) {
      setFilters((prev) => ({
        ...prev,
        mealTypeId: ALL_MEAL_TYPES_VALUE,
      }));
    }
  }, [filters.mealTypeId, isAllDatesSelected, mealOptions]);

  useEffect(() => {
    if (isAllDatesSelected) {
      if (!filters.supplierId) {
        setFilters((prev) => ({
          ...prev,
          supplierId: ALL_SUPPLIERS_VALUE,
        }));
      }
      return;
    }

    if (supplierOptions.length === 0) return;
    if (filters.supplierId === ALL_SUPPLIERS_VALUE) return;

    const hasSupplier = supplierOptions.some(
      (item) => String(item.supplierId) === String(filters.supplierId)
    );

    if (!hasSupplier) {
      setFilters((prev) => ({
        ...prev,
        supplierId: ALL_SUPPLIERS_VALUE,
      }));
    }
  }, [filters.supplierId, isAllDatesSelected, supplierOptions]);

  const reportQuery = useMemo(
    () =>
      buildReviewQuery({
        page,
        keyword: search,
        selectedMenu,
        selectedSupplierId: parseSupplierId(selectedSupplierValue),
        selectedDate: selectedDateValue || undefined,
        selectedMealTypeId: selectedMealTypeValue || undefined,
        department,
        chip,
        sort,
        includeMealScope: true,
      }),
    [
      chip,
      department,
      page,
      search,
      selectedDateValue,
      selectedMealTypeValue,
      selectedMenu,
      selectedSupplierValue,
      sort,
    ]
  );

  const reviewQuery = useMemo(
    () =>
      buildReviewQuery({
        page,
        keyword: search,
        selectedMenu,
        selectedSupplierId: parseSupplierId(selectedSupplierValue),
        selectedDate: selectedDateValue || undefined,
        selectedMealTypeId: selectedMealTypeValue || undefined,
        department,
        chip,
        sort,
        includeMealScope: true,
      }),
    [
      chip,
      department,
      page,
      search,
      selectedDateValue,
      selectedMealTypeValue,
      selectedMenu,
      selectedSupplierValue,
      sort,
    ]
  );

  const hydrateReplies = useCallback(async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const replyResults = await Promise.allSettled(
      items.map((item) => mealReviewService.getReviewReplies(item.id))
    );

    return items.map((item, index) => {
      const result = replyResults[index];
      const replies =
        result?.status === "fulfilled" ? result.value?.data || [] : [];
      return {
        ...item,
        replies,
      };
    });
  }, []);

  const fetchReviewData = useCallback(
    async ({ showLoading = true, silent = false } = {}) => {
      const fetchId = Date.now() + Math.random();
      latestFetchIdRef.current = fetchId;

      if (showLoading) {
        setLoading(true);
      }

      try {
        const [summaryResult, criteriaResult, reviewsResult] =
          await Promise.allSettled([
            mealReviewService.getReviewSummary(reviewQuery),
            mealReviewService.getCriteriaAverages(reviewQuery),
            mealReviewService.getReviews(reviewQuery),
          ]);

        if (latestFetchIdRef.current !== fetchId) return;

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value?.data || null);
        }

        if (criteriaResult.status === "fulfilled") {
          setCriteriaAverages(criteriaResult.value?.data || null);
        }

        if (reviewsResult.status === "fulfilled") {
          const reviewItems = reviewsResult.value?.data || [];
          const withReplies = await hydrateReplies(reviewItems);
          if (latestFetchIdRef.current !== fetchId) return;
          setReviewResponse({
            data: localSortReviews(withReplies, sort),
            meta: reviewsResult.value?.meta || {},
          });
        } else if (!silent) {
          throw reviewsResult.reason;
        }
      } catch (error) {
        if (!silent) {
          toast.error("Không thể tải chi tiết đánh giá theo bữa.");
        }
      } finally {
        if (showLoading && latestFetchIdRef.current === fetchId) {
          setLoading(false);
        }
      }
    },
    [hydrateReplies, reviewQuery, sort]
  );

  useEffect(() => {
    fetchReviewData({ showLoading: true });
  }, [fetchReviewData]);

  useEffect(() => {
    if (userPermissions && !isAuthorized) return undefined;

    const handleLiveRefresh = () => {
      fetchReviewData({ showLoading: false, silent: true });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleLiveRefresh();
      }
    };

    const intervalId = window.setInterval(handleLiveRefresh, 15000);
    window.addEventListener("focus", handleLiveRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleLiveRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchReviewData, isAuthorized, userPermissions]);

  const handleReplySubmit = async (review) => {
    const reviewId = review?.id;
    const draft = replyDrafts[reviewId]?.trim();

    if (!reviewId) return;

    if (!draft) {
      toast.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setActionLoading(true);

    try {
      const hasExistingReplies = (review?.replies || []).length > 0;
      const replyPayloads = hasExistingReplies
        ? [
            {
              replyContent: draft,
              replyType: "employee_reply",
              isOfficial: false,
            },
            {
              replyContent: draft,
              replyType: "kitchen_reply",
              isOfficial: false,
            },
            {
              replyContent: draft,
            },
          ]
        : [
            {
              replyContent: draft,
              replyType: "kitchen_reply",
              isOfficial: true,
            },
            {
              replyContent: draft,
            },
          ];

      let submitted = false;
      let lastError = null;

      for (const payload of replyPayloads) {
        try {
          await mealReviewService.createReply(reviewId, payload);
          submitted = true;
          break;
        } catch (error) {
          lastError = error;
          const status = error?.response?.status;
          if (status && ![400, 404, 422].includes(status)) {
            break;
          }
        }
      }

      if (!submitted) {
        throw lastError || new Error("Reply submit failed");
      }

      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      toast.success("Gửi phản hồi thành công.");
      await fetchReviewData({ showLoading: false, silent: true });
    } catch (error) {
      toast.error("Không thể gửi phản hồi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedMenu) return;

    try {
      const response = await mealReviewService.exportExcel(reportQuery);
      downloadBlob(response, `meal-review-${selectedMenu.menuDate}.xlsx`);
    } catch (error) {
      toast.error("Không thể xuất Excel.");
    }
  };

  const handlePrint = async () => {
    if (!selectedMenu) return;

    try {
      const response = await mealReviewService.getPrintReport(reportQuery);
      const reportData = response?.data;
      const printWindow = window.open("", "_blank", "width=960,height=720");

      if (!printWindow || !reportData) {
        toast.warning("Không thể mở cửa sổ in báo cáo.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Báo cáo đánh giá bữa ăn</title>
            <style>
              body { font-family: "Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif; padding: 24px; color: #1e293b; }
              h1 { margin-bottom: 8px; }
              .meta { margin-bottom: 16px; color: #475569; }
              .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <h1>Chi tiết đánh giá theo bữa</h1>
            <div class="meta">
              ${reportData?.header?.mealDate || ""} |
              ${resolveMealTypeLabel(reportData?.header) || ""} |
              ${getSupplierLabel(
                parseSupplierId(filters.supplierId) ??
                  reportData?.header?.supplierId,
                supplierNameMap,
                reportData?.header?.supplierName
              )}
            </div>
            <div class="box"><strong>Thực đơn:</strong> ${getSafeMenuSummary(reportData?.header?.menuSummary) || DEFAULT_MENU_SUMMARY}</div>
            <div class="box"><strong>Điểm trung bình:</strong> ${reportData?.summary?.averageScore || "—"}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      toast.error("Không thể lấy dữ liệu in báo cáo.");
    }
  };

  const metricCards = [
    {
      title: "Điểm trung bình",
      value: summary?.averageScore ?? "—",
      footnote: "trên thang 5.0",
      icon: "⭐",
      accent: "#2f6fed",
    },
    {
      title: "Tổng đánh giá",
      value: summary?.totalReviews ?? 0,
      footnote: `/${summary?.totalEligibleUsers ?? 0} suất ăn (${summary?.responseRate ?? 0}%)`,
      icon: "📝",
      accent: "#14325c",
    },
    {
      title: "Hài lòng (4-5★)",
      value: summary?.satisfiedCount ?? 0,
      footnote: `${summary?.satisfiedRate ?? 0}% đánh giá`,
      icon: "😊",
      accent: "#16a34a",
    },
    {
      title: "Trung bình (3★)",
      value: summary?.neutralCount ?? 0,
      footnote: `${summary?.neutralRate ?? 0}% đánh giá`,
      icon: "😐",
      accent: "#f59e0b",
    },
    {
      title: "Không hài lòng (1-2★)",
      value: summary?.unsatisfiedCount ?? 0,
      footnote: `${summary?.unsatisfiedRate ?? 0}% đánh giá`,
      icon: "☹️",
      accent: "#ef4444",
    },
  ];

  const filterChips = [
    { id: "all", label: "Tất cả" },
    { id: "pending_reply", label: "Chưa phản hồi" },
    { id: "has_images", label: "Có ảnh" },
    { id: "low_score", label: "Điểm thấp" },
  ];

  return (
    <Box className="meal-feedback-page">
      <Container maxWidth="xl">
        <Stack className="meal-feedback-shell">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: { md: "center" },
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: "#14325c", mb: 1 }}
              >
                Chi tiết đánh giá theo bữa
              </Typography>
              <Typography sx={{ color: "#64748b", fontWeight: 500 }}>
                Xem và phản hồi tất cả đánh giá của nhân viên cho bữa ăn cụ thể.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={handleExport}
                sx={{
                  borderRadius: 3,
                  borderColor: "#d6e2f2",
                  color: "#5a7090",
                }}
              >
                Xuất Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintRounded />}
                onClick={handlePrint}
                sx={{
                  borderRadius: 3,
                  borderColor: "#d6e2f2",
                  color: "#5a7090",
                }}
              >
                In báo cáo
              </Button>
            </Stack>
          </Stack>

          <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 2.5 } }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  value={filters.date}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      date: nextDate,
                      ...(nextDate === ALL_DATES_VALUE
                        ? {
                            mealTypeId: ALL_MEAL_TYPES_VALUE,
                            supplierId: ALL_SUPPLIERS_VALUE,
                          }
                        : {}),
                    }));
                    setPage(1);
                  }}
                >
                  <MenuItem value={ALL_DATES_VALUE}>Tất cả các ngày</MenuItem>
                  {dateOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {formatDateOption(item)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  value={filters.mealTypeId}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      mealTypeId: event.target.value,
                    }));
                    setPage(1);
                  }}
                >
                  <MenuItem value={ALL_MEAL_TYPES_VALUE}>Tất cả bữa</MenuItem>
                  {mealOptions.map((item) => (
                    <MenuItem key={item.id} value={String(item.mealTypeId)}>
                      {buildMealOptionLabel(item)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  value={filters.supplierId}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      supplierId: event.target.value,
                    }));
                    setPage(1);
                  }}
                >
                  <MenuItem value={ALL_SUPPLIERS_VALUE}>
                    Tất cả nhà cung cấp
                  </MenuItem>
                  {supplierOptions.length === 0 && (
                    <MenuItem value="" disabled>
                      Chưa có dữ liệu nhà cung cấp
                    </MenuItem>
                  )}
                  {supplierOptions.map((item) => (
                    <MenuItem
                      key={item.supplierId}
                      value={String(item.supplierId)}
                    >
                      {getSupplierLabel(
                        item.supplierId,
                        supplierNameMap,
                        item.supplierName
                      )}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={2.5}>
              {[
                {
                  label: "Ngày",
                  value: selectedDateValue
                    ? formatDateOption(selectedDateValue)
                    : "Tất cả các ngày",
                  icon: <CalendarMonthRounded sx={{ color: "#315bca" }} />,
                },
                {
                  label: "Bữa ăn",
                  value: isAllMealsSelected
                    ? "Tất cả bữa"
                    : buildMealOptionLabel(selectedMenu) ||
                      resolveMealTypeLabel({
                        mealTypeId: Number(selectedMealTypeValue || 0),
                      }) ||
                      "Tất cả bữa",
                  icon: <WatchLaterRounded sx={{ color: "#d97706" }} />,
                },
                {
                  label: "Nhà cung cấp",
                  value: isAllSuppliersSelected
                    ? "Tất cả nhà cung cấp"
                    : getSupplierLabel(
                        parseSupplierId(selectedSupplierValue) ??
                          selectedMenu?.supplierId,
                        supplierNameMap,
                        selectedMenu?.supplierName
                      ),
                  icon: <StorefrontRounded sx={{ color: "#14b8a6" }} />,
                },
              ].map((item) => (
                <Grid item xs={12} md={4} key={item.label}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{ width: 36, height: 36, bgcolor: "#eef4ff" }}
                    >
                      {item.icon}
                    </Avatar>
                    <Box>
                      <Typography
                        sx={{ color: "#9aa9c6", fontWeight: 800, fontSize: 13 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: "#14325c", fontWeight: 800 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Avatar
                    variant="rounded"
                    sx={{ width: 36, height: 36, bgcolor: "#fde7f3" }}
                  >
                    <FastfoodRounded sx={{ color: "#9d174d" }} />
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{ color: "#9aa9c6", fontWeight: 800, fontSize: 13 }}
                    >
                      Thực đơn
                    </Typography>
                    <Typography sx={{ color: "#14325c", fontWeight: 700 }}>
                      {selectedDateValue && selectedMenu
                        ? getSafeMenuSummary(selectedMenu?.menuSummary) ||
                          DEFAULT_MENU_SUMMARY
                        : "Tổng hợp nhiều thực đơn theo bộ lọc"}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2}>
            {metricCards.map((card, index) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={card.title}
                sx={{ flexBasis: { xl: "20%" }, maxWidth: { xl: "20%" } }}
              >
                <Box
                  className="meal-feedback-card soft"
                  sx={{
                    height: "100%",
                    borderColor: index === 0 ? "#3867ff" : "#d7e3f2",
                    boxShadow:
                      index === 0
                        ? "0 12px 30px rgba(56,103,255,0.12)"
                        : "0 10px 30px rgba(31,65,114,0.06)",
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography sx={{ color: "#5f7290", fontWeight: 700 }}>
                      {card.title}
                    </Typography>
                    <Typography sx={{ fontSize: 24 }}>{card.icon}</Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 1.25,
                      color: card.accent,
                      fontWeight: 900,
                      fontSize: 40,
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    {card.footnote}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "center", mb: 2.5 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#eef4ff",
                  color: "#315bca",
                }}
              >
                <InsertChartOutlinedRounded />
              </Avatar>
              <Typography sx={{ color: "#14325c", fontWeight: 900 }}>
                Điểm trung bình theo tiêu chí
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {mealCriteria.map((item) => {
                const score = criteriaAverages?.[item.averageField] ?? 0;

                return (
                  <Grid
                    container
                    spacing={2}
                    key={item.id}
                    sx={{ alignItems: "center" }}
                  >
                    <Grid item xs={12} md={2.3}>
                      <Typography sx={{ color: "#14325c", fontWeight: 700 }}>
                        {item.title}
                      </Typography>
                    </Grid>
                    <Grid item xs={10} md={8.7}>
                      <Box className="review-progress-bar">
                        <Box
                          component="span"
                          sx={{
                            width: `${(score / 5) * 100}%`,
                            bgcolor: scoreColor(score),
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={2} md={1}>
                      <Typography
                        sx={{
                          color: scoreColor(score),
                          fontWeight: 900,
                          textAlign: "right",
                        }}
                      >
                        {Number(score).toFixed(1)}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </Stack>
          </Box>

          <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 2.5 } }}>
            <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
              <Grid item xs={12} lg={4.5}>
                <TextField
                  fullWidth
                  placeholder="Tìm theo tên nhân viên, phòng ban, nội dung nhận xét..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: "#9aa9c6" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <TextField
                  select
                  fullWidth
                  value={department.id ? String(department.id) : ""}
                  onChange={(event) => {
                    const departmentId = event.target.value;
                    const target = departments.find(
                      (item) => String(item.id) === String(departmentId)
                    );
                    setDepartment(
                      target
                        ? { id: target.id, name: target.name }
                        : { id: "", name: "Tất cả phòng ban" }
                    );
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Tất cả phòng ban</MenuItem>
                  {departments.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <TextField
                  select
                  fullWidth
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                >
                  {[
                    "Sắp xếp: Mới nhất",
                    "Sắp xếp: Cũ nhất",
                    "Sắp xếp: Điểm thấp nhất",
                    "Sắp xếp: Điểm cao nhất",
                  ].map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} lg={3.5}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {filterChips.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      onClick={() => {
                        setChip(item.id);
                        setPage(1);
                      }}
                      className={`meal-feedback-chip ${chip === item.id ? "active" : ""}`}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Stack spacing={2}>
            {reviewResponse.data.map((review) => {
              const hasReplyThread = (review.replies || []).length > 0;
              const status =
                review.reviewStatus ||
                (hasReplyThread ? "replied" : "pending_reply");
              const tone = reviewStatusTones[status] || reviewStatusTones.new;
              const sortedReplies = sortRepliesByTime(review.replies || []);
              const hasReplies = sortedReplies.length > 0;

              return (
                <Box
                  key={review.id}
                  className="meal-feedback-card"
                  sx={{ p: { xs: 2, md: 2.5 } }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Stack direction="row" spacing={1.5}>
                      <Avatar
                        src={review.reviewer?.avatarUrl || undefined}
                        sx={{ bgcolor: "#2563eb", fontWeight: 800 }}
                      >
                        {review.reviewer?.avatarText}
                      </Avatar>
                      <Box>
                        <Typography
                          sx={{
                            color: "#14325c",
                            fontWeight: 900,
                            fontSize: 24,
                          }}
                        >
                          {review.reviewer?.fullName}
                        </Typography>
                        <Typography sx={{ color: "#8fa0bb", fontWeight: 600 }}>
                          {review.reviewer?.departmentName}
                          {review.reviewer?.teamName
                            ? ` - ${review.reviewer.teamName}`
                            : ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <Chip
                        label={reviewStatusLabels[status] || status}
                        sx={{
                          bgcolor: tone.bg,
                          color: tone.color,
                          fontWeight: 800,
                        }}
                      />
                      <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>
                        {formatReviewTime(review.submittedAt)}
                      </Typography>
                      <Chip
                        label={`★ ${review.scores?.overallScore ?? 0}`}
                        sx={{
                          bgcolor: `${scoreColor(review.scores?.overallScore ?? 0)}18`,
                          color: scoreColor(review.scores?.overallScore ?? 0),
                          fontWeight: 900,
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={{ xs: 1, md: 3 }}
                    sx={{ mt: 2, flexWrap: "wrap" }}
                  >
                    {mealCriteria.map((criterion) => {
                      const ratingValue =
                        review.scores?.[criterion.scoreField] || 0;

                      return (
                        <Typography
                          key={criterion.id}
                          sx={{ color: "#4d607e", fontWeight: 600 }}
                        >
                          {criterion.title}{" "}
                          <Box
                            component="span"
                            sx={{ color: "#f59e0b", ml: 0.5 }}
                          >
                            {formatRatingStars(Math.round(ratingValue))}
                          </Box>
                        </Typography>
                      );
                    })}
                  </Stack>

                  {review.commentText && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: "#f8fbff",
                        border: "1px solid #edf3fb",
                        color: "#1f3350",
                      }}
                    >
                      {review.commentText}
                    </Box>
                  )}

                  {review.images?.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ mt: 2, flexWrap: "wrap" }}
                    >
                      {review.images.map((image) => (
                        <Box
                          key={image.id}
                          component="img"
                          src={image.fileUrl}
                          alt={`review-${review.id}-${image.id}`}
                          className="feedback-image-tile"
                          sx={{ width: 72, height: 72, objectFit: "cover" }}
                        />
                      ))}
                    </Stack>
                  )}

                  {hasReplies && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {sortedReplies.map((reply) => {
                        const replyTone = resolveReplyTone(reply);
                        return (
                          <Box
                            key={`${review.id}-${reply.id || reply.repliedAt}`}
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              bgcolor: replyTone.bg,
                              color: replyTone.color,
                              border: `1px solid ${replyTone.border}`,
                            }}
                          >
                            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                              {reply.repliedBy?.fullName || "Người phản hồi"}
                              {reply.repliedBy?.departmentName
                                ? ` — ${reply.repliedBy.departmentName}`
                                : ""}
                              {reply.repliedAt
                                ? ` · ${formatReviewTime(reply.repliedAt)}`
                                : ""}
                            </Typography>
                            <Typography>{reply.replyContent}</Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    sx={{ mt: 2, alignItems: { md: "center" } }}
                  >
                    <TextField
                      fullWidth
                      placeholder={
                        hasReplies
                          ? "Nhập phản hồi tiếp theo..."
                          : "Nhập phản hồi cho nhân viên..."
                      }
                      value={replyDrafts[review.id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [review.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleReplySubmit(review)}
                      sx={{
                        minWidth: 140,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                      }}
                    >
                      {hasReplies ? "Phản hồi tiếp" : "Gửi phản hồi"}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ color: "#93a3bc", fontWeight: 600 }}>
              Hiển thị{" "}
              {reviewResponse.data.length > 0
                ? `${(page - 1) * 5 + 1}-${(page - 1) * 5 + reviewResponse.data.length}`
                : 0}{" "}
              trên {reviewResponse.meta?.total || 0} đánh giá
            </Typography>
            <Pagination
              count={reviewResponse.meta?.totalPages || 1}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </Stack>
      </Container>

      <Backdrop
        open={loading || actionLoading}
        sx={{ color: "#fff", zIndex: 1300 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default MealFeedbackDetailPage;
