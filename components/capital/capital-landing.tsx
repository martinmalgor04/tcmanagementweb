"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Gloock } from "next/font/google"

import { META_PRODUCT } from "@/lib/capital/product-public"
import { track } from "@/lib/capital/track-client"
import { fbqTrack } from "@/lib/meta-pixel-client"

const gloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gloock",
  display: "swap",
})

/* ============================================================
   DATOS DEL PRODUCTO — editá acá y se actualiza toda la página
   ============================================================ */

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_MONOGRAM = `${CDN}/LOGOS/tc-monogram-white.png`
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-black.png`
const PORTADA = `${CDN}/CEV/portada-simbologia.jpg`
const FOTO_TARSILA = `${CDN}/CEV/tarsila-cicconetti.jpg`

const PRODUCTO = "Capital de Esencia Visual"
const CTA_TEXT = "Comprar ahora"

const CHECKOUT_URL = "/api/capital/checkout"

const PRECIO = "$19.999"
const VALOR_ANCLA = "$49.999"
const MEDIO_PAGO = "Mercado Pago"

/** Medianos de septiembre 2026 (Argentina). */
const LANZAMIENTO_HASTA = Date.parse("2026-09-15T23:59:59-03:00")

/* ============================================================
   Hooks de animación
   ============================================================ */

function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const max = document.documentElement.scrollHeight - window.innerHeight
        el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return ref
}

function useRevealOnScroll<T extends HTMLElement>() {
  const rootRef = useRef<T>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = root.querySelectorAll<HTMLElement>("[data-cev-reveal]")
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("cev-visible")
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  return rootRef
}

function useTilt(max = 12) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty("--ry", `${px * max}deg`)
      el.style.setProperty("--rx", `${-py * max + 6}deg`)
    },
    [max]
  )

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--ry", "-14deg")
    el.style.setProperty("--rx", "8deg")
  }, [])

  return { ref, onMove, onLeave }
}

function useStickyCta() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const oferta = document.getElementById("oferta")
      const nearOferta = oferta
        ? oferta.getBoundingClientRect().top < window.innerHeight
        : false
      setShow(window.scrollY > window.innerHeight * 0.9 && !nearOferta)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return show
}

function useCountdown(targetMs: number) {
  const tick = useCallback(() => {
    const s = Math.max(0, Math.floor((targetMs - Date.now()) / 1000))
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      done: s <= 0,
    }
  }, [targetMs])

  const [left, setLeft] = useState(tick)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLeft(tick())
    setReady(true)
    const id = setInterval(() => setLeft(tick()), 1000)
    return () => clearInterval(id)
  }, [tick])

  return { ...left, ready }
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function Countdown() {
  const { days, hours, minutes, seconds, ready } = useCountdown(LANZAMIENTO_HASTA)
  const units = [
    { n: days, label: "Días" },
    { n: hours, label: "Hs" },
    { n: minutes, label: "Min" },
    { n: seconds, label: "Seg" },
  ]

  return (
    <div
      className="mt-8 flex items-stretch justify-center gap-3 sm:gap-4"
      aria-live="polite"
      aria-label="Cuenta regresiva hasta el 15 de septiembre"
    >
      {units.map((u) => (
        <div
          key={u.label}
          className="min-w-[4.25rem] rounded-sm border border-black/10 bg-white px-3 py-4 sm:min-w-[5rem] sm:px-4"
        >
          <p className="font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            {ready ? pad2(u.n) : "––"}
          </p>
          <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-neutral-500">
            {u.label}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Piezas reutilizables
   ============================================================ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      data-cev-reveal
      className={`cev-reveal ${className}`}
      style={{ "--cev-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}

function CtaButton({
  href = CHECKOUT_URL,
  children = CTA_TEXT,
  className = "",
  pulse = false,
}: {
  href?: string
  children?: ReactNode
  className?: string
  pulse?: boolean
}) {
  const cls = `cev-cta cev-shine relative inline-flex items-center justify-center gap-3 rounded-full bg-[#070707] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#f5f4f2] sm:px-12 sm:py-5 sm:text-base ${className}`
  const label = (
    <>
      {pulse && <span className="cev-pulse-ring" aria-hidden />}
      <span className="relative z-[2]">{children}</span>
      <svg
        className="relative z-[2] h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </>
  )

  if (href === CHECKOUT_URL) {
    return (
      <form
        action={CHECKOUT_URL}
        method="post"
        className="inline-flex"
        onSubmit={() => {
          track("checkout_click")
          fbqTrack("InitiateCheckout", {
            value: META_PRODUCT.value,
            currency: META_PRODUCT.currency,
            content_name: META_PRODUCT.contentName,
          })
        }}
      >
        <button type="submit" className={cls}>
          {label}
        </button>
      </form>
    )
  }

  return (
    <a href={href} rel="noopener noreferrer" className={cls}>
      {label}
    </a>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-600">
      <span className="inline-block h-px w-10 bg-[#c8b48a]" aria-hidden />
      {children}
    </p>
  )
}

