# Material icons

The public website uses Google’s Material Icons Rounded through `src/components/Icon.tsx`. The supplied social images and clinic logo remain distinct. Curated 24px SVG geometry is bundled in `src/components/material-icons.ts`; no remote icon font or stylesheet is required.

Icons inherit text color. Decorative SVGs are hidden from assistive technology and cannot receive focus; visible text or an accessible button label identifies the action. The mobile menu synchronizes its icon with expanded state. FAQs use native details/summary and reduced-motion chevrons.

To add an icon, preserve the 24px Rounded source geometry and reference its semantic name through the component. Source: https://github.com/google/material-design-icons/tree/49d4db35df873165d6bd6ba09b063c7dafbac2f4/src

Copyright Google LLC. Apache-2.0; license in `assets/licenses/material-icons-LICENSE.txt`.
