import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowUpRight, BookOpen, CheckCircle, ChevronRight, Home, Mail, MapPin, MessageSquare, Phone, Send, Star, User, XCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { CertificateSection } from '../components/features/CertificateSection';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';

// Importar ALTCHA widget e traduções em português
import 'altcha';
import 'altcha/i18n/pt-br';

// Tipos para o estado do formulário
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

export const Contato: React.FC = () => {
  // Estados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Função para formatar celular (99) 99999-9999
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 0) formatted = `(${numbers.slice(0, 2)}`;
      if (numbers.length > 2) formatted += `) ${numbers.slice(2, 7)}`;
      if (numbers.length > 7) formatted += `-${numbers.slice(7, 11)}`;
      return formatted;
    }
    return value.slice(0, 15);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Estado do captcha
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const altchaContainerRef = useRef<HTMLDivElement>(null);

  // Efeito para configurar o ALTCHA widget de forma estável
  useEffect(() => {
    const container = altchaContainerRef.current;
    if (!container) return;

    // Injetar o widget apenas uma vez se ainda não estiver lá
    if (!container.innerHTML) {
      container.innerHTML = `<altcha-widget
        id="altcha-contact"
        language="pt-br"
        test
        hidefooter
        style="--altcha-max-width: 100%; --altcha-color-border: #e2e8f0; --altcha-color-border-focus: #3b82f6; --altcha-color-accent: #3b82f6; --altcha-color-accent-text: #ffffff;"
      ></altcha-widget>`;
    }

    const widget = container.querySelector('altcha-widget');
    
    const handleStateChange = (ev: any) => {
      console.log('ALTCHA state changed:', ev.detail.state);
      setIsCaptchaVerified(ev.detail.state === 'verified');
    };

    if (widget) {
      widget.addEventListener('statechange', handleStateChange);
      // Verificar estado inicial caso já esteja verificado
      if ((widget as any).state === 'verified') {
        setIsCaptchaVerified(true);
      }
    }

    return () => {
      if (widget) {
        widget.removeEventListener('statechange', handleStateChange);
      }
    };
  }, [formStatus]); // Re-executa se o formStatus mudar para permitir reset após sucesso/erro

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setErrors({});
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    // 1 - Validação do Nome (Pelo menos duas palavras com espaço)
    const nameTrimmed = name.trim();
    const nameWords = nameTrimmed.split(/\s+/);
    if (nameWords.length < 2 || nameWords.some(word => word.length < 2)) {
      newErrors.name = 'Por favor, insira seu nome completo (pelo menos duas palavras).';
    }

    // 2 - Validação do Email (1 @ e pelo menos 1 .)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido (ex: nome@email.com).';
    }

    // 3 - Validação do Telefone (mínimo de caracteres se preenchido)
    if (phone && phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Por favor, insira um número de celular válido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Verificar se o captcha foi resolvido
    if (!isCaptchaVerified) {
      alert('Por favor, resolva o captcha antes de enviar.');
      return;
    }
    
    setIsLoading(true);
    setFormStatus('loading');

    try {
      // 1 - Salvar mensagem na tabela tbf_mensagens
      const { error: messageError } = await supabase
        .from('tbf_mensagens')
        .insert([
          { 
            nome: name, 
            email: email, 
            celular: phone, 
            mensagem: message,
            respondido: 'N'
          }
        ]);

      if (messageError) throw messageError;

      // 2 - Verificar se o email já existe na tabela tbf_rss
      const { data: existingRss, error: rssCheckError } = await supabase
        .from('tbf_rss')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (rssCheckError) {
        console.error('Erro ao verificar newsletter:', rssCheckError);
      } else if (!existingRss) {
        // Se não existir, adicionar à tabela tbf_rss com habilitado=true
        const { error: rssInsertError } = await supabase
          .from('tbf_rss')
          .insert([{ 
            email: email.trim().toLowerCase(),
            habilitado: true 
          }]);
        
        if (rssInsertError) {
          console.error('Erro ao adicionar à newsletter:', rssInsertError);
        }
      } else {
        // Se já existir, garantir que está habilitado=true
        const { error: rssUpdateError } = await supabase
          .from('tbf_rss')
          .update({ habilitado: true })
          .eq('email', email.trim().toLowerCase());

        if (rssUpdateError) {
          console.error('Erro ao atualizar newsletter:', rssUpdateError);
        }
      }

      setFormStatus('success');
      // Limpar formulário após sucesso
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setIsCaptchaVerified(false);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setFormStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormStatus('idle');
    setIsCaptchaVerified(false);
    // Resetar o widget ALTCHA
    if (altchaContainerRef.current) {
      const widget = altchaContainerRef.current.querySelector('altcha-widget') as any;
      if (widget && typeof widget.reset === 'function') {
        widget.reset();
      }
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
                  Contato
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
                    <span className="text-[#F2416E] font-medium">Contato</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Contact Info Section ==================== */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Section Heading */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h5 className="text-blue-600 font-semibold text-lg">Entre em Contato</h5>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Deixe-nos ajudá-lo
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Nossa plataforma é construída sobre os princípios de inovação, qualidade e inclusão, 
              visando proporcionar uma experiência de aprendizado perfeita.
            </p>
          </motion.div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Card 1 - Endereço */}
            <motion.div 
              className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-8 flex items-start gap-6 group hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <span className="w-14 h-14 bg-blue-600 group-hover:bg-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                <MapPin className="w-7 h-7 text-white group-hover:text-blue-600 transition-colors duration-300" />
              </span>
              <div className="flex-grow">
                <h4 className="text-xl font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                  Nossa Unidade
                </h4>
                <p className="text-slate-600 group-hover:text-blue-100 mb-4 transition-colors duration-300">
                  Av. Porto Alegre, 1000 - Centr, Sorriso - MT, 78890-100
                </p>
                <a 
                  href="https://maps.google.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 group-hover:text-white font-semibold underline transition-colors duration-300"
                >
                  Ver no Mapa
                </a>
              </div>
            </motion.div>

            {/* Card 2 - Email */}
            <motion.div 
              className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-8 flex items-start gap-6 group hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="w-14 h-14 bg-blue-600 group-hover:bg-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                <Mail className="w-7 h-7 text-white group-hover:text-blue-600 transition-colors duration-300" />
              </span>
              <div className="flex-grow">
                <h4 className="text-xl font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                  Endereço de E-mail
                </h4>
                <p className="text-slate-600 group-hover:text-blue-100 mb-1 transition-colors duration-300">
                  contato@profdiogospera.com.br
                </p>
                <p className="text-slate-600 group-hover:text-blue-100 mb-4 transition-colors duration-300">
                  suporte@profdiogospera.com.br
                </p>
                <a 
                  href="mailto:contato@profdiogospera.com.br" 
                  className="text-blue-600 group-hover:text-white font-semibold underline transition-colors duration-300"
                >
                  Enviar E-mail
                </a>
              </div>
            </motion.div>

            {/* Card 3 - Telefone */}
            <motion.div 
              className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-8 flex items-start gap-6 group hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 md:col-span-2 xl:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <span className="w-14 h-14 bg-blue-600 group-hover:bg-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                <Phone className="w-7 h-7 text-white group-hover:text-blue-600 transition-colors duration-300" />
              </span>
              <div className="flex-grow">
                <h4 className="text-xl font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                  Telefone
                </h4>
                <p className="text-slate-600 group-hover:text-blue-100 mb-1 transition-colors duration-300">
                  (66) 99999-7654
                </p>
                <a 
                  href="tel:+5511999999999" 
                  className="text-blue-600 group-hover:text-white font-semibold underline transition-colors duration-300"
                >
                  Ligue Agora!
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== Contact Form Section ==================== */}
      <section className="py-24 lg:py-32 bg-[#F7F9FC] relative z-10">
        {/* Background Wave */}
        <img 
          src="/images/bg/wave-bg.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-50 hidden lg:block"
        />
        
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              className="lg:pr-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  <h5 className="text-blue-600 font-semibold text-lg">Fale Conosco</h5>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Tem dúvidas? Não hesite em entrar em contato
                </h2>
                <p className="text-slate-600 leading-relaxed max-w-xl">
                  Somos apaixonados por transformar vidas através da educação. Fundados com a visão 
                  de tornar o aprendizado acessível a todos, acreditamos no poder do conhecimento 
                  para desbloquear oportunidades e moldar o futuro.
                </p>
              </div>

            <motion.div 
              variants={bounceIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="absolute -top-4 lg:-top-6 left-0 lg:-left-12 z-20"
            >
              <motion.div
                whileHover={{ scale: 1.1, y: -10 }}
                className="banner-box bg-white px-5 lg:px-6 py-3 lg:py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] cursor-pointer"
                style={{
                  willChange: 'transform',
                }}
              >
              <p className="text-sm font-semibold text-[#798090]">
                <span className="text-[#0D6EFD] text-lg lg:text-xl font-bold block">20+</span>
                Estudantes Cadastrados
              </p>
              <div className="mt-3">
                <p className="text-xs font-bold text-[#798090] mb-2 uppercase tracking-wider">3 Disciplinas:</p>
                <div className="enrolled-students flex -space-x-2">
                  {['/simbfis.png', '/simbmat.png', '/simbqui.png'].map((src, idx) => (
                    <img 
                      key={idx}
                      src={src} 
                      alt={`Disciplina ${idx + 1}`}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white object-cover transition-all duration-200 hover:scale-125 hover:z-10 hover:-translate-y-1 cursor-pointer bg-white"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
            </motion.div>

                {/* Rating */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-amber-400 fill-amber-400/50'}`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-700 font-medium">20 avaliações (4.95 de 5)</span>
                </div>
            </motion.div>

            {/* Right - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
                <div className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-6 lg:p-8">
                  <AnimatePresence mode="wait">
                    {/* Formulário */}
                    {formStatus === 'idle' || formStatus === 'loading' ? (
                      <motion.form 
                        key="form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <h4 className="text-2xl font-bold text-slate-900 mb-0">Entre em Contato</h4>
                        <div className="border-t border-dashed border-slate-300 my-6"></div>

                        {/* Nome */}
                        <div className="mb-6">
                          <label htmlFor="name" className="block text-slate-700 font-medium mb-3">
                            Nome <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              id="name"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: undefined });
                              }}
                              placeholder="Digite seu nome completo..."
                              className={`w-full px-5 py-4 pl-12 rounded-full border-0 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                errors.name ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                              }`}
                              required
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          </div>
                          {errors.name && (
                            <p className="text-red-500 text-xs mt-2 ml-4 font-medium">{errors.name}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="mb-6">
                          <label htmlFor="contactEmail" className="block text-slate-700 font-medium mb-3">
                            E-mail <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="email" 
                              id="contactEmail"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: undefined });
                              }}
                              placeholder="Digite seu e-mail..."
                              className={`w-full px-5 py-4 pl-12 rounded-full border-0 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                errors.email ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                              }`}
                              required
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          </div>
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-2 ml-4 font-medium">{errors.email}</p>
                          )}
                        </div>

                        {/* Celular */}
                        <div className="mb-6">
                          <label htmlFor="contactPhone" className="block text-slate-700 font-medium mb-3">
                            Celular
                          </label>
                          <div className="relative">
                            <input 
                              type="tel" 
                              id="contactPhone"
                              value={phone}
                              onChange={(e) => {
                                handlePhoneChange(e);
                                if (errors.phone) setErrors({ ...errors, phone: undefined });
                              }}
                              placeholder="(99) 99999-9999"
                              className={`w-full px-5 py-4 pl-12 rounded-full border-0 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                              }`}
                            />
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          </div>
                          {errors.phone && (
                            <p className="text-red-500 text-xs mt-2 ml-4 font-medium">{errors.phone}</p>
                          )}
                        </div>

                        {/* Mensagem */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <label htmlFor="contactMessage" className="block text-slate-700 font-medium">
                              Mensagem <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs font-medium ${message.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                              {message.length}/500
                            </span>
                          </div>
                          <div className="relative">
                            <textarea 
                              id="contactMessage"
                              value={message}
                              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                              placeholder="Digite sua mensagem..."
                              rows={4}
                              maxLength={500}
                              className="w-full px-5 py-4 pl-12 rounded-3xl border-0 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                              required
                            />
                            <MessageSquare className="absolute left-4 top-5 w-5 h-5 text-slate-400" />
                          </div>
                        </div>

                        {/* ALTCHA Anti-Spam Captcha */}
                        <div className="mb-6">
                          <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <div ref={altchaContainerRef} />
                            {!isCaptchaVerified && (
                              <p className="text-xs text-slate-500 mt-2 text-center">
                                Resolva o captcha acima para enviar a mensagem
                              </p>
                            )}
                            {isCaptchaVerified && (
                              <p className="text-xs text-green-600 mt-2 text-center font-medium">
                                ✓ Verificado! Você pode enviar a mensagem.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button 
                          type="submit"
                          disabled={isLoading || !isCaptchaVerified}
                          className={`w-full flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 group mt-4 ${
                            isCaptchaVerified 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30' 
                              : 'bg-slate-400 cursor-not-allowed'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                          whileHover={{ scale: (isLoading || !isCaptchaVerified) ? 1 : 1.02 }}
                          whileTap={{ scale: (isLoading || !isCaptchaVerified) ? 1 : 0.98 }}
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
                              Enviando...
                            </>
                          ) : !isCaptchaVerified ? (
                            <>
                              🔒 Resolva o captcha primeiro
                            </>
                          ) : (
                            <>
                              Enviar Mensagem
                              <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    ) : formStatus === 'success' ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                      >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                          Mensagem Enviada!
                        </h3>
                        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                          Obrigado por entrar em contato! Recebemos sua mensagem e responderemos 
                          o mais breve possível.
                        </p>
                        <motion.button
                          onClick={resetForm}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-green-500/25 transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Enviar Nova Mensagem
                          <ArrowUpRight className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                      >
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                          Erro ao Enviar
                        </h3>
                        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                          Ocorreu um erro ao enviar sua mensagem. Por favor, verifique 
                          os campos e tente novamente.
                        </p>
                        <motion.button
                          onClick={resetForm}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-blue-600/25 transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Tentar Novamente
                          <ArrowUpRight className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ==================== Certificate/CTA Section ==================== */}
      <CertificateSection />

      <Footer />
    </div>
  );
};

export default Contato;
