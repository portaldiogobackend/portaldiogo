import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StudentSidebar } from '../components/layout/StudentSidebar';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import type { ToastType } from '@/components/ui/Toast';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { validateDoubtSubmission } from '@/lib/validation';
import { 
  Plus, 
  ChevronLeft, 
  Menu,
  CheckCircle2,
  Clock,
  HelpCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Materia {
  id: string;
  materia: string;
}

interface Duvida {
  id: string;
  idmateria: string;
  materiaName?: string;
  pergunta: string;
  resposta?: string;
  created_at: string;
  respondido: boolean;
}

export const CentralDuvidas: React.FC = () => {
  const navigate = useNavigate();
  
  // Layout States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Aluno');
  const [loading, setLoading] = useState(true);

  // Data States
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [duvidaToDelete, setDuvidaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDuvida, setEditingDuvida] = useState<Duvida | null>(null);

  // Notification State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  // Debug: Monitor state changes for problematic values
  useEffect(() => {
    if (userId === 'undefined') {
      console.error('CRITICAL: userId was set to string "undefined"');
    }
    if (selectedMateria === 'undefined') {
      console.error('CRITICAL: selectedMateria was set to string "undefined"');
    }
  }, [userId, selectedMateria]);

  const fetchDuvidas = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tbf_duvidas')
        .select('*')
        .eq('idaluno', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedDuvidas = ((data || []) as Duvida[]).map(d => ({
        ...d,
        materiaName: 'Carregando...',
        respondido: !!d.resposta && d.resposta.trim() !== ''
      }));

      setDuvidas(enrichedDuvidas);
    } catch (error) {
      console.error('Error fetching duvidas:', error);
    }
  }, []);

  const checkUserAndFetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      // Verify Role and Get User Data
      const { data: userData, error: userError } = await supabase
        .from('tbf_controle_user')
        .select('nome, role, materias')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        navigate('/');
        return;
      }

      if (userData.role !== 'aluno') {
        showToast('Acesso permitido apenas para alunos.', 'error');
        navigate('/');
        return;
      }

      setUserName(userData.nome.split(' ')[0]);

      // Fetch Materias names based on IDs in userData.materias
      if (userData.materias && userData.materias.length > 0) {
        const { data: materiasData, error: materiasError } = await supabase
          .from('tbf_materias')
          .select('id, materia')
          .in('id', userData.materias);

        if (materiasError) {
          console.error('Error fetching materias:', materiasError);
        } else {
          setMaterias(materiasData || []);
        }
      }

      // Fetch existing doubts
      await fetchDuvidas(user.id);

    } catch (error) {
      console.error('Error in initial load:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchDuvidas, navigate, showToast]);

  useEffect(() => {
    checkUserAndFetchData();
  }, [checkUserAndFetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log initial state for debugging
    console.log('Iniciando submissão de dúvida:', {
      userId,
      selectedMateria,
      pergunta: pergunta.trim(),
      isEditing: !!editingDuvida,
      editingId: editingDuvida?.id
    });

    // Validation using external utility
    const validation = validateDoubtSubmission({
      userId,
      selectedMateria,
      pergunta: pergunta.trim(),
      editingId: editingDuvida?.id
    });

    if (!validation.valid) {
      showToast(validation.message || 'Dados inválidos.', 'error');
      console.error('Erro de validação (v2):', {
        message: validation.message,
        userId,
        selectedMateria,
        editingId: editingDuvida?.id
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingDuvida) {
        // Update existing doubt
        const { error } = await supabase
          .from('tbf_duvidas')
          .update({
            idmateria: selectedMateria,
            pergunta: pergunta.trim()
          })
          .eq('id', editingDuvida.id)
          .eq('idaluno', userId);

        if (error) throw error;
        showToast('Dúvida atualizada com sucesso!', 'success');
      } else {
        // Create new doubt
        const { error } = await supabase
          .from('tbf_duvidas')
          .insert([{
            idaluno: userId,
            idmateria: selectedMateria,
            pergunta: pergunta.trim(),
            resposta: null
          }]);

        if (error) throw error;
        showToast('Dúvida enviada com sucesso!', 'success');
      }

      closeModal();
      fetchDuvidas(userId as string);

    } catch (error) {
      const errorInfo = typeof error === 'object' && error !== null
        ? (error as { message?: string; code?: string; details?: string; hint?: string })
        : {};
      console.error('Error saving doubt details:', {
        message: errorInfo.message,
        code: errorInfo.code,
        details: errorInfo.details,
        hint: errorInfo.hint,
        context: editingDuvida ? 'update' : 'insert'
      });
      
      const errorMessage = errorInfo.code === '22P02' 
        ? 'Erro de formato nos dados. Por favor, contate o suporte.' 
        : 'Erro ao salvar dúvida. Tente novamente.';
        
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (duvida?: Duvida) => {
    // Check if duvida is a valid object and not a synthetic event (which has 'nativeEvent')
    // or if it's strictly the Duvida type we expect
    const isValidDuvida = duvida && 'id' in duvida && 'idmateria' in duvida;

    if (isValidDuvida) {
      setEditingDuvida(duvida);
      setSelectedMateria(duvida.idmateria);
      setPergunta(duvida.pergunta);
    } else {
      setEditingDuvida(null);
      setSelectedMateria('');
      setPergunta('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDuvida(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteClick = (id: string) => {
    setDuvidaToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!duvidaToDelete || !userId || userId === 'undefined') {
      showToast('Erro: Identificadores inválidos para exclusão.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tbf_duvidas')
        .delete()
        .eq('id', duvidaToDelete)
        .eq('idaluno', userId);

      if (error) throw error;
      
      showToast('Dúvida excluída com sucesso!', 'success');
      if (userId) fetchDuvidas(userId as string);
      setIsDeleteModalOpen(false);
      setDuvidaToDelete(null);
    } catch (error) {
      console.error('Error deleting doubt:', error);
      showToast('Erro ao excluir dúvida. Tente novamente.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getMateriaName = (id: string) => {
    const mat = materias.find(m => m.id === id);
    return mat ? mat.materia : 'Matéria desconhecida';
  };

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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Dúvida"
        message="Tem certeza que deseja excluir esta dúvida? Esta ação não pode ser desfeita."
        loading={isDeleting}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal Nova Dúvida */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDuvida ? "Editar Dúvida" : "Envie sua Dúvida"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-[#1B2559] block mb-2">Matéria</label>
            <select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none appearance-none"
            >
              <option value="">Selecione a matéria...</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.materia}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-bold text-[#1B2559] block mb-2">Sua Pergunta</label>
            <textarea
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              required
              rows={5}
              placeholder="Descreva sua dúvida com detalhes..."
              className="w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setSelectedMateria('');
                setPergunta('');
              }}
            >
              Limpar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingDuvida ? "Salvar Alterações" : "Enviar Dúvida"}
            </Button>
          </div>
        </form>
      </Modal>

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
              <span className="hidden md:inline">Voltar</span>
            </button>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Central de Dúvidas</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2559]">Minhas Dúvidas</h2>
                <p className="text-[#A3AED0]">Acompanhe suas perguntas e respostas</p>
              </div>
              <Button onClick={() => openModal()} variant="primary">
                <Plus size={20} className="mr-2" />
                Nova Dúvida
              </Button>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[#A3AED0] text-sm border-b border-gray-50 uppercase tracking-wider">
                      <th className="px-8 py-6 font-semibold w-48">Matéria</th>
                      <th className="px-8 py-6 font-semibold">Pergunta / Resposta</th>
                      <th className="px-8 py-6 font-semibold w-40 text-center">Status</th>
                      <th className="px-8 py-6 font-semibold w-48 text-right">Data</th>
                      <th className="px-8 py-6 font-semibold w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                       <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <Spinner size="lg" />
                        </td>
                      </tr>
                    ) : duvidas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-[#A3AED0]">
                          <div className="flex flex-col items-center gap-3">
                            <HelpCircle size={48} className="opacity-20" />
                            <p>Você ainda não enviou nenhuma dúvida.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      duvidas.map((duvida) => (
                        <tr key={duvida.id} className="hover:bg-[#F4F7FE]/50 transition-colors group">
                          <td className="px-8 py-5 align-top">
                            <span className="text-[#0061FF] font-bold bg-blue-50 px-3 py-1 rounded-lg text-sm inline-block">
                              {getMateriaName(duvida.idmateria)}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-3">
                              <p className="text-[#1B2559] font-medium text-base">{duvida.pergunta}</p>
                              {duvida.resposta && (
                                <div className="bg-[#F4F7FE] p-4 rounded-xl border-l-4 border-[#05CD99]">
                                  <p className="text-xs font-bold text-[#05CD99] mb-1 uppercase tracking-wider">Resposta do Professor</p>
                                  <p className="text-[#2B3674] text-sm leading-relaxed">{duvida.resposta}</p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center align-top">
                            {duvida.respondido ? (
                              <div className="flex flex-col items-center gap-1 text-[#05CD99]">
                                <CheckCircle2 size={20} />
                                <span className="text-xs font-bold">Respondido</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-[#FFB547]">
                                <Clock size={20} />
                                <span className="text-xs font-bold">Aguardando</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right align-top">
                            <span className="text-[#A3AED0] text-sm font-medium">
                              {format(new Date(duvida.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center align-top">
                             <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => openModal(duvida)}
                                    className="p-2 rounded-lg text-[#422AFB] hover:bg-[#422AFB]/10 transition-colors"
                                    title="Editar Dúvida"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(duvida.id)}
                                    className="p-2 rounded-lg text-[#EE5D50] hover:bg-[#EE5D50]/10 transition-colors"
                                    title="Excluir Dúvida"
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

          </div>
        </main>
      </div>
    </div>
  );
};
