import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import APIService from '@/services/api'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const today = () => new Date().toISOString().slice(0, 10)

const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

interface RelatorioBazar {
  totalPecasVendidas: number
  totalArrecadado: number
  vendasPorCategoria: { categoria: string; quantidade: number; total: number }[]
}

export default function BazarRelatorioPage() {
  const [dataInicio, setDataInicio] = useState(firstOfMonth())
  const [dataFim, setDataFim] = useState(today())
  const [relatorio, setRelatorio] = useState<RelatorioBazar | null>(null)
  const [loading, setLoading] = useState(false)

  const gerar = async () => {
    setLoading(true)
    try {
      const result = await APIService.getRequest<RelatorioBazar>({
        url: '/bazar/relatorio',
        params: { dataInicio, dataFim },
      })
      setRelatorio(result)
    } catch {
      toast.error('Erro ao gerar relatório.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/bazar">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Relatório do Bazar</h1>
          <p className="text-sm text-muted-foreground">Resumo de vendas por período</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <Label>Data início</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Data fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <Button onClick={gerar} disabled={loading}>
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>

      {relatorio && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Peças Vendidas
              </p>
              <p className="text-2xl font-semibold">{relatorio.totalPecasVendidas}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Arrecadado
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {fmtCurrency(relatorio.totalArrecadado)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-medium">Vendas por Categoria</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                    Categoria
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">
                    Qtd
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatorio.vendasPorCategoria.map((v) => (
                  <tr key={v.categoria} className="border-t">
                    <td className="px-5 py-3">{v.categoria}</td>
                    <td className="px-5 py-3 text-right">{v.quantidade}</td>
                    <td className="px-5 py-3 text-right font-medium">{fmtCurrency(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
