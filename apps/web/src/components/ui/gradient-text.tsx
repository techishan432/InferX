import { cn } from "@/lib/utils"

interface GradientTextProps extends React.ComponentProps<"span"> {
  children: React.ReactNode
}

export function GradientText({ className, children, ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
