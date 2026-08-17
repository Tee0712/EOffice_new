import React, { useState, useMemo, useCallback, useEffect } from "react";
import moment from "moment";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Rating,
  Divider,
  Stack,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Restaurant as DishIcon,
  DownloadOutlined as ExportIcon,
  Close as CloseIcon,
  Schedule as PendingIcon,
  Star as StarIcon,
  CalendarMonth as CalendarIcon,
  CleanHands as HygieneIcon,
  FormatQuote as QuoteIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import StatCards from "./components/StatCards";
import EvaluationForm from "./components/EvaluationForm";
import EvaluationHistory from "./components/EvaluationHistory";
import EvaluationEditModal from "./components/EvaluationEditModal";
import {
  API_CATERING_SUPPLIER_EVALUATION_STATS,
  API_CATERING_SUPPLIER_EVALUATIONS_NEW,
  API_CATERING_SUPPLIERS,
  API_CATERING_SUPPLIER_PRICES,
  API_CATERING_SUPPLIER_UNEVALUATED_DISHES,
  API_CATERING_SUPPLIER_EVALUATIONS_EXPORT,
} from "@EnvironmentFile/constants/urlConfig";
import { callApi } from "@services/api";
import {
  mockStats,
  mockEvaluations,
  mockSuppliers,
  mockOrders,
} from "./mockData";
import "./SupplierEvaluation.css";

