import { supabase } from '@/lib/supabase';
import { listDissertativaQuestaoIdsByAlunos } from '@/lib/dissertativasDestinos';
import {
  Activity,
  Bell,
  BookOpen,
  CalendarCheck,
  FileCheck,
  FileText,
  Menu,
  MessageSquare,
  Search,
  Target
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { StudentSidebar } from '../components/layout/StudentSidebar';

interface Materia {
  id: string;
  materia: string;
}

interface Prova {
  idteste: string;
  acerto: boolean;
}

interface LinkedAluno {
  id: string;
  nome: string;
  sobrenome?: string | null;
  email?: string | null;
  materias?: string[] | null;
  idmat?: string[] | null;
  idserie?: string | null;
}

interface DashboardMetrics {
  materiasCount: number;
  frequenciasCount: number;
  newTestsCount: number;
  dissertativasPendingCount: number;
  resolutionPercent: number;
  accuracyPercent: number;
  totalActivities: number;
  resolvedActivities: number;
}

const initialMetrics: DashboardMetrics = {
  materiasCount: 0,
  frequenciasCount: 0,
  newTestsCount: 0,
  dissertativasPendingCount: 0,
  resolutionPercent: 0,
  accuracyPercent: 0,
  totalActivities: 0,
  resolvedActivities: 0
};

type ProgressConfig = {
  value: number;
  label: string;
  colorClass: string;
  trackClass: string;
};

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClassName: string;
  loading: boolean;
  progress?: ProgressConfig;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
  loading,
  progress
}) => (
  <article
    className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    aria-label={title}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[#A3AED0] text-sm font-bold mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" aria-hidden="true" />
        ) : (
          <p className="text-3xl font-bold text-[#1B2559]">{value}</p>
        )}
      </div>
      <div className={iconClassName} aria-hidden="true">
        {icon}
      </div>
    </div>

    {loading ? (
      <div className="h-4 w-40 bg-gray-100 animate-pulse rounded mt-4" aria-hidden="true" />
    ) : (
      <p className="mt-4 text-sm text-[#A3AED0]">{subtitle}</p>
    )}

    {progress && (
      <div className="mt-4">
        {loading ? (
          <div className="h-2.5 w-full bg-gray-100 animate-pulse rounded-full" aria-hidden="true" />
        ) : (
          <div
            className={`h-2.5 rounded-full ${progress.trackClass}`}
            role="progressbar"
            aria-label={progress.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.value}
          >
            <div
              className={`h-full rounded-full ${progress.colorClass} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
            />
          </div>
        )}
      </div>
    )}
  </article>
);

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Aluno');
  const [userInitials, setUserInitials] = useState<string>('AL');
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [linkedAlunos, setLinkedAlunos] = useState<LinkedAluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState('');

  const fetchDashboardData = useCallback(async (overrideAlunoId?: string) => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('nome, sobrenome, email, signature, role, materias, emailaluno, idserie, idmat')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData.signature !== 'ativo') {
        navigate('/aguardando-aprovacao');
        return;
      }

      if (userData.role !== 'aluno' && userData.role !== 'pai') {
        navigate('/setup-inicial');
        return;
      }

      let targetAlunoId = user.id;
      let targetNome = userData.nome || '';
      let targetSobrenome = userData.sobrenome || '';
      let targetAlunoEmail = (userData.email as string | null) || user.email || '';
      let targetMaterias = ((userData.materias || userData.idmat || []) as string[]) || [];
      let targetSerie = (userData.idserie as string | null) || null;
      let parentLinked: LinkedAluno[] = [];

      if (userData.role === 'pai') {
        setIsParent(true);
        const emails = (userData.emailaluno || '')
          .split(',')
          .map((item: string) => item.trim().toLowerCase())
          .filter(Boolean);

        if (emails.length > 0) {
          const { data: linkedData } = await supabase
            .from('tbf_controle_user')
            .select('id, nome, sobrenome, email, materias, idmat, idserie')
            .in('email', emails)
            .eq('role', 'aluno')
            .order('nome');

          parentLinked = (linkedData as LinkedAluno[]) || [];
          setLinkedAlunos(parentLinked);
        } else {
          setLinkedAlunos([]);
        }

        const stored = sessionStorage.getItem('parent_selected_aluno_id');
        const storedValid = stored && parentLinked.some((aluno) => aluno.id === stored);
        const resolvedId = overrideAlunoId || (storedValid ? stored : parentLinked[0]?.id || '');

        if (resolvedId && resolvedId !== selectedAlunoId) {
          setSelectedAlunoId(resolvedId);
        }

        const selectedAluno = parentLinked.find((aluno) => aluno.id === resolvedId) || parentLinked[0];
        if (selectedAluno) {
          targetAlunoId = selectedAluno.id;
          targetNome = selectedAluno.nome || '';
          targetSobrenome = selectedAluno.sobrenome || '';
          targetAlunoEmail = selectedAluno.email || '';
          targetMaterias = ((selectedAluno.materias || selectedAluno.idmat || []) as string[]) || [];
          targetSerie = selectedAluno.idserie || null;
        }
      } else {
        setIsParent(false);
        setLinkedAlunos([]);
        setSelectedAlunoId('');
      }

      const firstName = targetNome ? targetNome.split(' ')[0] : 'Aluno';
      const firstInitial = targetNome ? targetNome.charAt(0).toUpperCase() : 'A';
      const lastInitial = targetSobrenome ? targetSobrenome.charAt(0).toUpperCase() : 'L';
      setUserName(firstName);
      setUserInitials(`${firstInitial}${lastInitial}`);

      const assignmentAlunoIds = new Set<string>([targetAlunoId]);
      if (targetAlunoEmail) {
        const { data: aliasRows } = await supabase
          .from('tbf_controle_user')
          .select('id')
          .eq('role', 'aluno')
          .eq('email', targetAlunoEmail);
        ((aliasRows as { id: string }[] | null) || []).forEach((row) => assignmentAlunoIds.add(row.id));
      }
      const targetAssignmentIds = Array.from(assignmentAlunoIds);

      const [materiasRes, testesRes, provasRes, frequenciasRes, enviosRes, destinosRes] = await Promise.all([
        targetMaterias.length > 0
          ? supabase.from('tbf_materias').select('id, materia').in('id', targetMaterias)
          : Promise.resolve({ data: [] as Materia[] }),
        supabase
          .from('tbf_testes')
          .select('id')
          .overlaps('idalunos', targetAssignmentIds),
        supabase
          .from('tbf_prova')
          .select('idteste, acerto')
          .eq('idaluno', targetAlunoId),
        supabase
          .from('tbf_frequencias')
          .select('id', { count: 'exact', head: true })
          .eq('aluno_id', targetAlunoId),
        supabase
          .from('tbf_questoes_dissertativas_envios')
          .select('questao_id')
          .eq('aluno_id', targetAlunoId),
        listDissertativaQuestaoIdsByAlunos(targetAssignmentIds)
      ]);

      const materiasCount = (materiasRes.data as Materia[] | null)?.length || 0;
      const testIds = new Set(((testesRes.data as { id: string }[] | null) || []).map((item) => item.id));
      const provasData = (provasRes.data as Prova[] | null) || [];

      const answeredTestIds = new Set<string>();
      const correctByTest = new Map<string, boolean>();

      provasData.forEach((prova) => {
        if (!testIds.has(prova.idteste)) return;
        answeredTestIds.add(prova.idteste);
        if (prova.acerto) correctByTest.set(prova.idteste, true);
        if (!correctByTest.has(prova.idteste)) correctByTest.set(prova.idteste, false);
      });

      const totalTests = testIds.size;
      const answeredTests = answeredTestIds.size;
      const correctTests = Array.from(answeredTestIds).filter((id) => correctByTest.get(id)).length;
      const newTestsCount = Math.max(0, totalTests - answeredTests);
      const accuracyPercent = answeredTests > 0 ? Math.round((correctTests / answeredTests) * 100) : 0;

      const { questaoIds } = destinosRes;
      const generalDissertativasQuery = supabase.from('tbf_questoes_dissertativas').select('id');
      if (targetSerie) {
        generalDissertativasQuery.eq('idserie', targetSerie);
      }
      if (targetMaterias.length > 0) {
        generalDissertativasQuery.in('idmat', targetMaterias);
      }

      const [generalDissertativasRes, assignedDissertativasRes] = await Promise.all([
        generalDissertativasQuery,
        questaoIds.length > 0
          ? supabase.from('tbf_questoes_dissertativas').select('id').in('id', questaoIds)
          : Promise.resolve({ data: [] as { id: string }[] })
      ]);

      const totalDissertativaIds = new Set<string>([
        ...(((generalDissertativasRes.data as { id: string }[] | null) || []).map((item) => item.id)),
        ...(((assignedDissertativasRes.data as { id: string }[] | null) || []).map((item) => item.id))
      ]);

      const envioQuestaoIds = new Set(
        (((enviosRes.data as { questao_id: string }[] | null) || [])
          .map((item) => item.questao_id)
          .filter((id): id is string => typeof id === 'string'))
      );

      const answeredDissertativas = Array.from(totalDissertativaIds).filter((id) => envioQuestaoIds.has(id)).length;
      const dissertativasPendingCount = Math.max(0, totalDissertativaIds.size - answeredDissertativas);

      const totalActivities = totalTests + totalDissertativaIds.size;
      const resolvedActivities = answeredTests + answeredDissertativas;
      const resolutionPercent = totalActivities > 0 ? Math.round((resolvedActivities / totalActivities) * 100) : 0;

      setMetrics({
        materiasCount,
        frequenciasCount: frequenciasRes.count || 0,
        newTestsCount,
        dissertativasPendingCount,
        resolutionPercent,
        accuracyPercent,
        totalActivities,
        resolvedActivities
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setMetrics(initialMetrics);
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedAlunoId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!isParent || !selectedAlunoId) return;
    sessionStorage.setItem('parent_selected_aluno_id', selectedAlunoId);
    fetchDashboardData(selectedAlunoId);
  }, [fetchDashboardData, isParent, selectedAlunoId]);

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

  const showEmptyState =
    !loading &&
    metrics.totalActivities === 0 &&
    metrics.frequenciasCount === 0 &&
    metrics.materiasCount === 0;
  const pendingToDoCount = metrics.newTestsCount + metrics.dissertativasPendingCount;

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <StudentSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={loading}
        onLogoutClick={() => setShowLogoutModal(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="min-h-[80px] md:h-24 flex items-center justify-between px-4 md:px-10 py-4 gap-4 z-10">
          <button
            className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>

          <div className="relative w-full max-w-[450px] group hidden md:block">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-14 pr-4 py-4 bg-white border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0061FF]/20 text-[#2B3674] placeholder-[#A3AED0] shadow-xl shadow-gray-200/30 transition-all duration-300 group-hover:shadow-gray-200/50"
              aria-label="Pesquisar"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#0061FF] transition-colors">
              <Search size={20} />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 bg-white p-2 rounded-xl shadow-xl shadow-gray-200/30 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                className="p-2.5 text-[#A3AED0] hover:text-[#0061FF] hover:bg-[#F4F7FE] rounded-lg transition-all relative"
                aria-label="NotificaÃ§Ãµes"
              >
                <Bell size={22} />
              </button>
              <button
                className="p-2.5 text-[#A3AED0] hover:text-[#0061FF] hover:bg-[#F4F7FE] rounded-lg transition-all hidden sm:block"
                aria-label="Mensagens"
              >
                <MessageSquare size={22} />
              </button>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden cursor-pointer hover:ring-4 hover:ring-[#0061FF]/10 transition-all ml-2 shadow-md">
                <img
                  src={`https://ui-avatars.com/api/?name=${userInitials}&background=0061FF&color=fff&bold=true`}
                  alt={`Avatar de ${userName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            {isParent && (
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl shadow-gray-200/40 border border-gray-100 mb-6">
                <label htmlFor="aluno-vinculado" className="text-sm font-bold text-[#1B2559]">
                  Aluno vinculado
                </label>
                {linkedAlunos.length === 0 ? (
                  <p className="text-sm text-[#A3AED0] mt-2">Nenhum aluno vinculado ao seu cadastro.</p>
                ) : (
                  <select
                    id="aluno-vinculado"
                    value={selectedAlunoId}
                    onChange={(e) => setSelectedAlunoId(e.target.value)}
                    className="mt-2 w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none"
                    aria-label="Selecionar aluno vinculado"
                  >
                    {linkedAlunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome} {aluno.sobrenome || ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {showEmptyState && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/30 border border-gray-100 mb-6">
                <p className="text-[#1B2559] font-bold">Ainda nÃ£o hÃ¡ dados suficientes para o painel.</p>
                <p className="text-[#A3AED0] mt-2 text-sm">
                  Assim que novas atividades, frequÃªncias ou matÃ©rias forem registradas, os indicadores aparecerÃ£o aqui.
                </p>
              </div>
            )}

            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              aria-label="MÃ©tricas principais da dashboard"
            >
              <MetricCard
                title="MatÃ©rias"
                value={String(metrics.materiasCount)}
                subtitle="Total de matÃ©rias ativas"
                icon={<BookOpen size={24} />}
                iconClassName="p-3 bg-[#F4F7FE] rounded-xl text-[#0061FF]"
                loading={loading}
              />

              <MetricCard
                title="FrequÃªncias"
                value={String(metrics.frequenciasCount)}
                subtitle="Total de presenÃ§as registradas"
                icon={<CalendarCheck size={24} />}
                iconClassName="p-3 bg-[#E6FBF5] rounded-xl text-[#05CD99]"
                loading={loading}
              />

              <MetricCard
                title="A Fazer"
                value={String(pendingToDoCount)}
                subtitle="Testes e dissertativas pendentes"
                icon={<FileCheck size={24} />}
                iconClassName="p-3 bg-[#FFF7E8] rounded-xl text-[#FFB547]"
                loading={loading}
              />

              <MetricCard
                title="QuestÃµes dissertativas enviadas e nÃ£o respondidas"
                value={String(metrics.dissertativasPendingCount)}
                subtitle="Pendentes de resposta"
                icon={<FileText size={24} />}
                iconClassName="p-3 bg-[#FEEFEE] rounded-xl text-[#EE5D50]"
                loading={loading}
              />

              <MetricCard
                title="Percentual de resoluÃ§Ã£o"
                value={`${metrics.resolutionPercent}%`}
                subtitle={`${metrics.resolvedActivities} de ${metrics.totalActivities} atividades resolvidas`}
                icon={<Activity size={24} />}
                iconClassName="p-3 bg-[#F4F7FE] rounded-xl text-[#4318FF]"
                loading={loading}
                progress={{
                  value: metrics.resolutionPercent,
                  label: 'Progresso do percentual de resoluÃ§Ã£o',
                  colorClass: 'bg-[#4318FF]',
                  trackClass: 'bg-[#E9E3FF]'
                }}
              />

              <MetricCard
                title="Percentual de acerto"
                value={`${metrics.accuracyPercent}%`}
                subtitle="Acertos sobre itens jÃ¡ respondidos"
                icon={<Target size={24} />}
                iconClassName="p-3 bg-[#E6FBF5] rounded-xl text-[#05CD99]"
                loading={loading}
                progress={{
                  value: metrics.accuracyPercent,
                  label: 'Progresso do percentual de acerto',
                  colorClass: 'bg-[#05CD99]',
                  trackClass: 'bg-[#DBFAF1]'
                }}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;

