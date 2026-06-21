import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  Store,
  Utensils,
  Loader2,
  LockKeyhole,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart, formatPrice, serviceChargeFor, cardProcessingFeeFor } from "@/lib/cart";
import {
  getSoldOutCartItemIds,
  isSoldOutMessage,
  soldOutIdsFromError,
} from "@/lib/menu-availability";
import {
  fetchOperationHours,
  getStoreClosedMessage,
  isStoreClosedMessage,
  isStoreOpen,
} from "@/lib/operation-hours";
import {
  getStripeConnectConfig,
  createPaymentIntent,
  confirmPayment,
  type OrderType,
} from "@/lib/orders";
import {
  fetchOrderingStatus,
  getOrderingPausedMessage,
  ORDERING_PAUSED_MESSAGE,
} from "@/lib/ordering-status";
import {
  CHECKOUT_LIMITS,
  filterEmailInput,
  filterNameInput,
  filterNotesInput,
  filterPhoneInput,
  filterTableInput,
  validateCheckoutDetails,
  type CheckoutField,
} from "@/lib/checkout-validation";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · Food Fort" },
      { name: "description", content: "Complete your Food Fort order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  disableLink: true,
  style: {
    base: {
      fontSize: "14px",
      color: "#1a2e1a",
      "::placeholder": { color: "#9ca38f" },
      fontFamily: "inherit",
    },
    invalid: { color: "#c0392b" },
  },
} as const;

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

