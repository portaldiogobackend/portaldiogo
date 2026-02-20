import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Toast, type ToastType } from '@/components/ui/Toast';
import {
  type DestinoInsertRow,
  deleteDissertativaDestinoPairs,
  findDissertativaDestino,
  insertDissertativaDestinos,
  listDissertativaDestinoPairs
} from '@/lib/dissertativasDestinos';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, FileText, Filter, Menu, Pencil, Search, Send, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';

interface Materia {
  id: string;
  materia: string;
}

interface Serie {
  id: string;
  serie: string;
}

interface Tema {
  id: string;
  nometema: string;
  idmat?: string[];
  idseries?: string[];
}

interface Professor {
  id: string;
  nome: string;
  sobrenome?: string | null;
  email?: string | null;
  role?: string | null;
}

interface Aluno {
  id: string;
  nome: string;
  sobrenome?: string | null;
  email?: string | null;
  serie?: string | null;
  idserie?: string | null;
}

interface QuestaoDissertativa {
  id: string;
  enunciado: string;
  resposta_esperada: string;
  idmat: string;
  idserie: string;
  idtema: string | null;
  professor_id: string;
  created_at: string;
}

interface EnvioDissertativa {
  id: string;
  questao_id: string;
  aluno_id: string;
  resposta_texto: string | null;
  resposta_imagem_url: string | null;
  tipo_resposta: 'texto' | 'imagem';
  enviado_em: string;
  comentario_professor: string | null;
  nota?: number | null;
  corrigida: boolean | null;
  corrigido_em: string | null;
}

type QuillEditor = ReturnType<ReactQuill['getEditor']>;

const toolbarOptions = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['clean']
];

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'indent',
  'link', 'image',
  'script',
  'color', 'background',
  'align'
];

const stripHtml = (html: string) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const renderLatex = (html: string) => {
  if (!html) return '';
  const replacements: Array<{ regex: RegExp; displayMode: boolean }> = [
    { regex: /\$\$([\s\S]+?)\$\$/g, displayMode: true },
    { regex: /\\\[((?:.|\n)+?)\\\]/g, displayMode: true },
    { regex: /\$([^$]+?)\$/g, displayMode: false },
    { regex: /\\\((.+?)\\\)/g, displayMode: false }
  ];

  let output = html;
  replacements.forEach(({ regex, displayMode }) => {
    output = output.replace(regex, (_, formula) => {
      try {
        return katex.renderToString(formula, { displayMode, throwOnError: false });
      } catch {
        return _;
      }
    });
  });
  return output;
};

const MathContent = ({ html }: { html: string }) => {
  const rendered = useMemo(() => renderLatex(html), [html]);
  return <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: rendered }} />;
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const parseDelimitedLine = (line: string, delimiter: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
};

