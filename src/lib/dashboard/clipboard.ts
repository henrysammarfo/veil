export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(
      () => {
        import("sonner")
          .then(({ toast }) =>
            toast.success("Copied to clipboard", {
              description: text.length > 40 ? text.slice(0, 38) + "…" : text,
            }),
          )
          .catch(() => {});
        return true;
      },
      () => {
        import("sonner").then(({ toast }) => toast.error("Could not copy")).catch(() => {});
        return false;
      },
    );
  }
  return Promise.resolve(false);
}
