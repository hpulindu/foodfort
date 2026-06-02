import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingBag, ArrowLeft, CreditCard, Store, Utensils, Lock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart, formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · Food Fort" },
      { name: "description", content: "Complete your Food Fort order — pickup or dine-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type OrderType = "pickup" | "dinein";

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [pickupTime, setPickupTime] = useState("asap");
  const [tableNo, setTableNo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const gst = useMemo(() => +(subtotal * 0.1).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal).toFixed(2), [subtotal]); // GST already included in AU prices

  const canSubmit =
    items.length > 0 &&
    name.trim().length > 1 &&
    phone.trim().length >= 6 &&
    card.replace(/\s/g, "").length >= 12 &&
    exp.length >= 4 &&
    cvc.length >= 3 &&
    (orderType === "pickup" || tableNo.trim().length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const orderId = `FF${Date.now().toString().slice(-6)}`;
    const order = {
      id: orderId,
      type: orderType,
      pickupTime: orderType === "pickup" ? pickupTime : null,
      table: orderType === "dinein" ? tableNo : null,
      customer: { name, phone, email, notes },
      items,
      subtotal,
      total,
      placedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(`foodfort_order_${orderId}`, JSON.stringify(order));
      window.localStorage.setItem("foodfort_last_order", orderId);
    } catch {}

    // Mock payment processing latency
    setTimeout(() => {
      clear();
      navigate({ to: "/order-confirmation", search: { id: orderId } });
    }, 900);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
        <SiteNav />
        <section className="pt-40 pb-32 text-center px-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-[var(--gold)]/40" />
          <h1 className="mt-8 font-display text-4xl">Your basket is empty</h1>
          <p className="mt-4 text-[var(--forest)]/70">Add a few dishes from the menu to get started.</p>
          <Link
            to="/menu"
            className="mt-8 inline-block bg-[var(--forest-deep)] text-[var(--cream)] eyebrow px-8 py-4 hover:bg-[var(--forest)] transition-colors"
          >
            Browse Menu
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      <section className="pt-32 pb-12 px-6 lg:px-10 bg-[var(--forest-deep)] text-[var(--cream)]">
        <div className="mx-auto max-w-6xl">
          <Link to="/menu" className="inline-flex items-center gap-2 eyebrow text-[var(--cream)]/70 hover:text-[var(--gold)]">
            <ArrowLeft className="w-3 h-3" /> Back to menu
          </Link>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-none">Checkout</h1>
          <p className="mt-3 text-[var(--cream)]/70">Complete your order — pickup or dine-in.</p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="px-6 lg:px-10 py-16">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-12">
            {/* Order type */}
            <section>
              <SectionTitle number="01" title="Order Type" />
              <div className="grid sm:grid-cols-2 gap-4">
                <TypeCard
                  active={orderType === "pickup"}
                  onClick={() => setOrderType("pickup")}
                  icon={<Store className="w-6 h-6" />}
                  title="Pickup"
                  desc="Collect your order from the restaurant."
                />
                <TypeCard
                  active={orderType === "dinein"}
                  onClick={() => setOrderType("dinein")}
                  icon={<Utensils className="w-6 h-6" />}
                  title="Dine-In"
                  desc="We'll bring it to your table."
                />
              </div>

              {orderType === "pickup" ? (
                <div className="mt-6">
                  <Label>Pickup time</Label>
                  <div className="flex flex-wrap gap-2">
                    {["asap", "15", "30", "45", "60"].map(v => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setPickupTime(v)}
                        className={`px-4 py-2.5 text-sm border transition-colors ${
                          pickupTime === v
                            ? "bg-[var(--forest-deep)] text-[var(--cream)] border-[var(--forest-deep)]"
                            : "border-[var(--gold)]/30 hover:border-[var(--forest-deep)]"
                        }`}
                      >
                        {v === "asap" ? "ASAP (≈20 min)" : `In ${v} min`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <Label>Table number</Label>
                  <Input
                    required
                    value={tableNo}
                    onChange={e => setTableNo(e.target.value)}
                    placeholder="e.g. 7"
                  />
                </div>
              )}
            </section>

            {/* Contact details */}
            <section>
              <SectionTitle number="02" title="Your Details" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" required>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
                </Field>
                <Field label="Phone" required>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="04xx xxx xxx"
                  />
                </Field>
                <Field label="Email (optional)" className="sm:col-span-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </Field>
                <Field label="Notes for the kitchen (optional)" className="sm:col-span-2">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, extra sauces, etc."
                    className="w-full px-4 py-3 bg-white border border-[var(--gold)]/30 focus:border-[var(--forest-deep)] focus:outline-none text-sm"
                  />
                </Field>
              </div>
            </section>

            {/* Payment */}
            <section>
              <SectionTitle number="03" title="Payment" />
              <div className="bg-white border border-[var(--gold)]/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 eyebrow text-[var(--forest-deep)]">
                    <CreditCard className="w-4 h-4" /> Card details
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--forest)]/60">
                    <Lock className="w-3 h-3" /> Secure
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px] gap-3">
                  <Input
                    required
                    inputMode="numeric"
                    placeholder="Card number"
                    value={card}
                    onChange={e => setCard(formatCard(e.target.value))}
                    maxLength={19}
                  />
                  <Input
                    required
                    placeholder="MM/YY"
                    value={exp}
                    onChange={e => setExp(formatExp(e.target.value))}
                    maxLength={5}
                  />
                  <Input
                    required
                    inputMode="numeric"
                    placeholder="CVC"
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <p className="mt-3 text-[11px] text-[var(--forest)]/50">
                  Demo only — no real payment will be charged.
                </p>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="bg-[var(--forest-deep)] text-[var(--cream)] p-6 lg:p-8">
              <p className="eyebrow text-[var(--gold)]">Your Order</p>
              <h2 className="font-display text-2xl mt-2 mb-6">{items.length} item{items.length > 1 ? "s" : ""}</h2>

              <ul className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-2">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="flex-1">
                      <span className="text-[var(--gold)]">{item.qty}×</span> {item.name}
                    </span>
                    <span className="font-display">{formatPrice(item.qty * item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[var(--cream)]/15 pt-4 space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row label="GST (incl.)" value={formatPrice(gst)} muted />
                <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-[var(--cream)]/15">
                  <span className="eyebrow">Total</span>
                  <span className="font-display text-3xl gold-text">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-6 w-full bg-[var(--gold)] hover:bg-[var(--gold-soft)] text-[var(--forest-deep)] eyebrow py-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing…" : `Pay ${formatPrice(total)}`}
              </button>
              <p className="mt-3 text-[11px] text-center text-[var(--cream)]/50">
                By placing this order you agree to our terms.
              </p>
            </div>
          </aside>
        </div>
      </form>

      <SiteFooter />
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-6">
      <span className="font-display text-2xl text-[var(--gold)]">{number}</span>
      <h2 className="font-display text-2xl lg:text-3xl">{title}</h2>
      <span className="flex-1 h-px bg-[var(--gold)]/20" />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="eyebrow text-xs text-[var(--forest)]/70 block mb-2">{children}</label>;
}

function Field({
  label, children, required, className,
}: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}{required && <span className="text-[var(--gold)]"> *</span>}</Label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-white border border-[var(--gold)]/30 focus:border-[var(--forest-deep)] focus:outline-none text-sm ${props.className ?? ""}`}
    />
  );
}

function TypeCard({
  active, onClick, icon, title, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 text-left border-2 transition-all ${
        active
          ? "border-[var(--forest-deep)] bg-[var(--forest-deep)] text-[var(--cream)]"
          : "border-[var(--gold)]/30 bg-white hover:border-[var(--forest-deep)]"
      }`}
    >
      <div className={active ? "text-[var(--gold)]" : "text-[var(--forest-deep)]"}>{icon}</div>
      <h3 className="font-display text-xl mt-3">{title}</h3>
      <p className={`text-xs mt-1 ${active ? "text-[var(--cream)]/70" : "text-[var(--forest)]/60"}`}>{desc}</p>
    </button>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-[var(--cream)]/60" : ""}`}>
      <span>{label}</span>
      <span className="font-display">{value}</span>
    </div>
  );
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
