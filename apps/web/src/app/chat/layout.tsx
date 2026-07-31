export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-white">inferX</span>
          <span className="text-xs text-zinc-600">/</span>
          <span className="text-xs text-zinc-400">Chat</span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
