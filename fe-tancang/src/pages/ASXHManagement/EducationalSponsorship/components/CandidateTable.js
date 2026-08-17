import React from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Stack, 
  IconButton, 
  Tooltip,
  InputAdornment,
  MenuItem,
  Checkbox,
  Button,
  Pagination,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import { 
  Search as SearchIcon,
  PeopleAltOutlined as PeopleIcon,
  VisibilityOutlined as ViewIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  ArrowForwardOutlined as ArrowRightIcon,
  DescriptionOutlined as FileIcon,
  DeleteOutline as DeleteIcon,
  WarningAmber as WarningIcon
} from "@mui/icons-material";
import { 
  SkyTableContainer,
  SkyTable,
  SkyTableHead,
  SkyTableBody,
  SkyTableRow,
  SkyTableCell,
  SkyTextField,
  SkySelect,
  SkyFormControl
} from "@styles/SkyStyles";
import { styled } from "@mui/material/styles";
import { useToast } from "@components/common/ToastProvider";
import dayjs from "dayjs";
import educationScholarshipService from "@services/educationScholarshipService";
import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";

const AvatarWrapper = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

// Utility to get random avatar colors based on string
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  // Hardcode some colors to match image if possible, otherwise use hash
  const predefined = {
    'N': '#8b5cf6', // purple
    'T': '#10b981', // green
    'P': '#f97316', // orange
    'L': '#f59e0b', // yellow/orange
    'V': '#3b82f6', // blue
    'H': '#ef4444'  // red
  };
  return predefined[string.charAt(0).toUpperCase()] || color;
};

// Status config mapping to match image appearance exactly
const STATUS_CONFIG = {
  SUBMITTED: { label: "Nộp hồ sơ", bg: "#e0e7ff", color: "#4f46e5" }, // Blue
  UNDER_REVIEW: { label: "Đang xét duyệt", bg: "#fef3c7", color: "#d97706" }, // Orange/Yellow
  INTERVIEW: { label: "Phỏng vấn", bg: "#f3e8ff", color: "#9333ea" }, // Purple
  APPROVED: { label: "Đã duyệt", bg: "#dcfce7", color: "#16a34a" }, // Green
  REJECTED: { label: "Từ chối", bg: "#fee2e2", color: "#dc2626" }, // Red
  DISBURSED: { label: "Đã cấp phát", bg: "#ccfbf1", color: "#0d9488" }, // Cyan
  DRAFT: { label: "Nháp", bg: "#f1f5f9", color: "#64748b" } // Gray
};

const CustomStatusPill = styled(Box)(({ bg, color }) => ({
  backgroundColor: bg,
  color: color,
  padding: "4px 12px",
  borderRadius: "16px",
  fontSize: "12px",
  fontWeight: 600,
  display: "inline-block",
  whiteSpace: "nowrap"
}));

// Components for Score lines
const ScoreLine = ({ value, isGpa = false }) => {
  const numValue = parseFloat(value) || 0;
  let color = "#cbd5e1";
  
  if (isGpa) {
    if (numValue >= 3.2) color = "#16a34a"; // Green
    else if (numValue >= 2.5) color = "#d97706"; // Orange
    else color = "#dc2626"; // Red
  } else {
    if (numValue >= 80) color = "#9333ea"; // Purple
    else if (numValue >= 60) color = "#d97706"; // Orange
    else color = "#dc2626"; // Red
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
      <Box sx={{ width: 24, height: 4, backgroundColor: color, borderRadius: 2 }} />
      <Typography variant="body2" fontWeight={700} color={color}>{value}</Typography>
    </Stack>
  );
};

/**
 * Danh sách ứng viên học bổng (Table)
 */
