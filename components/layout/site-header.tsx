"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => {
    return pathname === path
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm transition-colors duration-300 ease-in-out">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Use different logo based on theme */}
          {mounted && (
            <Image
              src={resolvedTheme === "dark" ? "/images/tc-management-logo-black.png" : "/images/tc-management-logo-black.png"}
              alt="TC Management"
              width={180}
              height={30}
              className="h-8 w-auto transition-opacity duration-300 ease-in-out"
              priority
            />
          )}
        </Link>

        {/* Desktop navigation with theme toggle integrated */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium uppercase transition-colors duration-300 ease-in-out ${
              isActive("/") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            href="/women"
            className={`text-sm font-medium uppercase transition-colors duration-300 ease-in-out ${
              isActive("/women") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Women
          </Link>
          <Link
            href="/men"
            className={`text-sm font-medium uppercase transition-colors duration-300 ease-in-out ${
              isActive("/men") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Men
          </Link>
          <Link
            href="/portfolio"
            className={`text-sm font-medium uppercase transition-colors duration-300 ease-in-out ${
              isActive("/portfolio") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Portfolio
          </Link>

          {/* Theme toggle integrated with navigation */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full ml-2 transition-colors duration-300 ease-in-out"
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
        </div>

        {/* Mobile menu button and theme toggle */}
        <div className="md:hidden flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full transition-colors duration-300 ease-in-out"
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="transition-colors duration-300 ease-in-out">
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
                  className="h-6 w-6"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="transition-colors duration-300 ease-in-out">
              <div className="flex flex-col gap-6 mt-6">
                <Link
                  href="/"
                  className={`text-lg font-medium uppercase transition-colors duration-300 ease-in-out ${
                    isActive("/") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/women"
                  className={`text-lg font-medium uppercase transition-colors duration-300 ease-in-out ${
                    isActive("/women") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Women
                </Link>
                <Link
                  href="/men"
                  className={`text-lg font-medium uppercase transition-colors duration-300 ease-in-out ${
                    isActive("/men") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Men
                </Link>
                <Link
                  href="/portfolio"
                  className={`text-lg font-medium uppercase transition-colors duration-300 ease-in-out ${
                    isActive("/portfolio") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Portfolio
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
