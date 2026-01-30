import { supabase } from '@/lib/supabase';
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Search,
  Users,
  FileQuestion,
  Layers,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';

export const SetupInicial: React.FC = () => {
  const navigate = useNavigate();
  
  // State for KPIs
  const [stats, setStats] = useState({
    students: 0,
    testes: 0,
    materias: 0,
    temas: 0
  });
  
  // State for Lists/Charts
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [testesByMateria, setTestesByMateria] = useState<{name: string, count: number, percentage: number}[]>([]);

  // User info
  const [userName, setUserName] = useState<string>('Admin');
  const [userInitials, setUserInitials] = useState<string>('AD');
  
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch User Info (current logged in)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: userData } = await supabase.from('tbf_controle_user').select('nome, sobrenome').eq('id', user.id).single();
         if (userData?.nome) {
            setUserName(userData.nome.split(' ')[0]);
            const first = userData.nome.charAt(0);
            const last = userData.sobrenome ? userData.sobrenome.charAt(0) : 'D';
            setUserInitials(`${first}${last}`.toUpperCase());
         }
      }

      // 2. KPIs
      const results = await Promise.all([
        supabase.from('tbf_controle_user').select('id', { count: 'exact', head: true }).eq('role', 'aluno'),
        supabase.from('tbf_testes').select('id', { count: 'exact', head: true }),
        supabase.from('tbf_materias').select('id', { count: 'exact', head: true }),
        supabase.from('tbf_temas').select('id', { count: 'exact', head: true })
      ]);

      const [studentsRes, testesRes, materiasRes, temasRes] = results;

      setStats({
        students: studentsRes.count || 0,
        testes: testesRes.count || 0,
        materias: materiasRes.count || 0,
        temas: temasRes.count || 0
      });

      // 3. Recent Users
      const { data: recent } = await supabase
        .from('tbf_controle_user')
        .select('id, nome, sobrenome, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentUsers(recent || []);

      // 4. Testes Distribution
      const { data: allTestes } = await supabase.from('tbf_testes').select('idmat');
      const { data: allMaterias } = await supabase.from('tbf_materias').select('id, materia');

      if (allTestes && allMaterias) {
        const counts: Record<string, number> = {};
        let totalCounted = 0;

        allTestes.forEach(t => {
          if (Array.isArray(t.idmat)) {
            t.idmat.forEach(id => {
              counts[id] = (counts[id] || 0) + 1;
              totalCounted++;
            });
          }
        });

        const distribution = allMaterias
          .map(m => ({
            name: m.materia,
            count: counts[m.id] || 0,
            percentage: 0
          }))
          .filter(d => d.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5

        // Calculate percentages relative to the top 5 (or total tests? let's do relative to total counted for accuracy)
        distribution.forEach(d => {
          d.percentage = totalCounted > 0 ? Math.round((d.count / totalCounted) * 100) : 0;
        });

        setTestesByMateria(distribution);
      }

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

  const KPICard = ({ title, value, icon: Icon, color, bg, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/40 hover:shadow-gray-200/60 transition-all duration-300 group flex items-center justify-between cursor-pointer transform hover:-translate-y-1`}
    >
      <div>
        <p className="text-[#A3AED0] text-sm font-bold mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg mt-1"></div>
        ) : (
          <h4 className="text-3xl font-extrabold text-[#1B2559] mt-1 tracking-tight">{value}</h4>
        )}
        <div className="flex items-center gap-1 text-[#05CD99] text-xs font-bold mt-2">
          <ArrowUpRight size={14} />
          <span>Atualizado</span>
        </div>
      </div>
      <div className={`w-14 h-14 ${bg} ${color} rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={loading}
        onLogoutClick={() => setShowLogoutModal(true)}
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
        <header className="h-24 flex items-center justify-between px-10 z-10 bg-[#F4F7FE]/50 backdrop-blur-sm sticky top-0">
          <div className="relative w-[450px] group">
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-14 pr-4 py-4 bg-white border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 text-[#2B3674] placeholder-[#A3AED0] shadow-lg shadow-gray-200/20 transition-all duration-300"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#4318FF] transition-colors">
              <Search size={20} />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2.5 rounded-full shadow-lg shadow-gray-200/20 px-4">
            <button className="p-2 text-[#A3AED0] hover:text-[#4318FF] hover:bg-gray-50 rounded-full transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-[#A3AED0] hover:text-[#4318FF] hover:bg-gray-50 rounded-full transition-all">
              <MessageSquare size={20} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-white shadow-md">
              <img 
                src={`https://ui-avatars.com/api/?name=${userInitials}&background=4318FF&color=fff&bold=true`} 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-2">
          <div className="max-w-[1600px] mx-auto space-y-8">
            <div>
              <p className="text-[#707EAE] font-medium text-sm mb-1">Bem vindo de volta,</p>
              <h1 className="text-3xl font-bold text-[#1B2559]">Dashboard Principal</h1>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                title="Total Alunos" 
                value={stats.students} 
                icon={Users} 
                color="text-[#4318FF]" 
                bg="bg-[#F4F7FE]"
                onClick={() => navigate('/usuarios')}
              />
              <KPICard 
                title="Testes Criados" 
                value={stats.testes} 
                icon={FileQuestion} 
                color="text-[#05CD99]" 
                bg="bg-[#E6FAF5]"
                onClick={() => navigate('/testes')}
              />
              <KPICard 
                title="Matérias" 
                value={stats.materias} 
                icon={BookOpen} 
                color="text-[#FFB547]" 
                bg="bg-[#FFF7EB]"
                onClick={() => navigate('/materias')}
              />
              <KPICard 
                title="Temas" 
                value={stats.temas} 
                icon={Layers} 
                color="text-[#E31A1A]" 
                bg="bg-[#FFEEEE]"
                onClick={() => navigate('/temas')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/40">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#1B2559]">Distribuição de Testes por Matéria</h3>
                  <button className="p-2 text-[#A3AED0] hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>)}
                  </div>
                ) : testesByMateria.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <LayoutDashboard size={48} className="mb-4 opacity-20" />
                    <p>Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {testesByMateria.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span className="text-[#2B3674]">{item.name}</span>
                          <span className="text-[#A3AED0]">{item.percentage}% ({item.count} testes)</span>
                        </div>
                        <div className="w-full bg-[#F4F7FE] rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-[#4318FF] h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Users List */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/40">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#1B2559]">Últimos Usuários</h3>
                  <button 
                    onClick={() => navigate('/usuarios')}
                    className="px-4 py-2 bg-[#F4F7FE] text-[#4318FF] text-sm font-bold rounded-xl hover:bg-[#4318FF] hover:text-white transition-all"
                  >
                    Ver Todos
                  </button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                          <div className="w-32 h-3 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))
                  ) : recentUsers.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Nenhum usuário recente</p>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-4 p-3 hover:bg-[#F4F7FE] rounded-xl transition-colors cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-[#E9EDF7] flex items-center justify-center text-[#4318FF] font-bold text-lg group-hover:bg-white group-hover:shadow-md transition-all">
                          {user.nome?.[0]}{user.sobrenome?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#1B2559] font-bold text-sm truncate">
                            {user.nome} {user.sobrenome}
                          </h4>
                          <p className="text-[#A3AED0] text-xs truncate">{user.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Aluno'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
