import { Link } from "@tanstack/react-router";
import logo from "@/assets/food-fort-logo.png";
import { restaurant } from "@/lib/menu-data";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--forest-deep)] text-[var(--cream)] relative grain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 relative">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <img src={logo} alt="Food Fort" className="h-20 w-auto -ml-2" />
            <p className="mt-6 font-display text-2xl text-[var(--gold-soft)] italic">
              Hunger ends here.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--cream)]/65">
              Freshly prepared daily with 100% halal ingredients. A neighbourhood
              kitchen in Bluff Point built on great taste and fresh flavour.
            </p>
          </div>

          <div className="lg:col-span-3">
            <h4 className="eyebrow text-[var(--gold)] mb-6">Visit</h4>
            <p className="text-sm leading-relaxed text-[var(--cream)]/80">
              {restaurant.address}
            </p>
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block eyebrow text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Get directions →
            </a>
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow text-[var(--gold)] mb-6">Contact</h4>
            <a href={restaurant.phoneHref} className="block text-sm hover:text-[var(--gold)] transition-colors">
              {restaurant.phone}
            </a>
            <a href={`mailto:${restaurant.email}`} className="block mt-2 text-sm hover:text-[var(--gold)] transition-colors">
              {restaurant.email}
            </a>
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow text-[var(--gold)] mb-6">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-[var(--gold)] transition-colors">Home</Link></li>
              <li><Link to="/menu" className="hover:text-[var(--gold)] transition-colors">Menu</Link></li>
              <li><Link to="/visit" className="hover:text-[var(--gold)] transition-colors">Visit</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-[var(--gold)]/15 flex flex-col md:flex-row justify-between gap-4 eyebrow text-[var(--cream)]/45">
          <span>© {new Date().getFullYear()} Food Fort. All rights reserved.</span>
          <span>100% Halal · Freshly Prepared Daily</span>
        </div>
      </div>
    </footer>
  );
}
