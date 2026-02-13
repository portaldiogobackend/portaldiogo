// ============== Search Index Data ==============
// This file contains all searchable content mapped by route and section

export interface SearchIndexItem {
  id: string;
  rota: string;
  secao: string;
  titulo: string;
  conteudo: string;
  elementId?: string; // ID do elemento para scroll
}

export const SEARCH_INDEX: SearchIndexItem[] = [
  // ============== Hero Section ==============
  {
    id: 'hero-1',
    rota: '/',
    secao: 'Hero',
    titulo: 'Página Inicial - Hero',
    conteudo: 'Aqui o Conhecimento te Espera! A escolha certa para o Sucesso. Aulas particulares com Professores Especializados. Welcome to EduAll, where learning knows no bounds. Whether you are a student, professional, or lifelong learner...',
    elementId: 'hero-section'
  },
  {
    id: 'hero-2',
    rota: '/',
    secao: 'Hero - Enrolled Students',
    titulo: 'Alunos Matriculados',
    conteudo: '20+ Estudantes Cadastrados - Mais de 20 alunos matriculados na plataforma',
    elementId: 'hero-section'
  },
  {
    id: 'hero-3',
    rota: '/',
    secao: 'Hero - Desconto',
    titulo: 'Desconto 20%',
    conteudo: '20% Desc Novos Estudantes - Desconto de 20% em para novas matrículas em 2026',
    elementId: 'hero-section'
  },
  {
    id: 'hero-4',
    rota: '/',
    secao: 'Hero - Suporte',
    titulo: 'Suporte Online',
    conteudo: 'Suporte ao Aluno - Suporte via WhatsApp disponível. Contato: (66) 9229-9439',
    elementId: 'hero-section'
  },

  // ============== Features Section ==============
  {
    id: 'features-1',
    rota: '/',
    secao: 'Cursos Online',
    titulo: 'A Mentoria Híbrida de Resultados',
    conteudo: 'A Mentoria Híbrida de Resultados combina a atenção individual de um professor particular com a tecnologia de um portal digital completo, oferecendo o suporte necessário para sua aprovação.',
    elementId: 'features-section'
  },
  {
    id: 'features-2',
    rota: '/',
    secao: 'Cursos Online - Idiomas',
    titulo: 'Aprendizado de Idiomas',
    conteudo: 'Language Learning - Courses teaching languages such as English, Spanish, French, Mandarin. Cursos de idiomas: inglês, espanhol, francês e mandarim.',
    elementId: 'features-section'
  },
  {
    id: 'features-3',
    rota: '/',
    secao: 'Cursos Online - Design',
    titulo: 'Artes Criativas e Design',
    conteudo: 'Creative Arts & Design - Courses on graphic design, digital art, photography, video editing. Cursos de design gráfico, arte digital, fotografia e edição de vídeo.',
    elementId: 'features-section'
  },
  {
    id: 'features-4',
    rota: '/',
    secao: 'Cursos Online - Saúde',
    titulo: 'Saúde e Fitness',
    conteudo: 'Health & Fitness - Courses on nutrition, fitness training, yoga, meditation, wellness coaching. Cursos de nutrição, treino físico, yoga, meditação e coaching de bem-estar.',
    elementId: 'features-section'
  },
  {
    id: 'features-5',
    rota: '/',
    secao: 'Cursos Online - Negócios',
    titulo: 'Negócios e Marketing',
    conteudo: 'Business & Marketing - Courses on digital marketing, entrepreneurship, leadership and management. Cursos de marketing digital, empreendedorismo, liderança e gestão.',
    elementId: 'features-section'
  },
  {
    id: 'features-6',
    rota: '/',
    secao: 'Cursos Online - Tecnologia',
    titulo: 'Tecnologia e Programação',
    conteudo: 'Technology & Coding - Courses on web development, mobile apps, data science and AI/ML. Cursos de desenvolvimento web, aplicativos móveis, ciência de dados e IA.',
    elementId: 'features-section'
  },
  {
    id: 'features-7',
    rota: '/',
    secao: 'Cursos Online - Desenvolvimento Pessoal',
    titulo: 'Desenvolvimento Pessoal',
    conteudo: 'Personal Development - Courses on productivity, communication skills, mindfulness and life coaching. Cursos de produtividade, habilidades de comunicação e coaching de vida.',
    elementId: 'features-section'
  },

  // ============== Methodology Section ==============
  {
    id: 'methodology-main',
    rota: '/',
    secao: 'Metodologia',
    titulo: 'Por que escolher o Professor Diogo?',
    conteudo: 'Por que escolher o Professor Diogo? A Mentoria Híbrida de Resultados combina a atenção individual de um professor particular com a tecnologia de um portal digital completo.',
    elementId: 'methodology-section'
  },
  {
    id: 'methodology-1',
    rota: '/',
    secao: 'Metodologia',
    titulo: 'Atenção Individual',
    conteudo: 'Atenção Individual - O cuidado de um professor particular focado nas suas dificuldades específicas, garantindo que nenhuma dúvida fique para trás.',
    elementId: 'methodology-section'
  },
  {
    id: 'methodology-2',
    rota: '/',
    secao: 'Metodologia',
    titulo: 'Portal Digital',
    conteudo: 'Portal Digital - Plataforma completa com videoaulas, listas de exercícios e materiais de apoio organizados para facilitar seus estudos.',
    elementId: 'methodology-section'
  },
  {
    id: 'methodology-3',
    rota: '/',
    secao: 'Metodologia',
    titulo: 'Exercícios Práticos',
    conteudo: 'Exercícios Práticos - Foco total em resolução de problemas e preparação para provas, com listas personalizadas para o seu nível.',
    elementId: 'methodology-section'
  },
  {
    id: 'methodology-4',
    rota: '/',
    secao: 'Metodologia',
    titulo: 'Acompanhamento Contínuo',
    conteudo: 'Acompanhamento Contínuo - Monitoramento constante do seu progresso com feedback detalhado e ajustes no plano de estudos conforme sua evolução.',
    elementId: 'methodology-section'
  },

  // ============== About Section ==============
  {
    id: 'about-1',
    rota: '/',
    secao: 'Sobre Nós',
    titulo: 'Por que escolher a EduAll',
    conteudo: 'Why Choose Us - Por que escolher nossos cursos online. Educação de qualidade, professores especializados e metodologia eficiente.',
    elementId: 'about-section'
  },
  {
    id: 'about-2',
    rota: '/',
    secao: 'Sobre Nós - Missão',
    titulo: 'Nossa Missão',
    conteudo: 'Nossa missão é proporcionar educação de qualidade e acessível para todos os estudantes. Compromisso com a excelência no ensino.',
    elementId: 'about-section'
  },

  // ============== Blog Section ==============
  {
    id: 'blog-1',
    rota: '/',
    secao: 'Blog',
    titulo: 'Artigos Recentes',
    conteudo: 'Recent Articles - Confira nossos artigos mais recentes sobre educação, tecnologia e desenvolvimento pessoal.',
    elementId: 'blog-section'
  },
  {
    id: 'blog-2',
    rota: '/',
    secao: 'Blog - Diversidade',
    titulo: 'Importância da Diversidade na Educação Superior',
    conteudo: 'The Importance of Diversity in Higher Education - A importância da diversidade no ensino superior. Categoria: Student life. Unlock the secrets to effective time management in the digital learning space.',
    elementId: 'blog-section'
  },
  {
    id: 'blog-3',
    rota: '/',
    secao: 'Blog - Liberdade',
    titulo: 'Liberdade na Educação Online',
    conteudo: 'Freedom - Liberdade no aprendizado online. Educação sem fronteiras, aprenda de qualquer lugar.',
    elementId: 'blog-section'
  },
  {
    id: 'blog-4',
    rota: '/',
    secao: 'Blog - Online',
    titulo: 'Educação Online',
    conteudo: 'Online Education - Educação online e suas vantagens. Aprenda no seu próprio ritmo.',
    elementId: 'blog-section'
  },

  // ============== Certificate Section ==============
  {
    id: 'certificate-1',
    rota: '/',
    secao: 'Certificado',
    titulo: 'Obtenha seu Certificado',
    conteudo: 'Get Certificate - Get Quality Skills Certificate From the EduAll. Obtenha seu certificado de qualidade da EduAll. Get Started Now.',
    elementId: 'certificate-section'
  },

  // ============== Navigation Items ==============
  {
    id: 'nav-1',
    rota: '/',
    secao: 'Navegação',
    titulo: 'Portal do Aluno',
    conteudo: 'Portal do Aluno - Acesse sua área exclusiva de estudante com materiais e cursos.',
    elementId: 'header'
  },
  {
    id: 'nav-2',
    rota: '/',
    secao: 'Navegação - Metodologia',
    titulo: 'Metodologia de Ensino',
    conteudo: 'Metodologia - Como Funciona - Preços - Sobre Portal Aluno. Conheça nossa metodologia de ensino única.',
    elementId: 'header'
  },
  {
    id: 'nav-3',
    rota: '/',
    secao: 'Navegação - Aulas',
    titulo: 'Aulas e Cursos',
    conteudo: 'Aulas/Cursos - Matemática - Química - Física. Aulas particulares com professores especializados.',
    elementId: 'header'
  },
  {
    id: 'nav-4',
    rota: '/',
    secao: 'Navegação - Ebook',
    titulo: 'Ebooks Disponíveis',
    conteudo: 'Ebook - Inteligência Artificial nos Estudos - O Conceito do ensino híbrido. Materiais digitais gratuitos.',
    elementId: 'header'
  },
  {
    id: 'nav-5',
    rota: '/',
    secao: 'Navegação - Blog',
    titulo: 'Blog e Vestibulares',
    conteudo: 'Blog e Vestibulares - Nosso Blog - Matérias - Portal de Vestibulares. Conteúdo educacional atualizado.',
    elementId: 'header'
  },
  {
    id: 'nav-6',
    rota: '/',
    secao: 'Navegação - Contato',
    titulo: 'Contato',
    conteudo: 'Contato - Entre em contato conosco. Atendimento online disponível.',
    elementId: 'header'
  },

  // ============== Brand Section ==============
  {
    id: 'brand-1',
    rota: '/',
    secao: 'Parceiros',
    titulo: 'Marcas Parceiras',
    conteudo: 'Marcas parceiras e patrocinadores. Empresas que confiam na EduAll para educação corporativa.',
    elementId: 'brand-section'
  },
];

