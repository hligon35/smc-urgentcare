# Mobile/tablet review scope

The shipped website uses semantic public pages with responsive navigation, grids, readable type, device safe areas, reduced motion and bottom call/directions actions. Shared native components are source reuse only; no custom patient accounts, sign-in screens or clinical dashboard remain.

The general contact form is web-only and tested in the Worker preview/export. Its short fields reflow into one column below 600px, controls use 16px text and 48px heights, and the security widget uses compact mode under 300px available width. Pending configuration leaves the fields disabled with phone/portal alternatives. Runtime scripts only load the security provider after the endpoint reports ready.

Validate current phone/tablet browser layouts, landscape menus, keyboard focus, text zoom, security-widget expiry/errors, configured/unconfigured contact states and submission errors. Local mocks do not prove external widget or inbox delivery; complete the approved nonmedical delivery test after recipient verification. Native device/store validation is a separate workflow; this repo declares web as its target platform.
