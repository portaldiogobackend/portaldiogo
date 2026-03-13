import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Sidebar } from '@/components/layout/Sidebar';
import { LogoutModal } from '@/components/layout/LogoutModal';
import { CalendarCheck, ChevronLeft, Menu, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { capitalizeWords } from '@/lib/utils';

interface Aluno {
  id: string;
  nome: string;
  sobrenome?: string | null;
  serie?: string | null;
}

interface Frequencia {
  id: string;
  aluno_id: string;
  data_aula: string;
  conteudo_aula: string;
  created_at: string;
  pago?: boolean | null;
}

interface Pagamento {
  id: string;
  aluno_id: string;
  valor_pago: number;
  data_pagamento: string | null;
  periodo_referencia: string | null;
  created_at: string | null;
}

const VALOR_AULA = 125;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const toText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const toNullableText = (value: unknown) => {
  const text = toText(value).trim();
  return text ? text : null;
};

const toBooleanOrNull = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateValue = (value?: string | null) => {
  const text = toText(value).trim();
  if (!text) return null;
  const dateOnlyMatch = text.match(DATE_ONLY_REGEX);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const localDate = new Date(year, month - 1, day);
    if (
      localDate.getFullYear() === year
      && localDate.getMonth() === month - 1
      && localDate.getDate() === day
    ) {
      return localDate;
    }
    return null;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getTimeOrNull = (value?: string | null) => {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  return parsed.getTime();
};

const formatDate = (value?: string | null) => {
  const parsed = parseDateValue(value);
  if (!parsed) return '-';
  return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
};

const formatMonthLabel = (value?: string | null) => {
  const parsed = parseDateValue(value);
  if (!parsed) return 'Sem data';
  return capitalizeWords(format(parsed, 'MMMM yyyy', { locale: ptBR }));
};

const toDateInputValue = (value?: string | null) => {
  const text = toText(value).trim();
  if (!text) return '';
  const dateOnlyMatch = text.match(DATE_ONLY_REGEX);
  if (dateOnlyMatch) return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  const parsed = parseDateValue(text);
  if (!parsed) return '';
  return format(parsed, 'yyyy-MM-dd');
};

type GroupedByMonth<T> = {
  key: string;
  label: string;
  items: T[];
};

type FinancialStats = {
  totalPago: number;
  aulasRegistradas: number;
  aulasPagas: number;
  aulasEmAberto: number;
  aulasEmHaver: number;
};

const groupByMonth = <T,>(items: T[], getDate: (item: T) => string | null | undefined) => {
  const map = new Map<string, GroupedByMonth<T>>();
  items.forEach((item) => {
    const dateValue = getDate(item);
    const time = getTimeOrNull(dateValue);
    const validDate = time !== null;
    const date = validDate ? new Date(time) : null;
    const key = date ? format(date, 'yyyy-MM') : 'sem-data';
    const label = validDate ? formatMonthLabel(dateValue) : 'Sem data';
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, { key, label, items: [item] });
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === 'sem-data') return 1;
    if (b.key === 'sem-data') return -1;
    return b.key.localeCompare(a.key);
  });
};

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortByDateDesc = <T,>(items: T[], getDate: (item: T) => string | null | undefined) => {
  return [...items].sort((a, b) => {
    const aTime = getTimeOrNull(getDate(a));
    const bTime = getTimeOrNull(getDate(b));
    const safeA = aTime ?? 0;
    const safeB = bTime ?? 0;
    return safeB - safeA;
  });
};

const normalizeFrequencia = (item: Partial<Frequencia> | null | undefined): Frequencia => ({
  id: toText(item?.id),
  aluno_id: toText(item?.aluno_id),
  data_aula: toText(item?.data_aula),
  conteudo_aula: toText(item?.conteudo_aula),
  created_at: toText(item?.created_at),
  pago: toBooleanOrNull(item?.pago)
});

const normalizePagamento = (item: Partial<Pagamento> | null | undefined): Pagamento => ({
  id: toText(item?.id),
  aluno_id: toText(item?.aluno_id),
  valor_pago: toNumber(item?.valor_pago),
  data_pagamento: toNullableText(item?.data_pagamento),
  periodo_referencia: toNullableText(item?.periodo_referencia),
  created_at: toNullableText(item?.created_at)
});

const getMonthKey = (value?: string | null) => {
  const time = getTimeOrNull(value);
  if (time === null) return '';
  const date = new Date(time);
  return format(date, 'yyyy-MM');
};

const parsePeriodoReferenciaToMonthKey = (periodo?: string | null) => {
  if (!periodo) return '';
  const normalized = periodo.trim().toLowerCase();
  if (!normalized) return '';

  const numeric = normalized.match(/(\d{1,2})\D+(\d{4})/);
  if (numeric) {
    const month = Math.max(1, Math.min(12, Number(numeric[1])));
    const year = Number(numeric[2]);
    if (!Number.isNaN(year)) return `${year}-${String(month).padStart(2, '0')}`;
  }

  const months: Record<string, number> = {
    janeiro: 1,
    fevereiro: 2,
    marco: 3,
    março: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12
  };
  const words = normalized.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const yearWord = words.find((word) => /^\d{4}$/.test(word));
  const monthWord = words.find((word) => months[word] !== undefined);
  if (yearWord && monthWord) {
    return `${yearWord}-${String(months[monthWord]).padStart(2, '0')}`;
  }

  return '';
};

