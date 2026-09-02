import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function S({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSpark = (p: IconProps) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
  </S>
);

export const IconGrid = (p: IconProps) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </S>
);

export const IconWallet = (p: IconProps) => (
  <S {...p}>
    <rect x="2.8" y="5.5" width="18.4" height="14" rx="2.6" />
    <path d="M2.8 9.7h18.4" />
    <circle cx="16.6" cy="13.9" r="1.05" fill="currentColor" stroke="none" />
  </S>
);

export const IconTarget = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.3" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </S>
);

export const IconTasks = (p: IconProps) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.4" />
    <path d="M8.3 12.4l2.6 2.6 5-5.6" />
  </S>
);

export const IconTerminal = (p: IconProps) => (
  <S {...p}>
    <rect x="2.8" y="4.2" width="18.4" height="15.6" rx="2.6" />
    <path d="M7 9.4l3.1 3-3.1 3" />
    <path d="M12.7 15.4h4.3" />
  </S>
);

export const IconKey = (p: IconProps) => (
  <S {...p}>
    <circle cx="7.6" cy="15.6" r="4.1" />
    <path d="M10.7 12.5L20 3.2" />
    <path d="M16.6 6.6l3 3" />
    <path d="M13.9 9.3l2 2" />
  </S>
);

export const IconNote = (p: IconProps) => (
  <S {...p}>
    <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
    <path d="M14 3.5V8.5h5" />
    <path d="M9 13.5h6M9 17h4" />
  </S>
);

export const IconPlus = (p: IconProps) => (
  <S {...p}>
    <path d="M12 5.2v13.6M5.2 12h13.6" />
  </S>
);

export const IconTrash = (p: IconProps) => (
  <S {...p}>
    <path d="M4.2 6.8h15.6" />
    <path d="M9.2 6.8V5.2a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v1.6" />
    <path d="M6.4 6.8l.8 12.1a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.8-12.1" />
    <path d="M10.1 10.8v5.6M13.9 10.8v5.6" />
  </S>
);

export const IconCopy = (p: IconProps) => (
  <S {...p}>
    <rect x="9" y="9" width="11.2" height="11.2" rx="2" />
    <path d="M5.4 15H4.8A1.8 1.8 0 0 1 3 13.2V4.8A1.8 1.8 0 0 1 4.8 3h8.4A1.8 1.8 0 0 1 15 4.8v.6" />
  </S>
);

export const IconCheck = (p: IconProps) => (
  <S {...p}>
    <path d="M4.8 12.6l4.6 4.6L19.2 7" />
  </S>
);

export const IconX = (p: IconProps) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);

export const IconSearch = (p: IconProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.4" />
    <path d="M15.8 15.8L21 21" />
  </S>
);

export const IconEye = (p: IconProps) => (
  <S {...p}>
    <path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12z" />
    <circle cx="12" cy="12" r="2.7" />
  </S>
);

export const IconEyeOff = (p: IconProps) => (
  <S {...p}>
    <path d="M10.4 6a10 10 0 0 1 1.6-.13c5.8 0 9.4 6.13 9.4 6.13a16.6 16.6 0 0 1-2.8 3.5M6.6 6.9A16 16 0 0 0 2.6 12s3.6 6.1 9.4 6.1a9.7 9.7 0 0 0 4.4-1" />
    <path d="M9.9 9.9a2.9 2.9 0 0 0 4.1 4.1" />
    <path d="M3.5 3.5l17 17" />
  </S>
);

export const IconStar = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <S {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
  </S>
);

export const IconPencil = (p: IconProps) => (
  <S {...p}>
    <path d="M15.3 5.2l3.5 3.5L8.3 19.2l-4.5 1 1-4.5z" />
    <path d="M13.3 7.2l3.5 3.5" />
  </S>
);

export const IconChevronL = (p: IconProps) => (
  <S {...p}>
    <path d="M14.5 6L9 12l5.5 6" />
  </S>
);

export const IconChevronR = (p: IconProps) => (
  <S {...p}>
    <path d="M9.5 6l5.5 6-5.5 6" />
  </S>
);

export const IconClock = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3.1 2.1" />
  </S>
);

export const IconArrowUpR = (p: IconProps) => (
  <S {...p}>
    <path d="M7 17L17 7M9.2 7H17v7.8" />
  </S>
);

export const IconArrowDownR = (p: IconProps) => (
  <S {...p}>
    <path d="M7 7l10 10M17 9.2V17H9.2" />
  </S>
);

export const IconRefresh = (p: IconProps) => (
  <S {...p}>
    <path d="M19.8 12a7.8 7.8 0 1 1-2.2-5.4" />
    <path d="M19.9 3.6v4h-4" />
  </S>
);

export const IconPin = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <S {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M9.2 3.8h5.6l-.9 6 3.4 3.4H6.7l3.4-3.4z" />
    <path d="M12 13.2v7" />
  </S>
);

export const IconCalendar = (p: IconProps) => (
  <S {...p}>
    <rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4" />
    <path d="M3.6 9.6h16.8M8.2 3v4M15.8 3v4" />
  </S>
);

export const IconFlame = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3.2s5.2 4.6 5.2 9.1a5.2 5.2 0 0 1-10.4 0c0-1.9.9-3.6 2.1-5C10 8.6 12 3.2 12 3.2z" />
  </S>
);

export const IconSend = (p: IconProps) => (
  <S {...p}>
    <path d="M20.2 3.8L4 10.4l6.6 2.6 2.6 6.6z" />
    <path d="M20.2 3.8l-9.6 9.2" />
  </S>
);

export const IconInbox = (p: IconProps) => (
  <S {...p}>
    <path d="M5.4 5.4h13.2L21 13v4.6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13z" />
    <path d="M3.4 13h4.4l1.8 2.8h4.8l1.8-2.8h4.4" />
  </S>
);

export const IconZap = (p: IconProps) => (
  <S {...p}>
    <path d="M13 2.5L4.5 13.7h6l-1 7.8 9-11.2h-6z" />
  </S>
);

export const IconLock = (p: IconProps) => (
  <S {...p}>
    <rect x="5" y="10.6" width="14" height="9.6" rx="2.2" />
    <path d="M8.2 10.6V8a3.8 3.8 0 0 1 7.6 0v2.6" />
  </S>
);

export const IconTrendUp = (p: IconProps) => (
  <S {...p}>
    <path d="M3.5 16.5l5.5-5.5 3.8 3.8 7.7-8.3" />
    <path d="M14.5 6.5h6v6" />
  </S>
);

export const IconAlert = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3.6L2.8 19.4h18.4z" />
    <path d="M12 9.8v4.4" />
    <circle cx="12" cy="16.8" r="0.55" fill="currentColor" stroke="none" />
  </S>
);

export const IconDownload = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3.5V14M7.5 9.5L12 14l4.5-4.5" />
    <path d="M4.5 14.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
  </S>
);

export const IconUpload = (p: IconProps) => (
  <S {...p}>
    <path d="M12 14V3.5M7.5 8L12 3.5 16.5 8" />
    <path d="M4.5 14.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
  </S>
);

export const IconDots = (p: IconProps) => (
  <S {...p} stroke="none" fill="currentColor">
    <circle cx="5.4" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="18.6" cy="12" r="1.4" />
  </S>
);
