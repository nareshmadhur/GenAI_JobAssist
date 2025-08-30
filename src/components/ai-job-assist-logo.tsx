import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function AiJobAssistLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-6 h-6", props.className)}
      {...props}
    >
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2z" />
      <path d="M4.5 4.5L6 6" />
      <path d="M18 6L19.5 4.5" />
      <path d="M4.5 19.5L6 18" />
      <path d="M18 18L19.5 19.5" />
    </svg>
  );
}
