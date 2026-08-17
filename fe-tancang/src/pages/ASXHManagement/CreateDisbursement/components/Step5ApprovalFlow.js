import React, { useContext, useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Avatar,
  Divider,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from "@mui/material";
import { 
  Add as AddIcon,
  Check as CheckIcon,
  East as ArrowIcon,
} from "@mui/icons-material";
import { AuthContext } from "@AuthContext/AuthProvider";
import asxhService from "@services/asxhService";
import workflowWizardService from "@services/workflowWizardService";
import { MenuItem, Select, FormControl } from "@mui/material";

const ApprovalNode = ({ name, role, status, isFirst }) => {
  const getIcon = () => {
    if (status === "done") return (
      <Avatar sx={{ width: 34, height: 34, bgcolor: "#fff", border: "2.5px solid #069277", color: "#069277" }}>
        <CheckIcon sx={{ fontSize: 18 }} />
      </Avatar>
    );
    if (isFirst) return (
      <Avatar sx={{ width: 34, height: 34, bgcolor: "#3b82f6" }}>
        <AddIcon sx={{ fontSize: 18 }} />
      </Avatar>
    );
    return (
      <Avatar sx={{ width: 34, height: 34, bgcolor: "#fff", border: "1.5px solid #e2e8f0", color: "#cbd5e1" }}>
        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "currentColor" }} />
      </Avatar>
    );
  };

  const getNameColor = () => {
    if (isFirst) return "#1e293b";
    if (status === "done") return "#069277";
    return "#64748b";
  };

  return (
    <Stack alignItems="center" sx={{ minWidth: 110 }}>
      {getIcon()}
      <Box sx={{ mt: 1, textAlign: "center" }}>
        <Typography variant="caption" fontWeight={800} sx={{ color: getNameColor(), display: "block", fontSize: "11px" }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", opacity: 0.8 }}>{role}</Typography>
      </Box>
    </Stack>
  );
};

const Connector = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 0.5, mb: 4.5 }}>
    <ArrowIcon sx={{ color: "#e2e8f0", fontSize: 18 }} />
  </Box>
);

const NotificationItem = ({ title, description, checked, onChange, isLast }) => (
  <ListItem sx={{ px: 0, py: 2, borderBottom: isLast ? "none" : "1px solid #f1f5f9" }}>
    <ListItemText 
      primary={<Typography variant="body2" fontWeight={700} color="#1e293b">{title}</Typography>}
      secondary={<Typography variant="caption" color="text.secondary">{description}</Typography>}
    />
    <ListItemSecondaryAction>
      <Switch 
        size="small" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: "#3b82f6" },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#3b82f6" }
        }}
      />
    </ListItemSecondaryAction>
  </ListItem>
);