// ============== Search Result Interface ==============
export interface SearchResult {
  item: SearchIndexItem;
  occurrences: number;
  snippets: string[];
}

// ============== Search Function ==============
export function searchContent(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const item of SEARCH_INDEX) {
    const content = item.conteudo.toLowerCase();
    const titulo = item.titulo.toLowerCase();
    const secao = item.secao.toLowerCase();

    // Check if query matches in any field
    const contentMatches = content.includes(normalizedQuery);
    const tituloMatches = titulo.includes(normalizedQuery);
    const secaoMatches = secao.includes(normalizedQuery);

    if (contentMatches || tituloMatches || secaoMatches) {
      // Count occurrences
      let occurrences = 0;
      const searchText = `${item.titulo} ${item.secao} ${item.conteudo}`.toLowerCase();
      let pos = 0;
      
      while ((pos = searchText.indexOf(normalizedQuery, pos)) !== -1) {
        occurrences++;
        pos += normalizedQuery.length;
      }

      // Generate snippets with context
      const snippets: string[] = [];
      const fullText = `${item.titulo} ${item.secao} ${item.conteudo}`;
      const fullTextLower = fullText.toLowerCase();
      
      let snippetPos = 0;
      const maxSnippets = 3;
      
      while (snippetPos < fullText.length && snippets.length < maxSnippets) {
        const foundIndex = fullTextLower.indexOf(normalizedQuery, snippetPos);
        if (foundIndex === -1) break;
        
        const start = Math.max(0, foundIndex - 30);
        const end = Math.min(fullText.length, foundIndex + normalizedQuery.length + 30);
        
        let snippet = fullText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < fullText.length) snippet = snippet + '...';
        
        snippets.push(snippet);
        snippetPos = foundIndex + normalizedQuery.length;
      }

      results.push({
        item,
        occurrences,
        snippets
      });
    }
  }

  // Sort by occurrences (most matches first)
  results.sort((a, b) => b.occurrences - a.occurrences);

  return results;
}
