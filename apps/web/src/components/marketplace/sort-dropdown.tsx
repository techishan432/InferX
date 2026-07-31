"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SORT_OPTIONS } from "@/lib/constants"

interface SortDropdownProps {
  value: string
  onValueChange: (value: string) => void
}

export function SortDropdown({ value, onValueChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => { if (v) onValueChange(v) }}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
