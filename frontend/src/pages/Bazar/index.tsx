import { FileText, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable/interface'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/SessionProvider'
import { Permissions } from '@/constants/permissions'
import APIService, { type PagedResponse } from '@/services/api'
import type { PecaBazar } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const columns: Column<PecaBazar>[] = [
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

export default function BazarPage() {
  const navigate = useNavigate()
  const { hasPermission } = useSession()
  const canRegistrarVenda = hasPermission(Permissions.Bazar.RegistrarVenda)
  const canRelatorio = hasPermission(Permissions.Bazar.Relatorio)

  const [data, setData] = useState<PecaBazar[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0 })

  const load = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const result = await APIService.getRequest<PagedResponse<PecaBazar>>({
          url: '/bazar/pecas',
          params: { page, pageSize: pagination.pageSize },
        })
        setData(result.items)
        setPagination((prev) => ({ ...prev, page, totalCount: result.totalCount }))
      } catch {
        toast.error('Erro ao carregar estoque.')
      } finally {
        setLoading(false)
      }
    },
    [pagination.pageSize],
  )

  useEffect(() => {
    load(1)
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bazar — Estoque</h1>
          <p className="text-sm text-muted-foreground">Peças disponíveis para venda</p>
        </div>
        <div className="flex items-center gap-2">
          {canRelatorio && (
            <Link to="/bazar/relatorio">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" />
                Relatório
              </Button>
            </Link>
          )}
          {canRegistrarVenda && (
            <Button className="bg-destructive hover:bg-destructive/90 text-white" onClick={() => navigate('/bazar/nova-venda')}>
              <ShoppingCart className="h-4 w-4" />
              Registrar Venda
            </Button>
          )}
        </div>
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