const formatMonthKeyToPeriodo = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  if (!year || !month) return '';
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (Number.isNaN(numericYear) || Number.isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return '';
  }
  const date = new Date(numericYear, numericMonth - 1, 1);
  return `${capitalizeWords(format(date, 'MMMM', { locale: ptBR }))}/${numericYear}`;
};

const isMissingPagoColumnError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: unknown }).code || '').toUpperCase();
  const message = String((error as { message?: unknown }).message || '').toLowerCase();
  const details = String((error as { details?: unknown }).details || '').toLowerCase();
  const hint = String((error as { hint?: unknown }).hint || '').toLowerCase();
  return code === 'PGRST204'
    || code === '42703'
    || (message.includes('column') && message.includes('pago'))
    || (details.includes('column') && details.includes('pago'))
    || (hint.includes('column') && hint.includes('pago'));
};

const getSupabaseErrorDetails = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return { message: 'Erro desconhecido', details: '', hint: '', code: '' };
  }

  const candidate = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };

  return {
    message: toText(candidate.message) || 'Erro desconhecido',
    details: toText(candidate.details),
    hint: toText(candidate.hint),
    code: toText(candidate.code)
  };
};

export const FrequenciaPagamentos: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Professor');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isParent, setIsParent] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const [isFrequenciaModalOpen, setIsFrequenciaModalOpen] = useState(false);
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [savingFrequencia, setSavingFrequencia] = useState(false);
  const [savingPagamento, setSavingPagamento] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currentFrequencia, setCurrentFrequencia] = useState<Frequencia | null>(null);
  const [currentPagamento, setCurrentPagamento] = useState<Pagamento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'frequencia' | 'pagamento'; id: string } | null>(null);

  const [frequenciaForm, setFrequenciaForm] = useState({
    aluno_id: '',
    data_aula: '',
    conteudo_aula: '',
    status_pagamento: 'aberto' as 'pago' | 'aberto'
  });

  const [pagamentoForm, setPagamentoForm] = useState({
    aluno_id: '',
    valor_pago: '',
    data_pagamento: '',
    periodo_referencia: ''
  });

  const [freqAlunoId, setFreqAlunoId] = useState('');
  const [freqStatus, setFreqStatus] = useState<'todos' | 'pago' | 'aberto'>('todos');
  const [freqMonth, setFreqMonth] = useState('');
  const [freqStart, setFreqStart] = useState('');
  const [freqEnd, setFreqEnd] = useState('');
  const [pagAlunoId, setPagAlunoId] = useState('');
  const [pagMonth, setPagMonth] = useState('');
  const [pagPeriodo, setPagPeriodo] = useState('');
  const [pagStart, setPagStart] = useState('');
  const [pagEnd, setPagEnd] = useState('');
  const [supportsPagoColumn, setSupportsPagoColumn] = useState<boolean | null>(null);

  const isStaff = userRole === 'admin' || userRole === 'professor';

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const ensurePagoColumnSupport = useCallback(async () => {
    if (supportsPagoColumn !== null) return supportsPagoColumn;
    const { error } = await supabase
      .from('tbf_frequencias')
      .select('id, pago')
      .limit(1);

    if (!error) {
      setSupportsPagoColumn(true);
      return true;
    }
    if (isMissingPagoColumnError(error)) {
      setSupportsPagoColumn(false);
      return false;
    }
    console.error('Erro ao verificar suporte da coluna pago:', error);
    setSupportsPagoColumn(false);
    return false;
  }, [supportsPagoColumn]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('tbf_controle_user')
          .select('nome, role, signature, emailaluno')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        if (userData?.nome) {
          setUserName(capitalizeWords(userData.nome.split(' ')[0]));
        }
        setUserRole(userData?.role ?? null);
        if (userData?.signature && userData.signature !== 'ativo') {
          navigate('/aguardando-aprovacao');
          return;
        }
        if (userData?.role !== 'admin' && userData?.role !== 'professor' && userData?.role !== 'pai') {
          return;
        }

        if (userData?.role === 'pai') {
          setIsParent(true);
          const emails = (userData.emailaluno || '')
            .split(',')
            .map((item: string) => item.trim().toLowerCase())
            .filter(Boolean);

          if (emails.length === 0) {
            setAlunos([]);
            setFrequencias([]);
            setPagamentos([]);
            return;
          }

          const { data: linkedAlunos, error: linkedError } = await supabase
            .from('tbf_controle_user')
            .select('id, nome, sobrenome, serie')
            .in('email', emails)
            .eq('role', 'aluno')
            .order('nome');
          if (linkedError) throw linkedError;

          const linked = (linkedAlunos as Aluno[]) || [];
          setAlunos(linked);

          const ids = linked.map(aluno => aluno.id);
          if (ids.length === 0) {
            setFrequencias([]);
            setPagamentos([]);
            return;
          }

          const stored = sessionStorage.getItem('parent_selected_aluno_id');
          const storedValid = stored && ids.includes(stored);
          if (!freqAlunoId) {
            const defaultAluno = storedValid ? stored : ids[0];
            setFreqAlunoId(defaultAluno);
            setPagAlunoId(defaultAluno);
          }

          const [frequenciasRes, pagamentosRes] = await Promise.all([
            supabase
              .from('tbf_frequencias')
              .select('*')
              .in('aluno_id', ids)
              .order('data_aula', { ascending: false }),
            supabase
              .from('tbf_pagamentos')
              .select('*')
              .in('aluno_id', ids)
              .order('data_pagamento', { ascending: false })
          ]);

          if (frequenciasRes.error) throw frequenciasRes.error;
          if (pagamentosRes.error) throw pagamentosRes.error;

          setFrequencias(((frequenciasRes.data as Frequencia[]) || []).map(normalizeFrequencia));
          setPagamentos(((pagamentosRes.data as Pagamento[]) || []).map(normalizePagamento));
          return;
        }

        setIsParent(false);
      }

      const [alunosRes, frequenciasRes, pagamentosRes] = await Promise.all([
        supabase
          .from('tbf_controle_user')
          .select('id, nome, sobrenome, serie')
          .eq('role', 'aluno')
          .order('nome'),
        supabase
          .from('tbf_frequencias')
          .select('*')
          .order('data_aula', { ascending: false }),
        supabase
          .from('tbf_pagamentos')
          .select('*')
          .order('data_pagamento', { ascending: false })
      ]);

      if (alunosRes.error) throw alunosRes.error;
      if (frequenciasRes.error) throw frequenciasRes.error;
      if (pagamentosRes.error) throw pagamentosRes.error;

      setAlunos((alunosRes.data as Aluno[]) || []);
      setFrequencias(((frequenciasRes.data as Frequencia[]) || []).map(normalizeFrequencia));
      setPagamentos(((pagamentosRes.data as Pagamento[]) || []).map(normalizePagamento));
    } catch {
      showToast('Erro ao carregar dados. Verifique as tabelas do banco.', 'error');
    } finally {
      setLoading(false);
    }
  }, [freqAlunoId, navigate, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const target = freqAlunoId || pagAlunoId;
    if (!isParent || !target) return;
    sessionStorage.setItem('parent_selected_aluno_id', target);
  }, [freqAlunoId, isParent, pagAlunoId]);

  const alunoNome = (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return 'Aluno';
    return capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim());
  };

  const paidFrequenciaIds = useMemo(() => {
    const paidIds = new Set<string>();
    const frequenciasByAluno = new Map<string, Frequencia[]>();

    frequencias.forEach((frequencia) => {
      const existing = frequenciasByAluno.get(frequencia.aluno_id) || [];
      existing.push(frequencia);
      frequenciasByAluno.set(frequencia.aluno_id, existing);
    });

    frequenciasByAluno.forEach((alunoFrequencias, alunoId) => {
      const ordered = [...alunoFrequencias].sort((a, b) => {
        const safeA = getTimeOrNull(a.data_aula) ?? 0;
        const safeB = getTimeOrNull(b.data_aula) ?? 0;
        if (safeA !== safeB) return safeA - safeB;
        return toText(a.created_at).localeCompare(toText(b.created_at));
      });

      const totalPago = pagamentos
        .filter((pagamento) => pagamento.aluno_id === alunoId)
        .reduce((acc, pagamento) => acc + Math.max(0, toNumber(pagamento.valor_pago)), 0);

      const aulasQuitadas = Math.floor(totalPago / VALOR_AULA);
      const manualPaid = ordered.filter((frequencia) => frequencia.pago === true);
      const manualOpenIds = new Set(ordered.filter((frequencia) => frequencia.pago === false).map((frequencia) => frequencia.id));

      manualPaid.forEach((frequencia) => {
        if (frequencia.id) paidIds.add(frequencia.id);
      });

      const remainingSlots = Math.max(0, aulasQuitadas - manualPaid.length);
      const autoCandidates = ordered.filter((frequencia) => !manualOpenIds.has(frequencia.id) && frequencia.pago !== true);
      autoCandidates.slice(0, remainingSlots).forEach((frequencia) => {
        if (frequencia.id) paidIds.add(frequencia.id);
      });
    });

    return paidIds;
  }, [frequencias, pagamentos]);

  const isFrequenciaPaid = useCallback((frequencia: Frequencia) => paidFrequenciaIds.has(frequencia.id), [paidFrequenciaIds]);

  const alunoFinancialStatsById = useMemo(() => {
    const allAlunoIds = new Set<string>();
    frequencias.forEach((item) => {
      if (item.aluno_id) allAlunoIds.add(item.aluno_id);
    });
    pagamentos.forEach((item) => {
      if (item.aluno_id) allAlunoIds.add(item.aluno_id);
    });

    const map = new Map<string, FinancialStats>();
    allAlunoIds.forEach((alunoId) => {
      const frequenciasAluno = frequencias.filter((item) => item.aluno_id === alunoId);
      const aulasRegistradas = frequenciasAluno.length;
      const aulasPagas = frequenciasAluno.filter((item) => paidFrequenciaIds.has(item.id)).length;
      const totalPago = pagamentos
        .filter((pagamento) => pagamento.aluno_id === alunoId)
        .reduce((acc, pagamento) => acc + Math.max(0, toNumber(pagamento.valor_pago)), 0);
      const totalAulasPagasPeloValor = Math.floor(totalPago / VALOR_AULA);
      const aulasEmAberto = Math.max(0, aulasRegistradas - aulasPagas);
      const aulasEmHaver = Math.max(0, totalAulasPagasPeloValor - aulasPagas);
      map.set(alunoId, { totalPago, aulasRegistradas, aulasPagas, aulasEmAberto, aulasEmHaver });
    });

    return map;
  }, [frequencias, pagamentos, paidFrequenciaIds]);

  const getAlunoFinancialStats = useCallback((alunoId?: string): FinancialStats => {
    if (!alunoId) {
      return { totalPago: 0, aulasRegistradas: 0, aulasPagas: 0, aulasEmAberto: 0, aulasEmHaver: 0 };
    }
    return alunoFinancialStatsById.get(alunoId) || { totalPago: 0, aulasRegistradas: 0, aulasPagas: 0, aulasEmAberto: 0, aulasEmHaver: 0 };
  }, [alunoFinancialStatsById]);

  const renderAlunoWithCredito = (alunoId: string) => {
    const stats = getAlunoFinancialStats(alunoId);
    return (
      <div className="flex items-center gap-2">
        <span>{alunoNome(alunoId)}</span>
        {stats.aulasEmHaver > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
            Crédito: {stats.aulasEmHaver}
          </span>
        )}
      </div>
    );
  };

  const openCreateFrequencia = () => {
    setCurrentFrequencia(null);
    const initialAlunoId = freqAlunoId || '';
    const stats = getAlunoFinancialStats(initialAlunoId);
    setFrequenciaForm({
      aluno_id: initialAlunoId,
      data_aula: '',
      conteudo_aula: '',
      status_pagamento: stats.aulasEmHaver > 0 ? 'pago' : 'aberto'
    });
    setIsFrequenciaModalOpen(true);
  };

  const openEditFrequencia = (item: Frequencia) => {
    setCurrentFrequencia(item);
    setFrequenciaForm({
      aluno_id: item.aluno_id,
      data_aula: toDateInputValue(item.data_aula),
      conteudo_aula: item.conteudo_aula || '',
      status_pagamento: item.pago === true ? 'pago' : item.pago === false ? 'aberto' : (isFrequenciaPaid(item) ? 'pago' : 'aberto')
    });
    setIsFrequenciaModalOpen(true);
  };

  const openCreatePagamento = () => {
    setCurrentPagamento(null);
    setPagamentoForm({ aluno_id: '', valor_pago: '', data_pagamento: '', periodo_referencia: '' });
    setIsPagamentoModalOpen(true);
  };

  const openEditPagamento = (item: Pagamento) => {
    setCurrentPagamento(item);
    setPagamentoForm({
      aluno_id: item.aluno_id,
      valor_pago: item.valor_pago?.toString() || '',
      data_pagamento: toDateInputValue(item.data_pagamento),
      periodo_referencia: item.periodo_referencia || ''
    });
    setIsPagamentoModalOpen(true);
  };

  const openCreatePagamentoFromFrequencia = () => {
    if (!freqAlunoId) {
      showToast('Selecione um aluno no filtro de frequência.', 'error');
      return;
    }
    if (!freqMonth) {
      showToast('Selecione o mês/ano no filtro de frequência.', 'error');
      return;
    }

    const existingPagamento = pagamentos.find((pagamento) => {
      if (pagamento.aluno_id !== freqAlunoId) return false;
      const byData = getMonthKey(pagamento.data_pagamento);
      const byPeriodo = parsePeriodoReferenciaToMonthKey(pagamento.periodo_referencia);
      return byData === freqMonth || byPeriodo === freqMonth;
    });

    if (existingPagamento) {
      openEditPagamento(existingPagamento);
      showToast('Já existe pagamento neste período. Edite os dados e salve.', 'success');
      return;
    }

    setCurrentPagamento(null);
    setPagamentoForm({
      aluno_id: freqAlunoId,
      valor_pago: '',
      data_pagamento: `${freqMonth}-01`,
      periodo_referencia: formatMonthKeyToPeriodo(freqMonth)
    });
    setPagAlunoId(freqAlunoId);
    setPagMonth(freqMonth);
    setIsPagamentoModalOpen(true);
  };

  const handleSaveFrequencia = async () => {
    if (!frequenciaForm.aluno_id || !frequenciaForm.data_aula || !frequenciaForm.conteudo_aula.trim()) {
      showToast('Preencha aluno, data da aula e conteúdo.', 'error');
      return;
    }
    setSavingFrequencia(true);
    try {
      const pagoValue = frequenciaForm.status_pagamento === 'pago';
      const canPersistPago = await ensurePagoColumnSupport();
      const dataAulaValue = toDateInputValue(frequenciaForm.data_aula);
      const basePayload = {
        aluno_id: frequenciaForm.aluno_id,
        data_aula: dataAulaValue,
        conteudo_aula: frequenciaForm.conteudo_aula.trim()
      };
      const payload = canPersistPago ? { ...basePayload, pago: pagoValue } : basePayload;

      console.log('[Frequencia] Salvando registro', {
        mode: currentFrequencia ? 'update' : 'insert',
        currentFrequenciaId: currentFrequencia?.id || null,
        supportsPagoColumn,
        payload
      });

      if (currentFrequencia) {
        const updateWithPago = async (includePago: boolean) => supabase
          .from('tbf_frequencias')
          .update(includePago ? { ...basePayload, pago: pagoValue } : basePayload)
          .eq('id', currentFrequencia.id)
          .select('*')
          .single();

        let result = await updateWithPago(canPersistPago);
        if (result.error && canPersistPago && isMissingPagoColumnError(result.error)) {
          setSupportsPagoColumn(false);
          result = await updateWithPago(false);
        } else if (!result.error && canPersistPago) {
          setSupportsPagoColumn(true);
        }

        const { data, error } = result;
        if (error) {
          console.error('[Frequencia] Falha no update', {
            error: getSupabaseErrorDetails(error),
            currentFrequenciaId: currentFrequencia.id,
            payload
          });
        }
        if (error) throw error;
        const updated = normalizeFrequencia(data as Frequencia);
        if (!canPersistPago) updated.pago = pagoValue;
        if (!updated.id) {
          await fetchInitialData();
        } else {
          setFrequencias((prev) =>
            sortByDateDesc(
              prev.map((item) => (item.id === updated.id ? updated : item)),
              (item) => item.data_aula
            )
          );
        }
        showToast('Frequência atualizada.', 'success');
      } else {
        const insertWithPago = async (includePago: boolean) => supabase
          .from('tbf_frequencias')
          .insert([includePago ? { ...basePayload, pago: pagoValue } : basePayload])
          .select('*')
          .single();

        let result = await insertWithPago(canPersistPago);
        if (result.error && canPersistPago && isMissingPagoColumnError(result.error)) {
          setSupportsPagoColumn(false);
          result = await insertWithPago(false);
        } else if (!result.error && canPersistPago) {
          setSupportsPagoColumn(true);
        }

        const { data, error } = result;
        if (error) {
          console.error('[Frequencia] Falha no insert', {
            error: getSupabaseErrorDetails(error),
            payload
          });
        }
        if (error) throw error;
        const inserted = normalizeFrequencia(data as Frequencia);
        if (!canPersistPago) inserted.pago = pagoValue;
        if (!inserted.id) {
          await fetchInitialData();
        } else {
          setFrequencias((prev) => sortByDateDesc([inserted, ...prev], (item) => item.data_aula));
        }
        showToast('Frequência registrada.', 'success');
      }
      setIsFrequenciaModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar frequência:', error);
      showToast('Erro ao salvar frequência.', 'error');
    } finally {
      setSavingFrequencia(false);
    }
  };

  const handleSavePagamento = async () => {
    if (!pagamentoForm.aluno_id || !pagamentoForm.data_pagamento || !pagamentoForm.periodo_referencia.trim()) {
      showToast('Preencha aluno, data e período de referência.', 'error');
      return;
    }
    const valorPago = toNumber(pagamentoForm.valor_pago);
    if (valorPago <= 0) {
      showToast('Informe um valor pago válido.', 'error');
      return;
    }
    setSavingPagamento(true);
    try {
      const dataPagamentoValue = toDateInputValue(pagamentoForm.data_pagamento);
      const payload = {
        aluno_id: pagamentoForm.aluno_id,
        valor_pago: valorPago,
        data_pagamento: dataPagamentoValue,
        periodo_referencia: pagamentoForm.periodo_referencia.trim()
      };

      console.log('[Pagamento] Salvando registro', {
        mode: currentPagamento ? 'update' : 'insert',
        currentPagamentoId: currentPagamento?.id || null,
        payload
      });

      if (currentPagamento) {
        const { data, error } = await supabase
          .from('tbf_pagamentos')
          .update(payload)
          .eq('id', currentPagamento.id)
          .select('*')
          .single();
        if (error) {
          console.error('[Pagamento] Falha no update', {
            error: getSupabaseErrorDetails(error),
            currentPagamentoId: currentPagamento.id,
            payload
          });
        }
        if (error) throw error;
        const updated = normalizePagamento(data as Pagamento);
        if (!updated.id) {
          await fetchInitialData();
        } else {
          setPagamentos((prev) =>
            sortByDateDesc(
              prev.map((item) => (item.id === updated.id ? updated : item)),
              (item) => item.data_pagamento
            )
          );
        }
        const aulasQuitadas = Math.floor(valorPago / VALOR_AULA);
        showToast(`Pagamento atualizado. Baixa automática para até ${aulasQuitadas} aula(s).`, 'success');
      } else {
        const { data, error } = await supabase
          .from('tbf_pagamentos')
          .insert([payload])
          .select('*')
          .single();
        if (error) {
          console.error('[Pagamento] Falha no insert', {
            error: getSupabaseErrorDetails(error),
            payload
          });
        }
        if (error) throw error;
        const inserted = normalizePagamento(data as Pagamento);
        if (!inserted.id) {
          await fetchInitialData();
        } else {
          setPagamentos((prev) => sortByDateDesc([inserted, ...prev], (item) => item.data_pagamento));
        }
        const aulasQuitadas = Math.floor(valorPago / VALOR_AULA);
        showToast(`Pagamento registrado. Baixa automática para até ${aulasQuitadas} aula(s).`, 'success');
      }
      setIsPagamentoModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      showToast('Erro ao salvar pagamento.', 'error');
    } finally {
      setSavingPagamento(false);
    }
  };

  const confirmDelete = (type: 'frequencia' | 'pagamento', id: string) => {
    setDeleteTarget({ type, id });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const table = deleteTarget.type === 'frequencia' ? 'tbf_frequencias' : 'tbf_pagamentos';
      const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
      if (error) throw error;
      showToast('Registro excluído.', 'success');
      await fetchInitialData();
      setIsDeleteModalOpen(false);
    } catch {
      showToast('Erro ao excluir registro.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredFrequencias = useMemo(() => {
    return frequencias.filter((item) => {
      if (freqAlunoId && item.aluno_id !== freqAlunoId) return false;
      if (freqMonth && getMonthKey(item.data_aula) !== freqMonth) return false;
      const isPago = isFrequenciaPaid(item);
      if (freqStatus === 'pago' && !isPago) return false;
      if (freqStatus === 'aberto' && isPago) return false;
      if (freqStart) {
        const itemTime = getTimeOrNull(item.data_aula);
        const startTime = getTimeOrNull(freqStart);
        if (itemTime !== null && startTime !== null && itemTime < startTime) return false;
      }
      if (freqEnd) {
        const itemTime = getTimeOrNull(item.data_aula);
        const endTime = getTimeOrNull(freqEnd);
        if (itemTime !== null && endTime !== null && itemTime > endTime) return false;
      }
      return true;
    });
  }, [freqAlunoId, freqEnd, freqMonth, freqStart, freqStatus, frequencias, isFrequenciaPaid]);

  const filteredPagamentos = useMemo(() => {
    return pagamentos.filter((item) => {
      if (pagAlunoId && item.aluno_id !== pagAlunoId) return false;
      if (pagMonth && getMonthKey(item.data_pagamento) !== pagMonth) return false;
      const periodoReferencia = typeof item.periodo_referencia === 'string' ? item.periodo_referencia : '';
      if (pagPeriodo && !periodoReferencia.toLowerCase().includes(pagPeriodo.toLowerCase())) return false;
      if (pagStart) {
        const itemTime = getTimeOrNull(item.data_pagamento);
        const startTime = getTimeOrNull(pagStart);
        if (itemTime !== null && startTime !== null && itemTime < startTime) return false;
      }
      if (pagEnd) {
        const itemTime = getTimeOrNull(item.data_pagamento);
        const endTime = getTimeOrNull(pagEnd);
        if (itemTime !== null && endTime !== null && itemTime > endTime) return false;
      }
      return true;
    });
  }, [pagAlunoId, pagEnd, pagMonth, pagPeriodo, pagStart, pagamentos]);

  const groupedFrequencias = useMemo(
    () => groupByMonth(filteredFrequencias, (item) => item.data_aula),
    [filteredFrequencias]
  );

  const groupedPagamentos = useMemo(
    () => groupByMonth(filteredPagamentos, (item) => item.data_pagamento),
    [filteredPagamentos]
  );

  const totalRecebido = filteredPagamentos.reduce((acc, item) => acc + toNumber(item.valor_pago), 0);
  const aulasEmAberto = filteredFrequencias.filter((item) => !isFrequenciaPaid(item)).length;

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <Sidebar
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
        onConfirm={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="min-h-[80px] md:h-24 flex items-center justify-between px-4 md:px-10 py-4 gap-4 bg-[#F4F7FE] md:bg-transparent z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-[#1B2559] p-2 hover:bg-white/50 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <button
              onClick={() => navigate('/setup-inicial')}
              className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              Voltar
            </button>
          </div>

          <div className="flex flex-col items-end gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] flex items-center gap-2">
              <CalendarCheck size={24} />
              Frequência e Pagamentos
            </h1>
            {isStaff && (
              <div className="flex flex-wrap gap-2 justify-end">
                <Button onClick={openCreateFrequencia} className="bg-[#4318FF] hover:bg-[#3311CC]">
                  <Plus size={18} className="mr-2" />
                  Registrar Frequência
                </Button>
                <Button onClick={openCreatePagamento} variant="secondary">
                  <Plus size={18} className="mr-2" />
                  Registrar Pagamento
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : !isStaff && !isParent ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-gray-200/40">
                <h3 className="text-xl font-bold text-gray-700 mb-2">Acesso restrito</h3>
                <p className="text-gray-400">Esta área é exclusiva para professores e administradores.</p>
              </div>
            ) : (
              <>
                {isStaff && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[#1B2559]">Frequência</h2>
                        <span className="text-sm text-gray-400">{filteredFrequencias.length} registros</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-400 uppercase text-xs">
                              <th className="py-2">Aluno</th>
                              <th className="py-2">Data</th>
                              <th className="py-2">Conteúdo</th>
                              <th className="py-2">Financeiro</th>
                              <th className="py-2 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedFrequencias.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-gray-400">
                                  Nenhum registro de frequência para o filtro selecionado.
                                </td>
                              </tr>
                            ) : (
                              groupedFrequencias.map((group) => (
                                <React.Fragment key={group.key}>
                                  <tr className="bg-gray-50">
                                    <td colSpan={5} className="py-2 px-3 text-xs font-bold text-gray-500 uppercase">
                                      {group.label}
                                    </td>
                                  </tr>
                                  {group.items.map((item) => (
                                    <tr key={item.id} className={`border-t border-gray-100 ${isFrequenciaPaid(item) ? '' : 'bg-amber-50/60'}`}>
                                      <td className="py-3 font-medium text-[#1B2559]">{renderAlunoWithCredito(item.aluno_id)}</td>
                                      <td className="py-3">{formatDate(item.data_aula)}</td>
                                      <td className="py-3 text-gray-600 max-w-[240px] truncate">{item.conteudo_aula}</td>
                                      <td className="py-3">
                                      {isFrequenciaPaid(item) ? (
                                          <span className="text-green-600 font-semibold">Pago</span>
                                        ) : (
                                          <span className="text-orange-600 font-semibold">Em aberto</span>
                                        )}
                                      </td>
                                      <td className="py-3">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            className="p-2 rounded-lg text-[#4318FF] hover:bg-[#F4F7FE]"
                                            onClick={() => openEditFrequencia(item)}
                                          >
                                            <Pencil size={16} />
                                          </button>
                                          <button
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                            onClick={() => confirmDelete('frequencia', item.id)}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[#1B2559]">Pagamentos</h2>
                        <span className="text-sm text-gray-400">{filteredPagamentos.length} registros</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-400 uppercase text-xs">
                              <th className="py-2">Aluno</th>
                              <th className="py-2">Data</th>
                              <th className="py-2">Período</th>
                              <th className="py-2">Valor</th>
                              <th className="py-2 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedPagamentos.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-gray-400">
                                  Nenhum pagamento para o filtro selecionado.
                                </td>
                              </tr>
                            ) : (
                              groupedPagamentos.map((group) => (
                                <React.Fragment key={group.key}>
                                  <tr className="bg-gray-50">
                                    <td colSpan={5} className="py-2 px-3 text-xs font-bold text-gray-500 uppercase">
                                      {group.label}
                                    </td>
                                  </tr>
                                  {group.items.map((item) => (
                                    <tr key={item.id} className="border-t border-gray-100">
                                      <td className="py-3 font-medium text-[#1B2559]">{renderAlunoWithCredito(item.aluno_id)}</td>
                                      <td className="py-3">{formatDate(item.data_pagamento)}</td>
                                      <td className="py-3 text-gray-600">{item.periodo_referencia}</td>
                                      <td className="py-3 font-semibold text-[#1B2559]">{currencyFormatter.format(toNumber(item.valor_pago))}</td>
                                      <td className="py-3">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            className="p-2 rounded-lg text-[#4318FF] hover:bg-[#F4F7FE]"
                                            onClick={() => openEditPagamento(item)}
                                          >
                                            <Pencil size={16} />
                                          </button>
                                          <button
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                            onClick={() => confirmDelete('pagamento', item.id)}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-[#1B2559]">Relatório</h2>
                    <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                      <Printer size={18} />
                      Imprimir Relatório
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
                      <p className="text-sm font-bold text-[#1B2559]">Filtros de Frequência</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Aluno</label>
                          <select
                            value={freqAlunoId}
                            onChange={(e) => setFreqAlunoId(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          >
                            <option value="">Todos</option>
                            {alunos.map((aluno) => (
                              <option key={aluno.id} value={aluno.id}>
                                {capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Mês/Ano</label>
                          <input
                            type="month"
                            value={freqMonth}
                            onChange={(e) => setFreqMonth(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Situação</label>
                          <select
                            value={freqStatus}
                            onChange={(e) => setFreqStatus(e.target.value as 'todos' | 'pago' | 'aberto')}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          >
                            <option value="todos">Todos</option>
                            <option value="pago">Pagas</option>
                            <option value="aberto">Em aberto</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Data início</label>
                          <input
                            type="date"
                            value={freqStart}
                            onChange={(e) => setFreqStart(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Data fim</label>
                          <input
                            type="date"
                            value={freqEnd}
                            onChange={(e) => setFreqEnd(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                      </div>
                      {isStaff && (
                        <div className="flex justify-end pt-2">
                          <Button onClick={openCreatePagamentoFromFrequencia} variant="secondary">
                            Marcar período como pago
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
                      <p className="text-sm font-bold text-[#1B2559]">Filtros de Pagamentos</p>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Aluno</label>
                          <select
                            value={pagAlunoId}
                            onChange={(e) => setPagAlunoId(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          >
                            <option value="">Todos</option>
                            {alunos.map((aluno) => (
                              <option key={aluno.id} value={aluno.id}>
                                {capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Mês/Ano</label>
                          <input
                            type="month"
                            value={pagMonth}
                            onChange={(e) => setPagMonth(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Período ref.</label>
                          <input
                            type="text"
                            value={pagPeriodo}
                            onChange={(e) => setPagPeriodo(e.target.value)}
                            placeholder="Ex: Março/2026"
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Data início</label>
                          <input
                            type="date"
                            value={pagStart}
                            onChange={(e) => setPagStart(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Data fim</label>
                          <input
                            type="date"
                            value={pagEnd}
                            onChange={(e) => setPagEnd(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F4F7FE] rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Aulas registradas</p>
                      <p className="text-2xl font-bold text-[#1B2559]">{filteredFrequencias.length}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Aulas em aberto</p>
                      <p className="text-2xl font-bold text-[#1B2559]">{aulasEmAberto}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Total recebido</p>
                      <p className="text-2xl font-bold text-[#1B2559]">{currencyFormatter.format(totalRecebido)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-400 uppercase text-xs">
                            <th className="py-3 px-4">Aluno</th>
                            <th className="py-3 px-4">Data</th>
                            <th className="py-3 px-4">Conteúdo</th>
                            <th className="py-3 px-4">Financeiro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedFrequencias.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-400">
                                Nenhuma frequência para o filtro selecionado.
                              </td>
                            </tr>
                          ) : (
                            groupedFrequencias.map((group) => (
                              <React.Fragment key={group.key}>
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="py-2 px-4 text-xs font-bold text-gray-500 uppercase">
                                    {group.label}
                                  </td>
                                </tr>
                                {group.items.map((item) => (
                                  <tr key={item.id} className={`border-t border-gray-100 ${isFrequenciaPaid(item) ? '' : 'bg-amber-50/60'}`}>
                                    <td className="py-3 px-4 font-medium text-[#1B2559]">{renderAlunoWithCredito(item.aluno_id)}</td>
                                    <td className="py-3 px-4">{formatDate(item.data_aula)}</td>
                                    <td className="py-3 px-4 text-gray-600">{item.conteudo_aula}</td>
                                    <td className="py-3 px-4">
                                      {isFrequenciaPaid(item) ? (
                                        <span className="text-green-600 font-semibold">Pago</span>
                                      ) : (
                                        <span className="text-orange-600 font-semibold">Em aberto</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-400 uppercase text-xs">
                            <th className="py-3 px-4">Aluno</th>
                            <th className="py-3 px-4">Data</th>
                            <th className="py-3 px-4">Período</th>
                            <th className="py-3 px-4">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedPagamentos.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-400">
                                Nenhum pagamento para o filtro selecionado.
                              </td>
                            </tr>
                          ) : (
                            groupedPagamentos.map((group) => (
                              <React.Fragment key={group.key}>
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="py-2 px-4 text-xs font-bold text-gray-500 uppercase">
                                    {group.label}
                                  </td>
                                </tr>
                                {group.items.map((item) => (
                                  <tr key={item.id} className="border-t border-gray-100">
                                    <td className="py-3 px-4 font-medium text-[#1B2559]">{renderAlunoWithCredito(item.aluno_id)}</td>
                                    <td className="py-3 px-4">{formatDate(item.data_pagamento)}</td>
                                    <td className="py-3 px-4 text-gray-600">{item.periodo_referencia}</td>
                                    <td className="py-3 px-4 font-semibold text-[#1B2559]">{currencyFormatter.format(toNumber(item.valor_pago))}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isFrequenciaModalOpen}
        onClose={() => setIsFrequenciaModalOpen(false)}
        title={currentFrequencia ? 'Editar Frequência' : 'Registrar Frequência'}
        className="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aluno *</label>
            <select
              value={frequenciaForm.aluno_id}
              onChange={(e) => {
                const alunoId = e.target.value;
                const stats = getAlunoFinancialStats(alunoId);
                setFrequenciaForm(prev => ({
                  ...prev,
                  aluno_id: alunoId,
                  status_pagamento: stats.aulasEmHaver > 0 ? 'pago' : prev.status_pagamento
                }));
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="">Selecione</option>
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>
                  {capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}
                </option>
              ))}
            </select>
            {frequenciaForm.aluno_id && (
              <p className="text-xs text-gray-500">
                Aulas em haver: <span className="font-semibold text-[#1B2559]">{getAlunoFinancialStats(frequenciaForm.aluno_id).aulasEmHaver}</span> |
                Aulas em aberto: <span className="font-semibold text-[#1B2559]">{getAlunoFinancialStats(frequenciaForm.aluno_id).aulasEmAberto}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data da aula *</label>
            <input
              type="date"
              value={frequenciaForm.data_aula}
              onChange={(e) => setFrequenciaForm(prev => ({ ...prev, data_aula: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Conteúdo da aula *</label>
            <textarea
              value={frequenciaForm.conteudo_aula}
              onChange={(e) => setFrequenciaForm(prev => ({ ...prev, conteudo_aula: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Situação de pagamento da aula *</label>
            <select
              value={frequenciaForm.status_pagamento}
              onChange={(e) => setFrequenciaForm(prev => ({ ...prev, status_pagamento: e.target.value as 'pago' | 'aberto' }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="aberto">Em aberto</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsFrequenciaModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveFrequencia} isLoading={savingFrequencia} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPagamentoModalOpen}
        onClose={() => setIsPagamentoModalOpen(false)}
        title={currentPagamento ? 'Editar Pagamento' : 'Registrar Pagamento'}
        className="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aluno *</label>
            <select
              value={pagamentoForm.aluno_id}
              onChange={(e) => setPagamentoForm(prev => ({ ...prev, aluno_id: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="">Selecione</option>
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>
                  {capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valor pago *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={pagamentoForm.valor_pago}
                onChange={(e) => setPagamentoForm(prev => ({ ...prev, valor_pago: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data do pagamento *</label>
              <input
                type="date"
                value={pagamentoForm.data_pagamento}
                onChange={(e) => setPagamentoForm(prev => ({ ...prev, data_pagamento: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Período de referência *</label>
            <input
              type="text"
              value={pagamentoForm.periodo_referencia}
              onChange={(e) => setPagamentoForm(prev => ({ ...prev, periodo_referencia: e.target.value }))}
              placeholder="Ex: Março/2026"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsPagamentoModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSavePagamento} isLoading={savingPagamento} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir registro"
        message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        loading={deleting}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

