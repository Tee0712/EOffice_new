import React, { useEffect, } from "react";
import {
  SkyGrid as Grid,
  SkyIconButton,
} from "@styles/SkyStyles";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import withSharedComponents from "@components/WrapperComponent";
// import { useToast } from "@components/common/ToastProvider";
// import ClearIcon from "@mui/icons-material/Clear";
// import { Visibility } from "@mui/icons-material";
import {
  SkyMenu as Menu,
  SkyMenuItem as MenuItem,
  SkyListItemText as ListItemText,
  SkyBox,
  // SkyIconButton, SkyTypography
} from "@styles/SkyStyles";
import { 
  Popover, 
  // Button as MuiButton,
  // FormControl,
  // InputLabel,
  // Select,
} from "@mui/material";

import {
  API_LIST_DRIVERS,
  API_VIEW_FILE,
  APP_BASE,
  API_DRIVER_HEALTH_CHECK,
  API_FILES_UPLOAD,
  API_GET_LIST_DRIVER_ABOURT_GROUP_DRIVER,
  API_VEHICLE_REQUEST,
} from '@EnvironmentFile/constants/urlConfig';
import dayjs from "dayjs";
import {
  JobMainContent,
  VehicleSectionTitle as JobSectionTitle,
  StyledBoxContainerContent,
  SectionHeaderContainer,
  // BlueActionButton,
  // ImageGalleryContainer,
  // GalleryImageItem,
  // // ImageCloseButton,
  // ImagePlaceholderText,
  // StyledGalleryImage,
  TimelineContainer,
  TimelineItem,
  TimelineDotBox,
  TimelineContent,
  TimelineAction,
  TimelineTime,
  TimelineDivider,
  HistoryDot,
  TimelineLine,
  JobUploadPlaceholderBox,
  JobPlaceholderText as JobPlaceholderTextBase,
  StyledMenuIcon,
  StyledListItemIcon,
  // BlueActionButton,
  BlueFilterIcon,
  PopoverContent,
  DateRangeLabel,
  DateRangeInputGroup,
  TimelineCreatorText,
  StatusContainer,
  StatusLabel,
  StatusTag,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";

import FileTreeTable from "@components/FileTreeTable";
import FilePreviewDialog from "@components/UploadFile/components/FilePreviewDialog";

import LoadingDialog from "@components/LoadingDialog";
// import { useSelector } from "react-redux";
import axiosInstance from "@utils/axiosInstance";
import { useToast } from "@components/common/ToastProvider";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HistoryIcon from "@mui/icons-material/History";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FavoriteIcon from "@mui/icons-material/Favorite";
// import FilterListIcon from "@mui/icons-material/FilterList";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
// import AddIcon from "@mui/icons-material/Add";
import {
  SidebarTabContainer,
  SidebarTabItem,
  HistorySummaryBox,
  HistorySummaryItem,
  SummaryLabel,
  SummaryValue,
  TripListContainer,
  TripItemBox,
  TripTitle,
  TripDetail,
  TripStatus,
  ViewAllLink,
  StyledFilterIcon,
  ExperienceContainer,
  ExperienceContentBox,
  ExperienceCarTitle,
  ExperienceDetailText,
  HealthRecordBox,
  HealthHeaderRow,
  HealthDateText,
  HealthStatusBadge,
  HealthDetailRow,
  HealthFileLink,
  FilterLabel,
  // StyledFilterListIcon,
  CenteredJobPlaceholderText,
  SmallVisibilityIcon,
  StyledAddIcon,
  BlueHeaderPopoverContainer,
  BlueHeaderPopoverTitle,
  PopoverHeaderText,
  QuickDateRow,
  QuickDateItem,
  DateInputsRow,
  FilterActionsSpaced,
  DarkEventIcon,
  QuickDateText,
  NotificationBadge,
  FilterOutlinedButton,
  FilterApplyButton,
  FlexGapBox,
} from "@pages/VehicleRegistration/componentStyle/VehicleRequest.styles";
import { useSelector } from "react-redux";
// import FilterListIcon from "@mui/icons-material/FilterList";
import HealthCheckScheduleDialog from "./HealthCheckScheduleDialog";
// import EventIcon from '@mui/icons-material/Event';
import api from "@services/api";
import {
  API_LIST_CARS,
} from '@EnvironmentFile/constants/urlConfig';
import ViewRequest from "./ViewRequest";

const HistoryTimeline = ({ history = [], onItemClick }) => {
  const makeHandleClick = (id) => () => {
    if (onItemClick) {
      onItemClick(id);
    }
  };

  return (
    <TimelineContainer>
      {history.map((item, index) => (
        <TimelineItem key={index} onClick={makeHandleClick(item.id)}>
          {/* Vertical Line */}
          {index !== history.length - 1 && <TimelineLine />}
          {/* Dot */}
          <TimelineDotBox>
            <HistoryDot />
          </TimelineDotBox>
          {/* Content */}
          <TimelineContent>
            <TimelineAction variant="body2">
              {item.action}
            </TimelineAction>
            <TimelineTime variant="caption">
               {item.time}
            </TimelineTime>
            {item.user && (
              <TimelineCreatorText variant="caption">
                Người tạo: {item.user}
              </TimelineCreatorText>
            )}
            {index !== history.length - 1 && <TimelineDivider />}
          </TimelineContent>
        </TimelineItem>
      ))}
    </TimelineContainer>
  );
};

const ViewDrivers = ({
  open,
  onClose,
  id,
  sharedComponents,
  title = "Chi tiết tài xế",
}) => {
  const {
    CustomSwipper,
    InputComponents,
    DatePicker,
    AsyncAutoCompleted,
  } = sharedComponents;

  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("schedule"); // 'schedule', 'history', 'experience', 'health'
  const { crmSource } = useSelector((state) => state.config);
  const [driverDetail, setDriverDetail] = React.useState(null);
  const handleSwitchToSchedule = React.useCallback(() => {
    setActiveTab("schedule");
  }, []);

  const handleSwitchToHistory = React.useCallback(() => {
    setActiveTab("history");
  }, []);

  const handleSwitchToExperience = React.useCallback(() => {
    setActiveTab("experience");
  }, []);

  const [healthRecords, setHealthRecords] = React.useState([]);

  const fetchHealthRecords = React.useCallback(async () => {
    if (id) {
      try {
        const response = await axiosInstance.get(`${API_DRIVER_HEALTH_CHECK}`, {
          params: { driverId: id }
        });
        const data = response?.items || response?.data?.items || (Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []));
        setHealthRecords(data);
      } catch (error) {
        logger.error("Error fetching health records:", error);
      }
    }
  }, [id]);

  const handleSwitchToHealth = React.useCallback(() => {
    setActiveTab("health");
    fetchHealthRecords();
  }, [fetchHealthRecords]);

  // License class options (Loại bằng)
  const licenseClassOptions = crmSource.find((item) => item.code === "HB")?.data || [];

  // File management for images
  const [driverImages, setDriverImages] = React.useState([]);

  // File menu and preview state
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState(null);
  const [selectedFileId, setSelectedFileId] = React.useState(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [previewFileName, setPreviewFileName] = React.useState("");
  const [selectedRequestId, setSelectedRequestId] = React.useState(null);
  const [openViewRequest, setOpenViewRequest] = React.useState(false);

  const [healthDialogOpen, setHealthDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState([]);
  const [historyTrips, setHistoryTrips] = React.useState([]);
  const [experienceData, setExperienceData] = React.useState([]);
  const [experienceSummary, setExperienceSummary] = React.useState({ total: "", managedCars: "" });
  const [historySummary, setHistorySummary] = React.useState({ total: 0, month: 0 });
  const handleOpenHealthDialog = React.useCallback(() => {
    setHealthDialogOpen(true);
  }, []);

  const handleCloseHealthDialog = React.useCallback(() => {
    setHealthDialogOpen(false);
  }, []);

  const handleSaveHealth = React.useCallback(async (data) => {
    setIsLoading(true);
    try {
      const uploadedAttachments = [];

      // Step 1: Upload files first
      if (data.files && data.files.length > 0) {
        for (const fileObj of data.files) {
          if (fileObj.file) {
            const formData = new FormData();
            formData.append("file", fileObj.file);
            // If the API requires object_type even for floating uploads, use it. 
            // Often "draft" or similar is used if object_id is pending.
            // Based on user request, we collect response info.
            formData.append("object_type", "driverHealthCheck"); 
            
            const uploadRes = await axiosInstance.post(API_FILES_UPLOAD, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            const uploadData = uploadRes?.data || uploadRes;
            if (uploadData && uploadData.id) {
              uploadedAttachments.push({
                id: uploadData.id,
                "file_name": uploadData.file_name || uploadData.fileName || fileObj.name,
              });
            }
          }
        }
      }

      // Step 2: Call Health Check API with attachments
      const payload = {
        driverId: id,
        checkupDate: data.examDate ? dayjs(data.examDate).format("YYYY-MM-DD") : null,
        attachments: uploadedAttachments,
      };

      await axiosInstance.post(API_DRIVER_HEALTH_CHECK, payload);

      toast("Đã lưu lịch khám sức khỏe thành công!", "success");
      setHealthDialogOpen(false);
      fetchHealthRecords();
    } catch (error) {
       toast(error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi lưu lịch khám sức khỏe!", "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  const handleHealthFilePreview = React.useCallback((file) => () => {
    setPreviewUrl(`${API_VIEW_FILE}/${file.id}`);
    setPreviewFileName(file.file_name);
    setPreviewOpen(true);
  }, []);

  const schema = yup.object().shape({
    fullName: yup.string(),
    phoneNumber: yup.string(),
    idCard: yup.string(),
    email: yup.string(),
    address: yup.string(),
    licenseNumber: yup.string(),
    licenseClass: yup.string(),
    licenseIssuedDate: yup.date().nullable(),
    note: yup.string(),
  });

  const [filterAnchorEl, setFilterAnchorEl] = React.useState(null);
  const [filterValues, setFilterValues] = React.useState({
    carId: "all",
    fromDate: null,
    toDate: null,
  });
  const [appliedFilters, setAppliedFilters] = React.useState({
    carId: "all",
    fromDate: null,
    toDate: null,
  });

  const handleFilterClick = React.useCallback((event) => {
    setFilterAnchorEl(event.currentTarget);
  }, []);

  const handleFilterClose = React.useCallback(() => {
    setFilterAnchorEl(null);
  }, []);

  const handleOpenRequestDetail = React.useCallback((requestId) => {
    if (requestId) {
        setSelectedRequestId(requestId);
        setOpenViewRequest(true);
    }
  }, []);

  const makeHandleOpenRequestDetail = (requestId) => () => {
    handleOpenRequestDetail(requestId);
  };

  const handleCloseRequestDetail = React.useCallback(() => {
    setOpenViewRequest(false);
    setSelectedRequestId(null);
  }, []);

  const handleFilterInputChange = React.useCallback((field) => (event) => {
    const value = event?.target ? event.target.value : (event || 'all');
    setFilterValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilter = React.useCallback(() => {
    setAppliedFilters(filterValues);
    handleFilterClose();
  }, [filterValues, handleFilterClose]);

  const handleResetFilter = React.useCallback(() => {
    const defaultFilters = {
      carId: "all",
      fromDate: null,
      toDate: null,
    };
    setFilterValues(defaultFilters);
    setAppliedFilters(defaultFilters);
    handleFilterClose();
  }, [handleFilterClose]);

  const handleQuickDate = React.useCallback((type) => () => {
    const today = dayjs();
    let fromDate, toDate;
    
    if (type === 'today') {
      fromDate = today;
      toDate = today;
    } else if (type === 'week') {
      fromDate = today.startOf('week');
      toDate = today.endOf('week');
    } else if (type === 'month') {
      fromDate = today.startOf('month');
      toDate = today.endOf('month');
    }
    
    setFilterValues(prev => ({
      ...prev,
      fromDate: fromDate.toDate(),
      toDate: toDate.toDate()
    }));
  }, []);

  const {
    control,
    reset,
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
    const fetchDriverDetails = async () => {
      if (open && id) {
        setIsLoading(true);
        try {
          const response = await axiosInstance.get(`${API_LIST_DRIVERS}/${id}`);
          const driverData = response?.data || response;
          if (driverData) {
            setDriverDetail(driverData);
            reset({
              fullName: driverData.fullName || "",
              phoneNumber: driverData.phoneNumber || "",
              idCard: driverData.idCard || "",
              email: driverData.email || "",
              address: driverData.address || "",
              licenseNumber: driverData.licenseNumber || "",
              licenseClass: driverData.licenseClass || "",
              licenseIssuedDate: driverData.licenseIssuedDate ? dayjs(driverData.licenseIssuedDate).toDate() : null,
              note: driverData.note || "",
            });
          }
        } catch (error) {
          toast("Không thể tải thông tin tài xế!", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchImages = async () => {
        if (open && id) {
          try {
            const response = await axiosInstance.get(`${APP_BASE}/api/files/by-object?object_type=listDrivers&object_id=${id}`);
            if (response && Array.isArray(response)) {
              setDriverImages(response.map(img => ({
                id: img.id.toString(),
                name: img.file_name || img.fileName || img.name,
                url: `${API_VIEW_FILE}/${img.id}`
              })));
            }
          } catch (error) {
            logger.error("Error fetching driver images:", error);
          }
        }
    };
     const fetchHistory = async () => {
      if (id) {
        try {
          const res = await api.get(`${API_VEHICLE_REQUEST}/${id}/history-driver?type=pending`);
          const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
          if (items) {
            setHistoryData(items.map(item => ({
              action: `${item.departurePoint || '-'} ➔ ${item.destination || '-'}`,
              opinion: item.opinion || item.notes || "",
              processor: item.processor,
              time: `${item.departureTime || ''} - ${item.returnTime || ''} - ${item.licensePlate || ''}`,
              user: item.createdBy || "",
              department: item.department || "",
              id: item.id || item._id
            })));
          }
        } catch (error) {
          logger.error("Error fetching history:", error);
        }
      }
    };

    const fetchExperience = async () => {
      if (id) {
        try {
          const res = await api.get(`${API_VEHICLE_REQUEST}/${id}/history-driver?type=experience`);
          if (res.data && res.data.success) {
            setExperienceSummary({
              total: res.data.experience || "0 năm",
              managedCars: res.data.managedCars || "-"
            });
            const cars = res.data.cars || [];
            setExperienceData(cars.map(item => ({
              carType: item.car || '-',
              detail: item.summary || `${item.totalTrips || 0} chuyến • Gần nhất: ${item.lastTrip ? dayjs(item.lastTrip).format("DD/MM/YYYY") : '-'}`
            })));
          }
        } catch (error) {
          logger.error("Error fetching experience:", error);
        }
      }
    };

   

    fetchDriverDetails();
    fetchImages();
    fetchHistory();
    fetchExperience();
  }, [open, id, reset, toast]);

  useEffect(() => {
    const fetchHistoryActivities = async () => {
      if (id) {
        try {
          const queryParams = new URLSearchParams();
          if (appliedFilters.fromDate) queryParams.append('filter[departureTime][startDate]', dayjs(appliedFilters.fromDate).format('YYYY-MM-DD'));
          if (appliedFilters.toDate) queryParams.append('filter[returnTime][endDate]', dayjs(appliedFilters.toDate).format('YYYY-MM-DD'));
          if (appliedFilters.carId && appliedFilters.carId !== 'all') queryParams.append('filter[carIds]', appliedFilters.carId);

          const qs = queryParams.toString();
          const res = await api.get(`${API_VEHICLE_REQUEST}/${id}/history-driver?${qs}`);
          if (res.data && res.data.success) {
             const mappedTrips = (res.data.items || []).map(item => ({
               title: `${item.departurePoint || '-'} ➔ ${item.destination || '-'}`,
               time: `${item.departureTime || ''} – ${item.returnTime || ''} | ${item.licensePlate || ''}`,
               user: item.driverName || item.createdBy || '-',
               status: item.vehicleState || item.status || '-',
               statusCode: item.statusCode || item.status || 'UNKNOWN',
               id: item.id || item._id
             }));
             setHistoryTrips(mappedTrips);
             setHistorySummary({
                total: res.data.totalTrips || 523, // Fallback if API hasn't updated total fields
                month: res.data.totalTripsMonth || 78
             });
          }
        } catch (error) {
           logger.error("Error fetching driver history activities:", error);
        }
      }
    };

    fetchHistoryActivities();
  }, [id, appliedFilters]);

  // const scheduleData = [
  //   {
  //     action: "Trụ sở Tân Cảng Sài Gòn ➔ Cảng Cát Lái",
  //     time: "20/12/2025 | 08:10:00 - 10:05:33 | 51A-123.45",
  //     user: "hanhth",
  //     department: "hanhth"
  //   }
  // ];

  const filteredTrips = historyTrips;



  // const healthData = [
  //   {
  //     date: "20/12/2025",
  //     reExam: "20/06/2026",
  //     status: "Còn hạn",
  //     fileName: "giaykhamsuckhoe.pdf"
  //   },
  //   {
  //     date: "15/06/2025",
  //     reExam: "15/12/2025",
  //     status: "Hết hạn",
  //     fileName: "giaykhamsuckhoe.pdf"
  //   },
  //   {
  //     date: "12/12/2024",
  //     reExam: "12/06/2025",
  //     status: "Hết hạn",
  //     fileName: "giaykhamsuckhoe.pdf"
  //   }
  // ];

  const handleFileMenuClick = React.useCallback((event) => {
    const fileId = event.currentTarget.getAttribute('data-file-id');
    setSelectedFileId(fileId);
    setFileMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseFileMenu = React.useCallback(() => {
    setFileMenuAnchor(null);
  }, []);

  const handleViewFile = React.useCallback(() => {
    const fileObj = driverImages.find(img => img.id === selectedFileId);
    if (fileObj) {
      setPreviewUrl(fileObj.url);
      setPreviewFileName(fileObj.name);
      setPreviewOpen(true);
    }
    handleCloseFileMenu();
  }, [driverImages, selectedFileId, handleCloseFileMenu]);

  const handleClosePreview = React.useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewFileName("");
  }, []);

  const fileTreeData = React.useMemo(() => {
    return driverImages.map((file) => ({
      id: file.id,
      name: file.name,
      isFolder: false
    }));
  }, [driverImages]);

  return (
    <CustomSwipper
      title={title}
      open={open}
      onClose={onClose}
      type="view"
      hideBackdrop
      isLoading={isLoading}
    >
      <JobMainContent>
        <Grid container spacing={2}>
          {/* LEFT COLUMN: INFO + IMAGES */}
          <Grid item xs={12} md={8.5}>
            {/* SECTION 1: THÔNG TIN TÀI XẾ */}
            <StyledBoxContainerContent>
              <SectionHeaderContainer>
                <JobSectionTitle variant="h6">
                  THÔNG TIN TÀI XẾ
                </JobSectionTitle>
                <StatusContainer>
                  <StatusLabel>Trạng thái hồ sơ:</StatusLabel>
                  {driverDetail?.statusDriver ? (
                    <div dangerouslySetInnerHTML={{ __html: driverDetail.statusDriver }} />
                  ) : (
                    <StatusTag>Đang hoạt động</StatusTag>
                  )}
                </StatusContainer>
              </SectionHeaderContainer>

              <Grid container spacing={2}>
                {/* ROW 1 */}
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
                   disabled
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
                        {...field}
                        disabled
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
                        {...field}
                        disabled
                      />
                    )}
                  />
                </Grid>

                {/* ROW 2 */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <InputComponents
                        label="Email"
                        {...field}
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
                        {...field}
                        disabled
                      />
                    )}
                  />
                </Grid>

                {/* ROW 3 */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="licenseNumber"
                    control={control}
                    render={({ field }) => (
                      <InputComponents
                        label="Số bằng lái"
                        {...field}
                        disabled
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
                        options={licenseClassOptions}
                        customLabel="title"
                        customValue="value"
                        {...field}
                        disabled
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
                        {...field}
                        disabled
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
                        multiline
                        rows={2}
                        {...field}
                        disabled
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </StyledBoxContainerContent>

            <StyledBoxContainerContent styledMarginTop>
              <JobSectionTitle variant="h6">
                HÌNH ẢNH BẰNG LÁI
              </JobSectionTitle>

              {driverImages.length > 0 ? (
                <>
                    <FileTreeTable
                        data={fileTreeData}
                        onFileMenuClick={handleFileMenuClick}
                        MenuIcon={StyledMenuIcon}
                        // isView={true}
                    />
                    <Menu
                        anchorEl={fileMenuAnchor}
                        open={Boolean(fileMenuAnchor)}
                        onClose={handleCloseFileMenu}
                        id="file-menu"
                    >
                        <MenuItem onClick={handleViewFile}>
                            <StyledListItemIcon>
                                <SmallVisibilityIcon />
                            </StyledListItemIcon>
                            <ListItemText>Xem chi tiết</ListItemText>
                        </MenuItem>
                    </Menu>
                </>
              ) : (
                <JobUploadPlaceholderBox>
                    <JobPlaceholderTextBase variant="body2">Chưa có tài liệu nào được tải lên.</JobPlaceholderTextBase>
                </JobUploadPlaceholderBox>
              )}
            </StyledBoxContainerContent>
          </Grid>

          {/* RIGHT COLUMN: SIDEBAR */}
          <Grid item xs={12} md={3.5}>
            <StyledBoxContainerContent fullHeight styledPadding={2}>
              <SidebarTabContainer>
                <SidebarTabItem
                  active={activeTab === "schedule"}
                  onClick={handleSwitchToSchedule}
                >
                  <CalendarTodayIcon />
                </SidebarTabItem>
                <SidebarTabItem
                  active={activeTab === "history"}
                  onClick={handleSwitchToHistory}
                >
                  <HistoryIcon />
                </SidebarTabItem>
                <SidebarTabItem
                  active={activeTab === "experience"}
                  onClick={handleSwitchToExperience}
                >
                  <DirectionsCarIcon />
                </SidebarTabItem>
                <SidebarTabItem
                  active={activeTab === "health"}
                  onClick={handleSwitchToHealth}
                >
                  <FavoriteIcon />
                  <NotificationBadge />
                </SidebarTabItem>
              </SidebarTabContainer>

              {activeTab === "schedule" && (
                <>
                  <JobSectionTitle variant="h6" mb={2}>
                    LỊCH SẮP TỚI
                  </JobSectionTitle>
                  <HistoryTimeline history={historyData} onItemClick={handleOpenRequestDetail} />
                </>
              )}

              {activeTab === "history" && (
                <>
                  <SectionHeaderContainer>
                    <JobSectionTitle variant="h6" mb={0}>
                      LỊCH SỬ HOẠT ĐỘNG
                    </JobSectionTitle>
                    <StyledFilterIcon onClick={handleFilterClick} />
                  </SectionHeaderContainer>

                  <Popover
                    open={Boolean(filterAnchorEl)}
                    anchorEl={filterAnchorEl}
                    onClose={handleFilterClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ style: { borderRadius: '8px', overflow: 'hidden' } }}
                  >
                      <BlueHeaderPopoverContainer>
                        <BlueHeaderPopoverTitle>
                           <PopoverHeaderText>Bộ lọc</PopoverHeaderText>
                           <BlueFilterIcon />
                        </BlueHeaderPopoverTitle>
                        <PopoverContent>
                           <QuickDateRow>
                              <QuickDateItem onClick={handleQuickDate('today')}>
                                 <DarkEventIcon /> <QuickDateText>Hôm nay</QuickDateText>
                              </QuickDateItem>
                              <QuickDateItem onClick={handleQuickDate('week')}>
                                 <DarkEventIcon /> <QuickDateText>Tuần này</QuickDateText>
                              </QuickDateItem>
                              <QuickDateItem onClick={handleQuickDate('month')}>
                                 <DarkEventIcon /> <QuickDateText>Tháng này</QuickDateText>
                              </QuickDateItem>
                           </QuickDateRow>

                           <DateInputsRow>
                              <DateRangeLabel>Khoảng ngày</DateRangeLabel>
                              <DateRangeInputGroup>
                                  <DatePicker 
                                     value={filterValues.fromDate}
                                     onChange={handleFilterInputChange('fromDate')}
                                     placeholder="dd/mm/yyyy"
                                  />
                                  <DatePicker 
                                     value={filterValues.toDate}
                                     onChange={handleFilterInputChange('toDate')}
                                     placeholder="dd/mm/yyyy"
                                  />
                              </DateRangeInputGroup>
                           </DateInputsRow>

                           <SkyBox mb={2}>
                              <FilterLabel>Xe đã điều khiển</FilterLabel>
                              <AsyncAutoCompleted
                                  placeholder="Tất cả"
                                  value={filterValues.carId === 'all' ? null : filterValues.carId}
                                  onChange={handleFilterInputChange('carId')}
                                  url={`${API_LIST_CARS}`}
                                  dataPath="items"
                                  queryParam="licensePlate"
                                  optionLabel="licensePlate"
                                  optionValue="id"
                               />
                           </SkyBox>

                           <FilterActionsSpaced>
                              <FilterOutlinedButton onClick={handleResetFilter}>Đặt lại</FilterOutlinedButton>
                              <FlexGapBox>
                                 <FilterOutlinedButton onClick={handleFilterClose}>Hủy</FilterOutlinedButton>
                                 <FilterApplyButton onClick={handleApplyFilter}>Áp dụng lọc</FilterApplyButton>
                              </FlexGapBox>
                           </FilterActionsSpaced>
                        </PopoverContent>
                     </BlueHeaderPopoverContainer>
                  </Popover>

                  <HistorySummaryBox>
                    <HistorySummaryItem>
                      <SummaryLabel>Tổng số chuyến đi</SummaryLabel>
                      <SummaryValue>{historySummary.total || 0}</SummaryValue>
                    </HistorySummaryItem>
                    <HistorySummaryItem>
                      <SummaryLabel>Tháng này</SummaryLabel>
                      <SummaryValue>{historySummary.month || 0}</SummaryValue>
                    </HistorySummaryItem>
                  </HistorySummaryBox>

                  <TripListContainer>
                    {filteredTrips.map((trip, idx) => (
                      <TripItemBox key={idx} onClick={makeHandleOpenRequestDetail(trip.id)}>
                        <TripTitle>{trip.title}</TripTitle>
                        <TripDetail>{trip.time}</TripDetail>
                        <TripStatus status={trip.statusCode}>
                          Trạng thái: {trip.status}
                        </TripStatus>
                      </TripItemBox>
                    ))}
                    {filteredTrips.length === 0 && (
                       <CenteredJobPlaceholderText>
                         Không tìm thấy chuyến đi nào.
                       </CenteredJobPlaceholderText>
                    )}
                  </TripListContainer>
                  <ViewAllLink>Xem tất cả các chuyến</ViewAllLink>
                </>
              )}

              {activeTab === "experience" && (
                <>
                  <JobSectionTitle variant="h6" mb={2}>
                    KINH NGHIỆM LÁI XE
                  </JobSectionTitle>
                  <ExperienceContainer>
                    <ExperienceCarTitle mt={1}>Tổng kinh nghiệm: {experienceSummary.total}</ExperienceCarTitle>
                    <ExperienceCarTitle mb={2}>Quản lý xe: {experienceSummary.managedCars}</ExperienceCarTitle>
                    {experienceData.map((exp, idx) => (
                      <ExperienceContentBox key={idx}>
                        <ExperienceCarTitle>{exp.carType}</ExperienceCarTitle>
                        <ExperienceDetailText>{exp.detail}</ExperienceDetailText>
                      </ExperienceContentBox>
                    ))}
                  </ExperienceContainer>
                </>
              )}

              {activeTab === "health" && (
                <>
                  <SectionHeaderContainer>
                    <JobSectionTitle variant="h6" mb={0}>
                      KHÁM SỨC KHỎE
                    </JobSectionTitle>
                    <SkyIconButton size="small" onClick={handleOpenHealthDialog}>
                      <StyledAddIcon />
                    </SkyIconButton>
                  </SectionHeaderContainer>
                  
                  <SkyBox mt={2}>
                    {healthRecords.length > 0 ? (
                      healthRecords.map((item, idx) => (
                        <HealthRecordBox key={idx}>
                          <HealthHeaderRow>
                            <HealthDateText>{dayjs(item.checkupDate).format("DD/MM/YYYY")}</HealthDateText>
                            {idx === 0 && (
                              <HealthStatusBadge isExpired={item.checkupStatus !== "Còn hạn"}>
                                {item.checkupStatus}
                              </HealthStatusBadge>
                            )}
                          </HealthHeaderRow>
                          <HealthDetailRow>
                            <ExperienceDetailText>
                              Tái khám: {item.reCheckupDate ? dayjs(item.reCheckupDate).format("DD/MM/YYYY") : "N/A"}
                            </ExperienceDetailText>
                            {item.attachments && item.attachments.map((file, fileIdx) => (
                              <HealthFileLink 
                                key={fileIdx} 
                                onClick={handleHealthFilePreview(file)}
                              >
                                <InsertDriveFileIcon />
                                {file.file_name}
                              </HealthFileLink>
                            ))}
                          </HealthDetailRow>
                        </HealthRecordBox>
                      ))
                    ) : (
                      <CenteredJobPlaceholderText>
                        Chưa có dữ liệu khám sức khỏe.
                      </CenteredJobPlaceholderText>
                    )}
                  </SkyBox>
                </>
              )}
            </StyledBoxContainerContent>
          </Grid>
        </Grid>
      </JobMainContent>

      <LoadingDialog open={isLoading}>
        Đang xử lý, vui lòng đợi...
      </LoadingDialog>

      <FilePreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        fileName={previewFileName}
        url={previewUrl}
      />

      <HealthCheckScheduleDialog
        open={healthDialogOpen}
        onClose={handleCloseHealthDialog}
        onSave={handleSaveHealth}
        sharedComponents={sharedComponents}
        isLoading={false}
      />

      <ViewRequest
        open={openViewRequest}
        onClose={handleCloseRequestDetail}
        vehicleRegistrationId={selectedRequestId}
        sharedComponents={sharedComponents}
      />
    </CustomSwipper>
  );
};

export default withSharedComponents(ViewDrivers);