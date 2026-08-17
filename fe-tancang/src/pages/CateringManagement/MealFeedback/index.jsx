import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  MenuItem,
  Rating,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  AccessTimeRounded,
  ArrowForwardRounded,
  CalendarMonthRounded,
  CloudUploadOutlined,
  RefreshRounded,
  RestaurantMenuRounded,
  StorefrontRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import mealReviewService from "@services/mealReviewService";
import {
  buildMealOptionLabel,
  criteriaFieldMap,
  decorateCriteria,
  initialScores,
  mealCriteria as fallbackCriteria,
} from "./constants";
import "./MealFeedback.css";

const buildImagePreview = (file) => ({
  id: `${file.name}-${file.lastModified}`,
  type: "local",
  file,
  previewUrl: URL.createObjectURL(file),
});

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

const mapReviewToScores = (review) => ({
  taste: review?.tasteScore || 0,
  hygiene: review?.hygieneScore || 0,
  portion: review?.portionScore || 0,
  variety: review?.varietyScore || 0,
  service: review?.serviceScore || 0,
});

const isNotFoundError = (error) => error?.response?.status === 404;
const BROKEN_TEXT_PATTERN = /\u00c3|\u00c2|\u00c4|\u00e1\u00ba|\u00e1\u00bb|\u00c6|\u00e2\u20ac|\ufffd/;
const DEFAULT_SUPPLIER_LABEL = "Chưa chọn nhà cung cấp";
const DEFAULT_MENU_SUMMARY = "Chưa cập nhật thực đơn";

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
  if (value === "" || value === null || value === undefined) return null;
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

const normalizeCriteria = (criteriaItems = []) =>
  decorateCriteria(criteriaItems).map((criterion) => {
    const fallback = fallbackCriteria.find(
      (item) =>
        item.id === criterion.id || item.scoreField === criterion.scoreField
    );

    return {
      ...criterion,
      title: hasBrokenText(criterion.title)
        ? fallback?.title || "Tiêu chí"
        : criterion.title,
      description: hasBrokenText(criterion.description)
        ? fallback?.description || ""
        : criterion.description,
    };
  });

const REVIEW_NOTE_TEMPLATES = [
  {
    id: "positive",
    label: "Món ăn ngon, khẩu phần hợp lý, phục vụ nhanh và lịch sự.",
    text: "Món ăn ngon, khẩu phần hợp lý, phục vụ nhanh và lịch sự. Đề nghị duy trì chất lượng như hiện tại.",
  },
  {
    id: "neutral",
    label: "Chất lượng bữa ăn ở mức chấp nhận được.",
    text: "Chất lượng bữa ăn ở mức chấp nhận được. Mong bộ phận bếp cải thiện thêm về hương vị và độ đa dạng món.",
  },
  {
    id: "improve",
    label: "Đề nghị cải thiện hương vị, độ nóng và tốc độ phục vụ.",
    text: "Đề nghị cải thiện về hương vị, độ nóng của món ăn và tốc độ phục vụ trong giờ cao điểm.",
  },
  {
    id: "hygiene",
    label: "Đề nghị tăng cường vệ sinh khu vực chia món và ăn uống.",
    text: "Đề nghị tiếp tục tăng cường vệ sinh khu vực chia món, khay dụng cụ và khu vực ăn uống.",
  },
];

const timesNewRomanTheme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
          textTransform: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
      },
    },
  },
});

