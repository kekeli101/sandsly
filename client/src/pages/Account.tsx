import { type ReactNode, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bike,
  ChefHat,
  CheckCircle2,
  CreditCard,
  ClipboardList,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Save,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatGhsPesewas } from "@/lib/catalog-types";
import { trpc } from "@/lib/trpc";
import { saveApiSessionToken } from "@/lib/api-session";
import { getKitchenProfileAccess } from "@/lib/kitchen-access";
import { getOrderRefreshInterval } from "@/lib/order-refresh";
import { PasswordVisibilityInput } from "@/components/PasswordVisibilityInput";

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

const timeline = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "completed"];
type AuthMode = "login" | "register";
type AuthenticatedResponse = {
  user: { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; role: "user" | "kitchen" | "admin"; createdAt: Date; updatedAt: Date; lastSignedIn: Date };
  accessToken: string;
};

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const staffEntry = location === "/staff";
  const utils = trpc.useUtils();
  const profileQuery = trpc.storefront.profile.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const ordersQuery = trpc.storefront.orders.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: (query) => getOrderRefreshInterval(query.state.data),
    refetchOnWindowFocus: false,
  });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authView, setAuthView] = useState<"credentials" | "recovery">("credentials");
  const [recoverySent, setRecoverySent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const kitchenAccess = getKitchenProfileAccess(user?.role);

  const completeAuth = async (response: AuthenticatedResponse) => {
    saveApiSessionToken(response.accessToken);
    utils.auth.me.setData(undefined, response.user as NonNullable<typeof user>);
    toast.success(authMode === "register" ? "Account created" : "Signed in");
    if (staffEntry && (response.user.role === "kitchen" || response.user.role === "admin")) setLocation(response.user.role === "admin" ? "/admin" : "/kitchen");
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: completeAuth,
    onError: error => toast.error("Sign-in failed", { description: error.message }),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: completeAuth,
    onError: error => toast.error("Registration failed", { description: error.message }),
  });
  const passwordRecoveryMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setRecoverySent(true),
    onError: () => toast.error("Couldn’t submit the recovery request", { description: "Please check your connection and try again." }),
  });
  const saveMutation = trpc.storefront.saveProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.storefront.profile.invalidate(), utils.auth.me.invalidate()]);
      toast.success("Account details saved");
    },
    onError: error => toast.error("Couldn’t save profile", { description: error.message }),
  });
  const restartPaymentMutation = trpc.storefront.startPaystackPayment.useMutation({
    onSuccess: result => {
      toast.success("Opening secure Paystack test checkout", { description: `Continuing payment for ${result.orderNumber}.` });
      window.location.assign(result.authorizationUrl);
    },
    onError: error => toast.error("Couldn’t restart secure checkout", { description: error.message }),
  });

  useEffect(() => {
    setPhone(profileQuery.data?.phone ?? "");
    setDefaultAddress(profileQuery.data?.defaultAddress ?? "");
  }, [profileQuery.data]);

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.id]);

  if (!isAuthenticated) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={mode => { setAuthMode(mode); setAuthView("credentials"); setRecoverySent(false); }}
        authView={authView}
        setAuthView={view => { setAuthView(view); setRecoverySent(false); }}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        pending={loginMutation.isPending || registerMutation.isPending}
        recoveryPending={passwordRecoveryMutation.isPending}
        recoverySent={recoverySent}
        staffEntry={staffEntry}
        requestPasswordReset={() => passwordRecoveryMutation.mutate({ email })}
        submit={() =>
          authMode === "register"
            ? registerMutation.mutate({ name, email, password })
            : loginMutation.mutate({ email, password })
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-5 py-10 pb-28 text-[#fff7f2] sm:px-8 md:px-12 md:py-14">
      <div className="mx-auto max-w-[780px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Your account</p>
            <h1 className="mt-2 font-display text-[clamp(2.4rem,10vw,4rem)] font-black uppercase leading-none tracking-[-0.08em]">
              {user?.name || "Crunch crew"}
            </h1>
            <p className="mt-3 text-sm text-[#bdb2ac]">{user?.email || "Signed in customer"}</p>
          </div>
          <button
            type="button"
            onClick={() => logout().then(() => toast.success("Signed out"))}
            className="flex h-10 items-center gap-2 rounded-[10px] border border-[#4a403c] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#cfc2bb] hover:border-[#ff5a1f] hover:text-[#ff5a1f]"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        {kitchenAccess.canUseKitchen && (
          <section className="mt-8 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#ff5a1f] text-[#111111]">
                <ChefHat size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff5a1f]">Staff tools</p>
                <h2 className="mt-1 font-display text-[1.2rem] font-black uppercase tracking-[-0.04em]">Restaurant operations</h2>
                <p className="mt-2 text-sm leading-6 text-[#bdb2ac]">{kitchenAccess.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setLocation("/kitchen")} className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#ff5a1f] px-4 text-[10px] font-black uppercase tracking-[0.13em] text-[#17100d] shadow-[3px_3px_0_#080808]">
                    <ChefHat size={15} /> Kitchen board <ArrowRight size={15} />
                  </button>
                  {user?.role === "admin" && (
                    <button type="button" onClick={() => setLocation("/admin")} className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#ff5a1f]/55 px-4 text-[10px] font-black uppercase tracking-[0.13em] text-[#ffb09a]">
                      <BarChart3 size={15} /> Manager Console
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
          <div className="flex items-center gap-2">
            <UserRound size={17} className="text-[#ff5a1f]" />
            <h2 className="font-display text-[1.1rem] font-black uppercase tracking-[-0.03em]">Account details</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#bdb2ac]">Keep your name and delivery contact details ready for a faster checkout.</p>
          <div className="mt-5 grid gap-4">
            <Label label="Name"><input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your name" autoComplete="name" /></Label>
            <Label label="Account email"><input value={user?.email ?? ""} readOnly aria-readonly="true" className="cursor-not-allowed opacity-65" autoComplete="email" /></Label>
            <Label label="Phone"><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. 024 000 0000" /></Label>
            <Label label="Default delivery address"><textarea value={defaultAddress} onChange={event => setDefaultAddress(event.target.value)} placeholder="Add your delivery address" rows={3} /></Label>
            <p className="-mt-1 text-xs leading-5 text-[#8e827b]">Your email is your sign-in identity. Contact the restaurant if it needs to be changed.</p>
            <button type="button" disabled={saveMutation.isPending || !displayName.trim()} onClick={() => saveMutation.mutate({ displayName, phone, defaultAddress })} className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#ff5a1f] text-xs font-black uppercase tracking-[0.14em] text-[#111111] shadow-[3px_3px_0_#050505] disabled:opacity-60">
              <Save size={16} /> {saveMutation.isPending ? "Saving…" : "Save account details"}
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ClipboardList size={17} className="text-[#ff5a1f]" /><h2 className="font-display text-[1.15rem] font-black uppercase tracking-[-0.03em]">Order history</h2></div>
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8e827b]">{ordersQuery.data?.length ?? 0} order{(ordersQuery.data?.length ?? 0) === 1 ? "" : "s"} · auto refreshes</span>
          </div>
          {ordersQuery.isLoading ? (
            <div className="mt-4 h-28 animate-pulse rounded-[15px] bg-[#242424]" />
          ) : (ordersQuery.data?.length ?? 0) === 0 ? (
            <div className="mt-4 rounded-[15px] border border-[#393432] bg-[#242424] p-6 text-sm leading-6 text-[#bdb2ac]">Your completed and active orders, payment choices, item details, and live preparation updates will appear here.</div>
          ) : (
            <div className="mt-4 space-y-4">{ordersQuery.data?.map(order => <OrderCard key={order.id} order={order} retryPaystackPayment={() => restartPaymentMutation.mutate({ orderId: order.id })} retryingPayment={restartPaymentMutation.isPending} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}

function AuthScreen({
  authMode, setAuthMode, authView, setAuthView, name, setName, email, setEmail, password, setPassword,
  pending, recoveryPending, recoverySent, requestPasswordReset, submit,
  staffEntry,
}: {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authView: "credentials" | "recovery";
  setAuthView: (view: "credentials" | "recovery") => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  pending: boolean;
  recoveryPending: boolean;
  recoverySent: boolean;
  requestPasswordReset: () => void;
  submit: () => void;
  staffEntry: boolean;
}) {
  return <div className="min-h-[calc(100vh-62px)] bg-[#0b0b0b] px-5 py-14 text-[#fff7f2] sm:px-8 md:min-h-screen md:px-12 md:py-24"><div className="mx-auto max-w-[620px]">
    <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#ff5a1f] text-[#111111] shadow-[4px_4px_0_#000]"><UserRound size={25} /></span>
    <p className="mt-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">{staffEntry ? "Restaurant staff access" : "Your Crunch Bite account"}</p>
    <h1 className="mt-2 font-display text-[clamp(2.6rem,12vw,5rem)] font-black uppercase leading-[0.86] tracking-[-0.08em]">{staffEntry ? "Operations sign-in." : "Order with confidence."}</h1>
    <p className="mt-6 max-w-[430px] text-[0.98rem] leading-7 text-[#bdb2ac]">{staffEntry ? "Kitchen and manager accounts open their role-specific workspace immediately after sign-in." : "Save your bag, delivery details, payment selection, and every order milestone."}</p>
    <form onSubmit={event => { event.preventDefault(); authView === "recovery" ? requestPasswordReset() : submit(); }} className="mt-8 max-w-[420px] rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
      {authView === "recovery" ? <>
        <p className="text-sm leading-6 text-[#d9cec7]">Enter your email address. If it matches a local Crunch Bite account, we’ll send password-reset instructions.</p>
        <Label label="Email"><input required value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" /></Label>
        {recoverySent && <p role="status" className="mt-4 rounded-[9px] border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-3 text-sm leading-6 text-[#ffd1c2]">If an eligible Crunch Bite account matches that email, reset instructions have been sent. Check your inbox and spam folder.</p>}
        <button type="submit" disabled={recoveryPending} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#000] disabled:opacity-60"><KeyRound size={17} /> {recoveryPending ? "Sending…" : "Send reset instructions"}</button>
        <button type="button" onClick={() => setAuthView("credentials")} className="mt-4 w-full text-center text-xs font-bold text-[#bdb2ac] underline decoration-[#ff5a1f]/60 underline-offset-4 hover:text-[#ffb09a]">Back to sign in</button>
      </> : <>
        {!staffEntry && <div className="flex gap-2 rounded-[9px] bg-[#171717] p-1"><button type="button" onClick={() => setAuthMode("login")} className={`flex-1 rounded-[7px] py-2 text-[10px] font-black uppercase tracking-[0.12em] ${authMode === "login" ? "bg-[#ff5a1f] text-[#17100d]" : "text-[#a89d96]"}`}>Sign in</button><button type="button" onClick={() => setAuthMode("register")} className={`flex-1 rounded-[7px] py-2 text-[10px] font-black uppercase tracking-[0.12em] ${authMode === "register" ? "bg-[#ff5a1f] text-[#17100d]" : "text-[#a89d96]"}`}>Create account</button></div>}
        {authMode === "register" && <Label label="Name"><input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" /></Label>}
        <Label label="Email"><input required value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" /></Label>
        <Label label="Password"><PasswordVisibilityInput value={password} onChange={setPassword} autoComplete={authMode === "login" ? "current-password" : "new-password"} describedBy={authMode === "register" ? "password-requirements" : undefined} /></Label>
        {authMode === "register" && <p id="password-requirements" className="mt-2 text-xs leading-5 text-[#a89d96]">Use at least 8 characters.</p>}
        {authMode === "login" && <button type="button" onClick={() => setAuthView("recovery")} className="mt-4 text-left text-xs font-bold text-[#ffb09a] underline decoration-[#ff5a1f]/70 underline-offset-4 hover:text-[#fff7f2]">Forgot your password?</button>}
        <button type="submit" disabled={pending} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#000] disabled:opacity-60"><LogIn size={17} /> {pending ? "Working…" : authMode === "register" ? "Create account" : "Sign in"}</button>
        <p className="mt-5 text-xs text-[#a89d96]">{staffEntry ? <Link href="/profile" className="font-bold text-[#ffb09a] underline decoration-[#ff5a1f]/70 underline-offset-4">Customer sign-in</Link> : <Link href="/staff" className="font-bold text-[#ffb09a] underline decoration-[#ff5a1f]/70 underline-offset-4">Restaurant staff sign-in</Link>}</p>
      </>}
    </form>
  </div></div>;
}

function OrderCard({ order, retryPaystackPayment, retryingPayment }: { order: any; retryPaystackPayment: () => void; retryingPayment: boolean }) {
  const isDelivery = order.orderType === "delivery";
  const steps = timeline.filter(step => isDelivery || !["out_for_delivery", "delivered"].includes(step));
  const reached = new Set(order.history?.map((event: any) => event.nextStatus) ?? [order.status]);
  const currentIndex = steps.indexOf(order.status);

  return (
    <article className="rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-display text-lg font-black">{order.orderNumber}</p><p className="mt-1 text-xs text-[#bdb2b2]">{new Date(order.createdAt).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff5a1f]">{labelize(order.status)}</p><p className="mt-1 font-display font-black">{formatGhsPesewas(order.totalPesewas)}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.1em]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#191817] px-2.5 py-1.5 text-[#ded3cc]">{isDelivery ? <Bike size={12} /> : <PackageCheck size={12} />}{order.orderType}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#191817] px-2.5 py-1.5 text-[#ded3cc]"><CreditCard size={12} />{labelize(order.paymentMethod)} · {order.paymentStatus}</span>
      </div>
      {order.paymentStatus === "pending" && (order.paymentMethod === "card" || order.paymentMethod === "mobile_money") && <button type="button" disabled={retryingPayment} onClick={retryPaystackPayment} className="mt-4 inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#ff5a1f]/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#ffb09a] hover:bg-[#ff5a1f]/10 disabled:opacity-60"><CreditCard size={14} /> {retryingPayment ? "Opening checkout…" : "Complete Paystack test payment"}</button>}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const active = reached.has(step) || index <= currentIndex;
          return <div key={step} className={`rounded-[8px] px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.08em] ${active ? "bg-[#ff5a1f]/15 text-[#ffb09a]" : "bg-[#191817] text-[#706660]"}`}>{active && <CheckCircle2 className="mx-auto mb-1" size={12} />}{labelize(step)}</div>;
        })}
      </div>
      <div className="mt-4 border-t border-[#433b37] pt-4 text-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#a89d96]">Items</p>
        <ul className="mt-2 space-y-1.5 text-[#e9ded8]">{order.items.map((item: any) => <li key={`${order.id}-${item.productName}`} className="flex justify-between"><span>{item.productName} ×{item.quantity}</span><span>{formatGhsPesewas(item.lineTotalPesewas)}</span></li>)}</ul>
        {isDelivery && <p className="mt-3 rounded-[8px] bg-[#191817] px-3 py-2 text-xs leading-5 text-[#d8cbc4]"><MapPin className="mr-1 inline text-[#ff5a1f]" size={13} />{order.deliveryAddress}</p>}
      </div>
    </article>
  );
}

function Label({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.13em] text-[#bdb2ac]">
      {label}
      <span className="mt-2 block [&_input]:h-11 [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#4a403c] [&_input]:bg-[#171717] [&_input]:px-3 [&_input]:text-base sm:[&_input]:text-sm [&_input]:font-normal [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-[#fff7f2] [&_textarea]:w-full [&_textarea]:rounded-[9px] [&_textarea]:border [&_textarea]:border-[#4a403c] [&_textarea]:bg-[#171717] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-base sm:[&_textarea]:text-sm [&_textarea]:font-normal [&_textarea]:normal-case [&_textarea]:tracking-normal [&_textarea]:text-[#fff7f2]">
        {children}
      </span>
    </label>
  );
}
