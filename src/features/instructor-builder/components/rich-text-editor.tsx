"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { common, createLowlight } from "lowlight";

import { Button } from "@/components/ui/button";

/**
 * Bilingual rich-text editor (P04-T05).
 *
 * Tiptap with a small, deliberate toolbar; the server sanitises the HTML before storage, so nothing
 * this editor can produce (or a pasted payload) is trusted. Code blocks are highlighted with
 * lowlight and keep their classes through the sanitiser so the learner player can colour them.
 */

const lowlight = createLowlight(common);

export function RichTextEditor({
  id,
  label,
  initialContent,
  dir,
  onChange,
  onLengthChange,
}: {
  id: string;
  label: string;
  initialContent: string;
  dir: "rtl" | "ltr";
  onChange: (html: string) => void;
  onLengthChange: (length: number) => void;
}) {
  const t = useTranslations("LessonContent");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text focus:outline-2 focus:outline-offset-2 focus:outline-ring",
        dir,
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
      onLengthChange(instance.getText().trim().length);
    },
  });

  if (editor === null) {
    return (
      <div className="rounded-sm border border-border-strong bg-surface p-3 text-sm text-muted-foreground">
        {t("editorLoading")}
      </div>
    );
  }

  const buttons = [
    {
      label: t("bold"),
      icon: Bold,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: t("italic"),
      icon: Italic,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: t("strike"),
      icon: Strikethrough,
      active: editor.isActive("strike"),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: t("heading2"),
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: t("heading3"),
      icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: t("bulletList"),
      icon: List,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: t("orderedList"),
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: t("codeBlock"),
      icon: Code2,
      active: editor.isActive("codeBlock"),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: t("quote"),
      icon: Quote,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div id={id}>
      <div className="flex flex-wrap gap-1 rounded-t-sm border border-b-0 border-border-strong bg-muted p-1">
        {buttons.map((button) => (
          <Button
            key={button.label}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={button.label}
            aria-pressed={button.active}
            className={button.active ? "bg-surface text-foreground" : ""}
            onClick={button.run}
          >
            <button.icon aria-hidden="true" />
          </Button>
        ))}
        <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("undo")}
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("redo")}
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" />
        </Button>
      </div>
      <div className="rounded-b-sm border border-border-strong bg-surface px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
