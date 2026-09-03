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

export function ContactForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    brand: "",
    name: "",
    role: "",
    email: "",
    phone: "",
    phoneIso: "AR",
    category: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phone = parsePhone(formData.phone, formData.phoneIso)
    if (
      !formData.brand.trim() ||
      !formData.name.trim() ||
      !formData.role.trim() ||
      !formData.email.trim() ||
      !formData.category ||
      !formData.message.trim()
    ) {
      toast({
        title: "Revisá los datos",
        description: "Completá todos los campos.",
        variant: "destructive",
      })
      return
    }

    if (!looksLikeEmail(formData.email)) {
      toast({
        title: "Revisá los datos",
        description: "Eso no tiene forma de mail. Ej. hola@marca.com.",
        variant: "destructive",
      })
      return
    }

    if (!phone.ok) {
      toast({
        title: "Revisá los datos",
        description: phone.error,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Send to Formspree
      const response = await fetch("https://formspree.io/f/mgvapdae", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: formData.brand.trim(),
          name: formData.name.trim(),
          role: formData.role.trim(),
          email: formData.email.trim(),
          phone: `+${phone.e164}`,
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
        // Reset form
        setFormData({
          brand: "",
          name: "",
          role: "",
          email: "",
          phone: "",
          phoneIso: "AR",
          category: "",
          message: "",
        })
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
          id="phone"
          name="phone"
          isoName="phone_iso"
          required
          variant="site"
          purpose="phone"
          onChange={(e164, iso) => setFormData((prev) => ({ ...prev, phone: e164, phoneIso: iso }))}
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
      <Button type="submit" className="w-full transition-colors duration-300 ease-in-out" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  )
}
