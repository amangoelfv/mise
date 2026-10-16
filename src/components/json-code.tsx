import type { ReactNode } from "react";

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Tiny JSON syntax highlighter: keys, strings, numbers, literals. */
export function JsonCode({ json }: { json: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of json.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(json.slice(last, index));
    const [, str, colon, literal, number] = match;
    if (str && colon) {
      out.push(
        <span key={index} className="text-paper/55">
          {str}
        </span>,
        colon,
      );
    } else if (str) {
      out.push(
        <span key={index} className="text-paper">
          {str}
        </span>,
      );
    } else if (literal) {
      out.push(
        <span key={index} className="text-turmeric">
          {literal}
        </span>,
      );
    } else if (number) {
      out.push(
        <span key={index} className="text-saffron">
          {number}
        </span>,
      );
    }
    last = index + match[0].length;
  }
  out.push(json.slice(last));
  return <code>{out}</code>;
}