const MealFeedbackPage = () => {
  const [menus, setMenus] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierNameMap, setSupplierNameMap] = useState({});
  const [criteria, setCriteria] = useState(fallbackCriteria);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [filters, setFilters] = useState({
    date: "",
    mealTypeId: "",
    supplierId: "",
  });
  const [menuDetail, setMenuDetail] = useState(null);
  const [currentReview, setCurrentReview] = useState(null);
  const [scores, setScores] = useState(initialScores);
  const [note, setNote] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitConfirmation, setSubmitConfirmation] = useState({
    open: false,
    message: "",
  });
  const todayDate = useMemo(() => getTodayDateValue(), []);
  const availableDates = useMemo(
    () => buildSortedDateOptions(menus, todayDate),
    [menus, todayDate]
  );

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.type === "local") {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, [images]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setCriteriaLoading(true);

      try {
        const [menuResponse, criteriaResponse] = await Promise.all([
          mealReviewService.getMenus({
            status: "published",
            page: 1,
            pageSize: 100,
          }),
          mealReviewService.getReviewCriteria({
            isActive: true,
            sortBy: "sortOrder",
            sortOrder: "asc",
          }),
        ]);

        const menuItems = menuResponse?.data || [];
        const criteriaItems = criteriaResponse?.data || [];
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
        if (menuItems.length === 0) {
          toast.warning(
            "Hiện chưa có dữ liệu bữa ăn để gửi đánh giá. Vui lòng kiểm tra dữ liệu menu."
          );
        }

        if (criteriaItems.length > 0) {
          setCriteria(normalizeCriteria(criteriaItems));
        }

        if (menuItems.length > 0 || effectiveSuppliers.length > 0) {
          const sortedDates = buildSortedDateOptions(menuItems, todayDate);
          const defaultDate = sortedDates.includes(todayDate)
            ? todayDate
            : sortedDates[0] || "";
          const firstMenu =
            menuItems.find((item) => item.menuDate === defaultDate) || null;
          const defaultSupplierId =
            firstMenu?.supplierId ?? effectiveSuppliers[0]?.supplierId ?? "";
          setFilters({
            date: defaultDate,
            mealTypeId: String(firstMenu?.mealTypeId || ""),
            supplierId: String(defaultSupplierId),
          });
        }
      } catch (error) {
        toast.warning(
          "Không thể tải đầy đủ cấu hình đánh giá. Hệ thống đang dùng bộ tiêu chí mặc định."
        );
      } finally {
        setLoading(false);
        setCriteriaLoading(false);
      }
    };

    loadInitialData();
  }, [todayDate]);

  const dateOptions = useMemo(() => {
    return availableDates;
  }, [availableDates]);

  const mealOptions = useMemo(() => {
    if (!filters.date) return [];

    return [
      ...new Map(
        menus
          .filter((item) => item.menuDate === filters.date)
          .map((item) => [item.mealTypeId, item])
      ).values(),
    ];
  }, [filters.date, menus]);

  const supplierOptions = useMemo(() => suppliers, [suppliers]);

  const selectedMenu = useMemo(() => {
    if (!filters.date || !filters.mealTypeId) return null;

    const candidates = menus.filter(
      (item) =>
        item.menuDate === filters.date &&
        String(item.mealTypeId) === String(filters.mealTypeId)
    );

    if (candidates.length === 0) return null;

    const exact = candidates.find(
      (item) => String(item.supplierId) === String(filters.supplierId)
    );

    return exact || candidates[0];
  }, [filters.date, filters.mealTypeId, filters.supplierId, menus]);

  const activeMenu = useMemo(() => {
    if (selectedMenu?.id) {
      return {
        ...selectedMenu,
        supplierId:
          parseSupplierId(filters.supplierId) ??
          selectedMenu.supplierId ??
          null,
      };
    }
    if (!menuDetail?.id) return null;

    return {
      id: menuDetail.id,
      menuDate: menuDetail.menuDate || filters.date,
      mealTypeId:
        menuDetail.mealTypeId ||
        (filters.mealTypeId ? Number(filters.mealTypeId) : null),
      supplierId:
        parseSupplierId(filters.supplierId) ?? menuDetail.supplierId ?? null,
    };
  }, [
    selectedMenu,
    menuDetail,
    filters.date,
    filters.mealTypeId,
    filters.supplierId,
  ]);

  useEffect(() => {
    if (!filters.date && dateOptions.length > 0) {
      const defaultDate = dateOptions.includes(todayDate)
        ? todayDate
        : dateOptions[0];
      setFilters((prev) => ({ ...prev, date: defaultDate }));
    }
  }, [dateOptions, filters.date, todayDate]);

  useEffect(() => {
    if (!filters.date || mealOptions.length === 0) return;

    const hasMeal = mealOptions.some(
      (item) => String(item.mealTypeId) === String(filters.mealTypeId)
    );

    if (!hasMeal) {
      setFilters((prev) => ({
        ...prev,
        mealTypeId: String(mealOptions[0].mealTypeId),
      }));
    }
  }, [filters.date, filters.mealTypeId, mealOptions]);

  useEffect(() => {
    if (supplierOptions.length === 0) return;

    const hasSupplier = supplierOptions.some(
      (item) => String(item.supplierId) === String(filters.supplierId)
    );

    if (!hasSupplier) {
      setFilters((prev) => ({
        ...prev,
        supplierId: String(supplierOptions[0]?.supplierId || ""),
      }));
    }
  }, [filters.supplierId, supplierOptions]);

  useEffect(() => {
    if (!selectedMenu?.id) {
      setMenuDetail(null);
      setCurrentReview(null);
      return;
    }

    const loadCurrentContext = async () => {
      setLoading(true);

      try {
        const [menuResponse, reviewResponse] = await Promise.all([
          mealReviewService.getMenuDetail(selectedMenu.id),
          mealReviewService.getMyCurrentReview({
            menuId: activeMenu.id,
            includeImages: true,
            includeReplies: true,
          }),
        ]);

        const review = reviewResponse?.data?.review || null;
        setMenuDetail(menuResponse?.data || null);
        setCurrentReview(review);

        if (reviewResponse?.data?.exists && review) {
          setScores(mapReviewToScores(review));
          setNote(review.commentText || "");
          setImages(
            (review.images || []).map((image) => ({
              id: image.id,
              type: "server",
              fileName: image.fileName,
              previewUrl: image.fileUrl,
            }))
          );
        } else {
          setScores(initialScores);
          setNote("");
          setImages([]);
        }
      } catch (error) {
        setMenuDetail(null);
        setCurrentReview(null);
        toast.error("Không thể tải thông tin đánh giá hiện tại.");
      } finally {
        setLoading(false);
      }
    };

    loadCurrentContext();
  }, [selectedMenu?.id]);

  const ratedCount = useMemo(() => {
    return criteria.filter((criterion) => Number(scores[criterion.id]) > 0)
      .length;
  }, [criteria, scores]);

  const requiredCriteriaCount = useMemo(() => {
    return criteria.filter((criterion) => criterion.isRequired !== false)
      .length;
  }, [criteria]);

  const canSubmit = useMemo(() => {
    return !submitting && !criteriaLoading;
  }, [submitting, criteriaLoading]);

  const averageScore = useMemo(() => {
    if (requiredCriteriaCount > 0 && ratedCount < requiredCriteriaCount)
      return "—";

    const validScores = criteria
      .map((criterion) => Number(scores[criterion.id] || 0))
      .filter((value) => value > 0);

    if (validScores.length === 0) return "—";

    const total = validScores.reduce((sum, value) => sum + value, 0);
    return (total / validScores.length).toFixed(1);
  }, [criteria, ratedCount, requiredCriteriaCount, scores]);

  const handleReset = () => {
    images.forEach((image) => {
      if (image.type === "local") {
        URL.revokeObjectURL(image.previewUrl);
      }
    });

    if (currentReview) {
      setScores(mapReviewToScores(currentReview));
      setNote(currentReview.commentText || "");
      setImages(
        (currentReview.images || []).map((image) => ({
          id: image.id,
          type: "server",
          fileName: image.fileName,
          previewUrl: image.fileUrl,
        }))
      );
      return;
    }

    setScores(initialScores);
    setNote("");
    setImages([]);
  };

  const handleImageSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    if (images.length + selectedFiles.length > 3) {
      toast.warning("Chỉ được tải lên tối đa 3 ảnh.");
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        )
    );

    if (invalidFile) {
      toast.warning(
        "Định dạng ảnh không hợp lệ. Chỉ chấp nhận jpg, jpeg, png, webp."
      );
      event.target.value = "";
      return;
    }

    const prepared = selectedFiles.map(buildImagePreview);
    setImages((prev) => [...prev, ...prepared]);
    event.target.value = "";
  };

  const handleRemoveImage = async (imageId) => {
    const target = images.find((item) => item.id === imageId);

    if (!target) return;

    if (target.type === "server") {
      try {
        await mealReviewService.deleteReviewImage(imageId);
        setImages((prev) => prev.filter((item) => item.id !== imageId));
        setCurrentReview((prev) =>
          prev
            ? {
                ...prev,
                images: (prev.images || []).filter(
                  (item) => item.id !== imageId
                ),
              }
            : prev
        );
        toast.success("Đã xóa ảnh đính kèm.");
      } catch (error) {
        toast.error("Không thể xóa ảnh đính kèm.");
      }
      return;
    }

    URL.revokeObjectURL(target.previewUrl);
    setImages((prev) => prev.filter((item) => item.id !== imageId));
  };

  const buildPayloadFromScores = () =>
    criteria.reduce(
      (payload, criterion) => ({
        ...payload,
        [criteriaFieldMap[criterion.id] || criterion.scoreField]:
          Number(scores[criterion.id]) || 0,
      }),
      {}
    );

  const handleSubmit = async () => {
    if (!activeMenu?.id) {
      toast.warning("Không tìm thấy thông tin bữa ăn để đánh giá.");
      return;
    }

    if (ratedCount < requiredCriteriaCount) {
      toast.warning(
        "Vui lòng đánh giá đầy đủ tất cả tiêu chí bắt buộc trước khi gửi."
      );
      return;
    }

    setSubmitting(true);

    try {
      let successMessage = "Đánh giá đã được gửi thành công.";
      const localImages = images.filter((image) => image.type === "local");
      const serverImages = images.filter((image) => image.type === "server");
      const response = await mealReviewService.createReview({
        menuId: activeMenu.id,
        reviewDate: activeMenu.menuDate,
        mealTypeId: activeMenu.mealTypeId,
        supplierId: activeMenu.supplierId,
        ...buildPayloadFromScores(),
        commentText: note.trim(),
      });

      const reviewId = response?.data?.id;
      if (!reviewId) {
        throw new Error("Không lấy được mã đánh giá mới");
      }

      if (localImages.length > 0) {
        await mealReviewService.uploadReviewImages(
          reviewId,
          localImages.map((image) => image.file)
        );
      }

      toast.success(successMessage);
      setSubmitConfirmation({
        open: true,
        message: successMessage,
      });

      const refreshed = await mealReviewService.getMyCurrentReview({
        menuId: activeMenu.id,
        includeImages: true,
        includeReplies: true,
      });

      const review = refreshed?.data?.review || null;
      setCurrentReview(review);
      setScores(review ? mapReviewToScores(review) : initialScores);
      setNote(review?.commentText || "");

      images.forEach((image) => {
        if (image.type === "local") {
          URL.revokeObjectURL(image.previewUrl);
        }
      });

      setImages(
        (review?.images || []).map((image) => ({
          id: image.id,
          type: "server",
          fileName: image.fileName,
          previewUrl: image.fileUrl,
        }))
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể lưu đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  const infoFields = [
    {
      label: "Ngày",
      value: filters.date,
      key: "date",
      emptyLabel: "Chưa có dữ liệu ngày",
      icon: <CalendarMonthRounded sx={{ color: "#2f6fed" }} />,
      options: dateOptions.map((date) => ({
        value: date,
        label: formatDateOption(date),
      })),
    },
    {
      label: "Bữa ăn",
      value: filters.mealTypeId,
      key: "mealTypeId",
      emptyLabel: "Chưa có dữ liệu bữa ăn",
      icon: <AccessTimeRounded sx={{ color: "#2f6fed" }} />,
      options: mealOptions.map((item) => ({
        value: String(item.mealTypeId),
        label: buildMealOptionLabel(item),
      })),
    },
    {
      label: "Nhà cung cấp",
      value: filters.supplierId,
      key: "supplierId",
      emptyLabel: "Chưa có dữ liệu nhà cung cấp",
      icon: <StorefrontRounded sx={{ color: "#2f6fed" }} />,
      options: supplierOptions.map((item) => ({
        value: String(item.supplierId),
        label: getSupplierLabel(
          item.supplierId,
          supplierNameMap,
          item.supplierName
        ),
      })),
    },
  ];

  return (
    <ThemeProvider theme={timesNewRomanTheme}>
      <Box className="meal-feedback-page">
        <Container maxWidth="lg">
          <Stack className="meal-feedback-shell">
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: "#14325c", mb: 1 }}
              >
                Đánh giá chất lượng bữa ăn
              </Typography>
              <Typography sx={{ color: "#64748b", fontWeight: 500 }}>
                Phản hồi của bạn giúp cải thiện chất lượng phục vụ bữa ăn tại
                đơn vị.
              </Typography>
            </Box>

            <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                sx={{
                  color: "#9aa9c6",
                  fontWeight: 800,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  mb: 2,
                }}
              >
                Thông tin bữa ăn
              </Typography>

              <Grid container spacing={2}>
                {infoFields.map((field) => (
                  <Grid item xs={12} md={4} key={field.key}>
                    <Typography
                      sx={{ mb: 1, fontWeight: 700, color: "#4a5d79" }}
                    >
                      {field.label}
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={field.value}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      InputProps={{
                        startAdornment: (
                          <Box
                            sx={{
                              mr: 1.25,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {field.icon}
                          </Box>
                        ),
                      }}
                    >
                      {field.options.length === 0 && (
                        <MenuItem value="" disabled>
                          {field.emptyLabel || "Chưa có dữ liệu"}
                        </MenuItem>
                      )}
                      {field.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(47,111,237,0.08), rgba(47,111,237,0.02))",
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                }}
              >
                <RestaurantMenuRounded sx={{ color: "#2f6fed", mt: "2px" }} />
                <Typography sx={{ color: "#19355c", lineHeight: 1.7 }}>
                  <Box
                    component="span"
                    sx={{ color: "#2f6fed", fontWeight: 800 }}
                  >
                    Thực đơn:
                  </Box>{" "}
                  {getSafeMenuSummary(menuDetail?.menuSummary) ||
                    getSafeMenuSummary(selectedMenu?.menuSummary) ||
                    DEFAULT_MENU_SUMMARY}
                </Typography>
              </Box>
            </Box>

            <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                sx={{
                  color: "#9aa9c6",
                  fontWeight: 800,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Đánh giá theo tiêu chí
              </Typography>
              <Typography sx={{ mt: 1, color: "#4a5d79" }}>
                Chạm vào số sao tương ứng với mức độ hài lòng của bạn (1-5★)
              </Typography>

              <Stack divider={<Divider />} sx={{ mt: 2 }}>
                {criteria.map((criterion) => (
                  <Box
                    key={criterion.id}
                    sx={{
                      py: 2,
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 2,
                      alignItems: { xs: "flex-start", md: "center" },
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: criterion.accent,
                          fontSize: 20,
                        }}
                      >
                        {criterion.icon}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: "#14325c" }}>
                          {criterion.title}
                        </Typography>
                        <Typography sx={{ color: "#92a0b8" }}>
                          {criterion.description}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Rating
                        max={criterion.maxScore || 5}
                        value={scores[criterion.id] || 0}
                        onChange={(_, value) =>
                          setScores((prev) => ({
                            ...prev,
                            [criterion.id]: value || 0,
                          }))
                        }
                        size="large"
                        sx={{
                          "& .MuiRating-iconFilled": { color: "#0f172a" },
                          "& .MuiRating-iconEmpty": { color: "#d7dfec" },
                        }}
                      />
                      <Typography sx={{ color: "#93a3bc", minWidth: 16 }}>
                        {scores[criterion.id] ? scores[criterion.id] : "–"}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  px: 2.5,
                  py: 2.25,
                  borderRadius: 3,
                  border: "1px solid #ffd566",
                  background:
                    "linear-gradient(90deg, rgba(255,248,220,0.9) 0%, rgba(255,236,153,0.55) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography sx={{ fontWeight: 800, color: "#b45309" }}>
                  Điểm trung bình
                </Typography>
                <Typography
                  sx={{ fontWeight: 900, color: "#d97706", fontSize: 28 }}
                >
                  {averageScore}{" "}
                  <Box component="span" sx={{ fontSize: 18 }}>
                    / 5
                  </Box>
                </Typography>
              </Box>
            </Box>

            <Box className="meal-feedback-card" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                sx={{
                  color: "#9aa9c6",
                  fontWeight: 800,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  mb: 2,
                }}
              >
                Nhận xét & hình ảnh
              </Typography>

              <Typography sx={{ mb: 1, color: "#4a5d79", fontWeight: 700 }}>
                Mẫu nhận xét nhanh
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1.5, flexWrap: "wrap" }}
              >
                {REVIEW_NOTE_TEMPLATES.map((template) => (
                  <Chip
                    key={template.id}
                    label={template.label}
                    onClick={() => setNote(template.text.slice(0, 500))}
                    sx={{
                      bgcolor: "#f4f8ff",
                      color: "#315bca",
                      border: "1px solid #dbeafe",
                      fontWeight: 700,
                      mb: 1,
                    }}
                  />
                ))}
              </Stack>

              <TextField
                multiline
                rows={5}
                fullWidth
                placeholder="Chia sẻ thêm ý kiến của bạn về bữa ăn hôm nay... (không bắt buộc)"
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 500))}
              />
              <Typography sx={{ mt: 1, textAlign: "right", color: "#93a3bc" }}>
                {note.length} / 500
              </Typography>

              <Typography
                sx={{ mt: 2.5, mb: 1.5, color: "#4a5d79", fontWeight: 700 }}
              >
                Đính kèm hình ảnh (tối đa 3 ảnh)
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                {images.map((image) => (
                  <Box
                    key={image.id}
                    sx={{
                      width: 88,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={image.previewUrl}
                      alt={image.fileName || image.file?.name || "review-image"}
                      className="feedback-image-tile"
                      sx={{ width: 72, height: 72, objectFit: "cover" }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveImage(image.id)}
                      sx={{ textTransform: "none", minWidth: 0 }}
                    >
                      Xóa
                    </Button>
                  </Box>
                ))}

                {images.length < 3 && (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadOutlined />}
                    sx={{
                      minWidth: 110,
                      height: 72,
                      borderStyle: "dashed",
                      borderRadius: "14px",
                      color: "#7f93b2",
                    }}
                  >
                    Thêm ảnh
                    <input
                      hidden
                      multiple
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </Button>
                )}
              </Stack>
            </Box>

            {!activeMenu && !loading && (
              <Alert severity="warning">
                Không tìm thấy thông tin bữa ăn để đánh giá.
              </Alert>
            )}
          </Stack>
        </Container>

        <Box className="meal-feedback-toolbar">
          <Container maxWidth="lg">
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{
                py: 2,
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
              }}
            >
              <Chip
                label={`Đã đánh giá ${ratedCount}/${criteria.length} tiêu chí`}
                sx={{
                  alignSelf: "flex-start",
                  color: "#5f7290",
                  bgcolor: "#fff",
                  border: "1px solid #d7e3f2",
                }}
              />

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRounded />}
                  onClick={handleReset}
                  sx={{
                    borderRadius: 3,
                    px: 2.5,
                    color: "#64748b",
                    borderColor: "#d7e3f2",
                    fontWeight: 700,
                  }}
                >
                  Đặt lại
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRounded />}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  sx={{
                    borderRadius: 3,
                    px: 2.75,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    boxShadow: "0 12px 24px rgba(37, 99, 235, 0.24)",
                  }}
                >
                  Gửi đánh giá
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Backdrop
          open={loading || submitting || criteriaLoading}
          sx={{ color: "#fff", zIndex: 1300 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <Snackbar
          open={submitConfirmation.open}
          autoHideDuration={3500}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          onClose={() =>
            setSubmitConfirmation((prev) => ({ ...prev, open: false }))
          }
        >
          <Alert
            onClose={() =>
              setSubmitConfirmation((prev) => ({ ...prev, open: false }))
            }
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {submitConfirmation.message || "Đánh giá đã được gửi thành công."}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default MealFeedbackPage;
