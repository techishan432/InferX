"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCreateEndpoint, useUpdateEndpoint } from "@/hooks/use-provider"

interface EndpointFormData {
  modelName: string
  displayName: string
  description: string
  baseUrl: string
  apiKey: string
  pricePerRequest: string
  maxInputTokens: string
  maxOutputTokens: string
  contextLength: string
  rateLimit: string
  location: string
  supportsStreaming: boolean
  supportsVision: boolean
}

interface Endpoint {
  id: string
  modelName: string
  displayName: string
  description: string | null
  pricePerRequest: string
  isActive: boolean
  totalRequests: string
  healthStatus: string
  averageRating: number
  totalReviews: number
  createdAt: string
}

interface AddEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint?: Endpoint | null
}

const emptyForm: EndpointFormData = {
  modelName: "",
  displayName: "",
  description: "",
  baseUrl: "",
  apiKey: "",
  pricePerRequest: "",
  maxInputTokens: "4096",
  maxOutputTokens: "2048",
  contextLength: "8192",
  rateLimit: "60",
  location: "",
  supportsStreaming: true,
  supportsVision: false,
}

export function AddEndpointDialog({ open, onOpenChange, endpoint }: AddEndpointDialogProps) {
  const isEditing = !!endpoint
  const [form, setForm] = React.useState<EndpointFormData>(emptyForm)
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof EndpointFormData, string>>>({})

  const createMutation = useCreateEndpoint()
  const updateMutation = useUpdateEndpoint()

  React.useEffect(() => {
    if (endpoint) {
      setForm({
        modelName: endpoint.modelName,
        displayName: endpoint.displayName,
        description: endpoint.description ?? "",
        baseUrl: "",
        apiKey: "",
        pricePerRequest: endpoint.pricePerRequest,
        maxInputTokens: "4096",
        maxOutputTokens: "2048",
        contextLength: "8192",
        rateLimit: "60",
        location: "",
        supportsStreaming: true,
        supportsVision: false,
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [endpoint, open])

  function validate(): boolean {
    const e: Partial<Record<keyof EndpointFormData, string>> = {}
    if (!form.modelName.trim()) e.modelName = "Required"
    if (!form.displayName.trim()) e.displayName = "Required"
    if (!form.baseUrl.trim() && !isEditing) e.baseUrl = "Required"
    if (!form.apiKey && !isEditing) e.apiKey = "Required"
    if (!form.pricePerRequest || parseFloat(form.pricePerRequest) <= 0)
      e.pricePerRequest = "Must be greater than 0"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    const data = {
      modelName: form.modelName,
      displayName: form.displayName,
      description: form.description,
      baseUrl: form.baseUrl,
      apiKey: form.apiKey,
      pricePerRequest: form.pricePerRequest,
      maxInputTokens: parseInt(form.maxInputTokens),
      maxOutputTokens: parseInt(form.maxOutputTokens),
      contextLength: parseInt(form.contextLength),
      rateLimit: parseInt(form.rateLimit),
      supportsStreaming: form.supportsStreaming,
      supportsVision: form.supportsVision,
    }

    if (isEditing && endpoint) {
      updateMutation.mutate(
        { id: endpoint.id, data },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your endpoint configuration."
              : "Configure a new AI endpoint to serve requests."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Model Name</label>
              <Input
                value={form.modelName}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                placeholder="gpt-4o"
              />
              {errors.modelName && <p className="text-xs text-red-500">{errors.modelName}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="GPT-4o"
              />
              {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your endpoint..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Base URL</label>
              <Input
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
              {errors.baseUrl && <p className="text-xs text-red-500">{errors.baseUrl}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={isEditing ? "Leave blank to keep" : "sk-..."}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-muted-foreground"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.apiKey && <p className="text-xs text-red-500">{errors.apiKey}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Price/Request</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.pricePerRequest}
                  onChange={(e) => setForm({ ...form, pricePerRequest: e.target.value })}
                  placeholder="0.001"
                />
                <span className="text-xs text-muted-foreground">XLM</span>
              </div>
              {errors.pricePerRequest && <p className="text-xs text-red-500">{errors.pricePerRequest}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max Input Tokens</label>
              <Input
                type="number"
                value={form.maxInputTokens}
                onChange={(e) => setForm({ ...form, maxInputTokens: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max Output Tokens</label>
              <Input
                type="number"
                value={form.maxOutputTokens}
                onChange={(e) => setForm({ ...form, maxOutputTokens: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Context Length</label>
              <Input
                type="number"
                value={form.contextLength}
                onChange={(e) => setForm({ ...form, contextLength: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rate Limit/min</label>
              <Input
                type="number"
                value={form.rateLimit}
                onChange={(e) => setForm({ ...form, rateLimit: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="US-East"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.supportsStreaming}
                onCheckedChange={(checked) => setForm({ ...form, supportsStreaming: checked as boolean })}
              />
              <label className="text-sm font-medium">Supports Streaming</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.supportsVision}
                onCheckedChange={(checked) => setForm({ ...form, supportsVision: checked as boolean })}
              />
              <label className="text-sm font-medium">Supports Vision</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Endpoint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
