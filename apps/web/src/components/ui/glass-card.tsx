import { cn } from "@/lib/utils"

interface GlassCardProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
