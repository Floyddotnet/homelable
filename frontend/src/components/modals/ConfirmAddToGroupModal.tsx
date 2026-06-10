import { Layers } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmAddToGroupModalProps {
  open: boolean
  nodeLabel: string
  groupLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmAddToGroupModal({ open, nodeLabel, groupLabel, onConfirm, onCancel }: ConfirmAddToGroupModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers size={16} className="text-[#00d4ff]" />
            Add to group
          </DialogTitle>
          <DialogDescription>
            Add <span className="font-medium text-foreground">{nodeLabel}</span> to the group{' '}
            <span className="font-medium text-foreground">{groupLabel}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            className="bg-[#00d4ff] text-[#0d1117] hover:bg-[#00d4ff]/90"
            onClick={onConfirm}
          >
            Add to group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
