/**
 * Scene data for Slidev canvas mode (Psyche demo).
 * Index matches 1-based slide number for canvas slides only.
 * Shape matches engine/canvas/slideScene2d.ts — edit placement there.
 */
import type { SlideScene2d } from "../../engine/canvas/slideScene2d";
import { retroComicRoot } from "../../engine/canvas/styles";
import presentationMeta from "./presentation.config.json";

const psycheTitleAsset = new URL("./assets/psyche-title-alpha.png", import.meta.url).href;
const professorAssignmentAsset = new URL("./assets/1_assignment/professor.png", import.meta.url).href;
const phdStudentAssignmentAsset = new URL("./assets/1_assignment/phd-student.png", import.meta.url).href;
const studentDesperateAsset = new URL("./assets/2_assignment/student_desperate.png", import.meta.url).href;

export type CanvasScene = SlideScene2d & { title: string };

type PsychePresentationMeta = typeof presentationMeta & {
  creators?: string[];
  /** If set, replaces the whole cover byline (no automatic "Created by …") */
  coverByline?: string;
};

const meta = presentationMeta as PsychePresentationMeta;

const paper = retroComicRoot.paper;
const ink = retroComicRoot.ink;

const creator =
  typeof meta.creator === "string" && meta.creator.trim() ? meta.creator.trim() : meta.title;

function formatCreators(names: string[]): string {
  const n = names.map((s) => s.trim()).filter(Boolean);
  if (n.length === 0) return creator;
  if (n.length === 1) return n[0];
  if (n.length === 2) return `${n[0]} and ${n[1]}`;
  return `${n.slice(0, -1).join(", ")}, and ${n[n.length - 1]}`;
}

const coverCredits =
  typeof meta.coverByline === "string" && meta.coverByline.trim()
    ? meta.coverByline.trim()
    : `Created by ${Array.isArray(meta.creators) && meta.creators.length > 0 ? formatCreators(meta.creators) : creator}`;
const presentedAt =
  typeof meta.presentedAt === "string" && meta.presentedAt.trim()
    ? meta.presentedAt.trim()
    : undefined;

