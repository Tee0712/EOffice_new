import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { officeSupplyReportService } from "../../../../services/vppOfficeSupplyReportService";
import { useToast } from "../../../../components/common/ToastProvider";

const normalizeKeyword = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

const ReportHeader = ({ filters, activeTab, loading = false, hasData = true }) => {
  const [isExporting, setIsExporting] = useState(false);
  const showToast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const mapTabToReportType = (tab) => {
    if (tab === 1) return "department";
    if (tab === 2) return "quota";
    if (tab === 3) return "cost";
    return "inventory";
  };

  const handleExport = async (format) => {
    if (!["xlsx", "pdf"].includes(format)) {
      showToast("Định dạng export không hợp lệ", "error");
      return;
    }
    if (loading) {
      showToast("Dữ liệu đang tải, vui lòng thử lại", "warning");
      return;
    }
    if (!hasData) {
      showToast("Không có dữ liệu để xuất file", "warning");
      return;
    }

    setIsExporting(true);
    try {
      const reportType = mapTabToReportType(activeTab);
      const normalizedFilters = {
        ...filters,
        keyword: normalizeKeyword(filters?.keyword || ""),
      };
      const response = await officeSupplyReportService.exportReport(
        reportType,
        format,
        normalizedFilters,
        activeTab
      );
      const blob = response instanceof Blob ? response : new Blob([response]);
      if (!blob || blob.size === 0) {
        throw new Error("Export file rỗng");
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Bao_cao_VPP_${format === "xlsx" ? "Excel" : "PDF"}_${new Date().getTime()}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Xuất ${format.toUpperCase()} thành công`, "success");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Lỗi khi xuất file", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ mb: 4, animate: "fadeUp 0.4s ease both" }}>
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={2}
      >
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.01em",
              mb: 0.5,
            }}
          >
            Báo cáo Văn phòng phẩm
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontWeight: 500,
              maxWidth: "600px",
              lineHeight: 1.6,
            }}
          >
            Báo cáo tổng hợp xuất nhập tồn, sử dụng theo phòng ban, so sánh thực
            tế và định mức, chi phí.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            sx={{
              borderRadius: "8px",
              borderColor: "#cbd5e1",
              color: "#334155",
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              height: 42,
              backgroundColor: "#fff",
              fontSize: "13px",
              "&:hover": {
                borderColor: "#2563eb",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
              },
            }}
          >
            Xuất PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<ExcelIcon />}
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#16a34a",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              height: 42,
              fontSize: "13px",
              "&:hover": { backgroundColor: "#15803d" },
            }}
          >
            Xuất Excel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ReportHeader;
