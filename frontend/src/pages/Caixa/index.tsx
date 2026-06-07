import { ArrowDownCircle, FileText, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import APIService, { type PagedResponse } from '@/services/api'
import { EntradaModal } from './EntradaModal'
import { SaidaModal } from './SaidaModal'
import {
  DESTINO_LABELS,
  type EntradaModalRef,
  type LancamentoCaixa,
  ORIGEM_LABELS,
  type ParoquiaSelect,
  type SaidaModalRef,
} from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

export default function CaixaPage() {
  const entradaRef = useRef<EntradaModalRef>(null)
  const saidaRef = useRef<SaidaModalRef>(null)

  const [paroquias, setParoquias] = useState<ParoquiaSelect[]>([])
  const [paroquiaId, setParoquiaId] = useState<number | null>(null)
  const [data, setData] = useState<LancamentoCaixa[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, totalCount: 0 })

  useEffect(() => {
    APIService.getRequest<ParoquiaSelect[]>({ url: '/paroquias/select' })
      .then((list) => {
        setParoquias(list)
        if (list.length > 0) setParoquiaId(list[0].value)
      })
      .catch(() => toast.error('Erro ao carregar paróquias.'))
  }, [])

  const load = useCallback(
    async (page: number) => {
      if (!paroquiaId) return
      setLoading(true)
      try {
        const result = await APIService.getRequest<PagedResponse<LancamentoCaixa>>({
          url: `/caixa/${paroquiaId}/lancamentos`,
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
    [paroquiaId, pagination.pageSize],
  )

  useEffect(() => {
    if (paroquiaId) load(1)
  }, [paroquiaId, load])

  const handleDelete = async (lancamento: LancamentoCaixa) => {
    if (!confirm('Remover este lançamento?')) return
    try {
      await APIService.deleteRequest({ url: `/caixa/lancamentos/${lancamento.id}` })
      toast.success('Lançamento removido.')
      load(pagination.page)
    } catch {
      toast.error('Erro ao remover lançamento.')
    }
  }

  const totalEntradas = data
    .filter((l) => l.tipo === 'Entrada')
    .reduce((s, l) => s + l.valor, 0)
  const totalSaidas = data
    .filter((l) => l.tipo === 'Saida')
    .reduce((s, l) => s + l.valor, 0)
  const saldo = totalEntradas - totalSaidas

  const columns: Column<LancamentoCaixa>[] = [
    {
      key: 'data',
      header: 'Data',
      render: (l) => fmtDate(l.data),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (l) => (
        <Badge
          variant={l.tipo === 'Entrada' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {l.tipo === 'Entrada' ? '↑ Entrada' : '↓ Saída'}
        </Badge>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (l) => (
        <span
          className={
            l.tipo === 'Entrada' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
          }
        >
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
      render: (l) => l.responsavel,
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (l) =>
        l.geradoAutomaticamente ? (
          <span className="text-xs text-muted-foreground italic">Automático</span>
        ) : (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDelete(l)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Caixa Paroquial</h1>
          <p className="text-sm text-muted-foreground">Movimentações financeiras da paróquia</p>
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
            disabled={!paroquiaId}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Registrar Saída
          </Button>
          <Button onClick={() => entradaRef.current?.open()} disabled={!paroquiaId}>
            <Plus className="h-4 w-4" />
            Entrada Manual
          </Button>
        </div>
      </div>

      <Select
        value={paroquiaId?.toString() ?? ''}
        onValueChange={(v) => setParoquiaId(Number(v))}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecionar paróquia..." />
        </SelectTrigger>
        <SelectContent>
          {paroquias.map((p) => (
            <SelectItem key={p.value} value={p.value.toString()}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
          <p
            className={`text-2xl font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
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

      {!!paroquiaId && (
        <>
          <EntradaModal
            ref={entradaRef}
            paroquiaId={paroquiaId}
            onSuccess={() => load(pagination.page)}
          />
          <SaidaModal
            ref={saidaRef}
            paroquiaId={paroquiaId}
            onSuccess={() => load(pagination.page)}
          />
        </>
      )}
    </div>
  )
}
