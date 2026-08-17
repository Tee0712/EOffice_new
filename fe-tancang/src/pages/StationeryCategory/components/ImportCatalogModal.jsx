import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon, 
  DescriptionOutlined as DescriptionOutlinedIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon
} from "@mui/icons-material";
import { importCatalogItems } from "../../../services/stationeryService";
import { toast } from "react-toastify";

const ImportCatalogModal = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && file.type !== "application/vnd.ms-excel") {
        setError("Vui lòng chọn file định dạng Excel (.xlsx, .xls)");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/Mau_Import_VPP.csv"; 
    link.download = "Mau_Import_Danh_Muc_VPP.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang tải file mẫu...");
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file để import");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsSaving(true);
      setError(null);
      const res = await importCatalogItems(formData);
      
      // Giả sử API trả về res.success hoặc status 200/201
      if (res?.success || res?.status === 200 || res?.status === 201 || !res?.error) {
        toast.success("Import danh mục thành công!");
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setError(res?.message || "Có lỗi xảy ra khi import danh mục");
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(err?.response?.data?.message || "Lỗi kết nối server hoặc định dạng file không đúng");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{ zIndex: 99999 }}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 500 }, borderRadius: "16px 0 0 16px" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography variant="h6" fontWeight="700" color="#0f172a">
          Import Danh Mục VPP
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ bgcolor: "grey.100", '&:hover': { bgcolor: "grey.200" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", bgcolor: "#fff" }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sử dụng chức năng này để thêm nhanh hàng loạt mặt hàng vào danh mục từ file Excel. 
              Vui lòng sử dụng đúng file mẫu để đảm bảo dữ liệu được chính xác.
            </Typography>

            <Box sx={{ bgcolor: "#f1f5f9", p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="#334155" sx={{ display: 'block', mb: 1 }}>
                Lưu ý quan trọng cho các trường dữ liệu:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569', fontSize: '0.75rem' }}>
                <li><b>sku</b>: Mã mặt hàng (tùy chọn).</li>
                <li><b>name</b>: Tên mặt hàng (bắt buộc).</li>
                <li><b>categoryId</b>: Nhóm hàng (nhập 'but', 'giay'...).</li>
                <li><b>unit</b>: Đơn vị tính (Ram, Cây, Cuộn...).</li>
                <li><b>quotaUnit</b>: Đơn vị định mức ('nguoi' hoặc 'phongban').</li>
                <li><b>quotaValue</b>: Giá trị định mức (số).</li>
                <li><b>reference_price</b>: Giá tham khảo (số).</li>
              </ul>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleDownloadTemplate}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 1.5, 
                fontWeight: 600,
                color: '#255df2',
                borderColor: '#255df2',
                '&:hover': { bgcolor: '#f0f4ff', borderColor: '#255df2' }
              }}
            >
              Tải file mẫu (.csv)
            </Button>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" fontWeight="600" color="#0f172a" sx={{ mb: 1.5 }}>
              Chọn file dữ liệu <span style={{ color: "red" }}>*</span>
            </Typography>
            
            <Box
              component="label"
              sx={{
                border: "2px dashed",
                borderColor: selectedFile ? "primary.main" : "grey.300",
                borderRadius: 2,
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: selectedFile ? "#f0f4ff" : "#f8f9fb",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "#f1f5f9", borderColor: "primary.main" }
              }}
            >
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
              
              {selectedFile ? (
                <>
                  <DescriptionOutlinedIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                  <Typography variant="body1" fontWeight="600" color="primary.main">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(2)} KB • Nhấn để thay đổi
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                  <Typography variant="body1" fontWeight="600" color="#334155">
                    Kéo thả hoặc Click để chọn file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hỗ trợ file .xlsx, .xls (Tối đa 5MB)
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}

          {selectedFile && !error && (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Sẵn sàng để import <b>{selectedFile.name}</b> vào hệ thống.
            </Alert>
          )}
        </Stack>
      </Box>

      {/* Footer */}
      <Divider />
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          bgcolor: "#f8f9fb",
        }}
      >
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={handleClose} 
          disabled={isSaving}
          sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, fontWeight: 600, borderColor: 'grey.300', bgcolor: '#fff' }}
        >
          Hủy bỏ
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={isSaving || !selectedFile}
          sx={{ borderRadius: 1.5, backgroundColor: "#255df2", textTransform: 'none', px: 3, fontWeight: 600, boxShadow: 'none' }}
        >
          {isSaving ? "Đang xử lý..." : "Bắt đầu Import"}
        </Button>
      </Box>
    </Drawer>
  );
};

export default ImportCatalogModal;
