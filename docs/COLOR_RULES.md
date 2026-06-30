# Drip Theka — Color Contrast Rules

## Brand tokens

| Token         | Hex       | Role                        |
|---------------|-----------|-----------------------------|
| `--cream`     | `#E4E2DD` | Primary background, default page bg |
| `--cream-warm`| `#EFEAD8` | Accent warm background       |
| `--blue`      | `#004AAD` | Primary CTA, cobalt sections |
| `--blue-deep` | `#002F70` | Deep cobalt (nav active etc) |
| `--ink`       | `#141518` | Default body text, dark sections |
| `--ink-soft`  | `#2A2B2F` | Slightly softer dark         |

---

## Legal contrast pairs

### CREAM BG (`#E4E2DD`)
- `--ink` text ✓
- `--blue` text ✓ (also for links, accents)
- `--blue` CTA buttons ✓

### COBALT BG (`#004AAD`)
- `--cream` text **only** ✓
- `--cream-warm` accents ✓

### INK BG (`#141518`)
- `--cream` text ✓
- `--blue` accents (sparingly, not body copy) ✓

---

## Illegal pairs — never use

| Foreground       | Background       | Why                        |
|------------------|------------------|----------------------------|
| `--ink` text     | `--blue` bg      | Dark-on-dark, fails WCAG   |
| `--blue` text    | `--blue` bg      | Same color, no contrast    |
| `--ink` text     | `--ink` bg       | Dark-on-dark, invisible    |
| Cobalt CTA       | `--ink` bg       | Too low contrast           |
| Dark serif       | Any dark bg      | Fails WCAG AA              |
| `#CCFF00` neon   | Any bg           | Banned everywhere except HappyHour easter egg |

---

## CTA button rules

| Context (bg)  | Button style                                            |
|---------------|---------------------------------------------------------|
| Cream bg      | `bg-[--blue] text-[--cream]` (primary)                  |
| Cream bg      | `bg-[--ink] text-[--cream]` (secondary)                 |
| Cobalt bg     | `bg-[--cream] text-[--ink]` or `bg-[--ink] text-[--cream]` |
| Ink bg        | `bg-[--cream] text-[--ink]` or outline `border-[--cream] text-[--cream]` |

---

## Neon / lime (`#CCFF00`)

**Banned from production UI.**  
The only permitted location is `/components/layout/HappyHour.tsx` (Konami easter egg, session-only). Define it inline there — do not add it back to the design system theme.
