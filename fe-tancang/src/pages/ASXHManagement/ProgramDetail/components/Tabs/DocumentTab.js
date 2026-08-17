import React from "react";
import { 
    Box, 
    Typography, 
    Paper, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Button,
    Stack
} from "@mui/material";
import { 
    Description as DocIcon, 
    FileDownload as DownloadIcon, 
    Visibility as ViewIcon,
    Add as AddIcon 
} from "@mui/icons-material";
import moment from "moment";

const DocumentTab = ({ documents = [] }) => {
  return (
    <Paper sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#F8FAFC" }}>
         <Typography variant="subtitle1" fontWeight={700} color="#1E293B">Danh sách tài liệu & Văn bản ({documents.length})</Typography>
         <Button variant="contained" startIcon={<AddIcon />} size="small" sx={{ textTransform: "none", bgcolor: "#0055CC" }}>
            Đính kèm tài liệu
         </Button>
      </Box>
      <Divider />
      
      <List sx={{ p: 0 }}>
        {documents.length > 0 ? (
          documents.map((doc, idx) => (
            <React.Fragment key={doc.id}>
              <ListItem sx={{ py: 2, px: 3, "&:hover": { bgcolor: "#F8FAFC" } }}>
                <ListItemIcon sx={{ minWidth: 48 }}>
                   <Box sx={{ p: 1, bgcolor: "#F1F5F9", borderRadius: "8px" }}>
                      <DocIcon sx={{ color: "#475569" }} />
                   </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={700} color="#1E293B">{doc.document_code || doc.document_id}</Typography>}
                  secondary={
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                       <Typography variant="caption" color="text.secondary">{doc.document_subject}</Typography>
                       <Typography variant="caption" color="text.secondary">•</Typography>
                       <Typography variant="caption" color="text.secondary">Ngày đính kèm: {moment(doc.created_at).format("DD/MM/YYYY")}</Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                     <IconButton size="small" title="Xem">
                        <ViewIcon fontSize="small" sx={{ color: "#64748B" }} />
                     </IconButton>
                     <IconButton size="small" title="Tải về">
                        <DownloadIcon fontSize="small" sx={{ color: "#0055CC" }} />
                     </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              {idx < documents.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ py: 10, textAlign: "center" }}>
             <DocIcon sx={{ fontSize: 48, color: "divider", mb: 2 }} />
             <Typography color="text.secondary">Chưa có tài liệu nào được liên kết với chương trình này.</Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default DocumentTab;
