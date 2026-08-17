import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled box to handle common Tiptap/HTML formatting
const ContentWrapper = styled(Box)(({ theme }) => ({
  "& p": { marginBottom: theme.spacing(2), lineHeight: 1.6 },
  "& h1, & h2, & h3": { marginTop: theme.spacing(3), marginBottom: theme.spacing(1.5), fontWeight: 700 },
  "& ul, & ol": { paddingLeft: theme.spacing(3), marginBottom: theme.spacing(2) },
  "& li": { marginBottom: theme.spacing(0.5) },
  "& img": { maxWidth: "100%", height: "auto", borderRadius: theme.shape.borderRadius },
  "& table": { borderCollapse: "collapse", width: "100%", marginBottom: theme.spacing(2) },
  "& th, & td": { border: `1px solid ${theme.palette.divider}`, padding: theme.spacing(1), textAlign: "left" },
  "& blockquote": { borderLeft: `4px solid ${theme.palette.primary.main}`, paddingLeft: theme.spacing(2), fontStyle: "italic", marginLeft: 0 },
  "& pre": { backgroundColor: theme.palette.grey[100], padding: theme.spacing(1.5), borderRadius: theme.shape.borderRadius, overflowX: "auto" },
  "& a": { color: theme.palette.primary.main, textDecoration: "none", "&:hover": { textDecoration: "underline" } },
}));

const RichTextRenderer = ({ html, sx = {} }) => {
  if (!html) return null;

  return (
    <ContentWrapper 
      dangerouslySetInnerHTML={{ __html: html }} 
      sx={sx}
    />
  );
};

export default RichTextRenderer;
