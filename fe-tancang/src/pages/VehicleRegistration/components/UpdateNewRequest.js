import React, { useEffect, useCallback } from "react";
import {
  SkyGrid as Grid,
  SkyMenu as Menu,
  SkyMenuItem as MenuItem,
  SkyListItemText as ListItemText,
} from "@styles/SkyStyles";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import withSharedComponents from "@components/WrapperComponent";
import { useToast } from "@components/common/ToastProvider";
import { Visibility, DeleteOutline } from "@mui/icons-material";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import {
  JobMainContent,
  VehicleSectionTitle as JobSectionTitle,
  StyledBoxContainerContent,
  SectionHeaderContainer,
  StyledListItemIcon,
  StyledMenuIcon,
  BlueActionButton,
  // HeaderGridContainer,
  StatusTag,
  StatusLabel,
  StatusContainer,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";

import FileTreeTable from "@components/FileTreeTable";
import FilePreviewDialog from "@components/UploadFile/components/FilePreviewDialog";
import CustomDialog from "@components/CustomDialog/CustomDialog";
import LoadingDialog from "@components/LoadingDialog";

import axiosInstance from "@utils/axiosInstance";
import { 
  API_VEHICLE_REQUEST, 
  APP_BASE, 
  API_VIEW_FILE, 
  API_FILE_INFO 
} from "@EnvironmentFile/constants/urlConfig";
import api from "@services/api";

const UpdateNewRequest = ({
  open,
  onClose,
  onSuccess,
  sharedComponents,
  title = "Chỉnh sửa yêu cầu đăng ký xe",
  data = {}, // Data to be updated
  vehicleRegistrationId,
}) => {
  const {
    CustomSwipper,
    InputComponents,
    DateTimePicker,
    // ButtonOutline
  } = sharedComponents;

  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // File management states
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [fileList, setFileList] = React.useState([]);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [previewFileName, setPreviewFileName] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
   const [documentDetail, setDocumentDetail] = React.useState(null);

  const schema = yup.object().shape({
    departureTime: yup.date().required("Vui lòng chọn thời gian đi").typeError("Thời gian đi không hợp lệ").min(new Date(), "Thời gian đi không được trong quá khứ"),
    returnTime: yup.date().required("Vui lòng chọn thời gian về").typeError("Thời gian về không hợp lệ").min(yup.ref('departureTime'), "Thời gian về phải lớn hơn hoặc bằng thời gian đi"),
    departurePoint: yup.string().required("Vui lòng nhập nơi xuất phát").max(300, "Nơi xuất phát tối đa 300 ký tự"),
    destination: yup.string().required("Vui lòng nhập nơi đến").max(300, "Nơi đến tối đa 300 ký tự"),
    passengerCount: yup.number().transform((value, originalValue) => (String(originalValue).trim() === "" ? null : value)).nullable().min(1, "Số lượng người đi phải từ 1 đến 50").max(50, "Số lượng người đi phải từ 1 đến 50").typeError("Vui lòng chỉ nhập số"),
    contactPerson: yup.string().max(100, "Người liên hệ tối đa 100 ký tự"),
    contactPhone: yup.string().transform((value) => value ? value.replace(/\s/g, '') : value).matches(/^(0|84)[0-9]{8,10}$/, "Số điện thoại không đúng định dạng (Bắt đầu bằng 0 hoặc 84, từ 9-11 số)"),
    purpose: yup.string().max(500, "Mục đích công tác tối đa 500 ký tự"),
    note: yup.string().max(1000, "Ghi chú tối đa 1000 ký tự"),
  });

  const { crmSource } = useSelector((state) => state.config);

  const requestTypeOptions =
  crmSource.find((item) => item.code === "LYCDKX")?.data || [];
  const priorityOptions =
  crmSource.find((item) => item.code === "DOUUTIENDATXE")?.data || [];
  const importantGuestsOptions =
  crmSource.find((item) => item.code === "TIEPKHACHQUANTRONG")?.data || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      requestType: "",
      priority: "",
      isImportantGuest: "",
      passengerCount: "",
      departureTime: null,
      returnTime: null,
      departurePoint: "",
      destination: "",
      contactPerson: "",
      contactPhone: "",
      purpose: "",
      note: "",
    },
  });
  
  const departureTimeValue = useWatch({ control, name: "departureTime" });
  const isImportantGuest = useWatch({ control, name: "isImportantGuest" });

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (open && vehicleRegistrationId) {
        setIsLoading(true);
        try {
          const res = await api.get(`${API_VEHICLE_REQUEST}/${vehicleRegistrationId}`);
           const response = res.data;
          
          if (response && response.success) {
            const vehicleData = response.data;
            setDocumentDetail(response);
            reset({
              requestType: vehicleData.requestType,
              priority: vehicleData.priority,
              isImportantGuest: vehicleData.isImportantGuest,
              passengerCount: vehicleData.passengerCount,
              departureTime: vehicleData.departureTime,
              returnTime: vehicleData.returnTime,
              departurePoint: vehicleData.departurePoint,
              destination: vehicleData.destination,
              contactPerson: vehicleData.contactPerson,
              contactPhone: vehicleData.contactPhone,
              purpose: vehicleData.purpose,
              note: vehicleData.notes,
            });
          }
        } catch (error) {
          toast("Không thể tải thông tin yêu cầu!", "error");
          logger.error("Error fetching vehicle request:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchFiles = async () => {
      if (vehicleRegistrationId) {
        try {
          const response = await axiosInstance.get(`${APP_BASE}/api/files/by-object?object_type=vehicleRegistration&object_id=${vehicleRegistrationId}`);
          if (response) {
            setFileList(response);
          }
        } catch (error) {
          logger.error("Error fetching files:", error);
        }
      }
    };

    fetchRequestDetails();
    fetchFiles();
  }, [open, data?.id, reset, toast, vehicleRegistrationId]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (data.departureTime && data.returnTime) {
         if (dayjs(data.departureTime).isSameOrAfter(dayjs(data.returnTime))) {
            toast("Thời gian đi phải nhỏ hơn thời gian về", "error");
            setIsLoading(false);
            return;
         }
      }
      const payload = {
        ...data,
        passengerCount: data.passengerCount ? Number(data.passengerCount) : null
      };
      
      await axiosInstance.patch(`${API_VEHICLE_REQUEST}/${vehicleRegistrationId}`, payload);
      
      toast("Cập nhật yêu cầu đặt xe thành công!", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast(error?.message || "Có lỗi xảy ra!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileMenuClick = useCallback((event) => {
    const fileId = event.currentTarget.getAttribute('data-file-id');
    setSelectedFileId(fileId);
    setFileMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseFileMenu = useCallback(() => {
    setFileMenuAnchor(null);
  }, []);

  const handleViewFile = useCallback(() => {
    const fileObj = fileList.find(f => f.id.toString() === selectedFileId?.toString());
    if (fileObj) {
      setPreviewUrl(`${API_VIEW_FILE}/${fileObj.id}`);
      setPreviewFileName(fileObj.file_name || fileObj.name);
      setPreviewOpen(true);
    }
    handleCloseFileMenu();
  }, [fileList, selectedFileId, handleCloseFileMenu]);

  const handleOpenDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
    handleCloseFileMenu();
  }, [handleCloseFileMenu]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handleDeleteFile = useCallback(async () => {
    setIsLoading(true);
    try {
      await axiosInstance.delete(`${API_FILE_INFO}/${selectedFileId}`);
      setFileList((prev) => prev.filter((f) => f.id.toString() !== selectedFileId?.toString()));
      toast("Xóa tệp thành công!", "success");
    } catch (error) {
      toast(error?.response?.data?.message || "Không thể xóa tệp!", "error");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedFileId, toast]);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewFileName("");
  }, []);

  // Mock Files Data matching the design
  // const fileTreeData = [
  //   { id: "1", name: "tepdinhkem1.pdf", STT: 1, 'parent_id': null },
  //   { id: "2", name: "tepdinhkem1.pdf", STT: 2, 'parent_id': null },
  //   { id: "3", name: "tepdinhkem1.pdf", STT: 3, 'parent_id': null },
  // ];

  return (
    <CustomSwipper
      title={title}
      open={open}
      onClose={onClose}
      onSave={handleSubmit(onSubmit)}
      type="view" // Using view type but providing a save button to match the header design
      hideBackdrop
      isLoading={isLoading}
      moreActions={
        <BlueActionButton
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          variant="contained"
        >
          Lưu
        </BlueActionButton>
      }
    >
      <JobMainContent>
        {/* SECTION 1: THÔNG TIN YÊU CẦU ĐĂNG KÝ XE */}
        <StyledBoxContainerContent>
          <SectionHeaderContainer>
            <JobSectionTitle variant="h6">
              THÔNG TIN YÊU CẦU ĐĂNG KÝ XE
            </JobSectionTitle>
            <StatusContainer direction="row" align="center">
              <StatusLabel variant="body2">Trạng thái hồ sơ:</StatusLabel>
                 {documentDetail?.data?.vehicleStateBadge ? (
                           <div dangerouslySetInnerHTML={{ __html: documentDetail.data.vehicleStateBadge }} />
                         ) : (
              <StatusTag>
                Chờ điều phối
              </StatusTag>
                         )}
            </StatusContainer>
          </SectionHeaderContainer>

          <Grid container spacing={2}>
            {/* ROW 1: Disabled */}
            <Grid item xs={12} md={6}>
              <Controller
                name="requestType"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Loại yêu cầu"
                    disabled
                    options={requestTypeOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Mức độ ưu tiên"
                    disabled
                    options={priorityOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* ROW 2: Disabled */}
            <Grid item xs={12} md={6}>
              <Controller
                name="isImportantGuest"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Tiếp khách quan trọng"
                    disabled
                    options={importantGuestsOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="passengerCount"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Số lượng người đi"
                    disabled
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* ROW 3: Editable */}
            <Grid item xs={12} md={6}>
              <Controller
                name="departureTime"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Thời gian đi"
                    showTime
                    required
                    futureOnly
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.departureTime}
                    helperText={errors.departureTime?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="returnTime"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Thời gian về"
                    required
                    showTime
                    futureOnly
                    minDateTime={departureTimeValue}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.returnTime}
                    helperText={errors.returnTime?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 4: Editable */}
            <Grid item xs={12} md={6}>
              <Controller
                name="departurePoint"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Nơi xuất phát"
                    required
                    {...field}
                    error={!!errors.departurePoint}
                    helperText={errors.departurePoint?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Nơi đến"
                    required
                    {...field}
                    error={!!errors.destination}
                    helperText={errors.destination?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 5: Disabled */}
            <Grid item xs={12} md={6}>
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Người liên hệ"
                    disabled
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactPhone"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Số điện thoại liên hệ"
                    disabled
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* ROW 6: Disabled Full width */}
            <Grid item xs={12}>
              <Controller
                name="purpose"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Mục đích công tác"
                    multiline
                    rows={1}
                    disabled
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* ROW 7: Disabled Full width */}
            <Grid item xs={12}>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Ghi chú"
                    multiline
                    rows={1}
                    disabled
                    {...field}
                     error={!!errors.note}
                    helperText={errors.note?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </StyledBoxContainerContent>

        {/* SECTION 2: TỆP ĐÍNH KÈM TIẾP KHÁCH QUAN TRỌNG */}
        {isImportantGuest === "co" && (
        <StyledBoxContainerContent styledMarginTop>
          <JobSectionTitle variant="h6" gutterBottom>
            TỆP ĐÍNH KÈM TIẾP KHÁCH QUAN TRỌNG
          </JobSectionTitle>

          <FileTreeTable
            data={fileList}
            onFileMenuClick={handleFileMenuClick}
            MenuIcon={StyledMenuIcon}
            isView={true} // Disable upload/delete in update mode as per design
          />

          <Menu
            anchorEl={fileMenuAnchor}
            open={Boolean(fileMenuAnchor)}
            onClose={handleCloseFileMenu}
            id="file-menu"
          >
            <MenuItem onClick={handleViewFile}>
              <StyledListItemIcon>
                <Visibility />
              </StyledListItemIcon>
              <ListItemText>Xem chi tiết</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleOpenDeleteDialog}>
              <StyledListItemIcon>
                <DeleteOutline />
              </StyledListItemIcon>
              <ListItemText>Xóa</ListItemText>
            </MenuItem>
          </Menu>
        </StyledBoxContainerContent>
        )}
      </JobMainContent>

      <LoadingDialog open={isLoading}>
        Đang xử lý, vui lòng đợi...
      </LoadingDialog>

      <CustomDialog
        isLoading={isLoading}
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onSave={handleDeleteFile}
        title="Xác nhận xóa"
        type="delete"
        size="sm"
      >
        Bạn có muốn xóa tệp này không?
      </CustomDialog>

      <FilePreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        fileName={previewFileName}
        url={previewUrl}
      />
    </CustomSwipper>
  );
};

export default withSharedComponents(UpdateNewRequest);