import type { ReactNode } from 'react';

interface DevModeLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const LINKS = [
  { href: '/dev-level-editor.html', label: 'Level Editor' },
  { href: '/dev-level-preview.html', label: 'Level Preview' },
  { href: '/dev-character-editor.html', label: 'Character Editor' },
  { href: '/dev-character-preview.html', label: 'Character Preview' },
  { href: '/dev-systems.html', label: 'Systems Reference' },
  { href: '/', label: 'Play Mode' },
];

export function DevModeLayout({ title, description, children }: DevModeLayoutProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Dev Mode</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-amber-300 hover:text-amber-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-5">{children}</section>
    </main>
  );
}
