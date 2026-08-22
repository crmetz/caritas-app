import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import APIService from "@/services/api";
import type {
	AbrirCaixaModalProps,
	AbrirCaixaModalRef,
	SessaoCaixaBrecho,
} from "./interface";

export const AbrirCaixaModal = forwardRef<
	AbrirCaixaModalRef,
	AbrirCaixaModalProps
>(({ paroquiaId, onSuccess }, ref) => {
	const { session } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	useImperativeHandle(ref, () => ({
		open: () => setIsOpen(true),
	}));

	const handleConfirmar = async () => {
		if (!session) return;
		setLoading(true);
		try {
			const sessao = await APIService.postRequest<SessaoCaixaBrecho>({
				url: "/brecho/caixa/abrir",
				body: {
					paroquiaId,
					abertoPor: `${session.nome} ${session.sobrenome}`.trim(),
				},
			});
			toast.success("Caixa aberto com sucesso.");
			setIsOpen(false);
			onSuccess(sessao);
		} catch {
			toast.error("Erro ao abrir o caixa.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Abrir Caixa</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Confirme para abrir o caixa e liberar o registro de vendas.
				</p>
				<div className="flex justify-end gap-3 pt-2">
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleConfirmar} disabled={loading}>
						{loading ? "Abrindo..." : "Abrir Caixa"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});
