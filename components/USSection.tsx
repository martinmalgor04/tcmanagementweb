import { memo } from 'react'
import { PortableText } from "@/components/portable-text"
import { ImageLoader } from "@/components/ui/ImageLoader"

// Interfaces para los tipos de datos
interface TeamMember {
  name: string
  role: string
  bioES: any
  bioEN: any
  photo: any
}

interface USSectionProps {
  sectionTitle: string
  teamMembers: TeamMember[]
}

function USSectionComponent({ sectionTitle, teamMembers }: USSectionProps) {
  return (
    <section className="py-24 md:py-40 bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Título de la sección */}
        <h2 className="text-5xl font-bold tracking-tight md:text-6xl uppercase text-center mb-24">
          {sectionTitle || "THE ESSENCE OF TC"}
        </h2>
        
        {/* Lista vertical de miembros del equipo */}
        <div className="space-y-32">
          {teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
                {/* Imagen del miembro - Siempre a la izquierda */}
                <div className="w-full md:w-1/3">
                  <ImageLoader
                    image={member.photo}
                    alt={member.name}
                    priority={index === 0}
                    className="aspect-square"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                
                {/* Información del miembro - Siempre a la derecha */}
                <div className="w-full md:w-2/3">
                  <h3 className="text-3xl font-bold mb-2">{member.name}</h3>
                  <p className="text-xl text-muted-foreground mb-6">{member.role}</p>
                  
                  {/* Bio en español */}
                  {member.bioES && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">español</p>
                      <div className="prose max-w-none">
                        <PortableText value={member.bioES} language="es" />
                      </div>
                    </div>
                  )}
                  
                  {/* Bio en inglés */}
                  {member.bioEN && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">english</p>
                      <div className="prose text-sm italic text-muted-foreground">
                        <PortableText value={member.bioEN} language="en" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No team members available.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Wrap component with memo to prevent unnecessary re-renders
export const USSection = memo(USSectionComponent) 