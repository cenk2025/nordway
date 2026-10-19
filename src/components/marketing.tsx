import { cn } from "@/lib/utils";

/** Constrained content wrapper. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto max-w-6xl px-4", className)}>{children}</div>;
}

/** Vertical section rhythm. */
export function Section({
  id,
  className,
  children,
  muted,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-20", muted && "bg-muted/40", className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Eyebrow + heading + lead block, centered by default. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-3",
        align === "center" ? "mx-auto text-center" : ""
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="text-lg text-muted-foreground">{lead}</p>}
    </div>
  );
}

/** Simple page header for inner marketing/legal pages. */
export function PageHeader({
  title,
  lead,
}: {
  title: string;
  lead?: string;
}) {
  return (
    <div className="border-b bg-aurora">
      <Container className="py-14 sm:py-20">
        <div className="max-w-3xl space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {lead && <p className="text-lg text-muted-foreground">{lead}</p>}
        </div>
      </Container>
    </div>
  );
}
