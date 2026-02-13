import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ArrowUpRight, Tag } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// ============== Animation Variants ==============
const bounceInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8 
    } 
  }
};

const bounceInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8,
      delay: 0.5
    } 
  }
};

const bounceInUp = {
  hidden: { opacity: 0, y: 100 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
      duration: 0.8,
      delay: 0.5
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
      delay: 0.5
    } 
  }
};

const fadeDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: 'easeOut' as const } 
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: 'easeOut' as const } 
  }
};

const fadeLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, ease: 'easeOut' as const } 
  }
};

const fadeRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, ease: 'easeOut' as const } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const HERO_IMAGES = [
  '/hero1.png',
  '/hero2.png',
  '/hero3.png',
];

// ============== HeroSection Component ==============
export const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 3D Tilt Effect
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;
      
      container.style.transform = `perspective(5000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = () => {
      container.style.transform = 'perspective(5000px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="hero-section"
      className="banner relative py-16 lg:py-20 overflow-hidden bg-white"
    >
      
      {/* ==================== Decorative Shapes (with animations) ==================== */}
      {/* Shape 1 - rotation animation */}
      <motion.img 
        src="/images/shapes/shape1.png" 
        alt="" 
        className="absolute top-20 right-[10%] w-8 h-8 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Shape 2 - scalation (pulse) animation */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-32 left-[5%] w-6 h-6 pointer-events-none"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Shape 3 - walking (bounce) animation */}
      <motion.img 
        src="/images/shapes/shape3.png" 
        alt="" 
        className="absolute bottom-40 left-[8%] w-10 h-10 pointer-events-none"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Shape 4 - scalation animation */}
      <motion.img 
        src="/images/shapes/shape4.png" 
        alt="" 
        className="absolute top-[40%] right-[3%] w-5 h-5 pointer-events-none"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Shape 5 - walking animation */}
      <motion.img 
        src="/images/shapes/shape5.png" 
        alt="" 
        className="absolute bottom-24 right-[12%] w-8 h-8 pointer-events-none"
        animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ==================== Main Content ==================== */}
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          
          {/* ========== Left Column: Content ========== */}
          <motion.div 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="banner-content lg:pr-8"
          >
            {/* Badge with fade-down animation */}
            <motion.div 
              variants={fadeDown}
              className="flex items-center gap-2 mb-4"
            >
              <span className="w-2 h-2 bg-[#0D6EFD] rounded-full" />
              <h5 className="text-[#0D6EFD] font-semibold text-sm tracking-wide mb-0">
                Aqui o Conhecimento te Spera!
              </h5>
            </motion.div>

            {/* Main Headline with bounceInLeft animation */}
            <motion.h1 
              variants={bounceInLeft}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] text-[#222E48] mb-6"
            >
              A escolha certa para o{' '}
              <motion.span 
                variants={bounceInRight}
                className="text-[#F97316] inline-block"
              >
                Sucesso.
              </motion.span>
              <br className="hidden sm:block" />
              Confira nosso{' '}
              <motion.span 
                variants={bounceInUp}
                className="text-[#0D6EFD] inline-block"
              >
                Portal de Atividades.
              </motion.span>
            </motion.h1>

            {/* Description with bounceInUp animation */}
            <motion.p 
              variants={bounceInUp}
              className="text-[#798090] text-base lg:text-lg max-w-xl leading-relaxed mb-10"
            >
              Aprenda com quem une a experiência do ensino presencial personalizado com a agilidade das ferramentas digitais. Professor particular e Portal do Aluno em um só lugar.
            </motion.p>

            {/* CTA Buttons with AOS-like animations */}
            <motion.div 
              variants={fadeUp}
              className="flex flex-wrap gap-4 lg:gap-6"
            >
              <motion.a 
                href="#courses"
                variants={fadeRight}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-semibold px-6 lg:px-8 py-3.5 lg:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Nossos Cursos
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.a>
              <motion.a 
                href="#about"
                variants={fadeLeft}
                whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(13, 110, 253, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 border-2 border-[#0D6EFD] text-[#0D6EFD] font-semibold px-6 lg:px-8 py-3.5 lg:py-4 rounded-full transition-all duration-300"
              >
                Nossa Escola
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* ========== Right Column: Banner Image + Floating Cards ========== */}
          <motion.div 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={bounceIn}
            className="banner-thumb relative h-full flex flex-col justify-center"
          >
            {/* Main Banner Image with 3D Tilt Effect and Auto-sliding Carousel */}
            <div 
              ref={imageContainerRef}
              className="banner-thumb__img-container relative w-full h-full min-h-[400px] rounded-xl shadow-xl overflow-hidden cursor-pointer transition-transform duration-300 ease-out"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImageIndex}
                  src={HERO_IMAGES[currentImageIndex]} 
                  alt="Student learning online"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>

            {/* Curve Arrow - Decorative */}
            <img 
              src="/images/shapes/curve-arrow.png" 
              alt="" 
              className="curve-arrow absolute -top-6 -left-8 lg:-left-12 w-16 lg:w-20 h-auto hidden lg:block opacity-70"
            />

            {/* ===== Floating Card 1: Enrolled Students (bounceIn with 3D) ===== */}
            <motion.div 
              variants={bounceIn}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
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


            {/* ===== Floating Card 2: Discount Badge (fade-up) ===== */}
            <motion.div 
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="absolute bottom-16 lg:bottom-20 -left-4 lg:-left-16 z-20"
            >
              <motion.div
                animate={{ y: [0, 25, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.1, x: 10 }}
                  className="banner-box bg-white px-5 lg:px-6 py-3 lg:py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex items-center gap-3 lg:gap-4"
                >
                  <span className="banner-box__icon w-10 h-10 lg:w-12 lg:h-12 bg-[#8255F7] text-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Tag className="w-5 h-5 lg:w-6 lg:h-6" />
                  </span>
                  <div>
                    <h6 className="text-lg lg:text-xl font-black text-[#222E48] mb-0.5">20% DESC.</h6>
                    <span className="text-[#798090] text-xs lg:text-sm">Novos Estudantes</span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ===== Floating Card 3: Online Support (fade-left) ===== */}
            <motion.div 
              variants={fadeLeft}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-8 z-20"
            >
              <motion.div
                animate={{ y: [0, -30, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.1, x: -10 }}
                  className="banner-box bg-white px-5 lg:px-6 py-3 lg:py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex items-center gap-3 lg:gap-4"
                >
                  <span className="banner-box__icon w-10 h-10 lg:w-12 lg:h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-5 h-5 lg:w-6 lg:h-6 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </span>
                  <div className="hidden sm:block">
                    <span className="text-[#798090] text-xs lg:text-sm block">Suporte ao Aluno</span>
                    <a 
                      href="https://wa.me/556692299439" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D6EFD] font-bold text-base lg:text-lg hover:text-[#0b5ed7] transition-colors mt-1 block"
                    >
                      (66) 9229-9439
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
