/**
 * App-wide provider seam. Theme is handled by a pre-hydration script in the
 * layout plus a `.dark` class toggle (see theme-toggle.tsx), so no theme
 * provider library is needed. Kept as a place to add future client providers.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
