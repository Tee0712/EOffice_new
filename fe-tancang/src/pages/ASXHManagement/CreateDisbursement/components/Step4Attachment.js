import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Chip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Close as DeleteIcon,
  CheckCircle as ValidIcon,
} from "@mui/icons-material";
import asxhService from "@services/asxhService";
import { useToast } from "@components/common/ToastProvider";
import dayjs from "dayjs";

const docTypeMap = {
  BIEN_BAN: { label: "Biên bản ký", color: "#E0F2FE", textColor: "#0369A1" },
  UNC: { label: "UNC", color: "#F0FDF4", textColor: "#15803D" },
  HOP_DONG: { label: "Hợp đồng", color: "#F5F3FF", textColor: "#6D28D9" },
  DU_TOAN: { label: "Dự toán", color: "#FEF9C3", textColor: "#A16207" },
  ANH_TIEN_DO: { label: "Ảnh tiến độ", color: "#F1F5F9", textColor: "#475569" },
  KHAC: { label: "Chứng từ khác", color: "#F1F5F9", textColor: "#475569" },
};

const formatSize = (bytes) => {
  if (!bytes) return "0 KB";
  const k = 1024;
  const dm = 1;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIconInfo = (filename = "") => {
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext))
    return { icon: <FileIcon sx={{ color: "#EF4444" }} />, bgColor: "#FEE2E2" };
  if (["xls", "xlsx"].includes(ext))
    return { icon: <FileIcon sx={{ color: "#22C55E" }} />, bgColor: "#DCFCE7" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return { icon: <FileIcon sx={{ color: "#F59E0B" }} />, bgColor: "#FEF3C7" };
  return { icon: <FileIcon sx={{ color: "#64748b" }} />, bgColor: "#f1f5f9" };
};

