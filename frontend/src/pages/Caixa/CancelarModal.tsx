import { type FormEvent, forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import APIService from '@/services/api'
import type { CancelarModalProps, CancelarModalRef, LancamentoCaixa } from './interface'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const CancelarModal = forwardRef<CancelarModalRef, CancelarModalProps>(
  ({ onSuccess }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [lancamento, setLancamento] = useState<LancamentoCaixa | null>(null)

    useImperativeHandle(ref, () => ({
      open: (l) => {
        setLancamento(l)
        setMotivo('')
        setIsOpen(true)
      },
    }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      if (!lancamento) return
      setLoading(true)
      try {
        await APIService.postRequest({
          url: `/caixa/lancamentos/${lancamento.id}/cancelar`,
          body: { motivo },
        })
        toast.success('Lançamento cancelado e estorno gerado.')
        setIsOpen(false)
        onSuccess()
      } catch {
        toast.error('Erro ao cancelar lançamento.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Lançamento</DialogTitle>
          </DialogHeader>

          {lancamento && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Tipo:</span>{' '}
                <span className="font-medium">{lancamento.tipo === 'Entrada' ? '↑ Entrada' : '↓ Saída'}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Valor:</span>{' '}
                <span className="font-medium">{fmtCurrency(lancamento.valor)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Responsável:</span>{' '}
                <span className="font-medium">{lancamento.responsavel}</span>
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Um lançamento de estorno será criado automaticamente para reverter o valor no caixa.
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
