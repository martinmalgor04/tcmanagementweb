"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

/* ============================================================
   DATOS DEL PRODUCTO — editá acá y se actualiza toda la página
   ============================================================ */

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_MONOGRAM = `${CDN}/LOGOS/tc-monogram-white.png`
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-white.png`
const PORTADA = `${CDN}/CEV/portada-simbologia.jpg`
const FOTO_TARSILA = `${CDN}/CEV/tarsila-cicconetti.jpg`

const PRODUCTO = "Capital de Esencia Visual"
const CTA_TEXT = "Comprar ahora"

// {{PENDIENTE: URL de checkout (Hotmart / Stripe / MercadoPago)}}
const CHECKOUT_URL = "#oferta"

const PRECIO = "$19.999"
const VALOR_ANCLA = "$39.999"

// {{PENDIENTE: días de garantía (7–14)}}
const GARANTIA_DIAS = "{{PENDIENTE: días de garantía}}"

// {{PENDIENTE: urgencia real — bono de lanzamiento / fecha límite}}
const URGENCIA = "{{PENDIENTE: bono de lanzamiento o fecha límite}}"

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
  return (
    <a
      href={href}
      className={`cev-cta cev-shine relative inline-flex items-center justify-center gap-3 rounded-full bg-[#f5f4f2] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#070707] sm:px-12 sm:py-5 sm:text-base ${className}`}
    >
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
    </a>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-400">
      <span className="inline-block h-px w-10 bg-neutral-500" aria-hidden />
      {children}
    </p>
  )
}

