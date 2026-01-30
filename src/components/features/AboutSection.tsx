import { motion, useInView } from 'framer-motion';
import { ArrowUpRight, Play } from 'lucide-react';
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

const fadeUpLeft = {
  hidden: { opacity: 0, x: 20, y: 20 },
  visible: (delay: number) => ({ 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: { 
      duration: 0.5,
      delay: delay * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  })
};

const zoomOut = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  }
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
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
      className={`${className}`}
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

// ============== AboutSection Component (Why Choose Us) ==============
export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const checklistItems = [
    { text: 'Teoria + Prática Imediata', delay: 2 },
    { text: 'Mentoria Humana Personalizada', delay: 4 },
    { text: 'Foco Total em Vestibulares', delay: 5 },
  ];

  return (
    <section 
      ref={sectionRef}
      id="about-section"
      className="choose-us py-16 sm:py-20 lg:py-28 relative z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f7 50%, #f0f8ff 100%)'
      }}
    >
      {/* ==================== Decorative Shapes ==================== */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-10 sm:top-20 left-[5%] w-6 h-6 sm:w-10 sm:h-10 pointer-events-none z-10"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute bottom-10 sm:bottom-20 right-[5%] w-6 h-6 sm:w-10 sm:h-10 pointer-events-none z-10"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* ==================== Left Column ==================== */}
          <div className="w-full">
            <div className="choose-us__content">
              {/* h5 - Aligned with top of image */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={bounceInDown}
                className="flex items-center gap-2 mb-4"
              >
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#0D6EFD] rounded-full" />
                <h5 className="text-[#0D6EFD] font-bold text-sm sm:text-base mb-0 uppercase tracking-wider">Metodologia Exclusiva</h5>
              </motion.div>

              <div className="mb-8">
                <motion.h2 
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={bounceIn}
                  className="text-2xl sm:text-4xl lg:text-[42px] font-bold text-[#222E48] mb-4 sm:mb-6 leading-tight"
                >
                  A Metodologia Híbrida Diogo Spera
                </motion.h2>
                <motion.p 
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={bounceInUp}
                  className="text-[#798090] text-sm sm:text-base lg:text-lg leading-relaxed"
                >
                  Unimos a atenção individual do professor com a organização da tecnologia para o seu filho não se perder nos estudos. Por que nosso método funciona onde os outros falham?
                </motion.p>
              </div>

              {/* Checklist */}
              <ul className="space-y-4 sm:space-y-5 mb-10">
                {checklistItems.map((item, index) => (
                  <motion.li 
                    key={index}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={fadeUpLeft}
                    custom={item.delay}
                    className="flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#0D6EFD]/10 text-[#0D6EFD] flex items-center justify-center rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span className="flex-grow text-[#404A60] text-sm sm:text-base font-medium">{item.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button (a) */}
              <div className="pt-6 sm:pt-8 border-t border-dashed border-[#EBECEF]">
                <motion.a 
                  href="#about"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-[#0D6EFD] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold hover:bg-[#0D6EFD]/90 transition-all shadow-lg shadow-[#0D6EFD]/25"
                >
                  Quero Conhecer o Método
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.a>
              </div>
            </div>
          </div>

          {/* ==================== Right Column - Image ==================== */}
          <div className="w-full lg:pt-2">
            <div className="choose-us__thumbs relative flex justify-center lg:justify-end items-start">

              {/* Offer Message - AVG Reviews Badge */}
              <motion.div 
                className="absolute top-0 right-0 sm:top-5 sm:right-5 md:top-10 md:right-10 z-30"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="px-3 py-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-white flex items-center gap-2 sm:gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#EBECEF]">
                  <span className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-[#FFB800] text-white flex items-center justify-center rounded-full shadow-lg shadow-[#FFB800]/20">
                    <img src="/images/icons/stars.png" alt="Stars" className="w-4 h-4 sm:w-6 sm:h-6" />
                  </span>
                  <div>
                    <span className="text-sm sm:text-xl text-[#222E48] font-bold block leading-none">
                      5
                      <span className="text-[#A8ADB8] text-[10px] sm:text-sm font-normal ml-1">(20)</span>
                    </span>
                    <span className="text-[#798090] text-[10px] sm:text-sm">Avaliação Média</span>
                  </div>
                </div>
              </motion.div>

              {/* Main Image Container */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={zoomOut}
                className="relative z-10 w-full sm:w-auto px-6 sm:px-0 sm:pr-20"
              >
                <div className="relative inline-block w-full sm:w-auto">
                  <TiltImage 
                    src="/estud1.png" 
                    alt="Choose Us" 
                    className="rounded-2xl sm:rounded-2xl w-[80%] h-auto shadow-2xl mx-auto lg:ml-auto lg:mr-0"
                  />
                  {/* Book Icon Badge */}
                  <motion.span 
                    className="absolute top-2 left-8 sm:top-10 sm:left-12 w-10 h-10 sm:w-20 sm:h-20 flex items-center justify-center bg-[#F2416E] rounded-lg sm:rounded-2xl z-20 shadow-xl shadow-[#F2416E]/30"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img src="/images/icons/book.png" alt="Book" className="w-5 h-5 sm:w-10 sm:h-10" />
                  </motion.span>
                </div>
              </motion.div>

              {/* Video Preview Circle */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={zoomIn}
                className="absolute -bottom-5 sm:-bottom-10 left-5 sm:left-10 md:left-20 z-40"
              >
                <div className="relative inline-block">
                  <img 
                    src="/vid1.png" 
                    alt="Video Preview" 
                    className="rounded-full border-4 sm:border-8 border-white w-24 h-24 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-cover shadow-2xl"
                  />
                  <a 
                    href="https://www.youtube.com/watch?v=MFLVmAE4cqg" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center bg-[#0D6EFD] text-white rounded-full text-lg sm:text-2xl hover:scale-110 transition-all duration-300 shadow-xl shadow-[#0D6EFD]/40"
                  >
                    <Play className="w-4 h-4 sm:w-8 sm:h-8 fill-current" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
