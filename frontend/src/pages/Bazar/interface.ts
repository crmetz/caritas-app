export interface PecaBazar {
  id: number
  categoria: string
  descricao?: string
  quantidade: number
  preco: number
  criadoEm: string
  atualizadoEm: string
}

export interface CreatePecaDto {
  categoria: string
  descricao?: string
  quantidade: number
  preco: number
}

export interface PecaModalRef {
  open: (peca?: PecaBazar) => void
}

export interface PecaModalProps {
  onSuccess: () => void
}
