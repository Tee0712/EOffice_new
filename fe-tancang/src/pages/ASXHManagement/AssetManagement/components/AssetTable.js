import React from "react";
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip,
  Stack,
  LinearProgress
} from "@mui/material";
import { 
  Visibility as ViewIcon, 
  Edit as EditIcon 
} from "@mui/icons-material";
import { 
  SkyTableContainer, 
  SkyTable, 
  SkyTableHead, 
  SkyTableBody, 
  SkyTableRow, 
  SkyTableCell,
  SkyChip
} from "@styles/SkyStyles";

const STATUS_CONFIG = {
  RECEIVED: { label: "Đã tiếp nhận", bg: "#f0fdf4", text: "#10b981", border: "#10b98140", segments: { c1: "#10b981", c2: "#e2e8f0", c3: "#e2e8f0" } },
  IN_PROCUREMENT: { label: "Đang mua sắm", bg: "#fff7ed", text: "#f97316", border: "#f9731640", segments: { c1: "#10b981", c2: "#f97316", c3: "#e2e8f0" } },
  PURCHASED: { label: "Đã mua", bg: "#ecfeff", text: "#0891b2", border: "#0891b240", segments: { c1: "#10b981", c2: "#10b981", c3: "#e2e8f0" } },
  SHIPPING: { label: "Đang vận chuyển", bg: "#fff7ed", text: "#ea580c", border: "#ea580c40", segments: { c1: "#10b981", c2: "#10b981", c3: "#f97316" } },
  DELIVERED: { label: "Đã bàn giao", bg: "#f5f3ff", text: "#7c3aed", border: "#7c3aed40", segments: { c1: "#10b981", c2: "#10b981", c3: "#10b981" } },
};

const getStatusInfo = (status) => {
  return STATUS_CONFIG[status] || { 
    label: status || "---", 
    bg: "#f1f5f9", 
    text: "#64748b", 
    border: "#e2e8f0",
    segments: { c1: "#e2e8f0", c2: "#e2e8f0", c3: "#e2e8f0" }
  };
};

// Component hiển thị thanh tiến trình 3 đoạn
const MultiSegmentProgress = ({ status }) => {
  const { segments } = getStatusInfo(status);
  const { c1, c2, c3 } = segments;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 12, height: 4, borderRadius: 2, bgcolor: c1 }} />
      <Box sx={{ width: 12, height: 4, borderRadius: 2, bgcolor: c2 }} />
      <Box sx={{ width: 12, height: 4, borderRadius: 2, bgcolor: c3 }} />
    </Stack>
  );
};

const StatusBadge = ({ status }) => {
  const colors = getStatusInfo(status);
  return (
    <Box sx={{ 
      px: 1.5, py: 0.4, borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
      bgcolor: colors.bg, color: colors.text, display: "inline-block",
      border: `1px solid ${colors.border}`
    }}>
      {colors.label}
    </Box>
  );
};

const DocBadge = ({ type, label }) => {
  const getDocColor = (t) => {
    if (t === "hoadon" || t === "invoice") return { bg: "#f0fdf4", text: "#10b981" };
    if (t === "baohanh" || t === "warranty") return { bg: "#eff6ff", text: "#3b82f6" };
    if (t === "baogia" || t === "quote") return { bg: "#fff7ed", text: "#f97316" };
    return { bg: "#f1f5f9", text: "#64748b" };
  };
  const c = getDocColor(type);
  return (
    <Box component="span" sx={{ 
      px: 1, py: 0.4, borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600,
      bgcolor: c.bg, color: c.text, mr: 0.5, border: `1px solid ${c.text}40`,
      whiteSpace: "nowrap"
    }}>
      {label}
    </Box>
  );
};

import { useNavigate, useParams } from "react-router-dom";

const AssetTable = ({ loading, data, onRefresh, onView }) => {
  const navigate = useNavigate();
  const { programId } = useParams();

  const handleAction = (type, assetId) => {
    if (type === "view") {
      onView(assetId);
    } else {
      navigate(`/asxh/programs/${programId}/assets/${assetId}/edit`);
    }
  };

  return (
    <SkyTableContainer sx={{ border: "none" }}>
      <SkyTable>
        <SkyTableHead sx={{ bgcolor: "transparent" }}>
          <SkyTableRow>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>MÃ / TÊN HIỆN VẬT</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>QUY CÁCH</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>SỐ LƯỢNG</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>ĐƠN GIÁ</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>THÀNH TIỀN</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>TIẾN TRÌNH</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>TRẠNG THÁI</SkyTableCell>
            <SkyTableCell sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>CHỨNG TỪ</SkyTableCell>
            <SkyTableCell align="right" />
          </SkyTableRow>
        </SkyTableHead>
        <SkyTableBody>
          {data.map((item) => (
            <SkyTableRow key={item.id} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
              <SkyTableCell>
                <Typography sx={{ color: "#f97316", fontSize: "0.75rem", fontWeight: 600 }}>
                  {item.code || `HV-${String(item.id).padStart(3, '0')}`}
                </Typography>
                <Typography sx={{ color: "#1e293b", fontWeight: 600 }}>{item.name}</Typography>
              </SkyTableCell>
              <SkyTableCell sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                {item.specifications?.length > 0 
                  ? item.specifications.map(s => `${s.parameterName || s.key}: ${s.value}`).join(" / ") 
                  : (item.description || "---")}
              </SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600 }}>{item.quantity} {item.unit}</SkyTableCell>
              <SkyTableCell>{(item.unitPrice || item.unit_price)?.toLocaleString()} đ</SkyTableCell>
              <SkyTableCell sx={{ fontWeight: 600 }}>{(item.value_total || item.total_price || item.quantity * (item.unitPrice || item.unit_price))?.toLocaleString()} đ</SkyTableCell>
              <SkyTableCell>
                <MultiSegmentProgress status={item.status} />
              </SkyTableCell>
              <SkyTableCell>
                <StatusBadge status={item.status} />
              </SkyTableCell>
              <SkyTableCell>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {item.attachments?.length > 0 ? (
                    item.attachments.map((doc, idx) => {
                      const title = (doc.title || doc.name || "").toLowerCase();
                      let type = "other";
                      if (title.includes("hóa đơn") || title.includes("invoice") || title.includes("bill")) type = "hoadon";
                      if (title.includes("bảo hành") || title.includes("warranty")) type = "baohanh";
                      if (title.includes("báo giá") || title.includes("quote")) type = "baogia";
                      
                      return (
                        <DocBadge 
                          key={doc.id || idx} 
                          type={type} 
                          label={doc.title || doc.name || "File"} 
                        />
                      );
                    })
                  ) : (
                    <>
                      {item.status === "PURCHASED" && (
                        <>
                          <DocBadge type="baohanh" label="Chế độ bảo hành" />
                          <DocBadge type="hoadon" label="Hóa đơn" />
                        </>
                      )}
                      {item.status === "IN_PROCUREMENT" && <DocBadge type="baogia" label="Báo giá" />}
                    </>
                  )}
                </Stack>
              </SkyTableCell>
              <SkyTableCell align="right">
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" sx={{ color: "#94a3b8" }} onClick={() => handleAction("view", item.id)}>
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" sx={{ color: "#94a3b8" }} onClick={() => handleAction("edit", item.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SkyTableCell>
            </SkyTableRow>
          ))}
        </SkyTableBody>
      </SkyTable>
    </SkyTableContainer>
  );
};

export default AssetTable;
