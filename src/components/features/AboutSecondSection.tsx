import { motion, useInView } from 'framer-motion';
import { ArrowUpRight, Watch } from 'lucide-react';
import React, { useRef } from 'react';

// ============== Animation Variants ==============
const bounceInDown = {
  hidden: { opacity: 0, y: -50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8 
    } 
  }
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8,
      delay: 0.1
    } 
  }
};

const bounceInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8,
      delay: 0.2
    } 
  }
};

const fadeLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: (delay: number) => ({ 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.6,
      delay: delay * 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  })
};

const fadeRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  }
};

// ============== Tilt Image Component ==============
interface TiltImageProps {
  src: string;
  alt: string;
  className?: string;
}

const TiltImage: React.FC<TiltImageProps> = ({ src, alt, className = '' }) => {
  return (
    <motion.img
      src={src}
      alt={alt}
      className={`rounded-xl w-full ${className}`}
      whileHover={{ 
        rotateX: 5, 
        rotateY: 5, 
        scale: 1.02 
      }}
      transition={{ duration: 0.5, ease: [0.03, 0.98, 0.52, 0.99] }}
      style={{ 
        willChange: 'transform',
        perspective: 5000,
        transformStyle: 'preserve-3d'
      }}
    />
  );
};

// ============== AboutSecondSection Component ==============
export const AboutSecondSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="about py-20 lg:py-28 relative z-10 bg-white overflow-hidden"
    >
      {/* ==================== Gradient Background ==================== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#0D6EFD]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F2416E]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* ==================== Decorative Shapes ==================== */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-20 left-[5%] w-6 h-6 pointer-events-none"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img 
        src="/images/shapes/shape6.png" 
        alt="" 
        className="absolute bottom-32 right-[10%] w-8 h-8 pointer-events-none"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative container mx-auto max-w-7xl px-4">
        <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-0 items-center">
          
          {/* ==================== Left Column - Images ==================== */}
          <div className="w-full lg:w-1/2 lg:pr-12">
            <div className="about-thumbs relative">
              {/* Decorative Shape */}
              <motion.img 
                src="/images/shapes/shape7.png" 
                alt="" 
                className="absolute -top-8 right-0 w-10 h-10 pointer-events-none z-10 hidden sm:block"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Offer Badge */}
              <motion.div 
                className="absolute top-24 -left-4 sm:top-20 sm:-left-10 z-20 cursor-pointer"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className="px-4 py-2 sm:px-5 sm:py-3 rounded-xl bg-[#FFF0F3] border border-[#EBECEF] flex items-center gap-3 sm:gap-4 shadow-sm"
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <span className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#F2416E] text-white text-xl sm:text-2xl flex items-center justify-center rounded-full">
                    <Watch className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <div>
                    <h6 className="font-bold text-[#222E48] mb-0 sm:mb-1 text-sm sm:text-base">20% Desc</h6>
                    <span className="text-xs sm:text-sm text-[#798090]">Para Novos Alunos</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Images Grid */}
              <div className="flex flex-col sm:flex-row gap-4 pt-20 sm:pt-16">
                {/* Left Image */}
                <div className="w-full sm:w-1/2">
                  <TiltImage 
                    src="/model1.png" 
                    alt="About Education"
                    className="h-full object-cover"
                  />
                </div>

                {/* Right Column */}
                <div className="w-full sm:w-1/2">
                  {/* Stats Boxes */}
                  <div className="flex gap-3 sm:gap-4 mb-4">
                    <motion.div 
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      variants={fadeRight}
                      className="bg-[#0D6EFD] rounded-xl text-center py-4 sm:py-5 px-2 sm:px-3 w-1/2"
                    >
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">10+</h1>
                      <span className="text-white/80 text-[10px] sm:text-xs lg:text-sm">Anos de experiência</span>
                    </motion.div>
                    <motion.div 
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      variants={fadeLeft}
                      custom={0}
                      className="bg-[#404A60] rounded-xl text-center py-4 sm:py-5 px-2 sm:px-3 w-1/2"
                    >
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">2k+</h1>
                      <span className="text-white/80 text-[10px] sm:text-xs lg:text-sm">Alunos Impactados</span>
                    </motion.div>
                  </div>

                  {/* Second Image */}
                  <TiltImage 
                    src="/model2.png" 
                    alt="About Learning"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== Right Column - Content ==================== */}
          <div className="w-full lg:w-1/2">
            <div className="about-content">
              {/* Header */}
              <div className="mb-10">
                <motion.div 
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={bounceInDown}
                  className="flex items-center gap-2 mb-4"
                >
                  <span className="w-2 h-2 bg-[#0D6EFD] rounded-full" />
                  <h5 className="text-[#0D6EFD] font-semibold text-base mb-0">Sobre o Método</h5>
                </motion.div>
                <motion.h2 
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={bounceIn}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222E48] mb-5"
                >
                  Compromisso com o Aprendizado Real
                </motion.h2>
                <motion.p 
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={bounceInUp}
                  className="text-[#798090] text-base lg:text-lg leading-relaxed line-clamp-2"
                >
                  Acreditamos que cada aluno é único e merece um acompanhamento que respeite seu ritmo, transformando dificuldades em conquistas reais e duradouras.
                </motion.p>
              </div>

              {/* Mission Block */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeLeft}
                custom={1}
                className="flex items-start gap-6 mb-8"
              >
                <span className="w-20 h-20 bg-[#E8F1FF] border border-[#EBECEF] flex items-center justify-center rounded-full flex-shrink-0">
                  <img src="/images/icons/about-img1.png" alt="Mission" className="w-10 h-10" />
                </span>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-[#222E48] mb-3">Nossa Missão</h4>
                  <p className="text-[#798090] leading-relaxed">
                    Auxiliar os alunos a terem um entendimento completo da matéria fora do ambiente escolar, contribuindo diretamente para a melhoria do seu desempenho acadêmico através de um ensino humanizado e organizado.
                  </p>
                </div>
              </motion.div>

              {/* Vision Block */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeLeft}
                custom={2}
                className="flex items-start gap-6 mb-0"
              >
                <span className="w-20 h-20 bg-[#E8F1FF] border border-[#EBECEF] flex items-center justify-center rounded-full flex-shrink-0">
                  <img src="/images/icons/about-img2.png" alt="Vision" className="w-10 h-10" />
                </span>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-[#222E48] mb-3">Nossa Visão</h4>
                  <p className="text-[#798090] leading-relaxed">
                    Ser o portal de base de estudo referência no mercado, reconhecido pela excelência tecnológica na gestão do aprendizado e pela qualidade pedagógica.
                  </p>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeLeft}
                custom={3}
                className="flex flex-wrap items-center gap-8 pt-10 border-t border-dashed border-[#EBECEF] mt-10"
              >
                <motion.a 
                  href="#courses"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-[#0D6EFD] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#0D6EFD]/90 transition-colors"
                >
                  Saiba Mais
                  <ArrowUpRight className="w-5 h-5" />
                </motion.a>
                
                <div className="flex items-center gap-4">
                  <img 
                    src="/diogo.jpg" 
                    alt="Diogo - Fundador" 
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-grow">
                    <span className="mb-1 block">
                      <img src="/sign.png" alt="Signature" className="h-6" />
                    </span>
                    <span className="text-sm text-[#798090]">Fundador & CEO</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSecondSection;
