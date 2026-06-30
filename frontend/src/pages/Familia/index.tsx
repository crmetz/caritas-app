import { LineChart, Pencil, Plus, Save, Users, X } from "lucide-react";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable/interface";
import { useSession } from "@/components/SessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCpf } from "@/lib/utils";
import APIService, {
	getErrorMessage,
	type PagedResponse,
} from "@/services/api";
import {
	ESCOLARIDADE_LABELS,
	type Escolaridade,
	type Familia,
	type FamiliaModalRef,
	type Pessoa,
	type PessoaCreateDto,
	SITUACAO_MORADIA_LABELS,
	TIPO_DOCUMENTO_LABELS,
	type TipoDocumentoAlternativo,
	vulnerabilidadeToLabels,
} from "./interface";
import { FamiliaModal } from "./modal";

interface SelectOption {
	value: number;
	label: string;
}

type ModoIdentificacao = "cpf" | "nomeMae" | "documento";

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function getIdentificacao(pessoa: Pessoa) {
	if (pessoa.cpf) return pessoa.cpf;
	if (pessoa.nomeMae) return `Mãe: ${pessoa.nomeMae}`;
	if (pessoa.tipoDocumentoAlternativo && pessoa.identificacaoAlternativa) {
		return `${TIPO_DOCUMENTO_LABELS[pessoa.tipoDocumentoAlternativo]}: ${pessoa.identificacaoAlternativa}`;
	}
	return "Sem identificação";
}

function getMembrosFamilia(familia: Familia) {
	const pessoas = [
		...(familia.responsavel
			? [{ pessoa: familia.responsavel, papel: "Responsável" }]
			: []),
		...familia.membros
			.filter((pessoa) => pessoa.id !== familia.responsavelId)
			.map((pessoa) => ({ pessoa, papel: "Membro" })),
	];

	return pessoas.filter(
		(item, index, all) =>
			all.findIndex(({ pessoa }) => pessoa.id === item.pessoa.id) === index,
	);
}

function detectarModoIdentificacao(
	pessoa: Pessoa | PessoaCreateDto,
): ModoIdentificacao {
	if (pessoa.tipoDocumentoAlternativo) return "documento";
	if (pessoa.nomeMae) return "nomeMae";
	return "cpf";
}

function pessoaToForm(pessoa: Pessoa): PessoaCreateDto {
	return {
		nome: pessoa.nome,
		cpf: pessoa.cpf ?? undefined,
		nomeMae: pessoa.nomeMae ?? undefined,
		tipoDocumentoAlternativo: pessoa.tipoDocumentoAlternativo ?? undefined,
		identificacaoAlternativa: pessoa.identificacaoAlternativa ?? undefined,
		dataNascimento: pessoa.dataNascimento.slice(0, 10),
		telefone: pessoa.telefone ?? undefined,
		escolaridade: pessoa.escolaridade ?? undefined,
		profissao: pessoa.profissao ?? undefined,
		possuiDeficiencia: pessoa.possuiDeficiencia,
		observacoes: pessoa.observacoes ?? undefined,
	};
}

function getPessoaResumo(pessoa: Pessoa) {
	return [
		pessoa.telefone,
		pessoa.profissao,
		pessoa.escolaridade ? ESCOLARIDADE_LABELS[pessoa.escolaridade] : null,
	]
		.filter(Boolean)
		.join(" · ");
}

interface MembroFormProps {
	value: PessoaCreateDto;
	onChange: (value: PessoaCreateDto) => void;
	onCancel: () => void;
	onSubmit: (event: FormEvent) => void;
	isSaving: boolean;
}

