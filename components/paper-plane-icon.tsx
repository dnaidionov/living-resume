export function PaperPlaneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.2 10.9L20.3 3.6L12.7 20.6L10 13.7L3.2 10.9Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M10 13.7L20.3 3.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
