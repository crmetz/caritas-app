import { ArrowDownCircle, Ban, FileText, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/SessionProvider'
import APIService, { type PagedResponse } from '@/services/api'
import { CancelarModal } from './CancelarModal'
import { EntradaModal } from './EntradaModal'
import { SaidaModal } from './SaidaModal'
import {
  type CancelarModalRef,
  DESTINO_LABELS,
  type EntradaModalRef,
  type LancamentoCaixa,
  ORIGEM_LABELS,
  type SaidaModalRef,
} from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

const valorClassName = (l: LancamentoCaixa) => {
  if (l.cancelado) return 'line-through text-muted-foreground'
  return l.tipo === 'Entrada' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
}

export default function CaixaPage() {
  const entradaRef = useRef<EntradaModalRef>(null)
  const saidaRef = useRef<SaidaModalRef>(null)
  const cancelarRef = useRef<CancelarModalRef>(null)
  const { paroquiaAtual } = useSession()

  const [data, setData] = useState<LancamentoCaixa[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, totalCount: 0 })

  const load = useCallback(
    async (page: number) => {
      if (!paroquiaAtual) return
      setLoading(true)
      try {
        const result = await APIService.getRequest<PagedResponse<LancamentoCaixa>>({
          url: `/caixa/${paroquiaAtual.value}/lancamentos`,
          params: { page, pageSize: pagination.pageSize },
        })
        setData(result.items)
        setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }))
      } catch {
        toast.error('Erro ao carregar movimentações.')
      } finally {
        setLoading(false)
      }
    },
    [paroquiaAtual, pagination.pageSize],
  )

  useEffect(() => {
    load(1)
  }, [load])

  const totalEntradas = data
    .filter((l) => l.tipo === 'Entrada' && !l.cancelado)
    .reduce((s, l) => s + l.valor, 0)
  const totalSaidas = data
    .filter((l) => l.tipo === 'Saida' && !l.cancelado)
    .reduce((s, l) => s + l.valor, 0)
  const saldo = totalEntradas - totalSaidas

  const columns: Column<LancamentoCaixa>[] = [
    {
      key: 'data',
      header: 'Data',
      render: (l) => (
        <span className={l.cancelado ? 'line-through text-muted-foreground' : ''}>
          {fmtDate(l.data)}
        </span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (l) =>
        l.cancelado ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Cancelado
          </Badge>
        ) : (
          <Badge variant={l.tipo === 'Entrada' ? 'default' : 'destructive'} className="text-xs">
            {l.tipo === 'Entrada' ? '↑ Entrada' : '↓ Saída'}
          </Badge>
        ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (l) => (
        <span className={valorClassName(l)}>
          {fmtCurrency(l.valor)}
        </span>
      ),
    },
    {
      key: 'origem',
      header: 'Origem / Destino',
      render: (l) => {
        if (l.tipo === 'Entrada') return l.origem ? ORIGEM_LABELS[l.origem] : '—'
        return l.destino ? DESTINO_LABELS[l.destino] : '—'
      },
    },
    {
      key: 'familia',
      header: 'Família',
      render: (l) => l.familia?.nomeResponsavel ?? '—',
    },
    {
      key: 'responsavel',
      header: 'Responsável',
      render: (l) => (
        <div>
          <p>{l.responsavel}</p>
          {l.cancelado && l.motivoCancelamento && (
            <p className="text-xs text-muted-foreground">Motivo: {l.motivoCancelamento}</p>
          )}
        </div>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (l) => {
        if (l.cancelado || l.geradoAutomaticamente) {
          return (
            <span className="text-xs text-muted-foreground italic">
              {l.cancelado ? 'Cancelado' : 'Automático'}
            </span>
          )
        }
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => cancelarRef.current?.open(l)}
              title="Cancelar lançamento"
            >
              <Ban className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Caixa Paroquial</h1>
          <p className="text-sm text-muted-foreground">
            {paroquiaAtual?.label ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/caixa/relatorio">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
              Relatório
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => saidaRef.current?.open()}
            disabled={!paroquiaAtual}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Registrar Saída
          </Button>
          <Button onClick={() => entradaRef.current?.open()} disabled={!paroquiaAtual}>
            <Plus className="h-4 w-4" />
            Entrada Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Entradas</p>
          <p className="text-2xl font-semibold text-green-600">{fmtCurrency(totalEntradas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Saídas</p>
          <p className="text-2xl font-semibold text-red-600">{fmtCurrency(totalSaidas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo</p>
          <p className={`text-2xl font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmtCurrency(saldo)}
          </p>
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
          <EntradaModal
            ref={entradaRef}
            paroquiaId={paroquiaAtual.value}
            onSuccess={() => load(pagination.page)}
          />
          <SaidaModal
            ref={saidaRef}
            paroquiaId={paroquiaAtual.value}
            onSuccess={() => load(pagination.page)}
          />
        </>
      )}

      <CancelarModal ref={cancelarRef} onSuccess={() => load(pagination.page)} />
    </div>
  )
}
