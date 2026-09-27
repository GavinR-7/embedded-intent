/**
 * A structured-data block.
 *
 * `<` is escaped to `<` because `JSON.stringify` does not sanitise for HTML
 * — a string containing `</script>` would otherwise close this tag and let the
 * rest of the value be parsed as markup. Everything fed to this component comes
 * from typed content modules in this repo rather than from user input, so it is
 * belt and braces; it is also the documented recommendation, and the cost is one
 * `replace`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
