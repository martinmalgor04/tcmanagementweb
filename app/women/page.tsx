import type { Metadata } from "next"
import { FadeInSection } from "@/components/fade-in-section"
import { ModelCard } from "@/components/cards/model-card"
import { getModels } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/PageLayout"
import { getImageUrl } from "@/lib/api"

export const revalidate = 3600 // revalidate cada 1 hora

export const metadata: Metadata = {
  title: "Women Models | TC Management – Agencia de Modelos",
  description:
    "Descubre nuestras modelos femeninas en TC Management. Talento profesional para tus producciones y campañas.",
  openGraph: {
    title: "Women Models | TC Management",
    description:
      "Descubre nuestras modelos femeninas en TC Management. Talento profesional para tus producciones y campañas.",
    images: [{ url: "/images/og-women.jpg" }],
  },
}

export default async function WomenPage() {
  // Fetch women models usando la función optimizada
  const womenModels = await getModels("Women")

  return (
    <PageLayout 
      title="WOMEN" 
      contactFormTitle="¿BUSCAS UNA MODELO?"
      contactFormSubtitle="Contactanos para discutir tus necesidades específicas."
    >
      <FadeInSection>
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
            {womenModels && womenModels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
                {womenModels.map((model: any) => (
                  <ModelCard
                    key={model._id}
                    id={model._id}
                    name={model.name}
                    division={model.gender}
                    imageSrc={getImageUrl(model.profileImage)}
                    slug={model.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No models available at the moment.</p>
              </div>
            )}

            {womenModels && womenModels.length > 0 && (
              <div className="mt-16 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </Button>
                  <Button variant="outline" className="bg-black text-white hover:bg-black/90">
                    1
                  </Button>
                  <Button variant="outline" size="icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </FadeInSection>
    </PageLayout>
  )
}
