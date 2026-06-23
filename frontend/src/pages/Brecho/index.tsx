import { ClipboardList, Lock, ShoppingCart, Unlock } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/SessionProvider'
import APIService, { type PagedResponse } from '@/services/api'
import { AbrirCaixaModal } from './AbrirCaixaModal'
import { FecharCaixaModal } from './FecharCaixaModal'
import type {
  AbrirCaixaModalRef,
  FecharCaixaModalRef,
  PecaBrecho,
  SessaoCaixaBrecho,
} from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const columns: Column<PecaBrecho>[] = [
  { key: 'categoria', header: 'Categoria' },
  { key: 'descricao', header: 'Descrição', render: (p) => p.descricao ?? '—' },
  {
    key: 'quantidade',
    header: 'Quantidade',
    render: (p) => (
      <span className={p.quantidade === 0 ? 'text-destructive font-medium' : ''}>
        {p.quantidade}
      </span>
    ),
  },
  { key: 'preco', header: 'Preço', render: (p) => fmtCurrency(p.preco) },
]

export default function BrechoPage() {
  const navigate = useNavigate()
  const { paroquiaAtual } = useSession()
  const abrirRef = useRef<AbrirCaixaModalRef>(null)
  const fecharRef = useRef<FecharCaixaModalRef>(null)

  const [data, setData] = useState<PecaBrecho[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0 })
  const [sessao, setSessao] = useState<SessaoCaixaBrecho | null | undefined>(undefined)

  const loadSessao = useCallback(async () => {
    if (!paroquiaAtual) return
    try {
      const result = await APIService.getRequest<SessaoCaixaBrecho | null>({
        url: '/brecho/caixa/sessao-atual',
        params: { paroquiaId: paroquiaAtual.value },
      })
      setSessao(result)
    } catch {
      setSessao(null)
    }
  }, [paroquiaAtual])

  const load = useCallback(
    async (page: number) => {
      if (!paroquiaAtual) return
      setLoading(true)
      try {
        const result = await APIService.getRequest<PagedResponse<PecaBrecho>>({
          url: '/brecho/pecas',
          params: { page, pageSize: pagination.pageSize, paroquiaId: paroquiaAtual.value },
        })
        setData(result.items)
        setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }))
      } catch {
        toast.error('Erro ao carregar estoque.')
      } finally {
        setLoading(false)
      }
    },
    [paroquiaAtual, pagination.pageSize],
  )

  useEffect(() => {
    loadSessao()
    load(1)
  }, [loadSessao, load])

  const caixaAberto = sessao?.aberto === true
  const caixaCarregado = sessao !== undefined

  return (
    <div className="space-y-4">
      {caixaCarregado && (
        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
            caixaAberto
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
              : 'border-destructive/30 bg-destructive/5'
          }`}
        >
          <div className="flex items-center gap-3">
            {caixaAberto ? (
              <Unlock className="h-4 w-4 text-green-600" />
            ) : (
              <Lock className="h-4 w-4 text-destructive" />
            )}
            <div>
              {caixaAberto && sessao ? (
                <>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Caixa aberto às {fmtHora(sessao.abertoEm)} por {sessao.abertoPor}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-destructive">
                  Caixa fechado — registros bloqueados
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {caixaAberto && sessao ? (
              <>
                <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400">
                  Aberto
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => fecharRef.current?.open(sessao)}
                >
                  Fechar Caixa
                </Button>
              </>
            ) : (
              <>
                <Badge variant="destructive" className="text-xs">
                  Fechado
                </Badge>
                <Button
                  size="sm"
                  onClick={() => abrirRef.current?.open()}
                  disabled={!paroquiaAtual}
                >
                  Abrir Caixa
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brechó — Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Peças disponíveis para {paroquiaAtual?.label ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/brecho/historico')}
          >
            <ClipboardList className="h-4 w-4" />
            Histórico
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => navigate('/brecho/nova-venda')}
            disabled={!paroquiaAtual || !caixaAberto}
            title={!caixaAberto ? 'Abra o caixa para registrar vendas' : undefined}
          >
            <ShoppingCart className="h-4 w-4" />
            Registrar Venda
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={{ ...pagination, onPageChange: (page) => load(page) }}
        isLoading={loading}
      />

      {!!paroquiaAtual && (
        <>
          <AbrirCaixaModal
            ref={abrirRef}
            paroquiaId={paroquiaAtual.value}
            onSuccess={(s) => setSessao(s)}
          />
          <FecharCaixaModal ref={fecharRef} onSuccess={() => setSessao(null)} />
        </>
      )}
    </div>
  )
}
