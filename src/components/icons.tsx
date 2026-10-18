import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(paths: React.ReactNode, displayName: string) {
  function Icon({ size = 18, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const ArrowRight = make(<path d="M4 12h15M13 6l6 6-6 6" />, "ArrowRight");
export const ArrowLeft = make(<path d="M20 12H5M11 6l-6 6 6 6" />, "ArrowLeft");
export const ArrowDown = make(<path d="M12 4v15M6 13l6 6 6-6" />, "ArrowDown");
export const ArrowUpRight = make(<path d="M7 17 17 7M8 7h9v9" />, "ArrowUpRight");
export const Check = make(<path d="M5 12.5l4.5 4.5L19 7.5" />, "Check");
export const Plus = make(<path d="M12 5v14M5 12h14" />, "Plus");
export const Minus = make(<path d="M5 12h14" />, "Minus");
export const Close = make(<path d="M6 6l12 12M18 6 6 18" />, "Close");
export const Copy = make(
  <>
    <path d="M8.5 8.5h11v11h-11z" />
    <path d="M15.5 8.5V4.5h-11v11h4" />
  </>,
  "Copy",
);
export const Code = make(<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />, "Code");
export const Refresh = make(<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />, "Refresh");
export const Logout = make(<path d="M14.5 4.5h5v15h-5M10 8l-4 4 4 4M6 12h10" />, "Logout");
export const Calendar = make(
  <>
    <path d="M4 7h16v13H4zM4 11h16" />
    <path d="M8 3v4M16 3v4" />
  </>,
  "Calendar",
);
export const Sliders = make(
  <>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <path d="M13 5h4v4h-4zM7 15h4v4H7z" />
  </>,
  "Sliders",
);
