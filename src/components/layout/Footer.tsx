import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { CheckCircle, Facebook, Instagram, Linkedin, Mail, MapPin, Send, XCircle } from 'lucide-react';
import React, { useRef, useState } from 'react';

// ============== Types ==============
interface FooterLink {
  label: string;
  href: string;
}

// ============== Footer Data ==============
const NAVIGATION_LINKS: FooterLink[] = [
  { label: 'Sobre Nós', href: '#about' },
  { label: 'Cursos', href: '#courses' },
  { label: 'O Instrutor', href: '#instructor' },
  { label: 'FAQs', href: '#faq' },
  { label: 'Contato', href: '/contato' },
  { label: 'Blogs', href: '#blog' },
];

const CATEGORY_LINKS: FooterLink[] = [
  { label: 'Portal de Exercícios', href: '/login' },
  { label: 'Painel do Aluno', href: '/login' },
  { label: 'Cursos de Matemática', href: '#courses' },
  { label: 'Cursos de Química', href: '#courses' },
  { label: 'Cursos de Física', href: '#courses' },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://www.facebook.com', label: 'Facebook' },
  { icon: Linkedin, href: 'https://www.Linkedin.com', label: 'Linkedin' },
  { icon: Instagram, href: 'https://www.instagram.com', label: 'Instagram' },
];

// ============== Animation Variants ==============
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5,
      delay: delay * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  })
};

