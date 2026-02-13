import { motion, useInView } from 'framer-motion';
import { ArrowRight, Calendar, MessageCircle, User } from 'lucide-react';
import React, { useRef } from 'react';

// ============== Types ==============
interface BlogPost {
  id: number;
  image: string;
  category: string;
  categoryColor: string;
  title: string;
  author: string;
  date: string;
  comments: number;
  excerpt: string;
  link: string;
}

// ============== Blog Data ==============
const BLOG_POSTS: BlogPost[] = [
{
    id: 1,
    image: 'public/blogimg1.png', // Nome de arquivo de exemplo
    category: 'Matemática',
    categoryColor: 'bg-[#ADD8E6]', // Cor Azul Claro (LightBlue)
    title: 'Desvendando os Mistérios da Trigonometria',
    author: 'Diogo',
    date: '15 Out, 25',
    comments: 2,
    excerpt: 'Descubra como seno, cosseno e tangente se aplicam na prática e nos triângulos...',
    link: '#blog-details',
  },
  {
  id: 2,
  image: "public/blogimg2.png",
  category: "Química",
  categoryColor: "bg-[#F59E0B]",
  title: "Reações Exotérmicas: Quando a Energia Transborda",
  author: "Diogo",
  date: "22 Nov, 25",
  comments: 8,
  excerpt: "Entenda os processos moleculares que liberam calor e como eles impulsionam desde motores até o nosso metabolismo...",
  link: "#blog-details"
  },
  {
  id: 3,
  image: "public/blogimg3.png",
  category: "Física",
  categoryColor: "bg-[#22c55e]",
  title: "O Espectro Visível: Por que vemos a cor violeta?",
  author: "Diogo",
  date: "15 Nov, 25",
  comments: 1,
  excerpt: "Descubra como os menores comprimentos de onda e a alta frequência definem a luz no limite da nossa visão.",
  link: "#blog-details"
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5,
      delay: delay * 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  })
};

// ============== BlogCard Component ==============
interface BlogCardProps {
  post: BlogPost;
  index: number;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, index }) => {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="w-full sm:w-1/2 lg:w-1/3 p-2"
    >
      <div className="blog-item group bg-[#E8F1FF] rounded-2xl p-3 h-full border border-[#EBECEF] transition-all duration-300 hover:shadow-xl">
        {/* Image Container */}
        <div className="rounded-xl overflow-hidden relative">
          <a href={post.link} className="block w-full h-48 overflow-hidden">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
            />
          </a>
        </div>

        {/* Content */}
        <div className="p-5 pt-6">
          {/* Category Badge */}
          <span className={`inline-block px-4 py-2 ${post.categoryColor} rounded-lg text-white text-sm font-medium mb-5`}>
            {post.category}
          </span>

          {/* Title */}
          <h4 className="text-lg font-bold text-[#222E48] mb-5 line-clamp-2 hover:text-[#0D6EFD] transition-colors">
            <a href={post.link}>{post.title}</a>
          </h4>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 my-4 text-sm text-[#798090]">
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            
            {/* Separator */}
            <span className="w-2 h-2 bg-[#EBECEF] rounded-full" />
            
            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{post.date}</span>
            </div>
            
            {/* Separator */}
            <span className="w-2 h-2 bg-[#EBECEF] rounded-full" />
            
            {/* Comments */}
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments}</span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-[#798090] text-sm leading-relaxed line-clamp-2 mb-5">
            {post.excerpt}
          </p>

          {/* Read More Link */}
          <div className="pt-5 border-t border-dashed border-[#EBECEF]">
            <a 
              href={post.link}
              className="inline-flex items-center gap-2 text-[#0D6EFD] font-semibold hover:underline transition-all group/link"
            >
              Leia o Post
              <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============== BlogSection Component ==============
export const BlogSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      id="blog-section"
      className="blog py-20 lg:py-28 relative z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f7 50%, #f0f8ff 100%)'
      }}
    >
      {/* ==================== Decorative Shapes ==================== */}
      <motion.img 
        src="/images/shapes/shape2.png" 
        alt="" 
        className="absolute top-20 left-[8%] w-8 h-8 pointer-events-none z-10"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img 
        src="/images/shapes/shape6.png" 
        alt="" 
        className="absolute bottom-32 right-[5%] w-8 h-8 pointer-events-none z-10"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="container mx-auto max-w-7xl px-4">
        {/* ==================== Section Heading ==================== */}
        <div className="section-heading text-center max-w-2xl mx-auto mb-12">
          <motion.h2 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={bounceIn}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222E48] mb-6"
          >
            Últimos Artigos
          </motion.h2>
          <motion.p 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={bounceInUp}
            className="text-[#798090] text-base lg:text-lg leading-relaxed"
          >
            Aqui você encontrará os últimos artigos publicados no nosso blog. Fique por dentro das novidades, dicas e tutoriais sobre tecnologia, design e muito mais...
          </motion.p>
        </div>

        {/* ==================== Blog Grid ==================== */}
        <div className="flex flex-wrap -mx-2">
          {BLOG_POSTS.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
