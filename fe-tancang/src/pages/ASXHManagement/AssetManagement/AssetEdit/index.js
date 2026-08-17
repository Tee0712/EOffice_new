import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Container, 
  Stack, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button as MuiButton,
  Button
} from "@mui/material";
import { useToast } from "@components/common/ToastProvider";
import asxhService from "@services/asxhService";

// Reuse components from AddAsset
import AssetFormHeader from "../AddAsset/components/AssetFormHeader";
import BasicInfoSection from "../AddAsset/components/BasicInfoSection";
import TechnicalSpecsSection from "../AddAsset/components/TechnicalSpecsSection";
import QuantityPriceSection from "../AddAsset/components/QuantityPriceSection";
import VendorSelection from "../AddAsset/components/VendorSelection";
import FileUploadSection from "../AddAsset/components/FileUploadSection";
import ActionFooter from "../AddAsset/components/ActionFooter";

import StatusConfirmationSection from "./components/StatusConfirmationSection";

const ASXHAssetEdit = () => {
  const { programId: paramId, assetId } = useParams();
  const programId = (paramId && paramId !== ":programId") ? paramId : "7";
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [initialAssetValue, setInitialAssetValue] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [originalSpecIds, setOriginalSpecIds] = useState([]);
  
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
    status: "",
    handover_id: null
  });

  const [errors, setErrors] = useState({});

  // 1. Fetch Context and Asset Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, assetRes, supplierRes, batchesRes] = await Promise.all([
        asxhService.getInKindOverview(programId),
        asxhService.getAssetDetail(assetId),
        asxhService.getSuppliers({ program_id: programId }),
        asxhService.getHandoverBatches(programId)
      ]);
      
      const { program, kpi } = overviewRes?.data || {};
      setProgramInfo({
        ...program,
        total_budget: kpi?.total_budget || 0,
        allocated_budget: kpi?.total_asset_value || 0
      });
      setVendors(supplierRes?.data?.items || supplierRes?.data || []);

      if (assetRes?.success && assetRes.data) {
        const asset = assetRes.data;
        const initialVal = (Number(asset.quantity) || 0) * (Number(asset.unitPrice || asset.unit_price) || 0);
        setInitialAssetValue(initialVal);

        // Find which handover batch this asset belongs to
        let identifiedHandoverId = asset.handover_asset_id || asset.handover_id || asset.handoverBatchId || asset.batch_id;
        
        if (!identifiedHandoverId && batchesRes?.success) {
          const batches = batchesRes.data?.items || batchesRes.data || [];
          const parentBatch = batches.find(b => (b.asset_ids || []).includes(Number(assetId)));
          if (parentBatch) {
            identifiedHandoverId = parentBatch.id;
          }
        }

        setFormData({
          name: asset.name || "",
          category: asset.category || "",
          unit: asset.unit || "Chiếc",
          receive_date: asset.handoverEvent?.handoverDate || asset.receive_date || asset.requiredReceiptDate || "",
          delivery_date: asset.handoverEvent?.handoverDate || asset.delivery_date || asset.requiredReceiptDate || "",
          description: asset.description || "",
          specifications: asset.specifications?.length > 0 
            ? asset.specifications.map(s => ({ 
                id: s.id, 
                key: s.parameterName || s.key, 
                value: s.parameterValue || s.value 
              }))
            : [{ key: "", value: "" }],
          vendor_id: asset.supplierId ? Number(asset.supplierId) : (asset.supplier?.id || asset.supplier_id || asset.vendor_id),
          quantity: asset.quantity || 1,
          unit_price: asset.unitPrice || asset.unit_price || 0,
          special_requirements: asset.specialRequirements || asset.special_requirements || "",
          has_quotation: !!asset.hasOfficialQuote || !!asset.has_quotation,
          attachments: (asset.attachments || []).map(a => ({ ...a, id: a.id, name: a.title || a.name })),
          status: asset.status || "",
          handover_id: identifiedHandoverId || null
        });
        setOriginalSpecIds(asset.specifications?.map(s => s.id).filter(Boolean) || []);
      }
    } catch (error) {
      console.error("Error fetching context:", error);
      toast("Không thể tải thông tin hiện vật", "error");
    } finally {
      setLoading(false);
    }
  }, [programId, assetId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Tên hiện vật là bắt buộc";
    if (!formData.category) newErrors.category = "Vui lòng chọn danh mục";
    if (!formData.delivery_date) newErrors.delivery_date = "Thời gian nhận hàng là bắt buộc";
    if (!formData.vendor_id) newErrors.vendor_id = "Vui lòng chọn nhà cung cấp";
    if (formData.quantity <= 0) newErrors.quantity = "Số lượng phải > 0";
    if (formData.unit_price <= 0) newErrors.unit_price = "Đơn giá phải > 0";
    
    // Budget Validation
    const totalBudget = programInfo?.total_budget || 0;
    // We must subtract the initial value of THIS asset from the server's allocated budget 
    // to get the budget allocated to OTHER assets.
    const othersAllocated = (programInfo?.allocated_budget || 0) - initialAssetValue;
    const currentTotal = (Number(formData.quantity) || 0) * (Number(formData.unit_price) || 0);
    
    if (currentTotal > (totalBudget - othersAllocated)) {
      newErrors.budget = "Tổng giá trị vượt quá ngân sách còn lại";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const response = await asxhService.deleteAsset(assetId);
      if (response?.success) {
        toast("Đã xóa hạng mục hiện vật", "success");
        navigate(`/asxh/programs/${programId}/assets`);
      } else {
        toast(response?.message || "Lỗi khi xóa hiện vật", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast(error.response?.data?.message || "Không thể xóa hiện vật", "error");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      const currentErrors = [];
      if (!formData.name) currentErrors.push("Tên hiện vật");
      if (!formData.category) currentErrors.push("Danh mục");
      if (!formData.delivery_date) currentErrors.push("Thời gian nhận hàng");
      if (!formData.vendor_id) currentErrors.push("Nhà cung cấp");
      if (formData.quantity <= 0) currentErrors.push("Số lượng");
      if (formData.unit_price <= 0) currentErrors.push("Đơn giá");
      
      // Calculate errors locally for the toast since state might not have updated yet
      const totalBudget = programInfo?.total_budget || 0;
      const othersAllocated = (programInfo?.allocated_budget || 0) - initialAssetValue;
      const currentTotal = (Number(formData.quantity) || 0) * (Number(formData.unit_price) || 0);
      if (currentTotal > (totalBudget - othersAllocated)) {
        currentErrors.push("Ngân sách (vượt hạn mức)");
      }

      toast(`Vui lòng kiểm tra: ${currentErrors.join(", ")}`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        description: formData.description,
        unit_price: Number(formData.unit_price),
        quantity: Number(formData.quantity),
        delivery_date: formData.delivery_date,
        receive_date: formData.delivery_date,
        requiredReceiptDate: formData.delivery_date,
        supplier: formData.vendor_id,
        supplierId: formData.vendor_id,
        hasOfficialQuote: formData.has_quotation,
        has_quotation: formData.has_quotation,
        status: formData.status,
        special_requirements: formData.special_requirements,
      };

      const response = await asxhService.updateAsset(assetId, payload);
      
      if (response?.success) {
        // 1. Sync Specifications: Delete old ones and add current ones
        // Since there's no bulk update, we clear existing and re-add
        try {
          if (originalSpecIds.length > 0) {
            await Promise.all(originalSpecIds.map(id => asxhService.deleteAssetSpecification(id)));
          }
          
          if (formData.specifications?.length > 0) {
            const validSpecs = formData.specifications.filter(s => s.key && s.value);
            if (validSpecs.length > 0) {
              await Promise.all(
                validSpecs.map(spec => asxhService.addAssetSpecification(assetId, { 
                  parameterName: spec.key, 
                  parameterValue: spec.value 
                }))
              );
            }
          }
        } catch (specError) {
          console.error("Error syncing specifications:", specError);
          // We don't block navigation here but maybe log it
        }

        // 2. Sync Handover Schedule Status if needed
        console.log("Checking if need to sync handover status. handover_id:", formData.handover_id);
        if (formData.handover_id) {
          try {
            console.log("Proceeding to sync handover schedule status for ID:", formData.handover_id);
            const handoverRes = await asxhService.getHandoverDetail(formData.handover_id);
            if (handoverRes?.success && handoverRes.data) {
              const { handover, assets: batchAssets } = handoverRes.data;
              
              // Calculate new status for the whole batch
              let newStatus = "SCHEDULED";
              const assetStatuses = (batchAssets || []).map(a => a.status);
              
              const hasWaitingPurchase = assetStatuses.some(s => 
                ["RECEIVED", "PENDING", "PURCHASING", "IN_PROCUREMENT"].includes(s)
              );
              const hasWaitingHandover = assetStatuses.some(s => s === "SHIPPING");
              
              if (hasWaitingPurchase) {
                newStatus = "WAITING_PURCHASE";
              } else if (hasWaitingHandover) {
                newStatus = "WAITING_HANDOVER";
              }
              
              // Only update if status changed
              if (handover.status !== newStatus) {
                console.log(`Updating handover ${formData.handover_id} status to ${newStatus}`);
                await asxhService.updateHandoverStatus(formData.handover_id, newStatus);
              }
            }
          } catch (syncError) {
            console.error("Error syncing handover status:", syncError);
          }
        }

        // 3. Upload New Attachments
        const newFiles = (formData.attachments || []).filter(file => file instanceof File);
        console.log("Found new files to upload:", newFiles.length);
        if (newFiles.length > 0) {
          try {
            console.log("Proceeding to upload files for asset:", assetId);
            await Promise.all(
              newFiles.map(file => {
                const fileData = new FormData();
                fileData.append("title", file.name);
                fileData.append("file", file);
                return asxhService.uploadAssetAttachment(assetId, fileData);
              })
            );
          } catch (uploadError) {
            console.error("Error uploading new attachments:", uploadError);
          }
        }

        toast("Cập nhật hiện vật thành công!", "success");
        navigate(`/asxh/programs/${programId}/assets`);
      } else {
        toast(response?.message || "Lỗi khi cập nhật hiện vật", "error");
      }
    } catch (error) {
      console.error("Error updating asset:", error);
      toast(error.response?.data?.message || "Có lỗi xảy ra khi xử lý.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalBudget = programInfo?.total_budget || 0;
  const allocatedFromServer = (programInfo?.allocated_budget || 0) - initialAssetValue;
  const budgetLimit = totalBudget - allocatedFromServer;
  
  const currentAssetValue = (Number(formData.quantity) || 0) * (Number(formData.unit_price) || 0);
  const displayAllocated = allocatedFromServer + currentAssetValue;
  const displayAvailable = totalBudget - displayAllocated;

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      bgcolor: "#EFF6FF", 
      overflow: "hidden" 
    }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, pb: 10 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <AssetFormHeader 
              programInfo={programInfo} 
              allocatedBudget={displayAllocated}
              availableBudget={displayAvailable} 
              isEdit={true} 
            />
            
            <StatusConfirmationSection 
              currentStatus={formData.status} 
              onStatusChange={(newStatus) => handleInputChange("status", newStatus)} 
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
              error={errors.vendor_id}
              hasQuotation={formData.has_quotation}
              onQuotationToggle={(val) => handleInputChange("has_quotation", val)}
              disabledCreate // Disable creation in edit mode to keep it simple
            />

            <FileUploadSection 
              files={formData.attachments} 
              onChange={(files) => handleInputChange("attachments", files)} 
            />
          </Stack>
        </Container>
      </Box>

      <ActionFooter 
        onCancel={() => navigate(-1)}
        onSubmit={() => handleSubmit()}
        onDelete={() => setIsDeleteDialogOpen(true)}
        submitting={submitting || deleting}
        submitLabel="Cập nhật"
        hideDraft={true}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !deleting && setIsDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: "12px", minWidth: "400px" }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#EF4444" }}>
          Xác nhận xóa hiện vật
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa hạng mục "<Box component="span" sx={{ fontWeight: 700 }}>{formData.name}</Box>" không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton 
            onClick={() => setIsDeleteDialogOpen(false)} 
            disabled={deleting}
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
          >
            Hủy bỏ
          </MuiButton>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={16} color="inherit" />}
            sx={{ 
              px: 3, 
              borderRadius: "8px", 
              bgcolor: "#EF4444", 
              color: "white",
              fontWeight: 700,
              "&:hover": { bgcolor: "#DC2626" }
            }}
          >
            {deleting ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ASXHAssetEdit;
