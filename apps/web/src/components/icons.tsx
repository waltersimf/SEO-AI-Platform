import { Loader2, LucideProps } from 'lucide-react';

export const Icons = {
  spinner: Loader2,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      {...props}
    >
      <rect width="256" height="256" rx="60" fill="currentColor" />
      <path
        d="M128 32C74.98 32 32 74.98 32 128s42.98 96 96 96 96-42.98 96-96-42.98-96-96-96zm0 168c-39.7 0-72-32.3-72-72s32.3-72 72-72 72 32.3 72 72-32.3 72-72 72z"
        fill="white"
      />
      <circle cx="128" cy="128" r="32" fill="white" />
    </svg>
  ),
};
