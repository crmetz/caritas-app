import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PackageMinus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import APIService, { type PagedResponse } from "../../services/api";
import { formatDateBR } from "../EstoqueAlimentos/interface";
import { statusLote, type LoteCesta } from "./interface";
import { BaixaCestaModal } from "./BaixaCestaModal";

interface Props {
	refreshSignal: number;
}

export function ControleTab({ refreshSignal }: Props) {
	const [lotes, setLotes] = useState<LoteCesta[]>([]);
	const [loading, setLoading] = useState(false);
	const [baixaLote, setBaixaLote] = useState<LoteCesta | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		try {
			const data = await APIService.getRequest<PagedResponse<LoteCesta>>({
				url: "/lotes-cesta",
				params: { page: 1, pageSize: 100 },
			});
			setLotes(data.items);
		} catch {
			toast.error("Erro ao carregar o controle de cestas.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetch();
	}, [fetch, refreshSignal]);

	const totalDisponivel = lotes.reduce((s, l) => s + l.quantidadeDisponivel, 0);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">{totalDisponivel}</span>{" "}
					cesta(s) disponível(is) no total.
				</p>
				<p className="text-xs text-muted-foreground">
					Cestas recebidas são registradas em <strong>Doações</strong>.
				</p>
			</div>

			<div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
				{loading ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Carregando...
					</div>
				) : lotes.length === 0 ? (
					<div className="px-4 py-16 text-center text-sm text-muted-foreground">
						Nenhuma cesta registrada.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Origem</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Quantidade</TableHead>
								<TableHead className="text-right">Saldo</TableHead>
								<TableHead>Validade mais próxima</TableHead>
								<TableHead>Data</TableHead>
								<TableHead className="pr-4 text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{lotes.map((l) => {
								const status = statusLote(l);
								return (
									<TableRow key={l.id}>
										<TableCell className="pl-4">
											<Badge variant="outline">
												{l.origem === "Montagem" ? "Montada" : "Recebida"}
											</Badge>
										</TableCell>
										<TableCell className="text-foreground">
											{l.origem === "Montagem"
												? (l.nomeConfiguracao ?? "Cesta montada")
												: `Doador: ${l.nomeDoador ?? "—"}`}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={`font-normal ${status.className}`}
											>
												{status.label}
											</Badge>
										</TableCell>
										<TableCell className="text-right tabular-nums text-foreground">
											{l.quantidade}
										</TableCell>
										<TableCell className="text-right tabular-nums text-foreground">
											{l.quantidadeDisponivel}
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{l.validadeMaisProxima
												? formatDateBR(l.validadeMaisProxima.slice(0, 10))
												: "—"}
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{formatDateBR(l.criadoEm.slice(0, 10))}
										</TableCell>
										<TableCell className="pr-4 text-right">
											<Button
												variant="ghost"
												size="sm"
												disabled={l.quantidadeDisponivel <= 0}
												onClick={() => setBaixaLote(l)}
											>
												<PackageMinus className="mr-1.5 h-4 w-4" />
												Baixa
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>

			<BaixaCestaModal
				lote={baixaLote}
				onOpenChange={(open) => !open && setBaixaLote(null)}
				onSuccess={fetch}
			/>
		</div>
	);
}
