export type TipoLancamento = 'Entrada' | 'Saida'
export type OrigemEntrada = 'VendaBrecho' | 'ChaBenefico' | 'Doacao' | 'Outro'
export type DestinoSaida = 'CestaBasica' | 'Gas' | 'Medicamento' | 'Fralda' | 'Outro'

export const ORIGEM_LABELS: Record<OrigemEntrada, string> = {
  VendaBrecho: 'Venda do Brechó',
  ChaBenefico: 'Chá Beneficente',
  Doacao: 'Doação',
  Outro: 'Outro',
}

export const DESTINO_LABELS: Record<DestinoSaida, string> = {
  CestaBasica: 'Cesta Básica',
  Gas: 'Gás',
  Medicamento: 'Medicamento',
  Fralda: 'Fralda',
  Outro: 'Outro',
}

export interface FamiliaResumo {
  id: number
  nomeResponsavel: string
}

export interface LancamentoCaixa {
  id: number
  data: string
  tipo: TipoLancamento
  valor: number
  origem?: OrigemEntrada
  destino?: DestinoSaida
  familia?: FamiliaResumo
  familiaId?: number
  responsavel: string
  geradoAutomaticamente: boolean
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
}

export interface CreateEntradaDto {
  paroquiaId: number
  data: string
  valor: number
  origem: OrigemEntrada
  responsavel: string
  observacoes?: string
}

export interface CreateSaidaDto {
  paroquiaId: number
  data: string
  valor: number
  destino: DestinoSaida
  familiaId?: number
  responsavel: string
  observacoes?: string
}

export interface EntradaModalRef {
  open: () => void
}

export interface EntradaModalProps {
  paroquiaId: number
  onSuccess: () => void
}

export interface SaidaModalRef {
  open: () => void
}

export interface SaidaModalProps {
  paroquiaId: number
  onSuccess: () => void
}
