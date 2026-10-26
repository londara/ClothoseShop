"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterForm() {
  return (
    <form
      className="mt-1.5 flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        e.currentTarget.reset()
        toast.success("សូមអរគុណ! អ្នកបានចុះឈ្មោះទទួលព័ត៌មានដោយជោគជ័យ។")
      }}
    >
      <Input
        type="email"
        required
        placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
        className="h-10 flex-1 rounded-full bg-card px-5 text-[13px] focus-visible:border-ring"
      />
      <Button type="submit" className="h-10 rounded-full px-5 text-xs font-bold">
        ចូលរួម
      </Button>
    </form>
  )
}
