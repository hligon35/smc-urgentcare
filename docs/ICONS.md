# Material icons

The public website and the shared CareConnect patient/admin-developer shell use
Google's **Material Icons Rounded** through `src/components/Icon.tsx`. The existing
Facebook/LinkedIn image assets and SMC/Google brand marks remain distinct.

The curated 24px SVG geometry is bundled in `src/components/material-icons.ts`.
No icon font, Google Fonts stylesheet, CDN script or new dependency is needed.
Icons inherit text color and work within the existing CSP. Route metadata owns
public navigation icon names; portal section metadata owns portal icon names.
The same component renders both, including mobile web navigation.

All current uses are decorative alongside a visible text label. SVGs are hidden
from assistive technology and cannot receive focus. Icon-only navigation toggles
retain their accessible labels. Password visibility buttons retain their text,
announce Show/Hide password, and expose their pressed state. FAQ disclosure uses
native details/summary behavior, with a Material chevron respecting reduced motion.

To add an icon, obtain its 24px Rounded SVG from the pinned Google source below,
preserve its visible path geometry in the shared registry, then reference its
semantic name from the existing component. Transparent canvas paths were omitted
when converting the source SVGs to path arrays; geometry was not redrawn.

Source: https://github.com/google/material-design-icons/tree/49d4db35df873165d6bd6ba09b063c7dafbac2f4/src

Copyright Google LLC. Licensed under Apache-2.0; full license is retained in
`assets/licenses/material-icons-LICENSE.txt`.

This repository currently has one CareConnect shell for patient and
admin/developer users, rather than a separate `/admin` application. This change
updates existing surfaces and does not add an admin module or alter permissions.
