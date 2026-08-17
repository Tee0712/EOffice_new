import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Box, Divider, IconButton, Stack, Tooltip } from "@mui/material";
import {
  AddPhotoAlternate,
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatUnderlined,
  InsertLink,
  StrikethroughS,
  Title,
} from "@mui/icons-material";

const MenuButton = ({ onClick, active, icon, title, disabled }) => (
  <Tooltip title={title} arrow>
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
        color={active ? "primary" : "default"}
        sx={{
          borderRadius: "4px",
          bgcolor: active ? "primary.lighter" : "transparent",
          "&:hover": { bgcolor: active ? "primary.light" : "grey.100" },
        }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

const TiptapEditor = ({
  value,
  onChange,
  placeholder = "Nhập nội dung thông báo...",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none",
        style:
          "min-height: 220px; padding: 14px; font-size: 15px; outline: none;",
        placeholder,
      },
    },
  });

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "grey.300",
        borderRadius: "10px",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          p: 0.75,
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={<FormatBold />}
          title="In đậm (Ctrl+B)"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={<FormatItalic />}
          title="In nghiêng (Ctrl+I)"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          icon={<FormatUnderlined />}
          title="Gạch chân (Ctrl+U)"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          icon={<StrikethroughS />}
          title="Gạch ngang"
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          icon={<Title fontSize="small" />}
          title="Heading 1"
        />
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          icon={<Title sx={{ fontSize: 18 }} />}
          title="Heading 2"
        />
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          icon={<Title sx={{ fontSize: 16 }} />}
          title="Heading 3"
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          icon={<FormatAlignLeft />}
          title="Căn trái"
        />
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          icon={<FormatAlignCenter />}
          title="Căn giữa"
        />
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          icon={<FormatAlignRight />}
          title="Căn phải"
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          icon={<FormatListBulleted />}
          title="Danh sách dấu chấm"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          icon={<FormatListNumbered />}
          title="Danh sách số"
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <MenuButton
          onClick={() => {
            const url = window.prompt("URL liên kết:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          icon={<InsertLink />}
          title="Chèn liên kết"
        />
        <MenuButton
          onClick={() => {
            const url = window.prompt("URL hình ảnh:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          icon={<AddPhotoAlternate />}
          title="Chèn hình ảnh"
        />
      </Stack>

      <Box
        sx={{ minHeight: "220px", cursor: "text" }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default TiptapEditor;
