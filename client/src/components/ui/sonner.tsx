"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={2000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "text-base font-medium shadow-lg backdrop-blur-sm bg-popover/95 border border-border",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-sm font-medium rounded-md",
          cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80 px-3 py-1.5 text-sm font-medium rounded-md"
        }
      }}
      {...props}
    />
  )
}

export { Toaster }