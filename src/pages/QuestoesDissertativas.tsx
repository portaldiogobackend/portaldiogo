import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, FileText, Filter, Menu, Pencil, Search, Trash2, Upload, X } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [currentQuestao, setCurrentQuestao] = useState<QuestaoDissertativa | null>(null);
  const [currentEnvio, setCurrentEnvio] = useState<EnvioDissertativa | null>(null);
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLog, setImportLog] = useState<{ success: number; errors: string[] } | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    comentario_professor: '',
    corrigida: false,
    nota: ''
  });

  const isStaff = userRole === 'admin' || userRole === 'professor';

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

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
        .select('id, nome, sobrenome')
        .eq('role', 'aluno')
        .order('nome');
      setAlunos((alunosData as Aluno[]) || []);

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
      showToast('Erro ao carregar dados.', 'error');
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
      showToast('Selecione uma série.', 'error');
      return;
    }
    if (!formData.professor_id) {
      showToast('Selecione o professor responsável.', 'error');
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
        showToast('Questão atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('tbf_questoes_dissertativas')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setQuestoes(prev => [data as QuestaoDissertativa, ...prev]);
        showToast('Questão cadastrada com sucesso!', 'success');
      }

      closeModal();
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar questão.';
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
      showToast('Questão excluída com sucesso!', 'success');
      closeDelete();
    } catch (error) {
      console.error('Erro ao excluir questão:', error);
      showToast('Erro ao excluir questão.', 'error');
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
            errors.push(`Linha ${lineIndex}: Formato inválido. Use 4 a 6 colunas separadas por |`);
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
          errors.push(`Linha ${lineIndex}: Campos obrigatórios faltando.`);
          continue;
        }

        const idmat = findMateriaId(disciplina);
        const idserie = findSerieId(serie);
        const idtema = tema ? findTemaId(tema) : '';
        const professorId = professor ? findProfessorId(professor) : (currentUserId || '');

        if (!idmat || !idserie || (tema && !idtema) || !professorId) {
          errors.push(`Linha ${lineIndex}: Disciplina, série, tema ou professor inválido.`);
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
        showToast(`${successCount} questões importadas com sucesso!`, 'success');
        await fetchInitialData();
        if (errors.length === 0) {
          setIsImportModalOpen(false);
        }
      } else {
        showToast('Nenhuma questão importada. Verifique os erros.', 'error');
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
      showToast('Correção atualizada com sucesso!', 'success');
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
          showToast('Correção salva sem nota.', 'success');
          closeCorrection();
          return;
        } catch (retryErr) {
          console.error('Erro ao salvar correção:', retryErr);
        }
      }
      console.error('Erro ao salvar correção:', error);
      showToast('Erro ao salvar correção.', 'error');
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
          showToast('Usuário não identificado.', 'error');
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
            showToast('Não foi possível obter a URL da imagem.', 'error');
            return;
          }
          insertImageIntoQuill(quill, publicUrl.publicUrl);
        } catch (uploadError) {
          console.error('Erro ao enviar imagem:', uploadError);
          showToast('Erro ao enviar imagem.', 'error');
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

  const materiaName = (id: string) => materias.find(m => m.id === id)?.materia || '—';
  const serieName = (id: string) => series.find(s => s.id === id)?.serie || '—';
  const temaName = (id?: string | null) => temas.find(t => t.id === id)?.nometema || '—';
  const professorName = (id: string) => {
    const prof = professores.find(p => p.id === id);
    return prof ? capitalizeWords(`${prof.nome} ${prof.sobrenome || ''}`.trim()) : '—';
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

          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Questões Dissertativas</h1>

          <div className="flex gap-3">
            {isStaff && (
              <>
                <Button onClick={() => setIsImportModalOpen(true)} className="bg-white text-[#4318FF] border border-[#4318FF] hover:bg-gray-50">
                  <Upload size={18} className="mr-2" />
                  Importação em Massa
                </Button>
                <Button onClick={openModal} className="bg-[#4318FF] hover:bg-[#3311CC]">
                  <FileText size={18} className="mr-2" />
                  Nova Questão
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <h2 className="text-2xl font-bold mb-2">Gerenciamento de Questões Dissertativas</h2>
              <p className="text-gray-500">Cadastre, importe e acompanhe envios dos alunos.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1B2559]">Banco de Questões</h3>
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
                    <option value="">Todas Séries</option>
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
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Disciplina</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Série</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Tema</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Professor</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Enunciado</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <Spinner size="md" />
                        </td>
                      </tr>
                    ) : filteredQuestoes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          Nenhuma questão encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestoes.map(questao => (
                        <tr key={questao.id} className="hover:bg-gray-50/50 transition-colors">
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
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Questão</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Tipo</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Enviado em</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Nota</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Status</th>
                      <th className="py-4 px-4 text-sm font-bold text-[#A3AED0] uppercase tracking-wider text-right">Ações</th>
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
                              {envio.enviado_em ? format(new Date(envio.enviado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {envio.nota !== null && envio.nota !== undefined ? envio.nota : '—'}
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={currentQuestao ? 'Editar Questão' : 'Nova Questão'}
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
              placeholder="Descreva passo a passo, com LaTeX se necessário"
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Série/Ano *</label>
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
              <label className="text-sm font-medium text-gray-700">Tema/Conteúdo</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Professor responsável *</label>
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
                <p className="text-sm font-bold text-gray-500 mb-2">Prévia do Enunciado</p>
                <MathContent html={formData.enunciado} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-bold text-gray-500 mb-2">Prévia da Resposta Esperada</p>
                <MathContent html={formData.resposta_esperada} />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeModal} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]" isLoading={saving}>
              {currentQuestao ? 'Salvar Alterações' : 'Salvar Questão'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importação em Massa"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-2">Formatos aceitos</p>
            <p className="mb-2">TXT (uma questão por linha):</p>
            <p className="font-mono text-xs bg-white/50 p-2 rounded border border-blue-200">
              enunciado | resposta_esperada | disciplina | serie | tema(opcional) | professor(opcional)
            </p>
            <p className="mt-3 mb-2">CSV com cabeçalhos:</p>
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
                <span className="font-bold text-gray-800">Resultado da Importação</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Sucessos: <span className="font-bold text-green-600">{importLog.success}</span> | Falhas: <span className="font-bold text-red-600">{importLog.errors.length}</span>
              </p>
              {importLog.errors.length > 0 && (
                <div className="mt-3 bg-white rounded-lg border border-orange-200 p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {importLog.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-600 flex gap-2">
                        <span className="font-mono">•</span>
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
              Importar Questões
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={closeCorrection}
        title="Correção da Questão"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {currentEnvio ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-500 mb-2">Questão</p>
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
              <label className="text-sm font-medium text-gray-700">Comentário do professor</label>
              <textarea
                value={correctionForm.comentario_professor}
                onChange={(e) => setCorrectionForm(prev => ({ ...prev, comentario_professor: e.target.value }))}
                className="w-full min-h-[120px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                placeholder="Escreva seus comentários..."
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
                Salvar Correção
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita."
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
