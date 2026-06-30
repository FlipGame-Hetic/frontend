export interface ControlHintDescriptor {
  action: string
  cabinet: { token: string; filled: boolean }
  browser: { kind: "text"; label: string } | { kind: "arrow"; rotate: string }
}

export const MENU_CONTROLS = {
  navigateLeft: {
    action: "NAVIGUER",
    cabinet: { token: "L2", filled: false },
    browser: { kind: "arrow", rotate: "rotate(-90deg)" },
  },
  back: {
    action: "RETOUR",
    cabinet: { token: "L1", filled: true },
    browser: { kind: "text", label: "ÉCHAP" },
  },
  navigateRight: {
    action: "NAVIGUER",
    cabinet: { token: "R2", filled: false },
    browser: { kind: "arrow", rotate: "rotate(90deg)" },
  },
  confirm: {
    action: "VALIDER",
    cabinet: { token: "R1", filled: true },
    browser: { kind: "text", label: "ENTRÉE" },
  },
} as const satisfies Record<string, ControlHintDescriptor>
