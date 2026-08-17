import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/vi";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import SummaryCards from "../../components/Canteen/SummaryCards";
import FilterBar from "../../components/Canteen/FilterBar";
import RegistrationTable from "../../components/Canteen/RegistrationTable";
import EditModal from "../../components/Canteen/EditModal";
import { mealBookingService as canteenService } from "@services/mealBookingService";
import { trackAction } from "../../utils/trackAction";
import { filterParamsSchema } from "../../schemas/canteenSchemas";

moment.locale("vi");

const normalizeSlot = (rawSlot) => {
  const s = String(rawSlot || "")
    .toLowerCase()
    .trim();
  if (s === "breakfast" || s === "lunch" || s === "dinner") return s;
  const n = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (n.includes("sang")) return "breakfast";
  if (n.includes("trua")) return "lunch";
  if (n.includes("toi")) return "dinner";
  return "";
};

const Management = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const allMode = searchParams.get("all") === "1";
  const dateParam = searchParams.get("date") || moment().format("YYYY-MM-DD");

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [filters, setFilters] = useState({
    keyword: "",
    dept: "",
    slot: "",
  });

  const fetchData = useCallback(async () => {
    const requestDate = allMode ? undefined : dateParam;
    const validation = filterParamsSchema.safeParse({
      date: requestDate || moment().format("YYYY-MM-DD"),
      ...filters,
    });
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return;
    }

    setLoading(true);
    try {
      // Dùng allSettled để 1 API lỗi không crash toàn bộ
      const [summaryResult, regResult, logResult] = await Promise.allSettled([
        allMode
          ? Promise.resolve({ success: true, data: null })
          : canteenService.getDailySummary(dateParam),
        canteenService.getAdminRegistrations({
          ...(requestDate ? { date: requestDate } : {}),
          ...filters,
        }),
        canteenService.getAdminRegistrationLogs({ page: 1, limit: 8 }),
      ]);

      if (summaryResult.status === "fulfilled") {
        const res = summaryResult.value;
        setSummary(res?.success ? res.data : (res?.data ?? res ?? null));
      } else {
        console.warn("getDailySummary failed:", summaryResult.reason);
      }

      if (regResult.status === "fulfilled") {
        const res = regResult.value;
        // Hỗ trợ cả { success, data } và array trực tiếp
        const list = res?.success
          ? res.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
        setRegistrations(list);

        // Trích xuất departments từ dữ liệu đăng ký
        if (list.length > 0) {
          const deptMap = new Map();
          list.forEach((r) => {
            if (r.department_id && r.department_name) {
              deptMap.set(r.department_id, {
                id: r.department_id,
                name: r.department_name,
              });
            }
          });
          if (deptMap.size > 0) setDepartments(Array.from(deptMap.values()));
        }
      } else {
        console.error("getAdminRegistrations failed:", regResult.reason);
        setRegistrations([]);
      }

      if (logResult.status === "fulfilled") {
        const res = logResult.value;
        setAdminLogs(res?.success ? res?.data?.items || [] : []);
      } else {
        console.error("getAdminRegistrationLogs failed:", logResult.reason);
        setAdminLogs([]);
      }

      trackAction("FETCH_CANTEEN_MANAGEMENT_DATA", {
        date: requestDate || "all",
        filters,
      });
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [allMode, dateParam, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (days) => {
    const newDate = moment(dateParam).add(days, "days").format("YYYY-MM-DD");
    setSearchParams({ date: newDate });
  };
  const handleAllMode = () => {
    setSearchParams({ all: "1" });
  };
  const handleDayMode = () => {
    setSearchParams({ date: dateParam });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (row) => {
    setSelectedReg(row);
    setIsEditModalOpen(true);
  };

  const handleSave = async (id, data) => {
    try {
      const res = await canteenService.registerMeal({ ...data });
      if (res.success) {
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const isToday = !allMode && moment(dateParam).isSame(moment(), "day");
  const calculatedSummary = useMemo(() => {
    const result = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
    (registrations || []).forEach((row) => {
      const meals = Array.isArray(row.meals) ? row.meals : [];
      if (meals.length > 0) {
        const dedup = new Set();
        meals.forEach((m) => {
          const slot = normalizeSlot(
            m.slot || m.meal_name || row.menu?.meal_slot
          );
          if (slot) dedup.add(slot);
        });
        dedup.forEach((slot) => {
          result[slot] += 1;
        });
      } else {
        const slot = normalizeSlot(row.menu?.meal_slot);
        if (slot) result[slot] += 1;
      }
    });
    result.total = result.breakfast + result.lunch + result.dinner;
    return result;
  }, [registrations]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}
          >
            Danh sách Đăng ký
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Quản lý suất ăn hằng ngày •
            <Chip
              label={
                allMode
                  ? "Tất cả"
                  : isToday
                    ? "Hôm nay"
                    : moment(dateParam).format("DD/MM/YYYY")
              }
              size="small"
              color={isToday || allMode ? "primary" : "default"}
              variant={isToday || allMode ? "filled" : "outlined"}
              sx={{ fontWeight: 600, ml: 1 }}
            />
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            onClick={() =>
              trackAction("EXPORT_EXCEL_START", { date: dateParam })
            }
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="contained"
            startIcon={<FactCheckIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              bgcolor: "success.main",
              fontWeight: 600,
              "&:hover": { bgcolor: "success.dark" },
            }}
            onClick={() => {
              trackAction("NAVIGATE_TO_CHECKIN");
              navigate("/meals/check-in");
            }}
          >
            Check-in Suất ăn
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              bgcolor: "primary.main",
              fontWeight: 600,
              "&:hover": { bgcolor: "primary.dark" },
            }}
            onClick={() =>
              trackAction("PRINT_MEAL_SLIP_START", { date: dateParam })
            }
          >
            In phiếu bếp
          </Button>
        </Stack>
      </Box>

      {/* Date Navigation */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "background.neutral",
          p: 1,
          borderRadius: 3,
          width: "fit-content",
        }}
      >
        <Button
          onClick={() => handleDateChange(-1)}
          disabled={allMode}
          size="small"
          sx={{ minWidth: 40, p: 1, borderRadius: 2 }}
        >
          <KeyboardArrowLeftIcon />
        </Button>
        <Typography
          sx={{
            fontWeight: 700,
            minWidth: 150,
            textAlign: "center",
            color: "text.primary",
          }}
        >
          {allMode ? "Tất cả" : moment(dateParam).format("dddd, DD/MM")}
        </Typography>
        <Button
          onClick={() => handleDateChange(1)}
          disabled={allMode}
          size="small"
          sx={{ minWidth: 40, p: 1, borderRadius: 2 }}
        >
          <KeyboardArrowRightIcon />
        </Button>
        {allMode ? (
          <Button
            onClick={handleDayMode}
            size="small"
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Theo ngày
          </Button>
        ) : (
          <Button
            onClick={handleAllMode}
            size="small"
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Tất cả
          </Button>
        )}
      </Box>

      {/* Stats */}
      <SummaryCards
        summary={calculatedSummary.total > 0 ? calculatedSummary : summary}
      />

      {/* Filters & Table */}
      <Box
        sx={{
          background: "var(--white)",
          p: 3,
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--neutral-100)",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        }}
      >
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          departments={departments}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <RegistrationTable
            registrations={registrations}
            onView={(row) => console.log("View", row)}
            onEdit={handleEdit}
          />
        )}
      </Box>

      <Box
        sx={{
          mt: 2,
          background: "var(--white)",
          p: 2.5,
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--neutral-100)",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 1.2 }}>
          Nhật ký đăng ký suất ăn gần đây
        </Typography>
        {adminLogs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có nhật ký thao tác.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {adminLogs.map((log) => (
              <Box
                key={log.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  p: 1,
                  borderRadius: 1.5,
                  border: "1px solid #E5E7EB",
                  bgcolor: "#F9FAFB",
                }}
              >
                <Typography variant="body2">
                  {log.fullName || log.userName || log.userId}: {log.details}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {moment(log.timestamp).format("HH:mm DD/MM/YYYY")}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <EditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        registration={selectedReg}
        onSave={handleSave}
        dishes={dishes}
      />
    </Container>
  );
};

export default Management;
