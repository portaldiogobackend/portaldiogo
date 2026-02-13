import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

// ============== Brand Logos Data ==============
const BRAND_LOGOS = [
  '/compo1.png',
  '/compo2.png',
  '/compo3.png',
  '/compo4.png',
  '/compo5.png',
  '/compo6.png',
];

// ============== Animation Variant ==============
const fadeInUpBig = {
  hidden: {
    opacity: 0,
    y: 100
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  }
};

// ============== BrandSection Component ==============
export const BrandSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Duplicate logos for infinite scroll effect
  const duplicatedLogos = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];

  return (
    <motion.div 
      ref={sectionRef}
      id="brand-section"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUpBig}
      className="brand"
      style={{
        visibility: 'visible',
        animationDuration: '1s',
        animationDelay: '0.5s',
      }}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="brand-box py-16 lg:py-20 px-4 lg:px-8 bg-[#E8F1FF] border border-[#EBECEF] rounded-2xl">
          
          {/* Title */}
          <h4 className="mb-8 lg:mb-10 text-center text-[#404A60] font-semibold text-sm tracking-[0.1em] uppercase">
            CONHEÇA NOSSAS SESSÕES DE ACOMPANHAMENTO DE ESTUDOS
          </h4>
          
          {/* Brand Slider Container */}
          <div className="brand-slider-container overflow-hidden relative">
            {/* Gradient Masks for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-16 lg:w-24 bg-gradient-to-r from-[#E8F1FF] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 lg:w-24 bg-gradient-to-l from-[#E8F1FF] to-transparent z-10 pointer-events-none" />
            
            {/* Infinite Scroll Slider */}
            <motion.div
              className="brand-slider flex items-center gap-8 lg:gap-12"
              animate={{
                x: [0, -100 * BRAND_LOGOS.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
              style={{
                width: 'fit-content',
              }}
            >
              {duplicatedLogos.map((logo, idx) => (
                <motion.div 
                  key={idx}
                  className="brand-slider__item flex-shrink-0 px-4 lg:px-6"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={logo} 
                    alt={`Partner Brand ${(idx % BRAND_LOGOS.length) + 1}`}
                    className="h-10 lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default BrandSection;
