import { ReactNode } from 'react'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'
import { ContactForm } from '@/components/ContactForm'
import { FadeInSection } from '@/components/fade-in-section'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showContactForm?: boolean
  contactFormTitle?: string
  contactFormSubtitle?: string
  contactFormBackground?: boolean
}

export function PageLayout({
  children,
  title,
  showContactForm = true,
  contactFormTitle,
  contactFormSubtitle,
  contactFormBackground = true,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {title && (
          <section className="py-12 bg-background text-foreground text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl uppercase">{title}</h1>
          </section>
        )}
        
        {children}
        
        {showContactForm && (
          <FadeInSection>
            <section className={contactFormBackground ? "py-10 bg-neutral-100 dark:bg-neutral-900" : "py-10"}>
              <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                <ContactForm 
                  title={contactFormTitle}
                  subtitle={contactFormSubtitle}
                />
              </div>
            </section>
          </FadeInSection>
        )}
      </main>
      <SiteFooter />
    </div>
  )
} 