export default function QuestoesDissertativas() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState('Professor');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoDissertativa[]>([]);
  const [envios, setEnvios] = useState<EnvioDissertativa[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMateria, setFilterMateria] = useState('');
  const [filterSerie, setFilterSerie] = useState('');
  const [filterTema, setFilterTema] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creatingMateria, setCreatingMateria] = useState(false);
  const [creatingTema, setCreatingTema] = useState(false);

  const [currentQuestao, setCurrentQuestao] = useState<QuestaoDissertativa | null>(null);
  const [currentEnvio, setCurrentEnvio] = useState<EnvioDissertativa | null>(null);
  const [currentAssignQuestao, setCurrentAssignQuestao] = useState<QuestaoDissertativa | null>(null);
  const [assignAlunoId, setAssignAlunoId] = useState('');
  const [selectedQuestaoIds, setSelectedQuestaoIds] = useState<string[]>([]);
  const [isMassAssignModalOpen, setIsMassAssignModalOpen] = useState(false);
  const [massAssignMode, setMassAssignMode] = useState<'assign' | 'unassign'>('assign');
  const [massAssignAlunoIds, setMassAssignAlunoIds] = useState<string[]>([]);
  const [massAssigning, setMassAssigning] = useState(false);
  const enunciadoRef = useRef<ReactQuill | null>(null);
  const respostaRef = useRef<ReactQuill | null>(null);
  const [formData, setFormData] = useState({
    enunciado: '',
    resposta_esperada: '',
    idmat: '',
    idserie: '',
    idtema: '',
    professor_id: ''
  });
  const [newMateriaName, setNewMateriaName] = useState('');
  const [newTemaName, setNewTemaName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLog, setImportLog] = useState<{ success: number; errors: string[] } | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    comentario_professor: '',
    corrigida: false,
    nota: ''
  });

  const isStaff = userRole === 'admin' || userRole === 'professor';
  const isAdmin = userRole === 'admin';

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
  };

  const formatErrorMessage = (error: unknown, fallback: string) => {
    const message = getErrorMessage(error, fallback);
    if (!error || typeof error !== 'object') return message;
    const details = 'details' in error ? (error as { details?: unknown }).details : undefined;
    const hint = 'hint' in error ? (error as { hint?: unknown }).hint : undefined;
    const code = 'code' in error ? (error as { code?: unknown }).code : undefined;
    const status = 'status' in error ? (error as { status?: unknown }).status : undefined;
    const extra = [details, hint, code, status].filter((item) => typeof item === 'string' || typeof item === 'number');
    if (extra.length === 0) return message;
    return `${message} (${extra.join(' | ')})`;
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUserId(user.id);
      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('nome, role')
        .eq('id', user.id)
        .single();
      if (userError) throw userError;
      setUserRole(userData?.role || null);
      if (userData?.nome) {
        setUserName(capitalizeWords(userData.nome.split(' ')[0]));
      }
      if (userData?.role === 'aluno') {
        navigate('/aluno/questoes-dissertativas', { replace: true });
        return;
      }

      const [{ data: materiasData }, { data: seriesData }, { data: temasData }] = await Promise.all([
        supabase.from('tbf_materias').select('id, materia').order('materia'),
        supabase.from('tbf_serie').select('id, serie').order('serie'),
        supabase.from('tbf_temas').select('id, nometema, idmat, idseries').order('nometema')
      ]);
      setMaterias((materiasData as Materia[]) || []);
      setSeries((seriesData as Serie[]) || []);
      setTemas((temasData as Tema[]) || []);

      const { data: profData } = await supabase
        .from('tbf_controle_user')
        .select('id, nome, sobrenome, email, role')
        .in('role', ['admin', 'professor'])
        .order('nome');
      setProfessores((profData as Professor[]) || []);

      const { data: alunosData } = await supabase
        .from('tbf_controle_user')
        .select('id, nome, sobrenome, serie, email')
        .eq('role', 'aluno')
        .eq('signature', 'ativo')
        .not('email', 'is', null)
        .neq('email', '')
        .order('nome');
      const seriesList = (seriesData as Serie[]) || [];
      const alunosList = (alunosData as Aluno[]) || [];
      const alunosWithSerie = alunosList.map((aluno) => {
        const directMatch = seriesList.find(serie => serie.id === aluno.serie);
        if (directMatch) {
          return { ...aluno, idserie: directMatch.id };
        }
        const normalized = (aluno.serie || '').trim().toLowerCase();
        const byName = seriesList.find(serie => serie.serie.trim().toLowerCase() === normalized);
        return { ...aluno, idserie: byName?.id || null };
      });
      setAlunos(alunosWithSerie);

      const { data: questoesData } = await supabase
        .from('tbf_questoes_dissertativas')
        .select('*')
        .order('created_at', { ascending: false });
      setQuestoes((questoesData as QuestaoDissertativa[]) || []);

      const { data: enviosData } = await supabase
        .from('tbf_questoes_dissertativas_envios')
        .select('*')
        .order('enviado_em', { ascending: false });
      setEnvios((enviosData as EnvioDissertativa[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast(formatErrorMessage(error, 'Erro ao carregar dados.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredQuestoes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return questoes.filter(q => {
      const matchesSearch = !term || stripHtml(q.enunciado).toLowerCase().includes(term);
      const matchesMateria = !filterMateria || q.idmat === filterMateria;
      const matchesSerie = !filterSerie || q.idserie === filterSerie;
      const matchesTema = !filterTema || q.idtema === filterTema;
      return matchesSearch && matchesMateria && matchesSerie && matchesTema;
    });
  }, [questoes, searchTerm, filterMateria, filterSerie, filterTema]);

  const visibleQuestaoIds = useMemo(() => filteredQuestoes.map(questao => questao.id), [filteredQuestoes]);
  const allVisibleSelected = visibleQuestaoIds.length > 0 && visibleQuestaoIds.every(id => selectedQuestaoIds.includes(id));

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMateria('');
    setFilterSerie('');
    setFilterTema('');
  };

  const openModal = () => {
    setCurrentQuestao(null);
    setFormData({
      enunciado: '',
      resposta_esperada: '',
      idmat: '',
      idserie: '',
      idtema: '',
      professor_id: currentUserId || ''
    });
    setNewMateriaName('');
    setNewTemaName('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openEdit = (questao: QuestaoDissertativa) => {
    setCurrentQuestao(questao);
    setFormData({
      enunciado: questao.enunciado || '',
      resposta_esperada: questao.resposta_esperada || '',
      idmat: questao.idmat || '',
      idserie: questao.idserie || '',
      idtema: questao.idtema || '',
      professor_id: questao.professor_id || currentUserId || ''
    });
    setNewMateriaName('');
    setNewTemaName('');
    setIsModalOpen(true);
  };

  const openDelete = (questao: QuestaoDissertativa) => {
    setCurrentQuestao(questao);
    setIsDeleteModalOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteModalOpen(false);
    setCurrentQuestao(null);
  };

  const openAssign = (questao: QuestaoDissertativa) => {
    if (alunos.length === 0) {
      showToast('NÃ£o hÃ¡ alunos com acesso elegÃ­veis para envio.', 'error');
      return;
    }
    setMassAssignMode('assign');
    setCurrentAssignQuestao(questao);
    setAssignAlunoId('');
    setIsAssignModalOpen(true);
  };

  const closeAssign = () => {
    setIsAssignModalOpen(false);
    setCurrentAssignQuestao(null);
    setAssignAlunoId('');
  };

  const openMassAssign = (mode: 'assign' | 'unassign' = 'assign') => {
    if (mode === 'unassign' && !isAdmin) {
      showToast('Apenas administradores podem cancelar envios.', 'error');
      return;
    }
    if (alunos.length === 0) {
      showToast('NÃ£o hÃ¡ alunos com acesso elegÃ­veis para envio.', 'error');
      return;
    }
    if (selectedQuestaoIds.length === 0) {
      showToast('Selecione pelo menos uma questÃ£o.', 'error');
      return;
    }
    setMassAssignMode(mode);
    setMassAssignAlunoIds([]);
    setIsMassAssignModalOpen(true);
  };

  const closeMassAssign = () => {
    setIsMassAssignModalOpen(false);
    setMassAssignAlunoIds([]);
  };

  const toggleQuestaoSelection = (id: string) => {
    setSelectedQuestaoIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedQuestaoIds(prev => prev.filter(id => !visibleQuestaoIds.includes(id)));
      return;
    }
    setSelectedQuestaoIds(prev => {
      const next = new Set(prev);
      visibleQuestaoIds.forEach(id => next.add(id));
      return Array.from(next);
    });
  };

  const openCorrection = (envio: EnvioDissertativa) => {
    setCurrentEnvio(envio);
    setCorrectionForm({
      comentario_professor: envio.comentario_professor || '',
      corrigida: !!envio.corrigida,
      nota: envio.nota !== null && envio.nota !== undefined ? String(envio.nota) : ''
    });
    setIsCorrectionModalOpen(true);
  };

  const closeCorrection = () => {
    setIsCorrectionModalOpen(false);
    setCurrentEnvio(null);
  };

  const handleCreateMateria = async () => {
    const trimmed = newMateriaName.trim();
    if (!trimmed) {
      showToast('Digite o nome da disciplina.', 'error');
      return;
    }
    setCreatingMateria(true);
    try {
      const { data, error } = await supabase
        .from('tbf_materias')
        .insert([{ materia: trimmed }])
        .select()
        .single();
      if (error) throw error;
      const nextMaterias = [...materias, data as Materia].sort((a, b) =>
        a.materia.localeCompare(b.materia, 'pt-BR', { sensitivity: 'base' })
      );
      setMaterias(nextMaterias);
      setFormData(prev => ({ ...prev, idmat: (data as Materia).id, idtema: '' }));
      setNewMateriaName('');
      showToast('Disciplina criada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      showToast(formatErrorMessage(error, 'Erro ao criar disciplina.'), 'error');
    } finally {
      setCreatingMateria(false);
    }
  };

  const handleCreateTema = async () => {
    const trimmed = newTemaName.trim();
    if (!trimmed) {
      showToast('Digite o nome do conteÃºdo.', 'error');
      return;
    }
    if (!formData.idmat) {
      showToast('Selecione uma disciplina antes de criar o conteÃºdo.', 'error');
      return;
    }
    if (!formData.idserie) {
      showToast('Selecione uma sÃ©rie antes de criar o conteÃºdo.', 'error');
      return;
    }
    setCreatingTema(true);
    try {
      const payload = {
        nometema: trimmed,
        idmat: [formData.idmat],
        idseries: [formData.idserie]
      };
      const { data, error } = await supabase
        .from('tbf_temas')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      const nextTemas = [...temas, data as Tema].sort((a, b) =>
        a.nometema.localeCompare(b.nometema, 'pt-BR', { sensitivity: 'base' })
      );
      setTemas(nextTemas);
      setFormData(prev => ({ ...prev, idtema: (data as Tema).id }));
      setNewTemaName('');
      showToast('ConteÃºdo criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar conteÃºdo:', error);
      showToast(formatErrorMessage(error, 'Erro ao criar conteÃºdo.'), 'error');
    } finally {
      setCreatingTema(false);
    }
  };

  const handleSave = async () => {
    if (!stripHtml(formData.enunciado).trim()) {
      showToast('Digite o enunciado.', 'error');
      return;
    }
    if (!stripHtml(formData.resposta_esperada).trim()) {
      showToast('Digite a resposta esperada.', 'error');
      return;
    }
    if (!formData.idmat) {
      showToast('Selecione uma disciplina.', 'error');
      return;
    }
    if (!formData.idserie) {
      showToast('Selecione uma sÃ©rie.', 'error');
      return;
    }
    if (!formData.professor_id) {
      showToast('Selecione o professor responsÃ¡vel.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        enunciado: formData.enunciado,
        resposta_esperada: formData.resposta_esperada,
        idmat: formData.idmat,
        idserie: formData.idserie,
        idtema: formData.idtema || null,
        professor_id: formData.professor_id
      };

      if (currentQuestao) {
        const { data, error } = await supabase
          .from('tbf_questoes_dissertativas')
          .update(payload)
          .eq('id', currentQuestao.id)
          .select()
          .single();
        if (error) throw error;
        setQuestoes(prev => prev.map(q => q.id === currentQuestao.id ? (data as QuestaoDissertativa) : q));
        showToast('QuestÃ£o atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('tbf_questoes_dissertativas')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setQuestoes(prev => [data as QuestaoDissertativa, ...prev]);
        showToast('QuestÃ£o cadastrada com sucesso!', 'success');
      }

      closeModal();
    } catch (error) {
      console.error('Erro ao salvar questÃ£o:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar questÃ£o.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentQuestao) return;
    try {
      const { error } = await supabase
        .from('tbf_questoes_dissertativas')
        .delete()
        .eq('id', currentQuestao.id);
      if (error) throw error;
      setQuestoes(prev => prev.filter(q => q.id !== currentQuestao.id));
      showToast('QuestÃ£o excluÃ­da com sucesso!', 'success');
      closeDelete();
    } catch (error) {
      console.error('Erro ao excluir questÃ£o:', error);
      showToast(formatErrorMessage(error, 'Erro ao excluir questÃ£o.'), 'error');
    }
  };

  const handleAssign = async () => {
    if (!currentAssignQuestao) return;
    if (!assignAlunoId) {
      showToast('Selecione o aluno.', 'error');
      return;
    }
    if (!currentUserId) {
      showToast('UsuÃ¡rio nÃ£o identificado.', 'error');
      return;
    }
    setAssigning(true);
    try {
      try {
        const { exists: existing, error: existingError } = await findDissertativaDestino(currentAssignQuestao.id, assignAlunoId);
        if (existingError) throw existingError;
        if (existing) {
          showToast('QuestÃ£o jÃ¡ enviada para este aluno.', 'error');
          setAssigning(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao validar envio:', error);
        showToast(formatErrorMessage(error, 'Erro ao validar envio existente.'), 'error');
      }

      const payload: DestinoInsertRow = {
        questao_id: currentAssignQuestao.id,
        aluno_id: assignAlunoId,
        professor_id: currentUserId,
        enviado_em: new Date().toISOString()
      };

      const { error } = await insertDissertativaDestinos([payload]);
      if (error) throw error;

      showToast('QuestÃ£o enviada ao aluno!', 'success');
      closeAssign();
    } catch (error) {
      console.error('Erro ao enviar questÃ£o:', error);
      showToast(formatErrorMessage(error, 'Erro ao enviar questÃ£o.'), 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!isAdmin) {
      showToast('Apenas administradores podem cancelar envios.', 'error');
      return;
    }
    if (!currentAssignQuestao) return;
    if (!assignAlunoId) {
      showToast('Selecione o aluno.', 'error');
      return;
    }

    setAssigning(true);
    try {
      const { error } = await deleteDissertativaDestinoPairs([currentAssignQuestao.id], [assignAlunoId]);
      if (error) throw error;

      showToast('Envio cancelado para o aluno selecionado.', 'success');
      closeAssign();
    } catch (error) {
      console.error('Erro ao cancelar envio da questÃ£o:', error);
      showToast(formatErrorMessage(error, 'Erro ao cancelar envio da questÃ£o.'), 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleMassAssign = async () => {
    if (selectedQuestaoIds.length === 0) {
      showToast('Selecione pelo menos uma questÃ£o.', 'error');
      return;
    }
    if (!currentUserId) {
      showToast('UsuÃ¡rio nÃ£o identificado.', 'error');
      return;
    }

    const targetAlunoIds = Array.from(new Set(massAssignAlunoIds));

    if (targetAlunoIds.length === 0) {
      showToast('Selecione um ou mais alunos.', 'error');
      return;
    }

    setMassAssigning(true);
    try {
      let existingPairs = new Set<string>();
      try {
        const { pairs, error: existingError } = await listDissertativaDestinoPairs(selectedQuestaoIds, targetAlunoIds);
        if (existingError) throw existingError;
        existingPairs = pairs;
      } catch (error) {
        console.error('Erro ao validar envios em lote:', error);
        showToast(formatErrorMessage(error, 'Erro ao validar envios existentes.'), 'error');
      }
      const payload: DestinoInsertRow[] = [];
      const timestamp = new Date().toISOString();

      selectedQuestaoIds.forEach(questaoId => {
        targetAlunoIds.forEach(alunoId => {
          const key = `${questaoId}-${alunoId}`;
          if (!existingPairs.has(key)) {
            payload.push({
              questao_id: questaoId,
              aluno_id: alunoId,
              professor_id: currentUserId,
              enviado_em: timestamp
            });
          }
        });
      });

      if (payload.length === 0) {
        showToast('Todas as questÃµes jÃ¡ foram enviadas.', 'error');
        setMassAssigning(false);
        return;
      }

      const { error } = await insertDissertativaDestinos(payload);
      if (error) throw error;

      showToast(`QuestÃµes enviadas para ${targetAlunoIds.length} aluno(s)!`, 'success');
      closeMassAssign();
      setSelectedQuestaoIds([]);
    } catch (error) {
      console.error('Erro ao enviar questÃµes:', error);
      showToast(formatErrorMessage(error, 'Erro ao enviar questÃµes.'), 'error');
    } finally {
      setMassAssigning(false);
    }
  };

  const handleMassUnassign = async () => {
    if (!isAdmin) {
      showToast('Apenas administradores podem cancelar envios.', 'error');
      return;
    }
    if (selectedQuestaoIds.length === 0) {
      showToast('Selecione pelo menos uma questÃ£o.', 'error');
      return;
    }

    const targetAlunoIds = Array.from(new Set(massAssignAlunoIds));
    if (targetAlunoIds.length === 0) {
      showToast('Selecione um ou mais alunos.', 'error');
      return;
    }

    setMassAssigning(true);
    try {
      const { error } = await deleteDissertativaDestinoPairs(selectedQuestaoIds, targetAlunoIds);
      if (error) throw error;

      showToast('Envio cancelado para os alunos selecionados.', 'success');
      closeMassAssign();
      setSelectedQuestaoIds([]);
    } catch (error) {
      console.error('Erro ao cancelar envios em lote:', error);
      showToast(formatErrorMessage(error, 'Erro ao cancelar envios em lote.'), 'error');
    } finally {
      setMassAssigning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        setImportFile(file);
        setImportLog(null);
      } else {
        showToast('Selecione um arquivo .txt ou .csv', 'error');
        e.target.value = '';
      }
    }
  };

  const findMateriaId = (value: string) => {
    if (isUuid(value)) return value;
    const normalized = value.trim().toLowerCase();
    return materias.find(m => m.materia.toLowerCase() === normalized)?.id || '';
  };

  const findSerieId = (value: string) => {
    if (isUuid(value)) return value;
    const normalized = value.trim().toLowerCase();
    return series.find(s => s.serie.toLowerCase() === normalized)?.id || '';
  };

  const findTemaId = (value: string) => {
    if (!value) return '';
    if (isUuid(value)) return value;
    const normalized = value.trim().toLowerCase();
    return temas.find(t => t.nometema.toLowerCase() === normalized)?.id || '';
  };

  const findProfessorId = (value: string) => {
    if (isUuid(value)) return value;
    const normalized = value.trim().toLowerCase();
    const byEmail = professores.find(p => (p.email || '').toLowerCase() === normalized);
    if (byEmail) return byEmail.id;
    const byName = professores.find(p => `${p.nome} ${p.sobrenome || ''}`.trim().toLowerCase() === normalized);
    return byName?.id || '';
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast('Selecione um arquivo.', 'error');
      return;
    }
    setImporting(true);
    setImportLog(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = (e.target?.result as string) || '';
      if (!text.trim()) {
        showToast('Arquivo vazio.', 'error');
        setImporting(false);
        return;
      }

      const errors: string[] = [];
      let successCount = 0;
      const isCsv = importFile.name.toLowerCase().endsWith('.csv');
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

      let startIndex = 0;
      let headers: string[] = [];
      if (isCsv) {
        const delimiter = lines[0]?.includes(';') ? ';' : ',';
        headers = parseDelimitedLine(lines[0], delimiter).map(h => h.trim().toLowerCase());
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const lineIndex = i + 1;
        let enunciado = '';
        let resposta = '';
        let disciplina = '';
        let serie = '';
        let tema = '';
        let professor = '';

        if (isCsv) {
          const delimiter = lines[0]?.includes(';') ? ';' : ',';
          const values = parseDelimitedLine(line, delimiter);
          const getValue = (key: string) => {
            const index = headers.findIndex(h => h === key);
            return index >= 0 ? (values[index] || '').trim() : '';
          };
          enunciado = getValue('enunciado');
          resposta = getValue('resposta_esperada') || getValue('resposta');
          disciplina = getValue('disciplina') || getValue('materia');
          serie = getValue('serie') || getValue('ano');
          tema = getValue('tema') || getValue('conteudo');
          professor = getValue('professor') || getValue('professor_responsavel');
        } else {
          const parts = line.split('|');
          if (parts.length < 4) {
            errors.push(`Linha ${lineIndex}: Formato invÃ¡lido. Use 4 a 6 colunas separadas por |`);
            continue;
          }
          enunciado = parts[0]?.trim();
          resposta = parts[1]?.trim();
          disciplina = parts[2]?.trim();
          serie = parts[3]?.trim();
          tema = parts[4]?.trim() || '';
          professor = parts[5]?.trim() || '';
        }

        if (!enunciado || !resposta || !disciplina || !serie) {
          errors.push(`Linha ${lineIndex}: Campos obrigatÃ³rios faltando.`);
          continue;
        }

        const idmat = findMateriaId(disciplina);
        const idserie = findSerieId(serie);
        const idtema = tema ? findTemaId(tema) : '';
        const professorId = professor ? findProfessorId(professor) : (currentUserId || '');

        if (!idmat || !idserie || (tema && !idtema) || !professorId) {
          errors.push(`Linha ${lineIndex}: Disciplina, sÃ©rie, tema ou professor invÃ¡lido.`);
          continue;
        }

        try {
          const { error } = await supabase
            .from('tbf_questoes_dissertativas')
            .insert([{
              enunciado,
              resposta_esperada: resposta,
              idmat,
              idserie,
              idtema: idtema || null,
              professor_id: professorId
            }]);
          if (error) throw error;
          successCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          errors.push(`Linha ${lineIndex}: Erro ao salvar no banco - ${message}`);
        }
      }

      setImporting(false);
      setImportLog({ success: successCount, errors });
      if (successCount > 0) {
        showToast(`${successCount} questÃµes importadas com sucesso!`, 'success');
        await fetchInitialData();
        if (errors.length === 0) {
          setIsImportModalOpen(false);
        }
      } else {
        showToast('Nenhuma questÃ£o importada. Verifique os erros.', 'error');
      }
    };

    reader.onerror = () => {
      showToast('Erro ao ler o arquivo.', 'error');
      setImporting(false);
    };

    reader.readAsText(importFile, 'UTF-8');
  };

  const handleSaveCorrection = async () => {
    if (!currentEnvio) return;
    try {
      const basePayload = {
        comentario_professor: correctionForm.comentario_professor,
        corrigida: correctionForm.corrigida,
        corrigido_em: correctionForm.corrigida ? new Date().toISOString() : null
      };
      const hasNota = correctionForm.nota !== '' && !Number.isNaN(Number(correctionForm.nota));
      const payload = hasNota ? { ...basePayload, nota: Number(correctionForm.nota) } : basePayload;
      const { data, error } = await supabase
        .from('tbf_questoes_dissertativas_envios')
        .update(payload)
        .eq('id', currentEnvio.id)
        .select()
        .single();
      if (error) throw error;
      setEnvios(prev => prev.map(e => e.id === currentEnvio.id ? (data as EnvioDissertativa) : e));
      showToast('CorreÃ§Ã£o atualizada com sucesso!', 'success');
      closeCorrection();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('nota') && correctionForm.nota !== '') {
        try {
          const { data, error: retryError } = await supabase
            .from('tbf_questoes_dissertativas_envios')
            .update({
              comentario_professor: correctionForm.comentario_professor,
              corrigida: correctionForm.corrigida,
              corrigido_em: correctionForm.corrigida ? new Date().toISOString() : null
            })
            .eq('id', currentEnvio.id)
            .select()
            .single();
          if (retryError) throw retryError;
          setEnvios(prev => prev.map(e => e.id === currentEnvio.id ? (data as EnvioDissertativa) : e));
          showToast('CorreÃ§Ã£o salva sem nota.', 'success');
          closeCorrection();
          return;
        } catch (retryErr) {
          console.error('Erro ao salvar correÃ§Ã£o:', retryErr);
        }
      }
      console.error('Erro ao salvar correÃ§Ã£o:', error);
      showToast(formatErrorMessage(error, 'Erro ao salvar correÃ§Ã£o.'), 'error');
    }
  };

  const insertImageIntoQuill = (quill: QuillEditor | null, url: string) => {
    if (!quill) return;
    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();
    quill.insertEmbed(index, 'image', url, 'user');
    quill.setSelection(index + 1);
  };

  const createImageHandler = useCallback((ref: React.RefObject<ReactQuill | null>) => {
    return async () => {
      const quill = ref.current?.getEditor();
      if (!quill) return;
      const url = window.prompt('Cole a URL da imagem (deixe vazio para enviar do computador):');
      if (url) {
        insertImageIntoQuill(quill, url);
        return;
      }
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (!currentUserId) {
          showToast('UsuÃ¡rio nÃ£o identificado.', 'error');
          return;
        }
        try {
          const bucket = 'dissertativas-questoes';
          const filePath = `${currentUserId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            upsert: false,
            contentType: file.type
          });
          if (uploadError) throw uploadError;
          const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
          if (!publicUrl?.publicUrl) {
            showToast('NÃ£o foi possÃ­vel obter a URL da imagem.', 'error');
            return;
          }
          insertImageIntoQuill(quill, publicUrl.publicUrl);
        } catch (uploadError) {
          console.error('Erro ao enviar imagem:', uploadError);
          showToast(formatErrorMessage(uploadError, 'Erro ao enviar imagem.'), 'error');
        }
      };
      input.click();
    };
  }, [currentUserId, showToast]);

  const enunciadoModules = useMemo(() => ({
    toolbar: {
      container: toolbarOptions,
      handlers: {
        image: createImageHandler(enunciadoRef)
      }
    }
  }), [createImageHandler]);

  const respostaModules = useMemo(() => ({
    toolbar: {
      container: toolbarOptions,
      handlers: {
        image: createImageHandler(respostaRef)
      }
    }
  }), [createImageHandler]);

  const materiaName = (id: string) => materias.find(m => m.id === id)?.materia || 'â€”';
  const serieName = (id: string) => series.find(s => s.id === id)?.serie || 'â€”';
  const temaName = (id?: string | null) => temas.find(t => t.id === id)?.nometema || 'â€”';
  const professorName = (id: string) => {
    const prof = professores.find(p => p.id === id);
    return prof ? capitalizeWords(`${prof.nome} ${prof.sobrenome || ''}`.trim()) : 'â€”';
  };
  const alunoName = (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    return aluno ? capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim()) : 'Aluno';
  };
  const questaoById = (id: string) => questoes.find(q => q.id === id);

  const LayoutSidebar = Sidebar;

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <LayoutSidebar
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
              <span className="hidden md:inline">Voltar ao Dashboard</span>
              <span className="md:hidden">Voltar</span>
            </button>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">QuestÃµes Dissertativas</h1>

          <div className="flex gap-3">
            {isStaff && (
              <>
                <Button onClick={() => setIsImportModalOpen(true)} className="bg-white text-[#4318FF] border border-[#4318FF] hover:bg-gray-50">
                  <Upload size={18} className="mr-2" />
                  ImportaÃ§Ã£o em Massa
                </Button>
                <Button onClick={openModal} className="bg-[#4318FF] hover:bg-[#3311CC]">
                  <FileText size={18} className="mr-2" />
                  Nova QuestÃ£o
                </Button>
              </>
            )}
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4 ${selectedQuestaoIds.length > 0 ? 'pb-28 md:pb-10' : ''}`}>
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <h2 className="text-2xl font-bold mb-2">Gerenciamento de QuestÃµes Dissertativas</h2>
              <p className="text-gray-500">Cadastre, importe e acompanhe envios dos alunos.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1B2559]">Banco de QuestÃµes</h3>
                <span className="text-sm font-medium text-gray-500">{filteredQuestoes.length} de {questoes.length}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Filter size={18} className="text-[#4318FF]" />
                    <span>Filtros:</span>
                  </div>
                  <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por enunciado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterMateria}
                    onChange={(e) => setFilterMateria(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[160px]"
                  >
                    <option value="">Todas Disciplinas</option>
                    {materias.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.materia}</option>
                    ))}
                  </select>
                  <select
                    value={filterSerie}
                    onChange={(e) => setFilterSerie(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[180px]"
                  >
                    <option value="">Todas SÃ©ries</option>
                    {series.map(ser => (
                      <option key={ser.id} value={ser.id}>{ser.serie}</option>
                    ))}
                  </select>
                  <select
                    value={filterTema}
                    onChange={(e) => setFilterTema(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[180px]"
                  >
                    <option value="">Todos Temas</option>
                    {temas.map(tema => (
                      <option key={tema.id} value={tema.id}>{tema.nometema}</option>
                    ))}
                  </select>
                  {(searchTerm || filterMateria || filterSerie || filterTema) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                      Limpar
                    </button>
                  )}
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-gray-200">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                      />
                      Selecionar todas visÃ­veis
                    </label>
                    {selectedQuestaoIds.length > 0 && (
                      <button
                        onClick={() => setSelectedQuestaoIds([])}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Limpar seleÃ§Ã£o
                      </button>
                    )}
                  </div>
                  {selectedQuestaoIds.length > 0 && (
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        {selectedQuestaoIds.length} selecionada(s)
                      </span>
                      <Button onClick={() => openMassAssign('assign')} className="w-full sm:w-auto bg-[#4318FF] hover:bg-[#3311CC]" disabled={alunos.length === 0}>
                        Enviar selecionadas
                      </Button>
                      {isAdmin && (
                        <Button onClick={() => openMassAssign('unassign')} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white" disabled={alunos.length === 0}>
                          Cancelar envio
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                          className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                        />
                      </th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Disciplina</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">SÃ©rie</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Tema</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Professor</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Enunciado</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-right">AÃ§Ãµes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <Spinner size="md" />
                        </td>
                      </tr>
                    ) : filteredQuestoes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-gray-400">
                          Nenhuma questÃ£o encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestoes.map(questao => (
                        <tr key={questao.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedQuestaoIds.includes(questao.id)}
                              onChange={() => toggleQuestaoSelection(questao.id)}
                              className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                            />
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-[#2B3674]">{materiaName(questao.idmat)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{serieName(questao.idserie)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{temaName(questao.idtema)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{professorName(questao.professor_id)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 max-w-[320px] truncate" title={stripHtml(questao.enunciado)}>
                            {stripHtml(questao.enunciado)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openAssign(questao)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Enviar para aluno"
                              >
                                <Send size={18} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setMassAssignMode('unassign');
                                    setCurrentAssignQuestao(questao);
                                    setAssignAlunoId('');
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancelar envio"
                                >
                                  <X size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => openEdit(questao)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => openDelete(questao)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1B2559]">Envios dos Alunos</h3>
                <span className="text-sm font-medium text-gray-500">{envios.length} envio(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Aluno</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">QuestÃ£o</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Tipo</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Enviado em</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Nota</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Status</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-right">AÃ§Ãµes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {envios.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          Nenhum envio registrado.
                        </td>
                      </tr>
                    ) : (
                      envios.map(envio => {
                        const questao = questaoById(envio.questao_id);
                        return (
                          <tr key={envio.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 text-sm font-medium text-gray-700">{alunoName(envio.aluno_id)}</td>
                            <td className="py-4 px-4 text-sm text-gray-600 max-w-[300px] truncate" title={stripHtml(questao?.enunciado || '')}>
                              {stripHtml(questao?.enunciado || '')}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600 capitalize">{envio.tipo_resposta}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {envio.enviado_em ? format(new Date(envio.enviado_em), "dd/MM/yyyy 'Ã s' HH:mm", { locale: ptBR }) : 'â€”'}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {envio.nota !== null && envio.nota !== undefined ? envio.nota : 'â€”'}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium">
                              {envio.corrigida ? (
                                <span className="text-green-600">Corrigida</span>
                              ) : (
                                <span className="text-orange-500">Pendente</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button onClick={() => openCorrection(envio)} className="bg-[#4318FF] hover:bg-[#3311CC]">
                                Corrigir
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        {selectedQuestaoIds.length > 0 && (
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#1B2559]">{selectedQuestaoIds.length} questÃ£o(Ãµes) selecionada(s)</span>
              <button
                onClick={() => setSelectedQuestaoIds([])}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Limpar
              </button>
            </div>
            <div className={`grid gap-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <Button
                onClick={() => openMassAssign('assign')}
                className="w-full bg-[#4318FF] hover:bg-[#3311CC]"
                disabled={alunos.length === 0}
              >
                Enviar
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => openMassAssign('unassign')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={alunos.length === 0}
                >
                  Cancelar envio
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={currentQuestao ? 'Editar QuestÃ£o' : 'Nova QuestÃ£o'}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Enunciado *</label>
            <ReactQuill
              theme="snow"
              value={formData.enunciado}
              onChange={(value) => setFormData(prev => ({ ...prev, enunciado: value }))}
              modules={enunciadoModules}
              formats={formats}
              placeholder="Digite o enunciado com LaTeX usando $...$"
              className="bg-white"
              ref={enunciadoRef}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Resposta esperada explicada *</label>
            <ReactQuill
              theme="snow"
              value={formData.resposta_esperada}
              onChange={(value) => setFormData(prev => ({ ...prev, resposta_esperada: value }))}
              modules={respostaModules}
              formats={formats}
              placeholder="Descreva passo a passo, com LaTeX se necessÃ¡rio"
              className="bg-white"
              ref={respostaRef}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Disciplina *</label>
              <select
                value={formData.idmat}
                onChange={(e) => setFormData(prev => ({ ...prev, idmat: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione</option>
                {materias.map(mat => (
                  <option key={mat.id} value={mat.id}>{mat.materia}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMateriaName}
                  onChange={(e) => setNewMateriaName(e.target.value)}
                  placeholder="Nova disciplina"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
                <Button
                  onClick={handleCreateMateria}
                  className="whitespace-nowrap bg-[#4318FF] hover:bg-[#3311CC]"
                  isLoading={creatingMateria}
                >
                  Adicionar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SÃ©rie/Ano *</label>
              <select
                value={formData.idserie}
                onChange={(e) => setFormData(prev => ({ ...prev, idserie: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione</option>
                {series.map(ser => (
                  <option key={ser.id} value={ser.id}>{ser.serie}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tema/ConteÃºdo</label>
              <select
                value={formData.idtema}
                onChange={(e) => setFormData(prev => ({ ...prev, idtema: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione</option>
                {temas.map(tema => (
                  <option key={tema.id} value={tema.id}>{tema.nometema}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTemaName}
                  onChange={(e) => setNewTemaName(e.target.value)}
                  placeholder="Novo conteÃºdo"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                  disabled={!formData.idmat || !formData.idserie}
                />
                <Button
                  onClick={handleCreateTema}
                  className="whitespace-nowrap bg-[#4318FF] hover:bg-[#3311CC]"
                  isLoading={creatingTema}
                  disabled={!formData.idmat || !formData.idserie}
                >
                  Adicionar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Professor responsÃ¡vel *</label>
              <select
                value={formData.professor_id}
                onChange={(e) => setFormData(prev => ({ ...prev, professor_id: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione</option>
                {professores.map(prof => (
                  <option key={prof.id} value={prof.id}>{capitalizeWords(`${prof.nome} ${prof.sobrenome || ''}`.trim())}</option>
                ))}
              </select>
            </div>
          </div>

          {(formData.enunciado || formData.resposta_esperada) && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 mb-2">PrÃ©via do Enunciado</p>
                <MathContent html={formData.enunciado} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 mb-2">PrÃ©via da Resposta Esperada</p>
                <MathContent html={formData.resposta_esperada} />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeModal} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]" isLoading={saving}>
              {currentQuestao ? 'Salvar AlteraÃ§Ãµes' : 'Salvar QuestÃ£o'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="ImportaÃ§Ã£o em Massa"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-2">Formatos aceitos</p>
            <p className="mb-2">TXT (uma questÃ£o por linha):</p>
            <p className="font-mono text-xs bg-white/50 p-2 rounded border border-blue-200">
              enunciado | resposta_esperada | disciplina | serie | tema(opcional) | professor(opcional)
            </p>
            <p className="mt-3 mb-2">CSV com cabeÃ§alhos:</p>
            <p className="font-mono text-xs bg-white/50 p-2 rounded border border-blue-200">
              enunciado,resposta_esperada,disciplina,serie,tema,professor
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Arquivo (.txt ou .csv)</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${importFile ? 'border-[#4318FF] bg-blue-50' : 'border-gray-300 hover:border-[#4318FF]'}`}>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={32} className={importFile ? 'text-[#4318FF]' : 'text-gray-400'} />
                {importFile ? (
                  <span className="text-sm font-bold text-[#4318FF]">{importFile.name}</span>
                ) : (
                  <span className="text-sm text-gray-500">Clique para selecionar um arquivo</span>
                )}
              </label>
            </div>
          </div>

          {importLog && (
            <div className={`rounded-xl p-4 ${importLog.success > 0 && importLog.errors.length === 0 ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-800">Resultado da ImportaÃ§Ã£o</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Sucessos: <span className="font-bold text-green-600">{importLog.success}</span> | Falhas: <span className="font-bold text-red-600">{importLog.errors.length}</span>
              </p>
              {importLog.errors.length > 0 && (
                <div className="mt-3 bg-white rounded-lg border border-orange-200 p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {importLog.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-600 flex gap-2">
                        <span className="font-mono">â€¢</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} className="flex-1" disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={handleImport} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]" isLoading={importing} disabled={!importFile}>
              Importar QuestÃµes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={closeAssign}
        title={massAssignMode === 'unassign' ? 'Cancelar envio de questão' : 'Enviar Questão para Aluno'}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {currentAssignQuestao ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Somente alunos com acesso ativo (e-mail cadastrado) aparecem para envio.
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-500 mb-2">QuestÃ£o</p>
              <MathContent html={currentAssignQuestao.enunciado} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Aluno</label>
              <select
                value={assignAlunoId}
                onChange={(e) => setAssignAlunoId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione</option>
                {alunos.map(aluno => (
                  <option key={aluno.id} value={aluno.id}>{capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={closeAssign} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={massAssignMode === 'unassign' ? handleUnassign : handleAssign}
                className={`flex-1 ${massAssignMode === 'unassign' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#4318FF] hover:bg-[#3311CC]'}`}
                isLoading={assigning}
                disabled={alunos.length === 0}
              >
                {massAssignMode === 'unassign' ? 'Cancelar envio' : 'Enviar QuestÃ£o'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isMassAssignModalOpen}
        onClose={closeMassAssign}
        title={massAssignMode === 'unassign' ? 'Cancelar envio para alunos selecionados' : 'Enviar Para Alunos Selecionados'}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Somente alunos com acesso ativo (e-mail cadastrado) aparecem para envio.
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-500 mb-2">QuestÃµes Selecionadas</p>
            <p className="text-sm text-gray-700">{selectedQuestaoIds.length} questÃ£o(Ãµes)</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Alunos (um ou mais)</label>
            <select
              multiple
              value={massAssignAlunoIds}
              onChange={(e) => {
                const ids = Array.from(e.target.selectedOptions).map((option) => option.value);
                setMassAssignAlunoIds(ids);
              }}
              className="w-full min-h-52 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>{capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Segure `Ctrl` (Windows) ou `Cmd` (Mac) para selecionar mÃºltiplos alunos.
            </p>
          </div>
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeMassAssign} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={massAssignMode === 'unassign' ? handleMassUnassign : handleMassAssign}
              className={`flex-1 ${massAssignMode === 'unassign' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#4318FF] hover:bg-[#3311CC]'}`}
              isLoading={massAssigning}
              disabled={alunos.length === 0}
            >
              {massAssignMode === 'unassign' ? 'Cancelar envio selecionado' : 'Enviar Para Alunos Selecionados'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={closeCorrection}
        title="CorreÃ§Ã£o da QuestÃ£o"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {currentEnvio ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-500 mb-2">QuestÃ£o</p>
              <MathContent html={questaoById(currentEnvio.questao_id)?.enunciado || ''} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-500 mb-2">Resposta do aluno</p>
              {currentEnvio.tipo_resposta === 'texto' ? (
                <p className="text-gray-700 whitespace-pre-wrap">{currentEnvio.resposta_texto}</p>
              ) : (
                <img src={currentEnvio.resposta_imagem_url || ''} alt="Resposta do aluno" className="max-h-96 rounded-lg border border-gray-200" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ComentÃ¡rio do professor</label>
              <textarea
                value={correctionForm.comentario_professor}
                onChange={(e) => setCorrectionForm(prev => ({ ...prev, comentario_professor: e.target.value }))}
                className="w-full min-h-[120px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                placeholder="Escreva seus comentÃ¡rios..."
              />
            </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nota</label>
            <input
              type="number"
              value={correctionForm.nota}
              onChange={(e) => setCorrectionForm(prev => ({ ...prev, nota: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              placeholder="Digite a nota"
              min="0"
              step="0.1"
            />
          </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={correctionForm.corrigida}
                onChange={(e) => setCorrectionForm(prev => ({ ...prev, corrigida: e.target.checked }))}
                className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
              />
              <span className="text-sm text-gray-700">Marcar como corrigida</span>
            </div>
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={closeCorrection} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveCorrection} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]">
                Salvar CorreÃ§Ã£o
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Excluir QuestÃ£o"
        message="Tem certeza que deseja excluir esta questÃ£o? Essa aÃ§Ã£o nÃ£o pode ser desfeita."
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
}


