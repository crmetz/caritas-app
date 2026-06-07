import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/SessionProvider";
import APIService from "@/services/api";
import { Eye, EyeOff } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type AuthView = "login" | "forgot-password";

interface LoginFormState {
	email: string;
	password: string;
}

export default function LoginPage() {
	const [view, setView] = useState<AuthView>("login");
	const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
	const [forgotEmail, setForgotEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [forgotSent, setForgotSent] = useState(false);
	const navigate = useNavigate();
	const { refreshSession } = useSession();

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}

	async function handleLogin(e: FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		try {
			const data = await APIService.postRequest<{ token: string }>({ url: "/auth/login", body: form });
			localStorage.setItem("token", data.token);
			await refreshSession();
			navigate("/");
		} catch {
			toast.error("E-mail ou senha incorretos.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleForgotPassword(e: FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		try {
			await APIService.postRequest({ url: "/auth/forgot-password", body: forgotEmail });
		} catch {
			// don't reveal whether the email exists
		} finally {
			setIsLoading(false);
			setForgotSent(true);
		}
	}

	if (view === "forgot-password") {
		return (
			<div className="min-h-screen w-full flex items-center justify-center bg-white px-6 py-12">
				<div className="w-full max-w-sm">
					<div className="flex justify-center mb-6">
						<img src={logo} alt="Logo" className="h-16 w-16 object-contain" />
					</div>

					{forgotSent ? (
						<div className="text-center">
							<h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">Verifique seu e-mail</h1>
							<p className="text-sm text-gray-500 mb-6">
								Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
							</p>
							<button
								type="button"
								onClick={() => {
									setView("login");
									setForgotSent(false);
								}}
								className="text-sm font-medium text-[#e32427] hover:underline"
							>
								Voltar ao login
							</button>
						</div>
					) : (
						<>
							<div className="mb-8 text-center">
								<h1 className="text-2xl font-bold text-gray-900 tracking-tight">Esqueceu a senha?</h1>
								<p className="mt-1 text-sm text-gray-500">Informe seu e-mail e enviaremos um link de recuperação</p>
							</div>

							<form onSubmit={handleForgotPassword} className="space-y-4">
								<div className="space-y-1.5">
									<label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700">
										E-mail
									</label>
									<Input
										id="forgotEmail"
										name="forgotEmail"
										type="email"
										placeholder="seu@email.com"
										value={forgotEmail}
										onChange={(e) => setForgotEmail(e.target.value)}
										required
									/>
								</div>

								<Button type="submit" className="w-full mt-2" disabled={isLoading} style={{ backgroundColor: "#e32427" }}>
									{isLoading ? "Enviando…" : "Enviar link"}
								</Button>

								<button
									type="button"
									onClick={() => setView("login")}
									className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 text-center mt-2"
								>
									Voltar ao login
								</button>
							</form>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-white px-6 py-12">
			<div className="w-full max-w-sm">
				<div className="flex justify-center mb-6">
					<img src={logo} alt="Logo" className="h-16 w-16 object-contain" />
				</div>

				<div className="mb-8 text-center">
					<h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entrar na sua conta</h1>
					<p className="mt-1 text-sm text-gray-500">Insira suas credenciais para acessar o sistema</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-4">
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
							required
						/>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								Senha
							</label>
							<button
								type="button"
								onClick={() => setView("forgot-password")}
								className="text-xs font-medium text-[#e32427] hover:underline focus:outline-none"
							>
								Esqueceu a senha?
							</button>
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
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
								aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
							>
								{showPassword ? <EyeOff /> : <Eye />}
							</button>
						</div>
					</div>

					<Button type="submit" className="w-full mt-2" disabled={isLoading} style={{ backgroundColor: "#e32427" }}>
						{isLoading ? "Entrando…" : "Entrar"}
					</Button>
				</form>
			</div>
		</div>
	);
}
