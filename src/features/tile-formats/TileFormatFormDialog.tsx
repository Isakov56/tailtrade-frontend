import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastStore } from '@/stores/toastStore';
import { Loader2, X } from 'lucide-react';
import type { TileFormat } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  lengthCm: z.number({ coerce: true }).positive(),
  widthCm: z.number({ coerce: true }).positive(),
  thicknessMm: z.number({ coerce: true }).positive(),
  tilesPerBox: z.number({ coerce: true }).int().positive(),
  boxWeightKg: z.number({ coerce: true }).positive(),
  boxesPerPallet: z.number({ coerce: true }).int().positive(),
  pricePerSqMeterUZS: z.number({ coerce: true }).nonnegative(),
  pricePerSqMeterUSD: z.number({ coerce: true }).nonnegative(),
  category: z.string().min(1),
  surface: z.string().min(1),
  usage: z.string().min(1),
  currentStockSqMeters: z.number({ coerce: true }).nonnegative().optional(),
  minimumStockAlert: z.number({ coerce: true }).nonnegative().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  format: TileFormat | null;
  onClose: () => void;
}

export function TileFormatFormDialog({ format, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const isEditing = !!format;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: format ? {
      name: format.name,
      code: format.code,
      lengthCm: format.lengthCm,
      widthCm: format.widthCm,
      thicknessMm: format.thicknessMm,
      tilesPerBox: format.tilesPerBox,
      boxWeightKg: format.boxWeightKg,
      boxesPerPallet: format.boxesPerPallet,
      pricePerSqMeterUZS: Number(format.pricePerSqMeterUZS),
      pricePerSqMeterUSD: Number(format.pricePerSqMeterUSD),
      category: format.category,
      surface: format.surface,
      usage: format.usage,
      currentStockSqMeters: format.currentStockSqMeters,
      minimumStockAlert: format.minimumStockAlert,
      description: format.description || '',
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? api.patch(`/tile-formats/${format.id}`, data)
        : api.post('/tile-formats', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tile-formats'] });
      addToast({
        title: isEditing ? t('tileFormats.updated') : t('tileFormats.created'),
        variant: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? t('tileFormats.editFormat') : t('tileFormats.newFormatTitle')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('common.name')} *</Label>
              <Input {...register('name')} placeholder="60x60 Glossy Porcelain" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('common.code')} *</Label>
              <Input {...register('code')} placeholder="PGL-6060" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>{t('tileFormats.lengthCm')} *</Label>
              <Input type="number" step="0.1" {...register('lengthCm')} />
              {errors.lengthCm && <p className="text-xs text-destructive">{errors.lengthCm.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.widthCm')} *</Label>
              <Input type="number" step="0.1" {...register('widthCm')} />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.thicknessMm')} *</Label>
              <Input type="number" step="0.1" {...register('thicknessMm')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>{t('tileFormats.tilesPerBox')} *</Label>
              <Input type="number" {...register('tilesPerBox')} />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.boxWeightKg')} *</Label>
              <Input type="number" step="0.1" {...register('boxWeightKg')} />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.boxesPerPallet')} *</Label>
              <Input type="number" {...register('boxesPerPallet')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('tileFormats.pricePerM2UZS')} *</Label>
              <Input type="number" step="0.01" {...register('pricePerSqMeterUZS')} />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.pricePerM2USD')} *</Label>
              <Input type="number" step="0.01" {...register('pricePerSqMeterUSD')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>{t('common.category')} *</Label>
              <Input {...register('category')} placeholder="Porcelain" />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.surface')} *</Label>
              <Input {...register('surface')} placeholder="Glossy" />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.usage')} *</Label>
              <Input {...register('usage')} placeholder="Floor" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('tileFormats.currentStock')}</Label>
              <Input type="number" step="0.1" {...register('currentStockSqMeters')} />
            </div>
            <div className="space-y-1">
              <Label>{t('tileFormats.minStockAlert')}</Label>
              <Input type="number" step="0.1" {...register('minimumStockAlert')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('common.description')}</Label>
            <Input {...register('description')} placeholder="Optional description" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
