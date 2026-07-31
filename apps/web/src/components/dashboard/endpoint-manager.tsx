"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToggleEndpoint, useDeleteEndpoint } from "@/hooks/use-provider"
import { AddEndpointDialog } from "./add-endpoint-dialog"

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

interface EndpointManagerProps {
  endpoints: Endpoint[]
  isLoading?: boolean
}

export function EndpointManager({ endpoints, isLoading }: EndpointManagerProps) {
  const [addOpen, setAddOpen] = React.useState(false)
  const [editEndpoint, setEditEndpoint] = React.useState<Endpoint | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const toggleMutation = useToggleEndpoint()
  const deleteMutation = useDeleteEndpoint()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Endpoint Management</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Endpoint
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {endpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium">No endpoints yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first endpoint to start serving requests.
            </p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus />
              Add Endpoint
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {endpoints.map((ep) => (
                  <motion.tr
                    key={ep.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{ep.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{ep.modelName}</TableCell>
                    <TableCell>{parseFloat(ep.pricePerRequest).toFixed(4)} XLM</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ep.isActive}
                          onCheckedChange={() => toggleMutation.mutate(ep.id)}
                          size="sm"
                        />
                        <span className="flex items-center gap-1.5 text-sm">
                          <span
                            className={`inline-block size-2 rounded-full ${
                              ep.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {ep.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{Number(ep.totalRequests).toLocaleString()}</TableCell>
                    <TableCell>
                      {ep.averageRating > 0 ? ep.averageRating.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditEndpoint(ep)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => setDeleteId(ep.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddEndpointDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      {editEndpoint && (
        <AddEndpointDialog
          open={!!editEndpoint}
          onOpenChange={(open) => { if (!open) setEditEndpoint(null) }}
          endpoint={editEndpoint}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this endpoint? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId)
                setDeleteId(null)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