const EvaluationDetailModal = ({ open, onClose, evaluation }) => {
  if (!evaluation) return null;

  const scoreLabels = {
    food_quality: "Chất lượng món ăn",
    delivery_time: "Đúng giờ giao hàng",
    hygiene_safety_score: "Vệ sinh an toàn",
    service_attitude_score: "Thái độ phục vụ",
  };

  const scoreIcons = {
    food_quality: <DishIcon sx={{ color: "#22c55e" }} />,
    delivery_time: <PendingIcon sx={{ color: "#0ea5e9" }} />,
    hygiene_safety_score: <HygieneIcon sx={{ color: "#8b5cf6" }} />,
    service_attitude_score: <StarIcon sx={{ color: "#f59e0b" }} />,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "standard-font",
        sx: { borderRadius: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #eef2f6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{ fontWeight: 900, color: "#1a3353", fontSize: "1.25rem" }}
        >
          Chi tiết Đánh giá
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#94a3b8",
            bgcolor: "white",
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 88,
              height: 88,
              borderRadius: "28px",
              bgcolor: "#1a3353",
              fontWeight: 900,
              fontSize: "36px",
              mx: "auto",
              mb: 2,
              boxShadow: "0 8px 16px rgba(26,51,83,0.2)",
            }}
          >
            {evaluation.supplierName
              ? evaluation.supplierName.split(" ")[
                  evaluation.supplierName.split(" ").length - 1
                ][0]
              : "?"}
          </Avatar>
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: "#1a3353", mb: 0.5 }}
          >
            {evaluation.supplierName || "Nhà cung cấp"}
          </Typography>

          {evaluation.dishName && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: "12px",
                bgcolor: "#f0fdf4",
                color: "#16a34a",
                mb: 1.5,
              }}
            >
              <DishIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {evaluation.dishName}
              </Typography>
            </Box>
          )}

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <CalendarIcon sx={{ fontSize: 16 }} /> {evaluation.date}
          </Typography>
        </Box>

        {evaluation.status === "COMPLETED" ? (
          <>
            <Box
              sx={{
                p: 4,
                borderRadius: "32px",
                bgcolor: "#f0f9ff",
                textAlign: "center",
                mb: 4,
                border: "1px solid #e0f2fe",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#0ea5e9",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                ĐIỂM ĐÁNH GIÁ TỔNG QUAN
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  mt: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: "#1a3353",
                    fontSize: "3.5rem",
                    lineHeight: 1,
                  }}
                >
                  {evaluation.overallScore.toFixed(1)}
                </Typography>
                <Box>
                  <Rating
                    value={evaluation.overallScore}
                    precision={0.1}
                    readOnly
                    size="large"
                    max={5}
                    sx={{ "& .MuiRating-iconFilled": { color: "#f59e0b" } }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#1a3353",
                      fontWeight: 800,
                      textAlign: "left",
                      mt: 0.5,
                    }}
                  >
                    {evaluation.overallScore >= 4.5
                      ? "Xuất sắc"
                      : evaluation.overallScore >= 4
                        ? "Tốt"
                        : "Trung bình"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(evaluation.scores || {}).map(([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: "24px",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      transition: "all 0.2s",
                      "&:hover": { bgcolor: "#f8fafc", borderColor: "#e2e8f0" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          p: 0.8,
                          borderRadius: "10px",
                          bgcolor: "#f1f5f9",
                          display: "flex",
                        }}
                      >
                        {scoreIcons[key] || scoreIcons.food_quality}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          fontSize: "10px",
                        }}
                      >
                        {scoreLabels[key] || key.split("_").join(" ")}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: "#1a3353",
                          fontSize: "1.5rem",
                        }}
                      >
                        {value.toFixed(1)}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#94a3b8",
                          fontSize: "0.875rem",
                        }}
                      >
                        / 5.0
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  ml: 1,
                }}
              >
                NHẬN XÉT CHI TIẾT
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 3,
                  borderRadius: "24px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  position: "relative",
                }}
              >
                <QuoteIcon
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    color: "#cbd5e1",
                    fontSize: 24,
                    opacity: 0.5,
                  }}
                />
                <Typography
                  sx={{
                    mt: 1,
                    pl: 2.5,
                    fontStyle: "italic",
                    color: "#1a3353",
                    fontWeight: 500,
                    lineHeight: 1.6,
                  }}
                >
                  "{evaluation.comment || "Không có nhận xét."}"
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: "#fffbeb",
              borderRadius: "32px",
              border: "1px solid #fef3c7",
            }}
          >
            <PendingIcon sx={{ fontSize: 64, color: "#f59e0b", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#d97706", fontWeight: 900 }}>
              Chưa được đánh giá
            </Typography>
            <Typography variant="body2" sx={{ color: "#b45309", mt: 1 }}>
              Vui lòng tiến hành đánh giá cho NCC này.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="contained"
          sx={{
            borderRadius: "16px",
            bgcolor: "#1a3353",
            textTransform: "none",
            fontWeight: 800,
            py: 1.8,
            fontSize: "1rem",
            boxShadow: "0 8px 16px rgba(26,51,83,0.3)",
            "&:hover": {
              bgcolor: "#2c3e50",
              boxShadow: "0 12px 24px rgba(26,51,83,0.4)",
            },
          }}
        >
          Đóng cửa sổ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SupplierEvaluation = () => {
  const navigate = useNavigate();

  const theme = createTheme({
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: "1.9rem", fontWeight: 800 },
      h5: { fontSize: "1.5rem", fontWeight: 800 },
      h6: { fontSize: "1.1rem", fontWeight: 700 },
      subtitle1: { fontSize: "1rem", fontWeight: 600 },
      subtitle2: { fontSize: "0.9rem", fontWeight: 600 },
      body1: { fontSize: "0.95rem" },
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.78rem" },
      button: { fontSize: "0.9rem", fontWeight: 700, textTransform: "none" },
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
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontSize: "0.95rem",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif',
            fontWeight: 800,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
      MuiRating: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
        },
      },
    },
  });

  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedEval, setSelectedEval] = useState(null);
  const [editingEval, setEditingEval] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [filterTime, setFilterTime] = useState("ALL");
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 5;
  const normalizedSupplierId = useMemo(() => {
    if (filterSupplier === "ALL") return undefined;
    const parsed = Number(filterSupplier);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [filterSupplier]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIER_EVALUATION_STATS);
      if (res?.success && res.data) {
        const d = res.data;
        const mappedStats = [
          {
            title: "TỔNG ĐÁNH GIÁ",
            value: d.totalEvaluations || d.totalCount || d.total || 0,
            icon: "assignment",
            color: "#0ea5e9",
            bgColor: "#f0f9ff",
          },
          {
            title: "CHỜ ĐÁNH GIÁ",
            value: d.pendingEvaluations || d.pendingCount || d.pending || 0,
            icon: "schedule",
            color: "#f59e0b",
            bgColor: "#fffbeb",
          },
          {
            title: "XUẤT SẮC (5★)",
            value: d.excellentCount || d.excellent || 0,
            icon: "verified",
            color: "#22c55e",
            bgColor: "#f0fdf4",
          },
          {
            title: "TỐT (4★)",
            value: d.goodCount || d.good || 0,
            icon: "thumb_up",
            color: "#8b5cf6",
            bgColor: "#f5f3ff",
          },
          {
            title: "TRUNG BÌNH (1-3★)",
            value:
              d.needImprovementCount ||
              d.improvement ||
              d.averageCount ||
              d.average ||
              d.badCount ||
              0,
            icon: "report_problem",
            color: "#ef4444",
            bgColor: "#fef2f2",
          },
        ];
        setStats(mappedStats);
      }
    } catch (error) {
      console.error("Failed to fetch evaluation stats:", error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await callApi("GET", API_CATERING_SUPPLIERS, {
        page: 0,
        size: 100,
      });
      const items = res?.data?.items || res?.items || res?.data || [];
      if (Array.isArray(items)) {
        setSuppliers(items);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  }, []);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let from_date, to_date;

      if (filterTime === "MONTH") {
        from_date = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to_date = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
      } else if (filterTime === "LASTMONTH") {
        from_date = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split("T")[0];
        to_date = new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split("T")[0];
      }
      // If filterTime is 'ALL', from_date and to_date remain undefined

      const params = {
        supplier_id: normalizedSupplierId,
        from_date,
        to_date,
        page: page,
        size: pageSize,
        sort: "created_at,desc", // Show newest first
      };
      const res = await callApi(
        "GET",
        API_CATERING_SUPPLIER_EVALUATIONS_NEW,
        params
      );
      const items = res?.data?.items || res?.data || res?.items || [];
      const total =
        res?.data?.total ||
        res?.total ||
        res?.data?.total_items ||
        items.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / pageSize));

      if (Array.isArray(items)) {
        setEvaluations(
          items.map((item) => {
            const scoresObj = {
              food_quality: 0,
              delivery_time: 0,
              hygiene_safety_score: 0,
              service_attitude_score: 0,
            };
            if (Array.isArray(item.scores)) {
              item.scores.forEach((s) => {
                const code = s.criterion_code || "";
                if (code === "food_quality" || code === "quality")
                  scoresObj.food_quality = s.score;
                if (code === "delivery_time" || code === "on_time")
                  scoresObj.delivery_time = s.score;
                if (code === "hygiene_safety" || code === "hygiene")
                  scoresObj.hygiene_safety_score = s.score;
                if (code === "service_attitude" || code === "attitude")
                  scoresObj.service_attitude_score = s.score;
              });
            }
            return {
              ...item,
              supplierName:
                item.supplier_name ||
                item.supplierName ||
                item.supplier?.name ||
                "Nhà cung cấp",
              date:
                item.display_date ||
                item.delivery_date ||
                item.order_date ||
                new Date(item.created_at || item.date).toLocaleDateString(
                  "vi-VN"
                ),
              status:
                item.is_evaluated ||
                item.status === "COMPLETED" ||
                item.type === "evaluated"
                  ? "COMPLETED"
                  : "PENDING",
              overallScore: item.overall_score || 0,
              dishName:
                item.dish_name || item.dish?.name || item.dishName || "",
              scores: scoresObj,
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch evaluations:", error);
    } finally {
      setLoading(false);
    }
  }, [normalizedSupplierId, filterTime, page]);

  const filteredEvaluations = useMemo(() => {
    if (!normalizedSupplierId) return evaluations;
    return evaluations.filter(
      (ev) =>
        Number(ev.supplier_id) === normalizedSupplierId ||
        Number(ev.supplierId) === normalizedSupplierId
    );
  }, [evaluations, normalizedSupplierId]);

  const unevaluatedDishes = useMemo(() => {
    return dishes; // Backend already filtered this!
  }, [dishes]);

  useEffect(() => {
    setPage(1);
  }, [filterSupplier, filterTime]);

  useEffect(() => {
    fetchStats();
    fetchSuppliers();
  }, [fetchStats, fetchSuppliers]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const handleSupplierChange = async (supplierId) => {
    if (!supplierId) {
      setDishes([]);
      return;
    }

    try {
      // Direct call to the "Unevaluated" API to populate the dropdown correctly
      const res = await callApi(
        "GET",
        API_CATERING_SUPPLIER_UNEVALUATED_DISHES(supplierId)
      );
      setDishes(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch unevaluated dishes:", error);
    }
  };

  // Automatic dish filtering is now handled by API
  const handleExport = () => {
    setIsExportConfirmOpen(true);
  };

  const executeExport = async () => {
    setIsExportConfirmOpen(false);
    try {
      toast.info("Đang chuẩn bị xuất báo cáo đánh giá...");
      const now = new Date();
      let from_date, to_date;

      if (filterTime === "MONTH") {
        from_date = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to_date = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
      } else if (filterTime === "LASTMONTH") {
        from_date = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split("T")[0];
        to_date = new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split("T")[0];
      }

      const params = new URLSearchParams();
      if (normalizedSupplierId)
        params.append("supplier_id", String(normalizedSupplierId));
      if (from_date) params.append("from_date", from_date);
      if (to_date) params.append("to_date", to_date);

      const token =
        localStorage.getItem("token_app") ||
        localStorage.getItem("access_token");
      const response = await fetch(
        `${API_CATERING_SUPPLIER_EVALUATIONS_EXPORT}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao-cao-danh-gia-NCC-${moment().format("YYYYMMDD-HHmm")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Xuất báo cáo thành công!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Có lỗi xảy ra khi xuất báo cáo");
    }
  };

  const handleView = (ev) => {
    setSelectedEval(ev);
    setIsModalOpen(true);
  };

  const handleEdit = (ev) => {
    setEditingEval(ev);
    setIsEditModalOpen(true);
  };

  const handleUpdateEvaluation = async (formData) => {
    try {
      const payload = {
        supplier_id: Number(formData.supplier_id || formData.supplierId),
        dish_id:
          formData.dish_id || formData.dishId
            ? Number(formData.dish_id || formData.dishId)
            : null,
        comment: formData.comment || "",
        food_quality_score: Number(formData.food_quality_score) || 0,
        delivery_time_score: Number(formData.delivery_time_score) || 0,
        hygiene_safety_score: Number(formData.hygiene_safety_score) || 0,
        service_attitude_score: Number(formData.service_attitude_score) || 0,
        scores: [
          {
            criterion_code: "food_quality",
            score: Number(formData.food_quality_score) || 0,
          },
          {
            criterion_code: "delivery_time",
            score: Number(formData.delivery_time_score) || 0,
          },
          {
            criterion_code: "hygiene_safety",
            score: Number(formData.hygiene_safety_score) || 0,
          },
          {
            criterion_code: "service_attitude",
            score: Number(formData.service_attitude_score) || 0,
          },
        ],
      };

      // Assuming PUT /api/v1/supplier-evaluations/{id}
      const res = await callApi(
        "PUT",
        `${API_CATERING_SUPPLIER_EVALUATIONS_NEW}/${formData.id}`,
        payload
      );
      if (res) {
        toast.success("Cập nhật đánh giá thành công!");
        setIsEditModalOpen(false);
        fetchStats();
        fetchEvaluations();
      }
    } catch (error) {
      console.error("Failed to update evaluation:", error);
      toast.error("Cập nhật đánh giá thất bại");
    }
  };

  const handleSubmitEvaluation = async (formData) => {
    try {
      const payload = {
        supplier_id: Number(formData.supplierId),
        dish_id: formData.dishId ? Number(formData.dishId) : undefined,
        evaluation_status: "submitted",
        comment: formData.comment || "",
        food_quality_score: Number(formData.food_quality_score) || 0,
        delivery_time_score: Number(formData.delivery_time_score) || 0,
        hygiene_safety_score: Number(formData.hygiene_safety_score) || 0,
        service_attitude_score: Number(formData.service_attitude_score) || 0,
        scores: [
          {
            criterion_code: "food_quality",
            score: Number(formData.food_quality_score) || 0,
          },
          {
            criterion_code: "delivery_time",
            score: Number(formData.delivery_time_score) || 0,
          },
          {
            criterion_code: "hygiene_safety",
            score: Number(formData.hygiene_safety_score) || 0,
          },
          {
            criterion_code: "service_attitude",
            score: Number(formData.service_attitude_score) || 0,
          },
        ],
      };
      const res = await callApi(
        "POST",
        API_CATERING_SUPPLIER_EVALUATIONS_NEW,
        payload
      );
      if (res) {
        toast.success("Gửi đánh giá thành công!");
        fetchStats();
        fetchEvaluations();
        // Refresh the unevaluated dish list for the selected supplier
        handleSupplierChange(formData.supplierId);
      }
    } catch (error) {
      console.error("Failed to submit evaluation:", error);
      toast.error("Gửi đánh giá thất bại");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        className="supplier-evaluation-page standard-font"
        sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}
      >
        <Container maxWidth="xl">
          {/* Compact Header Section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  bgcolor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                <BackIcon sx={{ color: "#1a3353" }} />
              </IconButton>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    color: "#1a3353",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  Đánh giá Nhà cung cấp
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                px: 3,
                borderRadius: "12px",
                bgcolor: "#1a3353",
                boxShadow: "0 4px 12px rgba(26,51,83,0.2)",
                "&:hover": { bgcolor: "#2c3e50" },
              }}
            >
              Xuất báo cáo
            </Button>
          </Box>

          <StatCards stats={stats.length > 0 ? stats : mockStats} />

          <Grid container spacing={4}>
            <Grid item xs={12} lg={4}>
              <EvaluationForm
                suppliers={suppliers}
                dishes={unevaluatedDishes}
                onSupplierChange={handleSupplierChange}
                onSubmit={handleSubmitEvaluation}
              />
            </Grid>
            <Grid item xs={12} lg={8}>
              <EvaluationHistory
                evaluations={filteredEvaluations}
                onView={handleView}
                onEdit={handleEdit}
                onFilterSupplier={setFilterSupplier}
                onFilterTime={setFilterTime}
                filterSupplier={filterSupplier}
                filterTime={filterTime}
                loading={loading}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
                pageSize={pageSize}
                suppliers={suppliers}
              />
            </Grid>
          </Grid>
        </Container>

        <EvaluationDetailModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          evaluation={selectedEval}
        />

        <EvaluationEditModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          evaluation={editingEval}
          onSave={handleUpdateEvaluation}
        />

        {/* Export Confirmation Dialog */}
        <Dialog
          open={isExportConfirmOpen}
          onClose={() => setIsExportConfirmOpen(false)}
          PaperProps={{
            sx: { borderRadius: "24px", p: 1, maxWidth: "400px" },
          }}
        >
          <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                p: 2,
                borderRadius: "50%",
                bgcolor: "#f0f9ff",
                mb: 2,
              }}
            >
              <ExportIcon sx={{ fontSize: 40, color: "#0ea5e9" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a3353" }}>
              Xác nhận xuất báo cáo
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", pb: 2 }}>
            <Typography sx={{ color: "#64748b" }}>
              Hệ thống sẽ tổng hợp số liệu đánh giá dựa trên các tiêu chí bạn đã
              lọc. Bạn có muốn tiếp tục tải file Excel không?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setIsExportConfirmOpen(false)}
              fullWidth
              variant="outlined"
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                borderColor: "#e2e8f0",
                color: "#64748b",
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={executeExport}
              fullWidth
              variant="contained"
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#0ea5e9",
                "&:hover": { bgcolor: "#0284c7" },
              }}
            >
              Xác nhận tải
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default SupplierEvaluation;
