export default function NotFound() {
  return (
    <div className="text-center py-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
        404 - Not Found
      </h1>
      <p className="text-sm text-[var(--foreground-muted)] mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-block px-4 py-2 bg-[var(--background-elevated)] border border-[var(--border)] text-[var(--foreground)] rounded text-sm font-medium hover:border-[var(--border-hover)] hover:bg-[var(--background-hover)] transition-colors"
      >
        Return Home
      </a>
    </div>
  )
}

