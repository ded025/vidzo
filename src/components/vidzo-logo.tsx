export function VidzoLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <img
      src="/vidzo-logo.png"
      alt="Vidzo"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
