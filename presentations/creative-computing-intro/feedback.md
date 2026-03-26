---
layout: center
class: text-center
---

<script setup>
import config from "./presentation.config.json";
import feedbackConfig from "../../engine/feedback.config.json";

const presentation = config.titleShort || config.title;
const encodedPresentation = encodeURIComponent(presentation);
const formBase = (feedbackConfig.feedbackFormUrl || "https://tally.so/r/REPLACE_WITH_YOUR_FORM").trim();
const separator = formBase.includes("?") ? "&" : "?";
const fieldKey = encodeURIComponent(feedbackConfig.feedbackFieldKey || "presentation-title");
const anonymousUrl = `${formBase}${separator}${fieldKey}=${encodedPresentation}`;
const repo = feedbackConfig.githubRepo || "younesStrittmatter/presentations";
const issuesUrl = `https://github.com/${repo}/issues`;
</script>

## Feedback

<div class="feedback-copy">Help me improve this talk. I read every piece of feedback and keep it public for transparency.</div>

<div class="feedback-actions">
  <a class="pill-link" :href="anonymousUrl" target="_blank">Anonymous feedback</a>
  <a class="pill-link" :href="issuesUrl" target="_blank">Feedback</a>
</div>

<div class="feedback-note">Anonymous form is fastest. Public issues let everyone learn from the same feedback thread.</div>
