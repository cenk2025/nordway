import Image from "next/image";

/** VOON IQ parent-brand logo (transparent PNG, readable on light and dark), linking to voon.fi. */
export function VoonIqLogo({ height = 20, className }: { height?: number; className?: string }) {
  return (
    <a href="https://voon.fi" target="_blank" rel="noopener" className={className} aria-label="VOON IQ">
      <Image
        src="/brand/vooniq-logo.png"
        alt="VOON IQ"
        width={Math.round((348 / 96) * height)}
        height={height}
        className="inline-block align-middle"
      />
    </a>
  );
}
