import React from "react";
import { Box, Typography, Button, Stack, Chip, Avatar } from "@mui/material";
import { 
  ArrowBack as BackIcon, 
  Edit as EditIcon, 
  FileDownload as ExportIcon,
  Assignment as ProgramIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import moment from "moment";

const HeaderContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "white",
  padding: theme.spacing(2, 3),
  borderBottom: "1px solid #E2E8F0",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
}));

const HeaderDetail = ({ data, onBack, onEdit, onExport }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'dang_trien_khai': return { bg: '#DCFCE7', text: '#166534', label: 'Đang triển khai' };
      case 'lap_ke_hoach': return { bg: '#EFF6FF', text: '#1E40AF', label: 'Lập kế hoạch' };
      case 'ket_thuc': return { bg: '#F1F5F9', text: '#475569', label: 'Kết thúc' };
      default: return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  const status = getStatusColor(data.status);

  return (
    <HeaderContainer>
      <Button 
        onClick={onBack} 
        startIcon={<BackIcon sx={{ fontSize: "1rem !important" }} />} 
        sx={{ textTransform: "none", color: "text.secondary", mb: 1, padding: 0, minWidth: 0, fontWeight: 500, "&:hover": { bgcolor: "transparent", color: "primary.main" } }}
      >
        Quay lại danh sách chương trình
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Avatar 
            sx={{ width: 56, height: 56, bgcolor: "#DCFCE7", color: "#10B981", borderRadius: "12px", border: "1px solid #BBF7D0" }}
          >
            <ProgramIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#0891B2", letterSpacing: "0.05em", mb: 0.2 }}>
              {data.code}
            </Typography>
            <Typography variant="h5" fontWeight={800} color="#1E293B" sx={{ mb: 0.8, lineHeight: 1.2 }}>
              {data.name}
            </Typography>
            <Typography variant="body2" color="#64748B" sx={{ maxWidth: 800, mb: 2, fontSize: "0.93rem" }}>
               {data.description || "Chương trình an sinh xã hội hỗ trợ người dân gặp khó khăn, nâng cao chất lượng cuộc sống và phát triển cộng đồng."}
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip 
                label={data.funding_type === 'CASH' ? 'Bằng tiền' : (data.funding_type === 'Giao_duc' ? 'Giáo dục' : 'Hiện vật')} 
                size="small" 
                sx={{ bgcolor: "#F0FDFA", color: "#0D9488", fontWeight: 600, border: "1px solid #CCFBF1" }} 
              />
              <Chip 
                label={status.label} 
                size="small" 
                sx={{ bgcolor: status.bg, color: status.text, fontWeight: 600, border: `1px solid ${status.text}20` }} 
              />
              <Chip 
                label={data.locality} 
                size="small" 
                variant="outlined"
                sx={{ color: "#64748B", fontWeight: 500, borderColor: "#E2E8F0" }} 
              />
              <Chip 
                label={`${moment(data.start_date).format("DD/MM/YYYY")} — ${moment(data.end_date).format("DD/MM/YYYY")}`} 
                size="small" 
                variant="outlined"
                sx={{ color: "#64748B", fontWeight: 500, borderColor: "#E2E8F0" }} 
              />
              {data.linked_documents?.length > 0 && (
                <Chip 
                  label={data.linked_documents[0].document_code || "Văn bản gốc"} 
                  size="small" 
                  sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 600, border: "1px solid #EDE9FE" }} 
                />
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="text" 
            onClick={onEdit}
            startIcon={<EditIcon sx={{ fontSize: "1rem !important" }} />}
            sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, px: 2 }}
          >
            Chỉnh sửa
          </Button>
          <Button 
            variant="contained" 
            onClick={onExport}
            startIcon={<ExportIcon />}
            sx={{ textTransform: "none", borderRadius: "8px", bgcolor: "#2563EB", boxShadow: "none", fontWeight: 700, px: 2.5, "&:hover": { bgcolor: "#1D4ED8", boxShadow: "0 4px 6px rgba(37,99,235,0.2)" } }}
          >
            Xuất báo cáo
          </Button>
        </Stack>
      </Box>
    </HeaderContainer>
  );
};

export default HeaderDetail;
