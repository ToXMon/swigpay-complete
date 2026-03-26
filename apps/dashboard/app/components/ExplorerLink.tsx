import type { ReactNode } from "react";

interface ExplorerLinkProps {
  children: ReactNode;
  href: string;
  className?: string;
}

export function ExplorerLink({ children, href, className = "" }: ExplorerLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-cyan-300 underline-offset-4 transition hover:text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${className}`.trim()}
    >
      {children}
    </a>
  );
}
