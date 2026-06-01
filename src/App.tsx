import {
  ArrowUpRight,
  BarChart3,
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Download,
  Gift,
  Home,
  Mail,
  MapPin,
  MapPinned,
  Menu,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type View = "site" | "ops";
type SitePage = "home" | "estimate" | "spin" | "contact";
type CleanType = "standard" | "deep" | "move" | "vacation" | "commercial";
type Frequency = "one-time" | "weekly" | "biweekly" | "monthly";
type EstimateStatus = "New" | "Draft" | "Sent" | "Booked" | "Lost";
type FlyerStatus = "Flyer left" | "Knocked" | "Interested" | "Callback" | "Booked" | "Skip";
type ClientType = "Residential" | "Commercial" | "Vacation rental";

type EstimateInput = {
  customerName: string;
  service: CleanType;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  frequency: Frequency;
  extras: string[];
  notes: string;
};

type QuoteContact = {
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredDate: string;
  notes: string;
};

type RequestStatus = {
  state: "idle" | "loading" | "success" | "error";
  message: string;
};

type ContactFormInput = {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};

type Estimate = EstimateInput & {
  id: string;
  total: number;
  low: number;
  high: number;
  status: EstimateStatus;
  createdAt: string;
};

type FlyerLead = {
  id: string;
  address: string;
  neighborhood: string;
  propertyType: ClientType;
  status: FlyerStatus;
  gps?: string;
  notes: string;
  visitedAt: string;
};

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: ClientType;
  frequency: Frequency;
  nextService: string;
  lifetimeValue: number;
  notes: string;
};

type AdminData = {
  clients: Client[];
  estimates: Estimate[];
  flyers: FlyerLead[];
  spinCodes?: SpinCode[];
  spinClaims?: Array<{
    code: string;
    customerName: string;
    phone: string;
    email: string;
    service: CleanType;
    estimateTotal: number;
    prize: string;
    createdAt: string;
  }>;
};

type SpinCode = {
  code: string;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
  redeemedAt: string;
  redeemedClaimId: string;
};

type SpinClaim = {
  prize: string;
  code: string;
  estimateTotal: number;
  spunAt: string;
};

const business = {
  name: "Viper Cleaning Services",
  motto: "Strike Fast. Shine Last.",
  email: "shane.vipercleaningservices@gmail.com",
  phoneDisplay: "(567) 303-7073",
  phoneHref: "tel:+15673037073",
  area: "Florida",
  serviceAreas: ["Kissimmee", "Orlando", "Winter Haven", "Celebration", "St. Cloud", "Davenport", "Clermont", "Winter Garden"],
};

const wheelPrizes = [
  { label: "10% off", wheelLabel: "10% off", color: "#8fd3ff" },
  { label: "$25 off", wheelLabel: "$25 off", color: "#155eef" },
  { label: "Free fridge clean", wheelLabel: "Fridge", color: "#111827" },
  { label: "15% off", wheelLabel: "15% off", color: "#5aa9ff" },
  { label: "Free oven clean", wheelLabel: "Oven", color: "#05070d" },
  { label: "50% off an add-on", wheelLabel: "50% add-on", color: "#2684ff" },
  { label: "Free standard clean", wheelLabel: "Free clean", color: "#1f2937" },
  { label: "Free patio sweep", wheelLabel: "Patio", color: "#9cc8ff" },
];

const whyChooseItems = [
  {
    title: "Detailed room-by-room cleaning",
    icon: CheckCircle2,
    text: "Kitchens, bathrooms, bedrooms, living areas, floors, dusting, and finishing touches are handled with a clear checklist.",
  },
  {
    title: "Fast communication",
    icon: Phone,
    text: "Quote requests, scheduling, and follow-ups stay simple so homeowners, rental hosts, and business owners are not left waiting.",
  },
  {
    title: "Built for Florida properties",
    icon: ShieldCheck,
    text: "Residential homes, vacation rentals, move-ready spaces, and small commercial accounts get cleaning that fits the property.",
  },
];

const serviceLabels: Record<CleanType, string> = {
  standard: "Whole House Cleaning",
  deep: "Deep Cleaning",
  move: "Move-In / Move-Out",
  vacation: "Vacation Rental Turnover",
  commercial: "Commercial Cleaning",
};

