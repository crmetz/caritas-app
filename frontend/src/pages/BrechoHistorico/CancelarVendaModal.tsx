import { type FormEvent, forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useSession } from '@/components/SessionProvider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import APIService from '@/services/api'
import type { CancelarVendaModalProps, CancelarVendaModalRef, VendaBrecho } from './interface'
import { FORMA_PAGAMENTO_LABELS } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const CancelarVendaModal = forwardRef<CancelarVendaModalRef, CancelarVendaModalProps>(
  ({ onSuccess }, ref) => {
    const { session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [venda, setVenda] = useState<VendaBrecho | null>(null)

    useImperativeHandle(ref, () => ({
      open: (v) => {
        setVenda(v)
        setMotivo('')
        setIsOpen(true)
      },
    }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      if (!venda || !session) return
      setLoading(true)
      try {
        await APIService.postRequest({
          url: `/brecho/vendas/${venda.id}/cancelar`,
          body: {
            motivo,
            canceladoPor: `${session.nome} ${session.sobrenome}`.trim(),
          },
        })
        toast.success('Venda cancelada e estoque restaurado.')
        setIsOpen(false)
        onSuccess()
      } catch {
        toast.error('Erro ao cancelar venda.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Venda</DialogTitle>
          </DialogHeader>

          {venda && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Comprador:</span>{' '}
                <span className="font-medium">{venda.compradorNome}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">{fmtCurrency(venda.valorTotal)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Pagamento:</span>{' '}
                <span className="font-medium">{FORMA_PAGAMENTO_LABELS[venda.formaPagamento]}</span>
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            O estoque será restaurado e o lançamento automático no Caixa será removido.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Motivo do cancelamento *</Label>
              <Textarea
                rows={3}
                required
                minLength={5}
                placeholder="Descreva o motivo..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)
