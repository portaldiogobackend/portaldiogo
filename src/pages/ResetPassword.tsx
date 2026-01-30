import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle, ChevronRight, Eye, EyeOff, Home, Lock, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';

type ResetStatus = 'initial' | 'loading' | 'success' | 'error';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<ResetStatus>('initial');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);

  // Validar token ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      await supabase.auth.getSession();
      
      // Verificar se há um token de recuperação válido na URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (!accessToken || type !== 'recovery') {
        setIsValidToken(false);
        setError('Link de recuperação inválido ou expirado.');
      }
    };

    checkSession();
  }, []);

  // Validar força da senha
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }
    if (!/[A-Za-z]/.test(password)) {
      return 'A senha deve conter letras.';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter números.';
    }
    return null;
  };

  // Validar confirmação de senha
  const validateConfirmPassword = (password: string, confirm: string): string | null => {
    if (confirm && password !== confirm) {
      return 'As senhas não coincidem.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    setPasswordError(null);

    // Validações
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      setStatus('initial');
      return;
    }

    const confirmValidation = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmValidation) {
      setPasswordError(confirmValidation);
      setStatus('initial');
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setStatus('success');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
      setStatus('error');
    }
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
                  Redefinir Senha
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
                    <a 
                      href="/login" 
                      className="text-[#798090] hover:text-[#0D6EFD] font-medium transition-colors"
                    >
                      Login
                    </a>
                  </li>
                  <li>
                    <ChevronRight className="w-4 h-4 text-[#798090]" />
                  </li>
                  <li>
                    <span className="text-[#F2416E] font-medium">Redefinir Senha</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Reset Password Form Section ==================== */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-12 px-4">
        <div className="container mx-auto max-w-md">
          
          <motion.div 
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 lg:p-10 border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Token Inválido */}
            {!isValidToken && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Link Inválido
                </h3>
                <p className="text-slate-600 mb-6">
                  Este link de recuperação é inválido ou expirou. Por favor, solicite um novo link.
                </p>
                <a
                  href="/login"
                  className="inline-block px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all duration-300"
                >
                  Voltar para Login
                </a>
              </div>
            )}

            {/* Formulário de Nova Senha */}
            {isValidToken && status !== 'success' && (
              <>
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                    Nova Senha
                  </h1>
                  <p className="text-slate-600 text-base">
                    Digite sua nova senha abaixo
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password Field */}
                  <div>
                    <label 
                      htmlFor="newPassword" 
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError(null);
                        }}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Mínimo 8 caracteres, incluindo letras e números
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label 
                      htmlFor="confirmPassword" 
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError(null);
                        }}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {(passwordError || error) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                    >
                      {passwordError || error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button 
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-4 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg group"
                    whileHover={{ scale: status === 'loading' ? 1 : 1.01 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.99 }}
                  >
                    {status === 'loading' ? (
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
                        Redefinindo...
                      </>
                    ) : (
                      <>
                        Redefinir Senha
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Back to Login Link */}
                <p className="mt-8 text-center text-slate-600">
                  Lembrou sua senha?{' '}
                  <a 
                    href="/login" 
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Voltar para Login
                  </a>
                </p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Senha Redefinida!
                </h3>
                <p className="text-slate-600 mb-6">
                  Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  Redirecionando...
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResetPassword;
