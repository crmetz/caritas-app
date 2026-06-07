import { Plus, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import APIService, { type PagedResponse } from '@/services/api'
import { PecaModal } from './modal'
import type { ParoquiaSelect, PecaBrecho, PecaModalRef } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
  const modalRef = useRef<PecaModalRef>(null)

  const [paroquias, setParoquias] = useState<ParoquiaSelect[]>([])
  const [paroquiaId, setParoquiaId] = useState<number | null>(null)
  const [data, setData] = useState<PecaBrecho[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0 })

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
        const result = await APIService.getRequest<PagedResponse<PecaBrecho>>({
          url: '/brecho/pecas',
          params: { page, pageSize: pagination.pageSize, paroquiaId },
        })
        setData(result.items)
        setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }))
      } catch {
        toast.error('Erro ao carregar estoque.')
      } finally {
        setLoading(false)
      }
    },
    [paroquiaId, pagination.pageSize],
  )

  useEffect(() => {
    if (paroquiaId) load(1)
  }, [paroquiaId, load])

  const handleDelete = async (peca: PecaBrecho) => {
    if (!confirm(`Remover "${peca.categoria}" do estoque?`)) return
    try {
      await APIService.deleteRequest({ url: `/brecho/pecas/${peca.id}` })
      toast.success('Peça removida.')
      load(pagination.page)
    } catch {
      toast.error('Erro ao remover peça.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brechó — Estoque</h1>
          <p className="text-sm text-muted-foreground">Peças disponíveis por paróquia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/brecho/nova-venda', { state: { paroquiaId } })}
            disabled={!paroquiaId}
          >
            <ShoppingCart className="h-4 w-4" />
            Registrar Venda
          </Button>
          <Button onClick={() => modalRef.current?.open()} disabled={!paroquiaId}>
            <Plus className="h-4 w-4" />
            Nova Peça
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

      <DataTable
        columns={columns}
        data={data}
        pagination={{ ...pagination, onPageChange: (page) => load(page) }}
        isLoading={loading}
        onEdit={(p) => modalRef.current?.open(p)}
        onDelete={handleDelete}
      />

      {!!paroquiaId && (
        <PecaModal
          ref={modalRef}
          paroquiaId={paroquiaId}
          onSuccess={() => load(pagination.page)}
        />
      )}
    </div>
  )
}
