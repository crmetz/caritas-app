export interface ParoquiaSelect {
  value: number
  label: string
}

export interface PecaBrecho {
  id: number
  categoria: string
  descricao?: string
  quantidade: number
  preco: number
  paroquiaId: number
  criadoEm: string
  atualizadoEm: string
}

export interface CreatePecaDto {
  categoria: string
  descricao?: string
  quantidade: number
  preco: number
  paroquiaId: number
}

export interface PecaModalRef {
  open: (peca?: PecaBrecho) => void
}

export interface PecaModalProps {
  paroquiaId: number
  onSuccess: () => void
}
