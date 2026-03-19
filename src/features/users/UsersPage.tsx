import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToastStore } from '@/stores/toastStore';
import { formatDateTime } from '@/utils/format';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import type { User, PaginatedResponse } from '@/types';

export function UsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/users?${params}`);
      return data;
    },
  });

  // Create user form state
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phoneNumber: '', role: 'SALES_REP',
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast({ title: t('users.created'), variant: 'success' });
      setShowForm(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '', role: 'SALES_REP' });
    },
    onError: (error: any) => {
      addToast({ title: t('users.failed'), description: error.response?.data?.message, variant: 'destructive' });
    },
  });

  const users = data?.data || [];

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    SALES_REP: 'bg-green-100 text-green-800',
  };

  return (
    <div>
      <Header title={t('users.title')} subtitle={t('users.subtitle')} />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('users.searchUsers')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('users.newUser')}
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">{t('common.name')}</th>
                  <th className="p-3 font-medium">{t('common.email')}</th>
                  <th className="p-3 font-medium">{t('common.role')}</th>
                  <th className="p-3 font-medium">{t('common.status')}</th>
                  <th className="p-3 font-medium">{t('users.lastLogin')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/25">
                    <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : t('common.never')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('users.createUser')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('users.firstName')} *</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('users.lastName')} *</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('common.email')} *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>{t('auth.password')} *</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={8} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.phone')}</Label>
                <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t('common.role')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="SALES_REP">{t('users.SALES_REP')}</option>
                  <option value="MANAGER">{t('users.MANAGER')}</option>
                  <option value="ADMIN">{t('users.ADMIN')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
