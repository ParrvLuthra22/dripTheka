// A pre-paint inline script that is safe under React 19 (see Next's "preventing flash before
// hydration" guide): real <script> on the server, inert text/plain when React renders it on
// the client, so there's no dev warning and no double execution.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
