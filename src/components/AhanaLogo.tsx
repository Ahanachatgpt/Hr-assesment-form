export function AhanaLogo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const h =
    size === "lg"
      ? "h-16 sm:h-[80px] md:h-[88px]"
      : size === "sm"
        ? "h-10 sm:h-12"
        : "h-12 sm:h-16 md:h-[72px]";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ahana-logo-white.png?v=4"
      alt="Ahana Hospitals & Research Center"
      className={`${h} w-auto max-w-full object-contain object-right ${className}`}
    />
  );
}
