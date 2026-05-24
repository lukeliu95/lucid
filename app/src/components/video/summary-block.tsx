export function SummaryBlock({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="max-w-content border-l-4 border-amber-600 pl-6 font-serif text-3xl font-normal leading-snug text-amber-700">
      <span aria-hidden>「</span>
      {children}
      <span aria-hidden>」</span>
    </blockquote>
  );
}
