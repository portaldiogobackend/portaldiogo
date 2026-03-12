import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, ArrowUpDown, ChevronLeft, ClipboardList, FileText, Filter, Menu, Minus, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';

// Interfaces
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
  idmat: string[];
  idseries: string[];
}

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  materias: string[];
  serie: string;
  email?: string | null;
}

interface Teste {
  id: string;
  idmat: string[];
  idseries: string[];
  idtema: string[];
  idalunos: string[];
  lista?: string | null;
  pergunta: string;
  alternativa: string;
  resposta: number;
  justificativa: string;
  created_at: string;
}

type SelectItem = {
  id: string;
  materia?: string;
  serie?: string;
  nometema?: string;
  nome?: string;
  sobrenome?: string;
};

// Order for series display
const SERIES_ORDER = [
  'Quinto Ano Fundamental',
  'Sexto Ano Fundamental',
  'Sétimo Ano Fundamental',
  'Oitavo Ano Fundamental',
  'Nono Ano Fundamental',
  'Primeiro Ano Ensino Médio',
  'Segundo Ano Ensino Médio',
  'Terceiro Ano Ensino Médio',
  'Outros'
];

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image'],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

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
  return doc.body.textContent || "";
};

const formatApiErrorMessage = (error: unknown, fallback = 'Erro desconhecido') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'object') {
    const message = 'message' in error ? String((error as { message?: unknown }).message || '') : '';
    const details = 'details' in error ? String((error as { details?: unknown }).details || '') : '';
    const hint = 'hint' in error ? String((error as { hint?: unknown }).hint || '') : '';
    const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
    const parts = [message, details, hint, code].filter(Boolean);
    if (parts.length > 0) return parts.join(' | ');
  }
  return fallback;
};

const isApiCommunicationError = (error: unknown) => {
  const text = formatApiErrorMessage(error, '').toLowerCase();
  return text.includes('failed to fetch')
    || text.includes('networkerror')
    || text.includes('network request failed')
    || text.includes('fetch failed')
    || text.includes('gateway timeout')
    || text.includes('timeout');
};

