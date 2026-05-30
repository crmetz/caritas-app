import logo from "@/assets/logo.png"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type ChangeEvent, type FormEvent, useState } from "react"
import { Eye, EyeOff } from 'lucide-react';

type AuthView = "login" // | "forgot-password"
 
interface LoginFormState {
  email: string
  password: string
}
 
export default function LoginPage() {
  const [_view, _setView] = useState<AuthView>("login")
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
 
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }
 
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Login attempt", form)
    } finally {
      setIsLoading(false)
    }
  }
 
  // function handleForgotPassword() { _setView("forgot-password") }
 
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
 
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
 
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Entrar na sua conta
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Insira suas credenciais para acessar o sistema
            </p>
          </div>
 
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
 
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                {/* 
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#e32427] hover:underline focus:outline-none"
                >
                  Esqueceu a senha?
                </button>
                */}
              </div>
               <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}
                </button>
              </div>
            </div>
 
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isLoading}
              style={{ backgroundColor: "#e32427" }}
            >
              {isLoading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
    </div>
  )
}