export interface SessaoCaixaBrecho {
  id: number
  paroquiaId: number
  abertoPor: string
  fechadoPor?: string
  abertoEm: string
  fechadoEm?: string
  saldoInicial: number
  saldoFinalContado?: number
  saldoFinalCalculado?: number
  diferenca?: number
  observacoes?: string
  aberto: boolean
}

export interface AbrirCaixaModalRef {
  open: () => void
}

export interface AbrirCaixaModalProps {
  paroquiaId: number
  onSuccess: (sessao: SessaoCaixaBrecho) => void
}

export interface FecharCaixaModalRef {
  open: (sessao: SessaoCaixaBrecho) => void
}

export interface FecharCaixaModalProps {
  onSuccess: () => void
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
