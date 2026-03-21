import type { DmdConfig } from "@/dmd/config"

interface DevOverlayProps {
  config: DmdConfig
  onChange: (config: DmdConfig) => void
}

export function DevOverlay({ config, onChange }: DevOverlayProps) {
  const dotCount = config.cols * config.rows

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: 14,
        zIndex: 100,
        color: "#ccc",
        fontFamily: "monospace",
        fontSize: 12,
        minWidth: 200,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: "bold", color: "#fff" }}>DMD Dev</div>

      <label style={{ display: "block", marginBottom: 6 }}>
        Cols: {config.cols}
        <input
          type="range"
          min={64}
          max={256}
          step={1}
          value={config.cols}
          onChange={(e) => {
            const cols = Number(e.target.value)
            const rows = Math.round(cols * (9 / 16))
            onChange({ ...config, cols, rows })
          }}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <div style={{ marginBottom: 6, color: "#888" }}>
        Grid: {config.cols}×{config.rows} ({dotCount.toLocaleString()} dots)
      </div>

      <label style={{ display: "block", marginBottom: 6 }}>
        Dot color:
        <input
          type="color"
          value={config.dotColor}
          onChange={(e) => {
            onChange({ ...config, dotColor: e.target.value })
          }}
          style={{ marginLeft: 8, verticalAlign: "middle" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 6 }}>
        Gap: {(config.gapRatio * 100).toFixed(0)}%
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={config.gapRatio * 100}
          onChange={(e) => {
            onChange({ ...config, gapRatio: Number(e.target.value) / 100 })
          }}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 6 }}>
        Ghost: {(config.offOpacity * 100).toFixed(0)}%
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={config.offOpacity * 100}
          onChange={(e) => {
            onChange({ ...config, offOpacity: Number(e.target.value) / 100 })
          }}
          style={{ display: "block", width: "100%" }}
        />
      </label>
    </div>
  )
}