const Step5ApprovalFlow = ({ data, onChange, programInfo }) => {
  const { user } = useContext(AuthContext);
  const [approvalFlow, setApprovalFlow] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(data.workflowKey || data.workflow_key || "");
  const [loading, setLoading] = useState(false);
  
  const receivingUnit = data.receiving_unit || "đơn vị nhận tiền";

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await workflowWizardService.getList();
        if (res.success) {
          const wfs = res.data || [];
          setWorkflows(wfs);
          
          // 1. Tìm ánh xạ cấu hình động từ Backend cho ASXH (dùng ID asxh_root_001)
          const mappingResponse = await asxhService.getModuleWorkflowMapping();
          if (mappingResponse.success && mappingResponse.data) {
            const asxhMapping = mappingResponse.data.find(m => m.menuId === "asxh_root_001" || m.menu_id === "asxh_root_001");
            const wk = asxhMapping?.workflowKey || asxhMapping?.workflow_key;
            
            if (wk && wk !== selectedWorkflow) {
               setSelectedWorkflow(wk);
               onChange("workflowKey", wk);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch workflows or mapping:", error);
      }
    };
    fetchWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchWorkflowDetail = async () => {
      if (!selectedWorkflow) {
        setApprovalFlow([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await workflowWizardService.getDetail(selectedWorkflow);
        if (res.success && res.data) {
          const userData = user?.user;
          // Parse nodes from workflow data
          const steps = res.data.steps || []; 
          const otherNodes = steps.map((item, index) => ({
            id: `step-${index}`,
            name: item.name || "Người phê duyệt",
            role: item.roleCode || "Phê duyệt",
            status: index === 0 ? "done" : undefined, // Mark Step 1 as current
            isFirst: index === 0
          }));

          setApprovalFlow(otherNodes);
        }
      } catch (error) {
        console.error("Failed to fetch workflow detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowDetail();
  }, [selectedWorkflow, user]);

  const handleWorkflowChange = (event) => {
    const val = event.target.value;
    setSelectedWorkflow(val);
    onChange("workflowKey", val);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar sx={{ bgcolor: "#3B82F6", width: 26, height: 26, fontSize: "13px", fontWeight: 700 }}>5</Avatar>
        <Typography fontWeight={700} color="#0f172a" sx={{ fontSize: "17px" }}>
          Phê duyệt & Thông báo
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
            Luồng phê duyệt được áp dụng (Theo cấu hình hệ thống)
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedWorkflow}
              onChange={handleWorkflowChange}
              displayEmpty
              disabled={true} // Bắt buộc khóa luồng mặc định
              sx={{ 
                borderRadius: "10px", 
                bgcolor: "#f1f5f9" // Màu xám để nhận biết đã khóa
              }}
            >
              <MenuItem value="" disabled>-- Chọn luồng quy trình --</MenuItem>
              {workflows.map(wf => (
                <MenuItem key={wf.processKey} value={wf.processKey}>{wf.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body2" fontWeight={700} color="#64748b" sx={{ fontSize: "12px", mb: 3 }}>
          Luồng phê duyệt dự kiến
        </Typography>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1, gap: 1, flexWrap: "wrap" }}>
            {approvalFlow.map((node, index) => (
              <React.Fragment key={node.id}>
                <ApprovalNode 
                  name={node.name} 
                  role={node.role} 
                  status={node.status} 
                  isFirst={node.isFirst} 
                />
                {index < approvalFlow.length - 1 && <Connector />}
              </React.Fragment>
            ))}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, mb: 4, textAlign: "right", fontStyle: "italic", opacity: 0.8 }}>
          Hệ thống sẽ tự động gửi thông báo đến các cấp phê duyệt tương ứng khi đợt được khởi tạo.
        </Typography>

        <Divider sx={{ mb: 1 }} />

        <Box>
           <Typography variant="body2" fontWeight={700} color="#475569" sx={{ fontSize: "13px", mt: 3, mb: 1 }}>
             Tuỳ chọn thông báo
           </Typography>
           <List disablePadding>
              <NotificationItem 
                title="Email thông báo cho người phê duyệt"
                description="Gửi ngay khi tạo đợt giải ngân"
                checked={data.notify_approvers !== false}
                onChange={(val) => onChange("notify_approvers", val)}
              />
              <NotificationItem 
                title="Thông báo cho đơn vị nhận tiền"
                description={`Email xác nhận cho ${receivingUnit} khi hoàn tất`}
                checked={data.notify_receiver !== false}
                onChange={(val) => onChange("notify_receiver", val)}
              />
              <NotificationItem 
                title="Nhắc nhở tự động"
                description="Nhắc người phê duyệt nếu chưa xử lý sau 3 ngày"
                checked={data.auto_reminder !== false}
                onChange={(val) => onChange("auto_reminder", val)}
              />
              <NotificationItem 
                isLast
                title="Lưu mẫu cho đợt sau"
                description="Lưu thông tin đơn vị nhận và chi tiết làm mẫu"
                checked={data.save_as_template === true}
                onChange={(val) => onChange("save_as_template", val)}
              />
           </List>
        </Box>
      </Paper>
    </Box>
  );
};

export default Step5ApprovalFlow;
