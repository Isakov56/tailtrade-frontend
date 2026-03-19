import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addToast({ title: t('auth.welcomeBack'), variant: 'success' });
      navigate('/dashboard');
    } catch (error: any) {
      addToast({
        title: t('auth.loginFailed'),
        description: error.response?.data?.message || t('auth.invalidCredentials'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Grid3X3 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('auth.appName')}</CardTitle>
          <CardDescription>{t('auth.tagline')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@tiletrade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium">{t('auth.demoCredentials')}</p>
            <p>{t('auth.demoAdmin')}</p>
            <p>{t('auth.demoSales')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