const FileItem = ({ file, isPending, onRemove, onClassify }) => {
  const name = file.title || file.name || "Tài liệu đính kèm";
  const { icon, bgColor } = getFileIconInfo(name);
  const docType = docTypeMap[file.doc_type] || docTypeMap.KHAC;
  const sizeStr = isPending
    ? formatSize(file.file?.size)
    : file.size
      ? formatSize(file.size)
      : "1.2 MB"; // Giả lập size nếu API không có

  const nextDocType = (current) => {
    const keys = Object.keys(docTypeMap);
    const idx = keys.indexOf(current);
    return keys[(idx + 1) % keys.length];
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: "14px 20px",
        mb: 1.5,
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
        bgcolor: isPending ? "#fcfaf2" : "#f8fafc66",
        "&:hover": {
          bgcolor: "#f1f5f9",
          borderColor: "#cbd5e1",
          transform: "translateY(-1px)",
        },
        ...(isPending && { borderStyle: "dashed" }),
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
        <Box
          sx={{
            bgcolor: bgColor,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ overflow: "hidden" }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color="#1e293b"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "400px",
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {sizeStr} •{" "}
            {isPending
              ? "Chờ tải lên"
              : file.uploaded_at
                ? dayjs(file.uploaded_at).format("DD/MM/YYYY")
                : "Vừa tải lên"}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={docType.label}
          onClick={() =>
            onClassify(
              file.id || file.localId,
              nextDocType(file.doc_type || "KHAC")
            )
          }
          sx={{
            fontWeight: 700,
            fontSize: "11px",
            height: "26px",
            borderRadius: "6px",
            bgcolor: docType.color,
            color: docType.textColor,
            cursor: "pointer",
            border: "1px solid transparent",
            "&:hover": { opacity: 0.8, borderColor: docType.textColor },
          }}
        />
        <IconButton
          size="small"
          onClick={() => onRemove(file.id || file.localId, isPending)}
          sx={{
            color: "#94a3b8",
            "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" },
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>
    </Paper>
  );
};

const Step4Attachment = ({
  batchId,
  attachments = [],
  onAttachmentsChange,
  pendingFiles = [],
  onPendingFilesChange,
  errors = {},
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const error = errors.attachment_section;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast("File không được vượt quá 20MB", "error");
      return;
    }

    const newPendingItem = {
      localId: Date.now(),
      file: file,
      name: file.name,
      doc_type: "KHAC",
    };

    onPendingFilesChange([...pendingFiles, newPendingItem]);
    e.target.value = null;
  };

  const handleRemove = async (id, isPending) => {
    if (isPending) {
      onPendingFilesChange(pendingFiles.filter((f) => f.localId !== id));
    } else {
      try {
        const res = await asxhService.deleteDisbursementAttachment(batchId, id);
        if (res.success) {
          toast("Đã xóa chứng từ", "success");
          onAttachmentsChange(attachments.filter((a) => a.id !== id));
        }
      } catch (error) {
        toast("Lỗi khi xóa chứng từ", "error");
      }
    }
  };

  const handleClassify = async (id, docType) => {
    const isPending = pendingFiles.some((f) => f.localId === id);

    if (isPending) {
      onPendingFilesChange(
        pendingFiles.map((f) =>
          f.localId === id ? { ...f, doc_type: docType } : f
        )
      );
    } else {
      // Local update only - parent will save later
      const nextAttachments = attachments.map((a) =>
        a.id === id ? { ...a, doc_type: docType, isDirty: true } : a
      );
      onAttachmentsChange(nextAttachments);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar
          sx={{
            bgcolor: "#3B82F6",
            width: 26,
            height: 26,
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          4
        </Avatar>
        <Typography fontWeight={700} color="#0f172a" sx={{ fontSize: "17px" }}>
          Chứng từ & Biên bản đính kèm
        </Typography>
      </Stack>

      <Paper
        id="attachment_section"
        elevation={0}
        sx={{
          p: 4,
          borderRadius: "12px",
          border: error ? "2px solid #ef4444" : "1px solid #e2e8f0",
          bgcolor: "#fff",
          transition: "border 0.2s ease",
        }}
      >
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        />

        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: error ? "1.5px dashed #fecaca" : "1.5px dashed #cbd5e1",
            borderRadius: "12px",
            p: 5,
            textAlign: "center",
            bgcolor: error ? "#fffbfa" : "#f8fafc",
            cursor: "pointer",
            transition: "0.2s ease-in-out",
            mb: 4,
            "&:hover": { borderColor: "#3B82F6", bgcolor: "#f0f9ff" },
          }}
        >
          <UploadIcon
            sx={{ fontSize: 32, color: error ? "#ef4444" : "#94a3b8", mb: 1.5 }}
          />
          <Typography
            variant="body2"
            fontWeight={700}
            color={error ? "#ef4444" : "#475569"}
            mb={0.5}
            sx={{ fontSize: "14px" }}
          >
            Kéo thả file hoặc nhấn để chọn
          </Typography>
          <Typography
            variant="caption"
            color={error ? "#f87171" : "text.secondary"}
            sx={{ fontSize: "12px" }}
          >
            Biên bản ký, UNC, hợp đồng, dự toán — PDF, Word, Excel, ảnh • Tối đa
            20MB
          </Typography>
        </Box>

        {error && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fee2e2",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#ef4444",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: "16px" }}>⚠️</span> {error}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            minHeight:
              attachments.length > 0 || pendingFiles.length > 0 ? "auto" : 0,
          }}
        >
          {attachments.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isPending={false}
              onRemove={handleRemove}
              onClassify={handleClassify}
            />
          ))}

          {pendingFiles.map((item) => (
            <FileItem
              key={item.localId}
              file={item}
              isPending={true}
              onRemove={handleRemove}
              onClassify={handleClassify}
            />
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color="#475569"
            sx={{ display: "block", mb: 1, fontSize: "13px" }}
          >
            Phân loại chứng từ
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", lineHeight: 1.6, fontSize: "12px" }}
          >
            Gắn nhãn cho từng tệp đã upload ở trên bằng cách click vào badge
            loại chứng từ
            <span style={{ color: "#475569", fontWeight: 700 }}>
              {" "}
              (Biên bản ký / UNC / Hợp đồng / Dự toán / Ảnh tiến độ)
            </span>
            . Biên bản ký xác nhận là{" "}
            <strong style={{ color: "#ef4444" }}>bắt buộc</strong> trước khi gửi
            phê duyệt.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Step4Attachment;
