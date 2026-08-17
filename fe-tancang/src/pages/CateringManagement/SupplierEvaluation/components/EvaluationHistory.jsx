import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  IconButton,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  Divider,
  Button,
  Pagination,
  PaginationItem,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Schedule as PendingIcon,
  CheckCircle as SuccessIcon,
  CalendarMonth as CalendarIcon,
  FilterAlt as FilterIcon,
} from "@mui/icons-material";

const EvaluationHistory = ({
  evaluations,
  onView,
  onEdit,
  onFilterSupplier,
  onFilterTime,
  filterSupplier,
  filterTime,
  page,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
  suppliers = [],
}) => {
  return (
    <Box>
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
          sx={{
            fontWeight: 800,
            color: "#1a3353",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: "12px",
              bgcolor: "#f0f9ff",
              color: "#0ea5e9",
              display: "flex",
            }}
          >
            <CalendarIcon />
          </Box>
          Lịch sử đánh giá
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Select
            size="small"
            value={filterSupplier}
            onChange={(e) => onFilterSupplier(e.target.value)}
            sx={{ borderRadius: "12px", minWidth: 140, bgcolor: "white" }}
          >
            <MenuItem value="ALL" sx={{ fontWeight: 600 }}>
              Tất cả NCC
            </MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id} sx={{ fontWeight: 600 }}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={filterTime}
            onChange={(e) => onFilterTime(e.target.value)}
            sx={{ borderRadius: "12px", minWidth: 140, bgcolor: "white" }}
          >
            <MenuItem value="ALL" sx={{ fontWeight: 600 }}>
              Tất cả
            </MenuItem>
            <MenuItem value="MONTH" sx={{ fontWeight: 600 }}>
              Tháng này
            </MenuItem>
            <MenuItem value="LASTMONTH" sx={{ fontWeight: 600 }}>
              Tháng trước
            </MenuItem>
          </Select>
        </Box>
      </Box>

      {evaluations.map((evalItem) => (
        <Card
          key={evalItem.id}
          sx={{
            mb: 3,
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            border: "1px solid #f1f5f9",
            borderLeft:
              evalItem.status === "PENDING"
                ? "6px solid #f59e0b"
                : "1px solid #f1f5f9",
            bgcolor: evalItem.status === "PENDING" ? "#fffbeb" : "white",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s",
            "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {/* Left Column: Supplier Info */}
              <Grid item xs={12} md={evalItem.status === "PENDING" ? 9 : 12}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "16px",
                      bgcolor: "#1a3353",
                      fontWeight: 900,
                    }}
                  >
                    {
                      evalItem.supplierName.split(" ")[
                        evalItem.supplierName.split(" ").length - 1
                      ][0]
                    }
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 800, color: "#1a3353" }}
                      >
                        {evalItem.supplierName}
                      </Typography>
                      {evalItem.status === "PENDING" ? (
                        <Chip
                          icon={
                            <PendingIcon sx={{ fontSize: "14px !important" }} />
                          }
                          label="Chờ đánh giá"
                          color="warning"
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 800,
                            height: 24,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: "#1a3353",
                              fontSize: "28px",
                              lineHeight: 1,
                            }}
                          >
                            {evalItem.overallScore.toFixed(1)}
                          </Typography>
                          <Rating
                            size="small"
                            value={evalItem.overallScore}
                            precision={0.1}
                            readOnly
                            max={5}
                            sx={{
                              mt: 0.5,
                              fontSize: "14px",
                              "& .MuiRating-iconFilled": { color: "#f59e0b" },
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", fontWeight: 600 }}
                    >
                      {evalItem.dishName
                        ? `Món: ${evalItem.dishName}`
                        : "Đánh giá chung"}{" "}
                      • {evalItem.date}
                    </Typography>
                  </Box>
                </Box>

                {evalItem.status === "COMPLETED" && (
                  <>
                    <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
                    <Grid container spacing={1}>
                      {Object.entries(evalItem.scores).map(([key, value]) => {
                        const labels = {
                          food_quality: "Chất lượng",
                          delivery_time: "Đúng giờ",
                          hygiene_safety_score: "Vệ sinh",
                          service_attitude_score: "Phục vụ",
                        };
                        return (
                          <Grid item xs={3} key={key}>
                            <Box
                              sx={{
                                p: 1,
                                pt: 1.5,
                                borderRadius: "16px",
                                bgcolor: "#f8fafc",
                                textAlign: "center",
                                border: "1px solid #f1f5f9",
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 900,
                                  color: "#1a3353",
                                  lineHeight: 1,
                                }}
                              >
                                {value.toFixed(1)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#64748b",
                                  fontSize: "10px",
                                  textTransform: "uppercase",
                                  fontWeight: 700,
                                }}
                              >
                                {labels[key] || key.split("_").join(" ")}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: "italic",
                          color: "#64748b",
                          flexGrow: 1,
                        }}
                      >
                        "{evalItem.comment}"
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          ml: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 14 }} /> {evalItem.date}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => onView(evalItem)}
                          sx={{ p: 0.5, bgcolor: "#f0f9ff", color: "#0ea5e9" }}
                        >
                          <ViewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(evalItem)}
                          sx={{ p: 0.5, bgcolor: "#f8fafc", color: "#64748b" }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
              </Grid>

              {/* Status "PENDING" Action Area */}
              {evalItem.status === "PENDING" && (
                <Grid
                  item
                  xs={12}
                  md={3}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<StarIcon />}
                    onClick={() => onView(evalItem)}
                    sx={{
                      borderRadius: "12px",
                      bgcolor: "#f59e0b",
                      "&:hover": { bgcolor: "#d97706" },
                      textTransform: "none",
                      fontWeight: 800,
                      px: 3,
                    }}
                  >
                    Đánh giá ngay
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      ))}
      {totalItems > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 4,
            p: 2,
            bgcolor: "white",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontWeight: 600 }}
          >
            Hiển thị {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalItems)} của {totalItems}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, v) => onPageChange(v)}
            shape="rounded"
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  "&.Mui-selected": {
                    bgcolor: "#3b82f6",
                    color: "white",
                    "&:hover": { bgcolor: "#2563eb" },
                  },
                }}
              />
            )}
          />
        </Box>
      )}
    </Box>
  );
};

export default EvaluationHistory;
