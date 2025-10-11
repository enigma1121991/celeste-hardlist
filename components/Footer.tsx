export default function Footer() {
  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[var(--foreground-muted)]">
            <p>
              by misha &lt;3
            </p>
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            <a
              href="https://discord.gg/eUWvP2wh8j"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Hardlist Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

