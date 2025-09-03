"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelRight, Menu } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"
import { useMediaQuery } from "@/hooks/use-media-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Constants for sidebar width and keyboard shortcut
const SIDEBAR_WIDTH = "360px"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const SIDEBAR_COOKIE_NAME = "sidebar_state"

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  isMobile: boolean
  isResizing: boolean
  width?: string
  mobileWidth?: string
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  isMobile: false,
  isResizing: false,
})

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  style?: Record<string, string>
}

export function SidebarProvider({
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  children,
  style,
  ...props
}: SidebarProviderProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Handle controlled or uncontrolled open state
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [isResizing, setIsResizing] = React.useState(false)

  // Handle hydration and cookie reading after mount
  React.useEffect(() => {
    setIsMounted(true)
    
    // Only read cookies after hydration
    if (controlledOpen === undefined) {
      const match = document.cookie.match(new RegExp(`(^| )${SIDEBAR_COOKIE_NAME}=([^;]+)`))
      if (match) {
        const cookieValue = match[2] === 'open'
        setUncontrolledOpen(cookieValue)
      }
    }
  }, [controlledOpen])

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback(
    (open: boolean) => {
      // Set cookie to persist state only after mount
      if (isMounted) {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open ? "open" : "closed"}; path=/; max-age=31536000; SameSite=Lax`
      }
      
      if (onOpenChange) {
        onOpenChange(open)
      } else {
        setUncontrolledOpen(open)
      }
    },
    [onOpenChange, isMounted]
  )

  const toggle = React.useCallback(() => {
    setOpen(!open)
  }, [open, setOpen])

  // Handle keyboard shortcut
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = /(macintosh|macintel|macppc|mac68k|macos)/i.test(
        navigator.userAgent
      )
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        ((isMac && event.metaKey) || (!isMac && event.ctrlKey))
      ) {
        event.preventDefault()
        toggle()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [toggle])

  // Sidebar width CSS variables
  const width = style?.["--sidebar-width"] || SIDEBAR_WIDTH
  const mobileWidth = style?.["--sidebar-width-mobile"] || SIDEBAR_WIDTH_MOBILE

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        toggle,
        isMobile,
        isResizing,
        width,
        mobileWidth,
      }}
    >
      <div
        data-sidebar-open={open}
        className="transition-all duration-300"
        style={{
          "--sidebar-width": width,
          "--sidebar-width-mobile": mobileWidth,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// Sidebar Trigger
type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { toggle } = useSidebar()
  
  return (
    <button
      className={cn("p-2 rounded-full hover:bg-primary/10 transition-colors", className)}
      onClick={toggle}
      {...props}
    >
      <Menu className="h-5 w-5 text-muted-foreground" />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  )
}

// Main Sidebar Component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { open, isMobile, width, mobileWidth } = useSidebar()
  
  return (
    <aside
      data-state={open ? "open" : "closed"}
      className={cn(
        " top-0 px-9 left-0 flex h-[calc(100vh-4rem)] flex-col bg-background border-r border-border transition-all duration-300 z-30",
        isMobile ? (open ? "translate-x-0" : "-translate-x-full") : "",
        className
      )}
      style={{
        width: isMobile ? (open ? mobileWidth : "0") : (open ? width : "360px"),
      }}
      {...props}
    />
  )
}

// Sidebar Header
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  return (
    <header
      className={cn(
        "top-0 flex w-full h-[100px] items-center border-none border-border ",
        className
      )}
      {...props}
    />
  )
}

// Sidebar Footer
interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return (
    <footer
      className={cn(
        "sticky bottom-0 flex items-center   mt-auto p-4",
        className
      )}
      {...props}
    />
  )
}

// Sidebar Content
interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto ", className)}
      {...props}
    />
  )
}

// Sidebar Group
interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SidebarGroup({ className, ...props }: SidebarGroupProps) {
  return <div className={cn(" space-y-2", className)} {...props} />
}

// Sidebar Group Label
interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
}

export function SidebarGroupLabel({ className, ...props }: SidebarGroupLabelProps) {
  return (
    <h3
      className={cn(
        "mb-2 px-4 text-xs font-medium text-sidebar-foreground/70",
        className
      )}
      {...props}
    />
  )
}

// Sidebar Group Content
interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SidebarGroupContent({ className, ...props }: SidebarGroupContentProps) {
  return <div className={cn("space-y-1", className)} {...props} />
}

// Sidebar Menu
interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string
}

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return (
    <ul className={cn("space-y-2", className)} role="menu" {...props} />
  )
}

// Sidebar Menu Item
interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string
}

export function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
  return (
    <li
      className={cn("list-none", className)}
      role="menuitem"
      {...props}
    />
  )
}

// Sidebar Menu Button Variants
const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-primary/5 hover:text-primary group",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-foreground data-[active]:bg-primary/10 data-[active]:text-primary data-[active]:shadow-sm",
        ghost:
          "bg-transparent hover:bg-transparent hover:text-foreground data-[active]:bg-transparent data-[active]:text-foreground",
        link:
          "bg-transparent text-primary underline-offset-4 hover:bg-transparent hover:underline data-[active]:bg-transparent data-[active]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Sidebar Menu Button
interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  active?: boolean
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    { className, variant, asChild = false, active, type, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        type={asChild ? undefined : type ?? "button"}
        className={cn(sidebarMenuButtonVariants({ variant }), className)}
        ref={ref}
        data-active={active || undefined}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

// Sidebar Collapse Trigger
interface SidebarCollapseTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export function SidebarCollapseTrigger({
  className,
  ...props
}: SidebarCollapseTriggerProps) {
  const { open, toggle } = useSidebar()
  
  return (
    <button 
      className={cn(
        "p-2 rounded-full hover:bg-primary/10 transition-colors",
        className
      )}
      onClick={toggle}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      {...props}
    >
      {open ? (
        <PanelRight className="h-5 w-5 text-muted-foreground" />
      ) : (
        <PanelRight className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  )
}
