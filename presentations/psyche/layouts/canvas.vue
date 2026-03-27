<script setup lang="ts">
/**
 * Slidev layout: GPU canvas slide (see presentation.config.json renderMode + canvas-scenes.ts).
 */
import { computed } from "vue";
import { useNav, useSlideContext } from "@slidev/client";
import CanvasWebGLSlide from "../../../engine/components/CanvasWebGLSlide.vue";
import scenes from "../canvas-scenes";

/** Per-slide content — do not use global currentSlideNo or inactive slides fight the active one. */
const { $page } = useSlideContext();
const nav = useNav();

/**
 * Map current page to canvas-scene index by counting only slides that use
 * `layout: canvas` up to the current page. This avoids page-number drift when
 * non-canvas slides (e.g. feedback/markdown) are inserted.
 */
const canvasSceneIndex = computed(() => {
  const page = Math.max(1, $page.value);
  const slides = nav?.slides?.value ?? [];
  let canvasCount = 0;
  for (let i = 0; i < Math.min(page, slides.length); i++) {
    const s = slides[i] as
      | { layout?: string; meta?: { layout?: string }; frontmatter?: { layout?: string } }
      | undefined;
    const layout = s?.layout ?? s?.meta?.layout ?? s?.frontmatter?.layout;
    if (layout === "canvas") canvasCount++;
  }
  return Math.max(0, canvasCount - 1);
});

const scene = computed(() => {
  if (!scenes.length) return {};
  return scenes[canvasSceneIndex.value] ?? scenes[scenes.length - 1]!;
});
</script>

<template>
  <div
    class="slidev-layout canvas relative h-full min-h-0 w-full flex-1 overflow-hidden"
  >
    <CanvasWebGLSlide :scene="scene" />
    <!-- Keep Slidev markdown slot (notes/editor); not shown in canvas mode -->
    <div
      class="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      <slot />
    </div>
  </div>
</template>
