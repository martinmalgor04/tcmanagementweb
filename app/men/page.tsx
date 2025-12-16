import type { Metadata } from "next"
import { FadeInSection } from "@/components/fade-in-section"
import { ModelCard } from "@/components/cards/model-card"
import { getModelsPaginated, getImageUrl } from "@/lib/api"
import { PageLayout } from "@/components/layout/PageLayout"
import { Pagination } from "@/components/pagination"

export const revalidate = 60 // revalidate cada 1 minuto (backup si el webhook falla)

export const metadata: Metadata = {
  title: "Men Models | TC Management – Agencia de Modelos",
  description:
    "Descubre nuestros modelos masculinos en TC Management. Talento profesional para tus producciones y campañas.",
  openGraph: {
    title: "Men Models | TC Management",
    description:
      "Descubre nuestros modelos masculinos en TC Management. Talento profesional para tus producciones y campañas.",
    images: [{ url: "/images/og-men.jpg" }],
  },
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function MenPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || "1", 10))
  
  // Fetch men models con paginación
  const { models: menModels, pagination } = await getModelsPaginated("Men", currentPage)

  return (
    <PageLayout 
      title="MEN" 
      contactFormTitle="¿BUSCAS UN MODELO?"
      contactFormSubtitle="Contactanos para discutir tus necesidades específicas."
    >
      <FadeInSection>
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
            {menModels && menModels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
                {menModels.map((model: any, index: number) => (
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
                  basePath="/men"
                />
              </div>
            )}
          </div>
        </section>
      </FadeInSection>
    </PageLayout>
  )
}
