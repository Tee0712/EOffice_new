import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Stack, CircularProgress } from "@mui/material";
import { useToast } from "@components/common/ToastProvider";
import asxhService from "@services/asxhService";
import AssetFormHeader from "./components/AssetFormHeader";
import BasicInfoSection from "./components/BasicInfoSection";
import TechnicalSpecsSection from "./components/TechnicalSpecsSection";
import QuantityPriceSection from "./components/QuantityPriceSection";
import VendorSelection from "./components/VendorSelection";
import FileUploadSection from "./components/FileUploadSection";
import ActionFooter from "./components/ActionFooter";

const STORAGE_KEY = "asxh_add_asset_draft";

const ASXHAddAsset = () => {
  const { programId: paramId } = useParams();
  const programId = paramId && paramId !== ":programId" ? paramId : "7";
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "Chiếc",
    receive_date: "",
    delivery_date: "",
    description: "",
    specifications: [{ key: "", value: "" }],
    vendor_id: null,
    quantity: 1,
    unit_price: 0,
    special_requirements: "",
    has_quotation: false,
    attachments: [],
  });

  const [errors, setErrors] = useState({});

  // 1. Fetch Context Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, supplierRes] = await Promise.all([
        asxhService.getInKindOverview(programId),
        asxhService.getSuppliers({ program_id: programId }),
      ]);

      const { program, kpi } = overviewRes?.data || {};
      setProgramInfo({
        ...program,
        total_budget: kpi?.total_budget || 0,
        allocated_budget: kpi?.total_asset_value || 0,
      });
      setVendors(supplierRes?.data?.items || supplierRes?.data || []);
    } catch (error) {
      console.error("Error fetching context:", error);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDraftLoadedRef = React.useRef(false);

  // Handle Draft Loading Separately (Once after loading context)
  useEffect(() => {
    if (!loading && programId && !isDraftLoadedRef.current) {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          if (draftData.programId === programId) {
            setFormData((prev) => ({ ...prev, ...draftData.data }));
            toast("Đã khôi phục bản nháp của bạn.", "info");
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
      isDraftLoadedRef.current = true;
    }
  }, [loading, programId, toast]);

  // 2. Draft Persistence
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loading) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ programId, data: formData })
        );
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [formData, programId, loading]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleVendorCreated = (newVendor) => {
    if (newVendor) {
      setVendors((prev) => [newVendor, ...prev]);
      handleInputChange("vendor_id", newVendor.id);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Tên hiện vật là bắt buộc";
    if (!formData.category) newErrors.category = "Vui lòng chọn danh mục";
    if (!formData.delivery_date)
      newErrors.delivery_date = "Thời gian nhận hàng là bắt buộc";
    if (!formData.vendor_id) newErrors.vendor_id = "Vui lòng chọn nhà cung cấp";
    if (formData.quantity <= 0) newErrors.quantity = "Số lượng phải > 0";
    if (formData.unit_price <= 0) newErrors.unit_price = "Đơn giá phải > 0";

    // Budget Validation
    const totalBudget = programInfo?.total_budget || 0;
    const allocatedFromServer = programInfo?.allocated_budget || 0;
    const currentTotal =
      (Number(formData.quantity) || 0) * (Number(formData.unit_price) || 0);
    if (currentTotal > totalBudget - allocatedFromServer) {
      newErrors.budget = "Tổng giá trị vượt quá ngân sách còn lại";
    }

    // Quotation File Validation
    if (
      formData.has_quotation &&
      (!formData.attachments || formData.attachments.length === 0)
    ) {
      newErrors.attachments =
        "Vui lòng đính kèm tệp báo giá khi đã chọn 'Đã có báo giá chính thức'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraftOnly = false) => {
    const isVal = validate();
    if (!isDraftOnly && !isVal) {
      const currentErrors = [];
      if (!formData.name) currentErrors.push("Tên hiện vật");
      if (!formData.category) currentErrors.push("Danh mục");
      if (!formData.delivery_date) currentErrors.push("Thời gian nhận hàng");
      if (!formData.vendor_id) currentErrors.push("Nhà cung cấp");
      if (formData.quantity <= 0) currentErrors.push("Số lượng");
      if (formData.unit_price <= 0) currentErrors.push("Đơn giá");
      if (errors.budget) currentErrors.push("Ngân sách (vượt hạn mức)");
      if (
        formData.has_quotation &&
        (!formData.attachments || formData.attachments.length === 0)
      )
        currentErrors.push("Tệp báo giá (bắt buộc khi đã tích báo giá)");

      toast(`Vui lòng kiểm tra: ${currentErrors.join(", ")}`, "error");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Prepare JSON payload as per api.txt & controller
      const payload = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        description: formData.description,
        unit_price: Number(formData.unit_price),
        quantity: Number(formData.quantity),
        delivery_date: formData.delivery_date,
        receive_date: formData.delivery_date, // Send both to be safe
        supplier: formData.vendor_id, // Mapping vendor_id to supplier field
        has_quotation: formData.has_quotation,
        status: isDraftOnly ? "DRAFT" : "RECEIVED",
      };

      // 2. Create the Asset (JSON POST)
      const response = await asxhService.createAsset(programId, payload);

      const assetId = response?.data?.id || response?.data?.asset_id;
      if (response?.success && assetId) {
        // 3. Optional: Add Specifications sequentially
        if (formData.specifications?.length > 0) {
          await Promise.all(
            formData.specifications
              .filter((s) => s.key && s.value)
              .map((spec) =>
                asxhService.addAssetSpecification(assetId, {
                  parameterName: spec.key,
                  parameterValue: spec.value,
                })
              )
          );
        }

        // 4. Optional: Upload Attachments
        if (formData.attachments?.length > 0) {
          await Promise.all(
            formData.attachments.map((file) => {
              const fileData = new FormData();
              fileData.append("title", file.name);
              fileData.append("file", file);
              return asxhService.uploadAssetAttachment(assetId, fileData);
            })
          );
        }

        toast(
          isDraftOnly ? "Đã lưu bản nháp." : "Thêm hiện vật thành công!",
          "success"
        );
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/asxh/programs/${programId}/assets`);
      } else {
        toast(response?.message || "Lỗi khi tạo hiện vật", "error");
      }
    } catch (error) {
      console.error("Error submitting asset:", error);
      toast(
        error.response?.data?.message || "Có lỗi xảy ra khi xử lý.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalBudget = programInfo?.total_budget || 0;
  const allocatedFromServer = programInfo?.allocated_budget || 0;
  const budgetLimit = totalBudget - allocatedFromServer;

  const currentAssetValue =
    (Number(formData.quantity) || 0) * (Number(formData.unit_price) || 0);
  const displayAllocated = allocatedFromServer + currentAssetValue;
  const displayAvailable = totalBudget - displayAllocated;

  return (
    <Box
      sx={{
        "& *": {
          fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
        },
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        "& .MuiInputBase-input": {
          fontSize: "0.875rem",
        },
        bgcolor: "#EFF6FF", // Refined background
        overflow: "hidden",
      }}
    >
      {/* Scrollable Content Area */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, pb: 10 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <AssetFormHeader
              programInfo={programInfo}
              allocatedBudget={displayAllocated}
              availableBudget={displayAvailable}
            />

            <BasicInfoSection
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />

            <TechnicalSpecsSection
              specs={formData.specifications}
              onChange={(val) => handleInputChange("specifications", val)}
            />

            <QuantityPriceSection
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              availableBudget={budgetLimit}
            />

            <VendorSelection
              vendors={vendors}
              selectedId={formData.vendor_id}
              onChange={(id) => handleInputChange("vendor_id", id)}
              onVendorCreated={handleVendorCreated}
              onRefresh={fetchData}
              error={errors.vendor_id}
              hasQuotation={formData.has_quotation}
              onQuotationToggle={(val) =>
                handleInputChange("has_quotation", val)
              }
            />

            <FileUploadSection
              files={formData.attachments}
              onChange={(files) => handleInputChange("attachments", files)}
              error={errors.attachments}
              required={formData.has_quotation}
            />
          </Stack>
        </Container>
      </Box>

      {/* Sticky Footer */}
      <ActionFooter
        onCancel={() => navigate(-1)}
        onDraft={() => handleSubmit(true)}
        onSubmit={() => handleSubmit(false)}
        submitting={submitting}
      />
    </Box>
  );
};

export default ASXHAddAsset;
