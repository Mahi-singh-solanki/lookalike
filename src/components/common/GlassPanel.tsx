import type { PropsWithChildren } from "react";
import clsx from "clsx";

interface GlassPanelProps extends PropsWithChildren {
  className?: string;
}

export const GlassPanel = ({ className, children }: GlassPanelProps) => {
  return <div className={clsx("glass rounded-3xl shadow-soft", className)}>{children}</div>;
};
