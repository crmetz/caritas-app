export type FormaPagamento = 'Pix' | 'Dinheiro'

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  Pix: 'PIX',
  Dinheiro: 'Dinheiro',
}

export interface PecaOpcao {
  id: number
  categoria: string
  descricao?: string
  quantidade: number
  preco: number
}

export interface ItemVenda {
  pecaId: number
  quantidade: number
  valorUnitario: number
}

export interface CompradorDto {
  nome: string
  cpf: string
  identificacaoAlternativa: string
}

export interface CreateVendaDto {
  paroquiaId: number
  itens: ItemVenda[]
  comprador: CompradorDto
  formaPagamento: FormaPagamento
  registradoPor: string
}
