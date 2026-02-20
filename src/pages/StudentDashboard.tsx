import { supabase } from '@/lib/supabase';
import { listDissertativaQuestaoIdsByAlunos } from '@/lib/dissertativasDestinos';
import { fetchProvaRowsByAluno } from '@/lib/provaMetrics';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  Clock3,
  FileCheck,
  FileText,
  HelpCircle,
  Menu,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { StudentSidebar } from '../components/layout/StudentSidebar';

interface LinkedAluno {
  id: string;
  nome: string;
  sobrenome?: string | null;
  email?: string | null;
  materias?: string[] | null;
  idmat?: string[] | null;
  idserie?: string | null;
}

interface TesteResumo {
  id: string;
  pergunta: string;
  idtema: string[] | null;
  created_at?: string | null;
}

interface Tema {
  id: string;
  nometema: string;
}

interface DuvidaRow {
  id: string;
  resposta: string | null;
  created_at?: string | null;
}

interface ThemePerformance {
  themeId: string;
  themeName: string;
  resolvedCount: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number;
  errorPercent: number;
  totalSeconds: number;
}

interface QuestionPerformance {
  testId: string;
  preview: string;
  themeLabel: string;
  attempts: number;
  status: 'acerto' | 'erro';
  totalSeconds: number;
}

interface DashboardMetrics {
  resolvedTestsCount: number;
  pendingTestsCount: number;
  dissertativasPendingCount: number;
  openDoubtsCount: number;
  totalStudySeconds: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number;
  errorPercent: number;
  themePerformance: ThemePerformance[];
  questionPerformance: QuestionPerformance[];
}

const initialMetrics: DashboardMetrics = {
  resolvedTestsCount: 0,
  pendingTestsCount: 0,
  dissertativasPendingCount: 0,
  openDoubtsCount: 0,
  totalStudySeconds: 0,
  correctCount: 0,
  wrongCount: 0,
  accuracyPercent: 0,
  errorPercent: 0,
  themePerformance: [],
  questionPerformance: []
};

const stripHtml = (html: string) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

