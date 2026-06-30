// Fonte única de parsing, normalização e validação de quantidades do sistema.
// Importado por todos os módulos (estoque, doações, cestas, entregas) — nunca duplicar esta lógica
// em telas. O componente <QuantityInput/> consome estas funções; telas que só precisam da lógica
// (ex.: validação no submit) também importam daqui.

// Como um gênero/item é medido.
export type FormaMedida = "Peso" | "Volume" | "Unidade";

// Unidades válidas para digitar/exibir o tamanho do pacote, por forma de medida.
export const UNIDADES_POR_FORMA: Record<FormaMedida, string[]> = {
	Peso: ["g", "kg", "t"],
	Volume: ["ml", "L"],
	Unidade: ["un"],
};

// Placeholder sugerido por forma de medida (modo "medida").
export const PLACEHOLDER_POR_FORMA: Record<FormaMedida, string> = {
	Peso: "Ex.: 1 kg, 500 g",
	Volume: "Ex.: 1 L, 250 ml",
	Unidade: "Ex.: 12 un",
};

// Unidade-base de cada forma (o que o back-end persiste). Usada para registrar saída de um lote
// cujo tamanho já está em base, sem reconverter.
export function baseUnidade(forma: FormaMedida): string {
	return forma === "Peso" ? "g" : forma === "Volume" ? "ml" : "un";
}

export interface Medida {
	valor: number;
	unidade: string;
}

// Interpreta entrada livre ("1kg", "500 g", "1L", "250ml", "12un") em { valor, unidade }, validando
// a unidade contra a forma do alimento. NÃO converte para base (o back-end faz isso via valor+unidade).
// Retorna null quando incompatível → o chamador limpa o campo.
export function parseMedida(texto: string, forma: FormaMedida): Medida | null {
	const m = texto
		.trim()
		.toLowerCase()
		.replace(",", ".")
		.match(/^([0-9]*\.?[0-9]+)\s*([a-zµ]+)$/);
	if (!m) return null;
	const valor = Number(m[1]);
	if (!(valor > 0)) return null;
	const canonical = UNIDADES_POR_FORMA[forma].find(
		(u) => u.toLowerCase() === m[2],
	);
	return canonical ? { valor, unidade: canonical } : null;
}

// Forma canônica de exibição de uma medida ("1,5 kg"). Decimal em pt-BR.
export function formatMedida(m: Medida): string {
	return `${String(m.valor).replace(".", ",")} ${m.unidade}`;
}

// Sugestões de autocomplete enquanto o usuário digita (estilo campo de horas do ClickUp): combina o
// número já digitado com cada unidade válida da forma. Sem número ainda → mostra os formatos aceitos.
export function sugestoesMedida(texto: string, forma: FormaMedida): string[] {
	const t = texto.trim().toLowerCase().replace(",", ".");
	const num = t.match(/^([0-9]*\.?[0-9]+)/);
	// Fragmento da unidade já digitada (letras após o número, ex.: "1k" → "k").
	const unidadeDigitada = t.replace(/^[0-9]*\.?[0-9]*\s*/, "");
	// "t" (tonelada) só é sugerida quando o usuário começa a digitar "t" — evita registrar
	// valores massivos por engano. Não altera regra de negócio: parseMedida continua aceitando "t".
	const unidades = UNIDADES_POR_FORMA[forma].filter(
		(u) => u.toLowerCase() !== "t" || unidadeDigitada.startsWith("t"),
	);
	if (!num) return unidades.map((u) => `1 ${u}`);
	const n = num[1].replace(".", ",");
	return unidades.map((u) => `${n} ${u}`);
}

// Valida/normaliza um contador inteiro positivo (nº de pacotes, nº de cestas, qtd a dar baixa).
// Retorna null para entradas inválidas → o chamador limpa o campo.
export function parseCount(
	texto: string,
	opts: { min?: number; max?: number } = {},
): number | null {
	const t = texto.trim();
	if (!/^[0-9]+$/.test(t)) return null;
	const n = Number(t);
	if (!Number.isInteger(n)) return null;
	const min = opts.min ?? 1;
	if (n < min) return null;
	if (opts.max != null && n > opts.max) return opts.max;
	return n;
}
