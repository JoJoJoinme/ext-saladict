# Investigate Template

Use this template when the current phase is `investigate`.

This artifact exists to answer one question:

> If the current session stops here, how does the next session continue without
> reconstructing the whole problem from chat history?

The template is intentionally phase-oriented, not framework-oriented.

---

## 1. Problem Description

State the current problem in task-local terms.

Include:

- what task line this investigation belongs to
- what specifically is blocked
- what is *not* yet proven to be the cause

---

## 2. Success Criteria

Define what would make this investigation “done”.

Prefer concrete conditions such as:

- a runtime becomes attachable
- a repro becomes stable
- a hypothesis is confirmed or denied
- a specific manual validation becomes possible

---

## 3. Inputs To Read First

List the minimum files that the next session must read before continuing.

This should usually include:

- `workboard`
- any current verification artifact
- any architecture / runbook docs that constrain the investigation

Keep this list short.

---

## 4. Runtime Registry Snapshot

Only include this section when the investigation touches live execution
resources.

Record:

- paths
- ports
- browser URLs / ws endpoints
- extension IDs
- proxy assumptions
- active scripts or launch commands

The point is not to be elegant.
The point is to let the next session attach or rebuild quickly.

---

## 5. Confirmed Facts

Only record observations that were directly verified.

Recommended phrasing:

- “X was observed”
- “Y command succeeded”
- “Z page failed with this exact error”

Do not mix facts with explanations.

---

## 6. Attempt Log

Record what has already been tried in chronological order.

For each attempt, state:

1. what was tried
2. what happened
3. whether this changed the situation

The goal is to prevent the next session from re-running the same dead paths by
accident.

---

## 7. Current Hypotheses

List the current explanations that are still hypotheses.

Each hypothesis should be:

- short
- falsifiable
- clearly separated from confirmed facts

If possible, note what evidence would confirm or deny it.

---

## 8. Non-Goals

Explicitly state what should *not* be changed while this investigation is still
open.

Typical examples:

- do not change product logic yet
- do not reopen architecture yet
- do not treat this as proof of a code regression yet

This section prevents scope drift.

---

## 9. Next Experiments

List the next experiments in strict priority order.

These should be concrete enough that the next session can start from item 1
immediately.

Do not write vague ideas here.

---

## 10. First Action For The Next Session

Write one short restart procedure.

The ideal next session should be able to:

1. read this file
2. read one or two linked artifacts
3. begin the first experiment

without re-reading the whole chat log.

---

## 11. Exit Note

Explain why this problem deserves a dedicated `investigate` artifact.

Typical reasons:

- runtime-heavy
- crosses sessions badly
- easy to lose context
- easy to confuse hypotheses with facts

This note makes the purpose of the artifact explicit.
