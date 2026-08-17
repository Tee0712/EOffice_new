import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { ArrowDownward, ArrowUpward, Delete, Replay } from "@mui/icons-material";
import {
  getApprovalFlowConfig,
  getApprovalFlowModuleTypes,
  getExpectedApprovalFlow,
  getUsersByOrganizationUnit,
  saveApprovalFlowConfig
} from "@services/vppService";
import announcementService from "@services/announcementService";
import { useToast } from "../../../components/common/ToastProvider";

const DEFAULT_MODULE_TYPE = "VPP";
const DRAFT_PREFIX = "approval-flow-draft-";
const getDraftKey = (departmentId, moduleType = DEFAULT_MODULE_TYPE) =>
  `${DRAFT_PREFIX}${moduleType}-${departmentId}`;

const loadDraft = (departmentId, moduleType) => {
  if (!departmentId || !moduleType) return null;
  try {
    const raw = sessionStorage.getItem(getDraftKey(departmentId, moduleType));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const persistDraft = (departmentId, moduleType, steps) => {
  if (!departmentId || !moduleType) return;
  try {
    sessionStorage.setItem(getDraftKey(departmentId, moduleType), JSON.stringify(steps));
  } catch (err) {
    console.error(err);
  }
};

const clearDraft = (departmentId, moduleType) => {
  if (!departmentId || !moduleType) return;
  try {
    sessionStorage.removeItem(getDraftKey(departmentId, moduleType));
  } catch (err) {
    console.error(err);
  }
};

const DEFAULT_APPROVER_FETCH_LIMIT = 100;
const SEARCH_APPROVER_LIMIT = 10;
const DEPARTMENT_PAGE_LIMIT = 10;
const APPROVER_PAGE_LIMIT = 10;

const normalizeConfiguredSteps = (configuredSteps = [], fallbackUsers = []) => {
  if (!configuredSteps.length) return [];
  return configuredSteps.map((step, index) => {
    // Lấy approverId từ BE trả về (CommonWorkflowEntity)
    const userId = step.approverId || step.userId || step.id || step._id;
    const match = fallbackUsers.find((user) => user.id === userId || user.username === step.username);
    return {
      userId,
      name: match?.name || step.name || step.username || "Người duyệt",
      username: match?.username || step.username,
      departmentName: match?.departmentName || step.departmentName,
      departmentCode: match?.departmentCode || step.departmentCode,
      order: step.stepOrder ?? step.order ?? index + 1
    };
  });
};

const mapUsersToSteps = (users = []) => users.map((user, index) => ({
  userId: user.id || user._id,
  name: user.name,
  username: user.username,
  departmentName: user.departmentName,
  departmentCode: user.departmentCode,
  order: index + 1
}));

const ApprovalFlowConfig = () => {
  const showToast = useToast();
  const [selectedModuleType, setSelectedModuleType] = useState(DEFAULT_MODULE_TYPE);
  const [moduleTypeOptions, setModuleTypeOptions] = useState([DEFAULT_MODULE_TYPE]);
  const [moduleTypeLoading, setModuleTypeLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [departmentInputValue, setDepartmentInputValue] = useState("");
  const [debouncedDepartmentInput, setDebouncedDepartmentInput] = useState("");
  const [departmentPage, setDepartmentPage] = useState(1);
  const [departmentHasMore, setDepartmentHasMore] = useState(true);
  const [selectedDept, setSelectedDept] = useState("");
  const [steps, setSteps] = useState([]);
  const [savedSteps, setSavedSteps] = useState([]);
  const [expectedUsers, setExpectedUsers] = useState([]);
  const [approverOptions, setApproverOptions] = useState([]);
  const [approverInputValue, setApproverInputValue] = useState("");
  const [approverLoading, setApproverLoading] = useState(false);
  const [approverPage, setApproverPage] = useState(1);
  const [approverHasMore, setApproverHasMore] = useState(false);
  const [debouncedApproverQuery, setDebouncedApproverQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingFlow, setLoadingFlow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Prevent out-of-order async responses overwriting the latest selection.
  const loadFlowSeqRef = React.useRef(0);

  const dirty = useMemo(() => JSON.stringify(steps) !== JSON.stringify(savedSteps), [steps, savedSteps]);

  const availableCandidates = useMemo(() => {
    const used = new Set(steps.map((step) => String(step.userId)));
    return approverOptions.filter((user) => {
      const candidateId = String(user.id || user._id || user.userId || "");
      return candidateId && !used.has(candidateId);
    });
  }, [approverOptions, steps]);

  const formatDeptLabel = (option) =>
    option
      ? `${option.name}${option.code ? ` (${option.code})` : ""}`
      : "";
  const formatApproverLabel = (option) => {
    if (!option) return "";
    const displayName = option?.name?.trim() || option?.username || "Người duyệt";
    const username = option?.username || "";
    return `${displayName}${username ? ` (${username})` : ""}`;
  };

  const loadModuleTypes = useCallback(async () => {
    setModuleTypeLoading(true);
    try {
      const res = await getApprovalFlowModuleTypes();
      const raw = res?.success ? res?.data : [];
      const list = Array.isArray(raw) ? raw : [];
      const normalized = list
        .map((value) => String(value || "").trim())
        .filter(Boolean);
      if (!normalized.includes(DEFAULT_MODULE_TYPE)) {
        normalized.unshift(DEFAULT_MODULE_TYPE);
      }
      const unique = Array.from(new Set(normalized));
      setModuleTypeOptions(unique.length ? unique : [DEFAULT_MODULE_TYPE]);
      if (!unique.includes(selectedModuleType)) {
        setSelectedModuleType(DEFAULT_MODULE_TYPE);
      }
    } catch (err) {
      console.error(err);
      setModuleTypeOptions([DEFAULT_MODULE_TYPE]);
      setSelectedModuleType(DEFAULT_MODULE_TYPE);
    } finally {
      setModuleTypeLoading(false);
    }
  }, [selectedModuleType]);

  useEffect(() => {
    loadModuleTypes();
  }, [loadModuleTypes]);

  const handleDeptChange = (_, option) => {
    const nextId = option?.id || "";
    if (!nextId) return;
    if (selectedDept) persistDraft(selectedDept, selectedModuleType, steps);
    setSelectedDept(nextId);
    setSelectedUser(null);
    setApproverInputValue("");
    setDepartmentInputValue(formatDeptLabel(option));
    setErrorMessage("");
  };

  const handleModuleTypeChange = (_, value) => {
    const next = (value || DEFAULT_MODULE_TYPE).trim() || DEFAULT_MODULE_TYPE;
    if (selectedDept) {
      persistDraft(selectedDept, selectedModuleType, steps);
    }
    setSelectedModuleType(next);
    // Clear current view immediately; the next loadFlow() will repopulate.
    setSteps([]);
    setSavedSteps([]);
    setExpectedUsers([]);
    setSelectedUser(null);
    setApproverInputValue("");
    setErrorMessage("");
  };

  const departmentFetchTracker = React.useRef({ query: "", page: 0 });
  const departmentFetcherRef = React.useRef(null);

  const fetchDepartmentOptions = useCallback(async ({ page = 1, append = false, query = "" } = {}) => {
    setDepartmentLoading(true);
    try {
      const normalizedQuery = (query || "").trim();
      if (
        !append &&
        departmentFetchTracker.current.query === normalizedQuery &&
        departmentFetchTracker.current.page === page
      ) {
        return;
      }
      const params = {
        page,
        limit: DEPARTMENT_PAGE_LIMIT,
      };
      if (query) {
        params.name = query;
      }
      const res = await announcementService.getOrganizationUnits(params);
      const units = Array.isArray(res?.data) ? res.data : [];
      const normalized = units
        .map((unit) => {
          const rawId = unit?.id || unit?._id;
          if (!rawId) return null;
          return {
            id: String(rawId),
            name: unit?.name || unit?.fullName || "Phòng ban",
            code: unit?.code || unit?.maPhongBan || "",
          };
        })
        .filter(Boolean);

      setDepartments((prev) => {
        const combined = append ? [...prev, ...normalized] : normalized;
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        return unique;
      });

      const totalPages = Math.max(1, Number(res?.totalPages || 1));
      setDepartmentHasMore(page < totalPages);
      setDepartmentPage(page);
      departmentFetchTracker.current = {
        query: normalizedQuery,
        page,
      };
      if (!selectedDept && normalized.length && !append) {
        setSelectedDept(normalized[0].id);
      }
    } catch (err) {
      console.error("Lỗi tải phòng ban:", err);
      showToast("Không thể tải danh sách phòng ban", "error");
    } finally {
      setDepartmentLoading(false);
    }
  }, [selectedDept, showToast]);

  const handleDepartmentListScroll = (event) => {
    const listboxNode = event?.currentTarget;
    if (!listboxNode || departmentLoading || !departmentHasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listboxNode;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      fetchDepartmentOptions({
        page: departmentPage + 1,
        append: true,
        query: debouncedDepartmentInput,
      });
    }
  };


  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDepartmentInput(departmentInputValue.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [departmentInputValue]);

  useEffect(() => {
    departmentFetcherRef.current = fetchDepartmentOptions;
  }, [fetchDepartmentOptions]);

  useEffect(() => {
    const runner = departmentFetcherRef.current;
    if (runner) {
      runner({ page: 1, append: false, query: debouncedDepartmentInput });
    }
  }, [debouncedDepartmentInput]);

  const fetchApproverOptions = useCallback(async ({ page = 1, append = false, query = "" } = {}) => {
    if (!selectedDept) return;
    setApproverLoading(true);
    try {
      const normalizedQuery = (query || "").trim();
      const params = {
        organizationUnit: selectedDept,
        limit: APPROVER_PAGE_LIMIT,
        page,
      };
      if (normalizedQuery) {
        params.name = normalizedQuery;
      }
      const res = await getUsersByOrganizationUnit(params);
      const rawUsers = Array.isArray(res?.data) ? res.data : [];
      const users = rawUsers.map((user) => ({
        ...user,
        id: user.id || user._id || user.userId,
      }));

      setApproverOptions((prev) => (append ? [...prev, ...users] : users));
      const totalCount = res?.count ?? users.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / APPROVER_PAGE_LIMIT));
      setApproverHasMore(page < totalPages);
      setApproverPage(page);
    } catch (err) {
      console.error("Lỗi tải người duyệt:", err);
      showToast("Không thể tải người duyệt", "error");
    } finally {
      setApproverLoading(false);
    }
  }, [selectedDept, showToast]);

  const handleApproverListScroll = (event) => {
    const listNode = event?.currentTarget;
    if (!listNode || approverLoading || !approverHasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listNode;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      fetchApproverOptions({
        page: approverPage + 1,
        append: true,
        query: debouncedApproverQuery,
      });
    }
  };

  const handleDepartmentInputChange = (_, value, reason) => {
    if (reason !== "input" && reason !== "clear") return;
    setDepartmentInputValue(value);
  };

  const handleApproverInputChange = (_, value, reason) => {
    if (reason !== "input" && reason !== "clear") return;
    setApproverInputValue(value);
  };

  const loadFlow = useCallback(async (departmentId, moduleType) => {
    if (!departmentId) {
      setExpectedUsers([]);
      setApproverOptions([]);
      setSteps([]);
      setSavedSteps([]);
      return;
    }

    const seq = ++loadFlowSeqRef.current;
    setLoadingFlow(true);
    setErrorMessage("");
    try {
      const effectiveModuleType = (moduleType || DEFAULT_MODULE_TYPE).trim() || DEFAULT_MODULE_TYPE;
      const [expectedRes, configRes] = await Promise.allSettled([
        getExpectedApprovalFlow({ moduleType: effectiveModuleType }),
        getApprovalFlowConfig({ moduleType: effectiveModuleType })
      ]);

      // Ignore stale responses (e.g. VPP finishes after ASXH).
      if (seq !== loadFlowSeqRef.current) {
        return;
      }

      const expectedUsersData =
        expectedRes.status === "fulfilled" && expectedRes.value?.success
          ? expectedRes.value.data || []
          : [];
      setExpectedUsers(expectedUsersData);

      const configuredRaw =
        configRes.status === "fulfilled" && configRes.value?.success
          ? configRes.value.data
          : [];
      const configuredSteps = Array.isArray(configuredRaw?.steps)
        ? configuredRaw.steps
        : Array.isArray(configuredRaw)
          ? configuredRaw
          : [];
      const filteredConfiguredSteps = configuredSteps.filter((step) => {
        const raw = step?.moduleType || step?.module_type || "";
        return String(raw).trim() === effectiveModuleType;
      });
      const normalized = normalizeConfiguredSteps(filteredConfiguredSteps, expectedUsersData);
      const draft = loadDraft(departmentId, effectiveModuleType);

      if (draft?.length) {
        setSteps(draft);
      } else if (normalized.length) {
        setSteps(normalized);
      } else if (expectedUsersData.length) {
        setSteps(mapUsersToSteps(expectedUsersData));
      } else {
        setSteps([]);
      }

      if (normalized.length) {
        setSavedSteps(normalized);
      } else if (expectedUsersData.length) {
        setSavedSteps(mapUsersToSteps(expectedUsersData));
      } else {
        setSavedSteps([]);
      }
    } catch (err) {
      console.error(err);
      showToast("Không thể tải luồng duyệt", "error");
    } finally {
      if (seq === loadFlowSeqRef.current) setLoadingFlow(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!selectedDept) return;
    loadFlow(selectedDept, selectedModuleType);
  }, [loadFlow, selectedDept, selectedModuleType]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedApproverQuery(approverInputValue.trim());
    }, 360);
    return () => clearTimeout(handler);
  }, [approverInputValue]);

  useEffect(() => {
    if (!selectedDept) {
      setApproverOptions([]);
      return;
    }
    fetchApproverOptions({
      page: 1,
      append: false,
      query: debouncedApproverQuery,
    });
  }, [selectedDept, debouncedApproverQuery, fetchApproverOptions]);

  useEffect(() => {
    if (selectedDept && selectedModuleType) {
      persistDraft(selectedDept, selectedModuleType, steps);
    }
  }, [steps, selectedDept, selectedModuleType]);

  const handleAddUser = () => {
    if (!selectedDept) {
      setErrorMessage("Chọn phòng ban trước khi thêm người duyệt.");
      return;
    }
    if (!selectedUser) {
      setErrorMessage("Chọn người duyệt để thêm vào luồng.");
      return;
    }
    if (steps.some((step) => step.userId === selectedUser.id)) {
      setErrorMessage("Người duyệt đã tồn tại trong luồng.");
      return;
    }
    const userIdValue = selectedUser.id || selectedUser._id || selectedUser.userId;
    if (!userIdValue) {
      setErrorMessage("Người duyệt không hợp lệ.");
      return;
    }
    const nextSteps = [
      ...steps,
      {
        userId: userIdValue,
        name: selectedUser.name || selectedUser.displayName || selectedUser.username,
        username: selectedUser.username,
        departmentName: selectedUser.departmentName,
        departmentCode: selectedUser.departmentCode,
        order: steps.length + 1
      }
    ];
    setSteps(nextSteps);
    setSelectedUser(null);
    setApproverInputValue("");
    setErrorMessage("");
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const copied = [...steps];
    [copied[index], copied[target]] = [copied[target], copied[index]];
    setSteps(copied);
    setErrorMessage("");
  };

  const handleRemove = (index) => {
    const next = steps.filter((_, idx) => idx !== index);
    setSteps(next);
    setErrorMessage("");
  };

  const handleReset = () => {
    if (savedSteps.length) {
      setSteps(savedSteps);
      setErrorMessage("");
    } else {
      setSteps([]);
    }
    clearDraft(selectedDept, selectedModuleType);
  };

  const handleSave = async () => {
    if (!selectedDept) {
      setErrorMessage("Chọn phòng ban để lưu luồng.");
      return;
    }
    if (!steps.length) {
      setErrorMessage("Luồng duyệt phải có tối thiểu một người.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        departmentId: selectedDept,
        moduleType: selectedModuleType,
        steps: steps.map((step, idx) => ({ approverId: step.userId, stepOrder: idx + 1 }))
      };
      const res = await saveApprovalFlowConfig(payload);
      if (res?.success) {
        showToast("Đã lưu luồng duyệt", "success");
        clearDraft(selectedDept, selectedModuleType);
        setSavedSteps([...steps]);
      } else {
        showToast("Không thể lưu luồng duyệt", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu luồng duyệt", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6fb",
        p: { xs: 2, md: 4 },
        fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.5px",
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            mb: 0.5,
          }}
        >
          Cấu hình luồng duyệt văn phòng phẩm
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#64748b",
            fontWeight: 500,
            lineHeight: 1.6,
            maxWidth: "600px",
          }}
        >
          Chọn phòng ban để tạo hoặc điều chỉnh trình duyệt phù hợp với cơ cấu duyệt nội bộ.
        </Typography>
      </Box>

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              {departmentLoading && !departments.length ? (
                <Skeleton height={56} />
              ) : (
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={departments}
                  value={departments.find((dept) => dept.id === selectedDept) || null}
                  onChange={handleDeptChange}
                  inputValue={departmentInputValue}
                  onInputChange={handleDepartmentInputChange}
                  onBlur={() => {
                    const selected = departments.find((dept) => dept.id === selectedDept);
                    if (selected) {
                      setDepartmentInputValue(formatDeptLabel(selected));
                    }
                  }}
                  getOptionLabel={(option) =>
                    `${option.name}${option.code ? ` (${option.code})` : ""}`
                  }
                  disableClearable
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  loading={departmentLoading}
                  ListboxProps={{ onScroll: handleDepartmentListScroll }}
                  noOptionsText="Không tìm thấy phòng ban"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn phòng ban"
                      size="small"
                      placeholder="Tìm nhanh phòng ban"
                      sx={{ bgcolor: "white", borderRadius: 2 }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {departmentLoading ? (
                              <CircularProgress color="inherit" size={16} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={moduleTypeOptions}
                  value={selectedModuleType}
                  onChange={handleModuleTypeChange}
                  disableClearable
                  loading={moduleTypeLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn loại luồng duyệt"
                      size="small"
                      placeholder="Ví dụ: VPP"
                      sx={{ bgcolor: "white", borderRadius: 2 }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {moduleTypeLoading ? (
                              <CircularProgress color="inherit" size={16} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={availableCandidates}
                  getOptionLabel={(option) => formatApproverLabel(option)}
                  value={selectedUser}
                  inputValue={approverInputValue}
                  onInputChange={handleApproverInputChange}
                  filterOptions={(options) => options}
                  loading={approverLoading}
                  onChange={(event, value) => {
                    setSelectedUser(value);
                    setApproverInputValue(formatApproverLabel(value));
                  }}
                  disableClearable
                  ListboxProps={{
                    onScroll: handleApproverListScroll,
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Người duyệt"
                      size="small"
                      placeholder="Chọn người duyệt"
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddUser}
                  disabled={!selectedDept || !availableCandidates.length}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 700,
                    px: 3,
                    boxShadow: 'none',
                    '&.Mui-disabled': {
                      bgcolor: '#e0e0e0',
                      color: '#757575'
                    }
                  }}
                >
                  Thêm
                </Button>
              </Stack>
            </Grid>
          </Grid>
          {errorMessage && (
            <Alert severity="warning" sx={{ mt: 2 }}>{errorMessage}</Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardHeader
          title="Luồng duyệt"
          subheader="Kéo/thêm/xóa để điều chỉnh thứ tự người duyệt"
          titleTypographyProps={{ fontWeight: 700 }}
        />
        <Divider />
        <CardContent>
          {loadingFlow ? (
            <Skeleton variant="rectangular" height={160} />
          ) : steps.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Chưa có người duyệt trong hệ thống. Vui lòng chọn phòng ban và thêm bước duyệt.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 360, overflowY: "auto", pr: 1 }}>
              <List disablePadding>
                {steps.map((step, index) => (
                  <ListItem
                    key={step.userId || `${step.name}-${index}`}
                    sx={{
                      bgcolor: "white",
                      borderRadius: 2,
                      mb: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "primary.light",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={`${index + 1}. ${step.name}`}
                      secondary={step.departmentName || step.username}
                      primaryTypographyProps={{ fontWeight: 700, color: "text.primary" }}
                      secondaryTypographyProps={{ color: "text.secondary", fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          sx={{
                            bgcolor: "rgba(25, 118, 210, 0.08)",
                            color: "primary.main",
                            "&:hover": { bgcolor: "rgba(25, 118, 210, 0.2)" },
                            "&.Mui-disabled": {
                              bgcolor: "#f5f5f5",
                              color: "#bdbdbd",
                            },
                          }}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMove(index, 1)}
                          disabled={index === steps.length - 1}
                          sx={{
                            bgcolor: "rgba(25, 118, 210, 0.08)",
                            color: "primary.main",
                            "&:hover": { bgcolor: "rgba(25, 118, 210, 0.2)" },
                            "&.Mui-disabled": {
                              bgcolor: "#f5f5f5",
                              color: "#bdbdbd",
                            },
                          }}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(index)}
                          sx={{
                            bgcolor: "rgba(211, 47, 47, 0.08)",
                            color: "error.main",
                            "&:hover": { bgcolor: "rgba(211, 47, 47, 0.2)" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Replay />}
            onClick={handleReset}
            disabled={!dirty || !selectedDept}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              '&.Mui-disabled': {
                borderColor: '#e0e0e0',
                color: '#9e9e9e',
                bgcolor: 'transparent'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!dirty || !steps.length || saving}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#757575',
                boxShadow: 'none'
              }
            }}
          >
            {saving ? "Đang lưu..." : "Lưu luồng"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default ApprovalFlowConfig;
