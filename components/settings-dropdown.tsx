"use client"

import { Settings, User, Book, LifeBuoy, Palette } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "@/components/theme-selector"

export function SettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Selector */}
        <div className="p-2">
          <ThemeSelector />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Book className="h-4 w-4" />
          <span>Documentation</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <LifeBuoy className="h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}