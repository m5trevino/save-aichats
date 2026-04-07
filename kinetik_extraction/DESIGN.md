```markdown
# Design System Specification: Cyber-Industrial Authority

## 1. Overview & Creative North Star
**The Creative North Star: "The Extraction Engine"**

This design system moves away from the friendly, rounded "SaaS-standard" aesthetic and toward a high-fidelity, industrial-technical interface. It is designed to feel like a high-performance extraction tool—precise, authoritative, and cold. We achieve an editorial, high-end feel by leaning into **intentional asymmetry**, **monochromatic depth**, and **utilitarian density**. 

The interface should feel "carved" rather than "pasted." We break the template look by using rigid, sharp-edged containers and technical grid-line textures that imply a structural framework beneath the UI. This isn't just a dashboard; it’s a terminal into a complex machine.

---

## 2. Colors: High-Contrast Toxicity
The palette is rooted in an ultra-dark environment where light is used as a functional tool, not just decoration.

### The Palette
*   **Primary (#CCFF00):** The "Radioactive Lime." Reserved exclusively for high-impact actions and critical status indicators. Use it sparingly to maintain its "warning" or "active" energy.
*   **Surface Layers:** From `surface_container_lowest` (#0E0E0E) to `surface_bright` (#3A3939). These define the "machinery" of the interface.
*   **Secondary/Tertiary:** Muted slates and indigos provide a "cooling" effect to balance the heat of the lime green.

### The Rules of Engagement
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. To separate content, use background shifts. A `surface_container_low` sidebar should sit directly against a `surface` background. The change in hex value is the boundary.
*   **Surface Hierarchy:** Nesting is king. Place `surface_container_high` elements inside `surface_container_low` sections to create a "tactile" recessed look.
*   **Signature Textures:** Apply a 1px micro-grid pattern (using `outline_variant` at 5% opacity) to the background of main work areas. This reinforces the "industrial blueprint" aesthetic.
*   **The "Glow" Rule:** Active states for `primary` elements should utilize a subtle outer glow (box-shadow: 0 0 15px rgba(204, 255, 0, 0.4)) to simulate light emission from a high-tech console.

---

## 3. Typography: Technical Precision
We pair the geometric Swiss-style `Space Grotesk` with the functional clarity of `Inter` and monospaced data.

*   **Display & Headline (Space Grotesk):** Use these for high-level data points and section titles. The wide apertures and sharp terminals mirror the component geometry.
*   **Body (Inter):** The workhorse for descriptions and secondary UI labels. High readability against dark backgrounds.
*   **Technical Data (Monospace):** All numerical values, timestamps, and coordinates must use a monospaced font-stack (e.g., JetBrains Mono or similar). This reinforces the "extraction tool" persona.

**Hierarchy Note:** Use `label-sm` in all-caps with increased letter-spacing (0.05rem) for metadata to create an "architectural" feel.

---

## 4. Elevation & Depth: Tonal Stacking
In a cyber-industrial world, there is no "sunlight," only internal illumination. Traditional shadows are replaced by **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking."
    *   *Base:* `surface_container_lowest`
    *   *Panel:* `surface_container_low`
    *   *Interactive Card:* `surface_container_high`
*   **Ambient Shadows:** If an element must float (like a context menu), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6)`. No light-colored shadows.
*   **The "Ghost Border":** For input fields or essential containment, use the `outline_variant` at 15% opacity. It should be felt, not seen.
*   **Industrial Glass:** Use `surface_container_highest` at 70% opacity with a `20px backdrop-blur` for overlays. This allows the "glow" of underlying data to bleed through, maintaining spatial awareness.

---

## 5. Components: The Toolset

### Buttons
*   **Primary:** `primary_container` (#C3F400) background, `on_primary` (#283500) text. Sharp 0px corners. On hover, apply the "Radioactive Glow."
*   **Secondary:** `surface_container_highest` background with a `Ghost Border`. Text in `on_surface`.
*   **Tertiary:** Ghost button. Text in `secondary`. Underline on hover with a 2px `primary` stroke.

### Input Fields
*   **Default:** `surface_container_lowest` background. 0px border-radius. Bottom-only border (2px) using `outline_variant`.
*   **Active:** Bottom border shifts to `primary`. Helper text appears in Monospace `label-sm`.

### Cards & Lists
*   **Rule:** No dividers. Use vertical spacing (Scale `8` or `10`) to separate items.
*   **Interaction:** A "Selected" list item should have a 4px vertical "tab" of `primary` color on its left edge.

### Data Terminals (Custom Component)
*   A specialized container for technical readouts. Uses a `surface_container_lowest` background with a faint scan-line overlay (linear-gradient). All text inside is Monospace `body-sm` in `primary_fixed_dim`.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Align a header to the far left and the action button to a non-standard grid column (e.g., Column 10 of 12) to create visual tension.
*   **Use Monospace for Numbers:** Any variable that changes (prices, IDs, counts) must be monospaced to prevent "jumping" and look professional.
*   **Micro-Interactions:** When a user hovers over an interactive element, use a sharp, 50ms transition. Industrial tools feel "clicky" and instant, not soft and "soupy."

### Don’t:
*   **No Rounding:** Never use `border-radius`. If the system requires a "soft" touch, the maximum allowed is `4px` (ROUND_FOUR), but `0px` is preferred for the signature look.
*   **No Soft Gradients:** Avoid "sunset" or multi-color gradients. Use only tonal gradients (e.g., `surface_container_low` to `surface_container_high`) or the primary-to-transparent glow.
*   **No Standard Icons:** Avoid "bubbly" icon sets. Use thin-stroke, sharp-angled iconography that matches the `outline` weight.```