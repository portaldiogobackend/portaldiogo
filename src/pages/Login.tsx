import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle, ChevronRight, Eye, EyeOff, Home, Mail, Send, X, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';

// Tipos para o estado do modal de recuperação
type ResetPasswordStatus = 'idle' | 'loading' | 'success' | 'error';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o cadastro foi realizado com sucesso
  const searchParams = new URLSearchParams(location.search);
  const isSuccess = searchParams.get('success') === 'signup';

  // Estados do modal de recuperação de senha
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<ResetPasswordStatus>('idle');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      console.log('[Auth] Iniciando login com Google...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('[Auth] Erro no login com Google:', err);
      const message = err instanceof Error ? err.message : 'Erro ao conectar com Google.';
      setError(message);
    }
  };

  // Verificar se o usuário já está logado ao carregar a página
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[Auth] Usuário já possui sessão ativa. Verificando perfil para redirecionamento...');
        try {
          const { data: userData, error: userError } = await supabase
            .from('tbf_controle_user')
            .select('role, signature')
            .eq('id', session.user.id)
            .single();

          if (!userError && userData) {
            if (userData.role === 'aluno') {
              if (userData.signature === 'ativo') {
                navigate('/aluno/dashboard');
              } else {
                navigate('/aguardando-aprovacao');
              }
            } else if (userData.role === 'admin' || userData.role === 'professor') {
              navigate('/setup-inicial');
            }
          }
        } catch (err) {
          console.error('[Auth] Erro ao verificar sessão existente:', err);
        }
      }
    };
    checkUser();

    // Listener para mudanças de estado de autenticação (ex: após login com Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] Evento de autenticação: ${event}`);
      if (event === 'SIGNED_IN' && session) {
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('[Auth] Iniciando tentativa de login para:', email);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Auth] Resposta do Supabase Auth:', { data, error: authError });

      if (authError) throw authError;

      if (data.user) {
        console.log('[Auth] Login bem-sucedido para:', data.user.email);
        
        // Buscar role e signature do usuário para redirecionamento correto
        console.log('[Database] Buscando perfil para ID:', data.user.id);
        const { data: userData, error: userError } = await supabase
          .from('tbf_controle_user')
          .select('role, signature')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('[Database] Erro ao buscar dados do usuário:', userError);
          // Em caso de erro, não assume que é admin. Tenta deslogar e mostrar erro.
          await supabase.auth.signOut();
          setError('Erro ao carregar seu perfil. Por favor, tente novamente.');
          return;
        }

        console.log('[Auth] Perfil carregado com sucesso:', userData);

        // Lógica de redirecionamento baseada em role e signature
        if (userData && userData.role === 'aluno') {
          if (userData.signature === 'ativo') {
            console.log('[Auth] Redirecionando Aluno Ativo para dashboard');
            navigate('/aluno/dashboard');
          } else {
            console.log('[Auth] Aluno Inativo - Aguardando aprovação');
            navigate('/aguardando-aprovacao');
          }
        } else if (userData && (userData.role === 'admin' || userData.role === 'professor')) {
          console.log('[Auth] Redirecionando Admin/Professor para área administrativa');
          navigate('/setup-inicial');
        } else {
          console.warn('[Auth] Role desconhecida ou não definida:', userData?.role);
          // Se não souber o que é, manda para o home ou mostra erro
          setError('Seu usuário não possui uma função (role) definida no sistema.');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error('[Auth] Erro no login:', err);
      const message = err instanceof Error ? err.message : 'E-mail ou senha incorretos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal de recuperação de senha
  const openResetModal = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Auth] Abrindo modal de recuperação de senha');
    setResetEmail('');
    setResetStatus('idle');
    setIsResetModalOpen(true);
  };

  // Fechar modal de recuperação de senha
  const closeResetModal = () => {
    console.log('[Auth] Fechando modal de recuperação de senha');
    setIsResetModalOpen(false);
    setResetEmail('');
    setResetStatus('idle');
  };

  // Enviar email de recuperação
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    setResetStatus('idle');

    console.log('[Auth] Iniciando recuperação de senha para:', resetEmail);

    try {
      // 1. Verificar se o e-mail existe usando a função RPC (ignora RLS)
      console.log('[Database] Verificando existência do e-mail via RPC check_user_exists...');
      const { data: exists, error: checkError } = await supabase
        .rpc('check_user_exists', { email_to_check: resetEmail });

      console.log('[Database] Resultado do RPC check_user_exists:', { exists, error: checkError });

      if (checkError) {
        console.error('[Database] Erro ao chamar RPC check_user_exists:', checkError);
        throw checkError;
      }

      if (!exists) {
        console.warn('[Auth] E-mail não encontrado no sistema:', resetEmail);
        // E-mail não encontrado
        setResetStatus('error');
        return;
      }

      // 2. Se existe, enviar link de redefinição
      console.log('[Auth] E-mail confirmado. Enviando link de redefinição via Supabase Auth...');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      console.log('[Auth] Resposta do resetPasswordForEmail:', { error: resetError });

      if (resetError) throw resetError;

      console.log('[Auth] Link de redefinição enviado com sucesso para:', resetEmail);
      setResetStatus('success');
    } catch (err) {
      console.error('[Auth] Erro crítico na recuperação de senha:', err);
      setResetStatus('error');
    } finally {
      setIsResetLoading(false);
    }
  };

  // Tentar novamente após erro
  const handleTryAgain = () => {
    setResetStatus('idle');
    setResetEmail('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* ==================== Breadcrumb Section ==================== */}
      <section className="breadcrumb py-16 lg:py-24 bg-[#E8F1FF] relative z-10 overflow-hidden">
        {/* Decorative Shapes */}
        <motion.img 
          src="/images/shapes/shape1.png" 
          alt="" 
          className="absolute top-16 right-[15%] w-12 h-12 hidden md:block pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.img 
          src="/images/shapes/shape2.png" 
          alt="" 
          className="absolute bottom-20 left-[10%] w-8 h-8 hidden md:block pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="/images/shapes/shape3.png" 
          alt="" 
          className="absolute top-32 left-[5%] w-16 h-16 hidden md:block pointer-events-none"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="/images/shapes/shape5.png" 
          alt="" 
          className="absolute bottom-16 right-[8%] w-14 h-14 hidden md:block pointer-events-none"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="/images/shapes/shape4.png" 
          alt="" 
          className="absolute top-24 right-[5%] w-4 h-4 pointer-events-none"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src="/images/shapes/shape4.png" 
          alt="" 
          className="absolute bottom-24 left-[20%] w-4 h-4 pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-center">
            <div className="w-full lg:w-2/3">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className="text-4xl lg:text-5xl font-semibold text-[#222E48] mb-4">
                  Entrar
                </h1>
                <ul className="flex items-center justify-center gap-2 text-sm">
                  <li>
                    <a 
                      href="/" 
                      className="flex items-center gap-1.5 text-[#798090] hover:text-[#0D6EFD] font-medium transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Início
                    </a>
                  </li>
                  <li>
                    <ChevronRight className="w-4 h-4 text-[#798090]" />
                  </li>
                  <li>
                    <span className="text-[#F2416E] font-medium">Entrar</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Login Form Section ==================== */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Form Card */}
            <motion.div 
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 lg:p-10 border border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                  Bem-vindo de volta!
                </h1>
                <p className="text-slate-600 text-base">
                  Entre na sua conta para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    E-mail
                  </label>
                  <input 
                    type="email" 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={openResetModal}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Cadastro realizado com sucesso! Faça login para continuar.
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-4 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg group"
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                          fill="none"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-500 font-medium">
                    ou continue com
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-slate-700 font-medium group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="group-hover:text-slate-900 transition-colors">Continuar com Google</span>
              </button>

              {/* Sign Up Link */}
              <p className="mt-8 text-center text-slate-600">
                Não tem uma conta?{' '}
                <a 
                  href="/cadastro" 
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Criar conta
                </a>
              </p>
            </motion.div>

            {/* Illustration */}
            <motion.div 
              className="hidden lg:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
                <img 
                  src="/images/thumbs/account-img.png" 
                  alt="Ilustração de Login" 
                  className="relative max-w-full h-auto drop-shadow-2xl"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ==================== Modal de Recuperação de Senha ==================== */}
      <AnimatePresence>
        {isResetModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={closeResetModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                  <button
                    onClick={closeResetModal}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Recuperar Senha
                      </h2>
                      <p className="text-blue-100 text-sm">
                        Enviaremos um link para seu e-mail
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Estado: Formulário */}
                  {resetStatus === 'idle' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-slate-600 mb-6">
                        Digite o e-mail cadastrado na sua conta. Enviaremos um link para você criar uma nova senha.
                      </p>
                      
                      <form onSubmit={handleResetPassword}>
                        <div className="mb-6">
                          <label 
                            htmlFor="resetEmail" 
                            className="block text-sm font-semibold text-slate-700 mb-2"
                          >
                            E-mail cadastrado
                          </label>
                          <div className="relative">
                            <input 
                              type="email" 
                              id="resetEmail"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="seu@email.com"
                              className="w-full px-4 py-3.5 pl-11 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                              required
                              autoFocus
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={closeResetModal}
                            className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all duration-200"
                          >
                            Cancelar
                          </button>
                          <motion.button 
                            type="submit"
                            disabled={isResetLoading || !resetEmail}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            whileHover={{ scale: isResetLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isResetLoading ? 1 : 0.98 }}
                          >
                            {isResetLoading ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle 
                                    className="opacity-25" 
                                    cx="12" 
                                    cy="12" 
                                    r="10" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path 
                                    className="opacity-75" 
                                    fill="currentColor" 
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Enviando...
                              </>
                            ) : (
                              <>
                                Enviar
                                <Send className="w-4 h-4" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Estado: Sucesso */}
                  {resetStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        E-mail enviado!
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Enviamos um link de recuperação para <span className="font-semibold text-slate-900">{resetEmail}</span>. 
                        Verifique sua caixa de entrada e spam.
                      </p>
                      <button
                        onClick={closeResetModal}
                        className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-300"
                      >
                        Entendi, vou verificar
                      </button>
                    </motion.div>
                  )}

                  {/* Estado: Erro */}
                  {resetStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Ocorreu um erro, conte o suporte.
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Não encontramos uma conta vinculada ao e-mail <span className="font-semibold text-slate-900">{resetEmail}</span>.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleTryAgain}
                          className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all duration-200"
                        >
                          Tentar novamente
                        </button>
                        <a
                          href="/cadastro"
                          className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all duration-300 text-center"
                        >
                          Criar conta
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Login;