function CheckoutPage() {
  const { items } = useCart();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStripeConnectConfig()
      .then(({ connectedAccountId }) => {
        if (cancelled) return;
        setStripePromise(loadStripe(STRIPE_PUBLISHABLE_KEY, { stripeAccount: connectedAccountId }));
      })
      .catch(() => {
        if (!cancelled) setStripeError("Could not load payment form. Please refresh.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
        <SiteNav />
        <section className="pt-40 pb-32 text-center px-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-[var(--gold)]/40" />
          <h1 className="mt-8 font-display text-4xl">Your basket is empty</h1>
          <p className="mt-4 text-[var(--forest)]/70">
            Add a few dishes from the menu to get started.
          </p>
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
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 eyebrow text-[var(--cream)]/70 hover:text-[var(--gold)]"
          >
            <ArrowLeft className="w-3 h-3" /> Back to menu
          </Link>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-none">Checkout</h1>
          <p className="mt-3 text-[var(--cream)]/70">Complete your order — pickup or dine-in.</p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-16">
        {stripeError ? (
          <p className="text-center text-red-700">{stripeError}</p>
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        ) : (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

// ─── CheckoutForm (inside Elements) ───────────────────────────────────────────

function SoldOutBanner() {
  return (
    <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>
        One or more items in your order are sold out. Remove them from your cart to continue with
        payment.
      </p>
    </div>
  );
}

function ClosedBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function CheckoutForm() {
  const { items, subtotal, clear, soldOutIds, markSoldOut, hasSoldOutItems } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [tableNo, setTableNo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeClosedMessage, setStoreClosedMessage] = useState("");
  const [orderingPaused, setOrderingPaused] = useState(false);
  const [orderingPausedMessage, setOrderingPausedMessage] = useState("");

  const serviceFee = useMemo(() => serviceChargeFor(subtotal), [subtotal]);
  const cardFee = useMemo(
    () => cardProcessingFeeFor(subtotal + serviceFee),
    [subtotal, serviceFee],
  );
  const total = useMemo(
    () => +(subtotal + serviceFee + cardFee).toFixed(2),
    [subtotal, serviceFee, cardFee],
  );
  const cartItemKey = items.map((i) => i.id).join("|");

  useEffect(() => {
    let cancelled = false;
    getSoldOutCartItemIds(items)
      .then((ids) => {
        if (!cancelled && ids.length > 0) markSoldOut(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cartItemKey, items, markSoldOut]);

  useEffect(() => {
    let cancelled = false;
    fetchOperationHours()
      .then((hours) => {
        if (cancelled) return;
        const open = isStoreOpen(hours);
        setStoreOpen(open);
        setStoreClosedMessage(open ? "" : getStoreClosedMessage(hours));
      })
      .catch(() => {
        if (!cancelled) {
          setStoreOpen(true);
          setStoreClosedMessage("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOrderingStatus()
      .then((status) => {
        if (cancelled) return;
        setOrderingPaused(status.paused);
        setOrderingPausedMessage(getOrderingPausedMessage(status));
      })
      .catch(() => {
        if (!cancelled) {
          setOrderingPaused(false);
          setOrderingPausedMessage("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const validation = useMemo(
    () =>
      validateCheckoutDetails({
        name,
        phone,
        email,
        notes,
        tableNo,
        orderType,
      }),
    [name, phone, email, notes, tableNo, orderType],
  );

  const canPay = items.length > 0 && !hasSoldOutItems && storeOpen && !orderingPaused;

  function markTouched(field: CheckoutField) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function fieldError(field: CheckoutField): string | undefined {
    if (!touched[field] && !submitAttempted) return undefined;
    return validation.errors[field];
  }

  function handleFieldChange(field: CheckoutField, value: string, setter: (value: string) => void) {
    setter(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    const result = validateCheckoutDetails({
      name,
      phone,
      email,
      notes,
      tableNo,
      orderType,
    });
    setSubmitAttempted(true);
    setTouched({
      name: true,
      phone: true,
      email: true,
      notes: true,
      tableNo: true,
    });
    if (!result.ok) return;

    const { sanitized } = result;
    if (items.length === 0 || hasSoldOutItems || !storeOpen || orderingPaused) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    setProcessing(true);
    setCardError(null);

    try {
      const pi = await createPaymentIntent({
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          baseName: i.baseName,
          qty: i.qty,
          extras: i.extras?.map((e) => ({ name: e.name })),
          variant: i.variant ? { name: i.variant.name } : undefined,
          sauces: i.sauces?.map((s) => ({ name: s.name })),
        })),
        orderType: sanitized.orderType,
        customerName: sanitized.customerName,
        customerPhone: sanitized.customerPhone,
        customerEmail: sanitized.customerEmail,
        customerNotes: sanitized.customerNotes || undefined,
        tableNumber: sanitized.orderType === "dinein" ? sanitized.tableNumber : undefined,
      });

      const { error, paymentIntent } = await stripe.confirmCardPayment(pi.clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: sanitized.customerName,
            email: sanitized.customerEmail,
          },
        },
      });

      if (error) {
        setCardError(error.message ?? "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status !== "succeeded") {
        setCardError("Payment was not completed. Please try again.");
        setProcessing(false);
        return;
      }

      const { orderId, order } = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        items,
        orderType: sanitized.orderType,
        customerName: sanitized.customerName,
        customerPhone: sanitized.customerPhone,
        customerEmail: sanitized.customerEmail,
        customerNotes: sanitized.customerNotes || undefined,
        tableNumber: sanitized.orderType === "dinein" ? sanitized.tableNumber : undefined,
      });

      try {
        window.localStorage.setItem(
          `foodfort_order_${orderId}`,
          JSON.stringify({ ...order, id: orderId }),
        );
        window.localStorage.setItem("foodfort_last_order", orderId);
      } catch {
        // localStorage unavailable
      }

      clear();
      navigate({ to: "/order-confirmation", search: { id: orderId } });
    } catch (err: unknown) {
      console.error("Checkout failed", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not complete your order. Please try again.";

      if (isSoldOutMessage(msg)) {
        const ids = soldOutIdsFromError(msg, items);
        if (ids.length > 0) markSoldOut(ids);
        toast.error("An item in your cart is sold out. Remove it to continue.");
      } else if (/ordering is temporarily paused/i.test(msg)) {
        setOrderingPaused(true);
        setOrderingPausedMessage(msg || ORDERING_PAUSED_MESSAGE);
        toast.error(msg || ORDERING_PAUSED_MESSAGE);
      } else if (isStoreClosedMessage(msg)) {
        setStoreOpen(false);
        setStoreClosedMessage(msg);
        toast.error(msg);
      } else {
        toast.error(msg);
      }
      setProcessing(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_400px] gap-12"
    >
      <div className="space-y-12">
        <section>
          <SectionTitle number="01" title="Order Type" />
          <div className="grid sm:grid-cols-2 gap-4">
            <TypeCard
              active={orderType === "pickup"}
              onClick={() => setOrderType("pickup")}
              icon={<Store className="w-6 h-6" />}
              title="Pickup"
              desc="Collect your order from the restaurant."
              disabled={processing}
            />
            <TypeCard
              active={orderType === "dinein"}
              onClick={() => setOrderType("dinein")}
              icon={<Utensils className="w-6 h-6" />}
              title="Dine-In"
              desc="We'll bring it to your table."
              disabled={processing}
            />
          </div>

          {orderType === "dinein" && (
            <div className="mt-6">
              <Field label="Table number" required error={fieldError("tableNo")}>
                <Input
                  value={tableNo}
                  onChange={(e) =>
                    handleFieldChange("tableNo", filterTableInput(e.target.value), setTableNo)
                  }
                  onBlur={() => markTouched("tableNo")}
                  placeholder="e.g. 7"
                  disabled={processing}
                  autoComplete="off"
                  inputMode="text"
                  maxLength={CHECKOUT_LIMITS.tableMax}
                  aria-invalid={Boolean(fieldError("tableNo"))}
                />
              </Field>
            </div>
          )}
        </section>

        <section>
          <SectionTitle number="02" title="Your Details" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required error={fieldError("name")}>
              <Input
                value={name}
                onChange={(e) =>
                  handleFieldChange("name", filterNameInput(e.target.value), setName)
                }
                onBlur={() => markTouched("name")}
                placeholder="Jane Smith"
                disabled={processing}
                autoComplete="name"
                maxLength={CHECKOUT_LIMITS.nameMax}
                aria-invalid={Boolean(fieldError("name"))}
              />
            </Field>
            <Field label="Phone" required error={fieldError("phone")}>
              <Input
                type="tel"
                value={phone}
                onChange={(e) =>
                  handleFieldChange("phone", filterPhoneInput(e.target.value), setPhone)
                }
                onBlur={() => markTouched("phone")}
                placeholder="0412345678"
                disabled={processing}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={CHECKOUT_LIMITS.phoneDigits}
                aria-invalid={Boolean(fieldError("phone"))}
              />
            </Field>
            <Field label="Email" required className="sm:col-span-2" error={fieldError("email")}>
              <Input
                type="email"
                value={email}
                onChange={(e) =>
                  handleFieldChange("email", filterEmailInput(e.target.value), setEmail)
                }
                onBlur={() => markTouched("email")}
                placeholder="jane@example.com"
                disabled={processing}
                autoComplete="email"
                inputMode="email"
                maxLength={CHECKOUT_LIMITS.emailMax}
                aria-invalid={Boolean(fieldError("email"))}
              />
            </Field>
            <Field
              label="Notes for the kitchen (optional)"
              className="sm:col-span-2"
              error={fieldError("notes")}
            >
              <textarea
                value={notes}
                onChange={(e) =>
                  handleFieldChange("notes", filterNotesInput(e.target.value), setNotes)
                }
                onBlur={() => markTouched("notes")}
                rows={3}
                disabled={processing}
                placeholder="Allergies, extra sauces, etc."
                maxLength={CHECKOUT_LIMITS.notesMax}
                aria-invalid={Boolean(fieldError("notes"))}
                className="w-full px-4 py-3 bg-white border border-[var(--gold)]/30 focus:border-[var(--forest-deep)] focus:outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed aria-invalid:border-red-400"
              />
            </Field>
          </div>
        </section>

        <section>
          <SectionTitle number="03" title="Payment" />
          <div className="bg-white border border-[var(--gold)]/30 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <LockKeyhole className="w-4 h-4 text-[var(--gold)]" />
              <span className="eyebrow text-xs text-[var(--forest)]/70">Secured by Stripe</span>
            </div>

            <div>
              <Label>Card details</Label>
              <div className="mt-2 px-4 py-3 border border-[var(--gold)]/30 focus-within:border-[var(--forest-deep)] transition-colors">
                <CardElement onChange={() => setCardError(null)} options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            {cardError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {cardError}
              </div>
            )}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 self-start">
        <div className="bg-[var(--forest-deep)] text-[var(--cream)] p-6 lg:p-8">
          <p className="eyebrow text-[var(--gold)]">Your Order</p>
          <h2 className="font-display text-2xl mt-2 mb-6">
            {items.length} item{items.length > 1 ? "s" : ""}
          </h2>

          {orderingPaused && orderingPausedMessage && (
            <div className="mb-4">
              <ClosedBanner message={orderingPausedMessage} />
            </div>
          )}

          {!orderingPaused && !storeOpen && storeClosedMessage && (
            <div className="mb-4">
              <ClosedBanner message={storeClosedMessage} />
            </div>
          )}

          {hasSoldOutItems && (
            <div className="mb-4">
              <SoldOutBanner />
            </div>
          )}

          <ul className="space-y-3 mb-6 max-h-[240px] overflow-y-auto pr-2">
            {items.map((item) => {
              const soldOut = soldOutIds.includes(item.id);
              return (
                <li
                  key={item.id}
                  className={`flex justify-between gap-3 text-sm ${soldOut ? "opacity-70" : ""}`}
                >
                  <span className="flex-1">
                    <span className="text-[var(--gold)]">{item.qty}×</span> {item.name}
                    {item.extras && item.extras.length > 0 && (
                      <span className="block mt-1 text-[0.7rem] text-[var(--cream)]/55">
                        + {item.extras.map((e) => e.name).join(", ")}
                      </span>
                    )}
                    {soldOut && (
                      <span className="block mt-1 eyebrow text-[0.65rem] text-amber-300/90">
                        Sold out — remove to continue
                      </span>
                    )}
                  </span>
                  <span className="font-display">{formatPrice(item.qty * item.price)}</span>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[var(--cream)]/15 pt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Service fee" value={formatPrice(serviceFee)} />
            <Row label="Card processing" value={formatPrice(cardFee)} />
            <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-[var(--cream)]/15">
              <span className="eyebrow">Total</span>
              <span className="font-display text-3xl gold-text">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canPay || !stripe || processing}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-soft)] text-[var(--gold-foreground)] eyebrow py-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
            <LockKeyhole className="w-4 h-4" />
            {processing
              ? "Processing…"
              : orderingPaused
                ? "Ordering paused"
                : !storeOpen
                  ? "Currently closed"
                  : hasSoldOutItems
                    ? "Remove sold out items"
                    : `Pay ${formatPrice(total)}`}
          </button>
        </div>
      </aside>
    </form>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

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
  label,
  children,
  required,
  className,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-[var(--gold)]"> *</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-white border border-[var(--gold)]/30 focus:border-[var(--forest-deep)] focus:outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed ${invalid ? "border-red-400 focus:border-red-500" : ""} ${props.className ?? ""}`}
    />
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-5 text-left border-2 transition-all ${
        active
          ? "border-[var(--forest-deep)] bg-[var(--forest-deep)] text-[var(--cream)]"
          : "border-[var(--gold)]/30 bg-white hover:border-[var(--forest-deep)]"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <div className={active ? "text-[var(--gold)]" : "text-[var(--forest-deep)]"}>{icon}</div>
      <h3 className="font-display text-xl mt-3">{title}</h3>
      <p
        className={`text-xs mt-1 ${active ? "text-[var(--cream)]/70" : "text-[var(--forest)]/60"}`}
      >
        {desc}
      </p>
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
