export function SocketStatus() {
  return (
    <div className="text-right">
      <div className="mb-1 flex items-center justify-end gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
        <span className="text-[10px] tracking-widest text-yellow-400/70 uppercase">Offline</span>
      </div>
      <div className="text-[10px] tracking-widest text-cyan-400/25">socket non connecté</div>
    </div>
  )
}
