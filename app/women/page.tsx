import type { Metadata } from "next"
import { FadeInSection } from "@/components/fade-in-section"
import { ModelCard } from "@/components/cards/model-card"
import { getModelsPaginated, getImageUrl } from "@/lib/api"
import { PageLayout } from "@/components/layout/PageLayout"
import { Pagination } from "@/components/pagination"

export const revalidate = 60 // revalidate cada 1 minuto (backup si el webhook falla)

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

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function WomenPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || "1", 10))
  
  // Fetch women models con paginación
  const { models: womenModels, pagination } = await getModelsPaginated("Women", currentPage)

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
                {womenModels.map((model: any, index: number) => (
                  <ModelCard
                    key={model._id}
                    id={model._id}
                    name={model.name}
                    division={model.gender}
                    imageSrc={getImageUrl(model.profileImage)}
                    slug={model.slug}
                    priority={index < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No models available at the moment.</p>
              </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="mt-16">
                <Pagination 
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  basePath="/women"
                />
              </div>
            )}
          </div>
        </section>
      </FadeInSection>
    </PageLayout>
  )
}
