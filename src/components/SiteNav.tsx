import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/food-fort-logo.png";
import { CartButton, CartDrawer } from "@/components/CartDrawer";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--forest-deep)]/90 backdrop-blur-md border-b border-[var(--gold)]/15"
          : "bg-[var(--forest-deep)] lg:bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="Food Fort" className="h-16 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-10 eyebrow text-[var(--cream)]/85 absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="hover:text-[var(--gold)] transition-colors">Home</Link>
          <Link to="/menu" className="hover:text-[var(--gold)] transition-colors">Menu</Link>
          <Link to="/visit" className="hover:text-[var(--gold)] transition-colors">Visit</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/menu"
            className="hidden md:inline-flex items-center gap-2 eyebrow text-[var(--gold-foreground)] bg-[var(--gold)] hover:bg-[var(--gold-soft)] px-5 py-3 transition-colors"
          >
            Order Online
          </Link>
          <CartButton onClick={() => setCartOpen(true)} />

          <button
            aria-label="Menu"
            onClick={() => setOpen(v => !v)}
            className="md:hidden text-[var(--cream)] p-2"
          >
            <span className="block w-6 h-px bg-current mb-1.5" />
            <span className="block w-6 h-px bg-current mb-1.5" />
            <span className="block w-4 h-px bg-current ml-auto" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[var(--forest-deep)] border-t border-[var(--gold)]/15">
          <div className="px-6 py-8 flex flex-col gap-6 eyebrow text-[var(--cream)]">
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/menu" onClick={() => setOpen(false)}>Menu</Link>
            <Link to="/visit" onClick={() => setOpen(false)}>Visit</Link>
            <Link to="/menu" onClick={() => setOpen(false)} className="text-[var(--gold)]">Order Online</Link>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
