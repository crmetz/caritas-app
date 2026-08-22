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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import APIService from "@/services/api";
import type {
	FecharCaixaModalProps,
	FecharCaixaModalRef,
	SessaoCaixaBrecho,
} from "./interface";

const fmtDateTime = (iso: string) =>
	new Date(iso).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export const FecharCaixaModal = forwardRef<
	FecharCaixaModalRef,
	FecharCaixaModalProps
>(({ onSuccess }, ref) => {
	const { session } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [sessao, setSessao] = useState<SessaoCaixaBrecho | null>(null);
	const [saldoFinalContado, setSaldoFinalContado] = useState(0);
	const [observacoes, setObservacoes] = useState("");

	useImperativeHandle(ref, () => ({
		open: (s) => {
			setSessao(s);
			setSaldoFinalContado(0);
			setObservacoes("");
			setIsOpen(true);
		},
	}));

	const handleFechar = async () => {
		if (!sessao || !session) return;
		setLoading(true);
		try {
			await APIService.postRequest({
				url: `/brecho/caixa/${sessao.id}/fechar`,
				body: {
					saldoFinalContado,
					observacoes: observacoes || undefined,
					fechadoPor: `${session.nome} ${session.sobrenome}`.trim(),
				},
			});
			toast.success("Caixa fechado com sucesso.");
			setIsOpen(false);
			onSuccess();
		} catch {
			toast.error("Erro ao fechar o caixa.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Fechar Caixa</DialogTitle>
				</DialogHeader>

				{sessao && (
					<div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
						<p>
							<span className="text-muted-foreground">Aberto em:</span>{" "}
							<span className="font-medium">
								{fmtDateTime(sessao.abertoEm)}
							</span>
						</p>
						<p>
							<span className="text-muted-foreground">Aberto por:</span>{" "}
							<span className="font-medium">{sessao.abertoPor}</span>
						</p>
					</div>
				)}

				<div className="space-y-4">
					<div className="space-y-1">
						<Label>Valor contado em caixa (R$) *</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={saldoFinalContado || ""}
							placeholder="0,00"
							onChange={(e) =>
								setSaldoFinalContado(Number.parseFloat(e.target.value) || 0)
							}
						/>
						<p className="text-xs text-muted-foreground">
							Some o dinheiro físico em caixa agora.
						</p>
					</div>
					<div className="space-y-1">
						<Label>Observações</Label>
						<Textarea
							rows={2}
							placeholder="Ocorrências, divergências..."
							value={observacoes}
							onChange={(e) => setObservacoes(e.target.value)}
						/>
					</div>
					<div className="flex justify-end gap-3 pt-2">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleFechar}
							disabled={loading}
						>
							{loading ? "Fechando..." : "Fechar Caixa"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
});
