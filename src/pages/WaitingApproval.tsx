import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Mail, LogOut, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const WaitingApproval: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserEmail(user.email || '');

      const { data, error } = await supabase
        .from('tbf_controle_user')
        .select('nome, sobrenome, signature, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserName(data.nome || 'Aluno');
        
        // Se já estiver ativo, redirecionar para o dashboard
        if (data.signature === 'ativo' && data.role === 'aluno') {
          navigate('/aluno/dashboard');
        }
        // Se não for aluno, redirecionar adequadamente
        else if (data.role !== 'aluno') {
          navigate('/setup-inicial');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  }, [navigate]);

  const checkApprovalStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tbf_controle_user')
        .select('signature, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.signature === 'ativo' && data?.role === 'aluno') {
        navigate('/aluno/dashboard');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
    
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkApprovalStatus, fetchUserData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FE] via-blue-50/30 to-[#E8F1FF] flex flex-col items-center justify-center p-6">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-[10%] w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-[10%] w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Card */}
      <motion.div 
        className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-10 max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated Clock Icon */}
        <motion.div 
          className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-200"
          animate={{ 
            boxShadow: [
              "0 20px 40px -10px rgba(251, 191, 36, 0.3)",
              "0 20px 60px -10px rgba(251, 191, 36, 0.5)",
              "0 20px 40px -10px rgba(251, 191, 36, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Clock size={48} className="text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#1B2559] mb-4">
          Aguardando Aprovação
        </h1>

        {/* Greeting */}
        <p className="text-lg text-[#2B3674] mb-2">
          Olá, <span className="font-semibold">{userName}</span>!
        </p>

        {/* Description */}
        <p className="text-[#A3AED0] mb-8 leading-relaxed">
          Seu cadastro foi recebido com sucesso! Nossa equipe está analisando sua solicitação. 
          Você receberá acesso assim que sua conta for aprovada.
        </p>

        {/* Status Steps */}
        <div className="bg-[#F4F7FE] rounded-2xl p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Step 1 - Completed */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1B2559]">Cadastro Realizado</p>
                <p className="text-sm text-[#A3AED0]">Seus dados foram recebidos</p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-5 w-0.5 h-4 bg-gradient-to-b from-green-300 to-amber-300"></div>

            {/* Step 2 - In Progress */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock size={20} className="text-amber-600" />
              </motion.div>
              <div className="text-left">
                <p className="font-semibold text-[#1B2559]">Em Análise</p>
                <p className="text-sm text-[#A3AED0]">Aguardando aprovação do administrador</p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-5 w-0.5 h-4 bg-gradient-to-b from-amber-300 to-gray-200"></div>

            {/* Step 3 - Pending */}
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                <CheckCircle2 size={20} className="text-gray-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1B2559]">Acesso Liberado</p>
                <p className="text-sm text-[#A3AED0]">Você terá acesso completo à plataforma</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Info */}
        <div className="flex items-center justify-center gap-2 text-[#A3AED0] mb-8 bg-blue-50 py-3 px-4 rounded-xl">
          <Mail size={18} className="text-[#0061FF]" />
          <span className="text-sm">Você receberá um e-mail em <strong className="text-[#1B2559]">{userEmail}</strong> quando aprovado</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            onClick={checkApprovalStatus}
            disabled={isChecking}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0061FF] to-[#0052D9] text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-300/30 transition-all duration-300 disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Verificando...' : 'Verificar Status'}
          </motion.button>

          <motion.button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F4F7FE] text-[#1B2559] font-bold py-3.5 px-6 rounded-xl hover:bg-[#E9EDF7] transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home size={18} />
            Página Inicial
          </motion.button>
        </div>

        {/* Logout Link */}
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center gap-2 text-[#A3AED0] hover:text-red-500 font-medium transition-colors mx-auto"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </motion.div>

      {/* Footer Note */}
      <p className="text-sm text-[#A3AED0] mt-8 text-center max-w-md">
        Dúvidas? Entre em contato conosco através do e-mail{' '}
        <a href="mailto:suporte@profdiogomat.com" className="text-[#0061FF] hover:underline font-medium">
          suporte@profdiogomat.com
        </a>
      </p>
    </div>
  );
};

export default WaitingApproval;
