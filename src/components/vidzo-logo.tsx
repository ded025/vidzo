import logoAsset from "@/assets/vidzo-logo.png.asset.json";

export function VidzoLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Vidzo" className={className} draggable={false} />;
}
