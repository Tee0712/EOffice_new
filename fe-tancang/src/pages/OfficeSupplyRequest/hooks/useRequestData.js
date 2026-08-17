import { useState, useCallback, useEffect } from "react";
import { 
  getRequestList, 
  approveRequest as approveReq, 
  deleteRequest as deleteReq,
  getExpectedApprovalFlow 
} from "@services/vppService";
import { callApi } from "@services/api";
import { API_INFLOW_EXPECTED_USERS } from "@EnvironmentFile/constants/urlConfig";
import moment from "moment";

const stripDiacritics = (value) => {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const normalizePriorityForApi = (priority) => {
  if (!priority || priority === "all") return undefined;

  // Backend codes (some environments return/store codes)
  const upper = String(priority).toUpperCase().trim();
  if (upper === "NORMAL") return "Bình thường";
  if (upper === "URGENT" || upper === "CRITICAL") return "Khẩn";

  // Backward compatibility for older UI values / Vietnamese labels
  const normalized = stripDiacritics(priority);
  if (normalized.includes("khan cap")) return "Khẩn";
  if (normalized.includes("khan")) return "Khẩn";
  if (normalized.includes("gap")) return "Khẩn";
  if (normalized.includes("binh thuong")) return "Bình thường";

  // Fallback: send as-is so backend can still handle custom values
  return priority;
};

export const useRequestData = (initialFilters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, DRAFT: 0, pending_dept_approval: 0, pending_hc_approval: 0, pending_issue: 0, rejected: 0, completed: 0 });
  const [isApprover, setIsApprover] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "all",
    keyword: "",
    department: "all",
    priority: "all",
    fromDate: "",
    toDate: "",
    ...initialFilters
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let fromDate = filters.fromDate;
      let toDate = filters.toDate;

      if (filters.timeRange && filters.timeRange !== 'all') {
        toDate = moment().format('YYYY-MM-DD');
        if (filters.timeRange === 'today') fromDate = moment().format('YYYY-MM-DD');
        if (filters.timeRange === 'week') fromDate = moment().startOf('week').format('YYYY-MM-DD');
        if (filters.timeRange === 'month') fromDate = moment().startOf('month').format('YYYY-MM-DD');
      }

      let currentUserId = undefined;
      try {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
          const ud = JSON.parse(userDataString);
          currentUserId = ud?.user?.id || ud?.user?._id;
        }
      } catch (e) {}

      const params = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== "all" ? filters.status : undefined,
        keyword: filters.keyword || undefined,
        department: filters.department !== "all" ? filters.department : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        priority: normalizePriorityForApi(filters.priority),
      };

      // Permissions: Always filter by involvement (creator or approver)
      if (currentUserId && !isApprover) {
        params.requester_id = currentUserId;
        params.approver = currentUserId;
      }
      const res = await getRequestList(params);
      if (res?.success) {
        setData(res.data?.items || []);
        setTotal(res.data?.total || 0);
        if (res.data?.summary) setStats(res.data.summary);
      }
    } catch (err) {
      console.error("useRequestData fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if current user is in the VPP approval flow (approver role)
  useEffect(() => {
    const checkApproverRole = async () => {
      try {
        let currentUserId;
        try {
          const userDataString = localStorage.getItem("userData");
          if (userDataString) {
            const ud = JSON.parse(userDataString);
            currentUserId = ud?.user?.id || ud?.user?._id || ud?.user?.user;
          }
        } catch (e) {}

        if (!currentUserId) return;

        const res = await callApi("get", API_INFLOW_EXPECTED_USERS, { moduleType: "VPP" });
        if (res?.success && Array.isArray(res.data)) {
          const found = res.data.some(u => 
            u.id === currentUserId || 
            u._id === currentUserId || 
            u.userId === currentUserId ||
            u.approverId === currentUserId
          );
          setIsApprover(found);
        }
      } catch (e) {
        console.error("checkApproverRole error:", e);
      }
    };
    checkApproverRole();
  }, []);

  const handleApprove = async (id, action, note) => {
    try {
      let approver = null;
      try {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
          const ud = JSON.parse(userDataString);
          const currentUserId = ud?.user?.id || ud?.user?._id;
          const currentUserUsername = ud?.user?.username;

          const flowRes = await getExpectedApprovalFlow();
          if (flowRes?.success) {
            const flowData = flowRes.data;
            const currentIndex = flowData.findIndex(u => 
              (u.id && currentUserId && u.id === currentUserId) || 
              (u.username && currentUserUsername && u.username === currentUserUsername) 
            );

            if (currentIndex !== -1 && currentIndex < flowData.length - 1) {
              approver = flowData[currentIndex + 1].id || flowData[currentIndex + 1]._id;
            }
          }
        }
      } catch (e) {}
      const res = await approveReq(id, { action, note, reviewer: currentUserId });
      if (res?.success) {
        fetchData();
        return true;
      }
      return false;
    } catch { return false; }
  };

  const handleBulkApprove = async (ids, action, note) => {
    try {
      let approver = null;
      try {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
          const ud = JSON.parse(userDataString);
          const currentUserId = ud?.user?.id || ud?.user?._id;
          const currentUserUsername = ud?.user?.username;

          const flowRes = await getExpectedApprovalFlow();
          if (flowRes?.success) {
            const flowData = flowRes.data;
            const currentIndex = flowData.findIndex(u => 
              (u.id && currentUserId && u.id === currentUserId) || 
              (u.username && currentUserUsername && u.username === currentUserUsername) 
            );

            if (currentIndex !== -1 && currentIndex < flowData.length - 1) {
              approver = flowData[currentIndex + 1].id || flowData[currentIndex + 1]._id;
            }
          }
        }
      } catch (e) {}
      const promises = ids.map(id => approveReq(id, { action, note, reviewer: currentUserId }));
      const results = await Promise.all(promises);
      fetchData();
      return results.every(res => res?.success);
    } catch { return false; }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteReq(id);
      if (res?.success) { fetchData(); return true; }
      return false;
    } catch { return false; }
  };

  const handleBulkDelete = async (ids) => {
    try {
      const promises = ids.map(id => deleteReq(id));
      const results = await Promise.all(promises);
      fetchData();
      return results.every(res => res?.success);
    } catch { return false; }
  };

  return { 
    data, loading, total, stats, 
    filters, setFilters, refresh: fetchData, 
    handleApprove, handleBulkApprove, 
    handleDelete, handleBulkDelete,
    isApprover
  };
};