/* ============================================================
   Mockup del producto (CSS puro — reemplazar por render real)
   ============================================================ */

function ProductMockup() {
  const { ref, onMove, onLeave } = useTilt(14)

  return (
    <div
      className="cev-stage relative mx-auto w-64 sm:w-72 md:w-80"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* halo */}
      <div
        className="absolute -inset-10 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(200,180,138,0.16) 0%, rgba(245,244,242,0.08) 45%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="cev-float relative">
        <div ref={ref} className="cev-book relative aspect-[819/1024] w-full">
          <div className="absolute inset-0 overflow-hidden rounded-sm border border-[#c8b48a]/30 bg-[#e8e4de] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
            <img
              src={PORTADA}
              alt="Portada del manual Simbología del vestir — Capital de Esencia Visual"
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 46%, transparent 60%)",
              }}
              aria-hidden
            />
          </div>
          {/* lomo */}
          <div
            className="absolute left-0 top-0 h-full w-[14px] origin-left rounded-l-sm border-y border-l border-[#c8b48a]/35 bg-gradient-to-b from-[#cfc6bc] to-[#8f857a]"
            style={{ transform: "rotateY(-78deg) translateX(-13px)" }}
            aria-hidden
          />
        </div>
        <div className="cev-book-shadow" aria-hidden />
      </div>
    </div>
  )
}

/* ============================================================
   LANDING
   ============================================================ */

