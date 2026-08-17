import React from "react";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Rating,
} from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  PersonOutline as UserIcon,
  PhoneIphoneOutlined as PhoneIcon,
} from "@mui/icons-material";

const getStatusChip = (status) => {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "ACTIVE":
    case "ĐANG HIỆU LỰC":
      return (
        <Chip
          label="Đang hiệu lực"
          size="small"
          sx={{
            bgcolor: "#f6ffed",
            color: "#52c41a",
            border: "1px solid #b7eb8f",
            fontWeight: 500,
          }}
        />
      );
    case "EXPIRING_SOON":
    case "SẮP HẾT HẠN":
      return (
        <Chip
          label="Sắp hết hạn"
          size="small"
          sx={{
            bgcolor: "#fffbe6",
            color: "#faad14",
            border: "1px solid #ffe58f",
            fontWeight: 500,
          }}
        />
      );
    case "EXPIRED":
    case "� H�T H�N":
      return (
        <Chip
          label="Đã hết hạn"
          size="small"
          sx={{
            bgcolor: "#fff1f0",
            color: "#f5222d",
            border: "1px solid #ffa39e",
            fontWeight: 500,
          }}
        />
      );
    case "REPLACED":
    case "� THAY TH�":
      return (
        <Chip
          label="Đã thay thế"
          size="small"
          sx={{
            bgcolor: "#fff7e6",
            color: "#faad14",
            border: "1px solid #ffe58f",
            fontWeight: 500,
          }}
        />
      );
    default:
      return <Chip label={status} size="small" />;
  }
};

const SupplierTable = ({
  suppliers,
  onView,
  onEdit,
  onDelete,
  onContract,
  onPrice,
  onEval,
  page = 1,
  limit = 5,
}) => {
  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return "??";
    const words = name
      .trim()
      .split(" ")
      .filter((w) => w);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "#1890ff",
      "#52c41a",
      "#722ed1",
      "#faad14",
      "#eb2f96",
      "#13c2c2",
    ];
    const index = (name || "").length % colors.length;
    return colors[index];
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderTop: "none",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#fafafa" }}>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#595959",
                width: 60,
                fontSize: "0.8rem",
              }}
            >
              STT
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              NHÀ CUNG CẤP
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              MÃ SỐ THUẾ
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              LIÊN HỆ
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              TRẠNG THÁI HĐ
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              THỜI HẠN HĐ
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              ĐÁNH GIÁ
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontWeight: 700, color: "#595959", fontSize: "0.8rem" }}
            >
              THAO TÁC
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.length > 0 ? (
            suppliers.map((item, index) => {
              const today = dayjs().startOf("day");

              // Logic for Start Date: Use updatedAt if exists, otherwise createdAt
              const startDate = item.updatedAt
                ? dayjs(item.updatedAt)
                : dayjs(item.createdAt);
              const endDate = item.contractEndAtCached
                ? dayjs(item.contractEndAtCached)
                : null;

              // Logic for status
              const rawStatus =
                item.contractStatusCached || item.status || "inactive";
              let calculatedStatus = rawStatus;

              if (endDate && endDate.isValid()) {
                if (today.isAfter(endDate)) {
                  // Only override to EXPIRED if it was active
                  if (["ACTIVE", "active"].includes(rawStatus)) {
                    calculatedStatus = "EXPIRED";
                  }
                } else if (endDate.diff(today, "day") <= 3) {
                  if (["ACTIVE", "active"].includes(rawStatus)) {
                    calculatedStatus = "EXPIRING_SOON";
                  }
                }
              }

              // Duration text logic
              const startDateStr = startDate.format("DD/MM/YYYY");
              const endDateStr = endDate ? endDate.format("DD/MM/YYYY") : "---";

              let countdownText = "";
              let countdownColor = "#8c8c8c";
              if (endDate && endDate.isValid()) {
                const diff = endDate.diff(today, "day");
                if (diff >= 0) {
                  countdownText = `Còn ${diff} ngày`;
                } else {
                  countdownText = `Hết hạn ${Math.abs(diff)} ngày`;
                  countdownColor = "#ff4d4f";
                }
              }

              return (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ color: "#262626", fontWeight: 500 }}>
                    {(page - 1) * limit + index + 1}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: getAvatarColor(item.name),
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      >
                        {getInitials(item.name)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "#1a3353",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#8c8c8c" }}>
                          {item.supplierCode || `ID: ${item.id}`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#262626" }}>
                    {item.taxCode || "---"}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <UserIcon sx={{ fontSize: 16, color: "#8c8c8c" }} />
                        <Typography variant="body2" sx={{ color: "#262626" }}>
                          {item.contactPerson || "---"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PhoneIcon sx={{ fontSize: 16, color: "#8c8c8c" }} />
                        <Typography variant="caption" sx={{ color: "#595959" }}>
                          {item.phone || "---"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(calculatedStatus)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#262626", fontWeight: 500 }}
                      >
                        {startDateStr} - {endDateStr}
                      </Typography>
                      {countdownText && (
                        <Typography
                          variant="caption"
                          sx={{ color: countdownColor }}
                        >
                          {countdownText}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Rating
                        value={
                          Number(item.ratingAvgCached || item.ratingAvg) || 0
                        }
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#262626", ml: 0.5 }}
                      >
                        {(item.ratingAvgCached || item.ratingAvg || 0).toFixed(
                          1
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#8c8c8c" }}>
                        ({item.ratingCountCached || item.ratingCount || 0})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => onView(item)}
                          sx={{
                            bgcolor: "#e6f7ff",
                            color: "#1890ff",
                            borderRadius: "4px",
                            "&:hover": { bgcolor: "#bae7ff" },
                          }}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(item)}
                          sx={{
                            bgcolor: "#fff7e6",
                            color: "#faad14",
                            borderRadius: "4px",
                            "&:hover": { bgcolor: "#ffe58f" },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa nhà cung cấp">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(item.id)}
                          sx={{
                            bgcolor: "#fff1f0",
                            color: "#f5222d",
                            borderRadius: "4px",
                            "&:hover": { bgcolor: "#ffccc7" },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={8}
                align="center"
                sx={{ py: 10, color: "#8c8c8c" }}
              >
                Không tìm thấy nhà cung cấp nào phù hợp
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SupplierTable;
