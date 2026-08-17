import React, { useState } from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  SkyTableContainer,
  SkyTable,
  SkyTableHead,
  SkyTableBody,
  SkyTableRow,
  SkyTableCell,
} from "@styles/SkyStyles";
import { styled } from "@mui/material/styles";
import {
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Inventory as AssetIcon,
  MoreVert as MoreIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const StyledLinearProgress = styled(LinearProgress)(({ theme, customcolor }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.grey[100],
  "& .MuiLinearProgress-bar": {
    borderRadius: 3,
    backgroundColor: customcolor || theme.palette.primary.main,
  },
}));

const StatusDot = styled(Box)(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  marginRight: theme.spacing(1),
}));

const STATUS_CONFIG = {
  lap_ke_hoach: { label: "Lập kế hoạch", color: "#64748b", bgcolor: "#f8fafc" },
  dang_trien_khai: { label: "Đang triển khai", color: "#16a34a", bgcolor: "#f0fdf4" },
  dang_giai_ngan: { label: "Đang giải ngân", color: "#d97706", bgcolor: "#fffbeb" },
  hoan_thanh: { label: "Hoàn thành", color: "#7c3aed", bgcolor: "#f5f3ff" },
};

const FUNDING_TYPE_STYLES = {
  Bang_tien: { label: "Tiền mặt", color: "#2563eb", bgcolor: "#eff6ff" },
  Hien_vat: { label: "Hiện vật", color: "#d97706", bgcolor: "#fffbeb" },
  Giao_duc: { label: "Giáo dục", color: "#7c3aed", bgcolor: "#f5f3ff" },
};

/**
 * Component menu thao tác phụ để tiết kiệm diện tích
 */
const MoreActions = ({ item, onEdit, onDelete, onDisbursement, onAssets }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const isCash = item.funding_type === "Bang_tien";
  const isInKind = item.funding_type === "Hien_vat";

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreIcon fontSize="small" sx={{ color: "#475569" }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { borderRadius: "12px", minWidth: 160, mt: 1 }
        }}
      >
        <MenuItem onClick={() => { handleClose(); onEdit(); }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: "#0284c7" }} /></ListItemIcon>
          <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} />
        </MenuItem>
        {isCash && (
          <MenuItem onClick={() => { handleClose(); onDisbursement(); }}>
            <ListItemIcon><MoneyIcon fontSize="small" sx={{ color: "#2563eb" }} /></ListItemIcon>
            <ListItemText primary="Giải ngân" primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} />
          </MenuItem>
        )}
        {isInKind && (
          <MenuItem onClick={() => { handleClose(); onAssets(); }}>
            <ListItemIcon><AssetIcon fontSize="small" sx={{ color: "#d97706" }} /></ListItemIcon>
            <ListItemText primary="Hiện vật" primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} />
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleClose(); onDelete(); }} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
          <ListItemText primary="Xóa" primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </>
  );
};

const ProgramTable = ({ items = [], pagination = {}, onPageChange, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <Box sx={{ width: "100%", mt: 0 }}>
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1.5, overflow: "hidden" }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader aria-label="programs table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  MÃ / TÊN CHƯƠNG TRÌNH
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  LOẠI HÌNH
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  ĐỊA PHƯƠNG
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  NGÂN SÁCH
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  ĐÃ CHI
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5, width: "15%" }}>
                  TIẾN ĐỘ
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  TRẠNG THÁI
                </TableCell>
                <TableCell sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5 }}>
                  THỜI GIAN
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: "#f8f9fb", fontWeight: "600", color: "text.secondary", fontSize: 13, borderBottom: "1px solid", borderColor: "grey.200", p: 1.5, width: 120 }}>
                  THAO TÁC
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => {
                  const status = STATUS_CONFIG[item.status] || { label: item.status, color: "#64748b" };
                  const funding = FUNDING_TYPE_STYLES[item.funding_type] || { label: item.funding_type, color: "#64748b", bgcolor: "#f1f5f9" };
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      hover 
                      sx={{ 
                        cursor: 'pointer', 
                        "& td": { borderBottom: "1px solid", borderColor: "grey.100" },
                        "&:last-child td": { border: 0 }
                      }}
                    >
                      <TableCell sx={{ p: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#0f172a">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", letterSpacing: 0.5 }}>
                            {item.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ p: 1.5 }}>
                        <Box 
                          sx={{ 
                            display: 'inline-block',
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 20,
                            bgcolor: funding.bgcolor,
                            color: funding.color,
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          {funding.label}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ p: 1.5 }}>
                        <Typography variant="body2" color="#475569">
                          {item.locality}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1.5 }}>
                        <Typography variant="body2" fontWeight="700" color="#0f172a" sx={{ fontFamily: "monospace" }}>
                          {formatCurrency(item.budget)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1.5 }}>
                        <Typography variant="body2" fontWeight="700" color="#16a34a" sx={{ fontFamily: "monospace" }}>
                          {formatCurrency(item.disbursed_total)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1.5 }}>
                        <Box sx={{ width: "100%" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {item.progress_percent}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {item.progress_label || "0/0"}
                            </Typography>
                          </Box>
                          <StyledLinearProgress
                            variant="determinate"
                            value={item.progress_percent}
                            customcolor={item.progress_percent === 100 ? "#7c3aed" : "#16a34a"}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status.color }} />
                          <Typography variant="body2" color={status.color} fontWeight="600">
                            {status.label}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ p: 1.5 }}>
                        <Typography variant="caption" sx={{ whiteSpace: "nowrap", fontWeight: 600, color: "#64748b" }}>
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ p: 1.5 }}>
                        <Stack direction="row" spacing={0} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" onClick={() => navigate(`/asxh/programs/${item.id}`)}>
                              <ViewIcon fontSize="small" sx={{ color: "#475569" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Thao tác khác">
                            <Box>
                              <MoreActions 
                                item={item}
                                onEdit={() => onEdit && onEdit(item)}
                                onDelete={() => onDelete && onDelete(item)}
                                onDisbursement={() => navigate(`/asxh/programs/${item.id}/disbursement`)}
                                onAssets={() => navigate(`/asxh/programs/${item.id}/assets`)}
                              />
                            </Box>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không tìm thấy chương trình nào phù hợp với bộ lọc
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Footer */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "grey.200", bgcolor: "#fff" }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {pagination.total > 0 ? (pagination.page - 1) * pagination.page_size + 1 : 0} - {Math.min(pagination.page * pagination.page_size, pagination.total)} của {pagination.total} bản ghi
          </Typography>
          <Pagination 
            count={pagination.total_pages} 
            page={pagination.page} 
            onChange={(e, p) => onPageChange(p)} 
            color="primary" 
            shape="rounded" 
            size="small" 
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ProgramTable;
