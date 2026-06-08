import { type FormEvent, forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import APIService from '@/services/api'
import {
  type CreateEntradaDto,
  type EntradaModalProps,
  type EntradaModalRef,
  type OrigemEntrada,
  ORIGEM_LABELS,
} from './interface'

const ORIGENS_MANUAIS = (
  Object.entries(ORIGEM_LABELS) as [OrigemEntrada, string][]
).filter(([k]) => k !== 'VendaBrecho')

const today = () => new Date().toISOString().slice(0, 10)

export const EntradaModal = forwardRef<EntradaModalRef, EntradaModalProps>(
  ({ paroquiaId, onSuccess }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<Omit<CreateEntradaDto, 'paroquiaId'>>({
      data: today(),
      valor: 0,
      origem: 'Doacao',
      responsavel: '',
      observacoes: '',
    })

    const set = (field: string, value: unknown) =>
      setForm((prev) => ({ ...prev, [field]: value }))

    useImperativeHandle(ref, () => ({
      open: () => {
        setForm({ data: today(), valor: 0, origem: 'Doacao', responsavel: '', observacoes: '' })
        setIsOpen(true)
      },
    }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        await APIService.postRequest({
          url: '/caixa/lancamentos/entrada',
          body: { ...form, paroquiaId },
        })
        toast.success('Entrada registrada.')
        setIsOpen(false)
        onSuccess()
      } catch {
        toast.error('Erro ao registrar entrada.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entrada Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data *</Label>
                <Input
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => set('data', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.valor || ''}
                  onChange={(e) => set('valor', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Origem *</Label>
              <Select
                value={form.origem}
                onValueChange={(v) => set('origem', v as OrigemEntrada)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS_MANUAIS.map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Responsável *</Label>
              <Input
                required
                value={form.responsavel}
                onChange={(e) => set('responsavel', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={form.observacoes ?? ''}
                onChange={(e) => set('observacoes', e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)
