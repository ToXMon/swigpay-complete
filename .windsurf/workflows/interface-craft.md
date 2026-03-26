---
description: Phase 4 UI/UX skill pack for SwigPay dashboard design, motion tuning, and critique.
---

# Interface Craft — SwigPay Phase 4 UI/UX Skill Pack

Use this workflow to improve the SwigPay dashboard with stronger hierarchy, cleaner interaction states, and polished motion before implementation work begins.

## Direct Usage
- `/interface-craft critique` for a structured review of the current dashboard UI.
- `/interface-craft storyboard` when you need coordinated animation guidance.
- `/interface-craft dialkit` when you want live tuning controls for spacing, motion, or layout decisions.

## When to Use
- Before changing any dashboard layout, component styling, animation, or empty/error states.
- When you want a structured critique of the existing UI.
- When tuning motion or responsive behavior interactively.
- When sourcing reusable UI primitives from shadcn/ui, Magic UI, TweakCN, or React Bits.

## Trigger Keywords
- **Storyboard Animation**: `animation`, `transition`, `storyboard`, `entrance`, `motion`
- **DialKit**: `dials`, `sliders`, `controls`, `tune`, `tweak`
- **Design Critique**: `critique`, `review`, `feedback`, `audit`, `polish`

## Phase 4 Design Flow
1. Critique the current dashboard UI before editing code.
2. Choose the lightest reusable primitive that fits the job.
3. Add motion only where it improves clarity or feedback.
4. Tune values with live controls when a decision is hard to judge in code alone.
5. Re-check the final result for accessibility, hierarchy, and consistency.

## Prompt Recipes

### 1) Design critique first
```text
Review the SwigPay dashboard for Phase 4 UI quality. Focus on visual hierarchy, spacing, color usage, contrast, feedback states, empty states, and interaction clarity. Return a prioritized list of improvements. Do not write code yet.
```

### 2) Dashboard component design
```text
Design a world-class dashboard component for SwigPay using Tailwind and shadcn/ui primitives first. Keep the dark theme, use green for confirmed, yellow for pending, and red for rejected states. Prefer simple structure, strong hierarchy, and accessible interactions.
```

### 3) Storyboard animation prompt
```text
Create a storyboard-style animation for the SwigPay dashboard. Extract timing, duration, easing, and spring values into named constants. Animate the layout in readable stages so the transaction feed and agent cards feel coordinated, not flashy.
```

### 4) DialKit tuning prompt
```text
Add DialKit controls so I can tune the SwigPay dashboard live. Expose spacing, card radius, spring stiffness, duration, opacity, and vertical offset. Keep the control panel minimal and only expose values that help refine the UI quickly.
```

### 5) Component sourcing prompt
```text
Help me choose between shadcn/ui, Magic UI, TweakCN, and React Bits for this SwigPay dashboard feature. Recommend the simplest option that ships fastest, explain why it fits the current design, and call out any accessibility or maintainability tradeoffs.
```

### 6) Final polish prompt
```text
Perform a final design critique on the SwigPay Phase 4 dashboard. Identify anything that still feels unfinished, low-trust, hard to scan, or inconsistent with a premium product. Suggest only the highest-value fixes.
```

## Recommended Usage Pattern
- Start with critique.
- Build with shadcn/ui primitives.
- Add motion only after hierarchy is stable.
- Use DialKit to make design decisions quickly.
- Finish with one last critique before merging.

## Output Expectations
- Keep recommendations concrete and implementation-ready.
- Prefer short lists over long essays.
- Call out accessible labels, focus states, loading states, and empty states.
- Respect SwigPay rules: Tailwind only, dark theme, no external frontend API calls.
