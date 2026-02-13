import { supabase } from '@/lib/supabase';
import {
  Bell,
  BookOpen,
  Menu,
  MessageSquare,
  Search,
  FileCheck,
  CheckCircle,
  XCircle,
  AlertCircle
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

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Aluno');
  const [userInitials, setUserInitials] = useState<string>('AL');
  const [userMaterias, setUserMaterias] = useState<Materia[]>([]);
  const [materiasCount, setMateriasCount] = useState<number>(0);
  const [testStats, setTestStats] = useState({
    pending: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('[Dashboard] Sessão não encontrada ou expirada');
        navigate('/login');
        return;
      }

      // Buscar dados do usuário
      console.log('[Dashboard] Buscando dados do aluno:', user.id);
      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('nome, sobrenome, signature, role, materias')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('[Dashboard] Erro ao buscar perfil:', userError);
        throw userError;
      }

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
          setMateriasCount(materiasData.length);
        }
      }

      // Buscar estatísticas de testes
      console.log('Buscando estatísticas de testes para:', user.id);
      
      const { data: testesData, error: testesError } = await supabase
        .from('tbf_testes')
        .select('id')
        .contains('idalunos', [user.id]);

      if (testesError) {
        console.error('Erro ao buscar testes:', testesError);
      } else {
        console.log('Testes encontrados:', testesData?.length);
      }

      const { data: provasData, error: provasError } = await supabase
        .from('tbf_prova')
        .select('acerto')
        .eq('idaluno', user.id);

      if (provasError) {
        console.error('Erro ao buscar provas:', provasError);
      } else {
        console.log('Provas encontradas:', provasData?.length);
      }

      const totalTestes = testesData?.length || 0;
      const provasRealizadas = provasData || [];
      
      const testsTaken = provasRealizadas.length;
      const correct = provasRealizadas.filter(p => p.acerto).length;
      const incorrect = provasRealizadas.filter(p => !p.acerto).length;
      const pending = Math.max(0, totalTestes - testsTaken);
      const successRate = testsTaken > 0 ? Math.round((correct / testsTaken) * 100) : 0;

      setTestStats({
        pending,
        completed: testsTaken,
        correct,
        incorrect,
        successRate
      });

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
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
    
    // Fallback para Matemática se nada mais corresponder
    return '/materiamat.png';
  };

  const getSymbolImage = (nome: string) => {
    if (!nome) return '';
    const n = nome.toLowerCase();
    if (n.includes('matemat')) return '/simbmat.png';
    if (n.includes('fisic')) return '/simbfis.png';
    if (n.includes('quimic')) return '/simbqui.png';
    return '';
  };

  const getBorderColor = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes('matemat')) return 'border-blue-200 hover:border-blue-500';
    if (n.includes('fisic')) return 'border-purple-200 hover:border-purple-500';
    if (n.includes('quimic')) return 'border-emerald-200 hover:border-emerald-500';
    return 'border-gray-100 hover:border-blue-400';
  };

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
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Search Bar */}
          <div className="relative w-full max-w-[450px] group hidden md:block">
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full pl-14 pr-4 py-4 bg-white border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0061FF]/20 text-[#2B3674] placeholder-[#A3AED0] shadow-xl shadow-gray-200/30 transition-all duration-300 group-hover:shadow-gray-200/50"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#0061FF] transition-colors">
              <Search size={20} />
            </div>
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            {/* Welcome Section */}
            <div className="mb-8 md:mb-10 relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-r from-[#0061FF] to-[#422AFB] text-white shadow-2xl shadow-blue-200/50">
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Olá, {userName}! 👋
                </h1>
                <p className="text-blue-100 text-lg mt-3 max-w-md font-medium">
                  Bem-vindo ao seu portal de estudos. Aqui você encontra tudo o que precisa para sua jornada acadêmica.
                </p>
              </div>
              
              {/* Imagens Decorativas no Banner */}
              <div className="absolute top-0 right-0 h-full w-full pointer-events-none">
                <img 
                  src="/hero1.png" 
                  alt="" 
                  className="absolute right-0 bottom-0 h-[120%] w-auto object-contain opacity-20 transform translate-x-1/4 translate-y-1/4" 
                />
                <img 
                  src="/images/shapes/shape1.png" 
                  alt="" 
                  className="absolute top-10 right-1/4 w-12 h-12 opacity-20 animate-pulse" 
                />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8 md:mb-10">
              {/* Matérias Card */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#A3AED0] text-sm font-bold mb-1">Matérias</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-[#1B2559]">{materiasCount}</h3>
                    )}
                  </div>
                  <div className="p-3 bg-[#F4F7FE] rounded-xl text-[#0061FF]">
                    <BookOpen size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-500 font-bold flex items-center gap-1">
                    <CheckCircle size={14} /> Ativas
                  </span>
                  <span className="text-[#A3AED0]">no semestre</span>
                </div>
              </div>

              {/* Testes Pendentes */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#A3AED0] text-sm font-bold mb-1">A Fazer</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-[#1B2559]">{testStats.pending}</h3>
                    )}
                  </div>
                  <div className="p-3 bg-[#FFF7E8] rounded-xl text-[#FFB547]">
                    <FileCheck size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-[#FFB547] font-bold">Pendente</span>
                  <span className="text-[#A3AED0]">novos testes</span>
                </div>
              </div>

              {/* Acertos */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#A3AED0] text-sm font-bold mb-1">Acertos</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-[#1B2559]">{testStats.correct}</h3>
                    )}
                  </div>
                  <div className="p-3 bg-[#E6FBF5] rounded-xl text-[#05CD99]">
                    <CheckCircle size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-[#05CD99] font-bold">
                    {testStats.completed > 0 ? Math.round((testStats.correct / testStats.completed) * 100) : 0}%
                  </span>
                  <span className="text-[#A3AED0]">do total</span>
                </div>
              </div>

              {/* Erros */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#A3AED0] text-sm font-bold mb-1">Erros</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-[#1B2559]">{testStats.incorrect}</h3>
                    )}
                  </div>
                  <div className="p-3 bg-[#FEEFEE] rounded-xl text-[#EE5D50]">
                    <XCircle size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-[#EE5D50] font-bold">
                    {testStats.completed > 0 ? Math.round((testStats.incorrect / testStats.completed) * 100) : 0}%
                  </span>
                  <span className="text-[#A3AED0]">do total</span>
                </div>
              </div>

              {/* Aproveitamento */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#A3AED0] text-sm font-bold mb-1">Aproveitamento</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-[#1B2559]">{testStats.successRate}%</h3>
                    )}
                  </div>
                  <div className="p-3 bg-[#F4F7FE] rounded-xl text-[#4318FF]">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className={`${testStats.successRate >= 70 ? 'text-[#05CD99]' : testStats.successRate >= 50 ? 'text-[#FFB547]' : 'text-[#EE5D50]'} font-bold`}>
                    {testStats.successRate >= 70 ? 'Ótimo' : testStats.successRate >= 50 ? 'Bom' : 'Atenção'}
                  </span>
                  <span className="text-[#A3AED0]">desempenho</span>
                </div>
              </div>
            </div>

            {/* Matérias Section */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl shadow-gray-200/40">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#1B2559]">Minhas Matérias</h2>
                  <p className="text-[#A3AED0] text-sm mt-1">Acesse o conteúdo das suas matérias</p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#F4F7FE] rounded-xl p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : userMaterias.length === 0 ? (
                <div className="text-center py-12 bg-[#F4F7FE]/50 rounded-xl">
                  <BookOpen size={48} className="text-[#A3AED0] mx-auto mb-4 opacity-50" />
                  <p className="text-[#A3AED0] font-medium">Nenhuma matéria atribuída ainda</p>
                  <p className="text-sm text-[#A3AED0]/70 mt-1">Entre em contato com o administrador</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {userMaterias.map((materia) => {
                    const backgroundImage = getBackgroundImage(materia);
                    const symbolImage = getSymbolImage(materia.materia);
                    const borderColor = getBorderColor(materia.materia);

                    return (
                      <div 
                        key={materia.id}
                        className={`relative overflow-hidden rounded-2xl h-56 border-2 ${borderColor} shadow-xl shadow-gray-200/30 transition-all duration-500 cursor-pointer group hover:-translate-y-2 flex flex-col justify-end`}
                      >
                        {/* Imagem de Fundo (Sem gradiente azul) */}
                        <div className="absolute inset-0 overflow-hidden bg-gray-100">
                          <div 
                            className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                            style={{ 
                              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        </div>

                        {/* Overlay sutil apenas para legibilidade do texto se houver imagem */}
                        {backgroundImage && (
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-500" />
                        )}

                        {/* Símbolo em marca d'água (opcional, por cima do fundo) */}
                        {symbolImage && (
                          <img 
                            src={symbolImage} 
                            alt="" 
                            className="absolute right-[-5%] bottom-[-5%] w-24 h-24 object-contain opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" 
                          />
                        )}

                        {/* Conteúdo */}
                        <div className="relative p-6 z-10">
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {symbolImage && (
                                  <img src={symbolImage} alt="" className="w-5 h-5 object-contain brightness-0 invert opacity-80" />
                                )}
                                <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Matéria</span>
                              </div>
                              <h3 className="font-extrabold text-white text-2xl mb-1 tracking-tight">
                                {materia.materia}
                              </h3>
                              {materia.descricao && (
                                <p className="text-sm text-blue-100 line-clamp-1 font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                                  {materia.descricao}
                                </p>
                              )}
                            </div>
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 group-hover:bg-[#0061FF] group-hover:border-[#0061FF] transition-all duration-300 shadow-lg group-hover:rotate-12">
                              <BookOpen size={24} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
