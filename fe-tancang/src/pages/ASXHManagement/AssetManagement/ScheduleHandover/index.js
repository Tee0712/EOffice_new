import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Stack, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getFullUsers } from "@redux/slices/SharedCategory/managementUnitSlice";

import { useToast } from "@components/common/ToastProvider";
import asxhService from "@services/asxhService";

import HandoverHeader from "./components/HandoverHeader";
import HandoverFooter from "./components/HandoverFooter";
import EventInfoSection from "./components/EventInfoSection";
import AssetSelectionSection from "./components/AssetSelectionSection";
import LocalContactSection from "./components/LocalContactSection";
import ParticipantSection from "./components/ParticipantSection";
import PreparationChecklistSection from "./components/PreparationChecklistSection";
import NotificationSettingSection from "./components/NotificationSettingSection";
import MemberSelectionModal from "./components/MemberSelectionModal";
import DeleteConfirmDialog from "./components/DeleteConfirmDialog";

const STORAGE_KEY = "asxh_schedule_handover_draft";

const ScheduleHandover = () => {
  const { programId: paramId, id } = useParams();
  const isEdit = !!id;
  const programId = paramId && paramId !== ":programId" ? paramId : "7";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookedAssetIds, setBookedAssetIds] = useState([]);
  const [deleteError, setDeleteError] = useState(null);
  const [errors, setErrors] = useState({});

  // State from Redux
  const { dataFullListUsers } = useSelector((state) => state.unit);

  const [formData, setFormData] = useState({
    event_name: "",
    handover_date: "",
    start_time: "08:00",
    end_time: "10:00",
    location: "",
    event_type: "PARTIAL_HANDOVER",
    format: "DIRECT",
    notes: "",
    receiver_name: "",
    receiver_title: "",
    receiver_phone: "",
    receiver_email: "",
    selectedAssetIds: [],
    attendees: [], // Stores objects with id, full_name, role, etc.
    checklists: [
      {
        id: 1,
        name: "Kiểm tra tình trạng hiện vật trước khi vận chuyển",
        checklist_type: "MANDATORY",
        is_checked: true,
      },
      {
        id: 2,
        name: "Chuẩn bị biên bản bàn giao (2 bản gốc)",
        checklist_type: "MANDATORY",
        is_checked: true,
      },
      {
        id: 3,
        name: "In danh sách hiện vật kèm serial number",
        checklist_type: "MANDATORY",
        is_checked: true,
      },
      {
        id: 4,
        name: "Liên hệ đơn vị vận chuyển (xe tải 3.5 tấn)",
        checklist_type: "MANDATORY",
        is_checked: false,
      },
      {
        id: 5,
        name: "Đặt vé máy bay / xe cho đoàn (4 người)",
        checklist_type: "MANDATORY",
        is_checked: false,
      },
      {
        id: 6,
        name: "Đặt phòng khách sạn (nếu cần lưu đêm)",
        checklist_type: "OPTIONAL",
        is_checked: false,
      },
      {
        id: 7,
        name: "In banner / phông nền lễ trao tặng",
        checklist_type: "OPTIONAL",
        is_checked: false,
      },
      {
        id: 8,
        name: "Chuẩn bị quà lưu niệm cho trường",
        checklist_type: "OPTIONAL",
        is_checked: false,
      },
      {
        id: 9,
        name: "Thông báo P.Truyền thông chụp ảnh / quay phim",
        checklist_type: "OPTIONAL",
        is_checked: false,
      },
      {
        id: 10,
        name: "Phối hợp kỹ thuật IT lắp đặt tại chỗ sau bàn giao",
        checklist_type: "MANDATORY",
        is_checked: false,
      },
    ],

    notify_attendees: true,
    notify_local: true,
    remind_3days: true,
    sync_google_calendar: true,
    remind_checklist: true,
  });

  useEffect(() => {
    if (!dataFullListUsers || dataFullListUsers.length === 0) {
      dispatch(getFullUsers());
    }
  }, [dispatch, dataFullListUsers]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contextRes, assetsRes, batchesRes] = await Promise.all([
        asxhService.getHandoverNewContext(programId),
        asxhService.getAssets(programId),
        asxhService.getHandoverBatches(programId),
      ]);

      if (contextRes?.success) {
        const { program, checklist_templates } = contextRes.data;
        setProgramInfo({
          ...program,
          code: program?.code || "CT-2026/005",
          locality: program?.locality || "Đắk Hà, Kon Tum",
        });

        // Only set default checklists if not in edit mode
        if (!isEdit && checklist_templates?.length > 0) {
          handleInputChange(
            "checklists",
            checklist_templates.map((t, idx) => ({
              id: idx + 1,
              name: t.name,
              checklist_type: t.checklist_type,
              is_checked: false,
            }))
          );
        }
      }

      if (assetsRes?.success) {
        setAssets(assetsRes.data?.items || assetsRes.data || []);
      }

      console.log("Handover Batches for Program:", batchesRes);
      if (batchesRes?.success) {
        const otherBatches = (
          batchesRes.data?.items ||
          batchesRes.data ||
          []
        ).filter((b) => !isEdit || String(b.id) !== String(id));
        const bookedIds = otherBatches.reduce(
          (acc, b) => [...acc, ...(b.asset_ids || [])],
          []
        );
        setBookedAssetIds(bookedIds);
      }

      // If Edit Mode, fetch details and override formData
      if (isEdit) {
        console.log("Fetching handover details for ID:", id);
        const detailRes = await asxhService.getHandoverDetail(id);
        if (detailRes?.success && detailRes.data?.handover) {
          const d = detailRes.data.handover;
          const assets_list = detailRes.data.assets || [];
          const attendees_list = detailRes.data.attendees || [];
          const checklists_list = detailRes.data.checklists || [];

          console.log("Mapping handover data:", d);

          setFormData((prev) => ({
            ...prev,
            event_name: d.event_name || "",
            handover_date: d.handover_date || "",
            start_time: d.start_time || "08:00",
            end_time: d.end_time || "10:00",
            location: d.location || "",
            event_type: d.event_type || "PARTIAL_HANDOVER",
            format: d.format || "DIRECT",
            notes: d.notes || "",
            receiver_name: d.representative_name || "",
            receiver_title: d.representative_title || "",
            receiver_phone: d.representative_phone || "",
            receiver_email: d.representative_email || "",
            selectedAssetIds: assets_list.map((a) => a.id) || [],
            attendees:
              attendees_list.map((a) => {
                const userId = a.userId || a.user_id || a.id;
                const userInStore = dataFullListUsers?.find(
                  (u) => u.id === userId
                );

                return {
                  id: userId,
                  full_name:
                    a.user_name ||
                    userInStore?.full_name ||
                    a.full_name ||
                    a.name ||
                    "N/A",
                  role: a.role || "Thành viên",
                };
              }) || [],
            checklists: checklists_list.map((c, idx) => ({
              id: idx + 1,
              name: c.name,
              checklist_type: c.checklistType || c.checklist_type,
              is_checked: c.isDone !== undefined ? c.isDone : c.is_done,
            })),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching handover context:", error);
      toast("Không thể tải thông tin khởi tạo bàn giao.", "error");
    } finally {
      setLoading(false);
    }
  }, [programId, id, isEdit, toast, dataFullListUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Draft
  useEffect(() => {
    // Only load draft for new creation, ignore for Edit mode
    if (!loading && !isEdit) {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          if (draftData.programId === programId) {
            setFormData((prev) => ({ ...prev, ...draftData.data }));
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [loading, programId, isEdit]);

  // Update logic
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.event_name)
      newErrors.event_name = "Vui lòng nhập tên sự kiện";
    if (!formData.handover_date)
      newErrors.handover_date = "Vui lòng chọn ngày bàn giao";
    if (!formData.location) newErrors.location = "Vui lòng nhập địa điểm";
    if (!formData.receiver_name)
      newErrors.receiver_name = "Vui lòng nhập người đại diện";
    if (!formData.receiver_phone)
      newErrors.receiver_phone = "Vui lòng nhập số điện thoại";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraftOnly = false) => {
    if (!validate()) {
      toast("Vui lòng hoàn thành các trường bắt buộc.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Calculate dynamic status based on selected assets
      let finalStatus = isDraftOnly ? "DRAFT" : "SCHEDULED";
      if (!isDraftOnly && formData.selectedAssetIds.length > 0) {
        const selectedAssets = assets.filter((a) =>
          formData.selectedAssetIds.includes(a.id)
        );
        const hasWaitingPurchase = selectedAssets.some((a) =>
          ["RECEIVED", "IN_PROCUREMENT"].includes(a.status)
        );
        const hasWaitingHandover = selectedAssets.some(
          (a) => a.status === "SHIPPING"
        );

        if (hasWaitingPurchase) {
          finalStatus = "WAITING_PURCHASE";
        } else if (hasWaitingHandover) {
          finalStatus = "WAITING_HANDOVER";
        } else {
          finalStatus = "SCHEDULED";
        }
      }

      const payload = {
        event_name: formData.event_name,
        handover_date: formData.handover_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        event_type: formData.event_type,
        format: formData.format,
        notes: formData.notes,
        status: finalStatus,
        asset_ids: formData.selectedAssetIds,
        receiver_name: formData.receiver_name,
        receiver_title: formData.receiver_title,
        receiver_phone: formData.receiver_phone,
        receiver_email: formData.receiver_email,
        attendees: formData.attendees.map((a) => ({
          user_id: a.id,
          role: a.role || "Thành viên",
        })),
        checklists: formData.checklists.map((c) => ({
          name: c.name,
          checklist_type: c.checklist_type,
          is_done: !!c.is_checked,
        })),
        notify_attendees: formData.notify_attendees,
      };

      let response;
      if (isEdit) {
        if (isDraftOnly) {
          response = await asxhService.saveHandoverDraft(id, payload);
        } else {
          response = await asxhService.updateHandoverBatch(id, payload);
        }
      } else {
        response = await asxhService.createHandoverBatch(programId, payload);
      }

      if (response?.success || response) {
        toast(
          isEdit
            ? "Cập nhật lịch bàn giao thành công!"
            : isDraftOnly
              ? "Đã lưu bản nháp thành công."
              : "Lên lịch bàn giao thành công!",
          "success"
        );
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/asxh/programs/${programId}/assets`);
      }
    } catch (error) {
      console.error("Error submitting handover:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi xử lý.";
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleteError(null);
    setSubmitting(true);
    try {
      const response = await asxhService.deleteHandoverBatch(id);
      if (response?.success || response) {
        toast("Đã xóa lịch bàn giao thành công.", "success");
        setShowDeleteConfirm(false);
        navigate(`/asxh/programs/${programId}/assets`);
      }
    } catch (error) {
      console.error("Error deleting handover:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Không thể xóa lịch bàn giao.";
      setDeleteError(msg);
      toast(msg, "error");
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

  return (
    <Box
      sx={{
        "& *": {
          fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif !important",
        },
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, pb: 12 }}>
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <HandoverHeader programInfo={programInfo} isEdit={isEdit} />

            <EventInfoSection
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />

            <AssetSelectionSection
              assets={assets}
              selectedIds={formData.selectedAssetIds}
              onToggle={(ids) => handleInputChange("selectedAssetIds", ids)}
              loading={false}
              bookedAssetIds={bookedAssetIds}
            />

            <LocalContactSection
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />

            <ParticipantSection
              attendees={formData.attendees}
              locality={programInfo?.locality}
              onAdd={() => setIsMemberModalOpen(true)}
              onRemove={(id) =>
                handleInputChange(
                  "attendees",
                  formData.attendees.filter((a) => a.id !== id)
                )
              }
              onRoleChange={(id) => {
                const roles = [
                  "Trưởng đoàn",
                  "Thành viên",
                  "Hành chính",
                  "Kỹ thuật IT",
                  "Truyền thông",
                  "Điều phối",
                ];
                const updated = formData.attendees.map((a) => {
                  if (a.id === id) {
                    const nextIdx = (roles.indexOf(a.role) + 1) % roles.length;
                    return { ...a, role: roles[nextIdx] };
                  }
                  return a;
                });
                handleInputChange("attendees", updated);
              }}
            />

            <PreparationChecklistSection
              checklists={formData.checklists}
              onChange={(val) => handleInputChange("checklists", val)}
            />

            <NotificationSettingSection
              formData={formData}
              onChange={handleInputChange}
            />
          </Stack>
        </Container>
      </Box>

      <HandoverFooter
        onCancel={() => navigate(-1)}
        onDraft={() => handleSubmit(true)}
        onSubmit={() => handleSubmit(false)}
        onDelete={isEdit ? handleDelete : null}
        isEdit={isEdit}
        submitting={submitting}
      />

      <MemberSelectionModal
        open={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        selectedIds={formData.attendees.map((a) => a.id)}
        currentAttendees={formData.attendees}
        onConfirm={(selectedWithRoles) => {
          handleInputChange("attendees", selectedWithRoles);
          setIsMemberModalOpen(false);
        }}
      />

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        loading={submitting}
        errorMsg={deleteError}
      />
    </Box>
  );
};

export default ScheduleHandover;
