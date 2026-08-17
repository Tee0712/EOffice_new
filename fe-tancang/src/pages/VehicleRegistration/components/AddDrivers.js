import React, { useEffect, useCallback, useMemo } from "react";
import {
  SkyGrid as Grid,
} from "@styles/SkyStyles";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import withSharedComponents from "@components/WrapperComponent";
import { useToast } from "@components/common/ToastProvider";
// import ClearIcon from "@mui/icons-material/Clear";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Visibility, DeleteOutline } from "@mui/icons-material";
import {
  SkyMenu as Menu,
  SkyMenuItem as MenuItem,
  SkyListItemText as ListItemText,
} from "@styles/SkyStyles";

import {
  API_LIST_DRIVERS,
  API_FILES_UPLOAD,
  API_GET_LIST_DRIVER_ABOURT_GROUP_DRIVER,
//   API_VIEW_FILE,
//   APP_BASE
} from '@EnvironmentFile/constants/urlConfig';
import dayjs from "dayjs";
import {
  JobMainContent,
  VehicleSectionTitle as JobSectionTitle,
  StyledBoxContainerContent,
  SectionHeaderContainer,
  BlueActionButton,
  // ImageGalleryContainer,
  // GalleryImageItem,
  // ImageCloseButton,
  // ImagePlaceholderText,
  HiddenInput,
  // StyledGalleryImage,
  JobButtonContainer,
  JobUploadPlaceholderBox,
  JobPlaceholderText as JobPlaceholderTextBase,
  StyledMenuIcon,
  StyledListItemIcon,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";

import FileTreeTable from "@components/FileTreeTable";
import FilePreviewDialog from "@components/UploadFile/components/FilePreviewDialog";
import CustomDialog from "@components/CustomDialog/CustomDialog";

import LoadingDialog from "@components/LoadingDialog";
// import { useSelector } from "react-redux";
import axiosInstance from "@utils/axiosInstance";
import { useSelector } from "react-redux";

const AddDrivers = ({
  open,
  onClose,
  onSuccess,
  sharedComponents,
  title = "Thêm mới tài xế",
}) => {
  const {
    CustomSwipper,
    InputComponents,
    DatePicker,
    AsyncAutoCompleted,
  } = sharedComponents;

  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const { crmSource } = useSelector((state) => state.config);

  // License class options (Loại bằng)
  const licenseClassOptions = crmSource.find((item) => item.code === "HB")?.data || [];

  // File management for images
  const [driverImages, setDriverImages] = React.useState([]);
  const fileInputRef = React.useRef(null);

  // File menu and preview state
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [previewFileName, setPreviewFileName] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const schema = yup.object().shape({
    fullName: yup.mixed().required("Vui lòng chọn tài xế"),
    phoneNumber: yup.string().required("Vui lòng nhập số điện thoại").transform((value) => value.replace(/\s/g, '')).matches(/^(0|84)[0-9]{8,10}$/, "Số điện thoại không đúng định dạng (Bắt đầu bằng 0 hoặc 84, từ 9-11 số)"),
    idCard: yup.string().required("Vui lòng nhập số CMND/CCCD").max(12, "Số CMND/CCCD không được vượt quá 12 ký tự"),
    email: yup.string().email("Email không hợp lệ").nullable(),
    address: yup.string().max(500, "Địa chỉ không được vượt quá 500 ký tự"),
    licenseNumber: yup.string().required("Vui lòng nhập số bằng lái").max(50, "Số bằng lái không được vượt quá 50 ký tự"),
    licenseClass: yup.string().required("Vui lòng chọn Loại bằng"),
    licenseIssuedDate: yup.date()
      .required("Vui lòng chọn ngày cấp bằng")
      .typeError("Ngày cấp bằng không hợp lệ"),
    note: yup.string().max(1000, "Ghi chú không được vượt quá 1000 ký tự"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      idCard: "",
      email: "",
      address: "",
      licenseNumber: "",
      licenseClass: "",
      licenseIssuedDate: null,
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: "",
        phoneNumber: "",
        idCard: "",
        email: "",
        address: "",
        licenseNumber: "",
        licenseClass: "",
        licenseIssuedDate: null,
        note: "",
      });
      setDriverImages([]);
    }
  }, [open, reset]);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        idCard: data.idCard,
        email: data.email || null,
        address: data.address || null,
        licenseNumber: data.licenseNumber,
        licenseClass: data.licenseClass,
        licenseIssuedDate: data.licenseIssuedDate ? dayjs(data.licenseIssuedDate).format("YYYY-MM-DD") : null,
        note: data.note || null,
      };

      const response = await axiosInstance.post(API_LIST_DRIVERS, payload);
      const newDriverId = response?.id || response?.data?.id;

      if (newDriverId && driverImages.length > 0) {
        for (const img of driverImages) {
          if (img.file) {
            const formData = new FormData();
            formData.append("file", img.file);
            formData.append("object_type", "listDrivers");
            formData.append("object_id", newDriverId);
            await axiosInstance.post(API_FILES_UPLOAD, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
        }
      }

      toast("Thêm mới tài xế thành công!", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast(error?.response?.data?.message || error?.message || "Có lỗi xảy ra!", "error");
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onClose, toast, driverImages]);

  const handleSave = useMemo(() => handleSubmit(onSubmit), [handleSubmit, onSubmit]);


  const handleImageUpload = useCallback((event) => {
     const files = Array.from(event.target.files);
     const ALLOWED_EXTENSIONS = ["pdf", "doc", "xls", "xlsx", "jpg", "jpeg", "png"];
     const MAX_SIZE_MB = 10;
     const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

     const validFiles = [];
     for (const file of files) {
       const extension = file.name.split(".").pop().toLowerCase();
       if (!ALLOWED_EXTENSIONS.includes(extension)) {
         toast(`Định dạng tệp ${file.name} không được hỗ trợ. Chỉ chấp nhận pdf, doc, xls, xlsx, jpg, jpeg, png.`, "error");
         continue;
       }
       if (file.size > MAX_SIZE_BYTES) {
         toast(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB.`, "error");
         continue;
       }
       validFiles.push(file);
     }

     if (validFiles.length > 0) {
       const newImages = validFiles.map((file, index) => ({
           id: (Date.now() + index).toString(),
           file: file, // Store actual file object
           name: file.name,
           url: URL.createObjectURL(file)
       }));
       setDriverImages(prev => [...prev, ...newImages]);
     }
     event.target.value = null;
  }, [toast]);

  const handleFileMenuClick = useCallback((event) => {
    const fileId = event.currentTarget.getAttribute('data-file-id');
    setSelectedFileId(fileId);
    setFileMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseFileMenu = useCallback(() => {
    setFileMenuAnchor(null);
  }, []);

  const handleViewFile = useCallback(() => {
    const fileObj = driverImages.find(img => img.id === selectedFileId);
    if (fileObj) {
      setPreviewUrl(fileObj.url);
      setPreviewFileName(fileObj.name);
      setPreviewOpen(true);
    }
    handleCloseFileMenu();
  }, [driverImages, selectedFileId, handleCloseFileMenu]);

  const handleOpenDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
    handleCloseFileMenu();
  }, [handleCloseFileMenu]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handleDeleteFile = useCallback(() => {
    setDriverImages((prev) => {
      const filtered = prev.filter((img) => img.id !== selectedFileId);
      const deleted = prev.find((img) => img.id === selectedFileId);
      if (deleted && deleted.url) {
        URL.revokeObjectURL(deleted.url);
      }
      return filtered;
    });
    setIsDeleteDialogOpen(false);
  }, [selectedFileId]);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewFileName("");
  }, []);

  const fileTreeData = React.useMemo(() => {
    return driverImages.map((file) => ({
      id: file.id,
      name: file.name,
      file: file.file,
      isFolder: false
    }));
  }, [driverImages]);

  //   const handleImageUpload = useCallback((event) => {
  //    const files = Array.from(event.target.files);
  //    const newImages = files.map((file, index) => ({
  //        id: Date.now() + index,
  //        file: file,
  //        name: file.name,
  //        url: URL.createObjectURL(file)
  //    }));
  //    setDriverImages(prev => [...prev, ...newImages]);
  // }, []);
  useEffect(() => {
    return () => {
      driverImages.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url);
      });
    };
  }, []);

  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <CustomSwipper
      title={title}
      open={open}
      onClose={onClose}
      onSave={handleSave}
      type="add"
      hideBackdrop
      isLoading={isLoading}
      moreActions={
        <BlueActionButton
          onClick={handleSave}
          disabled={isLoading}
          variant="contained"
        >
          Lưu
        </BlueActionButton>
      }
    >
      <JobMainContent>
        {/* SECTION 1: THÔNG TIN TÀI XẾ */}
        <StyledBoxContainerContent>
          <SectionHeaderContainer>
            <JobSectionTitle variant="h6">
              THÔNG TIN TÀI XẾ
            </JobSectionTitle>
          </SectionHeaderContainer>

          <Grid container spacing={2}>
            {/* ROW 1: fullName, phoneNumber, idCard */}
            <Grid item xs={12} md={4}>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <AsyncAutoCompleted
                    label="Họ tên"
                    placeholder="Chọn tên tài xế"
                    {...field}
                    url={API_GET_LIST_DRIVER_ABOURT_GROUP_DRIVER}
                    dataPath="data"
                    queryParam="name"
                    optionLabel="name"
                    optionValue="id"
                    required
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                    selectedOptions={(selected) => {
                      if (selected) {
                        setValue("phoneNumber", selected.phoneNumberUser || "");
                        setValue("email", selected.emailUser || "");
                        setValue("address", selected.addressUser || "");
                        setValue("idCard", selected.identificationCard || "");
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Số điện thoại"
                    placeholder="0xxxxxxxxx"
                    required
                    {...field}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="idCard"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="CMND/CCCD"
                    placeholder="xxxxxxxxxxxx"
                    required
                    {...field}
                    error={!!errors.idCard}
                    helperText={errors.idCard?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 2: email, address */}
            <Grid item xs={12} md={4}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Email"
                    placeholder="taixe123@gmail.com"
                    {...field}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Địa chỉ"
                    placeholder="ABC, abc, acb"
                    {...field}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 3: licenseNumber, licenseClass, licenseIssuedDate */}
            <Grid item xs={12} md={4}>
              <Controller
                name="licenseNumber"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Số bằng lái"
                    placeholder="xxxxxxxx"
                    required
                    {...field}
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="licenseClass"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Loại bằng"
                    placeholder="Hạng B2"
                    required
                    options={licenseClassOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                    error={!!errors.licenseClass}
                    helperText={errors.licenseClass?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="licenseIssuedDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Ngày cấp bằng"
                    placeholder="dd/mm/yyyy"
                    required
                    {...field}
                    maxDate={dayjs()}
                    error={!!errors.licenseIssuedDate}
                    helperText={errors.licenseIssuedDate?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 4: note */}
            <Grid item xs={12}>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Ghi chú"
                    placeholder="Nhập ghi chú"
                    multiline
                    rows={4}
                    {...field}
                    error={!!errors.note}
                    helperText={errors.note?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </StyledBoxContainerContent>

        {/* SECTION 2: HÌNH ẢNH BẰNG LÁI */}
        <StyledBoxContainerContent styledMarginTop>
           <JobSectionTitle variant="h6">
               HÌNH ẢNH BẰNG LÁI
           </JobSectionTitle>
           <HiddenInput 
              type="file" 
              multiple 
              ref={fileInputRef}
              onChange={handleImageUpload}
           />

            {/* <BlueActionButton
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadClick}
           >
              Tải Lên
           </BlueActionButton>

           <ImageGalleryContainer>
                {driverImages.map((img) => (
                    <GalleryImageItem key={img.id}>
                        {img.url ? (
                            <StyledGalleryImage src={img.url} alt={img.name} />
                        ) : (
                            <ImagePlaceholderText>{img.name}</ImagePlaceholderText>
                        )}
                        <ImageCloseButton 
                           data-id={img.id}
                           onClick={handleDeleteImage}
                        >
                            <ClearIcon />
                        </ImageCloseButton>
                    </GalleryImageItem>
                ))}
           </ImageGalleryContainer> */}
           <JobButtonContainer>
              <BlueActionButton
                 variant="contained"
                 startIcon={<CloudUploadIcon />}
                 onClick={handleUploadClick}
              >
                 Tải Lên
              </BlueActionButton>
           </JobButtonContainer>

           {driverImages.length > 0 ? (
                <>
                    <FileTreeTable
                        data={fileTreeData}
                        onFileMenuClick={handleFileMenuClick}
                        MenuIcon={StyledMenuIcon}
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
                </>
           ) : (
                <JobUploadPlaceholderBox>
                    <JobPlaceholderTextBase variant="body2">Chưa có tài liệu nào được tải lên.</JobPlaceholderTextBase>
                </JobUploadPlaceholderBox>
           )}
        </StyledBoxContainerContent>
      </JobMainContent>

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

      <LoadingDialog open={isLoading}>
        Đang xử lý, vui lòng đợi...
      </LoadingDialog>
    </CustomSwipper>
  );
};

export default withSharedComponents(AddDrivers);