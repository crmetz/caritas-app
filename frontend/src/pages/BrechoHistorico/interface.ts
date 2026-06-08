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
  itens: ItemVendaBrecho[]
  criadoEm: string
}

