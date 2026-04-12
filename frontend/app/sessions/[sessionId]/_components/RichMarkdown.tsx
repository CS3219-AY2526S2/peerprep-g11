'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RichMarkdownProps {
  content: string;
  className?: string;
}

export function RichMarkdown({ content, className }: RichMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');

            if (match) {
              return (
                <div className="my-2 overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {match[1]}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '12px 16px',
                      fontSize: '12px',
                      lineHeight: '20px',
                      background: 'hsl(var(--secondary) / 0.15)',
                      border: 'none',
                      borderRadius: 0,
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'var(--font-mono)',
                      },
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return (
              <p className="text-[12.5px] leading-relaxed text-foreground/90">
                {children}
              </p>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-foreground">{children}</strong>
            );
          },
          ul({ children }) {
            return <ul className="my-1 grid gap-1 pl-4">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-1 grid gap-1 pl-4 list-decimal">{children}</ol>;
          },
          li({ children }) {
            return (
              <li className="text-[12.5px] leading-relaxed text-foreground/90 list-disc">
                {children}
              </li>
            );
          },
          h1({ children }) {
            return <h1 className="text-[15px] font-semibold text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-[14px] font-semibold text-foreground">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-[13px] font-semibold text-foreground">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-accent/30 pl-3 text-[12.5px] italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
