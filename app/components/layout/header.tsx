import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useSidebar } from "@/components/ui/sidebar"
import { APP_NAME } from "@/lib/config"
import Link from "next/link"
import { HeaderSidebarTrigger } from "./header-sidebar-trigger"

export function Header({ hasSidebar }: { hasSidebar: boolean }) {
  const isMobile = useBreakpoint(768)
  const { open, isMobile: isSidebarMobile } = useSidebar()
  const sidebarOffset =
    hasSidebar && !isSidebarMobile
      ? open
        ? "var(--sidebar-width)"
        : "var(--sidebar-width-collapsed)"
      : "0px"

  return (
    <header
      className="h-app-header pointer-events-none fixed top-0 right-0 left-0 z-50 transition-[padding] duration-300 ease-linear"
      style={{ paddingLeft: sidebarOffset }}
    >
      <div className="relative mx-auto flex h-full max-w-full items-center justify-between bg-transparent px-4 sm:px-6 lg:bg-transparent lg:px-8">
        <div className="flex flex-1 items-center justify-between">
          <div className="-ml-0.5 flex flex-1 items-center gap-2 lg:-ml-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Link
                href="/"
                className="pointer-events-auto inline-flex max-w-full items-center text-xl font-medium tracking-tight"
              >
                <span className="truncate">{APP_NAME}</span>
              </Link>
              {hasSidebar && isMobile && <HeaderSidebarTrigger />}
            </div>
          </div>

          <div className="flex items-center gap-2" />
        </div>
      </div>
    </header>
  )
}
