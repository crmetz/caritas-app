import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/components/SessionProvider'
import APIService from '@/services/api'
import { DESTINO_LABELS, ORIGEM_LABELS } from '../Caixa/interface'
import type { RelatorioCaixa } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const today = () => new Date().toISOString().slice(0, 10)

const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function CaixaRelatorioPage() {
  const { paroquiaAtual } = useSession()
  const [dataInicio, setDataInicio] = useState(firstOfMonth())
  const [dataFim, setDataFim] = useState(today())
  const [relatorio, setRelatorio] = useState<RelatorioCaixa | null>(null)
  const [loading, setLoading] = useState(false)

  const gerar = async () => {
    if (!paroquiaAtual) return
    setLoading(true)
    try {
      const result = await APIService.getRequest<RelatorioCaixa>({
        url: `/caixa/${paroquiaAtual.value}/relatorio`,
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
        <Link to="/caixa">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Relatório do Caixa</h1>
          <p className="text-sm text-muted-foreground">
            {paroquiaAtual?.label ?? '—'}
          </p>
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
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <Button onClick={gerar} disabled={loading || !paroquiaAtual}>
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>

      {relatorio && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Entradas
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {fmtCurrency(relatorio.totalEntradas)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Saídas</p>
              <p className="text-2xl font-semibold text-red-600">
                {fmtCurrency(relatorio.totalSaidas)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Saldo do Período
              </p>
              <p
                className={`text-2xl font-semibold ${relatorio.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {fmtCurrency(relatorio.saldo)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="font-medium">Entradas por Origem</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      Origem
                    </th>
                    <th className="px-5 py-3 text-right font-semibold text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.entradasPorOrigem.map((e) => (
                    <tr key={e.origem} className="border-t">
                      <td className="px-5 py-3">{ORIGEM_LABELS[e.origem]}</td>
                      <td className="px-5 py-3 text-right text-green-600 font-medium">
                        {fmtCurrency(e.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="font-medium">Saídas por Destino</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      Destino
                    </th>
                    <th className="px-5 py-3 text-right font-semibold text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.saidasPorDestino.map((s) => (
                    <tr key={s.destino} className="border-t">
                      <td className="px-5 py-3">{DESTINO_LABELS[s.destino]}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium">
                        {fmtCurrency(s.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-medium">Famílias Beneficiadas</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                    Família (responsável)
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">
                    Total Recebido
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatorio.familiasBeneficiadas.map((f) => (
                  <tr key={f.familia} className="border-t">
                    <td className="px-5 py-3">{f.familia}</td>
                    <td className="px-5 py-3 text-right font-medium">{fmtCurrency(f.total)}</td>
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
