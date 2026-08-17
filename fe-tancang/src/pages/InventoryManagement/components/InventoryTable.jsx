import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  TablePagination,
  alpha,
  Avatar,
  Stack
} from "@mui/material";
import {
  History as HistoryIcon,
  AddShoppingCart as AddCartIcon,
  Inventory2 as PackageIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DescriptionOutlined as PaperIcon,
  FolderOutlined as FolderIcon,
  PrintOutlined as PrintIcon,
  LocalDrinkOutlined as DrinkIcon,
  CleaningServicesOutlined as CleanIcon,
  Create as CreateIcon
} from "@mui/icons-material";
import moment from "moment";

// Helper lấy icon theo danh mục
const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('bút') || cat.includes('mực') || cat.includes('xóa')) return <CreateIcon />;
  if (cat.includes('giấy') || cat.includes('note')) return <PaperIcon />;
  if (cat.includes('bìa') || cat.includes('hồ sơ') || cat.includes('file')) return <FolderIcon />;
  if (cat.includes('máy') || cat.includes('in') || cat.includes('mực in')) return <PrintIcon />;
  if (cat.includes('nước') || cat.includes('uống') || cat.includes('trà') || cat.includes('cafe')) return <DrinkIcon />;
  if (cat.includes('vệ sinh') || cat.includes('rửa')) return <CleanIcon />;
  return <PackageIcon />;
};

