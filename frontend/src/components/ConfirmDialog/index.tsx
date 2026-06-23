import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ConfirmDialogRef {
  open: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmDialog = forwardRef<ConfirmDialogRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  })

  const resolveRef = useRef<(value: boolean) => void>(null)

  useImperativeHandle(ref, () => ({
    open: (opts) => {
      setOptions(opts)
      setIsOpen(true)
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef.current?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef.current?.(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{options.description}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {options.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            {options.confirmLabel ?? 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})
