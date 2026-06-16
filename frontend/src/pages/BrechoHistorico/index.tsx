import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ArrowLeft, FileDown, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/SessionProvider'
import APIService, { type PagedResponse } from '@/services/api'
import type { VendaBrecho } from './interface'
import { FORMA_PAGAMENTO_LABELS } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function BrechoHistoricoPage() {
  const { paroquiaAtual } = useSession()
  const [data, setData] = useState<VendaBrecho[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, totalCount: 0 })

  const load = useCallback(
    async (page: number) => {
      if (!paroquiaAtual) return
      setLoading(true)
      try {
        const result = await APIService.getRequest<PagedResponse<VendaBrecho>>({
          url: '/brecho/vendas',
          params: { paroquiaId: paroquiaAtual.value, page, pageSize: pagination.pageSize },
        })
        setData(result.items)
        setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }))
      } catch {
        toast.error('Erro ao carregar histórico de vendas.')
      } finally {
        setLoading(false)
      }
    },
    [paroquiaAtual, pagination.pageSize],
  )

  useEffect(() => {
    load(1)
  }, [load])

  const baixarPdf = async () => {
    if (!paroquiaAtual || pagination.totalCount === 0) return
    try {
      const result = await APIService.getRequest<PagedResponse<VendaBrecho>>({
        url: '/brecho/vendas',
        params: { paroquiaId: paroquiaAtual.value, page: 1, pageSize: pagination.totalCount },
      })

      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Brechó — Histórico de Vendas', 14, 18)
      doc.setFontSize(10)
      doc.text(paroquiaAtual.label, 14, 25)

      autoTable(doc, {
        startY: 33,
        head: [['Data/Hora', 'Comprador', 'Peças', 'Pagamento', 'Total']],
        body: result.items.map((v) => [
          fmtDateTime(v.dataVenda),
          v.compradorNome,
          v.itens.map((item) => `${item.categoria} x${item.quantidade}`).join(', '),
          FORMA_PAGAMENTO_LABELS[v.formaPagamento],
          fmtCurrency(v.valorTotal),
        ]),
      })

      doc.save(`historico-brecho-${paroquiaAtual.label}.pdf`)
    } catch {
      toast.error('Erro ao gerar PDF.')
    }
  }

  const handleDelete = async (venda: VendaBrecho) => {
    if (
      !confirm(
        `Excluir venda de ${venda.compradorNome} (${fmtCurrency(venda.valorTotal)})?\n\nAs peças serão devolvidas ao estoque e o lançamento no Caixa será removido.`,
      )
    )
      return
    try {
      await APIService.deleteRequest({ url: `/brecho/vendas/${venda.id}` })
      toast.success('Venda excluída e estoque restaurado.')
      load(pagination.page)
    } catch {
      toast.error('Erro ao excluir venda.')
    }
  }

  const columns: Column<VendaBrecho>[] = [
    {
      key: 'dataVenda',
      header: 'Data / Hora',
      render: (v) => (
        <span className="text-sm tabular-nums">{fmtDateTime(v.dataVenda)}</span>
      ),
    },
    {
      key: 'compradorNome',
      header: 'Comprador',
      render: (v) => (
        <div>
          <p className="font-medium">{v.compradorNome}</p>
          {v.compradorCpf && (
            <p className="text-xs text-muted-foreground">{v.compradorCpf}</p>
          )}
          {v.compradorIdentificacaoAlternativa && (
            <p className="text-xs text-muted-foreground">
              ID: {v.compradorIdentificacaoAlternativa}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'itens',
      header: 'Peças',
      render: (v) => (
        <div className="space-y-0.5">
          {v.itens.map((item, i) => (
            <p key={i} className="text-sm">
              {item.categoria} × {item.quantidade}{' '}
              <span className="text-muted-foreground">
                ({fmtCurrency(item.valorUnitario)})
              </span>
            </p>
          ))}
        </div>
      ),
    },
    {
      key: 'formaPagamento',
      header: 'Pagamento',
      render: (v) => (
        <Badge variant={v.formaPagamento === 'Pix' ? 'default' : 'secondary'}>
          {FORMA_PAGAMENTO_LABELS[v.formaPagamento]}
        </Badge>
      ),
    },
    {
      key: 'valorTotal',
      header: 'Total',
      render: (v) => (
        <span className="font-semibold text-green-600">{fmtCurrency(v.valorTotal)}</span>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (v) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleDelete(v)}
            title="Excluir venda e restaurar estoque"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/brecho">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Brechó — Histórico de Vendas</h1>
            <p className="text-sm text-muted-foreground">
              {paroquiaAtual?.label ?? '—'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={baixarPdf}
          disabled={!paroquiaAtual || pagination.totalCount === 0}
        >
          <FileDown className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={{ ...pagination, onPageChange: (page) => load(page) }}
        isLoading={loading}
      />
    </div>
  )
}
