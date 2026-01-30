import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useRef, useState } from 'react';

// ============== Features Data ==============
interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  link: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: '/images/icons/feature-icon1.png',
    title: 'Atenção Individual',
    description: 'O cuidado de um professor particular focado nas suas dificuldades específicas, garantindo que nenhuma dúvida fique para trás.',
    link: '#courses',
  },
  {
    icon: '/images/icons/feature-icon2.png',
    title: 'Portal Digital',
    description: 'Plataforma completa com videoaulas, listas de exercícios e materiais de apoio organizados para facilitar seus estudos.',
    link: '#courses',
  },
  {
    icon: '/images/icons/feature-icon3.png',
    title: 'Exercícios Práticos',
    description: 'Foco total em resolução de problemas e preparação para provas, com listas personalizadas para o seu nível.',
    link: '#courses',
  },
  {
    icon: '/images/icons/feature-icon1.png',
    title: 'Acompanhamento Contínuo',
    description: 'Monitoramento constante do seu progresso com feedback detalhado e ajustes no plano de estudos conforme sua evolução.',
    link: '#courses',
  },
];

// ============== Animation Variants ==============
const bounceIn = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8 
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

const zoomIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (delay: number) => ({ 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.5,
      delay: delay * 0.15,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  })
};

// ============== Feature Card Component ==============
interface FeatureCardProps {
  feature: FeatureItem;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <motion.div
      custom={index}
      variants={zoomIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="px-2 lg:px-3 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3"
    >
      <div className="features-item group bg-[#E8F1FF] border border-[#EBECEF] rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:bg-[#0D6EFD] hover:border-[#0D6EFD] cursor-pointer">
        {/* Icon */}
        <motion.span 
          className="mb-6 lg:mb-8 w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center bg-white rounded-full shadow-md"
          whileHover={{ 
            y: [0, -10, 0],
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          <img 
            src={feature.icon} 
            alt={feature.title}
            className="w-12 h-12 lg:w-14 lg:h-14 object-contain"
          />
        </motion.span>
        
        {/* Title */}
        <h4 className="text-lg lg:text-xl font-bold text-[#222E48] mb-3 lg:mb-4 transition-colors duration-300 group-hover:text-white">
          {feature.title}
        </h4>
        
        {/* Description */}
        <p className="text-[#798090] text-sm lg:text-base leading-relaxed line-clamp-2 transition-colors duration-300 group-hover:text-white/80">
          {feature.description}
        </p>
        
        {/* Link */}
        <a 
          href={feature.link}
          className="inline-flex items-center gap-2 text-[#0D6EFD] font-medium mt-5 lg:mt-6 transition-all duration-300 group-hover:text-white hover:underline"
        >
          Saiba Mais
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </motion.div>
  );
};

// ============== FeaturesSection Component ==============
export const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Update items per page based on window width
  React.useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) { // Mobile
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) { // Tablet
        setItemsPerPage(2);
      } else { // Desktop
        setItemsPerPage(3);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const totalSlides = Math.ceil(FEATURES.length / itemsPerPage);

  // Clamp currentSlide when totalSlides changes
  React.useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section 
      ref={sectionRef}
      id="features-section"
      className="features py-20 lg:py-28 relative overflow-hidden bg-white"
    >
      {/* ==================== Decorative Shapes ==================== */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-20 left-[5%] w-8 h-8 pointer-events-none"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img 
        src="/images/shapes/shape4.png" 
        alt="" 
        className="absolute bottom-32 right-[8%] w-6 h-6 pointer-events-none"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto max-w-7xl px-4">
        {/* ==================== Section Heading ==================== */}
        <div className="section-heading text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <motion.h2 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={bounceIn}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222E48] mb-4 lg:mb-6"
          >
            Por que escolher o Professor Diogo?
          </motion.h2>
          <motion.p 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={bounceInUp}
            className="text-[#798090] text-base lg:text-lg leading-relaxed"
          >
            A Mentoria Híbrida de Resultados combina a atenção individual de um professor particular com a tecnologia de um portal digital completo, oferecendo o suporte necessário para sua aprovação.
          </motion.p>
        </div>

        {/* ==================== Features Slider ==================== */}
        <div className="features-slider relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              ref={sliderRef}
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-wrap -mx-2 lg:-mx-3"
            >
              {FEATURES.slice(
                currentSlide * itemsPerPage,
                currentSlide * itemsPerPage + itemsPerPage
              ).map((feature, idx) => (
                <FeatureCard 
                  key={`${currentSlide}-${idx}`} 
                  feature={feature} 
                  index={idx} 
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ==================== Navigation Arrows ==================== */}
        <div className="flex items-center justify-center gap-4 mt-10 lg:mt-12">
          <motion.button 
            onClick={handlePrev}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-[#EBECEF] text-[#798090] hover:border-[#0D6EFD] hover:bg-[#0D6EFD] hover:text-white transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          {/* Dots Indicator */}
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx 
                    ? 'bg-[#0D6EFD] w-6' 
                    : 'bg-[#EBECEF] hover:bg-[#0D6EFD]/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <motion.button 
            onClick={handleNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-[#EBECEF] text-[#798090] hover:border-[#0D6EFD] hover:bg-[#0D6EFD] hover:text-white transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
