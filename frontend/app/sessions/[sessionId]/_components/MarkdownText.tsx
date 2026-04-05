'use client';

import type { ReactNode } from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
  inline?: boolean;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.95em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export function MarkdownText({ content, className, inline = false }: MarkdownTextProps) {
  if (inline) {
    return <span className={className}>{renderInlineMarkdown(content)}</span>;
  }

  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter(Boolean);
        const isList = lines.every((line) => line.trim().startsWith('- '));

        if (isList) {
          return (
            <ul key={`block-${blockIndex}`} className="grid gap-2">
              {lines.map((line, lineIndex) => (
                <li key={`line-${lineIndex}`} className="flex gap-2">
                  <span className="mt-[10px] inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{renderInlineMarkdown(line.trim().slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-line">
            {renderInlineMarkdown(block)}
          </p>
        );
      })}
    </div>
  );
}
