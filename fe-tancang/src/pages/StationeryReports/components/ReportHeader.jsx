import React, { useState } from 'react';
import { Box, Typography, Button, Stack, useMediaQuery, useTheme } from '@mui/material';
import { 
  FileDownload as ExcelIcon, 
  PictureAsPdf as PdfIcon 
} from '@mui/icons-material';
import { exportReportFile } from '../../../services/vppService';
import { useToast } from '../../../components/common/ToastProvider';

const ReportHeader = ({ filters, activeTab }) => {
  const [isExporting, setIsExporting] = useState(false);
  const showToast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const params = {
        ...filters,
        format,
        tab: activeTab
      };
      const response = await exportReportFile(params);
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_cao_VPP_${format === 'xlsx' ? 'Excel' : 'PDF'}_${new Date().getTime()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast(`Xuất ${format.toUpperCase()} thành công`, "success");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Lỗi khi xuất file", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack 
        direction={isMobile ? "column" : "row"} 
        justifyContent="space-between" 
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={2}
      >
        <Box>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', mb: 0.5 }}>
          Báo cáo Văn phòng phẩm
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Xem báo cáo tổng hợp và chi tiết hoạt động sử dụng VPP toàn công ty.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          sx={{ 
            borderRadius: '10px', 
            borderColor: '#e2e8f0', 
            color: '#475569',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            height: 40,
            backgroundColor: '#fff',
            '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }
          }}
        >
          Xuất PDF
        </Button>
        <Button
          variant="contained"
          startIcon={<ExcelIcon />}
          onClick={() => handleExport('xlsx')}
          disabled={isExporting}
          sx={{ 
            borderRadius: '10px', 
            backgroundColor: '#16a34a',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
            height: 40,
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
            '&:hover': { backgroundColor: '#15803d', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)' }
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
