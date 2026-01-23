import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { Platform, TextInput, type TextInputProps } from "react-native";
import { useUniwind } from "uniwind";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  cn(
    "border-input bg-background text-foreground flex w-full rounded-md border px-3 py-2 text-base shadow-sm shadow-black/5",
    "dark:bg-input/30",
    Platform.select({
      web: cn(
        "placeholder:text-muted-foreground",
        "outline-none transition-[color,box-shadow]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      ),
    }),
  ),
  {
    variants: {
      size: {
        default: "min-h-20",
        sm: "min-h-12 text-sm",
        lg: "min-h-28",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const PLACEHOLDER_COLOR = {
  light: "#737373",
  dark: "#a3a3a3",
} as const;

const MAX_HEIGHT = {
  default: 200,
  sm: 120,
  lg: 280,
} as const;

type TextAreaProps = TextInputProps &
  React.RefAttributes<TextInput> &
  VariantProps<typeof textareaVariants> & {
    autoGrow?: boolean;
  };

function TextArea({
  className,
  size,
  editable = true,
  autoGrow = true,
  style,
  ...props
}: TextAreaProps) {
  const { theme } = useUniwind();
  const [height, setHeight] = useState<number | undefined>(undefined);
  const maxHeight = MAX_HEIGHT[size ?? "default"];

  return (
    <TextInput
      className={cn(
        textareaVariants({ size }),
        !editable &&
          cn(
            "opacity-50",
            Platform.select({ web: "pointer-events-none cursor-not-allowed" }),
          ),
        className,
      )}
      style={[
        autoGrow && height
          ? { height: Math.min(height, maxHeight) }
          : undefined,
        style,
      ]}
      editable={editable}
      multiline
      textAlignVertical="top"
      placeholderTextColor={PLACEHOLDER_COLOR[theme ?? "light"]}
      onContentSizeChange={
        autoGrow
          ? (e) => setHeight(e.nativeEvent.contentSize.height + 16)
          : undefined
      }
      {...props}
    />
  );
}

export { TextArea, textareaVariants };
export type { TextAreaProps };
