"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneInput } from "@/components/phone-input"
import { looksLikeEmail } from "@/lib/customer-fields"
import { parsePhone } from "@/lib/phone"

type ContactFields = Partial<Record<"brand" | "name" | "role" | "email" | "phone" | "category" | "message", string>>

const emptyForm = {
  brand: "",
  name: "",
  role: "",
  email: "",
  phone: "",
  phoneIso: "AR",
  category: "",
  message: "",
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} className="text-sm text-red-500">
      {error}
    </p>
  )
}

interface ContactFormProps {
  formId?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function ContactForm({ 
  formId = "mgvapdae", 
  title = "CONTACTANOS", 
  subtitle = "", 
  compact = true 
}: ContactFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [fields, setFields] = useState<ContactFields>({})
  const [phoneKey, setPhoneKey] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFields((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
    setFields((prev) => ({ ...prev, category: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const next: ContactFields = {}
    if (!formData.brand.trim()) next.brand = "Falta el nombre de la marca."
    if (!formData.name.trim()) next.name = "Falta tu nombre."
    else if (!/\p{L}/u.test(formData.name)) next.name = "El nombre tiene que tener letras."
    if (!formData.role.trim()) next.role = "Falta el rol."
    if (!formData.email.trim()) next.email = "Falta el mail."
    else if (!looksLikeEmail(formData.email)) next.email = "Eso no tiene forma de mail. Ej. hola@marca.com."
    const phone = parsePhone(formData.phone, formData.phoneIso)
    if (!phone.ok) next.phone = phone.error
    if (!formData.category) next.category = "Elegí una categoría."
    if (!formData.message.trim()) next.message = "Falta la consulta."

    if (Object.keys(next).length > 0) {
      setFields(next)
      toast({
        title: "Revisá los datos",
        description: Object.values(next)[0],
        variant: "destructive",
      })
      return
    }

    setFields({})
    setIsSubmitting(true)

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: formData.brand.trim(),
          name: formData.name.trim(),
          role: formData.role.trim(),
          email: formData.email.trim(),
          phone: phone.ok ? `+${phone.e164}` : formData.phone,
          category: formData.category,
          message: formData.message.trim(),
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: "¡Éxito!",
          description: "Mensaje enviado correctamente. Te contactaremos pronto.",
        })
        setFormData(emptyForm)
        setPhoneKey((k) => k + 1)
      } else {
        throw new Error("Failed to submit form")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu mensaje. Por favor, intentá nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors duration-300 ease-in-out">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300 ease-in-out">
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
            className="h-8 w-8 text-green-600 dark:text-green-400 transition-colors duration-300 ease-in-out"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">¡Mensaje Enviado!</h3>
        <p className="text-muted-foreground mb-6">Mensaje enviado correctamente. Te contactaremos pronto.</p>
        <Button onClick={() => setIsSuccess(false)}>Enviar otro mensaje</Button>
      </div>
    )
  }

  return (
    <div className="py-10">
      {title && (
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl uppercase text-center mb-6">
          {title}
        </h2>
      )}
      {subtitle && <p className="text-center text-muted-foreground mb-8">{subtitle}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto" noValidate>
        {compact ? (
          <>
            {/* Diseño compacto con grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="brand">Marca consultante</Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="Nombre de la marca"
                  value={formData.brand}
                  onChange={handleChange}
                  aria-invalid={Boolean(fields.brand)}
                  required
                />
                <FieldError id="brand-error" error={fields.brand} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Tu nombre" 
                  value={formData.name} 
                  onChange={handleChange}
                  aria-invalid={Boolean(fields.name)}
                  required 
                />
                <FieldError id="name-error" error={fields.name} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Rol en la marca</Label>
                <Input
                  id="role"
                  name="role"
                  placeholder="Tu posición o rol"
                  value={formData.role}
                  onChange={handleChange}
                  aria-invalid={Boolean(fields.role)}
                  required
                />
                <FieldError id="role-error" error={fields.role} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(fields.email)}
                  required
                />
                <FieldError id="email-error" error={fields.email} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Teléfono</Label>
                <PhoneInput
                  key={phoneKey}
                  id="phone"
                  name="phone"
                  isoName="phone_iso"
                  required
                  variant="site"
                  purpose="phone"
                  error={fields.phone}
                  onChange={(e164, iso) => {
                    setFormData((prev) => ({ ...prev, phone: e164, phoneIso: iso }))
                    setFields((prev) => ({ ...prev, phone: undefined }))
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={handleSelectChange} required>
                  <SelectTrigger id="category" aria-invalid={Boolean(fields.category)}>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGC">UGC</SelectItem>
                    <SelectItem value="DESFILE">DESFILE</SelectItem>
                    <SelectItem value="PRODUCCIÓN">PRODUCCIÓN</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError id="category-error" error={fields.category} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="message">Consulta</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Detalla tu consulta"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                aria-invalid={Boolean(fields.message)}
                required
              />
              <FieldError id="message-error" error={fields.message} />
            </div>
          </>
        ) : (
          <>
            {/* Diseño original en columna */}
            <div className="space-y-2">
              <Label htmlFor="brand">Marca consultante</Label>
              <Input
                id="brand"
                name="brand"
                placeholder="Nombre de la marca"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del que pregunta</Label>
              <Input id="name" name="name" placeholder="Tu nombre" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol en la marca</Label>
              <Input
                id="role"
                name="role"
                placeholder="Tu posición o rol"
                value={formData.role}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <PhoneInput
                key={phoneKey}
                id="phone"
                name="phone"
                isoName="phone_iso"
                required
                variant="site"
                purpose="phone"
                error={fields.phone}
                onChange={(e164, iso) => {
                  setFormData((prev) => ({ ...prev, phone: e164, phoneIso: iso }))
                  setFields((prev) => ({ ...prev, phone: undefined }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={handleSelectChange} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGC">UGC</SelectItem>
                  <SelectItem value="DESFILE">DESFILE</SelectItem>
                  <SelectItem value="PRODUCCIÓN">PRODUCCIÓN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Consulta</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Detalla tu consulta"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}
        <Button type="submit" className="w-full transition-colors duration-300 ease-in-out" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </form>
    </div>
  )
} 