const InventoryTable = ({
  data,
  loading,
  page,
  size,
  total,
  onChangePage,
  onOpenHistory,
  onQuickImport
}) => {
  const theme = useTheme();
  // True if screen size is sm or smaller (mobile/tablet portrait)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Helpers
  const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case "ENOUGH": return "#10b981"; // Success Green
      case "LOW": return "#f59e0b";    // Warning Amber
      case "OUT": return "#ef4444";    // Error Red
      default: return "#64748b";       // Slate
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ENOUGH": return "Đủ hàng";
      case "LOW": return "Sắp hết";
      case "OUT": return "Hết hàng";
      default: return "Chưa rõ";
    }
  };

  const calculateProgress = (quantity, maxStock) => {
    const effectiveMax = maxStock || 500;
    const p = (quantity / effectiveMax) * 100;
    return Math.min(p, 100);
  };

  const handleChangePage = (event, newPage) => {
    onChangePage(newPage + 1); // MUI passes 0-indexed page
  };

  // --- MOBILE RENDER (Card List) ---
  if (isMobile) {
    if (!data || data.length === 0) {
      return (
        <Box textAlign="center" py={8} color="text.secondary">
          <PackageIcon sx={{ fontSize: 80, color: "divider", mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight="600">Không có dữ liệu mặt hàng</Typography>
          <Typography variant="body2">Vui lòng thử lại với bộ lọc khác.</Typography>
        </Box>
      );
    }
    return (
      <Box>
        <Box display="flex" flexDirection="column" gap={2.5}>
          {data.map((row) => (
            <Card
              key={row.productId}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.200",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" gap={1.5}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: alpha(getStatusColor(row.stockStatus), 0.1),
                        color: getStatusColor(row.stockStatus),
                        width: 48,
                        height: 48,
                        borderRadius: 2
                      }}
                    >
                      {getCategoryIcon(row.category)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="800" variant="subtitle1" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                        {row.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        {row.productCode} • {row.category}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label={getStatusLabel(row.stockStatus)}
                    sx={{
                      fontWeight: 600,
                      bgcolor: alpha(getStatusColor(row.stockStatus), 0.1),
                      color: getStatusColor(row.stockStatus),
                      borderRadius: 1.5,
                      px: 1,
                      height: 26,
                      fontSize: 12
                    }}
                  />
                </Box>

                <Box sx={{ bgcolor: "#F8FAFC", borderRadius: 2, p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Tồn kho hiện tại:
                    </Typography>
                    <Typography variant="body2" fontWeight="800" color="#0f172a">
                      {formatNumber(row.quantity)} {row.unit || ""}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(row.quantity, row.maxStock)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(getStatusColor(row.stockStatus), 0.1),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getStatusColor(row.stockStatus),
                        borderRadius: 4
                      }
                    }}
                  />
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                      Min: {formatNumber(row.minStock)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                      Max: 500
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    Cập nhật: {row.lastInOutDate ? moment(row.lastInOutDate).format('DD/MM/YYYY HH:mm') : "---"}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Lịch sử">
                      <IconButton size="small" sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }} onClick={() => onOpenHistory(row.productId)}>
                        <HistoryIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={row.status === 'hidden' || row.status === 'inactive' ? "Mặt hàng bị ẩn" : "Nhập kho"}>
                      <span>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.05), 
                            border: '1px solid', 
                            borderColor: 'primary.light',
                            '&.Mui-disabled': { borderColor: 'grey.200', bgcolor: 'grey.50' }
                          }} 
                          onClick={() => onQuickImport(row)}
                          disabled={row.status === 'hidden' || row.status === 'inactive'}
                        >
                          <AddCartIcon fontSize="small" color={row.status === 'hidden' || row.status === 'inactive' ? "disabled" : "primary"} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page > 0 ? page - 1 : 0}
          onPageChange={handleChangePage}
          rowsPerPage={size}
          rowsPerPageOptions={[size]}
        />
      </Box>
    );
  }

  // --- DESKTOP RENDER (Table) ---
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3.5, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
      <TableContainer>
        <Table sx={{ minWidth: 900 }}>
          <TableHead
            sx={{
              "& .MuiTableCell-head": {
                backgroundColor: "#f8f9fb !important",
                fontWeight: "600 !important",
                color: "rgba(100, 116, 139, 1) !important",
                fontSize: "13px !important",
                borderBottom: "1px solid rgba(226, 232, 240, 1) !important",
              },
            }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2 }}>MẶT HÀNG</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2 }}>NHÓM HÀNG</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2, width: 230 }}>SỐ LƯỢNG TỒN</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2 }}>TRẠNG THÁI</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2 }}>NHẬP / XUẤT GẦN NHẤT</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#64748b", fontSize: 13, py: 2 }}>THAO TÁC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <LinearProgress sx={{ width: 200, height: 6, borderRadius: 3 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">Đang tải dữ liệu tồn kho...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : data && data.length > 0 ? (
              data.map((row) => (
                <TableRow key={row.productId} sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                  <TableCell sx={{ py: 2.2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: alpha(getStatusColor(row.stockStatus), 0.1),
                          color: getStatusColor(row.stockStatus),
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          fontWeight: "bold",
                          fontSize: 18
                        }}
                      >
                        {getCategoryIcon(row.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#0f172a">
                          {row.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ letterSpacing: 0.5 }}>
                          Mã: {row.productCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2.2 }}>
                    <Chip
                      label={row.category || "Chưa phân loại"}
                      size="small"
                      sx={{
                        bgcolor: "#dcfce7",
                        color: "#16a34a",
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 20,
                        height: 28
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.2 }}>
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <Typography variant="body2" fontWeight="700" color="#0f172a">
                        {formatNumber(row.quantity)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        {row.unit || ""}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress(row.quantity, row.maxStock)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: getStatusColor(row.stockStatus),
                          borderRadius: 4
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 12, fontWeight: 500 }}>
                      Ngưỡng tối thiểu: {formatNumber(row.minStock)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 2.2 }}>
                    <Chip
                      size="small"
                      label={getStatusLabel(row.stockStatus)}
                      sx={{
                        fontWeight: 600,
                        bgcolor: alpha(getStatusColor(row.stockStatus), 0.1),
                        color: getStatusColor(row.stockStatus),
                        borderRadius: 1.5,
                        px: 1,
                        height: 26,
                        fontSize: 12
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ py: 2.2 }}>
                    {row.lastInOutDate ? (
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: row.lastTransactionType === 'RECEIPT' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                            color: row.lastTransactionType === 'RECEIPT' ? '#10b981' : '#ef4444'
                          }}
                        >
                          {row.lastTransactionType === 'RECEIPT' ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="700" color={row.lastTransactionType === 'RECEIPT' ? "#10b981" : "#ef4444"}>
                            {row.lastTransactionType === 'RECEIPT' ? 'Nhập' : 'Xuất'} {row.lastTransactionQuantity ? (row.lastTransactionType === 'RECEIPT' ? '+' : '-') + formatNumber(row.lastTransactionQuantity) : ""}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" fontWeight="500">
                            {moment(row.lastInOutDate).format("DD/MM/YYYY")} {row.lastTransactionSupplier ? ` • ${row.lastTransactionSupplier}` : ""}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">---</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2.2 }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Lịch sử giao dịch">
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: '#f8fafc',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                          onClick={() => onOpenHistory(row.productId)}
                        >
                          <HistoryIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={row.status === 'hidden' || row.status === 'inactive' ? "Mặt hàng bị ẩn" : "Nhập hàng nhanh"}>
                        <span>
                          <IconButton
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              border: '1px solid',
                              borderColor: 'primary.light',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                              '&.Mui-disabled': { borderColor: 'grey.200', bgcolor: 'grey.50' }
                            }}
                            onClick={() => onQuickImport(row)}
                            disabled={row.status === 'hidden' || row.status === 'inactive'}
                          >
                            <AddCartIcon fontSize="small" color={row.status === 'hidden' || row.status === 'inactive' ? "disabled" : "primary"} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                  <PackageIcon sx={{ fontSize: 80, color: "divider", mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="#64748b" fontWeight="600">
                    Không tìm thấy dữ liệu tồn kho
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng điều chỉnh bộ lọc hoặc tìm kiếm lại.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total || 0}
        page={page > 0 ? page - 1 : 0}
        onPageChange={handleChangePage}
        rowsPerPage={size || 20}
        rowsPerPageOptions={[size || 20]}
        sx={{ borderTop: "1px solid", borderColor: "grey.100", bgcolor: "#F8FAFC" }}
      />
    </Card>
  );
};

export default InventoryTable;
