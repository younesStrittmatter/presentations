import type { CanvasStyleDefinition, CanvasStyleId } from "./types";
import { styleDefault, styleMinimal, styleNoir, styleRetroComic } from "./presets";

const registry = new Map<CanvasStyleId, CanvasStyleDefinition>();

/** Call from app setup to add or replace a style. */
export function registerCanvasStyle(def: CanvasStyleDefinition): void {
  registry.set(def.id, def);
}

export function getCanvasStyle(id: CanvasStyleId | undefined | null): CanvasStyleDefinition {
  const key = id?.trim() || "default";
  const found = registry.get(key);
  if (found) return found;
  return registry.get("default")!;
}

export function listCanvasStyleIds(): string[] {
  return [...registry.keys()].sort();
}

function installBuiltIns(): void {
  for (const s of [styleDefault, styleRetroComic, styleNoir, styleMinimal]) {
    registry.set(s.id, s);
  }
}

installBuiltIns();
