import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastStore } from '@/stores/toastStore';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  position: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tinNumber: z.string().optional(),
  legalAddress: z.string().optional(),
  creditLimit: z.number({ coerce: true }).nonnegative().optional(),
  paymentTermsDays: z.number({ coerce: true }).int().positive().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR', 'CONTRACTOR']).optional(),
  priceCategory: z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  discountPercent: z.number({ coerce: true }).min(0).max(100).optional(),
  leadSource: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t } = useTranslation();
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [telegramUsername, setTelegramUsername] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerType: 'RETAIL',
      priceCategory: 'STANDARD',
      paymentTermsDays: 30,
      creditLimit: 0,
      discountPercent: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const validPhones = phoneNumbers.filter(p => p.trim() !== '');
      if (validPhones.length === 0) throw new Error('At least one phone number is required');
      return api.post('/customers', {
        ...data,
        phoneNumbers: validPhones,
        telegramUsername: telegramUsername || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast({ title: t('customers.created'), variant: 'success' });
      navigate('/customers');
    },
    onError: (error: any) => {
      addToast({
        title: t('customers.createFailed'),
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div>
      <Header title={t('customers.newCustomer')} subtitle={t('customers.subtitle')} />

      <div className="p-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/customers')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('customers.backToCustomers')}
        </Button>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.basicInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.companyName') + ' *'}</Label>
                  <Input {...register('companyName')} placeholder="Company LLC" />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>{t('customers.contactPerson') + ' *'}</Label>
                  <Input {...register('contactPerson')} placeholder="Full name" />
                  {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.position')}</Label>
                  <Input {...register('position')} placeholder="Director, Manager..." />
                </div>
                <div className="space-y-1">
                  <Label>{t('common.email')}</Label>
                  <Input {...register('email')} type="email" placeholder="email@company.uz" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.tinNumber')}</Label>
                  <Input {...register('tinNumber')} placeholder="Tax ID" />
                </div>
                <div className="space-y-1">
                  <Label>{t('customers.telegramUsername')}</Label>
                  <Input value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="@username" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('customers.legalAddress')}</Label>
                <Input {...register('legalAddress')} placeholder="Full legal address" />
              </div>

              {/* Phone Numbers */}
              <div className="space-y-2">
                <Label>{t('customers.phoneNumbers') + ' *'}</Label>
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => {
                        const updated = [...phoneNumbers];
                        updated[index] = e.target.value;
                        setPhoneNumbers(updated);
                      }}
                      placeholder="+998901234567"
                    />
                    {phoneNumbers.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setPhoneNumbers([...phoneNumbers, ''])}>
                  <Plus className="mr-2 h-3 w-3" /> {t('customers.addPhone')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.businessSettings')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.customerType')}</Label>
                  <select {...register('customerType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="RETAIL">{t('customers.RETAIL')}</option>
                    <option value="WHOLESALE">{t('customers.WHOLESALE')}</option>
                    <option value="DISTRIBUTOR">{t('customers.DISTRIBUTOR')}</option>
                    <option value="CONTRACTOR">{t('customers.CONTRACTOR')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('customers.priceCategory')}</Label>
                  <select {...register('priceCategory')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="STANDARD">{t('customers.STANDARD')}</option>
                    <option value="SILVER">{t('customers.SILVER')}</option>
                    <option value="GOLD">{t('customers.GOLD')}</option>
                    <option value="PLATINUM">{t('customers.PLATINUM')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.discountPercent')}</Label>
                  <Input type="number" step="0.5" {...register('discountPercent')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('customers.creditLimitUZS')}</Label>
                  <Input type="number" {...register('creditLimit')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('customers.paymentTermsDays')}</Label>
                  <Input type="number" {...register('paymentTermsDays')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('customers.leadSource')}</Label>
                  <Input {...register('leadSource')} placeholder="Exhibition, referral..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('common.notes')}</Label>
                <Input {...register('notes')} placeholder="Internal notes..." />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/customers')}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('customers.createCustomer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
