import { UtensilsCrossed } from "lucide-react";

type MenuItemThumbnailProps = {
  name: string;
  image?: string;
  className?: string;
};

export function MenuItemThumbnail({ name, image, className = "" }: MenuItemThumbnailProps) {
  const frame =
    "relative shrink-0 overflow-hidden border border-[var(--gold)]/25 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28";

  if (image) {
    return (
      <div className={`${frame} bg-[var(--forest)]/5 ${className}`}>
        <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`menu-item-thumb-placeholder ${frame} flex items-center justify-center ${className}`}
      aria-hidden
    >
      <UtensilsCrossed
        className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-[var(--gold)]/50"
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}
