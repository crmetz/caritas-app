import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import APIService from "@/services/api";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

const schema = yup.object({
	password: yup
		.string()
		.required("Senha é obrigatória")
		.min(8, "Mínimo 8 caracteres")
		.matches(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
		.matches(/[0-9]/, "Deve conter ao menos um número"),
	confirmPassword: yup
		.string()
		.required("Confirmação é obrigatória")
		.oneOf([yup.ref("password")], "As senhas não coincidem"),
});

type FormValues = yup.InferType<typeof schema>;

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const email = searchParams.get("email") ?? "";
	const token = searchParams.get("token") ?? "";

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({ resolver: yupResolver(schema) });

	async function onSubmit(values: FormValues) {
		try {
			await APIService.postRequest({
				url: "/auth/reset-password",
				body: { email, token, password: values.password },
			});
			toast.success("Senha definida com sucesso!");
			navigate("/login");
		} catch {
			toast.error("Link inválido ou expirado. Solicite um novo.");
		}
	}

	if (!email || !token) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-gray-500">Link inválido.</p>
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
					<h1 className="text-2xl font-bold text-gray-900 tracking-tight">
						Definir nova senha
					</h1>
					<p className="mt-1 text-sm text-gray-500">
						Escolha uma senha segura para sua conta
					</p>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-1.5">
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Nova senha
						</label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="••••••••"
								className="pr-11"
								{...register("password")}
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
						<p className="text-xs text-gray-500">
							A senha deve ter no mínimo 8 caracteres, incluindo ao menos uma
							letra maiúscula e um número.
						</p>
						{errors.password && (
							<p className="text-xs text-red-500">{errors.password.message}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700"
						>
							Confirmar senha
						</label>
						<div className="relative">
							<Input
								id="confirmPassword"
								type={showConfirm ? "text" : "password"}
								placeholder="••••••••"
								className="pr-11"
								{...register("confirmPassword")}
							/>
							<button
								type="button"
								onClick={() => setShowConfirm((v) => !v)}
								className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
								aria-label={showConfirm ? "Ocultar senha" : "Exibir senha"}
							>
								{showConfirm ? <EyeOff /> : <Eye />}
							</button>
						</div>
						{errors.confirmPassword && (
							<p className="text-xs text-red-500">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						className="w-full mt-2"
						disabled={isSubmitting}
						style={{ backgroundColor: "#e32427" }}
					>
						{isSubmitting ? "Salvando…" : "Definir senha"}
					</Button>
				</form>
			</div>
		</div>
	);
}
