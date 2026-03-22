# Frontend Development Standards

## 1. Design System & Color Palette
All frontend components must strictly adhere to the brand color palette defined in `globals.css`. Do not use ad-hoc hex codes or default Tailwind colors (blue-600, etc.) for primary UI elements.

### Brand Colors (Tailwind Classes)
- **Primary (Dark):** `bg-brand-dark`, `text-brand-dark` (`#16232E`)
- **Primary (Green):** `bg-brand-green`, `text-brand-green` (`#164C45`)
- **Secondary (Gold):** `bg-brand-gold`, `text-brand-gold` (`#CC8D1A`)
- **Accent (Yellow):** `bg-brand-yellow`, `text-brand-yellow` (`#BDA523`)
- **Background:** `bg-page-bg` (`#F5EEDC`)

## 2. Page Structure & Components
### Person Pages (MLA Profile)
- **Mandatory Component:** `MLAHeader` which must include a `profile_pic`.
- **Layout:** Should have a hero summary followed by performance metrics and then history details.

### Navigation Pages (District, Constituency, TN State)
- **Mandatory Component:** `CoverImage` must be present at the top of the page.
- **Breadcrumbs:** Breadcrumbs must be clearly visible, preferably overlaid on the `CoverImage` or immediately above it.

## 3. Visual Language
- **Typography:** Use uppercase for titles and labels with appropriate letter spacing (`tracking-widest`, `tracking-[0.3em]`) to maintain the premium feel.
- **Interactivity:** All cards and interactive elements should have subtle hover states (scale, shadow, or border color changes) using transitions.
- **Depth:** Use large, soft shadows and rounded corners (typically `2xl` to `[2.5rem]`) for major sections.
