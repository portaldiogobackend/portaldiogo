import { supabase } from '@/lib/supabase';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Menu,
  MessageSquare,
  Search,
  FileText,
  Video,
  Download
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { StudentSidebar } from '../components/layout/StudentSidebar';

interface Materia {
  id: string;
  materia: string;
  descricao?: string;
  imagem?: string;
}

export const StudentMaterias: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Aluno');
  const [userInitials, setUserInitials] = useState<string>('AL');
  const [userMaterias, setUserMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('nome, sobrenome, signature, role, materias')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Verificar se o usuário é aluno e está ativo
      if (userData.role !== 'aluno') {
        navigate('/setup-inicial');
        return;
      }

      if (userData.signature !== 'ativo') {
        navigate('/aguardando-aprovacao');
        return;
      }

      // Definir nome do usuário
      const firstName = userData?.nome ? userData.nome.split(' ')[0] : 'Aluno';
      const firstInitial = userData?.nome ? userData.nome.charAt(0).toUpperCase() : 'A';
      const lastInitial = userData?.sobrenome ? userData.sobrenome.charAt(0).toUpperCase() : 'L';
      
      setUserName(firstName);
      setUserInitials(`${firstInitial}${lastInitial}`);

      // Buscar matérias do aluno
      if (userData.materias && userData.materias.length > 0) {
        const { data: materiasData, error: materiasError } = await supabase
          .from('tbf_materias')
          .select('*')
          .in('id', userData.materias);

        if (!materiasError && materiasData) {
          setUserMaterias(materiasData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair do sistema. Tente novamente.');
    }
  };

  // Mapeamento de imagens baseado no nome da matéria
  const getBackgroundImage = (materia: Materia) => {
    // Normalizar string para remover acentos e colocar em minúsculas
    const n = materia.materia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Prioridade para imagens mapeadas por nome de matéria para garantir que as imagens locais apareçam
    if (n.includes('matemat') || n.includes('math') || n.includes('calculo')) return '/materiamat.png';
    if (n.includes('fisic') || n.includes('physics')) return '/materiafis.png';
    if (n.includes('quimic') || n.includes('chemistry')) return '/materiaqui.png';
    
    // Se não for uma das principais, usa a imagem do banco se existir
    if (materia.imagem) return materia.imagem;
    
    // Fallback para Matemática se nada mais corresponder (solicitação do usuário)
    return '/materiamat.png';
  };

  const filteredMaterias = userMaterias.filter(materia =>
    materia.materia.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      {/* Sidebar */}
      <StudentSidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={loading}
        onLogoutClick={() => setShowLogoutModal(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="min-h-[80px] md:h-24 flex items-center justify-between px-4 md:px-10 py-4 gap-4 z-10">
          {/* Mobile Menu + Back Button */}
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <button 
              onClick={() => navigate('/aluno/dashboard')}
              className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden md:inline">Voltar ao Dashboard</span>
              <span className="md:hidden">Voltar</span>
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 md:gap-6 bg-white p-2 rounded-xl shadow-xl shadow-gray-200/30 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button className="p-2.5 text-[#A3AED0] hover:text-[#0061FF] hover:bg-[#F4F7FE] rounded-lg transition-all relative">
                <Bell size={22} />
              </button>
              <button className="p-2.5 text-[#A3AED0] hover:text-[#0061FF] hover:bg-[#F4F7FE] rounded-lg transition-all hidden sm:block">
                <MessageSquare size={22} />
              </button>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden cursor-pointer hover:ring-4 hover:ring-[#0061FF]/10 transition-all ml-2 shadow-md">
                <img 
                  src={`https://ui-avatars.com/api/?name=${userInitials}&background=0061FF&color=fff&bold=true`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Matérias Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            {/* Page Title */}
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1B2559]">
                Minhas Matérias
              </h1>
              <p className="text-[#A3AED0] mt-2">
                Acesse o conteúdo das matérias que você está matriculado
              </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
                  <input 
                    type="text"
                    placeholder="Pesquisar matérias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-[#A3AED0]">
                  <BookOpen size={18} />
                  <span><strong className="text-[#1B2559]">{userMaterias.length}</strong> matérias matriculadas</span>
                </div>
              </div>
            </div>

            {/* Matérias Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse shadow-xl shadow-gray-200/40">
                    <div className="h-40 bg-[#F4F7FE] rounded-xl mb-4"></div>
                    <div className="h-6 bg-[#F4F7FE] rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-[#F4F7FE] rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredMaterias.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-12 text-center">
                <BookOpen size={64} className="text-[#A3AED0] mx-auto mb-4 opacity-40" />
                {userMaterias.length === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-[#1B2559] mb-2">Nenhuma matéria atribuída</h3>
                    <p className="text-[#A3AED0]">Entre em contato com o administrador para ter acesso às matérias</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-[#1B2559] mb-2">Nenhuma matéria encontrada</h3>
                    <p className="text-[#A3AED0]">Tente buscar por outro termo</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterias.map((materia) => {
                  const backgroundImage = getBackgroundImage(materia);

                  return (
                      <div 
                        key={materia.id}
                        onClick={() => navigate(`/aluno/materias/${materia.id}`)}
                        className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden group cursor-pointer hover:-translate-y-1"
                      >
                        {/* Matéria Image/Gradient Header */}
                         <div className="h-40 relative overflow-hidden bg-gray-100">
                           <div 
                             className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                             style={{ 
                               backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                               backgroundSize: 'cover',
                               backgroundPosition: 'center',
                             }}
                           />
                           {!backgroundImage && (
                             <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                               <BookOpen size={40} />
                             </div>
                           )}
                         </div>

                        {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-[#1B2559] mb-2 group-hover:text-[#0061FF] transition-colors">
                          {materia.materia}
                        </h3>
                        {materia.descricao && (
                          <p className="text-sm text-[#A3AED0] line-clamp-2 mb-4">
                            {materia.descricao}
                          </p>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                          <button className="flex items-center gap-2 text-sm font-medium text-[#0061FF] hover:text-[#0052D9] transition-colors">
                            <FileText size={16} />
                            <span>Materiais</span>
                          </button>
                          <button className="flex items-center gap-2 text-sm font-medium text-[#05CD99] hover:text-[#04B386] transition-colors">
                            <Video size={16} />
                            <span>Aulas</span>
                          </button>
                          <button className="flex items-center gap-2 text-sm font-medium text-[#FFB547] hover:text-[#E5A23E] transition-colors">
                            <Download size={16} />
                            <span>Downloads</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentMaterias;
