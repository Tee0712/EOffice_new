import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { ArrowBackIosNew as BackIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";

// Import Components
import ProgramSummaryKPI from "./components/ProgramSummaryKPI";
import Step1DisbursementInfo from "./components/Step1DisbursementInfo";
import Step2RecipientInfo from "./components/Step2RecipientInfo";
import Step3AmountDetail from "./components/Step3AmountDetail";
import Step4Attachment from "./components/Step4Attachment";
import Step5ApprovalFlow from "./components/Step5ApprovalFlow";

const ASXHCreateDisbursement = () => {
  const { programId: paramProgramId, disbursementId } = useParams();
  const editId = disbursementId;
  const isEditMode = !!editId;

  const programId =
    paramProgramId &&
    paramProgramId !== ":programId" &&
    paramProgramId !== "undefined"
      ? paramProgramId
      : "7";
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [programInfo, setProgramInfo] = useState({});
  const [batchesSummary, setBatchesSummary] = useState({});
  const [programItems, setProgramItems] = useState([]);
  const [nextCodeInfo, setNextCodeInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    disbursement_content: "",
    detailed_description: "",
    expected_transfer_date: "",
    program_item_id: "",
    receiver_id: "",
    receiving_unit: "",
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
    account_holder: "",
    tax_code: "",
    amount_details: [{ expense_content: "", amount: 0 }],
    notification_type: "email",
    workflowKey: "",
    pendingFiles: [],
    existingAttachments: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isEditMode) {
        const detailRes = await asxhService.getDisbursementIdDetail(editId);
        if (detailRes.success) {
          const d = detailRes.data.disbursement;
          setFormData({
            id: d.id,
            disbursement_content: d.disbursement_content || "",
            detailed_description: d.detailed_description || "",
            expected_transfer_date: d.expected_transfer_date || "",
            program_item_id: String(d.program_item_id || d.programItemId || ""),
            receiver_id: String(d.receiver_id || d.receiver?.id || ""),
            receiving_unit: d.receiving_unit || d.receiver?.name || "",
            bank_account_number:
              d.bank_account_number || d.receiver?.bank_account_number || "",
            bank_name: d.bank_name || d.receiver?.bank_name || "",
            bank_branch: d.bank_branch || d.receiver?.bank_branch || "",
            account_holder:
              d.account_holder || d.receiver?.bank_account_holder || "",
            tax_code: d.tax_code || d.receiver?.tax_code || "",
            amount_details:
              detailRes.data.details?.length > 0
                ? detailRes.data.details
                : [{ expense_content: "", amount: 0 }],
            workflowKey: d.workflowKey || d.workflow_key || "",
            pendingFiles: [],
            existingAttachments: (detailRes.data.attachments || []).map(
              (a) => ({
                ...a,
                doc_type: a.docType || a.doc_type,
              })
            ),
          });
        }
      }

      const contextRes = await asxhService.getNewDisbursementContext(programId);
      if (contextRes.success) {
        setProgramInfo(contextRes.data.program || {});
        setBatchesSummary(contextRes.data.kpi || {});
        setProgramItems(contextRes.data.items || []);

        if (!isEditMode) {
          const codeRes = await asxhService.getNextDisbursementCode(programId);
          if (codeRes.success) {
            setNextCodeInfo(codeRes.data || {});
          }
        }
      }
    } catch (error) {
      toast("Không thể tải thông tin giải ngân", "error");
    } finally {
      setLoading(false);
    }
  }, [programId, editId, isEditMode, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handlePendingFilesChange = useCallback((files) => {
    setFormData((prev) => ({ ...prev, pendingFiles: files }));
  }, []);

  const handleAttachmentsChange = useCallback((attachments) => {
    setFormData((prev) => ({ ...prev, existingAttachments: attachments }));
  }, []);

  const uploadPendingFiles = async (disbursementId) => {
    if (!formData.pendingFiles || formData.pendingFiles.length === 0) return;
    try {
      const batchFormData = new FormData();
      formData.pendingFiles.forEach((item) => {
        batchFormData.append("files", item.file);
        batchFormData.append("doc_type", item.doc_type || "KHAC");
        batchFormData.append("title", item.file.name);
      });
      await asxhService.uploadDisbursementAttachment(
        disbursementId,
        batchFormData
      );
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const scrollToError = (fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      const input =
        element.querySelector("input") ||
        element.querySelector("textarea") ||
        element;
      if (input && input.focus) setTimeout(() => input.focus(), 500);
    }
  };

  const validateForm = (isSubmit = false) => {
    const newErrors = {};
    let firstErrorId = null;

    const addError = (fieldId, message) => {
      newErrors[fieldId] = message;
      if (!firstErrorId) firstErrorId = fieldId;
    };

    if (!formData.disbursement_content?.trim()) {
      addError("disbursement_content", "Vui lòng nhập nội dung giải ngân");
    }
    if (!formData.expected_transfer_date) {
      addError(
        "expected_transfer_date",
        "Vui lòng chọn ngày dự kiến chuyển tiền"
      );
    }
    if (!formData.program_item_id) {
      addError("program_item_id", "Vui lòng chọn hạng mục ngân sách");
    } else {
      const selectedItem = programItems.find(
        (item) => String(item.id) === String(formData.program_item_id)
      );
      const remainingLimit = selectedItem
        ? selectedItem.remaining_amount || 0
        : 0;
      const totalAmount = (formData.amount_details || []).reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );

      if (totalAmount > remainingLimit) {
        toast("Tổng tiền vượt quá ngân sách của hạng mục", "error");
        newErrors.total_amount_exceeded = true;
        if (!firstErrorId) firstErrorId = "amount_detail_table";
      }
    }

    if (
      !formData.receiving_unit ||
      !formData.receiving_unit.toString().trim()
    ) {
      addError("receiving_unit", "Vui lòng nhập tên đơn vị nhận tiền");
      addError("receiver_id", "Vui lòng chọn đơn vị nhận tiền");
    }
    if (
      !formData.bank_account_number ||
      !formData.bank_account_number.toString().trim()
    ) {
      addError("bank_account_number", "Vui lòng nhập số tài khoản");
    } else if (!/^\d+$/.test(formData.bank_account_number)) {
      addError("bank_account_number", "Số tài khoản chỉ được chứa ký số");
    }
    if (!formData.bank_name?.trim()) {
      addError("bank_name", "Vui lòng chọn ngân hàng");
    }
    if (!formData.account_holder?.trim()) {
      addError("account_holder", "Vui lòng nhập tên chủ tài khoản");
    }

    if (!formData.amount_details || formData.amount_details.length === 0) {
      addError("amount_detail_table", "Thiếu nội dung chi");
    } else {
      const detailErrors = [];
      let hasDetailError = false;
      formData.amount_details.forEach((item, index) => {
        const rowError = {};
        if (!item.expense_content?.trim()) {
          rowError.expense_content = "Thiếu nội dung";
          hasDetailError = true;
        }
        if (!item.amount || parseFloat(item.amount) <= 0) {
          rowError.amount = "Số tiền phải > 0";
          hasDetailError = true;
        }
        detailErrors[index] = rowError;
      });
      if (hasDetailError) {
        newErrors.amount_details = detailErrors;
        if (!firstErrorId) firstErrorId = "amount_detail_table";
      }
    }

    const allAttachments = [
      ...(formData.existingAttachments || []),
      ...(formData.pendingFiles || []),
    ];
    if (allAttachments.length === 0) {
      addError("attachment_section", "Vui lòng đính kèm ít nhất một chứng từ");
    } else if (isSubmit) {
      const hasSignedMinute = allAttachments.some(
        (a) => (a.docType || a.doc_type) === "BIEN_BAN"
      );
      if (!hasSignedMinute) {
        addError(
          "attachment_section",
          "Cần ít nhất một Biên bản ký để gửi phê duyệt"
        );
      }
    }

    setErrors(newErrors);
    if (firstErrorId || Object.keys(newErrors).length > 0) {
      const finalFirstErrorId = firstErrorId || Object.keys(newErrors)[0];
      scrollToError(finalFirstErrorId);
      toast("Vui lòng hoàn thiện các thông tin bắt buộc còn thiếu", "warning");
      return false;
    }
    return true;
  };

  const handleSave = async (submitForApproval = false) => {
    if (!validateForm(submitForApproval)) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount_details: formData.amount_details.map((item) => ({
          ...item,
          amount: parseFloat(item.amount),
        })),
        is_submit: submitForApproval,
      };

      let res;
      let disbursementId = editId;

      if (isEditMode) {
        res = await asxhService.updateDisbursementBatch(
          disbursementId,
          payload
        );
      } else {
        res = await asxhService.createDisbursementBatch(programId, payload);
        if (res.success && res.data.disbursement_id) {
          disbursementId = res.data.disbursement_id;
        }
      }

      if (res.success && disbursementId) {
        await uploadPendingFiles(disbursementId);
        toast(
          submitForApproval
            ? "Đã gửi phê duyệt thành công"
            : "Đã lưu nháp thành công",
          "success"
        );
        navigate(`/asxh/programs/${programId}/disbursement`);
      } else {
        toast(res.message || "Xử lý thất bại", "error");
      }
    } catch (error) {
      toast("Lỗi khi lưu dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const res = await asxhService.deleteDisbursementBatch(editId);
      if (res.success) {
        toast("Đã xóa đợt giải ngân", "success");
        navigate(`/asxh/programs/${programId}/disbursement`);
      } else {
        toast(res.message || "Xóa thất bại", "error");
      }
    } catch (error) {
      toast("Lỗi khi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
      setOpenDeleteConfirm(false);
    }
  };

  if (loading && !formData.disbursement_content) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: "#f4f7fa",
        minHeight: "100%",
        overflowX: "hidden",
        pb: 12,
        fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
        "& *": { fontFamily: "inherit" },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon sx={{ fontSize: "14px !important" }} />}
          onClick={() => navigate(-1)}
          sx={{
            p: 0,
            mb: 1,
            textTransform: "none",
            color: "#64748b",
            fontSize: "13px",
            fontWeight: 500,
            "&:hover": { bgcolor: "transparent", color: "#1e293b" },
          }}
        >
          Quay lại chi tiết giải ngân
        </Button>
        <Typography
          variant="h5"
          fontWeight={700}
          color="#0f172a"
          sx={{ mb: 0.5 }}
        >
          {isEditMode ? "Cập nhật đợt Giải ngân" : "Tạo đợt Giải ngân mới"}
        </Typography>
        <Typography
          variant="body2"
          color="#64748b"
          fontWeight={500}
          sx={{ fontSize: "13px" }}
        >
          Thiết lập thông tin đợt giải ngân cho chương trình ASXH
        </Typography>
      </Box>

      <ProgramSummaryKPI programInfo={programInfo} summary={batchesSummary} />

      <Stack spacing={4} sx={{ mt: 4, pb: 10 }}>
        <Step1DisbursementInfo
          data={formData}
          programItems={programItems}
          nextCodeInfo={nextCodeInfo}
          onChange={handleInputChange}
          errors={errors}
        />
        <Step2RecipientInfo
          data={formData}
          onChange={handleInputChange}
          errors={errors}
        />

        <Step3AmountDetail
          data={formData}
          remainingBudget={
            formData.program_item_id
              ? programItems.find(
                  (item) => String(item.id) === String(formData.program_item_id)
                )?.remaining_amount || 0
              : batchesSummary.remaining_amount
          }
          isEditMode={isEditMode}
          onChange={(val) => handleInputChange("amount_details", val)}
          errors={errors}
        />
        <Step4Attachment
          batchId={formData.id}
          attachments={formData.existingAttachments}
          onAttachmentsChange={handleAttachmentsChange}
          pendingFiles={formData.pendingFiles}
          onPendingFilesChange={handlePendingFilesChange}
          errors={errors}
        />
        <Step5ApprovalFlow
          data={formData}
          programInfo={programInfo}
          onChange={handleInputChange}
        />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: "16px 40px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          bgcolor: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          zIndex: 1000,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              px: 4,
              bgcolor: "#fff",
              color: "#64748b",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              boxShadow: "none",
              "&:hover": { bgcolor: "#f8fafc", boxShadow: "none" },
            }}
          >
            Quay lại
          </Button>

          {isEditMode ? (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenDeleteConfirm(true)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                px: 4,
                fontWeight: 600,
                borderColor: "#fecaca",
                "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" },
              }}
            >
              Xóa đợt
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => handleSave(false)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                px: 4,
                bgcolor: "#fff",
                color: "#1e293b",
                fontWeight: 600,
                border: "1px solid #e2e8f0",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#f8fafc",
                  boxShadow: "none",
                  borderColor: "#cbd5e1",
                },
              }}
            >
              Lưu nháp
            </Button>
          )}

          <Button
            variant="contained"
            onClick={() => handleSave(true)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              px: 4,
              bgcolor: "#10b981",
              color: "#fff",
              fontWeight: 700,
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            {isEditMode ? "Cập nhật & Gửi phê duyệt" : "Gửi phê duyệt"}
          </Button>
        </Stack>
      </Paper>

      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1e293b" }}>
          Xác nhận xóa đợt giải ngân?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500 }}>
            Hành động này không thể hoàn tác. Mọi thông tin và chứng từ liên
            quan sẽ bị xóa vĩnh viễn.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setOpenDeleteConfirm(false)}
            sx={{ color: "#64748b", fontWeight: 700 }}
          >
            Để sau
          </Button>
          <Button
            onClick={handleDeleteBatch}
            variant="contained"
            color="error"
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ASXHCreateDisbursement;
