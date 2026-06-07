import { type FormEvent, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import APIService, { type PagedResponse } from '@/services/api'
import {
  type CreateSaidaDto,
  DESTINO_LABELS,
  type DestinoSaida,
  type SaidaModalProps,
  type SaidaModalRef,
} from './interface'

interface FamiliaOpcao {
  id: number
  responsavel: { nome: string }
}

const today = () => new Date().toISOString().slice(0, 10)

export const SaidaModal = forwardRef<SaidaModalRef, SaidaModalProps>(
  ({ paroquiaId, onSuccess }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [familias, setFamilias] = useState<FamiliaOpcao[]>([])
    const [form, setForm] = useState<Omit<CreateSaidaDto, 'paroquiaId'>>({
      data: today(),
      valor: 0,
      destino: 'CestaBasica',
      familiaId: undefined,
      responsavel: '',
      observacoes: '',
    })

    useEffect(() => {
      APIService.getRequest<PagedResponse<FamiliaOpcao>>({
        url: '/familias',
        params: { page: 1, pageSize: 100 },
      })
        .then((r) => setFamilias(r.items))
        .catch(() => {})
    }, [])

    const set = (field: string, value: unknown) =>
      setForm((prev) => ({ ...prev, [field]: value }))

    useImperativeHandle(ref, () => ({
      open: () => {
        setForm({
          data: today(),
          valor: 0,
          destino: 'CestaBasica',
          familiaId: undefined,
          responsavel: '',
          observacoes: '',
        })
        setIsOpen(true)
      },
    }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        await APIService.postRequest({
          url: '/caixa/lancamentos/saida',
          body: { ...form, paroquiaId },
        })
        toast.success('Saída registrada.')
        setIsOpen(false)
        onSuccess()
      } catch {
        toast.error('Erro ao registrar saída.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Saída</DialogTitle>
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
              <Label>Destino *</Label>
              <Select
                value={form.destino}
                onValueChange={(v) => set('destino', v as DestinoSaida)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DESTINO_LABELS) as [DestinoSaida, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Família Beneficiada *</Label>
              <Select
                value={form.familiaId?.toString() ?? ''}
                onValueChange={(v) => set('familiaId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar família..." />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.responsavel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Responsável pela compra *</Label>
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
