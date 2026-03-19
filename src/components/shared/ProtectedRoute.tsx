import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">{t('access.denied')}</h2>
          <p className="mt-2 text-muted-foreground">{t('access.noPermission')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
