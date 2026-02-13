import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
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
  hidden: { opacity: 0, x: 50, y: 50 },
  visible: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  }
};

// ============== CertificateSection Component ==============
export const CertificateSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <div 
      ref={sectionRef}
      id="certificate-section" 
      className="certificate relative"
    >
      {/* Background pseudo-element - bottom 50% has footer color */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, #E8F1FF 50%)'
        }}
      />

      {/* Spacer for desktop to allow image overflow */}
      <div className="hidden xl:block h-44" />

      {/* Container - container--lg */}
      <div className="container mx-auto max-w-[1400px] px-4 relative z-10">
        {/* Certificate Box - Blue rounded container */}
        <div className="certificate-box bg-[#0D6EFD] rounded-2xl px-4 md:px-8 lg:px-16 relative">
          <div className="mx-auto max-w-7xl">
            {/* Position relative for the thumb positioning */}
            <div className="relative py-16 lg:py-20">
              <div className="flex flex-col xl:flex-row xl:items-center">
                
                {/* ==================== Left Column - Content ==================== */}
                <div className="w-full xl:w-1/2 relative z-10">
                  <div className="certificate__content text-center xl:text-left">
                    {/* Badge Header */}
                    <motion.div 
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      variants={bounceInDown}
                      className="flex items-center justify-center xl:justify-start gap-2 mb-4"
                    >
                      <span className="w-2 h-2 bg-white rounded-full" />
                      <h5 className="text-white font-semibold text-base mb-0">Matricule-se</h5>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h2 
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      variants={bounceIn}
                      className="text-3xl sm:text-4xl lg:text-[42px] lg:leading-[1.2] font-medium text-white mb-10"
                    >
                      Venha para nossa escola e experimente o melhor do ensino híbrido organizado e personalizado.
                    </motion.h2>

                    {/* CTA Button */}
                    <motion.a 
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      variants={bounceInUp}
                      href="#get-started"
                      className="inline-flex items-center gap-2 bg-white text-[#0D6EFD] px-8 py-4 rounded-full font-semibold hover:bg-[#222E48] hover:text-white transition-all duration-300"
                    >
                      Entre em Contato
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.a>
                  </div>
                </div>

                {/* ==================== Right Column - Image ==================== */}
                <div className="w-full xl:w-1/2 hidden xl:block" />
              </div>

              {/* ==================== Absolutely positioned image ==================== */}
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeUpLeft}
                className="certificate__thumb hidden xl:block absolute"
                style={{
                  bottom: 0,
                  left: '55%',
                  transform: 'translateY(0)'
                }}
              >
                <motion.img 
                  src="/images/thumbs/certificate-img.png" 
                  alt="Student with certificate"
                  style={{
                    maxHeight: '480px',
                    width: 'auto',
                    marginTop: '-120px' // This makes the image "break out" of the top
                  }}
                  whileHover={{ 
                    rotateX: 3, 
                    rotateY: -3, 
                    scale: 1.02 
                  }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateSection;