// ============== Footer Component ==============
export const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });

  // Newsletter State
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newsletter_subscribed') === 'true';
    }
    return false;
  });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Coleta e sanitização básica
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('[Newsletter] Iniciando processo de cadastro para:', sanitizedEmail);
    
    // 2. Validações iniciais
    if (!sanitizedEmail) {
      setStatus('error');
      setMessage('Por favor, insira seu e-mail.');
      return;
    }

    // Regex mais robusto para validação de e-mail
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      console.warn('[Newsletter] Formato de e-mail inválido:', sanitizedEmail);
      setStatus('error');
      setMessage('Por favor, insira um e-mail válido.');
      return;
    }

    if (sanitizedEmail.length > 250) {
      setStatus('error');
      setMessage('E-mail muito longo (máximo 250 caracteres).');
      return;
    }

    setStatus('loading');

    // 3. Integração com Supabase com Timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // Verificar existência
      console.log('[Newsletter] Verificando se e-mail já existe na tabela tbf_rss...');
      const { data: existing, error: fetchError } = await supabase
        .from('tbf_rss')
        .select('email')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existing) {
        // Se já existir, garantir que está habilitado=true
        const { error: updateError } = await supabase
          .from('tbf_rss')
          .update({ habilitado: true })
          .eq('email', sanitizedEmail);

        if (updateError) {
          throw updateError;
        }

        console.info('[Newsletter] E-mail já cadastrado e re-habilitado:', sanitizedEmail);
        setStatus('success');
        setMessage('E-mail cadastrado com sucesso!');
        setEmail('');
        setIsSubscribed(true);
        localStorage.setItem('newsletter_subscribed', 'true');
        
        clearTimeout(timeoutId);
        
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
        return;
      }

      // Inserção
      console.log('[Newsletter] Inserindo novo registro na tabela tbf_rss...');
      const { error: insertError } = await supabase
        .from('tbf_rss')
        .insert([{ 
          email: sanitizedEmail,
          habilitado: true
        }]);

      clearTimeout(timeoutId);

      if (insertError) {
        throw insertError;
      }

      console.log('[Newsletter] Cadastro realizado com sucesso!');
      setStatus('success');
      setMessage('E-mail cadastrado com sucesso!');
      setEmail('');
      setIsSubscribed(true);
      localStorage.setItem('newsletter_subscribed', 'true');

      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Newsletter] Erro durante o processo:', error);
      setStatus('error');
      
      if (error.name === 'AbortError') {
        setMessage('Tempo de conexão esgotado. Tente novamente.');
      } else {
        setMessage('Erro ao processar cadastro. Tente mais tarde.');
      }
    }
  };

  return (
    <footer 
      ref={footerRef}
      className="footer bg-[#E8F1FF] relative z-10"
    >
      {/* ==================== Decorative Shapes ==================== */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-32 right-[10%] w-8 h-8 pointer-events-none z-10"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img 
        src="/images/shapes/shape6.png" 
        alt="" 
        className="absolute top-20 left-[5%] w-8 h-8 pointer-events-none z-10"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* ==================== Main Footer Content ==================== */}
      <div className="py-16 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            
            {/* ===== Column 1: Logo & Description ===== */}
            <motion.div 
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="footer-item xl:col-span-1"
            >
              <div className="footer-item__logo mb-6">
                <a href="/">
                  <img src="/logo.png" alt="EduAll Logo" className="h-10 w-auto" />
                </a>
              </div>
              <p className="text-[#798090] text-sm leading-relaxed mb-6">
                ProfDiogo é uma plataforma de ensino online que oferece cursos de Matemática, Química e Física.
              </p>
              <ul className="social-list flex items-center gap-5">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.label}>
                    <a 
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D6EFD] text-xl hover:text-[#F2416E] transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ===== Column 2: Navigation ===== */}
            <motion.div 
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="footer-item"
            >
              <h4 className="text-[#222E48] font-bold text-lg mb-6">Navigation</h4>
              <ul className="footer-menu space-y-3">
                {NAVIGATION_LINKS.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-[#798090] text-sm hover:text-[#0D6EFD] hover:underline transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ===== Column 3: Category ===== */}
            <motion.div 
              custom={6}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="footer-item"
            >
              <h4 className="text-[#222E48] font-bold text-lg mb-6">Categorias</h4>
              <ul className="footer-menu space-y-3">
                {CATEGORY_LINKS.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-[#798090] text-sm hover:text-[#0D6EFD] hover:underline transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ===== Column 4: Contact Us ===== */}
            <motion.div 
              custom={8}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="footer-item"
            >
              <h4 className="text-[#222E48] font-bold text-lg mb-6">Contact Us</h4>
              
              {/* Phone */}
              <div className="flex items-start gap-4 mb-5">
                <span className="text-[#25D366] text-2xl flex-shrink-0">
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-6 h-6 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </span>
                <div className="text-sm">
                  <a 
                    href="https://wa.me/556692299439" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#798090] block hover:text-[#25D366] transition-colors"
                  >
                    (66) 9229-9439
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 mb-5">
                <span className="text-[#0D6EFD] text-2xl flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </span>
                <div className="text-sm">
                  <a href="mailto:dwallo@gmail.com" className="text-[#798090] block hover:text-[#0D6EFD] transition-colors mb-1">
                    profdiogospera@gmail.com
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <span className="text-[#0D6EFD] text-2xl flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </span>
                <div className="text-sm">
                  <span className="text-[#798090] block mb-1">Sorriso </span>
                  <span className="text-[#798090] block text-sm">MT</span>
                </div>
              </div>
            </motion.div>

            {/* ===== Column 5: Newsletter ===== */}
            <motion.div 
              custom={10}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="footer-item"
            >
              <h4 className="text-[#222E48] font-bold text-lg mb-6">Inscreva-se</h4>
              <p className="text-[#798090] text-sm leading-relaxed mb-5">
                {isSubscribed ? 'Você já está inscrito em nossa newsletter!' : 'Entre com seu e-mail para saber das novidades...'}
              </p>
              <form className="relative" onSubmit={handleNewsletterSubmit}>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSubscribed ? "Já inscrito" : "Email..."}
                  className="w-full bg-white border border-[#EBECEF] rounded-full h-12 pl-5 pr-14 text-sm focus:border-[#0D6EFD] focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                  disabled={status === 'loading' || isSubscribed}
                />
                <button 
                  type="submit"
                  disabled={status === 'loading' || isSubscribed}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[#0D6EFD] text-white rounded-full hover:bg-[#222E48] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Subscribe"
                >
                  {status === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              
              <AnimatePresence>
                {status !== 'idle' && status !== 'loading' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "mt-3 flex items-center gap-2 text-xs font-medium",
                      status === 'success' ? "text-green-600" : "text-red-500"
                    )}
                  >
                    {status === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ==================== Bottom Footer ==================== */}
      <div className="container mx-auto max-w-7xl px-4">
        <div className="bottom-footer bg-[#E8F1FF] border-t border-dashed border-[#0D6EFD]/20 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[#798090] text-sm">
              Copyright © 2025 <span className="font-semibold">ProfDiogo</span> All Rights Reserved.
            </p>
            <div className="footer-links flex gap-6">
              <a href="#privacy" className="text-[#798090] text-sm hover:text-[#0D6EFD] hover:underline transition-colors">
                Política de Provacidade
              </a>
              <a href="#terms" className="text-[#798090] text-sm hover:text-[#0D6EFD] hover:underline transition-colors">
                Termos & Conditições
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
