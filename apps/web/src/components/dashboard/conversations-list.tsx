import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"

interface Conversation {
  id: string
  endpointName: string
  lastMessage: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface ConversationsListProps {
  conversations: Conversation[]
  isLoading?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ConversationsList({ conversations, isLoading }: ConversationsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <MessageSquare className="size-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No conversations yet.</p>
            <Button variant="outline" className="mt-4">
              <Link href="/marketplace">Start a Chat</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 6).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
              >
                <Link href={`/chat/${conv.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{conv.endpointName}</p>
                  <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {conv.messageCount} messages · {formatDate(conv.updatedAt)}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
