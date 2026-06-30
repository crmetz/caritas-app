import { ArrowLeft, Lock, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/components/SessionProvider'
import APIService, { type PagedResponse } from '@/services/api'
import type { CreateVendaDto, FormaPagamento, ItemVenda, PecaOpcao } from './interface'
import { FORMA_PAGAMENTO_LABELS } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const emptyItem = (): ItemVenda => ({ pecaId: 0, quantidade: 1, valorUnitario: 0 })

const formatCpf = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

const validateCpf = (cpf: string): boolean => {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r >= 10 ? 0 : r
  }
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10])
}

export default function BrechoVendaPage() {
  const navigate = useNavigate()
  const { session, paroquiaAtual } = useSession()
  const paroquiaId = paroquiaAtual?.value ?? 0
  const nomeUsuario = session ? `${session.nome} ${session.sobrenome}`.trim() : ''

  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null)
  const [pecas, setPecas] = useState<PecaOpcao[]>([])
  const [itens, setItens] = useState<ItemVenda[]>([emptyItem()])
  const [comprador, setComprador] = useState({ nome: '', cpf: '', identificacaoAlternativa: '' })
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!paroquiaId) return
    APIService.getRequest<{ aberto: boolean } | null>({
      url: '/brecho/caixa/sessao-atual',
      params: { paroquiaId },
    })
      .then((r) => setCaixaAberto(r?.aberto === true))
      .catch(() => setCaixaAberto(false))
  }, [paroquiaId])

  useEffect(() => {
    if (!paroquiaId) return
    APIService.getRequest<PagedResponse<PecaOpcao>>({
      url: '/brecho/pecas',
      params: { page: 1, pageSize: 100, paroquiaId },
    })
      .then((r) => setPecas(r.items.filter((p) => p.quantidade > 0)))
      .catch(() => toast.error('Erro ao carregar peças.'))
  }, [paroquiaId])

  const disponivel = (pecaId: number) => pecas.find((p) => p.id === pecaId)?.quantidade ?? 0

  const updateItem = (index: number, field: keyof ItemVenda, value: number) => {
    setItens((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === 'pecaId') {
          const peca = pecas.find((p) => p.id === value)
          return { ...item, pecaId: value, quantidade: 1, valorUnitario: peca?.preco ?? 0 }
        }
        return { ...item, [field]: value }
      }),
    )
  }

  const total = itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0)

  const itensComErro = itens.filter(
    (item) => item.pecaId && item.quantidade > disponivel(item.pecaId),
  )

  const compradorInvalido =
    !comprador.nome.trim() ||
    (!comprador.cpf.trim() && !comprador.identificacaoAlternativa.trim())

  const handleSubmit = async () => {
    if (itens.some((i) => !i.pecaId)) {
      toast.error('Selecione uma peça em todos os itens.')
      return
    }
    if (itensComErro.length > 0) {
      toast.error('Corrija as quantidades que excedem o estoque disponível.')
      return
    }
    if (!comprador.nome) {
      toast.error('Informe o nome do comprador.')
      return
    }
    if (!comprador.cpf && !comprador.identificacaoAlternativa) {
      toast.error('Informe o CPF ou identificação alternativa do comprador.')
      return
    }
    if (comprador.cpf && !validateCpf(comprador.cpf)) {
      toast.error('CPF inválido. Verifique os dígitos informados.')
      return
    }
    setLoading(true)
    try {
      const dto: CreateVendaDto = { paroquiaId, itens, comprador, formaPagamento, registradoPor: nomeUsuario }
      await APIService.postRequest({ url: '/brecho/vendas', body: dto })
      toast.success('Venda registrada com sucesso!')
      navigate('/brecho')
    } catch {
      toast.error('Erro ao registrar venda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/brecho')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Registrar Venda — Brechó</h1>
          <p className="text-sm text-muted-foreground">
            Selecione as peças e informe os dados do comprador
          </p>
        </div>
      </div>

      {caixaAberto === false && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <Lock className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Caixa fechado. Volte ao Brechó e abra o caixa antes de registrar uma venda.
          </p>
        </div>
      )}

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Itens da Venda
        </h2>

        <div className="space-y-3">
          {itens.map((item, index) => {
            const max = item.pecaId ? disponivel(item.pecaId) : 0
            const qtdInvalida = item.pecaId > 0 && item.quantidade > max
            return (
              <div key={index} className="space-y-1">
                <div className="grid grid-cols-[1fr_5rem_8rem_2.5rem] gap-3 items-end">
                  <div className="space-y-1">
                    {index === 0 && <Label>Peça</Label>}
                    <Select
                      value={item.pecaId ? item.pecaId.toString() : ''}
                      onValueChange={(v) => updateItem(index, 'pecaId', Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar peça..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pecas.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.categoria}
                            {p.descricao ? ` — ${p.descricao}` : ''} ({p.quantidade} disp.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <Label>Qtd</Label>}
                    <Input
                      type="number"
                      min="1"
                      max={max || undefined}
                      value={item.quantidade}
                      className={qtdInvalida ? 'border-destructive focus-visible:ring-destructive' : ''}
                      onChange={(e) =>
                        updateItem(index, 'quantidade', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <Label>Valor unit. (R$)</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.valorUnitario || ''}
                      onChange={(e) =>
                        updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className={index === 0 ? 'pt-6' : ''}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setItens((prev) => prev.filter((_, i) => i !== index))}
                      disabled={itens.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {qtdInvalida && (
                  <p className="text-xs text-destructive pl-1">
                    Máximo disponível: {max} unidade{max !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setItens((prev) => [...prev, emptyItem()])}
        >
          <Plus className="h-4 w-4" />
          Adicionar Peça
        </Button>

        <div className="text-right text-lg font-semibold pt-2 border-t">
          Total: {fmtCurrency(total)}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Dados do Comprador
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Nome *</Label>
            <Input
              required
              value={comprador.nome}
              onChange={(e) => setComprador((prev) => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>CPF</Label>
            <Input
              placeholder="000.000.000-00"
              value={comprador.cpf}
              onChange={(e) =>
                setComprador((prev) => ({ ...prev, cpf: formatCpf(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Identificação Alternativa (estrangeiros)</Label>
            <Input
              value={comprador.identificacaoAlternativa}
              onChange={(e) =>
                setComprador((prev) => ({ ...prev, identificacaoAlternativa: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Forma de Pagamento *</Label>
            <Select
              value={formaPagamento}
              onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FORMA_PAGAMENTO_LABELS) as [FormaPagamento, string][]).map(
                  ([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/brecho')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || itensComErro.length > 0 || compradorInvalido || caixaAberto === false}>
          {loading ? 'Registrando...' : 'Confirmar Venda'}
        </Button>
      </div>
    </div>
  )
}