const frequencyLabels: Record<Frequency, string> = {
  "one-time": "One-time",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

const extraLabels: Record<string, string> = {
  fridge: "Inside fridge",
  oven: "Inside oven",
  windows: "Interior windows",
  laundry: "Laundry reset",
  pets: "Pet hair detail",
  patio: "Patio sweep",
};

const serviceCards = [
  {
    title: "Residential Cleaning",
    icon: Home,
    text: "Kitchen, bathrooms, bedrooms, dusting, mopping, vacuuming, trash reset, and tidy finishing touches.",
  },
  {
    title: "Deep Cleaning",
    icon: Sparkles,
    text: "Baseboards, detail dusting, buildup removal, cabinet fronts, appliance exteriors, fixtures, and high-touch areas.",
  },
  {
    title: "Vacation Turnovers",
    icon: CalendarCheck,
    text: "Fast rental resets with linen flow, kitchen and bath polish, restock checks, floor care, and photo-ready presentation.",
  },
  {
    title: "Move-In / Move-Out",
    icon: MapPinned,
    text: "Empty-home cleaning for sellers, landlords, renters, and buyers who need the place ready for the next chapter.",
  },
  {
    title: "Commercial Cleaning",
    icon: Building2,
    text: "Office, lobby, restroom, breakroom, flooring, dusting, and recurring janitorial-style service for small businesses.",
  },
  {
    title: "Add-On Details",
    icon: ClipboardList,
    text: "Inside fridge, inside oven, interior windows, pet hair detail, laundry reset, patio sweep, and custom punch lists.",
  },
];

const starterEstimates: Estimate[] = [
  {
    id: "estimate-demo-vacation",
    customerName: "Demo Vacation Turnover",
    service: "vacation",
    sqft: 1650,
    bedrooms: 3,
    bathrooms: 2,
    frequency: "weekly",
    extras: ["laundry", "patio"],
    notes: "Sample quote for a rental reset.",
    total: 245,
    low: 210,
    high: 280,
    status: "Sent",
    createdAt: "2026-05-31",
  },
  {
    id: "estimate-demo-deep",
    customerName: "Demo Residential Deep Clean",
    service: "deep",
    sqft: 2200,
    bedrooms: 4,
    bathrooms: 3,
    frequency: "one-time",
    extras: ["fridge", "oven", "pets"],
    notes: "Sample quote for launch testing.",
    total: 455,
    low: 385,
    high: 525,
    status: "Booked",
    createdAt: "2026-05-30",
  },
];

const starterClients: Client[] = [
  {
    id: "client-demo-1",
    name: "Demo Weekly Client",
    phone: "",
    email: "",
    address: "Sample Florida neighborhood",
    type: "Residential",
    frequency: "weekly",
    nextService: "2026-06-05",
    lifetimeValue: 360,
    notes: "Replace demo clients with real customers as you book jobs.",
  },
  {
    id: "client-demo-2",
    name: "Demo Office Client",
    phone: "",
    email: "",
    address: "Sample small business",
    type: "Commercial",
    frequency: "biweekly",
    nextService: "2026-06-08",
    lifetimeValue: 540,
    notes: "Commercial recurring client example.",
  },
];

const starterFlyers: FlyerLead[] = [
  {
    id: "flyer-demo-1",
    address: "Sample cul-de-sac route",
    neighborhood: "Launch Route A",
    propertyType: "Residential",
    status: "Flyer left",
    notes: "Demo stop. Add real addresses while hanging flyers.",
    visitedAt: "2026-05-31",
  },
  {
    id: "flyer-demo-2",
    address: "Sample vacation rental block",
    neighborhood: "Beach Rental Route",
    propertyType: "Vacation rental",
    status: "Interested",
    notes: "Owner asked for turnover pricing.",
    visitedAt: "2026-05-31",
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

function makeId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomId}`;
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return initialValue;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function calculateEstimate(input: EstimateInput) {
  const sqftRate: Record<CleanType, number> = {
    standard: 0.1,
    deep: 0.14,
    move: 0.16,
    vacation: 0.12,
    commercial: 0.25,
  };

  const frequencyDiscount: Record<Frequency, number> = {
    "one-time": 1,
    weekly: 0.86,
    biweekly: 0.9,
    monthly: 0.95,
  };

  const extraRate: Record<string, number> = {
    fridge: 25,
    oven: 35,
    windows: 45,
    laundry: 25,
    pets: 20,
    patio: 20,
  };

  const roomCost = (input.bedrooms + input.bathrooms) * 10;
  const extrasCost = input.extras.reduce((sum, extra) => sum + (extraRate[extra] ?? 0), 0);
  const raw = (input.sqft * sqftRate[input.service] + roomCost + extrasCost) * frequencyDiscount[input.frequency];
  const total = Math.max(95, Math.round(raw / 5) * 5);
  const low =
    input.service === "commercial"
      ? Math.max(95, Math.round(((input.sqft * 0.2 + roomCost + extrasCost) * frequencyDiscount[input.frequency]) / 5) * 5)
      : Math.round((total * 0.85) / 5) * 5;
  const high =
    input.service === "commercial"
      ? Math.max(95, Math.round(((input.sqft * 0.3 + roomCost + extrasCost) * frequencyDiscount[input.frequency]) / 5) * 5)
      : Math.round((total * 1.15) / 5) * 5;

  return {
    total,
    low,
    high,
  };
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand compact" : "brand"} aria-label={business.name}>
      <svg className="logo-mark" viewBox="0 0 64 64" role="img" aria-label="Viper Cleaning Services logo">
        <path d="M9 9h12l11 34L43 9h12L37 55H27L9 9Z" />
        <path d="M20 9c10 13 17 25 21 37" />
        <circle cx="46" cy="18" r="3" />
        <path d="M44 28h11" />
      </svg>
      {!compact && (
        <span>
          <strong>Viper</strong>
          <small>Cleaning Services</small>
        </span>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "ghost",
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "danger";
}) {
  return (
    <button className={`icon-button ${variant}`} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function getViewFromLocation() {
  const { pathname, hash } = window.location;
  if (pathname === "/owner" || hash === "#/ops") {
    return "ops" as const;
  }
  return "site" as const;
}

function getSitePageFromLocation() {
  const path = window.location.pathname.toLowerCase();
  if (path === "/estimate") return "estimate" as const;
  if (path === "/spin") return "spin" as const;
  if (path === "/contact") return "contact" as const;
  return "home" as const;
}

function App() {
  const [view, setView] = useState<View>(() => getViewFromLocation());
  const [sitePage, setSitePage] = useState<SitePage>(() => getSitePageFromLocation());

  useEffect(() => {
    const syncView = () => {
      const nextView = getViewFromLocation();
      if (window.location.hash === "#/ops") {
        window.history.replaceState({}, "", "/owner");
      }
      setView(nextView);
      setSitePage(getSitePageFromLocation());
    };

    syncView();
    window.addEventListener("popstate", syncView);
    window.addEventListener("hashchange", syncView);
    return () => {
      window.removeEventListener("popstate", syncView);
      window.removeEventListener("hashchange", syncView);
    };
  }, []);

  const goTo = (nextView: View) => {
    window.history.pushState({}, "", nextView === "ops" ? "/owner" : "/");
    setView(nextView);
    setSitePage(nextView === "ops" ? "home" : getSitePageFromLocation());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return view === "ops" ? <OperationsApp onPublicSite={() => goTo("site")} /> : <MarketingSite sitePage={sitePage} onNavigate={setSitePage} />;
}

function MarketingSite({ sitePage, onNavigate }: { sitePage: SitePage; onNavigate: (page: SitePage) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinClaim, setSpinClaim] = useLocalStorage<SpinClaim | null>("viper-public-spin-claim", null);
  const [spinCodeInput, setSpinCodeInput] = useLocalStorage("viper-public-spin-code", "");
  const [quoteStatus, setQuoteStatus] = useState<RequestStatus>({ state: "idle", message: "" });
  const [spinStatus, setSpinStatus] = useState<RequestStatus>({ state: "idle", message: "" });
  const [contactFormStatus, setContactFormStatus] = useState<RequestStatus>({ state: "idle", message: "" });
  const [contactForm, setContactForm] = useState<ContactFormInput>({
    name: "",
    phone: "",
    email: "",
    service: "Whole House Cleaning",
    message: "",
  });
  const [contact, setContact] = useState<QuoteContact>({
    name: "",
    phone: "",
    email: "",
    address: "",
    preferredDate: "",
    notes: "",
  });
  const [quoteInput, setQuoteInput] = useState<EstimateInput>({
    customerName: "",
    service: "standard",
    sqft: 1500,
    bedrooms: 3,
    bathrooms: 2,
    frequency: "one-time",
    extras: [],
    notes: "",
  });
  const estimate = calculateEstimate(quoteInput);
  const hasSpinCode = Boolean(spinCodeInput.trim());
  const canSpin = hasSpinCode && !isSpinning && !spinClaim;
  const spinPrizeText = spinClaim ? `${spinClaim.prize} (${spinClaim.code})` : "Not spun yet";
  const wheelGradient = `conic-gradient(${wheelPrizes
    .map((prize, index) => {
      const start = (index / wheelPrizes.length) * 100;
      const end = ((index + 1) / wheelPrizes.length) * 100;
      return `${prize.color} ${start}% ${end}%`;
    })
    .join(", ")})`;

  useEffect(() => {
    if (isSpinning) {
      return;
    }

    const timer = window.setInterval(() => {
      setWheelRotation((current) => current + 0.45);
    }, 80);

    return () => window.clearInterval(timer);
  }, [isSpinning]);
  const mailBody = encodeURIComponent(
    `Hi Viper Cleaning Services,\n\nI would like a cleaning quote.\n\nService: ${serviceLabels[quoteInput.service]}\nSquare feet: ${quoteInput.sqft}\nBedrooms: ${quoteInput.bedrooms}\nBathrooms: ${quoteInput.bathrooms}\nFrequency: ${frequencyLabels[quoteInput.frequency]}\nAdd-ons: ${
      quoteInput.extras.map((extra) => extraLabels[extra]).join(", ") || "None"
    }\nEstimated range shown: ${currency.format(estimate.low)} - ${currency.format(estimate.high)}\nSpin prize: ${spinPrizeText}\n\nMy name:\nMy phone:\nMy address:\nPreferred date:\n`,
  );

  const submitQuoteRequest = async (event: FormEvent) => {
    event.preventDefault();
    setQuoteStatus({ state: "loading", message: "Saving your quote request..." });

    try {
      const response = await apiJson<{
        ok: boolean;
        quoteId: string;
        emailStatus?: { ownerSent: boolean; customerSent: boolean; skipped?: boolean; error?: string };
      }>("/api/public/quote", {
        method: "POST",
        body: JSON.stringify({
          contact,
          estimateInput: quoteInput,
          notes: contact.notes,
          spinCode: spinClaim?.code || "",
        }),
      });
      const emailCopy =
        response.emailStatus?.ownerSent || response.emailStatus?.customerSent
          ? " Email copies were sent."
          : response.emailStatus?.skipped
            ? " Email sending is ready once SMTP is configured on the server."
            : " The request is saved even though email delivery needs attention.";
      setQuoteStatus({
        state: "success",
        message: `Your quote request was saved. Viper Cleaning Services will follow up using your contact info.${emailCopy}`,
      });
    } catch (error) {
      setQuoteStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to save quote request." });
    }
  };

  const spinWheel = async () => {
    if (!spinCodeInput.trim() || isSpinning || spinClaim) {
      return;
    }

    setIsSpinning(true);
    setSpinStatus({ state: "loading", message: "Checking your code..." });

    let claim: SpinClaim;

    try {
      const response = await apiJson<{ alreadyClaimed: boolean; claim: SpinClaim }>("/api/public/spin", {
        method: "POST",
        body: JSON.stringify({
          code: spinCodeInput.trim(),
          contact,
          estimateInput: quoteInput,
        }),
      });
      claim = response.claim;
      if (response.alreadyClaimed) {
        setSpinClaim(claim);
        setSpinStatus({ state: "success", message: `This code already has a saved prize: ${claim.code}.` });
        setIsSpinning(false);
        return;
      }
    } catch (error) {
      setSpinStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to redeem that spin code." });
      setIsSpinning(false);
      return;
    }

    const prizeIndex = Math.max(
      0,
      wheelPrizes.findIndex((prize) => prize.label === claim.prize),
    );
    const segment = 360 / wheelPrizes.length;
    const targetAngle = 360 - (prizeIndex * segment + segment / 2);

    setWheelRotation((current) => current + 1440 + targetAngle);

    window.setTimeout(() => {
      setSpinClaim(claim);
      setSpinStatus({ state: "success", message: `Prize saved with code ${claim.code}.` });
      setIsSpinning(false);
    }, 1900);
  };

  const submitContactForm = async (event: FormEvent) => {
    event.preventDefault();
    setContactFormStatus({ state: "loading", message: "Sending your message..." });

    try {
      const response = await apiJson<{
        ok: boolean;
        emailStatus?: { ownerSent: boolean; customerSent: boolean; skipped?: boolean };
      }>("/api/public/contact", {
        method: "POST",
        body: JSON.stringify(contactForm),
      });

      const emailCopy =
        response.emailStatus?.ownerSent || response.emailStatus?.customerSent
          ? " Viper Cleaning Services received it and a copy can go to your email."
          : response.emailStatus?.skipped
            ? " Email delivery will work once SMTP is configured on the server."
            : "";

      setContactFormStatus({
        state: "success",
        message: `Your message was sent.${emailCopy}`,
      });
      setContactForm({
        name: "",
        phone: "",
        email: "",
        service: "Whole House Cleaning",
        message: "",
      });
    } catch (error) {
      setContactFormStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to send your message." });
    }
  };

  const navigateToSitePage = (nextPage: SitePage) => {
    const nextPath =
      nextPage === "home" ? "/" : nextPage === "estimate" ? "/estimate" : nextPage === "spin" ? "/spin" : "/contact";
    window.history.pushState({}, "", nextPath);
    onNavigate(nextPage);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageIntro =
    sitePage === "home"
      ? {
          eyebrow: "Residential | Commercial | Vacation Homes",
          title: "Viper Cleaning Services",
          copy:
            "Professional cleaning for Florida homes, offices, rentals, and move-ready properties, built around fast response, sharp details, and rooms that feel finished.",
        }
      : sitePage === "estimate"
        ? {
            eyebrow: "Get estimate",
            title: "Clear pricing before we ever show up.",
            copy:
              "Send the details, review a starting range, and let Viper Cleaning Services follow up with the final plan for your property.",
          }
        : sitePage === "spin"
          ? {
              eyebrow: "Booking bonus",
              title: "Redeem your Viper spin code.",
              copy:
                "Booked customers can use a one-time code here for a prize tied to their cleaning. Simple, fast, and tracked on our side.",
            }
          : {
              eyebrow: "Contact us",
              title: "Tell us what you need cleaned.",
              copy:
                "Reach out for residential, commercial, deep cleaning, move-out, or vacation rental service across Central Florida.",
            };

  return (
    <div className="site-shell">
      <header className="site-nav">
        <button className="brand-link brand-button" type="button" aria-label="Viper Cleaning Services home" onClick={() => navigateToSitePage("home")}>
          <LogoMark />
        </button>
        <button className="menu-button" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
          {[
            { id: "home", label: "Home" },
            { id: "estimate", label: "Estimate" },
            { id: "spin", label: "Spin" },
            { id: "contact", label: "Contact" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={sitePage === item.id ? "active" : ""}
              onClick={() => navigateToSitePage(item.id as SitePage)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main id="top" className="site-main">
        <section className={`hero-section ${sitePage !== "home" ? "inner-hero" : ""}`}>
          <img className="hero-image" src="/images/viper-cleaning-hero.png" alt="Freshly cleaned Florida vacation home interior" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">{pageIntro.eyebrow}</p>
            <h1>{pageIntro.title}</h1>
            <p className="motto">{business.motto}</p>
            <p className="hero-copy">{pageIntro.copy}</p>
            <div className="hero-actions">
              <button className="btn primary" type="button" onClick={() => navigateToSitePage(sitePage === "home" ? "estimate" : "contact")}>
                <Calculator size={18} />
                {sitePage === "home" ? "Get an estimate" : "Request service"}
              </button>
              <button className="btn secondary" type="button" onClick={() => navigateToSitePage("contact")}>
                <Mail size={18} />
                Contact us
              </button>
              <a className="btn secondary" href={business.phoneHref}>
                <Phone size={18} />
                Call now
              </a>
            </div>
            {sitePage === "home" && (
              <div className="trust-row" aria-label="Service highlights">
                <span>
                  <ShieldCheck size={16} />
                  Detail checklist
                </span>
                <span>
                  <Sparkles size={16} />
                  Fresh finish
                </span>
                <span>
                  <CalendarCheck size={16} />
                  Recurring plans
                </span>
              </div>
            )}
          </div>
        </section>
        {sitePage === "home" && (
          <>
            <HomeOverview onEstimate={() => navigateToSitePage("estimate")} onSpin={() => navigateToSitePage("spin")} onContact={() => navigateToSitePage("contact")} />
            <FaqSection />
          </>
        )}

        {sitePage === "estimate" && (
          <EstimatePage
            quoteInput={quoteInput}
            setQuoteInput={setQuoteInput}
            contact={contact}
            setContact={setContact}
            estimate={estimate}
            quoteStatus={quoteStatus}
            submitQuoteRequest={submitQuoteRequest}
            onContact={() => navigateToSitePage("contact")}
          />
        )}

        {sitePage === "spin" && (
          <SpinPage
            estimate={estimate}
            hasSpinCode={hasSpinCode}
            spinCodeInput={spinCodeInput}
            setSpinCodeInput={setSpinCodeInput}
            spinClaim={spinClaim}
            isSpinning={isSpinning}
            wheelGradient={wheelGradient}
            wheelRotation={wheelRotation}
            spinStatus={spinStatus}
            canSpin={canSpin}
            spinWheel={spinWheel}
            onEstimate={() => navigateToSitePage("estimate")}
          />
        )}

        {sitePage === "contact" && (
          <ContactPage
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactFormStatus={contactFormStatus}
            submitContactForm={submitContactForm}
            onEstimate={() => navigateToSitePage("estimate")}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="section-inner footer-layout">
          <div>
            <LogoMark />
            <p>
              Residential, commercial, move-out, deep cleaning, and vacation rental turnover service across Central Florida.
            </p>
            <div className="service-area-footer" aria-label="Viper Cleaning Services service areas">
              <strong>Service areas</strong>
              <div>
                {business.serviceAreas.map((area) => (
                  <span key={area}>{area}, FL</span>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-contact-wrap">
            <div className="footer-actions">
              <a className="btn footer-btn" href={`mailto:${business.email}`}>
                <Mail size={18} />
                {business.email}
              </a>
              <a className="btn footer-btn" href={business.phoneHref}>
                <Phone size={18} />
                {business.phoneDisplay}
              </a>
              <button className="btn footer-btn" type="button" onClick={() => navigateToSitePage("estimate")}>
                <Calculator size={18} />
                Estimate a cleaning
              </button>
              <button className="btn footer-btn" type="button" onClick={() => navigateToSitePage("contact")}>
                <Mail size={18} />
                Contact form
              </button>
            </div>
            <div className="footer-note-card">
              <h3>Need a fast answer?</h3>
              <p>Call, text, or use the contact page to tell us what kind of cleaning you need and where the property is located.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeOverview({
  onEstimate,
  onSpin,
  onContact,
}: {
  onEstimate: () => void;
  onSpin: () => void;
  onContact: () => void;
}) {
  return (
    <>
      <section className="section clean-section">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow dark">Cleaning services</p>
            <h2>Professional cleaning for homes, rentals, and businesses</h2>
            <p>
              From weekly home cleaning to vacation rental turnovers, Viper Cleaning Services delivers reliable, detailed work
              with rooms reset, surfaces polished, and floors finished clean.
            </p>
          </div>

          <div className="service-grid">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <article className="service-card" key={service.title}>
                  <Icon size={28} />
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section why-section">
        <div className="section-inner why-layout">
          <div>
            <p className="eyebrow dark">Why choose us</p>
            <h2>Reliable cleaning with sharp details and a cleaner finish.</h2>
            <p>
              Viper Cleaning Services helps Central Florida homeowners, rental hosts, and local businesses keep their spaces
              fresh, guest-ready, and easier to manage. Every job is built around clear communication, practical scheduling,
              and cleaning details that make the whole property feel reset.
            </p>
          </div>
          <div className="why-grid">
            {whyChooseItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title}>
                  <Icon size={24} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="section-inner split-layout">
          <div>
            <p className="eyebrow dark">How it works</p>
            <h2>A sharp process from the first quote to the final walkthrough.</h2>
            <p>
              Tell us what needs cleaning, choose the service level that fits the property, and get a clear estimate before the
              job is scheduled.
            </p>
          </div>
          <div className="process-list">
            <div>
              <span>01</span>
              <strong>Walkthrough or quick quote</strong>
              <p>Collect home size, rooms, clean type, add-ons, and frequency.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Checklist-based clean</strong>
              <p>Kitchen, bathrooms, bedrooms, dusting, floors, details, and final reset.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Follow-up for repeat work</strong>
              <p>Convert one-time jobs into weekly, biweekly, monthly, or turnover service.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section page-cta-band">
        <div className="section-inner page-cta-grid">
          <article className="page-cta-card">
            <Calculator size={22} />
            <h3>Need pricing first?</h3>
            <p>Use the estimate page for a fast starting range and send your property details in one step.</p>
            <button className="btn primary" type="button" onClick={onEstimate}>
              Get estimate
            </button>
          </article>
          <article className="page-cta-card">
            <Gift size={22} />
            <h3>Already booked?</h3>
            <p>Redeem your one-time spin code on the dedicated spin page and keep your prize attached to the booking.</p>
            <button className="btn secondary dark-btn" type="button" onClick={onSpin}>
              Open spin page
            </button>
          </article>
          <article className="page-cta-card">
            <Mail size={22} />
            <h3>Want to talk first?</h3>
            <p>Use the contact page for a quick message if you want help before filling out the estimate form.</p>
            <button className="btn secondary dark-btn" type="button" onClick={onContact}>
              Contact us
            </button>
          </article>
        </div>
      </section>
    </>
  );
}

function EstimatePage({
  quoteInput,
  setQuoteInput,
  contact,
  setContact,
  estimate,
  quoteStatus,
  submitQuoteRequest,
  onContact,
}: {
  quoteInput: EstimateInput;
  setQuoteInput: (input: EstimateInput) => void;
  contact: QuoteContact;
  setContact: (contact: QuoteContact) => void;
  estimate: ReturnType<typeof calculateEstimate>;
  quoteStatus: RequestStatus;
  submitQuoteRequest: (event: FormEvent) => void;
  onContact: () => void;
}) {
  return (
    <>
      <section className="section estimate-section">
        <div className="section-inner estimator-layout">
          <div className="estimator-copy">
            <p className="eyebrow dark">Get estimate</p>
            <h2>Fill out the cleaning form and get a starting price.</h2>
            <p>
              Check the service items, add your contact details, and the request saves to the Viper dashboard. Email copies can
              go to you and to Viper Cleaning Services once email is configured on the server.
            </p>
          </div>

          <form className="quote-tool" onSubmit={submitQuoteRequest}>
            <EstimatorFields input={quoteInput} onChange={setQuoteInput} />
            <ContactFields contact={contact} onChange={setContact} />
            <EstimateResult estimate={estimate} service={quoteInput.service} />
            <button className="btn primary full" type="submit" disabled={quoteStatus.state === "loading"}>
              <Mail size={18} />
              {quoteStatus.state === "loading" ? "Saving request..." : "Submit quote request"}
            </button>
            {quoteStatus.message && <p className={`status-message ${quoteStatus.state}`}>{quoteStatus.message}</p>}
          </form>
        </div>
      </section>

      <section className="section clean-section">
        <div className="section-inner slim-support-grid">
          <article className="support-card">
            <ShieldCheck size={22} />
            <h3>Clear starting range</h3>
            <p>Use the form for ballpark pricing before final condition, access, and scheduling details are confirmed.</p>
          </article>
          <article className="support-card">
            <Phone size={22} />
            <h3>Need help first?</h3>
            <p>Some properties are easier to discuss first. Reach out directly and we can point you to the right service plan.</p>
            <button className="btn neutral" type="button" onClick={onContact}>
              Contact page
            </button>
          </article>
        </div>
      </section>
    </>
  );
}

function SpinPage({
  estimate,
  hasSpinCode,
  spinCodeInput,
  setSpinCodeInput,
  spinClaim,
  isSpinning,
  wheelGradient,
  wheelRotation,
  spinStatus,
  canSpin,
  spinWheel,
  onEstimate,
}: {
  estimate: ReturnType<typeof calculateEstimate>;
  hasSpinCode: boolean;
  spinCodeInput: string;
  setSpinCodeInput: (code: string) => void;
  spinClaim: SpinClaim | null;
  isSpinning: boolean;
  wheelGradient: string;
  wheelRotation: number;
  spinStatus: RequestStatus;
  canSpin: boolean;
  spinWheel: () => void;
  onEstimate: () => void;
}) {
  return (
    <>
      <section className="section spin-section">
        <div className="section-inner spin-layout">
          <div className="spin-copy">
            <p className="eyebrow dark">Booking bonus</p>
            <h2>Got a Viper spin code? Use it here for one prize spin.</h2>
            <p>
              After a cleaning is booked, Viper Cleaning Services can issue a one-time code. Enter the code here and spin once
              for your cleaning prize.
            </p>
            <div className="promo-terms">
              <CheckCircle2 size={18} />
              <span>Each code works one time and keeps the prize attached to that booking.</span>
            </div>
            <div className="spin-page-note">
              <strong>Need to book first?</strong>
              <p>Use the estimate page if you still need pricing or want to send your service details before booking.</p>
              <button className="btn neutral" type="button" onClick={onEstimate}>
                Go to estimate
              </button>
            </div>
          </div>

          <div className="wheel-panel">
            <div className="wheel-status">
              <span>Spin code status</span>
              <strong>{spinClaim ? spinClaim.code : hasSpinCode ? spinCodeInput.trim().toUpperCase() : "Enter code"}</strong>
              <small>
                {spinClaim ? `Prize saved: ${spinClaim.code}` : hasSpinCode ? "Ready to redeem" : "Enter the one-time code Viper gave you"}
              </small>
            </div>
            <label className="spin-code-field">
              Spin code
              <input value={spinCodeInput} onChange={(event) => setSpinCodeInput(event.target.value.toUpperCase())} placeholder="VIPER-ABC123" autoCapitalize="characters" />
            </label>
            <div className={["wheel-wrap", isSpinning ? "spinning" : "idle", spinClaim ? "claimed" : ""].filter(Boolean).join(" ")}>
              <div className="wheel-pointer" aria-hidden="true" />
              <div
                className="spin-wheel"
                style={{
                  background: wheelGradient,
                  transform: `rotate(${wheelRotation}deg)`,
                }}
                aria-label="Prize wheel"
              >
                {wheelPrizes.map((prize, index) => {
                  const segment = 360 / wheelPrizes.length;
                  const angle = index * segment + segment / 2;
                  return (
                    <span className="wheel-label" style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-104px)` }} key={prize.label}>
                      <span style={{ transform: `rotate(${-angle}deg)` }}>{prize.wheelLabel}</span>
                    </span>
                  );
                })}
                <div className="wheel-center">
                  <Gift size={26} />
                  <span>Spin</span>
                </div>
              </div>
            </div>
            <button className="btn primary full" type="button" disabled={!canSpin} onClick={spinWheel}>
              <Gift size={18} />
              {spinClaim ? "Prize saved" : isSpinning ? "Spinning..." : !hasSpinCode ? "Enter your code" : "Spin the wheel"}
            </button>
            {spinStatus.message && <p className={`status-message dark ${spinStatus.state}`}>{spinStatus.message}</p>}
            {spinClaim && (
              <div className="prize-result" role="status">
                <strong>You landed on: {spinClaim.prize}</strong>
                <span>Prize code: {spinClaim.code}. Viper will have this prize saved on the booking.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section clean-section">
        <div className="section-inner slim-support-grid">
          <article className="support-card">
            <Gift size={22} />
            <h3>One code, one spin</h3>
            <p>Every code is tracked so the prize stays tied to the correct booking and cannot be redeemed again later.</p>
          </article>
          <article className="support-card">
            <Sparkles size={22} />
            <h3>Prize attached to service</h3>
            <p>Your result stays saved on the Viper side, so it can be applied correctly when the cleaning is finalized.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function ContactPage({
  contactForm,
  setContactForm,
  contactFormStatus,
  submitContactForm,
  onEstimate,
}: {
  contactForm: ContactFormInput;
  setContactForm: (input: ContactFormInput) => void;
  contactFormStatus: RequestStatus;
  submitContactForm: (event: FormEvent) => void;
  onEstimate: () => void;
}) {
  return (
    <>
      <section className="section contact-page-section">
        <div className="section-inner contact-page-grid">
          <div className="contact-page-copy">
            <p className="eyebrow dark">Contact us</p>
            <h2>Send a message and we will follow up.</h2>
            <p>
              Tell us the type of cleaning you need, where the property is located, and the best way to reach you. For faster
              pricing, you can still use the estimate page.
            </p>
            <div className="contact-info-list">
              <a href={business.phoneHref}>
                <Phone size={18} />
                <span>{business.phoneDisplay}</span>
              </a>
              <a href={`mailto:${business.email}`}>
                <Mail size={18} />
                <span>{business.email}</span>
              </a>
              <div>
                <MapPin size={18} />
                <span>{business.serviceAreas.join(", ")}, FL</span>
              </div>
            </div>
            <button className="btn neutral" type="button" onClick={onEstimate}>
              <Calculator size={18} />
              Prefer the estimate form?
            </button>
          </div>

          <form className="quote-tool contact-page-form" onSubmit={submitContactForm}>
            <div className="panel-heading compact-panel-heading">
              <h3>Contact form</h3>
              <span>Fast message straight to Viper Cleaning Services</span>
            </div>
            <div className="form-grid compact">
              <label>
                Name
                <input value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} placeholder="Your name" required />
              </label>
              <label>
                Phone
                <input value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} placeholder="Best phone number" />
              </label>
              <label>
                Email
                <input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} placeholder="Email address" />
              </label>
              <label>
                Service
                <select value={contactForm.service} onChange={(event) => setContactForm({ ...contactForm, service: event.target.value })}>
                  {Object.values(serviceLabels).map((label) => (
                    <option value={label} key={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Message
              <textarea
                value={contactForm.message}
                onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                placeholder="Tell us what you need cleaned, where the property is, and the best way to reach you."
                required
              />
            </label>
            <button className="btn primary full" type="submit" disabled={contactFormStatus.state === "loading"}>
              <Mail size={18} />
              {contactFormStatus.state === "loading" ? "Sending..." : "Send message"}
            </button>
            {contactFormStatus.message && <p className={`status-message ${contactFormStatus.state}`}>{contactFormStatus.message}</p>}
          </form>
        </div>
      </section>
    </>
  );
}

function FaqSection() {
  return (
    <section className="section faq-section">
      <div className="section-inner">
        <div className="section-heading compact-heading">
          <p className="eyebrow dark">Good questions</p>
          <h2>Helpful answers for Florida cleaning customers</h2>
        </div>
        <div className="faq-grid">
          <article>
            <h3>Do you handle vacation rentals?</h3>
            <p>Yes. Turnovers can include kitchen reset, bathroom polish, floors, linens, restock checks, and photo-ready final details.</p>
          </article>
          <article>
            <h3>What is included in a whole house cleaning?</h3>
            <p>Kitchen, bathrooms, bedrooms, living areas, dusting, mopping, vacuuming, trash reset, and surface wipe-downs.</p>
          </article>
          <article>
            <h3>Can I book recurring service?</h3>
            <p>Weekly, biweekly, monthly, commercial, and vacation turnover schedules are supported.</p>
          </article>
          <article>
            <h3>How does the spin bonus work?</h3>
            <p>After booking, Viper can give you a one-time code that redeems one wheel spin and saves the prize to your booking.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function EstimatorFields({
  input,
  onChange,
}: {
  input: EstimateInput;
  onChange: (input: EstimateInput) => void;
}) {
  const toggleExtra = (extra: string) => {
    const extras = input.extras.includes(extra) ? input.extras.filter((item) => item !== extra) : [...input.extras, extra];
    onChange({ ...input, extras });
  };

  return (
    <div className="form-grid">
      <label>
        Service
        <select value={input.service} onChange={(event) => onChange({ ...input, service: event.target.value as CleanType })}>
          {Object.entries(serviceLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Square feet
        <input
          type="number"
          min="300"
          step="50"
          value={input.sqft}
          onChange={(event) => onChange({ ...input, sqft: Number(event.target.value) })}
        />
      </label>
      <label>
        Bedrooms
        <input
          type="number"
          min="0"
          value={input.bedrooms}
          onChange={(event) => onChange({ ...input, bedrooms: Number(event.target.value) })}
        />
      </label>
      <label>
        Bathrooms
        <input
          type="number"
          min="0"
          step="0.5"
          value={input.bathrooms}
          onChange={(event) => onChange({ ...input, bathrooms: Number(event.target.value) })}
        />
      </label>
      <label>
        Frequency
        <select value={input.frequency} onChange={(event) => onChange({ ...input, frequency: event.target.value as Frequency })}>
          {Object.entries(frequencyLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="extras-field">
        <legend>Add-ons</legend>
        <div className="extras-grid">
          {Object.entries(extraLabels).map(([value, label]) => (
            <label className="check-option" key={value}>
              <input type="checkbox" checked={input.extras.includes(value)} onChange={() => toggleExtra(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function ContactFields({
  contact,
  onChange,
}: {
  contact: QuoteContact;
  onChange: (contact: QuoteContact) => void;
}) {
  return (
    <div className="contact-fields">
      <div className="panel-heading compact-panel-heading">
        <h3>Your quote details</h3>
        <span>Saved securely to the Viper database</span>
      </div>
      <div className="form-grid">
        <label>
          Name
          <input value={contact.name} onChange={(event) => onChange({ ...contact, name: event.target.value })} placeholder="Your name" required />
        </label>
        <label>
          Phone
          <input value={contact.phone} onChange={(event) => onChange({ ...contact, phone: event.target.value })} placeholder="Best phone number" />
        </label>
        <label>
          Email
          <input type="email" value={contact.email} onChange={(event) => onChange({ ...contact, email: event.target.value })} placeholder="Email address" />
        </label>
        <label>
          Preferred date
          <input type="date" value={contact.preferredDate} onChange={(event) => onChange({ ...contact, preferredDate: event.target.value })} />
        </label>
      </div>
      <label>
        Service address
        <input value={contact.address} onChange={(event) => onChange({ ...contact, address: event.target.value })} placeholder="Street, city, ZIP" />
      </label>
      <label>
        Notes
        <textarea value={contact.notes} onChange={(event) => onChange({ ...contact, notes: event.target.value })} placeholder="Pets, property condition, access notes, preferred time, or special details" />
      </label>
      <p className="form-note">Name and either phone or email are required to submit a quote or claim a spin prize.</p>
    </div>
  );
}

function EstimateResult({ estimate, service }: { estimate: ReturnType<typeof calculateEstimate>; service: CleanType }) {
  return (
    <div className="estimate-result" aria-live="polite">
      <span>{serviceLabels[service]}</span>
      <strong>{currency.format(estimate.total)}</strong>
      <p>
        Ballpark range: {currency.format(estimate.low)} - {currency.format(estimate.high)}. Final pricing should be confirmed after
        photos, walkthrough, condition, and travel time. Residential starts at $0.10 per sq ft; commercial ranges around $0.20-$0.30 per sq ft.
      </p>
    </div>
  );
}

function OperationsApp({ onPublicSite }: { onPublicSite: () => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "flyers" | "estimates" | "clients">("dashboard");
  const [adminToken, setAdminToken] = useLocalStorage("viper-admin-token", "");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState<RequestStatus>({ state: "idle", message: "" });
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [flyers, setFlyers] = useState<FlyerLead[]>([]);
  const [spinCodes, setSpinCodes] = useState<SpinCode[]>([]);
  const [spinClaims, setSpinClaims] = useState<NonNullable<AdminData["spinClaims"]>>([]);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${adminToken}` }), [adminToken]);

  const loadAdminData = async (token = adminToken, silent = false) => {
    if (!token) {
      return;
    }

    if (!silent) {
      setIsAdminLoading(true);
      setAdminStatus({ state: "loading", message: "Loading database..." });
    }

    try {
      const data = await apiJson<AdminData>("/api/admin/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(data.clients);
      setEstimates(data.estimates);
      setFlyers(data.flyers);
      setSpinCodes(data.spinCodes || []);
      setSpinClaims(data.spinClaims || []);
      if (!silent) {
        setAdminStatus({ state: "success", message: "Connected to database." });
      }
    } catch (error) {
      setAdminToken("");
      setAdminStatus({ state: "error", message: error instanceof Error ? error.message : "Owner login expired." });
    } finally {
      if (!silent) {
        setIsAdminLoading(false);
      }
    }
  };

  useEffect(() => {
    if (adminToken) {
      void loadAdminData(adminToken);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadAdminData(adminToken, true);
    }, 20000);

    return () => window.clearInterval(timer);
  }, [adminToken]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setAdminStatus({ state: "loading", message: "Checking password..." });

    try {
      const response = await apiJson<{ token: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: loginPassword }),
      });
      setAdminToken(response.token);
      setLoginPassword("");
    } catch (error) {
      setAdminStatus({ state: "error", message: error instanceof Error ? error.message : "Login failed." });
    }
  };

  const saveAdminData = async (nextData: AdminData) => {
    if (!adminToken) {
      return;
    }

    setAdminStatus({ state: "loading", message: "Saving to database..." });

    try {
      await apiJson<AdminData>("/api/admin/data", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(nextData),
      });
      setAdminStatus({ state: "success", message: "Database saved." });
    } catch (error) {
      setAdminStatus({ state: "error", message: error instanceof Error ? error.message : "Database save failed." });
    }
  };

  const updateClients = (nextClients: Client[]) => {
    setClients(nextClients);
    void saveAdminData({ clients: nextClients, estimates, flyers });
  };

  const updateEstimates = (nextEstimates: Estimate[]) => {
    setEstimates(nextEstimates);
    void saveAdminData({ clients, estimates: nextEstimates, flyers });
  };

  const updateFlyers = (nextFlyers: FlyerLead[]) => {
    setFlyers(nextFlyers);
    void saveAdminData({ clients, estimates, flyers: nextFlyers });
  };

  if (!adminToken) {
    return (
      <div className="ops-shell login-shell">
        <main className="owner-login">
          <LogoMark />
          <form className="tool-panel login-panel" onSubmit={login}>
            <div className="panel-heading">
              <h1>Owner login</h1>
              <span>Database protected</span>
            </div>
            <p className="form-note">Enter the owner password from your server environment to manage leads, estimates, clients, and flyers.</p>
            <label>
              Password
              <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Owner password" required />
            </label>
            <button className="btn primary full" type="submit" disabled={adminStatus.state === "loading"}>
              <ShieldCheck size={18} />
              {adminStatus.state === "loading" ? "Logging in..." : "Open owner app"}
            </button>
            {adminStatus.message && <p className={`status-message ${adminStatus.state}`}>{adminStatus.message}</p>}
            <button className="btn neutral full" type="button" onClick={onPublicSite}>
              <Home size={18} />
              Public site
            </button>
          </form>
        </main>
      </div>
    );
  }

  const stats = (() => {
    const bookedEstimateValue = estimates.filter((estimate) => estimate.status === "Booked").reduce((sum, estimate) => sum + estimate.total, 0);
    const clientRevenue = clients.reduce((sum, client) => sum + client.lifetimeValue, 0);
    const pipeline = estimates.filter((estimate) => estimate.status === "New" || estimate.status === "Draft" || estimate.status === "Sent").reduce((sum, estimate) => sum + estimate.total, 0);
    const flyerBooked = flyers.filter((flyer) => flyer.status === "Booked").length;
    const conversion = flyers.length ? Math.round((flyerBooked / flyers.length) * 100) : 0;

    return {
      revenue: bookedEstimateValue + clientRevenue,
      pipeline,
      clients: clients.length,
      flyers: flyers.length,
      conversion,
      avgEstimate: estimates.length ? Math.round(estimates.reduce((sum, estimate) => sum + estimate.total, 0) / estimates.length) : 0,
    };
  })();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "flyers", label: "Flyers", icon: MapPinned },
    { id: "estimates", label: "Estimates", icon: Calculator },
    { id: "clients", label: "Clients", icon: Users },
  ] as const;

  return (
    <div className="ops-shell">
      <aside className="ops-sidebar">
        <LogoMark />
        <div className="ops-tagline">
          <span>{business.motto}</span>
          <small>Owner command center</small>
        </div>
        <nav className="ops-tabs" aria-label="Owner app navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={activeTab === tab.id ? "active" : ""}
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <button className="btn light" type="button" onClick={onPublicSite}>
          <Home size={18} />
          Public site
        </button>
      </aside>

      <main className="ops-main">
        <header className="ops-header">
          <div>
            <p className="eyebrow dark">Private tools</p>
            <h1>Viper owner app</h1>
            <p>Track route work, create estimates, manage clients, and watch the company numbers from the same place.</p>
          </div>
          <div className="ops-note">
            <ShieldCheck size={18} />
            {isAdminLoading ? "Loading database..." : "Data saves to your database."}
          </div>
        </header>

        {adminStatus.message && <p className={`status-message ${adminStatus.state}`}>{adminStatus.message}</p>}

        {activeTab === "dashboard" && (
          <Dashboard
            stats={stats}
            clients={clients}
            estimates={estimates}
            flyers={flyers}
            spinCodes={spinCodes}
            spinClaims={spinClaims}
            authHeaders={authHeaders}
            onCodesRefresh={() => void loadAdminData(adminToken, true)}
          />
        )}
        {activeTab === "flyers" && <FlyerTracker flyers={flyers} setFlyers={updateFlyers} />}
        {activeTab === "estimates" && <EstimateManager estimates={estimates} setEstimates={updateEstimates} />}
        {activeTab === "clients" && <ClientManager clients={clients} setClients={updateClients} />}
      </main>
    </div>
  );
}

function Dashboard({
  stats,
  clients,
  estimates,
  flyers,
  spinCodes,
  spinClaims,
  authHeaders,
  onCodesRefresh,
}: {
  stats: {
    revenue: number;
    pipeline: number;
    clients: number;
    flyers: number;
    conversion: number;
    avgEstimate: number;
  };
  clients: Client[];
  estimates: Estimate[];
  flyers: FlyerLead[];
  spinCodes: SpinCode[];
  spinClaims: NonNullable<AdminData["spinClaims"]>;
  authHeaders: Record<string, string>;
  onCodesRefresh: () => void;
}) {
  const booked = estimates.filter((estimate) => estimate.status === "Booked").reduce((sum, estimate) => sum + estimate.total, 0);
  const recurring = clients.filter((client) => client.frequency !== "one-time").length;
  const interestedFlyers = flyers.filter((flyer) => flyer.status === "Interested" || flyer.status === "Callback").length;
  const maxBar = Math.max(stats.revenue, stats.pipeline, booked, 1);

  return (
    <section className="ops-section">
      <div className="metric-grid">
        <MetricCard icon={<DollarSign size={22} />} label="Tracked revenue" value={currency.format(stats.revenue)} helper="Client value + booked estimates" />
        <MetricCard icon={<ClipboardList size={22} />} label="Quote pipeline" value={currency.format(stats.pipeline)} helper="Draft and sent estimates" />
        <MetricCard icon={<Users size={22} />} label="Clients" value={String(stats.clients)} helper={`${recurring} recurring accounts`} />
        <MetricCard icon={<MapPinned size={22} />} label="Flyer conversion" value={`${stats.conversion}%`} helper={`${stats.flyers} flyer stops tracked`} />
      </div>

      <div className="dashboard-grid">
        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Business pulse</h2>
            <span>Live from local entries</span>
          </div>
          <div className="bar-stack">
            <BarRow label="Tracked revenue" value={stats.revenue} max={maxBar} />
            <BarRow label="Quote pipeline" value={stats.pipeline} max={maxBar} />
            <BarRow label="Booked estimates" value={booked} max={maxBar} />
          </div>
        </div>

        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Follow-up list</h2>
            <span>{interestedFlyers} route leads need attention</span>
          </div>
          <div className="activity-list">
            {flyers
              .filter((flyer) => flyer.status === "Interested" || flyer.status === "Callback")
              .slice(0, 4)
              .map((flyer) => (
                <div className="activity-row" key={flyer.id}>
                  <MapPin size={17} />
                  <div>
                    <strong>{flyer.address}</strong>
                    <span>
                      {flyer.neighborhood} • {flyer.status}
                    </span>
                  </div>
                </div>
              ))}
            {interestedFlyers === 0 && <p className="empty-copy">No hot flyer leads yet. Add route stops as you hang flyers.</p>}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <SpinCodePanel spinCodes={spinCodes} spinClaims={spinClaims} authHeaders={authHeaders} onCreated={onCodesRefresh} />

        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Recent estimates</h2>
            <span>Average {currency.format(stats.avgEstimate)}</span>
          </div>
          <div className="table-list">
            {estimates.slice(0, 5).map((estimate) => (
              <div className="table-row" key={estimate.id}>
                <div>
                  <strong>{estimate.customerName}</strong>
                  <span>{serviceLabels[estimate.service]}</span>
                </div>
                <div>
                  <strong>{currency.format(estimate.total)}</strong>
                  <span>{estimate.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Next services</h2>
            <span>Keep the calendar warm</span>
          </div>
          <div className="table-list">
            {clients.slice(0, 5).map((client) => (
              <div className="table-row" key={client.id}>
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.type}</span>
                </div>
                <div>
                  <strong>{client.nextService || "Set date"}</strong>
                  <span>{frequencyLabels[client.frequency]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpinCodePanel({
  spinCodes,
  spinClaims,
  authHeaders,
  onCreated,
}: {
  spinCodes: SpinCode[];
  spinClaims: NonNullable<AdminData["spinClaims"]>;
  authHeaders: Record<string, string>;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [status, setStatus] = useState<RequestStatus>({ state: "idle", message: "" });

  const createCode = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "Generating spin code..." });

    try {
      const created = await apiJson<{ code: string }>("/api/admin/spin-codes", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      setForm({ customerName: "", phone: "", email: "", notes: "" });
      setStatus({ state: "success", message: `Spin code ready: ${created.code}` });
      onCreated();
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to generate a spin code." });
    }
  };

  return (
    <div className="tool-panel">
      <div className="panel-heading">
        <h2>Spin codes</h2>
        <span>Issue one code after a booked cleaning</span>
      </div>
      <form className="stack-form" onSubmit={createCode}>
        <label>
          Customer name
          <input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="Customer or property" />
        </label>
        <div className="form-grid compact">
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Optional" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Optional" />
          </label>
        </div>
        <label>
          Notes
          <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Booked deep clean, June turnover, etc." />
        </label>
        <button className="btn primary full" type="submit" disabled={status.state === "loading"}>
          <Gift size={18} />
          {status.state === "loading" ? "Generating..." : "Generate spin code"}
        </button>
        {status.message && <p className={`status-message ${status.state}`}>{status.message}</p>}
      </form>

      <div className="table-list roomy">
        {spinCodes.slice(0, 6).map((spinCode) => {
          const matchingClaim = spinClaims.find((claim) => claim.code === spinCode.code);
          return (
            <div className="table-row quote-row" key={spinCode.code}>
              <div>
                <strong>{spinCode.code}</strong>
                <span>
                  {spinCode.customerName || "Customer not entered"} • {spinCode.createdAt.slice(0, 10)}
                </span>
                <p>{spinCode.notes || "Issued from the owner app."}</p>
              </div>
              <div className="row-actions stacked">
                <strong>{spinCode.redeemedAt ? "Redeemed" : "Open"}</strong>
                <span>{matchingClaim ? matchingClaim.prize : "Waiting on customer spin"}</span>
              </div>
            </div>
          );
        })}
        {spinCodes.length === 0 && <p className="empty-copy">No spin codes yet. Generate one after a booking is confirmed.</p>}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, helper }: { icon: ReactNode; label: string; value: string; helper: string }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bar-row">
      <div>
        <span>{label}</span>
        <strong>{currency.format(value)}</strong>
      </div>
      <div className="bar-track" aria-hidden="true">
        <span style={{ width: `${Math.max(5, Math.round((value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

function FlyerTracker({
  flyers,
  setFlyers,
}: {
  flyers: FlyerLead[];
  setFlyers: (flyers: FlyerLead[]) => void;
}) {
  const [form, setForm] = useState<Omit<FlyerLead, "id">>({
    address: "",
    neighborhood: "",
    propertyType: "Residential",
    status: "Flyer left",
    gps: "",
    notes: "",
    visitedAt: todayIso(),
  });
  const [query, setQuery] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  const filteredFlyers = flyers.filter((flyer) => `${flyer.address} ${flyer.neighborhood} ${flyer.status}`.toLowerCase().includes(query.toLowerCase()));

  const addFlyer = (event: FormEvent) => {
    event.preventDefault();

    if (!form.address.trim()) {
      return;
    }

    setFlyers([{ ...form, id: makeId("flyer") }, ...flyers]);
    setForm({
      address: "",
      neighborhood: form.neighborhood,
      propertyType: form.propertyType,
      status: "Flyer left",
      gps: "",
      notes: "",
      visitedAt: todayIso(),
    });
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS is not available in this browser.");
      return;
    }

    setLocationStatus("Getting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gps = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setForm((current) => ({ ...current, gps }));
        setLocationStatus("Location added.");
      },
      () => setLocationStatus("Location permission was denied or unavailable."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const exportCsv = () => {
    const headers = ["Date", "Address", "Neighborhood", "Property type", "Status", "GPS", "Notes"];
    const rows = flyers.map((flyer) => [flyer.visitedAt, flyer.address, flyer.neighborhood, flyer.propertyType, flyer.status, flyer.gps ?? "", flyer.notes]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `viper-flyer-route-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="ops-section two-column">
      <form className="tool-panel" onSubmit={addFlyer}>
        <div className="panel-heading">
          <h2>Add flyer stop</h2>
          <span>Use this while walking routes</span>
        </div>
        <label>
          Address
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="House number and street" />
        </label>
        <label>
          Neighborhood / route
          <input value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} placeholder="Route A, subdivision, beach block" />
        </label>
        <div className="form-grid compact">
          <label>
            Property type
            <select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value as ClientType })}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Vacation rental</option>
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FlyerStatus })}>
              <option>Flyer left</option>
              <option>Knocked</option>
              <option>Interested</option>
              <option>Callback</option>
              <option>Booked</option>
              <option>Skip</option>
            </select>
          </label>
        </div>
        <label>
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Gate code, no soliciting, call back, visible rental sign" />
        </label>
        <div className="button-row">
          <button className="btn primary" type="submit">
            <Plus size={18} />
            Save stop
          </button>
          <button className="btn neutral" type="button" onClick={captureLocation}>
            <Navigation size={18} />
            GPS
          </button>
        </div>
        {locationStatus && <p className="form-note">{locationStatus}</p>}
        {form.gps && <p className="form-note">Current GPS: {form.gps}</p>}
      </form>

      <div className="tool-panel">
        <div className="panel-heading">
          <h2>Flyer route log</h2>
          <button className="btn neutral small" type="button" onClick={exportCsv}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <label className="search-label">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search route, address, or status" />
        </label>
        <div className="table-list roomy">
          {filteredFlyers.map((flyer) => (
            <div className="table-row route-row" key={flyer.id}>
              <div>
                <strong>{flyer.address}</strong>
                <span>
                  {flyer.neighborhood || "No route"} • {flyer.propertyType} • {flyer.visitedAt}
                </span>
                {flyer.notes && <p>{flyer.notes}</p>}
                {flyer.gps && <small>GPS: {flyer.gps}</small>}
              </div>
              <div className="row-actions">
                <select
                  aria-label={`Status for ${flyer.address}`}
                  value={flyer.status}
                  onChange={(event) =>
                    setFlyers(flyers.map((item) => (item.id === flyer.id ? { ...item, status: event.target.value as FlyerStatus } : item)))
                  }
                >
                  <option>Flyer left</option>
                  <option>Knocked</option>
                  <option>Interested</option>
                  <option>Callback</option>
                  <option>Booked</option>
                  <option>Skip</option>
                </select>
                <IconButton label={`Delete ${flyer.address}`} variant="danger" onClick={() => setFlyers(flyers.filter((item) => item.id !== flyer.id))}>
                  <Trash2 size={17} />
                </IconButton>
              </div>
            </div>
          ))}
          {filteredFlyers.length === 0 && <p className="empty-copy">No flyer stops match that search.</p>}
        </div>
      </div>
    </section>
  );
}

function EstimateManager({
  estimates,
  setEstimates,
}: {
  estimates: Estimate[];
  setEstimates: (estimates: Estimate[]) => void;
}) {
  const [form, setForm] = useState<EstimateInput>({
    customerName: "",
    service: "standard",
    sqft: 1500,
    bedrooms: 3,
    bathrooms: 2,
    frequency: "one-time",
    extras: [],
    notes: "",
  });
  const estimate = calculateEstimate(form);

  const saveEstimate = (event: FormEvent) => {
    event.preventDefault();

    if (!form.customerName.trim()) {
      return;
    }

    setEstimates([
      {
        ...form,
        id: makeId("estimate"),
        total: estimate.total,
        low: estimate.low,
        high: estimate.high,
        status: "Draft",
        createdAt: todayIso(),
      },
      ...estimates,
    ]);
    setForm({ ...form, customerName: "", notes: "" });
  };

  return (
    <section className="ops-section two-column">
      <form className="tool-panel" onSubmit={saveEstimate}>
        <div className="panel-heading">
          <h2>Create estimate</h2>
          <span>Fast field pricing</span>
        </div>
        <label>
          Customer / job name
          <input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="Customer name or property" />
        </label>
        <EstimatorFields input={form} onChange={setForm} />
        <label>
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Condition, travel, lockbox, supplies, special details" />
        </label>
        <EstimateResult estimate={estimate} service={form.service} />
        <button className="btn primary full" type="submit">
          <Plus size={18} />
          Save estimate
        </button>
      </form>

      <div className="tool-panel">
        <div className="panel-heading">
          <h2>Estimate pipeline</h2>
          <span>{estimates.length} quotes saved</span>
        </div>
        <div className="table-list roomy">
          {estimates.map((estimateItem) => (
            <div className="table-row quote-row" key={estimateItem.id}>
              <div>
                <strong>{estimateItem.customerName}</strong>
                <span>
                  {serviceLabels[estimateItem.service]} • {estimateItem.sqft.toLocaleString()} sq ft • {estimateItem.createdAt}
                </span>
                <p>
                  Range {currency.format(estimateItem.low)} - {currency.format(estimateItem.high)}
                  {estimateItem.notes ? ` • ${estimateItem.notes}` : ""}
                </p>
              </div>
              <div className="row-actions">
                <strong>{currency.format(estimateItem.total)}</strong>
                <select
                  aria-label={`Status for ${estimateItem.customerName}`}
                  value={estimateItem.status}
                  onChange={(event) =>
                    setEstimates(
                      estimates.map((item) => (item.id === estimateItem.id ? { ...item, status: event.target.value as EstimateStatus } : item)),
                    )
                  }
                >
                  <option>New</option>
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Booked</option>
                  <option>Lost</option>
                </select>
                <IconButton label={`Delete ${estimateItem.customerName}`} variant="danger" onClick={() => setEstimates(estimates.filter((item) => item.id !== estimateItem.id))}>
                  <Trash2 size={17} />
                </IconButton>
              </div>
            </div>
          ))}
          {estimates.length === 0 && <p className="empty-copy">No estimates yet. Save your first one from the calculator.</p>}
        </div>
      </div>
    </section>
  );
}

function ClientManager({
  clients,
  setClients,
}: {
  clients: Client[];
  setClients: (clients: Client[]) => void;
}) {
  const [form, setForm] = useState<Omit<Client, "id">>({
    name: "",
    phone: "",
    email: "",
    address: "",
    type: "Residential",
    frequency: "one-time",
    nextService: todayIso(),
    lifetimeValue: 0,
    notes: "",
  });
  const [query, setQuery] = useState("");
  const filteredClients = clients.filter((client) => `${client.name} ${client.address} ${client.type}`.toLowerCase().includes(query.toLowerCase()));

  const addClient = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    setClients([{ ...form, id: makeId("client") }, ...clients]);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      type: "Residential",
      frequency: "one-time",
      nextService: todayIso(),
      lifetimeValue: 0,
      notes: "",
    });
  };

  return (
    <section className="ops-section two-column">
      <form className="tool-panel" onSubmit={addClient}>
        <div className="panel-heading">
          <h2>Add client</h2>
          <span>Simple CRM</span>
        </div>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Client or business name" />
        </label>
        <div className="form-grid compact">
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
          </label>
        </div>
        <label>
          Address
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Service address" />
        </label>
        <div className="form-grid compact">
          <label>
            Type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ClientType })}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Vacation rental</option>
            </select>
          </label>
          <label>
            Frequency
            <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as Frequency })}>
              {Object.entries(frequencyLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid compact">
          <label>
            Next service
            <input type="date" value={form.nextService} onChange={(event) => setForm({ ...form, nextService: event.target.value })} />
          </label>
          <label>
            Lifetime value
            <input
              type="number"
              min="0"
              value={form.lifetimeValue}
              onChange={(event) => setForm({ ...form, lifetimeValue: Number(event.target.value) })}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Access notes, preferences, allergies, recurring details" />
        </label>
        <button className="btn primary full" type="submit">
          <Plus size={18} />
          Save client
        </button>
      </form>

      <div className="tool-panel">
        <div className="panel-heading">
          <h2>Client list</h2>
          <span>{clients.length} total records</span>
        </div>
        <label className="search-label">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients" />
        </label>
        <div className="table-list roomy">
          {filteredClients.map((client) => (
            <div className="table-row client-row" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <span>
                  {client.type} • {frequencyLabels[client.frequency]} • Next: {client.nextService || "Set date"}
                </span>
                <p>{client.address}</p>
                <small>
                  {[client.phone, client.email].filter(Boolean).join(" • ") || "No contact details yet"}
                </small>
                {client.notes && <p>{client.notes}</p>}
              </div>
              <div className="row-actions">
                <strong>{currency.format(client.lifetimeValue)}</strong>
                <IconButton label={`Delete ${client.name}`} variant="danger" onClick={() => setClients(clients.filter((item) => item.id !== client.id))}>
                  <Trash2 size={17} />
                </IconButton>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && <p className="empty-copy">No clients match that search.</p>}
        </div>
      </div>
    </section>
  );
}

export default App;
