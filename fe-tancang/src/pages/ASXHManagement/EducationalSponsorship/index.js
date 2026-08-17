import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { 
  Box, 
  Container, 
  Typography, 
  Breadcrumbs, 
  Link, 
  Button, 
  Stack, 
  ToggleButtonGroup, 
  ToggleButton,
  Divider,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { 
  Add as AddIcon, 
  FileDownload as ExportIcon, 
  School as SchoolIcon,
  Close as CloseIcon,
  Description as FileIcon,
  ArrowBack as BackIcon
} from "@mui/icons-material";
import { SkyTitle, SkySubmitButton } from "@styles/SkyStyles";
import StatsOverview from "./components/StatsOverview";
import PartnerSchools from "./components/PartnerSchools";
import ScholarshipPipeline from "./components/ScholarshipPipeline";
import CandidateTable from "./components/CandidateTable";
import educationScholarshipService from "@services/educationScholarshipService";
import { useToast } from "@components/common/ToastProvider";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Màn hình Quản lý Tài trợ Giáo dục & Học bổng
 */
const EducationalSponsorship = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { programId = 7 } = useParams(); // Mặc định ID = 7 cho demo
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(`${dayjs().year()}-${dayjs().year() + 1}`);
  
  // States dữ liệu
  const [overviewData, setOverviewData] = useState({});
  const [partners, setPartners] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePagination, setCandidatePagination] = useState({ total: 0, page: 1, limit: 10 });
  const [filters, setFilters] = useState({ keyword: "", university_partner_id: "", status: "" });
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const currentYear = dayjs().year();
  const [availableYears] = useState([
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ]);


  const fetchCandidates = useCallback(async (isInitial = false) => {
    if (!isInitial) setCandidatesLoading(true);
    try {
      const res = await educationScholarshipService.getScholarshipCandidates({ 
        page: candidatePage, 
        limit: 10,
        school_year: academicYear,
        ...filters
      });
      if (res.success) {
        setCandidates(res.data.items || []);
        // Handle standard pagination structures
        const total = res.data.meta?.total || res.data.pagination?.total || res.data.total || res.data.items?.length || 0;
        setCandidatePagination({ total, page: candidatePage, limit: 10 });
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      if (!isInitial) setCandidatesLoading(false);
    }
  }, [candidatePage, filters, academicYear]);

  const fetchOverviewAndPartners = useCallback(async () => {
    try {
      const [overviewRes, partnersRes] = await Promise.all([
        educationScholarshipService.getOverview({ school_year: academicYear }),
        educationScholarshipService.getUniversityPartners({ school_year: academicYear, status: 'ACTIVE', limit: 100 })
      ]);

      if (overviewRes.success) {
        setOverviewData(overviewRes.data);
        
        // Cấu hình 5 bước cố định theo yêu cầu của người dùng
        const PIPELINE_CONFIG = [
          { status: "SUBMITTED", label: "NỘP HỒ SƠ", color: "#3b82f6" },
          { status: "UNDER_REVIEW", label: "ĐANG XÉT DUYỆT", color: "#f59e0b" },
          { status: "INTERVIEW", label: "PHỎNG VẤN", color: "#8b5cf6" },
          { status: "APPROVED", label: "ĐÃ DUYỆT", color: "#10b981" },
          { status: "REJECTED", label: "TỪ CHỐI", color: "#ef4444" }
        ];

        // Khởi tạo pipeline với giá trị 0
        const initialPipeline = PIPELINE_CONFIG.map(step => ({ ...step, count: 0 }));

        // Cập nhật count từ dữ liệu thực tế backend (nếu có)
        const apiStats = overviewRes.data.candidate_status_stats || [];
        const finalPipeline = initialPipeline.map(step => {
          const found = apiStats.find(s => s.status === step.status);
          return { ...step, count: found ? found.count : 0 };
        });

        setPipeline(finalPipeline);
      }
      if (partnersRes.success) setPartners(partnersRes.data.items);
    } catch (error) {
      console.error("Failed to fetch overview & partners:", error);
    }
  }, [academicYear]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOverviewAndPartners(),
      fetchCandidates(true)
    ]);
    setLoading(false);
  }, [fetchOverviewAndPartners, fetchCandidates]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => {
      if (prev.keyword === newFilters.keyword && 
          String(prev.university_partner_id) === String(newFilters.university_partner_id || "") && 
          prev.status === newFilters.status) {
        return prev;
      }
      return { ...prev, ...newFilters };
    });
    setCandidatePage(1); 
  }, []);

  const handleStatusUpdate = useCallback(async (id, status) => {
    try {
      const res = await educationScholarshipService.updateCandidateStatus(id, status);
      if (res.success) {
        toast("Cập nhật trạng thái thành công", "success");
        fetchAllData();
      }
    } catch (error) {
      toast("Lỗi cập nhật trạng thái", "error");
    }
  }, [toast, fetchAllData]);

  const handleDeleteCandidate = useCallback(async (id) => {
    try {
      const res = await educationScholarshipService.deleteCandidate(id);
      if (res.success) {
        toast("Xóa hồ sơ ứng viên thành công", "success");
        fetchAllData();
      }
    } catch (error) {
      toast("Lỗi khi xóa hồ sơ ứng viên", "error");
    }
  }, [toast, fetchAllData]);
  
  // 1. Initial/Year load: Fetch everything
  useEffect(() => {
    fetchAllData();
  }, [academicYear]); // Chạy lại khi năm học thay đổi

  // 2. Filter/Pagination load: Fetch candidates only
  useEffect(() => {
    // Chỉ fetch lại nếu không phải đang load lần đầu (đã được fetchAllData xử lý)
    if (!loading) { 
        fetchCandidates();
    }
  }, [filters, candidatePage, fetchCandidates, loading]);

  const handleYearChange = (event, newYear) => {
    if (newYear !== null) {
      setAcademicYear(newYear);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const blob = await educationScholarshipService.exportScholarshipReport(academicYear);
      
      // Tạo URL từ blob và kích hoạt download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_cao_Tai_tro_Giao_duc_${academicYear.replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast("Tải báo cáo thành công", "success");
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast("Lỗi xuất báo cáo", "error");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => navigate("/asxh")}
              sx={{ color: "#64748b", bgcolor: "#fff", border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <BackIcon fontSize="small" />
            </IconButton>
            <SkyTitle variant="h4" sx={{ color: "#1e293b", fontSize: "1.75rem", mb: 0 }}>
              Tài trợ Giáo dục & Học bổng
            </SkyTitle>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "15px" }}>
            Quản lý hợp tác trường ĐH, xét duyệt và cấp phát học bổng cho sinh viên.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={academicYear}
            exclusive
            onChange={handleYearChange}
            size="small"
            sx={{ 
              bgcolor: "#fff", 
              borderRadius: "10px",
              "& .MuiToggleButton-root": {
                px: 2.5,
                py: 0.75,
                textTransform: "none",
                fontWeight: 600,
                border: "1px solid #e2e8f0",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "primary.dark" }
                }
              }
            }}
          >
            {availableYears.map(year => (
              <ToggleButton key={year} value={year}>{year.replace("-", " - ")}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ 
              textTransform: "none", 
              borderRadius: "10px", 
              fontWeight: 600,
              px: 2.5,
              borderColor: "#e2e8f0",
              color: "#475569"
            }}
          >
            Xuất báo cáo
          </Button>

          <SkySubmitButton
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ px: 3, borderRadius: "10px", py: 1 }}
            onClick={() => navigate("/asxh/educational-sponsorship/partner/add")}
          >
            Thêm trường hợp tác
          </SkySubmitButton>
        </Stack>
      </Box>

      {/* Thống kê 5 thẻ */}
      <StatsOverview data={overviewData} />

      <Grid container spacing={4}>
        <Grid item xs={12}>
          {/* Danh sách trường ĐH */}
          <PartnerSchools 
            schools={partners.slice(0, 6)} 
            onViewDetail={(id) => navigate(`/asxh/educational-sponsorship/partner/edit/${id}`)}
            onViewAll={() => navigate("/asxh/educational-sponsorship/partners")}
          />
        </Grid>

        <Grid item xs={12}>
          {/* Pipeline xét duyệt */}
          <ScholarshipPipeline steps={pipeline} />
        </Grid>

        <Grid item xs={12}>
          {/* Bảng danh sách ứng viên */}
          <CandidateTable 
            items={candidates}
            loading={candidatesLoading}
            pagination={candidatePagination}
            partners={partners}
            onPageChange={(e, p) => setCandidatePage(p)}
            onFilterChange={handleFilterChange}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteCandidate}
            onEdit={(id) => navigate(`/asxh/educational-sponsorship/candidate/edit/${id}`)}
            onAdd={() => navigate(`/asxh/educational-sponsorship/candidate/add?year=${academicYear}`)}
            onRefresh={fetchAllData}
          />
        </Grid>
      </Grid>

      {/* Dialog xác nhận xuất báo cáo */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => !exportLoading && setExportDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700} color="#1e293b">Xác nhận xuất báo cáo</Typography>
          <IconButton size="small" onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box 
              sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: "50%", 
                bgcolor: "#f0fdf4", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                mx: "auto",
                mb: 2
              }}
            >
              <FileIcon sx={{ fontSize: 32, color: "#16a34a" }} />
            </Box>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Báo cáo Tài trợ Giáo dục & Học bổng
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
              Hệ thống sẽ tổng hợp toàn bộ dữ liệu đối tác và ứng viên của năm học <strong>{academicYear}</strong> vào file Excel.
            </Typography>

            <Stack spacing={1.5} sx={{ textAlign: "left", bgcolor: "#f8fafc", p: 2, borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="#64748b">Năm học</Typography>
                <Typography variant="caption" fontWeight={600}>{academicYear}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="#64748b">Trường đối tác</Typography>
                <Typography variant="caption" fontWeight={600}>{overviewData.total_partners || 0} trường</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="#64748b">Hồ sơ ứng viên</Typography>
                <Typography variant="caption" fontWeight={600}>{overviewData.total_candidates || 0} hồ sơ</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="#64748b">Tên file dự kiến</Typography>
                <Typography variant="caption" fontWeight={600} color="primary">Bao_cao_{academicYear.replace(/\//g, '-')}.xlsx</Typography>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => setExportDialogOpen(false)}
            disabled={exportLoading}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, borderColor: "#e2e8f0", color: "#475569" }}
          >
            Hủy bỏ
          </Button>
          <SkySubmitButton 
            fullWidth 
            variant="contained" 
            onClick={handleExportExcel}
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : <ExportIcon />}
            sx={{ borderRadius: "10px", py: 1 }}
          >
            {exportLoading ? "Đang xử lý..." : "Tải xuống ngay"}
          </SkySubmitButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EducationalSponsorship;