const CandidateTable = ({ 
  items = [], 
  loading = false,
  pagination = {}, 
  partners = [],
  onPageChange, 
  onEdit, 
  onAdd, 
  onRefresh,
  onFilterChange,
  onStatusUpdate,
  onDelete
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [partnerId, setPartnerId] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange?.({ 
        keyword: searchTerm, 
        university_partner_id: partnerId === "all" ? "" : partnerId,
        status: statusFilter === "all" ? "" : statusFilter
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, partnerId, statusFilter, onFilterChange]);

  const handlePartnerChange = (e) => setPartnerId(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  
  const formatCurrency = (value) => {
    if (!value) return <span style={{ color: "#94a3b8" }}>-</span>;
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Container viền ngoài giống ảnh */}
      <Paper sx={{ borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "none" }}>
        
        {/* Header Section */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PeopleIcon sx={{ color: "#475569" }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
              Danh sách ứng viên học bổng
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1.5}>
            <SkyTextField
              size="small"
              placeholder="Tìm theo tên, MSSV..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: 220, my: 0, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
            />
            <SkyFormControl size="small" sx={{ width: 140 }}>
              <SkySelect 
                value={partnerId} 
                onChange={handlePartnerChange}
                displayEmpty 
                size="small" 
                sx={{ borderRadius: '6px' }}
              >
                <MenuItem value="all">Tất cả trường</MenuItem>
                {partners.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </SkySelect>
            </SkyFormControl>
            <SkyFormControl size="small" sx={{ width: 140 }}>
              <SkySelect 
                value={statusFilter} 
                onChange={handleStatusChange}
                displayEmpty 
                size="small" 
                sx={{ borderRadius: '6px' }}
              >
                <MenuItem value="all">Trạng thái</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </SkySelect>
            </SkyFormControl>
            <Button
              variant="contained"
              startIcon={<Box component="span" sx={{ fontSize: 20 }}>+</Box>}
              sx={{ 
                bgcolor: "#2563eb", 
                textTransform: "none", 
                borderRadius: "6px",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" }
              }}
              onClick={onAdd}
            >
              Thêm ứng viên
            </Button>
          </Stack>
        </Box>

        {/* Table Section */}
        <Box sx={{ position: "relative" }}>
          {loading && (
            <Box sx={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              zIndex: 10,
              "& .MuiLinearProgress-root": { height: 2 }
            }}>
              <LinearProgress />
            </Box>
          )}
          <SkyTableContainer sx={{ boxShadow: "none", borderRadius: 0, opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <SkyTable>
            <SkyTableHead sx={{ bgcolor: "#f1f5f9" }}>
              <SkyTableRow>
                <SkyTableCell padding="checkbox" sx={{ borderBottom: "1px solid #e2e8f0" }}>
                  <Checkbox size="small" sx={{ color: "#cbd5e1" }} />
                </SkyTableCell>
                <SkyTableCell sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Ứng viên</SkyTableCell>
                <SkyTableCell sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Trường / Ngành</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Năm học</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>GPA</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Điểm xét</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Mức học bổng</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Trạng thái</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Ngày nộp</SkyTableCell>
                <SkyTableCell align="center" sx={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Thao tác</SkyTableCell>
              </SkyTableRow>
            </SkyTableHead>
            <SkyTableBody>
              {items.map((item, index) => {
                const nameInitials = item.full_name?.split(' ').map(n=>n[0]).join('').slice(-2).toUpperCase() || 'NA';
                const avatarColor = stringToColor(item.full_name || 'A');
                
                const schoolYearText = item.study_year || item.school_year || `Năm ${3 + (index % 2)}`;

                return (
                  <SkyTableRow key={item.id} hover sx={{ "& td": { borderBottom: "1px solid #f1f5f9", py: 1.5 } }}>
                    <SkyTableCell padding="checkbox">
                      <Checkbox size="small" sx={{ color: "#cbd5e1" }} />
                    </SkyTableCell>
                    <SkyTableCell>
                      <AvatarWrapper>
                        <Avatar 
                          src={item.avatar_path ? (item.avatar_path.startsWith("http") ? item.avatar_path : `${APP_BASE}/${item.avatar_path}`) : null}
                          sx={{ bgcolor: avatarColor, width: 36, height: 36, fontSize: 13, fontWeight: 700 }}
                        >
                          {nameInitials}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#1e293b">{item.full_name}</Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500, fontFamily: "monospace" }}>{item.code || `HB-2026/${(item.id || index).toString().padStart(4, '0')}`}</Typography>
                        </Box>
                      </AvatarWrapper>
                    </SkyTableCell>
                    <SkyTableCell>
                      <Typography variant="body2" fontWeight={700} color="#334155">{item.university_name || item.school}</Typography>
                      <Typography variant="caption" color="#94a3b8">{item.major_name}</Typography>
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <Typography variant="body2" color="#64748b" fontWeight={500}>{schoolYearText}</Typography>
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <ScoreLine value={item.gpa_current || "0.0"} isGpa={true} />
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <ScoreLine value={item.total_score || item.score || "-"} />
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <Typography variant="body2" fontWeight={700} sx={{ color: item.scholarship_amount ? "#6366f1" : "inherit" }}>
                        {formatCurrency(item.scholarship_amount)}
                      </Typography>
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <CustomStatusPill 
                        bg={STATUS_CONFIG[item.status]?.bg || "#f1f5f9"}
                        color={STATUS_CONFIG[item.status]?.color || "#64748b"}
                      >
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </CustomStatusPill>
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <Typography variant="caption" color="#64748b" fontWeight={500}>
                        {item.created_at ? dayjs(item.created_at).format("DD/MM/YYYY") : "-"}
                      </Typography>
                    </SkyTableCell>
                    <SkyTableCell align="center">
                      <Stack direction="row" spacing={0} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" sx={{ color: "#94a3b8" }} onClick={() => onEdit(item.id)}>
                            <ViewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        
                        {item.status === 'SUBMITTED' ? (
                          <Tooltip title="Bắt đầu xét duyệt">
                            <IconButton size="small" sx={{ color: "#3b82f6", p: 0.5 }} onClick={() => onStatusUpdate(item.id, 'UNDER_REVIEW')}>
                              <ArrowRightIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : item.status === 'UNDER_REVIEW' ? (
                          <Tooltip title="Mời phỏng vấn">
                            <IconButton size="small" sx={{ color: "#8b5cf6", p: 0.5 }} onClick={() => onStatusUpdate(item.id, 'INTERVIEW')}>
                              <ArrowRightIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : item.status === 'INTERVIEW' ? (
                          <Tooltip title="Duyệt hồ sơ">
                            <IconButton size="small" sx={{ color: "#10b981", p: 0.5 }} onClick={() => onStatusUpdate(item.id, 'APPROVED')}>
                              <CheckIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : item.status === 'APPROVED' ? (
                          <Tooltip title="Cấp phát học bổng">
                            <IconButton size="small" sx={{ color: "#0d9488", p: 0.5 }} onClick={() => onStatusUpdate(item.id, 'DISBURSED')}>
                              <CheckIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {(item.status === 'UNDER_REVIEW' || item.status === 'INTERVIEW' || item.status === 'SUBMITTED') && (
                          <Tooltip title="Từ chối">
                            <IconButton size="small" sx={{ color: "#ef4444", p: 0.5 }} onClick={() => onStatusUpdate(item.id, 'REJECTED')}>
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                          <Tooltip title="Xóa hồ sơ">
                            <IconButton 
                              size="small" 
                              sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fee2e2" }, p: 0.5 }} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(item);
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </SkyTableCell>
                  </SkyTableRow>
                );
              })}
            </SkyTableBody>
          </SkyTable>
        </SkyTableContainer>
      </Box>

        {/* Footer actions / Pagination */}
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Typography variant="caption" color="#64748b">
            Hiển thị <strong>{items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–{Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.total || 0)}</strong> trong tổng số <strong>{pagination.total || 0}</strong> ứng viên
          </Typography>
          
          {pagination.total > 0 && (
            <Pagination 
              count={Math.ceil(pagination.total / (pagination.limit || 10))} 
              page={pagination.page || 1} 
              onChange={onPageChange} 
              shape="rounded" 
              size="small"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#fff',
                  '&.Mui-selected': {
                    bgcolor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: '#2563eb',
                    }
                  }
                }
              }}
            />
          )}
        </Box>
      </Paper>

      <Dialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#dc2626", pb: 1 }}>
          <WarningIcon /> Xác nhận xóa hồ sơ
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", py: 1 }}>
            Bạn có chắc chắn muốn xóa hồ sơ của ứng viên <strong>{deleteTarget?.full_name}</strong>?
            Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu và tài liệu đính kèm, không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteTarget(null)} 
            variant="outlined"
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, borderColor: "#e2e8f0", color: "#475569", flex: 1 }}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={() => {
              onDelete(deleteTarget.id);
              setDeleteTarget(null);
            }} 
            variant="contained" 
            color="error" 
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, boxShadow: "none", flex: 1 }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateTable;
