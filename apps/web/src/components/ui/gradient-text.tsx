import { cn } from "@/lib/utils"

interface GradientTextProps extends React.ComponentProps<"span"> {
  children: React.ReactNode
}

export function GradientText({ className, children, ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-600 dark:from-cyan-400 dark:via-cyan-300 dark:to-violet-500 bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
