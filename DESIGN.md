# AIDERA Content Studio Design System

## Intent

A focused editorial operations workspace used for long desktop sessions, with deliberate adaptation for tablet and mobile. The interface prioritizes decisions, stage movement, context, and readable agent output over decorative analytics.

## Theme

Light-first, restrained, and warm through the AIDERA orange accent rather than a beige wash. Primary surfaces use neutral off-white and white; dark ink anchors the interface. Orange is reserved for primary action, current selection, and branded emphasis.

## Color

Use OKLCH tokens in CSS and preserve the semantic intent of the PRD palette.

- Background: neutral off-white with near-zero chroma.
- Surface: soft white, distinct from the canvas without heavy shadows.
- Ink: near-black tinted toward the brand hue.
- Muted ink: must maintain WCAG AA contrast.
- Brand: vivid AIDERA orange.
- Success, warning, danger, and info: consistent semantic roles with text/icon reinforcement.
- Prototype: a distinct amber status treatment that always includes the words “Prototype Data”.

## Typography

Use one highly legible product family for controls, labels, messages, and data. Use fixed rem sizes with a compact 1.125–1.2 scale. Use weight, spacing, and composition for editorial hierarchy; do not use decorative display typography in controls. Numeric metrics and timestamps use tabular figures.

## Shape and Elevation

- Default radius: 14 px.
- Compact controls may use 10–12 px.
- Pills are reserved for statuses, filters, and compact actions.
- Use either a fine border or a restrained small shadow, not both as decoration.
- Panels are separated by layout, tone, and spacing before elevation.

## Spacing

Base rhythm: 4 px. Common steps: 4, 8, 12, 16, 24, 32, 48. Dense operational rows use 8–12 px internal gaps; page sections use 24–32 px separation. Avoid applying identical padding to every surface.

## Layout

### Desktop

Persistent 248 px sidebar, contextual top bar, and a flexible content canvas. Agent workspace uses three panels. Kanban columns retain usable card width and scroll horizontally.

### Tablet

Collapsible navigation and two-panel/master-detail compositions. Side inspectors become drawers when space is constrained.

### Mobile

Bottom navigation exposes Dashboard, Agents, Board, and Calendar. Secondary navigation opens in a sheet. Agent workspace becomes Thread, Chat, and Context tabs. Kanban remains horizontally scrollable by column. Critical actions remain reachable and use 44 px touch targets.

## Components

- Buttons use primary, secondary, ghost, and destructive hierarchy.
- Inputs share one control vocabulary and visible focus treatment.
- Status badges always include text or icon meaning.
- Skeletons match the shape of the content.
- Empty states explain the next valid action.
- Drawers support contextual content and approval review; destructive decisions require explicit confirmation.
- Structured agent blocks have distinct information patterns rather than identical card shells.

## Motion

Use 150–250 ms state transitions with ease-out-quart/quint curves. Motion communicates navigation, expansion, drag state, optimistic updates, and rollback. Avoid decorative page-load choreography. Reduced-motion mode removes transforms and nonessential transitions.

## Data Integrity Cues

- A persistent “Prototype Data — tidak tersimpan permanen” banner appears whenever fixtures are active.
- Connection status is explicit: Prototype, Live, Reconnecting, or Offline.
- Pending approval is visually distinct from approved.
- Optimistic moves remain visibly pending until acknowledged.
- Errors retain context and offer a precise retry action.