const formatDuration = (totalSeconds: number) => {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
};

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: 'blue' | 'green' | 'red' | 'amber';
  loading: boolean;
}> = ({ title, value, subtitle, icon, tone, loading }) => {
  const toneClass =
    tone === 'green'
      ? 'bg-green-50 text-green-600'
      : tone === 'red'
        ? 'bg-red-50 text-red-600'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-600'
          : 'bg-blue-50 text-blue-600';

  return (
    <article className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[#A3AED0] text-sm font-bold mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" aria-hidden="true" />
          ) : (
            <p className="text-3xl font-bold text-[#1B2559]">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${toneClass}`} aria-hidden="true">
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-4 w-40 bg-gray-100 animate-pulse rounded mt-4" aria-hidden="true" />
      ) : (
        <p className="mt-4 text-sm text-[#A3AED0]">{subtitle}</p>
      )}
    </article>
  );
};

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Aluno');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [linkedAlunos, setLinkedAlunos] = useState<LinkedAluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'all' | '7' | '30' | '90' | 'custom'>('all');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    if (periodPreset === 'all') {
      setPeriodStart('');
      setPeriodEnd('');
      return;
    }
    if (periodPreset === 'custom') return;

    const days = Number(periodPreset);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    setPeriodStart(startDate.toISOString().slice(0, 10));
    setPeriodEnd(endDate.toISOString().slice(0, 10));
  }, [periodPreset]);

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
          targetAlunoEmail = selectedAluno.email || '';
          targetMaterias = ((selectedAluno.materias || selectedAluno.idmat || []) as string[]) || [];
          targetSerie = selectedAluno.idserie || null;
        }
      } else {
        setIsParent(false);
        setLinkedAlunos([]);
        setSelectedAlunoId('');
      }

      setUserName(targetNome ? targetNome.split(' ')[0] : 'Aluno');

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

      const [testesRes, provaRows, temasRes, duvidasRes, enviosRes, destinosRes] = await Promise.all([
        supabase
          .from('tbf_testes')
          .select('id, pergunta, idtema, created_at')
          .overlaps('idalunos', targetAssignmentIds),
        fetchProvaRowsByAluno(targetAlunoId),
        supabase.from('tbf_temas').select('id, nometema'),
        supabase.from('tbf_duvidas').select('id, resposta, created_at').eq('idaluno', targetAlunoId),
        supabase.from('tbf_questoes_dissertativas_envios').select('questao_id').eq('aluno_id', targetAlunoId),
        listDissertativaQuestaoIdsByAlunos(targetAssignmentIds)
      ]);

      const inDateRange = (rawDate?: string | null) => {
        if (!periodStart && !periodEnd) return true;
        if (!rawDate) return false;
        const target = new Date(rawDate);
        if (Number.isNaN(target.getTime())) return false;

        if (periodStart) {
          const start = new Date(`${periodStart}T00:00:00`);
          if (target < start) return false;
        }
        if (periodEnd) {
          const end = new Date(`${periodEnd}T23:59:59.999`);
          if (target > end) return false;
        }

        return true;
      };

      const testes = (((testesRes.data as TesteResumo[] | null) || []).filter((item) => inDateRange(item.created_at)));
      const temas = (temasRes.data as Tema[] | null) || [];
      const duvidas = (((duvidasRes.data as DuvidaRow[] | null) || []).filter((item) => inDateRange(item.created_at)));
      const testIds = new Set(testes.map((item) => item.id));

      const attemptsByTest = new Map<string, { attempts: number; hasCorrect: boolean; totalSeconds: number }>();
      for (const prova of provaRows) {
        if (!inDateRange(prova.realizadoEm)) continue;
        if (!testIds.has(prova.idteste)) continue;
        const existing = attemptsByTest.get(prova.idteste);
        if (existing) {
          existing.attempts += 1;
          existing.hasCorrect = existing.hasCorrect || prova.acerto;
          existing.totalSeconds += prova.tempoSegundos || 0;
        } else {
          attemptsByTest.set(prova.idteste, {
            attempts: 1,
            hasCorrect: prova.acerto,
            totalSeconds: prova.tempoSegundos || 0
          });
        }
      }

      const temaMap = new Map(temas.map((tema) => [tema.id, tema.nometema]));
      const byTheme = new Map<string, ThemePerformance>();
      const questionPerformance: QuestionPerformance[] = [];

      let resolvedTestsCount = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let totalStudySeconds = 0;

      testes.forEach((teste) => {
        const attempt = attemptsByTest.get(teste.id);
        if (!attempt || attempt.attempts === 0) return;

        resolvedTestsCount += 1;
        totalStudySeconds += attempt.totalSeconds;

        if (attempt.hasCorrect) {
          correctCount += 1;
        } else {
          wrongCount += 1;
        }

        const temaIds = teste.idtema && teste.idtema.length > 0 ? teste.idtema : ['__sem_tema__'];
        const themeLabel = temaIds
          .map((id) => (id === '__sem_tema__' ? 'Sem tema' : temaMap.get(id) || 'Tema'))
          .join(', ');

        questionPerformance.push({
          testId: teste.id,
          preview: stripHtml(teste.pergunta || '').slice(0, 120) || 'Questão sem enunciado',
          themeLabel,
          attempts: attempt.attempts,
          status: attempt.hasCorrect ? 'acerto' : 'erro',
          totalSeconds: attempt.totalSeconds
        });

        temaIds.forEach((temaId) => {
          const name = temaId === '__sem_tema__' ? 'Sem tema' : temaMap.get(temaId) || 'Tema';
          const current = byTheme.get(temaId) || {
            themeId: temaId,
            themeName: name,
            resolvedCount: 0,
            correctCount: 0,
            wrongCount: 0,
            accuracyPercent: 0,
            errorPercent: 0,
            totalSeconds: 0
          };

          current.resolvedCount += 1;
          current.totalSeconds += attempt.totalSeconds;
          if (attempt.hasCorrect) current.correctCount += 1;
          else current.wrongCount += 1;

          byTheme.set(temaId, current);
        });
      });

      const pendingTestsCount = Math.max(0, testes.length - resolvedTestsCount);
      const accuracyPercent = resolvedTestsCount > 0 ? Math.round((correctCount / resolvedTestsCount) * 100) : 0;
      const errorPercent = resolvedTestsCount > 0 ? Math.round((wrongCount / resolvedTestsCount) * 100) : 0;

      const themePerformance = Array.from(byTheme.values())
        .map((item) => ({
          ...item,
          accuracyPercent: item.resolvedCount > 0 ? Math.round((item.correctCount / item.resolvedCount) * 100) : 0,
          errorPercent: item.resolvedCount > 0 ? Math.round((item.wrongCount / item.resolvedCount) * 100) : 0
        }))
        .sort((a, b) => b.resolvedCount - a.resolvedCount || a.themeName.localeCompare(b.themeName));

      questionPerformance.sort((a, b) => b.totalSeconds - a.totalSeconds);

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
          ? supabase.from('tbf_questoes_dissertativas').select('id, created_at').in('id', questaoIds)
          : Promise.resolve({ data: [] as { id: string; created_at?: string | null }[] })
      ]);

      const totalDissertativaIds = new Set<string>([
        ...(((generalDissertativasRes.data as { id: string; created_at?: string | null }[] | null) || [])
          .filter((item) => inDateRange(item.created_at))
          .map((item) => item.id)),
        ...(((assignedDissertativasRes.data as { id: string; created_at?: string | null }[] | null) || [])
          .filter((item) => inDateRange(item.created_at))
          .map((item) => item.id))
      ]);

      const envioQuestaoIds = new Set(
        (((enviosRes.data as { questao_id: string }[] | null) || [])
          .map((item) => item.questao_id)
          .filter((id): id is string => typeof id === 'string'))
      );
      const dissertativasPendingCount = Math.max(0, totalDissertativaIds.size - envioQuestaoIds.size);

      const openDoubtsCount = duvidas.filter((duvida) => !duvida.resposta || !duvida.resposta.trim()).length;

      setMetrics({
        resolvedTestsCount,
        pendingTestsCount,
        dissertativasPendingCount,
        openDoubtsCount,
        totalStudySeconds,
        correctCount,
        wrongCount,
        accuracyPercent,
        errorPercent,
        themePerformance,
        questionPerformance
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setMetrics(initialMetrics);
    } finally {
      setLoading(false);
    }
  }, [navigate, periodEnd, periodStart, selectedAlunoId]);

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

  const hasPerformanceData = useMemo(
    () => metrics.resolvedTestsCount > 0 || metrics.questionPerformance.length > 0,
    [metrics.resolvedTestsCount, metrics.questionPerformance.length]
  );

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
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559]">
            Dashboard do Aluno
          </h1>
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {isParent && (
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl shadow-gray-200/40 border border-gray-100">
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

            <section className="bg-white rounded-2xl p-4 md:p-6 shadow-xl shadow-gray-200/30 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Período</label>
                  <select
                    value={periodPreset}
                    onChange={(e) => setPeriodPreset(e.target.value as 'all' | '7' | '30' | '90' | 'custom')}
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  >
                    <option value="all">Todo período</option>
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data início</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => {
                      setPeriodPreset('custom');
                      setPeriodStart(e.target.value);
                    }}
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data fim</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => {
                      setPeriodPreset('custom');
                      setPeriodEnd(e.target.value);
                    }}
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPeriodPreset('all');
                      setPeriodStart('');
                      setPeriodEnd('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/aluno/testes')}
                className="bg-white rounded-2xl p-5 text-left shadow-xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <FileCheck size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#A3AED0]">
                    {metrics.pendingTestsCount} pendente(s)
                  </span>
                </div>
                <p className="mt-4 text-lg font-bold text-[#1B2559]">Ir para Testes</p>
                <p className="text-sm text-[#A3AED0]">Responder e revisar exercícios</p>
              </button>

              <button
                onClick={() => navigate('/aluno/questoes-dissertativas')}
                className="bg-white rounded-2xl p-5 text-left shadow-xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <FileText size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#A3AED0]">
                    {metrics.dissertativasPendingCount} pendente(s)
                  </span>
                </div>
                <p className="mt-4 text-lg font-bold text-[#1B2559]">Questões Dissertativas</p>
                <p className="text-sm text-[#A3AED0]">Responder questões abertas enviadas</p>
              </button>

              <button
                onClick={() => navigate('/aluno/central-duvidas')}
                className="bg-white rounded-2xl p-5 text-left shadow-xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <HelpCircle size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#A3AED0]">
                    {metrics.openDoubtsCount} aberta(s)
                  </span>
                </div>
                <p className="mt-4 text-lg font-bold text-[#1B2559]">Central de Dúvidas</p>
                <p className="text-sm text-[#A3AED0]">Acompanhar perguntas e respostas</p>
              </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard
                title="Testes resolvidos"
                value={String(metrics.resolvedTestsCount)}
                subtitle="Total de exercícios já respondidos"
                icon={<FileCheck size={22} />}
                tone="blue"
                loading={loading}
              />
              <StatCard
                title="Tempo de estudo"
                value={formatDuration(metrics.totalStudySeconds)}
                subtitle="Soma de tempo gasto nas questões"
                icon={<Clock3 size={22} />}
                tone="amber"
                loading={loading}
              />
              <StatCard
                title="Acertos"
                value={`${metrics.correctCount} (${metrics.accuracyPercent}%)`}
                subtitle="Quantidade e percentual de acerto"
                icon={<CheckCircle2 size={22} />}
                tone="green"
                loading={loading}
              />
              <StatCard
                title="Erros"
                value={`${metrics.wrongCount} (${metrics.errorPercent}%)`}
                subtitle="Quantidade e percentual de erro"
                icon={<XCircle size={22} />}
                tone="red"
                loading={loading}
              />
            </section>

            {!loading && !hasPerformanceData && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/30 border border-gray-100">
                <p className="text-[#1B2559] font-bold">Ainda não há desempenho para exibir.</p>
                <p className="text-[#A3AED0] mt-2 text-sm">
                  Assim que o aluno resolver testes, os indicadores por tema e tempo por questão aparecerão aqui.
                </p>
              </div>
            )}

            <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#1B2559]">Desempenho por tema</h2>
                <p className="text-sm text-[#A3AED0]">
                  Tema, exercícios resolvidos, percentual de acerto/erro e tempo total.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-[#A3AED0] border-b border-gray-100">
                      <th className="px-6 py-4 font-bold">Tema</th>
                      <th className="px-6 py-4 font-bold">Resolvidos</th>
                      <th className="px-6 py-4 font-bold">Acerto</th>
                      <th className="px-6 py-4 font-bold">Erro</th>
                      <th className="px-6 py-4 font-bold">Tempo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-sm text-[#A3AED0]">Carregando...</td>
                      </tr>
                    ) : metrics.themePerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-sm text-[#A3AED0]">Nenhum tema com exercícios resolvidos.</td>
                      </tr>
                    ) : (
                      metrics.themePerformance.map((theme) => (
                        <tr key={theme.themeId} className="border-b border-gray-50 last:border-b-0">
                          <td className="px-6 py-4 font-semibold text-[#1B2559]">{theme.themeName}</td>
                          <td className="px-6 py-4 text-[#2B3674]">{theme.resolvedCount}</td>
                          <td className="px-6 py-4 text-green-600 font-semibold">
                            {theme.correctCount} ({theme.accuracyPercent}%)
                          </td>
                          <td className="px-6 py-4 text-red-600 font-semibold">
                            {theme.wrongCount} ({theme.errorPercent}%)
                          </td>
                          <td className="px-6 py-4 text-[#2B3674]">{formatDuration(theme.totalSeconds)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#1B2559]">Tempo gasto por questão</h2>
                <p className="text-sm text-[#A3AED0]">Total de tempo contabilizado em cada questão respondida.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="px-6 py-8 text-sm text-[#A3AED0]">Carregando...</div>
                ) : metrics.questionPerformance.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-[#A3AED0]">Nenhuma questão resolvida até o momento.</div>
                ) : (
                  metrics.questionPerformance.map((question) => (
                    <div key={question.testId} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1B2559] truncate">{question.preview}</p>
                        <p className="text-xs text-[#A3AED0] mt-1">
                          {question.themeLabel} • Tentativas: {question.attempts}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${question.status === 'acerto' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {question.status === 'acerto' ? 'Acerto' : 'Erro'}
                        </span>
                        <span className="text-sm font-semibold text-[#2B3674]">{formatDuration(question.totalSeconds)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
