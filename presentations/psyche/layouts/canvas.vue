<script setup>
/**
 * Slidev layout: GPU canvas slide (see presentation.config.json renderMode + canvas-scenes.ts).
 */
import { computed } from "vue";
import { useSlideContext } from "@slidev/client";
import CanvasWebGLSlide from "../../../engine/components/CanvasWebGLSlide.vue";
import scenes from "../canvas-scenes";

/** Per-slide content — do not use global currentSlideNo or inactive slides fight the active one. */
const { $page } = useSlideContext();
const scene = computed(() => scenes[$page.value - 1] ?? scenes[0]);
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
