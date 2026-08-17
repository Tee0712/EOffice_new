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
  API_VIEW_FILE,
  APP_BASE,
  API_FILE_INFO,
  API_LIST_DRIVERS
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
  StatusContainer,
  StatusLabel,
  StatusTag,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";

import FileTreeTable from "@components/FileTreeTable";
import FilePreviewDialog from "@components/UploadFile/components/FilePreviewDialog";
import CustomDialog from "@components/CustomDialog/CustomDialog";

import LoadingDialog from "@components/LoadingDialog";
import { useSelector } from "react-redux";
import axiosInstance from "@utils/axiosInstance";

const UpdateCar = ({
  open,
  onClose,
  onSuccess,
  sharedComponents,
  title = "Chỉnh sửa thông tin xe",
  id
}) => {
  const {
    CustomSwipper,
    InputComponents,
    AsyncAutoCompleted,
  } = sharedComponents;

  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [initialManagerId, setInitialManagerId] = React.useState(null);
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
  const [documentDetail, setDocumentDetail] = React.useState(null);

  const schema = yup.object().shape({
    licensePlate: yup.string().required("Vui lòng nhập biển số xe"),
    carType: yup.string().required("Vui lòng chọn loại xe"),
    carBrand: yup.string().required("Vui lòng nhập hãng xe").max(255, "Hãng xe không được vượt quá 255 ký tự"),
    seats: yup.string(),
    manager: yup.mixed().required("Vui lòng chọn người quản lý"),
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
    const fetchCarDetails = async () => {
      if (open && id) {
        setIsLoading(true);
        try {
          const response = await axiosInstance.get(`${API_LIST_CARS}/${id}`);
          // Adjust based on actual API response structure
          const carData = response?.data || response;
          if (carData) {
            setInitialManagerId(carData.manager?.id || null);
                        setDocumentDetail(response);

            reset({
              licensePlate: carData.licensePlate || "",
              carType: carData.carType || "",
              carBrand: carData.brand || "",
              seats: carData.seatCount ? String(carData.seatCount) : "",
              manager: carData.manager || "",
              status: carData.maintenance || "",
              note: carData.note || "",
            });
            
            // If images are returned from the detail API
            if (carData.images && Array.isArray(carData.images)) {
                setCarImages(carData.images.map(img => ({
                    id: img.id.toString(),
                    name: img.file_name || img.fileName || img.name,
                    url: img.filePath || img.url
                })));
            }
          }
        } catch (error) {
          toast("Không thể tải thông tin xe!", "error");
          logger.error("Error fetching car details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchCarDetails();
  }, [open, id, reset, toast]);

  useEffect(() => {
    const fetchImages = async () => {
      if (open && id) {
        try {
          const response = await axiosInstance.get(`${APP_BASE}/api/files/by-object?object_type=listCars&object_id=${id}`);
          if (response && Array.isArray(response)) {
            setCarImages(response.map(img => ({
              id: img.id.toString(),
              name: img.file_name || img.fileName || img.name,
              url: `${API_VIEW_FILE}/${img.id}`
            })));
          }
        } catch (error) {
          logger.error("Error fetching car images:", error);
        }
      }
    };
    fetchImages();
  }, [open, id]);

  const onSubmit = useCallback(async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        licensePlate: formData.licensePlate,
        carType: formData.carType,
        brand: formData.carBrand,
        seatCount: formData.seats ? Number(formData.seats) : null,
        manager: formData.manager?.id,
        maintenance: formData.status,
        note: formData.note,
      };

      await axiosInstance.patch(`${API_LIST_CARS}/${id}`, payload);

      // Handle image uploads if any new images were added (logic similar to AddNewCar)
      const newImages = carImages.filter(img => img.file);
      if (newImages.length > 0) {
        for (const img of newImages) {
          const fd = new FormData();
          fd.append("file", img.file);
          fd.append("object_type", 'listCars');
          fd.append("object_id", id);
          await axiosInstance.post(API_FILES_UPLOAD, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      toast("Cập nhật thông tin xe thành công!", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast(error?.response?.data?.message || error?.message || "Có lỗi xảy ra!", "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, onSuccess, onClose, toast, carImages]);

  const handleSave = useMemo(() => handleSubmit(onSubmit), [handleSubmit, onSubmit]);

  // const handleDeleteImage = useCallback((event) => {
  //   const imgId = event.currentTarget.getAttribute('data-id');
  //   setCarImages((prev) => {
  //       const filtered = prev.filter((img) => img.id.toString() !== imgId);
  //       const deleted = prev.find((img) => img.id.toString() === imgId);
  //       if (deleted && deleted.url && deleted.file) {
  //         URL.revokeObjectURL(deleted.url);
  //       }
  //       // If it's an existing file on server, maybe call an API to delete?
  //       // For now just removing from UI state
  //       return filtered;
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
           file: file,
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

  const handleDeleteFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const fileToDelete = carImages.find(img => img.id === selectedFileId);
      if (fileToDelete && !fileToDelete.file) {
        await axiosInstance.delete(`${API_FILE_INFO}/${selectedFileId}`);
      }
      
      setCarImages((prev) => {
        const filtered = prev.filter((img) => img.id !== selectedFileId);
        if (fileToDelete && fileToDelete.url && fileToDelete.file) {
          URL.revokeObjectURL(fileToDelete.url);
        }
        return filtered;
      });
      toast("Xóa tệp thành công!", "success");
    } catch (error) {
      toast(error?.response?.data?.message || "Không thể xóa tệp!", "error");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedFileId, carImages, toast]);

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

  // Cleanup for object URLs
  useEffect(() => {
    return () => {
      carImages.forEach(img => {
        if (img.url && img.file) URL.revokeObjectURL(img.url);
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
              <StatusContainer>
                                <StatusLabel>Trạng thái hồ sơ:</StatusLabel>
                                 {documentDetail?.statusCar ? (
                           <div dangerouslySetInnerHTML={{ __html: documentDetail.statusCar }} />
                         ) : (
                                <StatusTag>Sẵn sàng</StatusTag>
                            )}
                            </StatusContainer>
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
                                                     url={`${API_LIST_DRIVERS}?unassignedManager=true${initialManagerId ? `&currentManagerId=${initialManagerId}` : ''}`}
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

export default withSharedComponents(UpdateCar);