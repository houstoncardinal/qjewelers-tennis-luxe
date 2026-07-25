import type { ReactNode } from "react";

// Shared rich-text renderer for admin-authored product descriptions.
// Syntax: $$paragraph breaks$$, • bullet lines, **bold**, /italic/.
// Used by both the admin editor's Preview tab and the live product page —
// previously the admin preview implemented this and the storefront just
// dumped the raw string, so admins writing $$/•/** markup never saw it
// actually render for customers.

function renderInlineFormatting(text: string): ReactNode {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const italicParts = part.split(/(\/[^/]+\/)/g);
    return italicParts.map((p, j) => {
      if (p.startsWith("/") && p.endsWith("/") && p.length > 2) {
        return (
          <em key={`${i}-${j}`} className="italic">
            {p.slice(1, -1)}
          </em>
        );
      }
      return <span key={`${i}-${j}`}>{p}</span>;
    });
  });
}

function formatInline(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("•")) {
      const content = trimmed.slice(1).trim();
      return (
        <span key={i} className="block pl-3 -indent-2.5">
          <span className="mr-1.5">•</span>
          {renderInlineFormatting(content)}
        </span>
      );
    }
    return (
      <span key={i}>
        {i > 0 ? "\n" : ""}
        {renderInlineFormatting(line)}
      </span>
    );
  });
}

export function FormattedDescription({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={className}>
      {text.split("$$").map((block, i) =>
        i % 2 === 1 ? (
          <p key={i} className="mb-4 last:mb-0">
            {formatInline(block)}
          </p>
        ) : (
          <span key={i}>{formatInline(block)}</span>
        ),
      )}
    </div>
  );
}