export default [
  {
    title: "PSYCHE",
    comicCover: {
      issue: "1",
      price: "OPEN",
      date: presentedAt,
      tagline: "An origin story",
      byline: coverCredits,
      heroSrc: psycheTitleAsset,
    },
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "The assignment",
    comicPanel: {
      professorSrc: professorAssignmentAsset,
      studentSrc: phdStudentAssignmentAsset,
      /**
       * `tailTip` uses the **same** normalized content coords as `boxNorm` (not relative to the box):
       * x·innerW+innerLeft, y·contentH+contentTop → mouth target in panel space.
       */
      bubbles: [
        {
          text: "Go through these papers… and extract their experimental design.",
          boxNorm: { x: 0.32, y: 0.2, w: 0.42, h: 0.42 },
          tailTip: { x: 0.77, y: 0.25 },
        },
        {
          text: "How hard can that be?",
          boxNorm: { x: .23, y: .47, w: 0.38, h: 0.39 },
          tailTip: { x: .19, y: 0.4 },
        },
      ],
    },
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "Meanwhile\u2026",
    comicNarration: {
      narration:
        "Turns out this was a lot harder than expected.",
      figureSrc: studentDesperateAsset,
      figureNorm: { x: 0.30, y: 0.0, w: 0.40, h: 0.95 },
      narrationBoxNorm: { x: 0.31, y: 0.78, w: 0.38, h: 0.18 },
      thinkBubble: {
        text: "Methods? Figure 2? Appendix??",
        boxNorm: { x: 0.15, y: 0.04, w: 0.30, h: 0.28 },
        tailTip: { x: 0.48, y: 0.22 },
      },
    },
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "The Data - As We Wanted It",
    comicTable: {
      label: "experiment_1.csv",
      columns: [
        "subject_id", "trial_id", "age", "gender",
        "word", "color","congruency", "reaction_time", "accuracy",
      ],
      rows: [
        ["S01", "1", "24", "F", "RED",   "green", "incongruent", "682",  "true"],
        ["S01", "2", "24", "F", "BLUE",  "blue",  "incongruent", "423",  "false"],
        ["S01", "3", "24", "F", "GREEN", "red",   "incongruent", "711",  "true"],
        ["S01", "4", "24", "F", "RED",   "red",   "congruent", "398",  "true"],
        ["\u2026",  "\u2026",  "",   "",  "\u2026",   "\u2026",   "\u2026",    "\u2026"],
        ["S02", "1", "31", "M", "BLUE",  "green", "incongruent", "745",  "true"],
        ["S02", "2", "31", "M", "GREEN", "green", "congruent", "512",  "true"],
        ["S02", "3", "31", "M", "RED",   "blue",  "incongruent", "689",  "false"],
        ["S02", "4", "31", "M", "GREEN", "red",   "incongruent", "634",  "true"],
      ],
    },
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "The Data - As We Found It",
    comicTable: [
      {
        label: "demographics.csv",
        columns: ["subject_id", "age", "gender"],
        rows: [
          ["S01", "24", "F"],
          ["S02", "31", "M"],
          ["\u2026", "\u2026", "\u2026"],
        ],
      },
      {
        label: "experiment_1.csv",
        columns: [
          "subject_id", "trial_id",
          "word", "color", "reaction_time", "response",
        ],
        rows: [
          ["S01", "1", "RED",   "green", "682",  "green"],
          ["S01", "2", "BLUE",  "blue",  "423",  "blue"],
          ["S01", "3", "GREEN", "red",   "711",  "red"],
          ["S01", "4", "RED",   "red",   "398",  "red"],
          ["\u2026",  "\u2026",  "\u2026", "\u2026", "\u2026", "\u2026"],
          ["S02", "1", "BLUE",  "green", "745",  "green"],
          ["S02", "2", "GREEN", "green", "512",  "blue"],
          ["S02", "3", "RED",   "blue",  "689",  "blue"],
          ["S02", "4", "GREEN", "red",   "634",  "red"],
        ],
      },
    ],
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "The Data - As We Found It",
    comicTable: [
      {
        label: "a.csv",
        columns: ["pid", "0", "1"],
        rows: [
          ["S01", "24", "0"],
          ["S02", "31", "1"],
          ["\u2026", "\u2026", "\u2026"],
        ],
      },
      {
        label: "b.csv",
        columns: [
          "pid",
          "factor_001", "factor_003", "time_start", "time_end", "key_press",
        ],
        rows: [
          ["0", "1", "001", "1774594890", "1774595343", "j"],
          ["0", "2", "010", "1774595789", "1774596242", "f"],
          ["0", "3", "100", "1774596691", "1774597144", "k"],
          ["0", "1", "100", "1774597593", "1774598046", "k"],
          ["\u2026",   "\u2026", "\u2026", "\u2026", "\u2026", "\u2026"],
          ["1", "2", "001", "1774598495", "1774598948", "f"],
          ["1", "3", "001", "1774599397", "1774599850", "f"],
          ["1", "1", "010", "1774600299", "1774600752", "f"],
          ["1", "3", "100", "1774601191", "1774601644", "k"],
        ],
      },
    ],
    paper,
    ink,
    canvasStyle: "retro-comic",
  },
  {
    title: "MOTIVATION",
    bullets: [
      "Human experiments produce rich, heterogeneous data",
      "Systematic curation is needed for reuse, analysis, and transparency",
    ],
    canvasStyle: "noir",
  },
  {
    title: "PSYCHE \u2014 PIPELINE",
    bullets: [
      "Ingestion \u2192 harmonization \u2192 QC",
      "Metadata, provenance, publication-ready artifacts",
    ],
    note: "Add your own stages where you need them.",
    paper,
    ink,
  },
  {
    title: "THANK YOU",
    subtitle: "Questions?",
    paper,
    ink,
  },
] satisfies CanvasScene[];
