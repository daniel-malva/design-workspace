// FitScreenOutlined — path extracted directly from the Figma import
// (svg-jmognclaas.ts, viewBox 0 0 20 16)

interface FitScreenIconProps {
  size?: number;
  className?: string;
}

export function FitScreenIcon({ size = 24, className = '' }: FitScreenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12H16V4H4V12ZM6 6H14V10H6V6ZM2 11H0V14C0 15.1 0.9 16 2 16H5V14H2V11ZM2 2H5V0H2C0.9 0 0 0.9 0 2V5H2V2ZM18 0H15V2H18V5H20V2C20 0.9 19.1 0 18 0ZM18 14H15V16H18C19.1 16 20 15.1 20 14V11H18V14Z" />
    </svg>
  );
}
