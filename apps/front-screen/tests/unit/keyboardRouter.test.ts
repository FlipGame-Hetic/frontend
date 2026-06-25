import { afterEach, describe, expect, it, vi } from "vitest"
import {
  registerBinding,
  unregisterBinding,
  type KeyBinding,
  type KeyMatchMode,
} from "@/input/keyboardRouter"

const activeBindings: KeyBinding[] = []

const bind = (
  keys: string[],
  onPress: (e: KeyboardEvent) => void,
  options: { match?: KeyMatchMode; when?: () => boolean } = {},
): KeyBinding => {
  const binding: KeyBinding = {
    keys: new Set(keys),
    match: options.match ?? "code",
    onPress,
    when: options.when,
  }

  registerBinding(binding)
  activeBindings.push(binding)
  return binding
}

const dispatchKeyDown = (
  target: EventTarget,
  init: KeyboardEventInit & { code: string; key: string },
): void => {
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }))
}

afterEach(() => {
  for (const binding of activeBindings.splice(0)) {
    unregisterBinding(binding)
  }

  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

describe("keyboardRouter", () => {
  it("ignores repeated keydown events", () => {
    const handler = vi.fn()
    bind(["KeyS"], handler)

    dispatchKeyDown(window, { code: "KeyS", key: "s", repeat: true })

    expect(handler).not.toHaveBeenCalled()
  })

  it("ignores keydown events from typing targets", () => {
    const handler = vi.fn()
    const input = document.createElement("input")
    document.body.append(input)
    bind(["KeyS"], handler)

    dispatchKeyDown(input, { code: "KeyS", key: "s" })

    expect(handler).not.toHaveBeenCalled()
  })

  it("matches produced characters in key mode", () => {
    const handler = vi.fn()
    bind(["m"], handler, { match: "key" })

    dispatchKeyDown(window, { code: "Semicolon", key: "M" })

    expect(handler).toHaveBeenCalledOnce()
  })

  it("matches physical key codes in code mode", () => {
    const handler = vi.fn()
    bind(["ControlLeft"], handler)

    dispatchKeyDown(window, { code: "ControlLeft", key: "Control" })

    expect(handler).toHaveBeenCalledOnce()
  })

  it("skips bindings when their when predicate returns false", () => {
    const handler = vi.fn()
    bind(["ArrowUp"], handler, { when: () => false })

    dispatchKeyDown(window, { code: "ArrowUp", key: "ArrowUp" })

    expect(handler).not.toHaveBeenCalled()
  })

  it("unregisters bindings and detaches the listener after the last binding", () => {
    const addSpy = vi.spyOn(window, "addEventListener")
    const removeSpy = vi.spyOn(window, "removeEventListener")
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const firstBinding = bind(["KeyA"], firstHandler)
    const secondBinding = bind(["KeyD"], secondHandler)

    unregisterBinding(firstBinding)
    dispatchKeyDown(window, { code: "KeyA", key: "a" })
    dispatchKeyDown(window, { code: "KeyD", key: "d" })

    expect(addSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).not.toHaveBeenCalled()
    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledOnce()

    unregisterBinding(secondBinding)
    dispatchKeyDown(window, { code: "KeyD", key: "d" })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(secondHandler).toHaveBeenCalledOnce()
  })
})
