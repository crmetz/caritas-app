export type FormaPagamento = 'Pix' | 'Dinheiro'

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  Pix: 'PIX',
  Dinheiro: 'Dinheiro',
}

export interface ItemVendaBrecho {
  categoria: string
  quantidade: number
  valorUnitario: number
}

export interface VendaBrecho {
  id: number
  dataVenda: string
  compradorNome: string
  compradorCpf?: string
  compradorIdentificacaoAlternativa?: string
  formaPagamento: FormaPagamento
  valorTotal: number
  quantidadeItens: number
  registradoPor: string
  cancelado: boolean
  canceladoEm?: string
  motivoCancelamento?: string
  canceladoPor?: string
  itens: ItemVendaBrecho[]
  criadoEm: string
}

export interface CancelarVendaBrechoDto {
  motivo: string
  canceladoPor: string
}

export interface CancelarVendaModalRef {
  open: (venda: VendaBrecho) => void
}

export interface CancelarVendaModalProps {
  onSuccess: () => void
}

