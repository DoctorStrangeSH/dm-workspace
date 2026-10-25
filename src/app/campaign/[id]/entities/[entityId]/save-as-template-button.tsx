'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { createTemplateFromEntity } from '@/lib/actions/templates'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Input } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  entityId: string
  campaignId: string
  defaultName: string
}

export default function SaveAsTemplateButton({ entityId, campaignId, defaultName }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [done, setDone] = useState(false)
  const [name, setName] = useState(defaultName)

  const handleSave = () => {
    startTransition(async () => {
      const res = await createTemplateFromEntity(entityId, campaignId, name)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('entities.template.toast.saved'))
      setDone(true)
      setTimeout(() => {
        setDone(false)
        setShowDialog(false)
      }, 1500)
    })
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon={<Sparkles size={14} />}
        onClick={() => setShowDialog(true)}
      >
        {t('entities.template.saveAs')}
      </Button>

      <Dialog
        open={showDialog}
        onClose={() => !isPending && setShowDialog(false)}
        title={t('entities.template.dialogTitle')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDialog(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              loading={isPending}
              icon={done ? <Check size={14} /> : undefined}
            >
              {done ? t('entities.template.saved') : t('common.save')}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          {t('entities.template.dialogDescription')}
        </p>
        <Input
          label={t('entities.template.nameLabel')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </Dialog>
    </>
  )
}
