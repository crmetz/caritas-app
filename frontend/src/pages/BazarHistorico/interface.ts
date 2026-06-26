export type FormaPagamento = 'Pix' | 'Dinheiro'

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  Pix: 'PIX',
  Dinheiro: 'Dinheiro',
}

export interface ItemVendaBazar {
  id: number
  pecaId: number
  pecaCategoria: string
  quantidade: number
  valorUnitario: number
  subtotal: number
}

export interface VendaBazar {
  id: number
  dataVenda: string
  compradorNome: string
  compradorCpf?: string
  compradorIdentificacaoAlternativa?: string
  formaPagamento: FormaPagamento
  valorTotal: number
  registradoPor: string
  cancelado: boolean
  canceladoEm?: string
  motivoCancelamento?: string
  canceladoPor?: string
  itens: ItemVendaBazar[]
  criadoEm: string
}

export interface CancelarVendaBazarDto {
  motivo: string
  canceladoPor: string
}

export interface CancelarVendaModalRef {
  open: (venda: VendaBazar) => void
}

export interface CancelarVendaModalProps {
  onSuccess: () => void
}
