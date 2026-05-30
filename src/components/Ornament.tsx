export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <line x1="0" y1="6" x2="86" y2="6" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="92" cy="6" r="1.4" fill="currentColor" />
      <path d="M100 1 L104 6 L100 11 L96 6 Z" fill="currentColor" />
      <circle cx="108" cy="6" r="1.4" fill="currentColor" />
      <line x1="114" y1="6" x2="200" y2="6" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}
