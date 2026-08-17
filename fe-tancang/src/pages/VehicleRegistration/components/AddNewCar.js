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
  API_LIST_CARS,
  API_FILES_UPLOAD,
  API_LIST_DRIVERS,
  // API_XLSX_TO_PDF,
} from '@EnvironmentFile/constants/urlConfig';
import {
  JobMainContent,
  VehicleSectionTitle as JobSectionTitle,
  StyledBoxContainerContent,
  SectionHeaderContainer,
  BlueActionButton,
  // ImageGalleryContainer,
  // GalleryImageItem,
  // ImageCloseButton,
  // StyledGalleryImage,
  JobButtonContainer,
  JobUploadPlaceholderBox,
  JobPlaceholderText as JobPlaceholderTextBase,
  StyledMenuIcon,
  StyledListItemIcon,
  HiddenInput,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";

import FileTreeTable from "@components/FileTreeTable";
import FilePreviewDialog from "@components/UploadFile/components/FilePreviewDialog";
import CustomDialog from "@components/CustomDialog/CustomDialog";

import LoadingDialog from "@components/LoadingDialog";
import { useSelector } from "react-redux";
import axiosInstance from "@utils/axiosInstance";

const AddNewCar = ({
  open,
  onClose,
  onSuccess,
  sharedComponents,
  title = "Thêm mới xe",
}) => {
  const {
    CustomSwipper,
    InputComponents,
    AsyncAutoCompleted,
  } = sharedComponents;

  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const { crmSource } = useSelector((state) => state.config);
    const carTypeOptions =
    crmSource.find((item) => item.code === "LOAI_XE")?.data || [];
      const statusOptions =
    crmSource.find((item) => item.code === "BDX")?.data || [];
  // File management for images
  const [carImages, setCarImages] = React.useState([]);
  const fileInputRef = React.useRef(null);

  // File menu and preview state
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [previewFileName, setPreviewFileName] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const schema = yup.object().shape({
    licensePlate: yup.string().required("Vui lòng nhập biển số xe"),
    carType: yup.string().required("Vui lòng chọn loại xe"),
    carBrand: yup.string().required("Vui lòng nhập hãng xe").max(255, "Hãng xe không được vượt quá 255 ký tự"),
    seats: yup.string(),
    manager: yup.string().required("Vui lòng chọn người quản lý"),
    status: yup.string().required("Vui lòng chọn trạng thái bảo dưỡng"),
    note: yup.string().max(1000, "Ghi chú không được vượt quá 1000 ký tự"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      licensePlate: "",
      carType: "",
      carBrand: "",
      seats: "",
      manager: "",
      status: "",
      note: "",
    },
  });

  const selectedCarType = watch("carType");

  useEffect(() => {
    if (!selectedCarType) return;
    const found = carTypeOptions.find((opt) => opt.value === selectedCarType);
    if (found) {
      // Ưu tiên field seatCount/seats nếu có trong data
      const seatsFromData = found.seatCount ?? found.seats ?? found.seat_count;
      if (seatsFromData != null) {
        setValue("seats", String(seatsFromData));
      } else {
        // Fallback: parse số từ tên loại xe (vd: "7 chỗ" → "7")
        const match = (found.title || found.label || found.name || "").match(/(\d+)/);
        if (match) {
          setValue("seats", match[1]);
        }
      }
    }
  }, [selectedCarType, carTypeOptions, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        licensePlate: "",
        carType: "",
        carBrand: "",
        seats: "",
        manager: "",
        status: statusOptions[0]?.value || "",
        note: "",
      });
    }
  }, [open, reset]);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        licensePlate: data.licensePlate,
        carType: data.carType,
        brand: data.carBrand,
        seatCount: data.seats ? Number(data.seats) : null,
        manager: data.manager,
        maintenance: data.status,
        note: data.note,
      };

      const response = await axiosInstance.post(API_LIST_CARS, payload);
      const newCarId = response?.id || response?.data?.id;

      if (newCarId && carImages.length > 0) {
        for (const img of carImages) {
          if (img.file) {
            const formData = new FormData();
            formData.append("file", img.file);
            formData.append("object_type", 'listCars');
            formData.append("object_id", newCarId);
            await axiosInstance.post(API_FILES_UPLOAD, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
        }
      }

      toast("Thêm mới xe thành công!", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast(error?.response?.data?.message || error?.message || "Có lỗi xảy ra!", "error");
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onClose, toast, carImages]);

  const handleSave = useMemo(() => handleSubmit(onSubmit), [handleSubmit, onSubmit]);

  // const handleDeleteImage = useCallback((event) => {
  //   const id = event.currentTarget.getAttribute('data-id');
  //   setCarImages((prev) => {
  //     const filtered = prev.filter((img) => img.id.toString() !== id);
  //     const deleted = prev.find((img) => img.id.toString() === id);
  //     if (deleted && deleted.url) {
  //       URL.revokeObjectURL(deleted.url);
  //     }
  //     return filtered;
  //   });
  // }, []);

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
       setCarImages(prev => [...prev, ...newImages]);
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
    const fileObj = carImages.find(img => img.id === selectedFileId);
    if (fileObj) {
      setPreviewUrl(fileObj.url);
      setPreviewFileName(fileObj.name);
      setPreviewOpen(true);
    }
    handleCloseFileMenu();
  }, [carImages, selectedFileId, handleCloseFileMenu]);

  const handleOpenDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
    handleCloseFileMenu();
  }, [handleCloseFileMenu]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handleDeleteFile = useCallback(() => {
    setCarImages((prev) => {
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
    return carImages.map((file) => ({
      id: file.id,
      name: file.name,
      file: file.file,
      isFolder: false
    }));
  }, [carImages]);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      carImages.forEach(img => {
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
        {/* SECTION 1: THÔNG TIN XE */}
        <StyledBoxContainerContent>
          <SectionHeaderContainer>
            <JobSectionTitle variant="h6">
              THÔNG TIN XE
            </JobSectionTitle>
          </SectionHeaderContainer>

          <Grid container spacing={2}>
            {/* ROW 1 */}
            <Grid item xs={12} md={6}>
              <Controller
                name="licensePlate"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Biển số xe"
                    placeholder="Nhập biển số xe"
                    required
                    {...field}
                    error={!!errors.licensePlate}
                    helperText={errors.licensePlate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="carType"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Loại xe"
                    placeholder="Chọn loại xe"
                    required
                    options={carTypeOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                    error={!!errors.carType}
                    helperText={errors.carType?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 2 */}
            <Grid item xs={12} md={6}>
              <Controller
                name="carBrand"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Hãng xe"
                    placeholder="Nhập hãng xe"
                    required
                    inputProps={{ maxLength: 255 }}
                    {...field}
                    error={!!errors.carBrand}
                    helperText={errors.carBrand?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="seats"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Số chỗ ngồi"
                    placeholder="-"
                    disabled
                    {...field}
                  />
                )}
              />
            </Grid>

            {/* ROW 3 */}
            <Grid item xs={12} md={6}>
              <Controller
                name="manager"
                control={control}
                render={({ field }) => (
            
                         <AsyncAutoCompleted
                                      label="Người quản lý"
                                      placeholder="Chọn người quản lý"
                                      {...field}
                                      url={`${API_LIST_DRIVERS}?unassignedManager=true`}
                                      dataPath="items"
                                      queryParam="fullName"
                                      optionLabel="fullName"
                                      optionValue="driverId"
                                      required
                                      error={!!errors.manager}
                                      helperText={errors.manager?.message}
                                    />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    select
                    label="Bảo dưỡng"
                    required
                    options={statusOptions}
                    customLabel="title"
                    customValue="value"
                    {...field}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  />
                )}
              />
            </Grid>

            {/* ROW 4 */}
            <Grid item xs={12}>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <InputComponents
                    label="Ghi chú"
                    placeholder="Nhập ghi chú"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 1000 }}
                    {...field}
                    error={!!errors.note}
                    helperText={errors.note?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </StyledBoxContainerContent>

        <StyledBoxContainerContent styledMarginTop>
           <JobSectionTitle variant="h6">
               HÌNH ẢNH XE
           </JobSectionTitle>
           <HiddenInput 
              type="file" 
              multiple 
              ref={fileInputRef}
              onChange={handleImageUpload}
           />
           <JobButtonContainer>
              <BlueActionButton
                 variant="contained"
                 startIcon={<CloudUploadIcon />}
                 onClick={handleUploadClick}
              >
                 Tải Lên
              </BlueActionButton>
           </JobButtonContainer>

           {carImages.length > 0 ? (
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

export default withSharedComponents(AddNewCar);