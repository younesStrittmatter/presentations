<script setup>
/**
 * Orchestration: offscreen 2D (see engine/canvas/slideScene2d.ts) → texture →
 * post shader (engine/canvas/postprocessHalftone.ts), resize debounce, rAF.
 */
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  FULLSCREEN_QUAD_ATTR,
  fullscreenQuadVertex,
  halftonePostFragment
} from "../canvas/postprocessHalftone";
import { ensureCanvasDisplayFonts } from "../canvas/loadDisplayFonts";
import { getCanvasStyle } from "../canvas/styles";
import { drawSlideScene2d } from "../canvas/slideScene2d";
import {
  preloadComicNarrationImages,
  preloadComicPanelImages,
  preloadCoverHeroImage,
} from "../canvas/vintage-comic";

const props = defineProps({
  scene: { type: Object, required: true }
});

const viewRef = ref(null);
const ATTR = FULLSCREEN_QUAD_ATTR;

const VS = fullscreenQuadVertex(ATTR);
const FS = halftonePostFragment;

let gl;
let program;
let tex;
let locResolution;
let locScale;
let locScene;
let raf = 0;
let offscreen;
let offCtx;
let resizeT = 0;
let resizeObserver;
let lastCw = 0;
let lastCh = 0;
let sceneDirty = false;

function preloadSceneAssets(scene) {
  return Promise.all([
    preloadCoverHeroImage(scene?.comicCover?.heroSrc),
    preloadComicPanelImages(scene?.comicPanel),
    preloadComicNarrationImages(scene?.comicNarration),
  ]);
}

function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function layoutAndDraw2D(scene) {
  if (!offCtx || !gl || !tex || !offscreen) return;
  const w = offscreen.width;
  const h = offscreen.height;
  if (w < 2 || h < 2) return;

  drawSlideScene2d(offCtx, scene, w, h);

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
}

function commitResize() {
  const el = viewRef.value;
  if (!el || !gl) return;

  const rw = el.clientWidth;
  const rh = el.clientHeight;
  if (rw < 8 || rh < 8) {
    queueCommitResize();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = Math.max(2, Math.floor(rw * dpr));
  const ch = Math.max(2, Math.floor(rh * dpr));

  const sizeChanged = cw !== lastCw || ch !== lastCh;
  if (!sizeChanged && !sceneDirty) return;

  lastCw = cw;
  lastCh = ch;
  sceneDirty = false;

  const canvas = gl.canvas;
  canvas.width = cw;
  canvas.height = ch;

  offscreen.width = cw;
  offscreen.height = ch;

  gl.viewport(0, 0, cw, ch);
  layoutAndDraw2D(props.scene);
}

function queueCommitResize() {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    resizeT = 0;
    requestAnimationFrame(commitResize);
  }, 110);
}

function drawFrame() {
  if (!gl || !program) {
    raf = 0;
    return;
  }
  const canvas = gl.canvas;
  if (canvas.width < 2 || canvas.height < 2) {
    raf = requestAnimationFrame(drawFrame);
    return;
  }

  gl.useProgram(program);
  gl.uniform2f(locResolution, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(locScale, getCanvasStyle(props.scene?.canvasStyle).halftoneScale);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(locScene, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  raf = requestAnimationFrame(drawFrame);
}

function startLoop() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(drawFrame);
}

function initGL() {
  const el = viewRef.value;
  if (!el) return;

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  el.innerHTML = "";
  el.appendChild(canvas);

  gl = canvas.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: false });
  if (!gl) {
    console.warn("CanvasWebGLSlide: WebGL unavailable");
    return;
  }

  const v = compile(gl.VERTEX_SHADER, VS);
  const f = compile(gl.FRAGMENT_SHADER, FS);
  if (!v || !f) return;
  program = link(v, f);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!program) return;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const locPos = gl.getAttribLocation(program, ATTR);
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  locResolution = gl.getUniformLocation(program, "u_resolution");
  locScale = gl.getUniformLocation(program, "u_scale");
  locScene = gl.getUniformLocation(program, "u_scene");

  offscreen = document.createElement("canvas");
  offCtx = offscreen.getContext("2d");

  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0.12, 0.1, 0.08, 1);

  lastCw = 0;
  lastCh = 0;
  sceneDirty = true;
}

function teardown() {
  cancelAnimationFrame(raf);
  raf = 0;
  clearTimeout(resizeT);
  resizeT = 0;
  resizeObserver?.disconnect();
  resizeObserver = null;
  lastCw = 0;
  lastCh = 0;
  if (gl && tex) {
    gl.deleteTexture(tex);
    tex = null;
  }
  if (gl && program) {
    gl.deleteProgram(program);
    program = null;
  }
  gl = null;
  if (viewRef.value) viewRef.value.innerHTML = "";
}

watch(
  () => props.scene,
  async () => {
    await preloadSceneAssets(props.scene);
    sceneDirty = true;
    if (lastCw > 0 && lastCh > 0 && gl && tex && offscreen) {
      requestAnimationFrame(() => {
        sceneDirty = false;
        layoutAndDraw2D(props.scene);
      });
      return;
    }
    queueCommitResize();
  },
  { flush: "post" }
);

onMounted(async () => {
  await nextTick();
  await ensureCanvasDisplayFonts();
  await preloadSceneAssets(props.scene);
  initGL();
  startLoop();

  window.addEventListener("resize", queueCommitResize);

  const el = viewRef.value;
  if (el && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => queueCommitResize());
    resizeObserver.observe(el);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(commitResize);
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", queueCommitResize);
  teardown();
});
</script>

<template>
  <div ref="viewRef" class="canvas-webgl-slide" />
</template>

<style scoped>
.canvas-webgl-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  contain: strict;
  background: #1f1a12;
}
</style>
