---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## PeerPrep Design Reference

When building PeerPrep interfaces, follow the established design language from the mockups in `peerprep_ui_mockup/mockups/` and the theme variables defined in `frontend/app/globals.css`.

### Design Language
- **Tone**: Warm, clean, professional — a light theme with a warm-toned `--background` and white `--card` surfaces. Not cold/clinical, not playful.
- **Cards**: White (`--card`) with `--border` borders, `--shadow` box-shadows, and generous `--radius-lg` to `--radius-xl` rounding.
- **Pills & Badges**: Fully-rounded (`border-radius: 999px`) status pills, meta badges, and action chips. Use `--accent-soft` background with `--accent` text for active/positive states, `--destructive` for negative states.
- **Buttons**: Primary buttons use `--primary` background with `--primary-foreground` text and elevated shadows. Ghost/secondary buttons use `--secondary` background with `--border` borders.
- **Typography**: Uses project fonts: `--font-sans` (Open Sans) for body, `--font-serif` (Source Serif 4) for display, `--font-mono` (IBM Plex Mono) for code. Keep text compact — body text at ~12–13px, secondary/meta text at ~11–11.5px.
- **Layout**: Top navbar with logo + nav links + user avatar. Content areas padded at ~34–40px. Two-column grids for dashboards and session views.
- **Iconography**: Inline SVG stroke icons at 1.6–1.8px stroke width, colored with `--accent`.

### Color Variables (from `globals.css`)
Use these variable names — never hardcode raw color values:
- **Surfaces**: `--background`, `--card`, `--popover`, `--muted`, `--secondary`
- **Text**: `--foreground`, `--card-foreground`, `--muted-foreground`, `--accent-foreground`, `--primary-foreground`
- **Interactive**: `--primary`, `--accent`, `--destructive`, `--ring`, `--input`, `--border`
- **Charts**: `--chart-1` through `--chart-5`
- **Sidebar**: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`