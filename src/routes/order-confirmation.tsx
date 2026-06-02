import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import { formatPrice } from "@/lib/cart";
import { restaurant } from "@/lib/menu-data";

type SearchParams = { id?: string };

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed · Food Fort" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmationPage,
});

type Order = {
  id: string;
  type: "pickup" | "dinein";
  pickupTime: string | null;
  table: string | null;
  customer: { name: string; phone: string; email: string; notes: string };
  items: { id: string; name: string; price: number; qty: number }[];
  subtotal: number;
  total: number;
  placedAt: string;
};

function ConfirmationPage() {
  const { id } = Route.useSearch();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orderId = id ?? window.localStorage.getItem("foodfort_last_order");
    if (!orderId) return;
    const raw = window.localStorage.getItem(`foodfort_order_${orderId}`);
    if (raw) setOrder(JSON.parse(raw));
  }, [id]);

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      <section className="pt-40 pb-20 px-6 lg:px-10 bg-[var(--forest-deep)] text-[var(--cream)] text-center grain relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl">
          <CheckCircle2 className="w-16 h-16 mx-auto text-[var(--gold)]" />
          <p className="eyebrow text-[var(--gold)] mt-6">Order Confirmed</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] leading-none">
            Thank <span className="italic gold-text">you.</span>
          </h1>
          <Ornament className="w-40 mx-auto text-[var(--gold)] mt-8" />
          {order && (
            <p className="mt-8 text-[var(--cream)]/70">
              Order <span className="text-[var(--gold)] font-mono">#{order.id}</span> received and sent to the kitchen.
            </p>
          )}
        </div>
      </section>

      {order ? (
        <div className="px-6 lg:px-10 py-20">
          <div className="mx-auto max-w-3xl">
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              <InfoCard
                icon={<Clock className="w-5 h-5" />}
                label={order.type === "pickup" ? "Pickup time" : "Table"}
                value={
                  order.type === "pickup"
                    ? order.pickupTime === "asap"
                      ? "ASAP (≈20 min)"
                      : `In ${order.pickupTime} minutes`
                    : `Table ${order.table}`
                }
              />
              <InfoCard
                icon={order.type === "pickup" ? <MapPin className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                label={order.type === "pickup" ? "Pickup at" : "Questions?"}
                value={order.type === "pickup" ? restaurant.address : restaurant.phone}
              />
            </div>

            <div className="bg-white border border-[var(--gold)]/20 p-6 lg:p-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-display text-2xl">Order summary</h2>
                <span className="eyebrow text-xs text-[var(--forest)]/60">{order.items.length} items</span>
              </div>

              <ul className="divide-y divide-[var(--gold)]/15">
                {order.items.map(i => (
                  <li key={i.id} className="py-4 flex justify-between gap-4 text-sm">
                    <span><span className="text-[var(--gold)] mr-2">{i.qty}×</span>{i.name}</span>
                    <span className="font-display text-base">{formatPrice(i.qty * i.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-[var(--gold)]/30 flex justify-between items-baseline">
                <span className="eyebrow">Paid</span>
                <span className="font-display text-3xl gold-text">{formatPrice(order.total)}</span>
              </div>

              {order.customer.notes && (
                <div className="mt-6 p-4 bg-[var(--cream)] text-sm">
                  <p className="eyebrow text-xs text-[var(--forest)]/60 mb-1">Notes</p>
                  {order.customer.notes}
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/menu"
                className="inline-block bg-[var(--forest-deep)] text-[var(--cream)] eyebrow px-8 py-4 hover:bg-[var(--forest)] transition-colors"
              >
                Order again
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-32 text-center">
          <p className="text-[var(--forest)]/70">No recent order found.</p>
          <Link to="/menu" className="mt-6 inline-block eyebrow border-b border-[var(--gold)] pb-1">
            Browse menu
          </Link>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[var(--gold)]/20 p-5 flex items-start gap-4">
      <div className="text-[var(--gold)] mt-0.5">{icon}</div>
      <div>
        <p className="eyebrow text-xs text-[var(--forest)]/60">{label}</p>
        <p className="mt-1 font-display text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}
