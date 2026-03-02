import { cn } from "@/lib/utils"

function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-input animate-shimmer rounded-md bg-[length:200%_100%]",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.4) 50%, transparent 100%)",
        ...style,
      }}
      {...props}
    />
  )
}

export { Skeleton }
