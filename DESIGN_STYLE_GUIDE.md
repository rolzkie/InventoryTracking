# CvSU IMS Design Preview

## Direction

The interface uses a warm, quiet canvas and a small green/gold palette for a school operations tool. Two-pixel ink borders, square corners, and hard offset shadows give cards and controls a clear structure. Whitespace and consistent alignment keep the stronger edges readable rather than noisy. The current preview applies this direction to Login and the Administrator Dashboard while retaining the existing React interactions and Laravel data flow.

## Tokens

| Token | Value | Use |
|---|---|---|
| Primary green | `#1B5E20` | Active navigation, primary actions, table headers |
| Light green | `#E8F5E9` | Row hover and restrained success surfaces |
| Accent gold | `#F9A825` | Focus ring, low-stock emphasis, active navigation marker |
| Ink | `#111111` | Text, borders, rules, light-mode shadow |
| Warm canvas | `#FAFAF5` | Light-mode page background |
| Surface | `#FFFFFF` | Light-mode cards and controls |
| Dark canvas | `#121212` | Dark-mode page background |
| Dark surface | `#1D1D1B` | Dark-mode cards |
| Success / low / out | `#2E7D32` / `#F9A825` / `#C62828` | Stock status |
| Borrowed / overdue / returned | `#EF6C00` / `#B71C1C` / `#757575` | Loan status |
| Border | `2px solid` | Cards, controls, navigation dividers |
| Hard shadow | `4px 4px 0` | Cards, primary controls |
| Spacing | `8px` base | `8, 16, 24, 32px` rhythm |

## Type scale

- **Display:** Space Grotesk, 32–48px, bold
- **H1:** Space Grotesk, 32px, bold
- **H2:** Space Grotesk, 24px, bold
- **H3 / section label:** Archivo or Space Grotesk, 18px / 11px, bold; labels uppercase
- **Body:** Inter, 16px regular
- **Small:** Inter, 13px regular
- **Data:** IBM Plex Mono, 13–16px for SKUs, quantities, and timestamps

## Component and state rules

- Primary controls use CvSU green; destructive actions use red; gold marks priority and keyboard focus.
- Buttons press by shifting two pixels and reducing the shadow. Controls have a minimum 48px target where practical.
- Inputs retain visible labels, use square ink borders, and show a thick gold focus outline.
- Tables use green headers, strong row dividers, and a light green hover state.
- Status badges pair an icon with a text label; color never carries the status by itself.
- Dark mode uses near-black surfaces, light borders, and the same green and gold signals.
- Reduced-motion preferences remain respected by the existing global stylesheet.

## Screen mapping for the approval pass

Login, shared role dashboards, product list, product add/edit modal, product details modal, categories, stock-in/out forms, transaction history, borrow/return, user management, activity logs, and reports already exist. The current dashboard is shared across roles; its visible navigation remains role-filtered. Dedicated Session Expired and Access Denied screens, and a Roles & Permissions matrix, are **new screens not in the current system** and are not part of this preview.
