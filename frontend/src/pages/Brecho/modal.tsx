import { type FormEvent, forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import APIService from '@/services/api'
import type { CreatePecaDto, PecaBrecho, PecaModalProps, PecaModalRef } from './interface'

const INITIAL: Omit<CreatePecaDto, 'paroquiaId'> = {
  categoria: '',
  descricao: '',
  quantidade: 1,
  preco: 0,
}

export const PecaModal = forwardRef<PecaModalRef, PecaModalProps>(
  ({ paroquiaId, onSuccess }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [editing, setEditing] = useState<PecaBrecho | null>(null)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<Omit<CreatePecaDto, 'paroquiaId'>>(INITIAL)

    const set = (field: string, value: unknown) =>
      setForm((prev) => ({ ...prev, [field]: value }))

    useImperativeHandle(ref, () => ({
      open: (peca?: PecaBrecho) => {
        if (peca) {
          setEditing(peca)
          setForm({
            categoria: peca.categoria,
            descricao: peca.descricao ?? '',
            quantidade: peca.quantidade,
            preco: peca.preco,
          })
        } else {
          setEditing(null)
          setForm(INITIAL)
        }
        setIsOpen(true)
      },
    }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        if (editing) {
          await APIService.putRequest({
            url: `/brecho/pecas/${editing.id}`,
            body: { ...form, paroquiaId },
          })
        } else {
          await APIService.postRequest({
            url: '/brecho/pecas',
            body: { ...form, paroquiaId },
          })
        }
        toast.success(editing ? 'Peça atualizada.' : 'Peça adicionada.')
        setIsOpen(false)
        onSuccess()
      } catch {
        toast.error('Erro ao salvar peça.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Input
                required
                placeholder="Ex: Camiseta, Calça, Casaco..."
                value={form.categoria}
                onChange={(e) => set('categoria', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.descricao ?? ''}
                onChange={(e) => set('descricao', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={form.quantidade}
                  onChange={(e) => set('quantidade', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.preco || ''}
                  onChange={(e) => set('preco', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)
