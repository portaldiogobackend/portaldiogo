import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import type { ToastType } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ClipboardList, Filter, Menu, Pencil, Search, Send, Trash2, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';
import { StudentSidebar } from '../components/layout/StudentSidebar';

type ListaStatus = 'rascunho' | 'publicada';

interface ListaExercicio {
  id: string;
  nome: string;
  descricao?: string | null;
  status: ListaStatus | string;
  created_at: string;
  created_by?: string | null;
}

interface ListaItem {
  lista_id: string;
  teste_id: string;
}

interface EnvioLista {
  id: string;
  lista_id: string;
  aluno_id: string;
  enviado_em: string;
}

interface Materia {
  id: string;
  materia: string;
}

interface Tema {
  id: string;
  nometema: string;
  idmat?: string[];
}

interface Teste {
  id: string;
  pergunta: string;
  alternativa?: string;
  justificativa?: string;
  idmat: string[];
  idtema: string[];
  created_at: string;
}

interface Aluno {
  id: string;
  nome: string;
  sobrenome?: string | null;
  serie?: string | null;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export const ListasExercicios: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Usuário');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [listas, setListas] = useState<ListaExercicio[]>([]);
  const [listaItensMap, setListaItensMap] = useState<Record<string, string[]>>({});
  const [envios, setEnvios] = useState<EnvioLista[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [testesMap, setTestesMap] = useState<Record<string, Teste>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListaStatus | ''>('');

  const [exerciseMateria, setExerciseMateria] = useState('');
  const [exerciseTema, setExerciseTema] = useState('');
  const [exerciseContent, setExerciseContent] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [currentLista, setCurrentLista] = useState<ListaExercicio | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'rascunho' as ListaStatus,
    exercicios: [] as string[]
  });
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [expandedListaId, setExpandedListaId] = useState<string | null>(null);

  const isStaff = userRole === 'admin' || userRole === 'professor';
  const isStudent = userRole === 'aluno';

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchStaffData = async () => {
    const { data: listasData, error: listasError } = await supabase
      .from('tbf_listas_exercicios')
      .select('*')
      .order('created_at', { ascending: false });

    if (listasError) throw listasError;
    setListas((listasData as ListaExercicio[]) || []);

    const { data: itensData } = await supabase
      .from('tbf_lista_exercicios_itens')
      .select('lista_id, teste_id');

    const itensMap = (itensData as ListaItem[] | null | undefined)?.reduce((acc, item) => {
      if (!acc[item.lista_id]) acc[item.lista_id] = [];
      acc[item.lista_id].push(item.teste_id);
      return acc;
    }, {} as Record<string, string[]>) || {};
    setListaItensMap(itensMap);

    const { data: enviosData } = await supabase
      .from('tbf_lista_exercicios_envios')
      .select('*')
      .order('enviado_em', { ascending: false });
    setEnvios((enviosData as EnvioLista[]) || []);

    const { data: materiasData } = await supabase
      .from('tbf_materias')
      .select('id, materia')
      .order('materia');
    setMaterias((materiasData as Materia[]) || []);

    const { data: temasData } = await supabase
      .from('tbf_temas')
      .select('id, nometema, idmat')
      .order('nometema');
    setTemas((temasData as Tema[]) || []);

    const { data: testesData } = await supabase
      .from('tbf_testes')
      .select('id, pergunta, alternativa, justificativa, idmat, idtema, created_at')
      .order('created_at', { ascending: false });
    const parsedTestes = (testesData as Teste[]) || [];
    setTestes(parsedTestes);
    const nextMap = parsedTestes.reduce((acc, teste) => {
      acc[teste.id] = teste;
      return acc;
    }, {} as Record<string, Teste>);
    setTestesMap(nextMap);

    const { data: alunosData } = await supabase
      .from('tbf_controle_user')
      .select('id, nome, sobrenome, serie')
      .eq('role', 'aluno')
      .order('nome');
    setAlunos((alunosData as Aluno[]) || []);
  };

  const fetchStudentData = async (userId: string) => {
    const { data: enviosData } = await supabase
      .from('tbf_lista_exercicios_envios')
      .select('*')
      .eq('aluno_id', userId)
      .order('enviado_em', { ascending: false });
    const enviosList = (enviosData as EnvioLista[]) || [];
    setEnvios(enviosList);

    const listaIds = enviosList.map(envio => envio.lista_id);
    if (listaIds.length === 0) {
      setListas([]);
      setListaItensMap({});
      setTestesMap({});
      return;
    }

    const { data: listasData } = await supabase
      .from('tbf_listas_exercicios')
      .select('*')
      .in('id', listaIds)
      .order('created_at', { ascending: false });
    setListas((listasData as ListaExercicio[]) || []);

    const { data: itensData } = await supabase
      .from('tbf_lista_exercicios_itens')
      .select('lista_id, teste_id')
      .in('lista_id', listaIds);
    const itensMap = (itensData as ListaItem[] | null | undefined)?.reduce((acc, item) => {
      if (!acc[item.lista_id]) acc[item.lista_id] = [];
      acc[item.lista_id].push(item.teste_id);
      return acc;
    }, {} as Record<string, string[]>) || {};
    setListaItensMap(itensMap);

    const allTesteIds = Object.values(itensMap).flat();
    if (allTesteIds.length > 0) {
      const { data: testesData } = await supabase
        .from('tbf_testes')
        .select('id, pergunta, alternativa, justificativa, idmat, idtema, created_at')
        .in('id', allTesteIds);
      const parsedTestes = (testesData as Teste[]) || [];
      const nextMap = parsedTestes.reduce((acc, teste) => {
        acc[teste.id] = teste;
        return acc;
      }, {} as Record<string, Teste>);
      setTestesMap(nextMap);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('id, nome, role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData?.nome) {
        setUserName(capitalizeWords(userData.nome.split(' ')[0]));
      }
      setUserRole(userData?.role || null);

      if (userData?.role === 'aluno') {
        if (location.pathname === '/listas-exercicios') {
          navigate('/aluno/listas-exercicios', { replace: true });
        }
        await fetchStudentData(user.id);
        return;
      }

      if (location.pathname.startsWith('/aluno')) {
        navigate('/listas-exercicios', { replace: true });
      }

      await fetchStaffData();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar listas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const envioInfoByListaId = useMemo(() => {
    const map: Record<string, EnvioLista> = {};
    envios.forEach(envio => {
      if (!map[envio.lista_id]) {
        map[envio.lista_id] = envio;
      }
    });
    return map;
  }, [envios]);

  const alunosMap = useMemo(() => {
    return alunos.reduce((acc, aluno) => {
      acc[aluno.id] = capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim());
      return acc;
    }, {} as Record<string, string>);
  }, [alunos]);

  const filteredListas = useMemo(() => {
    return listas.filter(lista => {
      const matchesSearch = lista.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? lista.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [listas, searchTerm, statusFilter]);

  const filteredTestes = useMemo(() => {
    return testes.filter(teste => {
      const matchesMateria = exerciseMateria ? teste.idmat?.includes(exerciseMateria) : true;
      const matchesTema = exerciseTema ? teste.idtema?.includes(exerciseTema) : true;
      const textoBase = `${stripHtml(teste.pergunta)} ${teste.alternativa || ''} ${teste.justificativa || ''}`.toLowerCase();
      const matchesConteudo = exerciseContent ? textoBase.includes(exerciseContent.toLowerCase()) : true;
      return matchesMateria && matchesTema && matchesConteudo;
    });
  }, [testes, exerciseMateria, exerciseTema, exerciseContent]);

  const openCreateModal = () => {
    setCurrentLista(null);
    setFormData({
      nome: '',
      descricao: '',
      status: 'rascunho',
      exercicios: []
    });
    setExerciseMateria('');
    setExerciseTema('');
    setExerciseContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (lista: ListaExercicio) => {
    setCurrentLista(lista);
    setFormData({
      nome: lista.nome,
      descricao: lista.descricao || '',
      status: (lista.status as ListaStatus) || 'rascunho',
      exercicios: listaItensMap[lista.id] || []
    });
    setExerciseMateria('');
    setExerciseTema('');
    setExerciseContent('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (lista: ListaExercicio) => {
    setCurrentLista(lista);
    setIsDeleteModalOpen(true);
  };

  const openSendModal = (lista: ListaExercicio) => {
    setCurrentLista(lista);
    setSelectedAlunoId('');
    setIsSendModalOpen(true);
  };

  const toggleExercise = (id: string) => {
    setFormData(prev => {
      const exists = prev.exercicios.includes(id);
      return {
        ...prev,
        exercicios: exists ? prev.exercicios.filter(item => item !== id) : [...prev.exercicios, id]
      };
    });
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      showToast('Informe o nome da lista.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (currentLista) {
        const { error } = await supabase
          .from('tbf_listas_exercicios')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            status: formData.status
          })
          .eq('id', currentLista.id);
        if (error) throw error;

        await supabase.from('tbf_lista_exercicios_itens').delete().eq('lista_id', currentLista.id);

        if (formData.exercicios.length > 0) {
          const payload = formData.exercicios.map(testeId => ({
            lista_id: currentLista.id,
            teste_id: testeId
          }));
          const { error: itemsError } = await supabase
            .from('tbf_lista_exercicios_itens')
            .insert(payload);
          if (itemsError) throw itemsError;
        }

        setListas(prev => prev.map(lista => (lista.id === currentLista.id ? { ...lista, nome: formData.nome.trim(), descricao: formData.descricao.trim() || null, status: formData.status } : lista)));
        setListaItensMap(prev => ({ ...prev, [currentLista.id]: formData.exercicios }));
        showToast('Lista atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('tbf_listas_exercicios')
          .insert([{
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            status: formData.status
          }])
          .select()
          .single();
        if (error) throw error;

        if (formData.exercicios.length > 0) {
          const payload = formData.exercicios.map(testeId => ({
            lista_id: data.id,
            teste_id: testeId
          }));
          const { error: itemsError } = await supabase
            .from('tbf_lista_exercicios_itens')
            .insert(payload);
          if (itemsError) throw itemsError;
        }

        setListas(prev => [data, ...prev]);
        setListaItensMap(prev => ({ ...prev, [data.id]: formData.exercicios }));
        showToast('Lista criada com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setCurrentLista(null);
    } catch (error) {
      console.error('Erro ao salvar lista:', error);
      showToast('Erro ao salvar lista.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentLista) return;
    setSaving(true);
    try {
      await supabase.from('tbf_lista_exercicios_envios').delete().eq('lista_id', currentLista.id);
      await supabase.from('tbf_lista_exercicios_itens').delete().eq('lista_id', currentLista.id);
      const { error } = await supabase.from('tbf_listas_exercicios').delete().eq('id', currentLista.id);
      if (error) throw error;

      setListas(prev => prev.filter(lista => lista.id !== currentLista.id));
      setListaItensMap(prev => {
        const next = { ...prev };
        delete next[currentLista.id];
        return next;
      });
      setEnvios(prev => prev.filter(envio => envio.lista_id !== currentLista.id));
      showToast('Lista excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      showToast('Erro ao excluir lista.', 'error');
    } finally {
      setSaving(false);
      setIsDeleteModalOpen(false);
      setCurrentLista(null);
    }
  };

  const handleSend = async () => {
    if (!currentLista || !selectedAlunoId) {
      showToast('Selecione um aluno para envio.', 'error');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('tbf_lista_exercicios_envios')
        .insert([{
          lista_id: currentLista.id,
          aluno_id: selectedAlunoId,
          enviado_em: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from('tbf_listas_exercicios')
        .update({ status: 'publicada' })
        .eq('id', currentLista.id);

      setEnvios(prev => [data, ...prev]);
      setListas(prev => prev.map(lista => (lista.id === currentLista.id ? { ...lista, status: 'publicada' } : lista)));
      showToast('Lista enviada com sucesso!', 'success');
      setIsSendModalOpen(false);
      setCurrentLista(null);
    } catch (error) {
      console.error('Erro ao enviar lista:', error);
      showToast('Erro ao enviar lista.', 'error');
    } finally {
      setSending(false);
    }
  };

  const renderExerciseList = (listaId: string) => {
    const items = listaItensMap[listaId] || [];
    if (items.length === 0) {
      return <p className="text-sm text-gray-400">Nenhum exercício vinculado.</p>;
    }

    return (
      <div className="space-y-3">
        {items.map(itemId => {
          const teste = testesMap[itemId];
          if (!teste) return null;
          return (
            <div key={itemId} className="p-3 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-sm font-semibold text-[#1B2559]">{stripHtml(teste.pergunta)}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const LayoutSidebar = isStudent ? StudentSidebar : Sidebar;

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
            {!isStudent && (
              <button
                onClick={() => navigate('/setup-inicial')}
                className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="hidden md:inline">Voltar ao Dashboard</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Listas de Exercícios</h1>
            {isStaff && (
              <Button onClick={openCreateModal} className="bg-[#4318FF] hover:bg-[#3311CC]">
                <ClipboardList size={18} className="mr-2" />
                Criar Lista
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {!loading && (
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Perfil ativo</p>
                  <p className="text-lg font-bold text-[#1B2559]">{userName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Role</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userRole === 'admin' || userRole === 'professor'
                      ? 'bg-green-50 text-green-600'
                      : userRole === 'aluno'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {userRole || 'indefinido'}
                  </span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : isStudent ? (
              <div className="space-y-4">
                {listas.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-gray-200/40">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma lista enviada</h3>
                    <p className="text-gray-400">As listas enviadas aparecerão aqui.</p>
                  </div>
                ) : (
                  listas.map(lista => {
                    const envio = envioInfoByListaId[lista.id];
                    const isExpanded = expandedListaId === lista.id;
                    return (
                      <div key={lista.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-[#1B2559]">{lista.nome}</h3>
                            {lista.descricao && (
                              <p className="text-sm text-gray-500 mt-1">{lista.descricao}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-3">
                              <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                                Enviada em {envio ? format(new Date(envio.enviado_em), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : '---'}
                              </span>
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                                {listaItensMap[lista.id]?.length || 0} exercícios
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setExpandedListaId(isExpanded ? null : lista.id)}
                          >
                            {isExpanded ? 'Ocultar exercícios' : 'Ver exercícios'}
                          </Button>
                        </div>
                        {isExpanded && (
                          <div className="mt-6">
                            {renderExerciseList(lista.id)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : !isStaff ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl shadow-xl shadow-gray-200/40">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-300">
                  <XCircle size={32} />
                </div>
                <p className="text-[#1B2559] font-bold">Acesso Restrito</p>
                <p className="text-[#A3AED0] font-medium">Apenas administradores e professores podem gerenciar listas.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative w-full md:max-w-xs">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar lista..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as ListaStatus | '')}
                          className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-[#4318FF] focus:border-transparent cursor-pointer min-w-[160px]"
                        >
                          <option value="">Todos Status</option>
                          <option value="rascunho">Rascunho</option>
                          <option value="publicada">Publicada</option>
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#1B2559]">Listas cadastradas</h2>
                    <p className="text-sm text-gray-500 mt-1">Gerencie criação, envio e publicação de listas.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Lista</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Criada em</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Exercícios</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Envio</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListas.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                              Nenhuma lista encontrada.
                            </td>
                          </tr>
                        ) : (
                          filteredListas.map(lista => {
                            const envio = envioInfoByListaId[lista.id];
                            const alunoNome = envio ? alunosMap[envio.aluno_id] : '';
                            const countExercicios = listaItensMap[lista.id]?.length || 0;
                            return (
                              <tr key={lista.id} className="border-b border-gray-50">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-[#1B2559]">{lista.nome}</div>
                                  {lista.descricao && (
                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">{lista.descricao}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    lista.status === 'publicada' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                  }`}>
                                    {lista.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {format(new Date(lista.created_at), "dd 'de' MMMM", { locale: ptBR })}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {countExercicios} exercícios
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {envio ? (
                                    <div className="space-y-1">
                                      <span className="text-green-600 font-semibold text-xs">Enviada</span>
                                      <div className="text-xs text-gray-400">
                                        {alunoNome || 'Aluno'} · {format(new Date(envio.enviado_em), "dd/MM 'às' HH:mm")}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 font-semibold">Não enviada</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditModal(lista)}
                                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil size={18} />
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(lista)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                    <button
                                      onClick={() => openSendModal(lista)}
                                      className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                      title="Enviar"
                                    >
                                      <Send size={18} />
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
              </>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentLista ? 'Editar Lista' : 'Criar Nova Lista'}
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome da lista *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome da lista..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ListaStatus }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicada">Publicada</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
                placeholder="Descrição opcional..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
              />
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
              <h3 className="font-semibold text-[#1B2559]">Vincular exercícios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Matéria</label>
                  <select
                    value={exerciseMateria}
                    onChange={(e) => setExerciseMateria(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  >
                    <option value="">Todas</option>
                    {materias.map(materia => (
                      <option key={materia.id} value={materia.id}>{materia.materia}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tema</label>
                  <select
                    value={exerciseTema}
                    onChange={(e) => setExerciseTema(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  >
                    <option value="">Todos</option>
                    {temas.map(tema => (
                      <option key={tema.id} value={tema.id}>{tema.nometema}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Conteúdo</label>
                  <input
                    type="text"
                    value={exerciseContent}
                    onChange={(e) => setExerciseContent(e.target.value)}
                    placeholder="Buscar conteúdo..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1B2559]">Exercícios disponíveis</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredTestes.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum exercício encontrado.</p>
                    ) : (
                      filteredTestes.map(teste => {
                        const selected = formData.exercicios.includes(teste.id);
                        return (
                          <button
                            key={teste.id}
                            type="button"
                            onClick={() => toggleExercise(teste.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${
                              selected ? 'border-[#4318FF] bg-[#4318FF]/10' : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <p className="text-sm font-semibold text-[#1B2559] line-clamp-1">{stripHtml(teste.pergunta)}</p>
                            <span className="text-xs text-gray-400">{selected ? 'Selecionado' : 'Adicionar'}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1B2559]">Exercícios vinculados</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {formData.exercicios.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum exercício vinculado.</p>
                    ) : (
                      formData.exercicios.map(testeId => {
                        const teste = testesMap[testeId];
                        if (!teste) return null;
                        return (
                          <div key={testeId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                            <p className="text-sm font-semibold text-[#1B2559] line-clamp-1">{stripHtml(teste.pergunta)}</p>
                            <button
                              type="button"
                              onClick={() => toggleExercise(testeId)}
                              className="text-red-500 hover:bg-red-50 rounded-lg p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]" isLoading={saving}>
                {currentLista ? 'Salvar Alterações' : 'Salvar Lista'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Enviar Lista"
        className="max-w-lg"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aluno destinatário</label>
            <select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
            >
              <option value="">Selecione um aluno</option>
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>
                  {capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsSendModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSend} className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]" isLoading={sending}>
              Enviar Lista
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Lista"
        message="Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita."
        loading={saving}
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

export default ListasExercicios;
