import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, Typography, Checkbox, TablePagination, TextField, InputAdornment, 
  CircularProgress, Chip 
} from "@mui/material";
import { Search, Description, LinkOff } from "@mui/icons-material";
import asxhService from "@services/asxhService";

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.95rem",
    minHeight: "44px",
    "& fieldset": {
      borderColor: "#D0D5DD",
    },
    "&:hover fieldset": {
      borderColor: "#2563EB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#98A2B3",
    opacity: 1,
  },
};

const DispatchSection = ({ selectedDocuments = [], onChange }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await asxhService.searchIncomingDocuments({
        page: page + 1,
        limit: rowsPerPage,
        keyword: searchTerm
      });

      let items = [];
      let totalCount = 0;

      if (res) {
        items = res.items || res.data || [];
        totalCount = res.total || res.totalItems || 0;
      }
      const processed = (Array.isArray(items) ? items : []).map((item, index) => {
        const numericId = item.id || item.documentId || 0;
        const uniqueId = numericId > 0 ? String(numericId) : `doc_${page}_${index}`;
        
        // Extract sender name before "/" or "|"
        const rawSender = item.sender || "Bên ngoài";
        const senderTag = rawSender.split(/[|/]/)[0].trim();

        return {
          ...item,
          _uniqueId: uniqueId,
          _numericId: numericId,
          _code: item.to_book || item.toBookCode || item.documentCode || item.code || item.soKyHieu || "",
          _subject: item.abstract_note || item.abstractNote || item.subject || item.trichYeu || item.compendium || "",
          _date: item.document_date || item.documentDate || item.ngayVanBan || item.dateIssued || "",
          _tag: senderTag,
          _docId: numericId,
        };
      });

      // Strictly limit items shown based on rowsPerPage
      setDocuments(processed.slice(0, rowsPerPage));
      setTotal(totalCount);
    } catch (err) {
      console.error("Lỗi tải danh sách văn bản đến:", err);
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const isSelected = (doc) => {
    return selectedDocuments.some((d) => String(d.document_id) === String(doc._uniqueId));
  };

  const handleToggle = (doc) => {
    const alreadySelected = isSelected(doc);
    let newSelected;
    if (alreadySelected) {
      newSelected = selectedDocuments.filter((d) => String(d.document_id) !== String(doc._uniqueId));
    } else {
      newSelected = [
        ...selectedDocuments,
        {
          document_id: doc._numericId || doc._uniqueId,
          document_code: doc._code,
          document_subject: doc._subject,
          sender: doc._tag
        },
      ];
    }
    onChange("linked_documents", newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Document List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CircularProgress size={32} thickness={5} sx={{ color: "#2563EB" }} />
            <Typography variant="body2" sx={{ color: "#64748B" }}>Đang tải công văn...</Typography>
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: "12px" }}>
            <LinkOff sx={{ fontSize: 40, color: "#94A3B8", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>Không tìm thấy công văn nào</Typography>
          </Box>
        ) : (
          documents.map((doc) => {
            const selected = isSelected(doc);
            return (
              <Box 
                key={doc._uniqueId}
                onClick={() => handleToggle(doc)}
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2, 
                  p: 2, 
                  border: "1px solid", 
                  borderColor: selected ? "#2563EB" : "#E2E8F0", 
                  borderRadius: "12px", 
                  backgroundColor: selected ? "#F0F7FF" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.05)" }
                }}
              >
                <Checkbox 
                  checked={selected} 
                  sx={{ color: "#D0D5DD", "&.Mui-checked": { color: "#2563EB" } }} 
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                  <Description sx={{ fontSize: 20, color: selected ? "#2563EB" : "#94A3B8" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#2563EB", minWidth: "120px" }}>
                    {doc._code || "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#1E293B", flex: 1, px: 2 }}>
                    {doc._subject || "Không có trích yếu"}
                  </Typography>
                </Box>
                <Chip 
                  label={doc._tag} 
                  size="small" 
                  sx={{ 
                    bgcolor: doc._tag === "PVN" ? "#F5F3FF" : "#F1F5F9", 
                    color: doc._tag === "PVN" ? "#7C3AED" : "#64748B",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: "6px"
                  }} 
                />
              </Box>
            );
          })
        )}
      </Box>

      {/* Pagination & Search */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 3 }}>
        <TextField
          size="small"
          placeholder="Tìm thêm công văn..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0); // Reset to first page on search
          }}
          sx={{ ...inputStyles, width: "320px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#94A3B8" }} />
              </InputAdornment>
            ),
          }}
        />
        
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          labelRowsPerPage="Số dòng"
          sx={{ border: "none", "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { color: "#64748B", fontWeight: 500 } }}
        />
      </Box>
    </Box>
  );
};

export default DispatchSection;
