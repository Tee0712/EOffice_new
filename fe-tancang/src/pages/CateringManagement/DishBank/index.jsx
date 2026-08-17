import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Pagination,
  Backdrop,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  MenuBook as BookIcon,
  Restaurant as TotalIcon,
  RiceBowl as RiceIcon,
  SoupKitchen as NoodleIcon,
  Category as OtherIcon,
  Block as InactiveIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useToast } from "@components/common/ToastProvider";
import axios from "axios";
import StatCards from "./components/StatCards";
import FilterBar from "./components/FilterBar";
import DishTable from "./components/DishTable";
import DishCards from "./components/DishCards";
import {
  DishFormModal,
  DishViewModal,
  DeactivateModal,
  ExportConfirmModal,
} from "./components/DishModals";
import { API_CATERING_DISHES } from "@EnvironmentFile/constants/urlConfig";
import "./DishBank.css";

const DishBank = () => {
  const navigate = useNavigate();
  const showToast = useToast();

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
      MuiTableCell: {
        styleOverrides: {
          root: { fontFamily: '"Inter", "Roboto", "Segoe UI", "Helvetica", "Arial", sans-serif' },
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
    },
  });

  const [dishes, setDishes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [summary, setSummary] = useState([
    { label: "Tổng số món", value: 0, icon: <TotalIcon />, color: "#1890ff" },
    { label: "Món cơm", value: 0, icon: <RiceIcon />, color: "#fa8c16" },
    { label: "Bún/Phở/Mì", value: 0, icon: <NoodleIcon />, color: "#52c41a" },
    { label: "Món khác", value: 0, icon: <OtherIcon />, color: "#722ed1" },
    {
      label: "Ngưng phục vụ",
      value: 0,
      icon: <InactiveIcon />,
      color: "#94a3b8",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    category: "ALL",
    supplierId: "ALL",
    status: "ALL",
    priceRange: "ALL",
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("GRID");
  const itemsPerPage = 15;

  const [modalType, setModalType] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token_app");
      const params = {
        page: page - 1,
        size: itemsPerPage,
        keyword: filters.keyword,
        category: filters.category === "ALL" ? undefined : filters.category,
        is_active:
          filters.status === "ALL" ? undefined : filters.status === "ACTIVE",
        priceRange:
          filters.priceRange === "ALL" ? undefined : filters.priceRange,
        supplierId:
          filters.supplierId === "ALL" ? undefined : filters.supplierId,
      };

      const response = await axios.get(API_CATERING_DISHES, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data) {
        setDishes(response.data.items || []);
        setTotalCount(response.data.total || 0);

        if (response.data.categoryCounts) {
          const counts = {
            ...response.data.categoryCounts,
            ...response.data.statusCounts,
          };
          setCategoryCounts(response.data.categoryCounts);
          const otherCount =
            (counts.canh || 0) +
            (counts.other || 0) +
            ((counts.all || 0) -
              (counts.com || 0) -
              (counts.bun_pho || 0) -
              (counts.canh || 0) -
              (counts.other || 0));

          setSummary([
            {
              label: "Tổng số món",
              value: counts.all || 0,
              icon: <TotalIcon />,
              color: "#1890ff",
            },
            {
              label: "Món cơm",
              value: counts.com || 0,
              icon: <RiceIcon />,
              color: "#fa8c16",
            },
            {
              label: "Bún/Phở/Mì",
              value: counts.bun_pho || 0,
              icon: <NoodleIcon />,
              color: "#52c41a",
            },
            {
              label: "Món khác",
              value: otherCount >= 0 ? otherCount : 0,
              icon: <OtherIcon />,
              color: "#722ed1",
            },
            {
              label: "Ngưng phục vụ",
              value: counts.inactive || 0,
              icon: <InactiveIcon />,
              color: "#94a3b8",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
      showToast("Không thể tải danh sách món ăn");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleAction = (type, dish = null) => {
    setSelectedDish(dish);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedDish(null);
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token_app");
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        ...data,
        dish_code: data.dish_code || data.code,
        imageUrl: data.image_url || data.imageUrl,
        image: data.image_url || data.imageUrl,
      };

      if (modalType === "EDIT") {
        await axios.put(`${API_CATERING_DISHES}/${selectedDish.id}`, payload, {
          headers,
        });
        showToast("Cập nhật món ăn thành công");
      } else {
        await axios.post(API_CATERING_DISHES, payload, { headers });
        showToast("Đã thêm món ăn mới vào ngân hàng");
      }
      handleCloseModal();
      fetchDishes();
    } catch (error) {
      console.error("Error saving dish:", error);
      showToast(error.response?.data?.message || "Lỗi khi lưu món ăn");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (dish) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token_app");
      const headers = { Authorization: `Bearer ${token}` };

      const newStatus = dish.isActive === 1 ? 0 : 1;
      const actionText = newStatus === 1 ? "kích hoạt" : "ngưng phục vụ";

      // Update Status: Use the new status PATCH API with toggle logic
      await axios.patch(
        `${API_CATERING_DISHES}/${dish.id}/status`,
        { isActive: newStatus },
        { headers }
      );

      showToast(`Đã ${actionText} món ăn thành công`);
      handleCloseModal();
      fetchDishes();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Không thể cập nhật trạng thái món ăn");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token_app");
      const params = {
        keyword: filters.keyword,
        category: filters.category === "ALL" ? undefined : filters.category,
        is_active:
          filters.status === "ALL"
            ? undefined
            : filters.status === "ACTIVE"
              ? 1
              : 0,
        priceRange:
          filters.priceRange === "ALL" ? undefined : filters.priceRange,
        supplierId:
          filters.supplierId === "ALL" ? undefined : filters.supplierId,
      };

      const response = await axios.get(`${API_CATERING_DISHES}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: "blob",
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Danh_sach_mon_an_${timestamp}.xlsx`);

      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Xuất file Excel thành công");
      handleCloseModal();
    } catch (error) {
      console.error("Error exporting excel:", error);
      showToast("Không thể xuất file Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="dish-bank-page standard-font">
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  mr: 1,
                  bgcolor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                <BackIcon sx={{ color: "#64748b" }} />
              </IconButton>
              <BookIcon sx={{ fontSize: 32, color: "#fa8c16", mr: 1 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#1a3353" }}
              >
                Ngân hàng Món ăn
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleAction("EXPORT")}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  borderRadius: "10px",
                  borderColor: "#e2e8f0",
                  color: "#64748b",
                  bgcolor: "white",
                  "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
                }}
              >
                Xuất Excel
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAction("ADD")}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#22c55e",
                  borderRadius: "10px",
                  px: 3,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#16a34a", boxShadow: "none" },
                }}
              >
                Thêm món ăn
              </Button>
            </Stack>
          </Box>

          <StatCards summary={summary} />

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            categoryCounts={categoryCounts}
          />

          <Box sx={{ position: "relative", minHeight: "400px" }}>
            {loading && (
              <Backdrop
                open={true}
                sx={{
                  position: "absolute",
                  zIndex: 10,
                  bgcolor: "rgba(255,255,255,0.6)",
                  borderRadius: "24px",
                }}
              >
                <CircularProgress color="primary" />
              </Backdrop>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#1a3353" }}
              >
                Dữ liệu món ăn{" "}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  ({totalCount} món)
                </span>
              </Typography>
            </Box>

            {viewMode === "GRID" ? (
              <DishCards
                dishes={dishes}
                onView={(d) => handleAction("VIEW", d)}
                onEdit={(d) => handleAction("EDIT", d)}
                onToggle={(d) => handleAction("TOGGLE", d)}
              />
            ) : (
              <DishTable
                dishes={dishes}
                onView={(d) => handleAction("VIEW", d)}
                onEdit={(d) => handleAction("EDIT", d)}
                onToggle={(d) => handleAction("TOGGLE", d)}
              />
            )}

            {totalCount >= 0 && (
              <Stack spacing={2} sx={{ mt: 6, alignItems: "center" }}>
                <Pagination
                  count={Math.ceil(totalCount / itemsPerPage)}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  color="primary"
                  size="large"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: "12px",
                      fontWeight: 700,
                    },
                  }}
                />
              </Stack>
            )}
          </Box>
        </Container>

        <DishViewModal
          open={modalType === "VIEW"}
          onClose={handleCloseModal}
          dish={selectedDish}
        />
        <DishFormModal
          open={modalType === "ADD" || modalType === "EDIT"}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          dish={selectedDish}
          mode={modalType}
        />
        <DeactivateModal
          open={modalType === "TOGGLE"}
          onClose={handleCloseModal}
          onConfirm={handleToggleStatus}
          dish={selectedDish}
        />
        <ExportConfirmModal
          open={modalType === "EXPORT"}
          onClose={handleCloseModal}
          onConfirm={handleExportExcel}
        />
      </Box>
    </ThemeProvider>
  );
};

export default DishBank;