function MembroForm({
	value,
	onChange,
	onCancel,
	onSubmit,
	isSaving,
}: MembroFormProps) {
	const [modo, setModo] = useState<ModoIdentificacao>(() =>
		detectarModoIdentificacao(value),
	);

	const set = <K extends keyof PessoaCreateDto>(
		field: K,
		fieldValue: PessoaCreateDto[K],
	) => onChange({ ...value, [field]: fieldValue });

	const handleModoChange = (novoModo: ModoIdentificacao) => {
		setModo(novoModo);
		onChange({
			...value,
			cpf: undefined,
			nomeMae: undefined,
			tipoDocumentoAlternativo: undefined,
			identificacaoAlternativa: undefined,
		});
	};

	return (
		<form onSubmit={onSubmit} className="space-y-4 rounded-md border p-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="col-span-2 space-y-1">
					<Label>Nome *</Label>
					<Input
						required
						value={value.nome}
						onChange={(event) => set("nome", event.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Data de Nascimento *</Label>
					<Input
						type="date"
						required
						value={value.dataNascimento}
						onChange={(event) => set("dataNascimento", event.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Tipo de Identificação</Label>
					<Select
						value={modo}
						onValueChange={(selected) =>
							handleModoChange(selected as ModoIdentificacao)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="cpf">CPF</SelectItem>
							<SelectItem value="nomeMae">Nome da Mãe</SelectItem>
							<SelectItem value="documento">Documento</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{modo === "cpf" && (
					<div className="col-span-2 space-y-1">
						<Label>CPF</Label>
						<Input
							placeholder="000.000.000-00"
							value={value.cpf ?? ""}
							onChange={(event) => set("cpf", formatCpf(event.target.value))}
						/>
					</div>
				)}

				{modo === "nomeMae" && (
					<div className="col-span-2 space-y-1">
						<Label>Nome da Mãe *</Label>
						<Input
							required
							value={value.nomeMae ?? ""}
							onChange={(event) => set("nomeMae", event.target.value)}
						/>
					</div>
				)}

				{modo === "documento" && (
					<>
						<div className="space-y-1">
							<Label>Tipo de Documento *</Label>
							<Select
								value={value.tipoDocumentoAlternativo ?? ""}
								onValueChange={(selected) =>
									set(
										"tipoDocumentoAlternativo",
										selected as TipoDocumentoAlternativo,
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(TIPO_DOCUMENTO_LABELS).map(([key, label]) => (
										<SelectItem key={key} value={key}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Número do Documento *</Label>
							<Input
								required
								value={value.identificacaoAlternativa ?? ""}
								onChange={(event) =>
									set("identificacaoAlternativa", event.target.value)
								}
							/>
						</div>
					</>
				)}

				<div className="space-y-1">
					<Label>Telefone</Label>
					<Input
						value={value.telefone ?? ""}
						onChange={(event) => set("telefone", event.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>Escolaridade</Label>
					<Select
						value={value.escolaridade ?? ""}
						onValueChange={(selected) =>
							set("escolaridade", selected as Escolaridade)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecione" />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(ESCOLARIDADE_LABELS).map(([key, label]) => (
								<SelectItem key={key} value={key}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label>Profissão</Label>
					<Input
						value={value.profissao ?? ""}
						onChange={(event) => set("profissao", event.target.value)}
					/>
				</div>

				<div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
					<Label>Possui deficiência</Label>
					<button
						type="button"
						role="switch"
						aria-checked={value.possuiDeficiencia}
						onClick={() => set("possuiDeficiencia", !value.possuiDeficiencia)}
						className={`relative h-6 w-11 rounded-full transition-colors ${
							value.possuiDeficiencia ? "bg-primary" : "bg-muted"
						}`}
					>
						<span
							className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-background shadow transition-transform ${
								value.possuiDeficiencia ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				</div>

				<div className="col-span-2 space-y-1">
					<Label>Observações</Label>
					<Textarea
						rows={3}
						value={value.observacoes ?? ""}
						onChange={(event) => set("observacoes", event.target.value)}
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					<X className="h-4 w-4" />
					Cancelar
				</Button>
				<Button type="submit" size="sm" disabled={isSaving}>
					<Save className="h-4 w-4" />
					{isSaving ? "Salvando..." : "Salvar"}
				</Button>
			</div>
		</form>
	);
}

export default function FamiliaPage() {
	const modalRef = useRef<FamiliaModalRef>(null);
	const navigate = useNavigate();
	const { paroquiaAtual, session } = useSession();

	// O usuário só pode editar/excluir famílias das paróquias às quais tem acesso.
	// Demais famílias ficam apenas para visualização.
	const paroquiasPermitidasIds = useMemo(
		() => new Set(session?.paroquiasPermitidas.map((p) => p.value) ?? []),
		[session],
	);
	const podeGerenciarFamilia = useCallback(
		(familia: Familia) =>
			(session?.isAdmin ?? false) ||
			paroquiasPermitidasIds.has(familia.paroquiaId),
		[session, paroquiasPermitidasIds],
	);
	const [data, setData] = useState<Familia[]>([]);
	const [loading, setLoading] = useState(false);
	const [paroquias, setParoquias] = useState<SelectOption[]>([]);
	const [cidades, setCidades] = useState<SelectOption[]>([]);
	const [paroquiaFiltro, setParoquiaFiltro] = useState<string>("all");
	const [responsavelFiltro, setResponsavelFiltro] = useState("");
	const [situacaoFiltro, setSituacaoFiltro] = useState<string>("all");
	const [cidadeFiltro, setCidadeFiltro] = useState<string>("all");
	const [bairroFiltro, setBairroFiltro] = useState("");
	const [familiaMembros, setFamiliaMembros] = useState<Familia | null>(null);
	const [loadingMembros, setLoadingMembros] = useState(false);
	const [editingPessoaId, setEditingPessoaId] = useState<number | null>(null);
	const [editingPessoa, setEditingPessoa] = useState<PessoaCreateDto | null>(
		null,
	);
	const [savingPessoa, setSavingPessoa] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalCount: 0,
	});

	const refreshFamiliaMembros = async (familiaId: number) => {
		const familiaAtualizada = await APIService.getRequest<Familia>({
			url: `/familias/${familiaId}`,
		});
		setFamiliaMembros(familiaAtualizada);
		return familiaAtualizada;
	};

	const handleOpenMembros = async (familia: Familia) => {
		setLoadingMembros(true);
		setEditingPessoaId(null);
		setEditingPessoa(null);
		try {
			await refreshFamiliaMembros(familia.id);
		} catch {
			toast.error("Erro ao carregar membros da família.");
		} finally {
			setLoadingMembros(false);
		}
	};

	const handleStartEditPessoa = (pessoa: Pessoa) => {
		setEditingPessoaId(pessoa.id);
		setEditingPessoa(pessoaToForm(pessoa));
	};

	const handleSavePessoa = async (event: FormEvent) => {
		event.preventDefault();
		if (!familiaMembros || !editingPessoaId || !editingPessoa) return;

		setSavingPessoa(true);
		try {
			await APIService.putRequest({
				url: `/familias/${familiaMembros.id}/membros/${editingPessoaId}`,
				body: editingPessoa,
			});
			await refreshFamiliaMembros(familiaMembros.id);
			await load(pagination.page);
			setEditingPessoaId(null);
			setEditingPessoa(null);
			toast.success("Membro atualizado.");
		} catch (e) {
			toast.error(getErrorMessage(e, "Erro ao atualizar membro."));
		} finally {
			setSavingPessoa(false);
		}
	};

	const columns: Column<Familia>[] = [
		{
			key: "responsavel",
			header: "Responsável",
			render: (f) => f.responsavel?.nome ?? "—",
		},
		{
			key: "paroquiaNome",
			header: "Paróquia",
			render: (f) => f.paroquiaNome,
		},
		{
			key: "membros",
			header: "Membros",
			render: (f) => (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
					disabled={loadingMembros}
					onClick={() => handleOpenMembros(f)}
					title="Ver membros"
				>
					<Users className="h-4 w-4" />
					{getMembrosFamilia(f).length}
				</Button>
			),
		},
		{
			key: "situacaoMoradia",
			header: "Moradia",
			render: (f) => SITUACAO_MORADIA_LABELS[f.situacaoMoradia],
		},
		{
			key: "rendaFamiliar",
			header: "Renda Familiar",
			render: (f) =>
				f.rendaFamiliar.toLocaleString("pt-BR", {
					style: "currency",
					currency: "BRL",
				}),
		},
		{
			key: "vulnerabilidade",
			header: "Vulnerabilidades",
			render: (f) => {
				const labels = vulnerabilidadeToLabels(f.vulnerabilidade);
				if (labels.length === 0)
					return <span className="text-muted-foreground text-xs">Nenhuma</span>;
				return (
					<div className="flex flex-wrap gap-1">
						{labels.length <= 2 ? (
							labels.map((label) => (
								<Badge key={label} variant="secondary" className="text-xs">
									{label}
								</Badge>
							))
						) : (
							<>
								<Badge variant="secondary" className="text-xs">
									{labels[0]}
								</Badge>
								<Badge variant="outline" className="text-xs">
									+{labels.length - 1}
								</Badge>
							</>
						)}
					</div>
				);
			},
		},
		{
			key: "cidade",
			header: "Cidade",
			render: (f) => f.cidadeNome,
		},
		{
			key: "criadoEm",
			header: "Data de Registro",
			render: (f) => formatDate(f.criadoEm),
		},
		{
			key: "evolucao",
			header: "Evolução",
			render: (f) => (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
					onClick={() => navigate(`/familias/${f.id}/evolucao`)}
					title="Ver evolução"
				>
					<LineChart className="h-4 w-4" />
				</Button>
			),
		},
	];

	useEffect(() => {
		APIService.getRequest<SelectOption[]>({ url: "/paroquias/select" })
			.then(setParoquias)
			.catch(() => {});
		APIService.getRequest<SelectOption[]>({ url: "/familiacidades/select" })
			.then(setCidades)
			.catch(() => {});
	}, []);

	// Por padrão, aplica o filtro da paróquia logada (mas o usuário pode trocar).
	useEffect(() => {
		if (paroquiaAtual) setParoquiaFiltro(String(paroquiaAtual.value));
	}, [paroquiaAtual]);

	const limparFiltros = () => {
		setResponsavelFiltro("");
		setSituacaoFiltro("all");
		setCidadeFiltro("all");
		setBairroFiltro("");
		setParoquiaFiltro(paroquiaAtual ? String(paroquiaAtual.value) : "all");
	};

	const load = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const params: Record<string, unknown> = {
					page,
					pageSize: pagination.pageSize,
				};
				if (paroquiaFiltro !== "all")
					params.paroquiaId = Number(paroquiaFiltro);
				if (situacaoFiltro !== "all") params.situacaoMoradia = situacaoFiltro;
				if (cidadeFiltro !== "all") params.cidadeId = Number(cidadeFiltro);
				if (responsavelFiltro.trim())
					params.responsavelNome = responsavelFiltro.trim();
				if (bairroFiltro.trim()) params.bairro = bairroFiltro.trim();

				const result = await APIService.getRequest<PagedResponse<Familia>>({
					url: "/familias",
					params,
				});
				setData(result.items);
				setPagination((prev) => ({
					...prev,
					page,
					totalCount: result.totalCount,
				}));
			} catch {
				toast.error("Erro ao carregar famílias.");
			} finally {
				setLoading(false);
			}
		},
		[
			pagination.pageSize,
			paroquiaFiltro,
			situacaoFiltro,
			cidadeFiltro,
			responsavelFiltro,
			bairroFiltro,
		],
	);

	useEffect(() => {
		const timer = setTimeout(() => load(1), 400);
		return () => clearTimeout(timer);
	}, [load]);

	const handleDelete = async (familia: Familia) => {
		if (!confirm(`Remover a família de ${familia.responsavel?.nome ?? "—"}?`))
			return;
		try {
			await APIService.deleteRequest({ url: `/familias/${familia.id}` });
			toast.success("Família removida.");
			load(pagination.page);
		} catch {
			toast.error("Erro ao remover família.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold">Famílias</h1>
					<p className="text-sm text-muted-foreground">
						Gestão de famílias cadastradas
					</p>
				</div>
				<Button onClick={() => modalRef.current?.open()}>
					<Plus className="h-4 w-4" />
					Nova Família
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Input
					className="w-56"
					placeholder="Buscar por responsável"
					value={responsavelFiltro}
					onChange={(e) => setResponsavelFiltro(e.target.value)}
				/>

				<Select value={paroquiaFiltro} onValueChange={setParoquiaFiltro}>
					<SelectTrigger className="w-56">
						<SelectValue placeholder="Filtrar por paróquia" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as paróquias</SelectItem>
						{paroquias.map((p) => (
							<SelectItem key={p.value} value={String(p.value)}>
								{p.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={situacaoFiltro} onValueChange={setSituacaoFiltro}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Situação de moradia" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as moradias</SelectItem>
						{Object.entries(SITUACAO_MORADIA_LABELS).map(([k, v]) => (
							<SelectItem key={k} value={k}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={cidadeFiltro} onValueChange={setCidadeFiltro}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Cidade" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as cidades</SelectItem>
						{cidades.map((c) => (
							<SelectItem key={c.value} value={String(c.value)}>
								{c.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Input
					className="w-48"
					placeholder="Bairro"
					value={bairroFiltro}
					onChange={(e) => setBairroFiltro(e.target.value)}
				/>

				<Button variant="outline" onClick={limparFiltros}>
					<X className="h-4 w-4" />
					Limpar filtros
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data}
				pagination={{
					...pagination,
					onPageChange: (page) => load(page),
				}}
				isLoading={loading}
				onEdit={(f) => modalRef.current?.open(f)}
				onView={(f) => modalRef.current?.openView(f)}
				onDelete={handleDelete}
				canEdit={podeGerenciarFamilia}
				canDelete={podeGerenciarFamilia}
			/>

			<FamiliaModal ref={modalRef} onSuccess={() => load(pagination.page)} />

			<Dialog
				open={familiaMembros !== null}
				onOpenChange={(open) => {
					if (!open) {
						setFamiliaMembros(null);
						setEditingPessoaId(null);
						setEditingPessoa(null);
					}
				}}
			>
				<DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Membros da Família</DialogTitle>
					</DialogHeader>

					{familiaMembros && (
						<div className="space-y-3">
							{getMembrosFamilia(familiaMembros).map(({ pessoa, papel }) => {
								if (editingPessoaId === pessoa.id && editingPessoa) {
									return (
										<MembroForm
											key={pessoa.id}
											value={editingPessoa}
											onChange={setEditingPessoa}
											onCancel={() => {
												setEditingPessoaId(null);
												setEditingPessoa(null);
											}}
											onSubmit={handleSavePessoa}
											isSaving={savingPessoa}
										/>
									);
								}

								return (
									<div
										key={pessoa.id}
										className="space-y-3 rounded-md border px-4 py-3"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<p className="truncate text-sm font-medium">
														{pessoa.nome}
													</p>
													<Badge
														variant={
															papel === "Responsável" ? "default" : "secondary"
														}
													>
														{papel}
													</Badge>
													{pessoa.possuiDeficiencia && (
														<Badge variant="outline">Possui deficiência</Badge>
													)}
												</div>
												<p className="mt-1 text-xs text-muted-foreground">
													{getPessoaResumo(pessoa) ||
														"Sem dados complementares"}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												title="Editar membro"
												onClick={() => handleStartEditPessoa(pessoa)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
										</div>

										<div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
											<div>
												<p className="font-medium text-muted-foreground">
													Nascimento
												</p>
												<p>{formatDate(pessoa.dataNascimento)}</p>
											</div>
											<div>
												<p className="font-medium text-muted-foreground">
													Identificação
												</p>
												<p>{getIdentificacao(pessoa)}</p>
											</div>
											<div>
												<p className="font-medium text-muted-foreground">
													Telefone
												</p>
												<p>{pessoa.telefone ?? "Não informado"}</p>
											</div>
											<div>
												<p className="font-medium text-muted-foreground">
													Escolaridade
												</p>
												<p>
													{pessoa.escolaridade
														? ESCOLARIDADE_LABELS[pessoa.escolaridade]
														: "Não informada"}
												</p>
											</div>
											<div>
												<p className="font-medium text-muted-foreground">
													Profissão
												</p>
												<p>{pessoa.profissao ?? "Não informada"}</p>
											</div>
											<div>
												<p className="font-medium text-muted-foreground">
													Deficiência
												</p>
												<p>{pessoa.possuiDeficiencia ? "Sim" : "Não"}</p>
											</div>
										</div>

										<div className="text-xs">
											<p className="font-medium text-muted-foreground">
												Observações
											</p>
											<p>{pessoa.observacoes ?? "Sem observações"}</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
