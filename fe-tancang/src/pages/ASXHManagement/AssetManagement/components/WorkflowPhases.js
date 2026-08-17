import React from "react";
import { 
  Box, 
  Typography, 
  Stack, 
  Paper,
  Divider
} from "@mui/material";
import { 
  CheckCircle as DoneIcon,
  ChevronRight as ArrowIcon
} from "@mui/icons-material";

const PhaseItem = ({ step, title, status, progress, meta, dept, isLast }) => {
  const isDone = status === "Done";
  const isCurrent = status === "Current";
  
  const [itemsInfo, statusInfo] = meta ? meta.split(" - ") : ["", ""];

  return (
    <Box sx={{ flex: 1, p: 3, position: "relative", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* Circle Indicator */}
        <Box sx={{ 
          width: 32, height: 32, borderRadius: "50%", 
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: isDone ? "#10b981" : (isCurrent ? "#f97316" : "#f1f5f9"),
          color: isDone || isCurrent ? "white" : "#94a3b8",
          fontWeight: 700, fontSize: "0.8rem",
          border: isCurrent ? "4px solid #fff7ed" : "none"
        }}>
          {isDone ? <DoneIcon sx={{ fontSize: 18 }} /> : step}
        </Box>

        {/* Labels */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: isCurrent || isDone ? "#1e293b" : "#94a3b8", lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.7rem" }}>
            {dept}
          </Typography>
        </Box>
      </Stack>

      {/* Stats Row */}
      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: isDone ? "#10b981" : "#1e293b", fontWeight: 8 * 100, fontSize: "0.9rem" }}>
            {itemsInfo}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.6rem", fontWeight: 700 }}>
            HẠNG MỤC
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: isCurrent ? "#f97316" : (isDone ? "#10b981" : "#94a3b8"), fontWeight: 8 * 100, fontSize: "0.9rem" }}>
            {statusInfo}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.6rem", fontWeight: 700 }}>
            {isCurrent ? "ĐÃ CHI" : (isDone ? "HOÀN THÀNH" : "DỰ KIẾN 15/04")}
          </Typography>
        </Box>
      </Stack>

      {/* Bottom Bar */}
      <Box sx={{ 
        height: 4, width: "100%", borderRadius: 1, 
        bgcolor: "#f1f5f9", overflow: "hidden" 
      }}>
        <Box sx={{ 
          width: `${progress || 0}%`, 
          height: "100%", 
          bgcolor: isDone ? "#10b981" : (isCurrent ? "#f97316" : "#f1f5f9"),
          transition: "width 0.5s ease-in-out"
        }} />
      </Box>

      {/* Arrow Connector */}
      {!isLast && (
        <Box sx={{ 
          position: "absolute", right: -12, top: "25%", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          p: 0.5, borderRadius: "50%", border: "1px solid #e2e8f0", bgcolor: "white"
        }}>
          <ArrowIcon sx={{ fontSize: 14, color: "#e2e8f0" }} />
        </Box>
      )}
    </Box>
  );
};

const WorkflowPhases = ({ steps }) => {
  // Mapping step_key to index and department for display
  const stepMap = {
    request_received: { step: "1", dept: "Phòng Truyền thông" },
    procurement: { step: "2", dept: "Phòng Hành chính" },
    handover_local: { step: "3", dept: "Ban ASXH • Địa phương" }
  };

  return (
    <Paper elevation={0} sx={{ 
      borderRadius: "12px", mb: 4, border: "1px solid #f1f5f9", 
      bgcolor: "white", display: "flex", alignItems: "stretch" 
    }}>
      {steps?.length > 0 ? (
        steps.map((s, idx) => {
          const config = stepMap[s.step_key] || { step: (idx + 1).toString(), dept: "Đang cập nhật" };
          
          // Determine status based on progress_pct
          let status = "Upcoming";
          if (s.progress_pct === 100) status = "Done";
          else if (s.progress_pct > 0) status = "Current";

          return (
            <Box key={s.step_key} sx={{ flex: 1, bgcolor: s.step_key === "handover_local" ? "#f8fafc" : "transparent" }}>
              <PhaseItem 
                step={config.step}
                title={s.title}
                status={status}
                progress={s.progress_pct}
                meta={`${s.done_items}/${s.total_items} - ${s.status_label}`}
                dept={config.dept}
                isLast={idx === steps.length - 1}
              />
            </Box>
          );
        })
      ) : (
        // Fallback for loading/empty
        <Box sx={{ p: 3, width: "100%", textAlign: "center", color: "#94a3b8" }}>
          Đang tải thông tin tiến độ...
        </Box>
      )}
    </Paper>
  );
};

export default WorkflowPhases;
