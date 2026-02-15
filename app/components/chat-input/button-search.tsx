import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonSearchProps = {
  isSelected?: boolean
  onToggle?: (isSelected: boolean) => void
}

export function ButtonSearch({
  isSelected = false,
  onToggle,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected
    onToggle?.(newState)
  }

  return (
    <Button
      variant="secondary"
      className={cn(
        "border-border dark:bg-secondary rounded-full border bg-transparent transition-all duration-150 has-[>svg]:px-1.75 md:has-[>svg]:px-3",
        isSelected &&
          "border-[#0091FF]/20 bg-[#E5F3FE] text-[#0091FF] hover:bg-[#E5F3FE] hover:text-[#0091FF]"
      )}
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      Search
    </Button>
  )
}
