import { cva, type VariantProps } from "class-variance-authority";
import { Platform, TextInput, type TextInputProps } from "react-native";
import { useUniwind } from "uniwind";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  cn(
    "border-input bg-background text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-base shadow-sm shadow-black/5",
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
        default: "h-10 sm:h-9",
        sm: "h-9 sm:h-8 text-sm",
        lg: "h-12 sm:h-11",
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

type InputProps = TextInputProps &
  React.RefAttributes<TextInput> &
  VariantProps<typeof inputVariants>;

function Input({ className, size, editable = true, ...props }: InputProps) {
  const { theme } = useUniwind();

  return (
    <TextInput
      className={cn(
        inputVariants({ size }),
        !editable &&
          cn(
            "opacity-50",
            Platform.select({ web: "pointer-events-none cursor-not-allowed" }),
          ),
        className,
      )}
      editable={editable}
      placeholderTextColor={PLACEHOLDER_COLOR[theme ?? "light"]}
      {...props}
    />
  );
}

export { Input, inputVariants };
export type { InputProps };
