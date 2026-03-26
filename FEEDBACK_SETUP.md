# Feedback Pipeline Setup

Goal: collect low-friction feedback and make it publicly visible in GitHub Issues.

## Can this be anonymous and public?

- Direct GitHub issue submission is **not anonymous**.
- To get anonymous feedback that still ends up in public issues, use:
  - anonymous form intake
  - automation that creates GitHub issues from submissions

## One-time setup (recommended)

### 1) Prepare GitHub labels

Create these labels in your repo:

- `feedback`
- `presentation:creative-computing-intro`

Create a `presentation:<slug>` label for each new deck.

### 2) Create anonymous form

Use Tally, Google Forms, or Typeform. Keep fields:

- presentation (short title/slug)
- rating
- what worked
- what was unclear
- one improvement suggestion
- optional context

Important: name the presentation field exactly `presentation` if your form tool supports URL-prefill by field key.

### 3) Connect form to GitHub Issues

Use Zapier/Make automation:

- Trigger: new form response
- Action: GitHub -> Create Issue

Use this mapping:

- Title: `Feedback: {{presentation_slug}} - {{short_summary_or_rating}}`
- Labels: `feedback,presentation:{{presentation_slug}}`
- Body:

```md
## Presentation
{{presentation_slug}}

## Rating
{{rating}}

## What worked
{{worked}}

## What was unclear
{{unclear}}

## Improvement suggestion
{{improve}}

## Optional context
{{context}}

---
_Submitted via anonymous form._
```

### 4) Set global feedback destination once

Edit `engine/feedback.config.json`:

- set `feedbackFormUrl` to your form URL
- set `githubRepo` to your repository path

Each presentation keeps only `title` and `titleShort` in:

- `presentations/<slug>/presentation.config.json`

The default `feedback.md` then builds the anonymous URL automatically:

- `<engine.feedbackFormUrl>?presentation=<titleShort>`

### 5) Optional direct GitHub form

This repo already includes a public issue template:

- `.github/ISSUE_TEMPLATE/presentation-feedback.yml`

It is useful for participants who want to identify themselves with GitHub.

## Operating flow after setup

1. Audience clicks "Send anonymous feedback" on the final slide
2. Submission is received by the form
3. Automation creates a labeled GitHub issue
4. Feedback is visible to everyone in Issues

No manual copy-paste needed.