export default function AdminTestes() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Admin');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const isAdmin = userRole === 'admin';

  // Data lists
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);

  // Filters and Sorting for report
  const [reportFilterMateria, setReportFilterMateria] = useState<string>('');
  const [reportFilterTema, setReportFilterTema] = useState<string>('');
  const [reportFilterSerie, setReportFilterSerie] = useState<string>('');
  const [reportFilterLista, setReportFilterLista] = useState<string>('');
  const [reportSearchTerm, setReportSearchTerm] = useState<string>('');
  const [reportSortConfig, setReportSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedTesteIds, setSelectedTesteIds] = useState<string[]>([]);
  const [isMassAssignModalOpen, setIsMassAssignModalOpen] = useState(false);
  const [massAssignMode, setMassAssignMode] = useState<'assign' | 'unassign'>('assign');
  const [massAssignSerieId, setMassAssignSerieId] = useState('');
  const [massAssignAlunoIds, setMassAssignAlunoIds] = useState<string[]>([]);
  const [massAssigning, setMassAssigning] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemaModalOpen, setIsTemaModalOpen] = useState(false);
  const [isMassiveModalOpen, setIsMassiveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTema, setSavingTema] = useState(false);
  const [importing, setImporting] = useState(false);
  const [massiveFile, setMassiveFile] = useState<File | null>(null);
  const [importLog, setImportLog] = useState<{ success: number; errors: string[] } | null>(null);
  const [temaModalSource, setTemaModalSource] = useState<'individual' | 'massive'>('individual');

  // Form state
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    idmat: [] as string[],
    idseries: [] as string[],
    idtema: [] as string[],
    idalunos: [] as string[],
    lista: '',
    pergunta: '',
    alternativas: ['', '', '', ''] as string[],
    resposta: 1,
    justificativa: ''
  });

  // Massive Form state (Common fields)
  const [massiveFormData, setMassiveFormData] = useState({
    idmat: [] as string[],
    idseries: [] as string[],
    idtema: [] as string[],
    idalunos: [] as string[],
    lista: ''
  });

  // Tema Form state
  const [temaFormData, setTemaFormData] = useState({
    nometema: '',
    idmat: [] as string[],
    idseries: [] as string[]
  });

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('tbf_controle_user')
          .select('nome, role')
          .eq('id', user.id)
          .single();

        if (data?.nome) {
          setUserName(data.nome.split(' ')[0]);
        }
        setUserRole(data?.role ?? null);
      }

      // Fetch materias
      const { data: materiasData, error: materiasError } = await supabase
        .from('tbf_materias')
        .select('id, materia')
        .order('materia');
      if (materiasError) throw materiasError;
      setMaterias(materiasData || []);

      // Fetch series and sort by school order
      const { data: seriesData, error: seriesError } = await supabase
        .from('tbf_serie')
        .select('id, serie');
      if (seriesError) throw seriesError;
      
      const sortedSeries = (seriesData || []).sort((a, b) => {
        const indexA = SERIES_ORDER.indexOf(a.serie);
        const indexB = SERIES_ORDER.indexOf(b.serie);
        if (indexA === -1 && indexB === -1) return a.serie.localeCompare(b.serie);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setSeries(sortedSeries);

      // Fetch temas
      const { data: temasData, error: temasError } = await supabase
        .from('tbf_temas')
        .select('id, nometema, idmat, idseries')
        .order('nometema');
      if (temasError) throw temasError;
      setTemas(temasData || []);

      // Fetch alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('tbf_controle_user')
        .select('id, nome, sobrenome, materias, serie, email')
        .eq('role', 'aluno')
        .eq('signature', 'ativo')
        .not('email', 'is', null)
        .neq('email', '')
        .order('nome');
      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);

      // Fetch testes ordered by creation
      const { data: testesData, error: testesError } = await supabase
        .from('tbf_testes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (testesError) throw testesError;
      setTestes(testesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Filter temas based on selected materias and series
  const filteredTemas = useMemo(() => {
    if (formData.idmat.length === 0 && formData.idseries.length === 0) {
      return temas;
    }
    
    return temas.filter(tema => {
      const matchesMateria = formData.idmat.length === 0 || 
        formData.idmat.some(matId => tema.idmat?.includes(matId));
      const matchesSerie = formData.idseries.length === 0 || 
        formData.idseries.some(serieId => tema.idseries?.includes(serieId));
      return matchesMateria && matchesSerie;
    });
  }, [temas, formData.idmat, formData.idseries]);

  // Filter temas for Massive Upload
  const filteredTemasMassive = useMemo(() => {
    if (massiveFormData.idmat.length === 0 && massiveFormData.idseries.length === 0) {
      return temas;
    }
    
    return temas.filter(tema => {
      const matchesMateria = massiveFormData.idmat.length === 0 || 
        massiveFormData.idmat.some(matId => tema.idmat?.includes(matId));
      const matchesSerie = massiveFormData.idseries.length === 0 || 
        massiveFormData.idseries.some(serieId => tema.idseries?.includes(serieId));
      return matchesMateria && matchesSerie;
    });
  }, [temas, massiveFormData.idmat, massiveFormData.idseries]);

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter and sort alunos based on selected materias and series
  const filteredAlunos = useMemo(() => {
    let result = alunos;
    
    if (formData.idmat.length > 0 || formData.idseries.length > 0) {
      result = alunos.filter(aluno => {
        const matchesMateria = formData.idmat.length === 0 || 
          formData.idmat.some(matId => aluno.materias?.includes(matId));
        const matchesSerie = formData.idseries.length === 0 || 
          formData.idseries.includes(aluno.serie);
        return matchesMateria && matchesSerie;
      });
    }

    // Sort alphabetically by full name
    return [...result].sort((a, b) => {
      const nameA = `${a.nome} ${a.sobrenome}`.toLowerCase();
      const nameB = `${b.nome} ${b.sobrenome}`.toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }, [alunos, formData.idmat, formData.idseries]);

  // Filter and sort alunos for Massive Upload
  const filteredAlunosMassive = useMemo(() => {
    let result = alunos;
    
    if (massiveFormData.idmat.length > 0 || massiveFormData.idseries.length > 0) {
      result = alunos.filter(aluno => {
        const matchesMateria = massiveFormData.idmat.length === 0 || 
          massiveFormData.idmat.some(matId => aluno.materias?.includes(matId));
        const matchesSerie = massiveFormData.idseries.length === 0 || 
          massiveFormData.idseries.includes(aluno.serie);
        return matchesMateria && matchesSerie;
      });
    }

    // Sort alphabetically by full name
    return [...result].sort((a, b) => {
      const nameA = `${a.nome} ${a.sobrenome}`.toLowerCase();
      const nameB = `${b.nome} ${b.sobrenome}`.toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }, [alunos, massiveFormData.idmat, massiveFormData.idseries]);

  // Helper to get names from IDs for sorting
  const getTesteNamesForSort = useCallback((teste: Teste, type: 'materia' | 'tema' | 'serie') => {
    if (type === 'materia') {
      return materias
        .filter(m => teste.idmat?.includes(m.id))
        .map(m => m.materia)
        .join(', ') || '';
    }
    if (type === 'tema') {
      return temas
        .filter(t => teste.idtema?.includes(t.id))
        .map(t => t.nometema)
        .join(', ') || '';
    }
    if (type === 'serie') {
      return series
        .filter(s => teste.idseries?.includes(s.id))
        .map(s => s.serie)
        .join(', ') || '';
    }
    return '';
  }, [materias, series, temas]);

  // Report filters logic
  const listaOptions = useMemo(() => {
    return Array.from(
      new Set(
        testes
          .map((teste) => (typeof teste.lista === 'string' ? teste.lista.trim() : ''))
          .filter((value) => value !== '')
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [testes]);

  const hasActiveReportFilters = reportFilterMateria || reportFilterTema || reportFilterSerie || reportFilterLista || reportSearchTerm;

  const clearReportFilters = () => {
    setReportFilterMateria('');
    setReportFilterTema('');
    setReportFilterSerie('');
    setReportFilterLista('');
    setReportSearchTerm('');
    setReportSortConfig(null);
  };

  const handleReportSort = (key: string) => {
    setReportSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtered and sorted testes for report
  const filteredTestesReport = useMemo(() => {
    let result = testes;

    // Apply filters
    if (reportFilterMateria) {
      result = result.filter(teste => teste.idmat?.includes(reportFilterMateria));
    }
    if (reportFilterTema) {
      result = result.filter(teste => teste.idtema?.includes(reportFilterTema));
    }
    if (reportFilterSerie) {
      result = result.filter(teste => teste.idseries?.includes(reportFilterSerie));
    }
    if (reportFilterLista) {
      result = result.filter(teste => (teste.lista || '').trim() === reportFilterLista);
    }
    if (reportSearchTerm) {
      const searchLower = reportSearchTerm.toLowerCase();
      result = result.filter(teste => 
        stripHtml(teste.pergunta || '').toLowerCase().includes(searchLower)
        || (teste.lista || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (reportSortConfig) {
      result = [...result].sort((a, b) => {
        let valA = '';
        let valB = '';

        if (reportSortConfig.key === 'materia') {
          valA = getTesteNamesForSort(a, 'materia');
          valB = getTesteNamesForSort(b, 'materia');
        } else if (reportSortConfig.key === 'tema') {
          valA = getTesteNamesForSort(a, 'tema');
          valB = getTesteNamesForSort(b, 'tema');
        } else if (reportSortConfig.key === 'serie') {
          valA = getTesteNamesForSort(a, 'serie');
          valB = getTesteNamesForSort(b, 'serie');
        }

        return reportSortConfig.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }

    return result;
  }, [testes, reportFilterMateria, reportFilterTema, reportFilterSerie, reportFilterLista, reportSearchTerm, reportSortConfig, getTesteNamesForSort]);

  const visibleTesteIds = useMemo(() => filteredTestesReport.map(teste => teste.id), [filteredTestesReport]);
  const allVisibleSelected = visibleTesteIds.length > 0 && visibleTesteIds.every(id => selectedTesteIds.includes(id));
  const massAssignAlunos = useMemo(() => {
    if (!massAssignSerieId) return alunos;
    return alunos.filter(aluno => aluno.serie === massAssignSerieId);
  }, [alunos, massAssignSerieId]);

  const toggleTesteSelection = (id: string) => {
    setSelectedTesteIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAllVisibleTestes = () => {
    if (allVisibleSelected) {
      setSelectedTesteIds(prev => prev.filter(id => !visibleTesteIds.includes(id)));
      return;
    }
    setSelectedTesteIds(prev => {
      const next = new Set(prev);
      visibleTesteIds.forEach(id => next.add(id));
      return Array.from(next);
    });
  };

  const openMassAssignModal = (mode: 'assign' | 'unassign' = 'assign') => {
    if (mode === 'unassign' && !isAdmin) {
      showToast('Apenas administradores podem cancelar envios.', 'error');
      return;
    }
    if (alunos.length === 0) {
      showToast('Não há alunos com acesso elegíveis para receber testes.', 'error');
      return;
    }
    if (selectedTesteIds.length === 0) {
      showToast('Selecione pelo menos um teste.', 'error');
      return;
    }
    setMassAssignMode(mode);
    setIsMassAssignModalOpen(true);
  };

  const closeMassAssignModal = () => {
    setIsMassAssignModalOpen(false);
    setMassAssignSerieId('');
    setMassAssignAlunoIds([]);
  };

  const toggleMassAssignAluno = (id: string) => {
    setMassAssignAlunoIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAllMassAssignAlunos = (items: SelectItem[]) => {
    setMassAssignAlunoIds(prev => {
      const itemIds = items.map(item => item.id);
      const allSelected = items.length > 0 && items.every(item => prev.includes(item.id));
      if (allSelected) {
        return prev.filter(id => !itemIds.includes(id));
      }
      const next = new Set(prev);
      itemIds.forEach(id => next.add(id));
      return Array.from(next);
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const openModal = () => {
    setFormData({
      id: undefined,
      idmat: [],
      idseries: [],
      idtema: [],
      idalunos: [],
      lista: '',
      pergunta: '',
      alternativas: ['', '', '', ''],
      resposta: 1,
      justificativa: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      id: undefined,
      idmat: [],
      idseries: [],
      idtema: [],
      idalunos: [],
      lista: '',
      pergunta: '',
      alternativas: ['', '', '', ''],
      resposta: 1,
      justificativa: ''
    });
  };

  const openTemaModal = (source: 'individual' | 'massive' = 'individual') => {
    setTemaModalSource(source);
    const sourceData = source === 'individual' ? formData : massiveFormData;
    
    setTemaFormData({
      nometema: '',
      idmat: [...sourceData.idmat],
      idseries: [...sourceData.idseries]
    });
    setIsTemaModalOpen(true);
  };

  const closeTemaModal = () => {
    setIsTemaModalOpen(false);
    setTemaFormData({
      nometema: '',
      idmat: [],
      idseries: []
    });
  };

  const openMassiveModal = () => {
    setMassiveFormData({
      idmat: [],
      idseries: [],
      idtema: [],
      idalunos: [],
      lista: ''
    });
    setMassiveFile(null);
    setImportLog(null);
    setIsMassiveModalOpen(true);
  };

  const closeMassiveModal = () => {
    setIsMassiveModalOpen(false);
    setMassiveFormData({
      idmat: [],
      idseries: [],
      idtema: [],
      idalunos: [],
      lista: ''
    });
    setMassiveFile(null);
    setImportLog(null);
  };

  const toggleMassiveSelection = (id: string, field: 'idmat' | 'idseries' | 'idtema' | 'idalunos') => {
    setMassiveFormData(prev => {
      const current = prev[field];
      const exists = current.includes(id);
      const newValue = exists 
        ? current.filter(item => item !== id)
        : [...current, id];
      
      // Clear dependent fields when materia or serie changes
      if (field === 'idmat' || field === 'idseries') {
        return { 
          ...prev, 
          [field]: newValue,
          idtema: [],
          idalunos: []
        };
      }
      
      return { ...prev, [field]: newValue };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
      const allowedExtensions = ['.txt', '.doc', '.docx', '.pdf'];

      if (!allowedExtensions.includes(extension)) {
        showToast('Formato inválido. Use .txt, .doc, .docx ou .pdf.', 'error');
        e.target.value = '';
        return;
      }

      if (extension !== '.txt') {
        showToast('No momento, apenas arquivos .txt podem ser importados. Converta e tente novamente.', 'error');
        e.target.value = '';
        return;
      }

      setMassiveFile(file);
      setImportLog(null);
    }
  };

  const handleMassiveSubmit = async () => {
    // Validation
    if (massiveFormData.idmat.length === 0) {
      showToast('Selecione pelo menos uma matéria.', 'error');
      return;
    }
    if (massiveFormData.idseries.length === 0) {
      showToast('Selecione pelo menos uma série.', 'error');
      return;
    }
    if (!massiveFile) {
      showToast('Selecione um arquivo .txt para importar.', 'error');
      return;
    }

    setImporting(true);
    setImportLog(null);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        showToast('Arquivo vazio ou inválido.', 'error');
        setImporting(false);
        return;
      }

      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '' && !line.startsWith('#') && !line.startsWith('//'));

      let successCount = 0;
      const errors: string[] = [];
      const questionsSeen = new Set<string>();
      const pendingInserts: Array<{
        lineNumber: number;
        payload: {
          idmat: string[];
          idseries: string[];
          idtema: string[];
          idalunos: string[];
          lista: string | null;
          pergunta: string;
          alternativa: string;
          resposta: number;
          justificativa: string;
        };
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('|');

        if (parts.length < 4) {
          errors.push(`Linha ${i + 1}: Formato inválido. Esperado 4 colunas.`);
          continue;
        }

        const pergunta = parts[0].trim();
        const alternativas = parts[1].trim();
        const respostaStr = parts[2].trim();
        const justificativa = parts.slice(3).join('|').trim();

        if (!pergunta || !alternativas || !respostaStr) {
          errors.push(`Linha ${i + 1}: Campos obrigatórios faltando.`);
          continue;
        }

        const normalizedQuestion = stripHtml(pergunta).toLowerCase().replace(/\s+/g, ' ').trim();
        if (!normalizedQuestion) {
          errors.push(`Linha ${i + 1}: Pergunta inválida ou vazia após limpeza.`);
          continue;
        }
        if (questionsSeen.has(normalizedQuestion)) {
          errors.push(`Linha ${i + 1}: Pergunta duplicada.`);
          continue;
        }
        questionsSeen.add(normalizedQuestion);

        const resposta = parseInt(respostaStr);
        if (isNaN(resposta) || resposta < 1 || resposta > 10) {
           errors.push(`Linha ${i + 1}: Resposta deve ser um número entre 1 e 10.`);
           continue;
        }

        const alts = alternativas.split(';').map(a => a.trim()).filter(a => a !== '');
        if (alts.length < 2) {
          errors.push(`Linha ${i + 1}: Mínimo de 2 alternativas necessárias.`);
          continue;
        }
        if (resposta > alts.length) {
          errors.push(`Linha ${i + 1}: Resposta deve estar entre 1 e ${alts.length}.`);
          continue;
        }
        if (!stripHtml(justificativa).trim()) {
          errors.push(`Linha ${i + 1}: Justificativa é obrigatória.`);
          continue;
        }

        pendingInserts.push({
          lineNumber: i + 1,
          payload: {
            idmat: massiveFormData.idmat,
            idseries: massiveFormData.idseries,
            idtema: massiveFormData.idtema,
            idalunos: massiveFormData.idalunos,
            lista: massiveFormData.lista.trim() || null,
            pergunta,
            alternativa: alternativas,
            resposta,
            justificativa
          }
        });
      }

      const chunkSize = 25;
      for (let start = 0; start < pendingInserts.length; start += chunkSize) {
        const chunk = pendingInserts.slice(start, start + chunkSize);
        const { error: chunkError } = await supabase
          .from('tbf_testes')
          .insert(chunk.map(item => item.payload));

        if (!chunkError) {
          successCount += chunk.length;
          continue;
        }

        console.error(`Error importing chunk ${start}-${start + chunk.length}:`, chunkError);
        for (const item of chunk) {
          try {
            const { error } = await supabase
              .from('tbf_testes')
              .insert([item.payload]);
            if (error) throw error;
            successCount++;
          } catch (err) {
            console.error(`Error importing line ${item.lineNumber}:`, err);
            const message = formatApiErrorMessage(err);
            errors.push(`Linha ${item.lineNumber}: Erro ao salvar no banco - ${message}`);
          }
        }
      }

      const hasApiCommunicationIssue = errors.some((line) => line.toLowerCase().includes('failed to fetch'))
        || errors.some((line) => line.toLowerCase().includes('network'))
        || errors.some((line) => line.toLowerCase().includes('timeout'));

      if (hasApiCommunicationIssue) {
        errors.unshift('Falha de comunicação com a API detectada durante a importação. Verifique conexão/rede e tente novamente.');
      }

      setImporting(false);
      setImportLog({ success: successCount, errors });
      
      if (successCount > 0) {
        showToast(`${successCount} testes importados com sucesso!`, 'success');
        // Refresh list
        fetchInitialData();
        if (errors.length === 0) {
          closeMassiveModal();
        }
      } else {
        if (isApiCommunicationError(errors.join(' '))) {
          showToast('Erro de comunicação com a API. Tente novamente em instantes.', 'error');
        } else {
          showToast('Nenhum teste foi importado. Verifique os erros.', 'error');
        }
      }
    };

    reader.onerror = () => {
      showToast('Erro ao ler o arquivo.', 'error');
      setImporting(false);
    };

    reader.readAsText(massiveFile, 'UTF-8');
  };

  const handleSaveTema = async () => {
    if (!temaFormData.nometema.trim()) {
      showToast('Digite o nome do tema.', 'error');
      return;
    }
    if (temaFormData.idmat.length === 0) {
      showToast('Selecione pelo menos uma matéria.', 'error');
      return;
    }
    if (temaFormData.idseries.length === 0) {
      showToast('Selecione pelo menos uma série.', 'error');
      return;
    }

    setSavingTema(true);
    try {
      const { data, error } = await supabase
        .from('tbf_temas')
        .insert([{
          nometema: temaFormData.nometema,
          idmat: temaFormData.idmat,
          idseries: temaFormData.idseries
        }])
        .select()
        .single();

      if (error) throw error;

      showToast('Tema cadastrado com sucesso!', 'success');
      
      // Atualizar lista de temas localmente
      setTemas(prev => [...prev, data].sort((a, b) => a.nometema.localeCompare(b.nometema)));
      
      // Selecionar o novo tema no form correto
      if (temaModalSource === 'individual') {
        setFormData(prev => ({
          ...prev,
          idtema: [data.id]
        }));
      } else {
        setMassiveFormData(prev => ({
          ...prev,
          idtema: [data.id]
        }));
      }
      
      closeTemaModal();
    } catch (error) {
      console.error('Error saving tema:', error);
      showToast('Erro ao salvar tema.', 'error');
    } finally {
      setSavingTema(false);
    }
  };

  const handleToggleAll = (items: SelectItem[], field: 'idmat' | 'idseries' | 'idtema' | 'idalunos') => {
    setFormData(prev => {
      const itemIds = items.map(i => i.id);
      const current = prev[field];
      const allSelected = items.length > 0 && items.every(item => current.includes(item.id));
      const isMateriaOrSerie = field === 'idmat' || field === 'idseries';
      
      if (allSelected) {
        return {
          ...prev,
          [field]: current.filter(id => !itemIds.includes(id)),
          ...(isMateriaOrSerie ? { idtema: [], idalunos: [] } : {})
        };
      } else {
        const newSelection = [...new Set([...current, ...itemIds])];
        return {
          ...prev,
          [field]: newSelection,
          ...(isMateriaOrSerie ? { idtema: [], idalunos: [] } : {})
        };
      }
    });
  };

  const handleMassiveToggleAll = (items: SelectItem[], field: 'idmat' | 'idseries' | 'idtema' | 'idalunos') => {
    setMassiveFormData(prev => {
      const itemIds = items.map(i => i.id);
      const current = prev[field];
      const allSelected = items.length > 0 && items.every(item => current.includes(item.id));
      const isMateriaOrSerie = field === 'idmat' || field === 'idseries';
      
      if (allSelected) {
        return {
          ...prev,
          [field]: current.filter(id => !itemIds.includes(id)),
          ...(isMateriaOrSerie ? { idtema: [], idalunos: [] } : {})
        };
      } else {
        const newSelection = [...new Set([...current, ...itemIds])];
        return {
          ...prev,
          [field]: newSelection,
          ...(isMateriaOrSerie ? { idtema: [], idalunos: [] } : {})
        };
      }
    });
  };

  const toggleSelection = (id: string, field: 'idmat' | 'idseries' | 'idtema' | 'idalunos') => {
    setFormData(prev => {
      const current = prev[field];
      const exists = current.includes(id);
      const newValue = exists 
        ? current.filter(item => item !== id)
        : [...current, id];
      
      // Clear dependent fields when materia or serie changes
      if (field === 'idmat' || field === 'idseries') {
        return { 
          ...prev, 
          [field]: newValue,
          idtema: [],
          idalunos: []
        };
      }
      
      return { ...prev, [field]: newValue };
    });
  };

  const addAlternativa = () => {
    if (formData.alternativas.length < 10) {
      setFormData(prev => ({
        ...prev,
        alternativas: [...prev.alternativas, '']
      }));
    }
  };

  const removeAlternativa = (index: number) => {
    if (formData.alternativas.length > 2) {
      setFormData(prev => {
        const newAlternativas = prev.alternativas.filter((_, i) => i !== index);
        // Adjust resposta if needed
        let newResposta = prev.resposta;
        if (prev.resposta > newAlternativas.length) {
          newResposta = newAlternativas.length;
        } else if (prev.resposta > index) {
          newResposta = prev.resposta - 1;
        }
        return {
          ...prev,
          alternativas: newAlternativas,
          resposta: newResposta
        };
      });
    }
  };

  const updateAlternativa = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      alternativas: prev.alternativas.map((alt, i) => i === index ? value : alt)
    }));
  };

  const handleEdit = (teste: Teste) => {
    setFormData({
      id: teste.id,
      idmat: teste.idmat || [],
      idseries: teste.idseries || [],
      idtema: teste.idtema || [],
      idalunos: teste.idalunos || [],
      lista: teste.lista || '',
      pergunta: teste.pergunta,
      alternativas: teste.alternativa ? teste.alternativa.split(';') : ['', '', '', ''],
      resposta: teste.resposta,
      justificativa: teste.justificativa || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este teste?')) return;

    try {
      const { error } = await supabase
        .from('tbf_testes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Teste excluído com sucesso!', 'success');
      setTestes(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting test:', error);
      showToast('Erro ao excluir teste.', 'error');
    }
  };

  const handleMassTestApply = async () => {
    if (massAssignMode === 'unassign' && !isAdmin) {
      showToast('Apenas administradores podem cancelar envios.', 'error');
      return;
    }
    if (selectedTesteIds.length === 0) {
      showToast('Selecione pelo menos um teste.', 'error');
      return;
    }

    const targetAlunoIds = massAssignAlunoIds.length > 0
      ? massAssignAlunoIds
      : massAssignSerieId
        ? massAssignAlunos.map(aluno => aluno.id)
        : [];

    if (targetAlunoIds.length === 0) {
      showToast('Selecione um aluno ou uma série com alunos.', 'error');
      return;
    }

    setMassAssigning(true);
    try {
      const updates = selectedTesteIds
        .map(testeId => {
          const teste = testes.find(t => t.id === testeId);
          if (!teste) return null;
          const currentAlunos = Array.isArray(teste.idalunos) ? teste.idalunos : [];
          const nextAlunos = massAssignMode === 'assign'
            ? Array.from(new Set([...currentAlunos, ...targetAlunoIds]))
            : currentAlunos.filter(alunoId => !targetAlunoIds.includes(alunoId));
          if (nextAlunos.length === currentAlunos.length) return null;
          return { testeId, nextAlunos };
        })
        .filter((update): update is { testeId: string; nextAlunos: string[] } => !!update);

      if (updates.length === 0) {
        showToast(massAssignMode === 'assign' ? 'Todos os testes já foram enviados.' : 'Nenhum envio encontrado para cancelamento.', 'error');
        setMassAssigning(false);
        return;
      }

      const updateResults = await Promise.all(
        updates.map(update => supabase
          .from('tbf_testes')
          .update({ idalunos: update.nextAlunos })
          .eq('id', update.testeId)
          .select()
          .single()
        )
      );

      const errorResult = updateResults.find(result => result.error);
      if (errorResult?.error) throw errorResult.error;

      const updatedTestes = updateResults
        .map(result => result.data)
        .filter((item): item is Teste => !!item);

      setTestes(prev => prev.map(teste => {
        const updated = updatedTestes.find(item => item.id === teste.id);
        return updated ? updated : teste;
      }));

      showToast(
        massAssignMode === 'assign'
          ? `Testes enviados para ${targetAlunoIds.length} aluno(s)!`
          : `Envio cancelado para ${targetAlunoIds.length} aluno(s)!`,
        'success'
      );
      closeMassAssignModal();
      setSelectedTesteIds([]);
    } catch (error) {
      console.error(massAssignMode === 'assign' ? 'Erro ao enviar testes:' : 'Erro ao cancelar envios de testes:', error);
      showToast(massAssignMode === 'assign' ? 'Erro ao enviar testes.' : 'Erro ao cancelar envios de testes.', 'error');
    } finally {
      setMassAssigning(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (formData.idmat.length === 0) {
      showToast('Selecione pelo menos uma matéria.', 'error');
      return;
    }
    if (formData.idseries.length === 0) {
      showToast('Selecione pelo menos uma série.', 'error');
      return;
    }
    if (!stripHtml(formData.pergunta).trim()) {
      showToast('Digite a pergunta.', 'error');
      return;
    }
    
    const filledAlternativas = formData.alternativas.map(alt => alt.trim()).filter(alt => alt !== '');
    if (filledAlternativas.length < 2) {
      showToast('Preencha pelo menos 2 alternativas.', 'error');
      return;
    }
    if (formData.resposta < 1 || formData.resposta > filledAlternativas.length) {
      showToast(`Selecione uma resposta entre 1 e ${filledAlternativas.length}.`, 'error');
      return;
    }
    if (!stripHtml(formData.justificativa).trim()) {
      showToast('Digite a justificativa.', 'error');
      return;
    }

    setSaving(true);
    try {
      const alternativaString = filledAlternativas.join(';');

      const dataToSave = {
        idmat: formData.idmat,
        idseries: formData.idseries,
        idtema: formData.idtema,
        idalunos: formData.idalunos,
        lista: formData.lista.trim() || null,
        pergunta: formData.pergunta,
        alternativa: alternativaString,
        resposta: formData.resposta,
        justificativa: formData.justificativa
      };

      if (formData.id) {
        const { data, error } = await supabase
          .from('tbf_testes')
          .update(dataToSave)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        setTestes(prev => prev.map(t => t.id === formData.id ? data : t));
        showToast('Teste atualizado com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('tbf_testes')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        setTestes(prev => [data, ...prev]);
        showToast('Teste cadastrado com sucesso!', 'success');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving test:', error);
      showToast('Erro ao salvar teste. Verifique se a tabela tbf_testes existe.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Multi-select checkbox component
  const MultiSelect = ({ 
    label, 
    items, 
    selectedIds, 
    onToggle,
    onToggleAll,
    displayProp,
    maxHeight = 'max-h-40',
    subtitle,
    renderLabel
  }: { 
    label: string, 
    items: SelectItem[], 
    selectedIds: string[], 
    onToggle: (id: string) => void,
    onToggleAll: (items: SelectItem[]) => void,
    displayProp?: keyof SelectItem,
    maxHeight?: string,
    subtitle?: React.ReactNode,
    renderLabel?: (item: SelectItem) => React.ReactNode
  }) => {
    const allSelected = items.length > 0 && items.every(item => selectedIds.includes(item.id));
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id={`select-all-${label}`}
                checked={allSelected}
                onChange={() => onToggleAll(items)}
                className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF] cursor-pointer"
              />
              <label htmlFor={`select-all-${label}`} className="text-xs font-medium text-gray-500 cursor-pointer select-none">
                Selecionar Todos
              </label>
            </div>
          )}
          {subtitle}
        </div>
        <div className={`border border-gray-200 rounded-xl p-4 ${maxHeight} overflow-y-auto space-y-2 bg-gray-50`}>
          {items.length === 0 ? (
             <p className="text-sm text-gray-400">Nenhum item disponível</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${label}-${item.id}`}
                  checked={selectedIds.includes(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                />
                <label htmlFor={`${label}-${item.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                  {renderLabel ? renderLabel(item) : (displayProp ? item[displayProp] : '')}
                </label>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500">{selectedIds.length} selecionado(s)</p>
      </div>
    );
  };

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
        onConfirm={handleLogout}
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
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden md:inline">Voltar ao Dashboard</span>
              <span className="md:hidden">Voltar</span>
            </button>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Painel de Controle de Testes</h1>
          
          <div className="flex gap-3">
            <Button onClick={openMassiveModal} className="bg-white text-[#4318FF] border border-[#4318FF] hover:bg-gray-50">
              <Upload size={18} className="mr-2" />
              Envio Massivo
            </Button>
            <Button
              onClick={() => openMassAssignModal('assign')}
              className="bg-white text-[#4318FF] border border-[#4318FF] hover:bg-gray-50"
              disabled={alunos.length === 0}
            >
              <FileText size={18} className="mr-2" />
              Enviar Testes
            </Button>
            <Button onClick={openModal} className="bg-[#4318FF] hover:bg-[#3311CC]">
              <ClipboardList size={18} className="mr-2" />
              Cadastrar Testes
            </Button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4 ${selectedTesteIds.length > 0 ? 'pb-28 md:pb-10' : ''}`}>
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <h1 className="text-2xl font-bold mb-4">Painel Admin de Testes</h1>
              <p className="text-gray-500">Use o botão "Cadastrar Testes" para adicionar novos questionários de múltipla escolha.</p>
            </div>

            {/* Relatório de Testes */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1B2559]">Relatório de Testes Cadastrados</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500">{filteredTestesReport.length} de {testes.length} teste(s)</span>
                  <span className="text-sm font-medium text-gray-500">{selectedTesteIds.length} selecionado(s)</span>
                  <Button onClick={() => openMassAssignModal('assign')} className="bg-[#4318FF] hover:bg-[#3311CC]" disabled={alunos.length === 0}>
                    Enviar testes
                  </Button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Filter size={18} className="text-[#4318FF]" />
                    <span>Filtros:</span>
                  </div>

                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por pergunta..."
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent"
                    />
                  </div>

                  {/* Matéria Filter */}
                  <div className="relative">
                    <select
                      value={reportFilterMateria}
                      onChange={(e) => setReportFilterMateria(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[160px]"
                    >
                      <option value="">Todas Matérias</option>
                      {materias.map(mat => (
                        <option key={mat.id} value={mat.id}>{mat.materia}</option>
                      ))}
                    </select>
                    <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Tema Filter */}
                  <div className="relative">
                    <select
                      value={reportFilterTema}
                      onChange={(e) => setReportFilterTema(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[160px]"
                    >
                      <option value="">Todos Temas</option>
                      {temas.map(tema => (
                        <option key={tema.id} value={tema.id}>{tema.nometema}</option>
                      ))}
                    </select>
                    <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Série Filter */}
                  <div className="relative">
                    <select
                      value={reportFilterSerie}
                      onChange={(e) => setReportFilterSerie(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[180px]"
                    >
                      <option value="">Todas Séries</option>
                      {series.map(ser => (
                        <option key={ser.id} value={ser.id}>{ser.serie}</option>
                      ))}
                    </select>
                    <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Lista Filter */}
                  <div className="relative">
                    <select
                      value={reportFilterLista}
                      onChange={(e) => setReportFilterLista(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[170px]"
                    >
                      <option value="">Todas Listas</option>
                      {listaOptions.map((lista) => (
                        <option key={lista} value={lista}>{lista}</option>
                      ))}
                    </select>
                    <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveReportFilters && (
                    <button
                      onClick={clearReportFilters}
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
                        onChange={toggleAllVisibleTestes}
                        className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                      />
                      Selecionar todos visíveis
                    </label>
                    {selectedTesteIds.length > 0 && (
                      <button
                        onClick={() => setSelectedTesteIds([])}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>
                  {selectedTesteIds.length > 0 && (
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        {selectedTesteIds.length} selecionado(s)
                      </span>
                      <Button onClick={() => openMassAssignModal('assign')} className="w-full sm:w-auto bg-[#4318FF] hover:bg-[#3311CC]" disabled={alunos.length === 0}>
                        Enviar selecionados
                      </Button>
                      {isAdmin && (
                        <Button onClick={() => openMassAssignModal('unassign')} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white" disabled={alunos.length === 0}>
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
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleAllVisibleTestes}
                              className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                            />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleReportSort('materia')}
                        >
                          <div className="flex items-center gap-1">
                            Matéria
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${reportSortConfig?.key === 'materia' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleReportSort('tema')}
                        >
                          <div className="flex items-center gap-1">
                            Tema
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${reportSortConfig?.key === 'tema' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th 
                          className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider cursor-pointer hover:text-[#4318FF] transition-colors group"
                          onClick={() => handleReportSort('serie')}
                        >
                          <div className="flex items-center gap-1">
                            Série
                            <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 ${reportSortConfig?.key === 'serie' ? 'opacity-100 text-[#4318FF]' : ''}`} />
                          </div>
                        </th>
                        <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Lista</th>
                        <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Pergunta</th>
                        <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-center">Resposta</th>
                        <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center">
                          <Spinner size="md" />
                        </td>
                      </tr>
                    ) : filteredTestesReport.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-gray-400">
                          {testes.length === 0 ? 'Nenhum teste cadastrado ainda.' : 'Nenhum teste encontrado com os filtros aplicados.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTestesReport.map((teste) => {
                        const materiaNames = materias
                          .filter(m => teste.idmat?.includes(m.id))
                          .map(m => m.materia)
                          .join(', ');
                        
                        const temaNames = temas
                          .filter(t => teste.idtema?.includes(t.id))
                          .map(t => t.nometema)
                          .join(', ');

                        const serieNames = series
                          .filter(s => teste.idseries?.includes(s.id))
                          .map(s => s.serie)
                          .join(', ');

                        return (
                          <tr key={teste.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={selectedTesteIds.includes(teste.id)}
                                  onChange={() => toggleTesteSelection(teste.id)}
                                  className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm font-bold text-[#2B3674] max-w-[150px] truncate" title={materiaNames}>
                              {materiaNames || '-'}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-600 max-w-[150px] truncate" title={temaNames}>
                              {temaNames || '-'}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-600 max-w-[150px] truncate" title={serieNames}>
                              {serieNames || '-'}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-600 max-w-[160px] truncate" title={(teste.lista || '').trim()}>
                              {(teste.lista || '').trim() || '-'}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-600 max-w-[300px] truncate" title={stripHtml(teste.pergunta)}>
                              {stripHtml(teste.pergunta)}
                            </td>
                            <td className="py-4 px-4 text-sm font-bold text-[#4318FF] text-center">
                              {teste.resposta}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(teste)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(teste.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
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
        {selectedTesteIds.length > 0 && (
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#1B2559]">{selectedTesteIds.length} teste(s) selecionado(s)</span>
              <button
                onClick={() => setSelectedTesteIds([])}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Limpar
              </button>
            </div>
            <div className={`grid gap-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <Button
                onClick={() => openMassAssignModal('assign')}
                className="w-full bg-[#4318FF] hover:bg-[#3311CC]"
                disabled={alunos.length === 0}
              >
                Enviar
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => openMassAssignModal('unassign')}
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

      {/* Modal de Cadastro de Testes */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={formData.id ? "Editar Teste" : "Cadastrar Novo Teste"}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Matérias */}
            <MultiSelect 
              label="Matérias *" 
              items={materias} 
              selectedIds={formData.idmat} 
              onToggle={(id) => toggleSelection(id, 'idmat')}
              onToggleAll={(items) => handleToggleAll(items, 'idmat')}
              displayProp="materia"
            />

            {/* Séries */}
            <MultiSelect 
              label="Séries *" 
              items={series} 
              selectedIds={formData.idseries} 
              onToggle={(id) => toggleSelection(id, 'idseries')}
              onToggleAll={(items) => handleToggleAll(items, 'idseries')}
              displayProp="serie"
            />

            {/* Temas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Tema 
                  {(formData.idmat.length > 0 || formData.idseries.length > 0) && 
                    <span className="text-xs text-gray-400 ml-2">(filtrado por matéria/série)</span>
                  }
                </label>
                <button
                  type="button"
                  onClick={() => openTemaModal('individual')}
                  className="flex items-center gap-1 text-xs font-medium text-[#4318FF] hover:underline"
                >
                  <Plus size={14} />
                  Cadastrar Tema
                </button>
              </div>
              <select
                value={formData.idtema[0] || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  idtema: e.target.value ? [e.target.value] : [] 
                }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              >
                <option value="">Selecione um tema (opcional)</option>
                {filteredTemas.map(tema => (
                  <option key={tema.id} value={tema.id}>{tema.nometema}</option>
                ))}
              </select>
            </div>

            {/* Alunos */}
            <MultiSelect 
              label="Alunos" 
              items={filteredAlunos} 
              selectedIds={formData.idalunos} 
              onToggle={(id) => toggleSelection(id, 'idalunos')}
              onToggleAll={(items) => handleToggleAll(items, 'idalunos')}
              subtitle={(formData.idmat.length > 0 || formData.idseries.length > 0) && (
                <span className="text-xs text-gray-400">(filtrado por matéria/série)</span>
              )}
              renderLabel={(aluno) => {
                const alunoSerie = series.find(s => s.id === aluno.serie)?.serie;
                
                return (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{capitalizeWords(aluno.nome || '')} {capitalizeWords(aluno.sobrenome || '')}</span>
                    {alunoSerie && (
                      <span className="text-xs text-gray-500">- {alunoSerie}</span>
                    )}
                  </span>
                );
              }}
            />

            {/* Pergunta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lista de Exercícios</label>
              <input
                type="text"
                value={formData.lista}
                onChange={(e) => setFormData(prev => ({ ...prev, lista: e.target.value }))}
                placeholder="Ex.: Lista 01 - Frações"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              />
              <p className="text-xs text-gray-500">Use este campo para agrupar testes por lista.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pergunta *</label>
              <div className="bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.pergunta}
                  onChange={(value) => setFormData(prev => ({ ...prev, pergunta: value }))}
                  modules={modules}
                  formats={formats}
                  placeholder="Digite a pergunta do teste..."
                  className="bg-white"
                />
              </div>
            </div>

            {/* Alternativas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Alternativas * (mín. 2, máx. 10)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => removeAlternativa(formData.alternativas.length - 1)}
                    disabled={formData.alternativas.length <= 2}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Remover última alternativa"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={addAlternativa}
                    disabled={formData.alternativas.length >= 10}
                    className="p-1.5 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Adicionar alternativa"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {formData.alternativas.map((alt, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="resposta"
                      checked={formData.resposta === index + 1}
                      onChange={() => setFormData(prev => ({ ...prev, resposta: index + 1 }))}
                      className="w-5 h-5 text-[#4318FF] border-gray-300 focus:ring-[#4318FF]"
                      title="Marcar como resposta correta"
                    />
                    <span className="text-sm font-bold text-gray-500 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={alt}
                      onChange={(e) => updateAlternativa(index, e.target.value)}
                      placeholder={`Alternativa ${index + 1}`}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                    />
                    {formData.alternativas.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAlternativa(index)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover esta alternativa"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Selecione o círculo ao lado da alternativa correta (resposta selecionada: {formData.resposta})
              </p>
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Justificativa</label>
              <div className="bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.justificativa}
                  onChange={(value) => setFormData(prev => ({ ...prev, justificativa: value }))}
                  modules={modules}
                  formats={formats}
                  placeholder="Explique por que esta é a resposta correta (opcional)..."
                  className="bg-white"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={closeModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]"
                isLoading={saving}
              >
                {formData.id ? "Salvar Alterações" : "Salvar Teste"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Cadastro de Tema */}
      <Modal
        isOpen={isTemaModalOpen}
        onClose={closeTemaModal}
        title="Cadastrar Novo Tema"
        className="max-w-lg"
        zIndex={70}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nome do Tema *</label>
            <input
              type="text"
              value={temaFormData.nometema}
              onChange={(e) => setTemaFormData(prev => ({ ...prev, nometema: e.target.value }))}
              placeholder="Digite o nome do tema..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Matérias Relacionadas *</label>
              <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2 bg-gray-50">
                {materias.map(materia => (
                  <div key={materia.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tema-materia-${materia.id}`}
                      checked={temaFormData.idmat.includes(materia.id)}
                      onChange={() => setTemaFormData(prev => {
                        const exists = prev.idmat.includes(materia.id);
                        return {
                          ...prev,
                          idmat: exists 
                            ? prev.idmat.filter(id => id !== materia.id)
                            : [...prev.idmat, materia.id]
                        };
                      })}
                      className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                    />
                    <label htmlFor={`tema-materia-${materia.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                      {materia.materia}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Séries Relacionadas *</label>
              <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2 bg-gray-50">
                {series.map(serie => (
                  <div key={serie.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tema-serie-${serie.id}`}
                      checked={temaFormData.idseries.includes(serie.id)}
                      onChange={() => setTemaFormData(prev => {
                        const exists = prev.idseries.includes(serie.id);
                        return {
                          ...prev,
                          idseries: exists 
                            ? prev.idseries.filter(id => id !== serie.id)
                            : [...prev.idseries, serie.id]
                        };
                      })}
                      className="w-4 h-4 text-[#4318FF] border-gray-300 rounded focus:ring-[#4318FF]"
                    />
                    <label htmlFor={`tema-serie-${serie.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                      {serie.serie}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={closeTemaModal}
              className="flex-1"
              disabled={savingTema}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTema}
              className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]"
              isLoading={savingTema}
            >
              Salvar Tema
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isMassAssignModalOpen}
        onClose={closeMassAssignModal}
        title={massAssignMode === 'unassign' ? 'Cancelar Envio de Testes Selecionados' : 'Enviar Testes Selecionados'}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Somente alunos com acesso ativo (e-mail cadastrado) aparecem para envio.
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-500 mb-2">Selecionados</p>
            <p className="text-sm text-gray-700">{selectedTesteIds.length} teste(s)</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Série (opcional)</label>
            <select
              value={massAssignSerieId}
              onChange={(e) => setMassAssignSerieId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="">Selecione</option>
              {series.map(serie => (
                <option key={serie.id} value={serie.id}>{serie.serie}</option>
              ))}
            </select>
            {massAssignSerieId && massAssignAlunos.length === 0 && (
              <p className="text-xs text-red-500">Nenhum aluno encontrado para a série.</p>
            )}
          </div>
          <MultiSelect 
            label="Alunos (opcional)" 
            items={massAssignAlunos} 
            selectedIds={massAssignAlunoIds} 
            onToggle={toggleMassAssignAluno}
            onToggleAll={toggleAllMassAssignAlunos}
            subtitle={massAssignSerieId && (
              <span className="text-xs text-gray-400">(filtrado por série)</span>
            )}
            renderLabel={(aluno) => {
              const alunoSerie = series.find(s => s.id === aluno.serie)?.serie;
              
              return (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{capitalizeWords(aluno.nome || '')} {capitalizeWords(aluno.sobrenome || '')}</span>
                  {alunoSerie && (
                    <span className="text-xs text-gray-500">- {alunoSerie}</span>
                  )}
                </span>
              );
            }}
          />
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeMassAssignModal} className="flex-1">
              Cancelar
            </Button>
          <Button
            onClick={handleMassTestApply}
            className={`flex-1 ${massAssignMode === 'unassign' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#4318FF] hover:bg-[#3311CC]'}`}
            isLoading={massAssigning}
            disabled={alunos.length === 0}
          >
              {massAssignMode === 'unassign' ? 'Cancelar envio de testes' : 'Enviar Testes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Envio Massivo */}
      <Modal
        isOpen={isMassiveModalOpen}
        onClose={closeMassiveModal}
        title="Envio Massivo de Testes"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <div className="text-blue-600 mt-1">
              <FileText size={20} />
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Instruções de Importação</p>
              <p className="mb-2">Envie um arquivo <strong>.txt</strong> com os dados separados por pipe ( | ). Arquivos .doc/.docx/.pdf devem ser convertidos para .txt.</p>
              <p className="font-mono text-xs bg-white/50 p-2 rounded border border-blue-200">
                Pergunta | Alternativa1;Alternativa2... | Resposta (1-10) | Justificativa
              </p>
            </div>
          </div>

          {/* Matérias */}
          <MultiSelect 
            label="Matérias *" 
            items={materias} 
            selectedIds={massiveFormData.idmat} 
            onToggle={(id) => toggleMassiveSelection(id, 'idmat')}
            onToggleAll={(items) => handleMassiveToggleAll(items, 'idmat')}
            displayProp="materia"
          />

          {/* Séries */}
          <MultiSelect 
            label="Séries *" 
            items={series} 
            selectedIds={massiveFormData.idseries} 
            onToggle={(id) => toggleMassiveSelection(id, 'idseries')}
            onToggleAll={(items) => handleMassiveToggleAll(items, 'idseries')}
            displayProp="serie"
          />

          {/* Temas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Tema 
                {(massiveFormData.idmat.length > 0 || massiveFormData.idseries.length > 0) && 
                  <span className="text-xs text-gray-400 ml-2">(filtrado por matéria/série)</span>
                }
              </label>
              <button
                type="button"
                onClick={() => openTemaModal('massive')}
                className="flex items-center gap-1 text-xs font-medium text-[#4318FF] hover:underline"
              >
                <Plus size={14} />
                Cadastrar Tema
              </button>
            </div>
            <select
              value={massiveFormData.idtema[0] || ''}
              onChange={(e) => setMassiveFormData(prev => ({ 
                ...prev, 
                idtema: e.target.value ? [e.target.value] : [] 
              }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="">Selecione um tema (opcional)</option>
              {filteredTemasMassive.map(tema => (
                <option key={tema.id} value={tema.id}>{tema.nometema}</option>
              ))}
            </select>
          </div>

          {/* Alunos */}
          <MultiSelect 
            label="Alunos" 
            items={filteredAlunosMassive} 
            selectedIds={massiveFormData.idalunos} 
            onToggle={(id) => toggleMassiveSelection(id, 'idalunos')}
            onToggleAll={(items) => handleMassiveToggleAll(items, 'idalunos')}
            subtitle={(massiveFormData.idmat.length > 0 || massiveFormData.idseries.length > 0) && (
              <span className="text-xs text-gray-400">(filtrado por matéria/série)</span>
            )}
            renderLabel={(aluno) => {
              const alunoSerie = series.find(s => s.id === aluno.serie)?.serie;
              
              return (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{capitalizeWords(aluno.nome || '')} {capitalizeWords(aluno.sobrenome || '')}</span>
                  {alunoSerie && (
                    <span className="text-xs text-gray-500">- {alunoSerie}</span>
                  )}
                </span>
              );
            }}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Lista de Exercícios</label>
            <input
              type="text"
              value={massiveFormData.lista}
              onChange={(e) => setMassiveFormData(prev => ({ ...prev, lista: e.target.value }))}
              placeholder="Ex.: Lista 02 - Equações"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            />
            <p className="text-xs text-gray-500">Todos os testes importados receberão esta lista.</p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Arquivo de Importação (.txt, .doc, .docx, .pdf) *</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${massiveFile ? 'border-[#4318FF] bg-blue-50' : 'border-gray-300 hover:border-[#4318FF]'}`}>
              <input
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={32} className={massiveFile ? 'text-[#4318FF]' : 'text-gray-400'} />
                {massiveFile ? (
                  <span className="text-sm font-bold text-[#4318FF]">{massiveFile.name}</span>
                ) : (
                  <span className="text-sm text-gray-500">Clique para selecionar um arquivo</span>
                )}
              </label>
            </div>
          </div>

          {/* Log de Importação */}
          {importLog && (
            <div className={`rounded-xl p-4 ${importLog.success > 0 && importLog.errors.length === 0 ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importLog.errors.length > 0 ? (
                  <AlertTriangle className="text-orange-500" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">âœ“</div>
                )}
                <span className="font-bold text-gray-800">Resultado da Importação</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Sucessos: <span className="font-bold text-green-600">{importLog.success}</span> | 
                Falhas: <span className="font-bold text-red-600">{importLog.errors.length}</span>
              </p>
              
              {importLog.errors.length > 0 && (
                <div className="mt-3 bg-white rounded-lg border border-orange-200 p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-500 mb-2">Detalhes dos Erros:</p>
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
            <Button
              variant="ghost"
              onClick={closeMassiveModal}
              className="flex-1"
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMassiveSubmit}
              className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]"
              isLoading={importing}
              disabled={!massiveFile}
            >
              Importar Testes
            </Button>
          </div>
        </div>
      </Modal>

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


