import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('tbf_controle_user')
        .select('role')
        .eq('email', user.email)
        .single();

      setRole(data?.role || null);
      setLoading(false);
    }

    checkRole();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (role !== 'admin') {
    return <Navigate to="/aluno/dashboard" replace />;
  }

  return <>{children}</>;
}
