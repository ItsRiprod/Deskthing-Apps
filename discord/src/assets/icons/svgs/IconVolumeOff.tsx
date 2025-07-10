import { IconProps } from "../Icon";

export const Icon = (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17.293 15.207a1 1 0 001.414 0l1.793-1.793 1.793 1.793a1 1 0 001.414-1.414L21.914 12l1.793-1.793a1 1 0 00-1.414-1.414L20.5 10.586l-1.793-1.793a1 1 0 10-1.414 1.414L19.086 12l-1.793 1.793a1 1 0 000 1.414zM14.5 1.134A1 1 0 0115 2v20a1 1 0 01-1.5.866L2.846 16.712a5.445 5.445 0 010-9.424L13.5 1.135a1 1 0 011 0zM3.847 9.02a3.444 3.444 0 000 5.96L13 20.268V3.732L3.847 9.02z\" />
  </svg>
);
