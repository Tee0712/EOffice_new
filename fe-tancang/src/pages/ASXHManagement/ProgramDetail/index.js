import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Container,
  Paper,
} from "@mui/material";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";
import { z } from "zod";

// Component imports
import HeaderDetail from "./components/HeaderDetail";
import KPICard from "./components/KPICard";
import OverviewTab from "./components/Tabs/OverviewTab";
import DisbursementTab from "./components/Tabs/DisbursementTab";
import ActivityTab from "./components/Tabs/ActivityTab";
import DocumentTab from "./components/Tabs/DocumentTab";

// Zod Schema for validation
const ProgramDetailSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  funding_type: z.string(),
  locality: z.string(),
  status: z.string(),
  budget: z.number(),
  disbursed_total: z.number(),
  remaining_amount: z.number(),
  progress_percent: z.number(),
  item_count: z.number(),
  item_completed_count: z.number().optional(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  items: z.array(z.any()),
  milestones: z.array(z.any()),
  members: z.array(z.any()),
  linked_documents: z.array(z.any()),
  documents: z.array(z.any()),
  disbursements: z.array(z.any()),
  activities: z.array(z.any()),
});

const ProgramDetail = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await asxhService.getProgramDetail(programId);
      if (res.success) {
        // Map linked_documents to documents if needed, or update schema
        const rawData = res.data;
        const processedData = {
          ...rawData,
          documents: rawData.linked_documents || []
        };
        
        // Validate with Zod
        const validatedData = ProgramDetailSchema.parse(processedData);
        setData(validatedData);
      } else {
        toast("Không thể tải thông tin: " + res.message, "error");
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
      toast("Lỗi hệ thống khi tải chi tiết chương trình", "error");
    } finally {
      setLoading(false);
    }
  }, [programId, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEdit = () => {
    navigate(`/asxh-registration/edit/${programId}`);
  };

  const handleExport = async () => {
    try {
      const res = await asxhService.exportPrograms({ id: programId });
      // Create a blob from the response if it's not already one (though callApi with responseType blob should return one)
      const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Bao_cao_chuong_trinh_${data.code || programId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast("Đang tải xuống báo cáo...", "success");
    } catch (err) {
      console.error("Export error:", err);
      toast("Lỗi khi xuất báo cáo", "error");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ bgcolor: "#F1F5F9", minHeight: "100vh", pb: 5 }}>
      {/* Header Section */}
      <HeaderDetail 
        data={data} 
        onBack={() => navigate("/asxh-management")} 
        onEdit={() => navigate(`/asxh-registration/edit/${data.id}`)}
        onExport={handleExport}
      />

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* KPI Section - Segmented Bar */}
        <Paper sx={{ 
          display: "flex", 
          borderRadius: "12px", 
          border: "1px solid #E2E8F0", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)", 
          mb: 4, 
          overflow: "hidden",
          backgroundColor: "white"
        }}>
          <KPICard title="Tổng ngân sách" value={data.budget} type="currency" color="#2563EB" />
          <KPICard title="Đã giải ngân" value={data.disbursed_total} type="currency" color="#10B981" />
          <KPICard title="Còn lại" value={data.remaining_amount} type="currency" color="#F59E0B" />
          <KPICard title="Hạng mục" value={`${data.item_completed_count || 0}/${data.item_count}`} color="#1E293B" />
          <KPICard title="Người thụ hưởng" value="126" color="#1E293B" last />
        </Paper>

        {/* Tab Selection */}
        <Box sx={{ borderBottom: 1, borderColor: "#E2E8F0", mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{
              '& .MuiTab-root': { 
                textTransform: 'none', 
                fontWeight: 600, 
                fontSize: '0.95rem', 
                minWidth: 'auto', 
                px: 3,
                color: "#64748B",
                '&:hover': { color: '#2563EB' }
              },
              '& .Mui-selected': { color: '#2563EB !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#2563EB', height: 3, borderRadius: '3px 3px 0 0' }
            }}
          >
            <Tab label="Tổng quan" />
            <Tab label={`Giải ngân ${data.disbursements?.length || 0}`} />
            <Tab label={`Hoạt động ${data.activities?.length || 0}`} />
            <Tab label={`Hình ảnh 0`} />
            <Tab label={`Tài liệu ${data.documents?.length || 0}`} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && <OverviewTab data={data} />}
        {activeTab === 1 && <DisbursementTab disbursements={data.disbursements} />}
        {activeTab === 2 && <ActivityTab activities={data.activities} />}
        {activeTab === 3 && (
          <Box sx={{ p: 4, textAlign: "center", bgcolor: "white", borderRadius: 2 }}>
            <Typography color="text.secondary">Giao diện Hình ảnh đang được cập nhật</Typography>
          </Box>
        )}
        {activeTab === 4 && <DocumentTab documents={data.documents} />}
      </Container>
    </Box>
  );
};

export default ProgramDetail;
