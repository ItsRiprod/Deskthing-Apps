import { IconProps } from "../Icon";

export const Icon = (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14.5 1.134A1 1 0 0115 2v20a1 1 0 01-1.5.866L2.846 16.712a5.445 5.445 0 010-9.424L13.5 1.135a1 1 0 011 0zM3.847 9.02a3.444 3.444 0 000 5.96L13 20.268V3.732L3.847 9.02zM17 20.127a8.504 8.504 0 000-16.253v2.125a6.502 6.502 0 010 12.003v2.125z\" />
    <path d="M17 16.032V7.968a4.5 4.5 0 010 8.064z\" />
  </svg>
);
