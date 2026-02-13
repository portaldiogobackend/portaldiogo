import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import type { ToastType } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, ChevronLeft, Clock, Menu, Send, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { Sidebar } from '../components/layout/Sidebar';

interface Duvida {
  id: string;
  idaluno: string;
  idmateria: string;
  pergunta: string;
  resposta: string | null;
  created_at: string;
  materia_nome?: string;
  aluno_nome?: string;
  aluno_serie?: string;
}

type UserWithSerie = {
  id: string;
  nome: string;
  sobrenome?: string | null;
  tbf_serie?: { serie: string | null } | { serie: string | null }[] | null;
};

export const CentralDuvidasAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringDuvida, setAnsweringDuvida] = useState<Duvida | null>(null);
  const [respostaText, setRespostaText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Layout States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>('Admin');
  const [userRole, setUserRole] = useState<string | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('tbf_controle_user')
          .select('nome, role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setUserName(capitalizeWords(data.nome.split(' ')[0]));
          setUserRole(data.role);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDuvidas = async () => {
    setLoading(true);
    try {
      // Fetch doubts
      const { data: duvidasData, error: duvidasError } = await supabase
        .from('tbf_duvidas')
        .select('*')
        .order('created_at', { ascending: false });

      if (duvidasError) throw duvidasError;

      // Fetch materias and users manually for now to ensure we get names
      const { data: materiasData } = await supabase.from('tbf_materias').select('id, materia');
      const { data: usersData } = await supabase.from('tbf_controle_user').select('id, nome, sobrenome, serie, tbf_serie(serie)');
      
      const materiasMap = new Map(materiasData?.map(m => [m.id, m.materia]));
      const usersMap = new Map((usersData as UserWithSerie[] | null | undefined)?.map(u => {
        const serieValue = Array.isArray(u.tbf_serie) ? u.tbf_serie[0]?.serie : u.tbf_serie?.serie;
        return [u.id, { 
          nome: capitalizeWords(`${u.nome} ${u.sobrenome || ''}`.trim()), 
          serie: serieValue || '' 
        }];
      }) || []);

      const formattedDuvidas = duvidasData.map(d => {
        const user = usersMap.get(d.idaluno);
        return {
          ...d,
          materia_nome: materiasMap.get(d.idmateria) || 'Matéria Desconhecida',
          aluno_nome: user?.nome || 'Aluno',
          aluno_serie: user?.serie || ''
        };
      });

      setDuvidas(formattedDuvidas);
    } catch (error) {
      console.error('Error fetching doubts:', error);
      showToast('Erro ao carregar dúvidas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchDuvidas();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleOpenAnswer = (duvida: Duvida) => {
    setAnsweringDuvida(duvida);
    setRespostaText(duvida.resposta || '');
  };

  const handleCloseModal = () => {
    setAnsweringDuvida(null);
    setRespostaText('');
  };

  const handleSendAnswer = async () => {
    if (!answeringDuvida) return;
    if (!respostaText.trim()) {
      showToast('A resposta não pode estar vazia.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tbf_duvidas')
        .update({ resposta: respostaText })
        .eq('id', answeringDuvida.id);

      if (error) throw error;

      showToast('Resposta enviada com sucesso!', 'success');
      handleCloseModal();
      fetchDuvidas(); // Refresh list
    } catch (error) {
      console.error('Error sending answer:', error);
      showToast('Erro ao enviar resposta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#2B3674]">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userName={userName}
        loading={false}
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
              <span className="hidden md:inline">Voltar</span>
            </button>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">
            Central de Dúvidas
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : userRole && userRole !== 'admin' ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-300">
                    <Shield size={32} />
                  </div>
                  <p className="text-[#1B2559] font-bold">Acesso Restrito</p>
                  <p className="text-[#A3AED0] font-medium">Apenas administradores podem visualizar esta página.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {duvidas.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-white rounded-2xl p-8 shadow-sm">
                    Nenhuma dúvida encontrada.
                  </div>
                ) : (
                  duvidas.map((duvida) => {
                    const nomeParts = (duvida.aluno_nome || '').split(' ').filter(Boolean);
                    const initials = nomeParts.length > 1
                      ? `${nomeParts[0].charAt(0)}${nomeParts[nomeParts.length - 1].charAt(0)}`
                      : nomeParts[0]?.charAt(0) || '';

                    return (
                      <div 
                        key={duvida.id} 
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-end items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0061FF] to-[#422AFB] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200 uppercase flex-shrink-0">
                                {initials}
                              </div>
                              <span className="font-medium text-gray-700">{duvida.aluno_nome}</span>
                            </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                            <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-700">
                              {duvida.materia_nome}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {format(new Date(duvida.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {duvida.aluno_serie && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-gray-700">{duvida.aluno_serie}</span>
                              </>
                            )}
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-[#2B3674] mb-2">
                              {duvida.pergunta}
                            </h3>
                            {duvida.resposta && (
                              <div className="bg-green-50 p-4 rounded-xl border border-green-100 mt-4">
                                <p className="text-green-800 font-medium text-sm mb-1 flex items-center gap-2">
                                  <CheckCircle size={16} /> Resposta:
                                </p>
                                <p className="text-gray-700">{duvida.resposta}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[150px] items-end justify-start">
                          {duvida.resposta ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium text-sm">
                              <CheckCircle size={16} />
                              Respondido
                            </span>
                          ) : (
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                              <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-medium text-sm mb-2 md:mb-0">
                                <Clock size={16} />
                                Pendente
                              </span>
                              <Button 
                                onClick={() => handleOpenAnswer(duvida)}
                                className="w-full bg-[#4318FF] hover:bg-[#3311CC]"
                              >
                                Responder
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Answer Modal */}
      <Modal
        isOpen={!!answeringDuvida}
        onClose={handleCloseModal}
        title="Responder Dúvida"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Pergunta do Aluno</p>
            <p className="text-gray-800 font-medium">{answeringDuvida?.pergunta}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sua Resposta</label>
            <textarea
              value={respostaText}
              onChange={(e) => setRespostaText(e.target.value)}
              placeholder="Digite a resposta aqui..."
              className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none resize-y transition-all"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendAnswer}
              className="flex-1 bg-[#4318FF] hover:bg-[#3311CC]"
              isLoading={isSubmitting}
            >
              <Send size={18} className="mr-2" />
              Enviar Resposta
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
};