function Pending({ children }: { children: ReactNode }) {
  return <span className="cev-pending">{children}</span>
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

  const faqs = [
    {
      q: "¿Cómo y cuándo lo recibo?",
      a: "Apenas se acredita el pago te llega el link de descarga. Es un PDF: lo leés en el celu, la tablet o la compu, y queda tuyo para siempre.",
    },
    {
      q: "¿Necesito saber de moda o de imagen?",
      a: "No. Está escrito para leerse de corrido, sin tecnicismos, y aplicarse el mismo día: abrís tu placard y empezás a leerlo como un idioma.",
    },
    {
      q: "¿Qué formato tiene?",
      a: "Manual digital de 36 páginas, visual y directo al punto: 8 colores con su mensaje, paletas que funcionan, código de estampas, fórmulas de prendas, guía de accesorios, la secuencia de 7 pasos y el checklist del espejo. Lo leés en una tarde y lo usás toda la vida.",
    },
    {
      q: "¿Tiene garantía?",
      a: (
        <>
          Sí. Tenés <Pending>{GARANTIA_DIAS}</Pending> para leerlo y aplicarlo. Si
          no cambió tu forma de vestirte, te devolvemos el 100% sin preguntas.
        </>
      ),
    },
    {
      q: "¿Los medios de pago?",
      a: (
        <>
          <Pending>{"{{PENDIENTE: medios de pago — tarjeta, MercadoPago, transferencia}}"}</Pending>
        </>
      ),
    },
  ]

  return (
    <div ref={rootRef} className="capital-landing cev-grain relative min-h-screen font-[inherit]">
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

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 pt-14 md:grid-cols-[1fr_0.95fr] md:gap-16 lg:gap-20">
          <div className="max-w-xl text-center md:justify-self-start md:text-left">
            <p
              className="cev-fade-blur mb-6 text-[11px] font-medium uppercase tracking-[0.5em] text-neutral-400"
              style={{ "--cev-delay": "150ms" } as CSSProperties}
            >
              Manual digital · {PRODUCTO}
            </p>

            <h1 className="text-[clamp(2.4rem,7.5vw,5.2rem)] font-bold uppercase leading-[0.98] tracking-tight">
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
                  className="cev-line-inner text-neutral-500"
                  style={{ "--cev-delay": "550ms" } as CSSProperties}
                >
                  Que diga lo correcto.
                </span>
              </span>
            </h1>

            <p
              className="cev-fade-blur mx-auto mt-7 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg md:mx-0"
              style={{ "--cev-delay": "750ms" } as CSSProperties}
            >
              El poder de los símbolos y los colores en la estrategia de la
              vestimenta: aprendé a elegir —con conciencia—{" "}
              <span className="text-[#f5f4f2]">los colores, las telas y los símbolos</span>{" "}
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
                <span className="pb-1 text-sm text-neutral-500 line-through">
                  {VALOR_ANCLA}
                </span>
              </div>
              <CtaButton href="#oferta" pulse />
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                Descarga inmediata · Garantía de <Pending>{GARANTIA_DIAS}</Pending>
              </p>
            </div>
          </div>

          <div
            className="cev-fade-blur relative -mt-8 self-start sm:-mt-10 md:-mt-20"
            style={{ "--cev-delay": "650ms" } as CSSProperties}
          >
            <ProductMockup />
          </div>
        </div>

        {/* indicador scroll */}
        <div className="relative z-10 mx-auto mt-auto flex flex-col items-center gap-2 pt-16 text-neutral-600">
          <span className="text-[10px] uppercase tracking-[0.4em]">Deslizá</span>
          <span className="block h-10 w-px animate-pulse bg-gradient-to-b from-neutral-700 to-transparent" aria-hidden />
        </div>
      </header>

      {/* ============ marquee ============ */}
      <div className="cev-marquee border-y border-white/10 py-5">
        <div className="cev-marquee-track text-sm font-medium uppercase tracking-[0.45em] text-neutral-500">
          {Array.from({ length: 2 }).map((_, dup) => (
            <span key={dup} className="flex items-center gap-12" aria-hidden={dup === 1}>
              {["Esencia", "Color", "Estampa", "Prenda", "Accesorio", "Intención"].map(
                (w) => (
                  <span key={w} className="flex items-center gap-12">
                    {w}
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-neutral-600" aria-hidden />
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
          <h2 className="text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
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
              <li className="flex gap-5 border-l border-white/15 pl-6 text-lg leading-relaxed text-neutral-300">
                {t}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ============ 3 · AGITACIÓN ============ */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-20 text-center sm:py-24">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-xl leading-relaxed text-neutral-300 sm:text-2xl">
            La primera impresión se forma en{" "}
            <span className="font-bold text-[#f5f4f2]">siete segundos</span> y
            necesita veinte encuentros para corregirse. Y hay clientes,
            entrevistas y personas que vas a ver{" "}
            <span className="font-bold text-[#f5f4f2]">una sola vez</span>. Antes
            de tu voz, tu currículum o tu apretón de manos, ya comunicaste con tu
            imagen. Esa es la diferencia entre estar vestida y estar comunicando.
          </p>
        </Reveal>
      </section>

      {/* ============ 4 · AUTORIDAD ============ */}
      <section id="autoridad" className="mx-auto max-w-4xl scroll-mt-10 px-6 py-24 sm:py-32">
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="flex justify-center">
            <figure className="relative aspect-[2/3] w-full max-w-xs overflow-hidden rounded-sm border border-white/15 bg-[#111]">
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
              <h2 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                Tarsila Cicconetti
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.35em] text-[#c8b48a]">
                Asesora de imagen con propósito & descodificadora visual
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 leading-relaxed text-neutral-300">
                De TC — <span className="italic">Somos Esencia · Somos TC</span>.
                Tarsila descodifica lo que la vestimenta dice antes que las
                palabras: colores, estampas, prendas y accesorios como un idioma
                que cualquiera puede aprender a hablar. Este manual destila ese
                método para que lo apliques sola, todas las mañanas, frente a tu
                propio placard.{" "}
                <Pending>{"{{PENDIENTE: credenciales — años de trayectoria, clientas, formación}}"}</Pending>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 5 · QUÉ INCLUYE ============ */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionLabel>Qué te llevás</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-2xl text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              No es moda. Es intención.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-2xl leading-relaxed text-neutral-400">
              Un vocabulario de cuatro palabras —{" "}
              <span className="text-[#f5f4f2]">color, estampa, prenda y accesorio</span>{" "}
              — que combinadas con intención se vuelven una frase. Combinadas al
              azar, ruido.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2">
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
              <Reveal key={item.t} delay={i * 100} className="bg-[#0a0a0a]">
                <div className="group h-full p-8 transition-colors duration-500 hover:bg-white/[0.04] sm:p-10">
                  <span className="text-xs font-bold tracking-[0.3em] text-neutral-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-bold uppercase tracking-tight">
                    {item.t}
                  </h3>
                  <p className="mt-3 leading-relaxed text-neutral-400">{item.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p className="mt-8 text-sm uppercase tracking-[0.25em] text-neutral-500">
              Manual digital · 36 páginas · Lectura de una tarde, uso de por vida
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ 6 · PARA QUIÉN ES / NO ES ============ */}
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <Reveal>
          <SectionLabel>Honestidad primero</SectionLabel>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal delay={60}>
            <div className="h-full rounded-sm border border-white/15 p-8 sm:p-10">
              <h3 className="text-lg font-bold uppercase tracking-wider">Es para vos si…</h3>
              <ul className="mt-6 space-y-4 text-neutral-300">
                {[
                  "Tenés reuniones, clientes, entrevistas o citas donde la primera impresión juega a favor — o en contra.",
                  "Querés que tu ropa diga exactamente lo que vos querés decir: poder, cercanía, confianza, creatividad o calma.",
                  "Sentís que tu placard no te representa y querés vestir con intención, no con suerte.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#f5f4f2]" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="h-full rounded-sm border border-white/10 bg-white/[0.02] p-8 sm:p-10">
              <h3 className="text-lg font-bold uppercase tracking-wider text-neutral-400">
                No es para vos si…
              </h3>
              <ul className="mt-6 space-y-4 text-neutral-500">
                {[
                  "Buscás tendencias o \"qué se usa esta temporada\": esto es estrategia, no moda pasajera.",
                  "Esperás que alguien decida por vos en vez de aprender a decidir.",
                  "Creés que la imagen es superficial — cuando es tu primer acto de comunicación del día.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-neutral-700" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 7 · PRUEBA SOCIAL ============ */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionLabel>Resultados</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Lo que pasa cuando tu imagen dice lo correcto
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Reveal key={n} delay={n * 100}>
                <figure className="flex h-full flex-col justify-between rounded-sm border border-white/10 bg-[#0a0a0a] p-8">
                  {/* {{PENDIENTE: testimonios reales — nombre, resultado, captura/video}} */}
                  <blockquote className="leading-relaxed text-neutral-300">
                    <Pending>{`{{PENDIENTE: testimonio ${n} — texto o captura}}`}</Pending>
                  </blockquote>
                  <figcaption className="mt-6 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                    <Pending>{`{{PENDIENTE: nombre ${n}}}`}</Pending>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 8 · OFERTA ============ */}
      <section id="oferta" className="relative scroll-mt-10 overflow-hidden px-6 py-24 sm:py-36">
        <div className="cev-orb cev-orb-b left-1/2 top-0 -translate-x-1/2" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center md:text-left">
          <Reveal>
            <SectionLabel>La oferta</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              Manual {PRODUCTO}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-xl leading-relaxed text-neutral-400">
              El método completo — color, estampas, prendas y accesorios — en 36
              páginas que leés en una tarde y usás toda la vida. Un solo pago,
              descarga inmediata.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-3 md:items-start">
              <span className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                Valor total <span className="line-through">{VALOR_ANCLA}</span>
              </span>
              <span className="text-6xl font-bold tracking-tight sm:text-7xl">
                {PRECIO}
              </span>
              <span className="mt-5 text-xs uppercase tracking-[0.25em] text-neutral-600">
                Pago único · Sin suscripción
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

      {/* ============ 9 · GARANTÍA ============ */}
      <section className="px-6 pb-24 sm:pb-32">
        <Reveal className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center gap-6 rounded-sm border border-white/15 bg-white/[0.03] p-10 text-center sm:flex-row sm:text-left">
            <svg
              className="h-14 w-14 shrink-0 text-[#f5f4f2]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">
                Garantía total de <Pending>{GARANTIA_DIAS}</Pending>
              </h3>
              <p className="mt-3 leading-relaxed text-neutral-400">
                Leé el manual, aplicá la secuencia frente a tu placard y mirate
                con ojos nuevos. Si no sentís que cambió tu forma de vestirte, te
                devolvemos el 100%. El riesgo lo asumimos nosotros.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ 10 · FAQ ============ */}
      <section className="mx-auto max-w-3xl px-6 pb-24 sm:pb-32">
        <Reveal>
          <SectionLabel>Preguntas frecuentes</SectionLabel>
        </Reveal>
        <div className="divide-y divide-white/10 border-y border-white/10">
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
                    <span className="cev-faq-icon shrink-0 text-2xl font-light leading-none text-neutral-400" aria-hidden>
                      +
                    </span>
                  </button>
                  <div className="cev-faq-body" data-open={open}>
                    <div className="cev-faq-inner">
                      <p className="pt-4 leading-relaxed text-neutral-400">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ============ 11 · URGENCIA ============ */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-20 text-center sm:py-24">
        <Reveal className="mx-auto max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
            Por tiempo limitado
          </p>
          <p className="mt-5 text-2xl font-bold uppercase leading-snug tracking-tight sm:text-3xl">
            <Pending>{URGENCIA}</Pending>
          </p>
          <p className="mt-4 text-neutral-400">
            Cuando termina el lanzamiento, el precio sube y el bono desaparece.
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
            <h2 className="mt-8 text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
              No te vistas para
              <br />
              que te miren.
              <br />
              <span className="text-neutral-500">Vestite para que te lean.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-md text-neutral-400">
              Tu esencia ya existe. Empezá hoy a traducirla en imagen con{" "}
              <span className="text-[#f5f4f2]">{PRODUCTO}</span>.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10 flex flex-col items-center gap-5">
              <CtaButton pulse />
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                {PRECIO} · Garantía de <Pending>{GARANTIA_DIAS}</Pending>
              </p>
            </div>
          </Reveal>
          <Reveal delay={380}>
            <div className="mt-16 border-t border-white/10 pt-8">
              <img
                src={LOGO_MONOGRAM}
                alt=""
                aria-hidden
                className="mx-auto h-7 w-auto opacity-40"
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
        className={`cev-sticky-cta fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-[#070707]/90 px-5 py-4 backdrop-blur-md md:hidden ${showSticky ? "cev-visible" : ""}`}
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