export default function CapitalLanding() {
  const progressRef = useScrollProgress()
  const rootRef = useRevealOnScroll<HTMLDivElement>()
  const showSticky = useStickyCta()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [checkoutNotice, setCheckoutNotice] = useState<"error" | "cancelado" | null>(null)

  useEffect(() => {
    track("landing_view")
    const checkout = new URLSearchParams(window.location.search).get("checkout")
    if (checkout === "error" || checkout === "cancelado") {
      setCheckoutNotice(checkout)
    }
  }, [])

  const faqs = [
    {
      q: "¿Cómo y cuándo lo recibo?",
      a: "Apenas se acredita el pago te llega un mail con tu link de acceso. Lo abrís y entrás al manual completo desde el celu, la tablet o la compu, sin descargar nada. El acceso es tuyo y queda siempre disponible.",
    },
    {
      q: "¿Necesito saber de moda o de imagen?",
      a: "No. Está escrito para leerse de corrido, sin tecnicismos, y aplicarse el mismo día: abrís tu placard y empezás a leerlo como un idioma.",
    },
    {
      q: "¿Qué formato tiene?",
      a: "Es un manual digital interactivo que se lee online, visual y directo al punto: 8 colores con su mensaje, paletas que funcionan, código de estampas, fórmulas de prendas, guía de accesorios, la secuencia de 7 pasos y el checklist del espejo. Lo leés en una tarde y lo usás toda la vida.",
    },
    {
      q: "¿Los medios de pago?",
      a: "Se paga por Mercado Pago: tarjeta de crédito o débito, dinero en cuenta o el medio que tengas habilitado ahí.",
    },
  ]

  return (
    <div ref={rootRef} className={`capital-landing cev-grain relative min-h-screen font-[inherit] ${gloock.variable}`}>
      <div ref={progressRef} className="cev-progress" aria-hidden />

      {/* ============ 1 · HERO ============ */}
      <header className="relative flex min-h-[100svh] flex-col overflow-hidden px-6 pb-16 pt-8">
        <div className="cev-gridlines" aria-hidden />
        <div className="cev-orb cev-orb-a -left-1/4 -top-1/4" aria-hidden />
        <div className="cev-orb cev-orb-b -bottom-1/4 -right-1/4" aria-hidden />

        {/* marca */}
        <div className="relative z-10 flex items-center justify-between gap-6">
          <img
            src={LOGO_WORDMARK}
            alt="TC Management"
            className="h-5 w-auto sm:h-7"
          />
          <span className="hidden text-[10px] uppercase tracking-[0.4em] text-neutral-500 sm:block">
            Somos Esencia · Somos TC
          </span>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-start gap-14 pt-14 md:grid-cols-[1fr_0.95fr] md:gap-16 lg:gap-20">
          <div className="max-w-xl text-center md:justify-self-start md:text-left">
            <p
              className="cev-fade-blur mb-6 text-[11px] font-medium uppercase tracking-[0.5em] text-[#c8b48a]"
              style={{ "--cev-delay": "150ms" } as CSSProperties}
            >
              Manual digital · {PRODUCTO}
            </p>

            <h1 className="cev-serif text-[clamp(2.4rem,7.5vw,5.2rem)] leading-[1.04]">
              <span className="cev-line-mask">
                <span className="cev-line-inner" style={{ "--cev-delay": "250ms" } as CSSProperties}>
                  Tu ropa habla
                </span>
              </span>
              <span className="cev-line-mask">
                <span className="cev-line-inner" style={{ "--cev-delay": "400ms" } as CSSProperties}>
                  antes que vos.
                </span>
              </span>
              <span className="cev-line-mask">
                <span
                  className="cev-line-inner italic text-neutral-500"
                  style={{ "--cev-delay": "550ms" } as CSSProperties}
                >
                  Que diga lo correcto.
                </span>
              </span>
            </h1>

            <p
              className="cev-fade-blur mx-auto mt-7 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg md:mx-0"
              style={{ "--cev-delay": "750ms" } as CSSProperties}
            >
              El poder de los símbolos y los colores en la estrategia de la
              vestimenta: aprendé a elegir —con conciencia—{" "}
              <span className="text-[#070707]">los colores, las telas y los símbolos</span>{" "}
              que traducen tu esencia en imagen.
            </p>

            <div
              className="cev-fade-blur mt-9 flex flex-col items-center gap-5 md:items-start"
              style={{ "--cev-delay": "900ms" } as CSSProperties}
            >
              <div className="flex items-end gap-4">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {PRECIO}
                </span>
                <span className="pb-1 text-sm text-red-600 line-through">
                  {VALOR_ANCLA}
                </span>
              </div>
              <CtaButton pulse />
              {checkoutNotice === "error" && (
                <p className="text-sm text-red-600">
                  No se pudo abrir Mercado Pago. Probá de nuevo en un momento.
                </p>
              )}
              {checkoutNotice === "cancelado" && (
                <p className="text-sm text-neutral-600">
                  El pago no se completó. Cuando quieras, volvé a intentar.
                </p>
              )}
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                Pago con {MEDIO_PAGO}
              </p>
            </div>
          </div>

          <div
            className="cev-fade-blur relative mt-2 md:mt-[3.25rem]"
            style={{ "--cev-delay": "650ms" } as CSSProperties}
          >
            <ProductMockup />
          </div>
        </div>

        {/* indicador scroll */}
        <div className="relative z-10 mx-auto mt-auto flex flex-col items-center gap-2 pt-16 text-neutral-600">
          <span className="text-[10px] uppercase tracking-[0.4em]">Deslizá</span>
          <span className="block h-10 w-px animate-pulse bg-gradient-to-b from-neutral-400 to-transparent" aria-hidden />
        </div>
      </header>

      {/* ============ marquee ============ */}
      <div className="cev-marquee border-y border-black/10 py-5">
        <div className="cev-marquee-track text-sm font-medium uppercase tracking-[0.45em] text-neutral-500">
          {Array.from({ length: 2 }).map((_, dup) => (
            <span key={dup} className="flex items-center gap-12" aria-hidden={dup === 1}>
              {["Esencia", "Color", "Estampa", "Prenda", "Accesorio", "Intención"].map(
                (w) => (
                  <span key={w} className="flex items-center gap-12">
                    {w}
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[#c8b48a]" aria-hidden />
                  </span>
                )
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ============ 2 · DOLOR ============ */}
      <section className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <Reveal>
          <SectionLabel>El problema</SectionLabel>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="cev-serif text-3xl leading-tight sm:text-4xl">
            Te reconocés acá:
          </h2>
        </Reveal>
        <ul className="mt-10 space-y-6">
          {[
            "Te vestís en automático: abrís el placard y elegís sin pensar qué querés comunicar hoy.",
            "Tenés ropa linda y aun así sentís que tu imagen no te representa — como si te disfrazaras de otra persona.",
            "Ante una reunión, una entrevista o una cita importante, dudás: no sabés qué ponerte para causar exactamente la impresión que buscás.",
          ].map((t, i) => (
            <Reveal key={i} delay={i * 110}>
              <li className="flex gap-5 border-l border-[#c8b48a]/40 pl-6 text-lg leading-relaxed text-neutral-700">
                {t}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ============ 3 · AGITACIÓN ============ */}
      <section className="border-y border-black/10 bg-[#f6f6f6] px-6 py-20 text-center sm:py-24">
        <Reveal className="mx-auto max-w-3xl">
          <p className="cev-serif text-xl leading-relaxed text-neutral-700 sm:text-2xl">
            La primera impresión se forma en{" "}
            <span className="text-[#c8b48a]">siete segundos</span> y
            necesita veinte encuentros para corregirse. Y hay clientes,
            entrevistas y personas que vas a ver{" "}
            <span className="text-[#c8b48a]">una sola vez</span>. Antes
            de tu voz, tu currículum o tu apretón de manos, ya comunicaste con tu
            imagen. <em>Esa es la diferencia entre estar vestida y estar comunicando.</em>
          </p>
        </Reveal>
      </section>

      {/* ============ 4 · AUTORIDAD ============ */}
      <section id="autoridad" className="mx-auto max-w-4xl scroll-mt-10 px-6 py-24 sm:py-32">
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="flex justify-center">
            <figure className="relative aspect-[2/3] w-full max-w-xs overflow-hidden rounded-sm border border-black/10 bg-[#111]">
              <img
                src={FOTO_TARSILA}
                alt="Tarsila Cicconetti"
                className="h-full w-full object-cover object-top"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-6 pb-5 pt-16">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#f5f4f2]">
                  Tarsila Cicconetti
                </p>
              </figcaption>
            </figure>
          </Reveal>
          <div>
            <Reveal>
              <SectionLabel>Quién está detrás</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="cev-serif text-3xl sm:text-4xl">
                Tarsila Cicconetti
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.35em] text-[#c8b48a]">
                Asesora de imagen con propósito & descodificadora visual
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 leading-relaxed text-neutral-700">
                De TC — <span className="italic">Somos Esencia · Somos TC</span>.
                Tarsila descodifica lo que la vestimenta dice antes que las
                palabras: colores, estampas, prendas y accesorios como un idioma
                que cualquiera puede aprender a hablar. Este manual destila ese
                método para aplicarlo sola, todas las mañanas, frente a tu
                propio placard.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 5 · QUÉ INCLUYE ============ */}
      <section className="border-y border-black/10 bg-[#f6f6f6] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionLabel>Qué te llevás</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="cev-serif max-w-2xl text-3xl sm:text-4xl">
              No es moda. Es intención.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-2xl leading-relaxed text-neutral-600">
              Un vocabulario de cuatro palabras —{" "}
              <span className="text-[#070707]">color, estampa, prenda y accesorio</span>{" "}
              — que combinadas con intención se vuelven una frase. Combinadas al
              azar, ruido.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
            {[
              {
                t: "El lenguaje de los colores",
                d: "8 colores, 8 mensajes: qué comunica cada uno, cuándo usarlo, con qué combinarlo y qué cuidar. Con la regla 60·30·10 y las paletas que nunca fallan.",
              },
              {
                t: "El código de las estampas",
                d: "Animal print, cuadros, rayas, lunares, florales y geométricos: qué dice cada patrón y la regla de escala para acertar siempre.",
              },
              {
                t: "Las fórmulas de prendas",
                d: "Autoridad y conexión, paso a paso: blazer estructurado, silueta fluida, telas y caídas — con la fórmula exacta de cada mensaje y tus 6 arquetipos de estilo.",
              },
              {
                t: "Accesorios + la secuencia",
                d: "Aros, collares, brazaletes y lentes como firma del mensaje. Y la secuencia de 7 pasos con el checklist del espejo para no volver a vestirte en automático.",
              },
            ].map((item, i) => (
              <Reveal key={item.t} delay={i * 100} className="bg-white">
                <div className="group h-full p-8 transition-colors duration-500 hover:bg-[#f6f6f6] sm:p-10">
                  <span className="text-xs font-bold tracking-[0.3em] text-[#c8b48a]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="cev-serif mt-4 text-xl sm:text-2xl">
                    {item.t}
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-600">{item.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6 · PARA QUIÉN ES / NO ES ============ */}
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <Reveal>
          <SectionLabel>Honestidad primero</SectionLabel>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal delay={60}>
            <div className="h-full rounded-sm border border-[#c8b48a]/35 p-8 sm:p-10">
              <h3 className="text-lg font-bold uppercase tracking-wider">Es para vos si…</h3>
              <ul className="mt-6 space-y-4 text-neutral-700">
                {[
                  "Tenés reuniones, clientes, entrevistas o citas donde la primera impresión juega a favor — o en contra.",
                  "Querés que tu ropa diga exactamente lo que vos querés decir: poder, cercanía, confianza, creatividad o calma.",
                  "Sentís que tu placard no te representa y querés vestir con intención, no con suerte.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#c8b48a]" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="h-full rounded-sm border border-black/10 bg-[#f6f6f6] p-8 sm:p-10">
              <h3 className="text-lg font-bold uppercase tracking-wider text-neutral-600">
                No es para vos si…
              </h3>
              <ul className="mt-6 space-y-4 text-neutral-500">
                {[
                  "Buscás tendencias o \"qué se usa esta temporada\": esto es estrategia, no moda pasajera.",
                  "Esperás que alguien decida por vos en vez de aprender a decidir.",
                  "Creés que la imagen es superficial — cuando es tu primer acto de comunicación del día.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-neutral-400" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 8 · OFERTA ============ */}
      <section id="oferta" className="relative scroll-mt-10 overflow-hidden px-6 py-24 sm:py-36">
        <div className="cev-orb cev-orb-b left-1/2 top-0 -translate-x-1/2" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center md:text-left">
          <Reveal>
            <SectionLabel>La oportunidad</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="cev-serif text-3xl leading-tight sm:text-5xl">
              Manual {PRODUCTO}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-xl leading-relaxed text-neutral-600">
              El método completo — color, estampas, prendas y accesorios — que
              leés en una tarde y usás toda la vida. Un solo pago.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-3 md:items-start">
              <span className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                Valor total{" "}
                <span className="text-red-600 line-through">{VALOR_ANCLA}</span>
              </span>
              <span className="text-6xl font-bold tracking-tight sm:text-7xl">
                {PRECIO}
              </span>
              <span className="mt-5 text-xs uppercase tracking-[0.25em] text-neutral-600">
                Pago único · {MEDIO_PAGO}
              </span>
            </div>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10">
              <CtaButton pulse />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 10 · FAQ ============ */}
      <section className="mx-auto max-w-3xl px-6 pb-24 sm:pb-32">
        <Reveal>
          <SectionLabel>Preguntas frecuentes</SectionLabel>
        </Reveal>
        <div className="divide-y divide-black/10 border-y border-black/10">
          {faqs.map((f, i) => {
            const open = openFaq === i
            return (
              <Reveal key={i} delay={i * 60}>
                <div className="cev-faq-item py-6" data-open={open}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-6 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-base font-bold uppercase tracking-wide sm:text-lg">
                      {f.q}
                    </span>
                    <span className="cev-faq-icon shrink-0 text-2xl font-light leading-none text-neutral-600" aria-hidden>
                      +
                    </span>
                  </button>
                  <div className="cev-faq-body" data-open={open}>
                    <div className="cev-faq-inner">
                      <p className="pt-4 leading-relaxed text-neutral-600">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ============ 11 · URGENCIA ============ */}
      <section className="border-y border-black/10 bg-[#f6f6f6] px-6 py-20 text-center sm:py-24">
        <Reveal className="mx-auto max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-[#c8b48a]">
            Por tiempo limitado
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.35em] text-neutral-600">
            El valor de lanzamiento vence el 15 de septiembre
          </p>
          <Countdown />
          <p className="mt-6 text-neutral-600">
            Cuando termina el lanzamiento, el valor de oportunidad desaparece.
          </p>
        </Reveal>
      </section>

      {/* ============ 12 · CTA FINAL ============ */}
      <footer className="relative overflow-hidden px-6 py-28 text-center sm:py-36">
        <div className="cev-orb cev-orb-a -bottom-1/3 left-1/2 -translate-x-1/2" aria-hidden />
        <div className="relative mx-auto max-w-3xl">
          <Reveal>
            <img src={LOGO_WORDMARK} alt="TC Management" className="mx-auto h-6 w-auto opacity-80" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="cev-serif mt-8 text-4xl leading-[1.08] sm:text-6xl">
              No te vistas para
              <br />
              que te miren.
              <br />
              <span className="italic text-neutral-500">Vestite para que te lean.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-md text-neutral-600">
              Tu esencia ya existe. Empezá hoy a traducirla en imagen con{" "}
              <span className="text-[#070707]">{PRODUCTO}</span>.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10 flex flex-col items-center gap-5">
              <CtaButton pulse />
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                {PRECIO} · {MEDIO_PAGO}
              </p>
            </div>
          </Reveal>
          <Reveal delay={380}>
            <div className="mt-16 border-t border-black/10 pt-8">
              <img
                src={LOGO_MONOGRAM}
                alt=""
                aria-hidden
                className="mx-auto h-7 w-auto opacity-50 brightness-0"
              />
              <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                © {new Date().getFullYear()} TC Management · Somos Esencia · Somos TC
              </p>
            </div>
          </Reveal>
        </div>
      </footer>

      {/* ============ sticky CTA mobile ============ */}
      <div
        className={`cev-sticky-cta fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/90 px-5 py-4 backdrop-blur-md md:hidden ${showSticky ? "cev-visible" : ""}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">{PRODUCTO}</p>
            <p className="text-lg font-bold">{PRECIO}</p>
          </div>
          <CtaButton className="!px-6 !py-3 !text-xs" />
        </div>
      </div>
    </div>
  )
}
