import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import he from 'he';
import { supabase } from '@/lib/supabase';
import { StudentSidebar } from '../components/layout/StudentSidebar';
import { LogoutModal } from '../components/layout/LogoutModal';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileCheck,
  AlertCircle,
  ChevronLeft,
  Filter,
  Menu
} from 'lucide-react';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

interface Teste {
  id: string;
  pergunta: string;
  alternativa: string;
  resposta: number;
  justificativa?: string;
  created_at: string;
  idmat: string[];
  idtema: string[];
}

interface TesteRealizado {
  idteste: string;
  acerto: boolean;
}

interface Materia {
  id: string;
  materia: string;
}

interface Tema {
  id: string;
  nometema: string;
}

type AttemptInfo = {
  count: number;
  hasCorrect: boolean;
  last: TesteRealizado | null;
};

const MAX_ATTEMPTS = 3;

export const TesteAlunos: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [testes, setTestes] = useState<Teste[]>([]);
  const [testesRealizados, setTestesRealizados] = useState<TesteRealizado[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  
  const [selectedTeste, setSelectedTeste] = useState<Teste | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Filters
  const [filterMateria, setFilterMateria] = useState<string>('');
  const [filterTema, setFilterTema] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const attemptsByTest = useMemo(() => {
    const map = new Map<string, AttemptInfo>();
    for (const attempt of testesRealizados) {
      const existing = map.get(attempt.idteste);
      if (existing) {
        existing.count += 1;
        existing.hasCorrect = existing.hasCorrect || attempt.acerto;
        existing.last = attempt;
      } else {
        map.set(attempt.idteste, { count: 1, hasCorrect: attempt.acerto, last: attempt });
      }
    }
    return map;
  }, [testesRealizados]);

  const getAttemptInfo = (testeId: string): AttemptInfo => {
    return attemptsByTest.get(testeId) || { count: 0, hasCorrect: false, last: null };
  };

  const decodeAndSanitize = (html: string) => {
    if (!html) return '';
    const decoded = he.decode(html);
    return DOMPurify.sanitize(decoded);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get user info
      const { data: userData } = await supabase
        .from('tbf_controle_user')
        .select('nome')
        .eq('id', user.id)
        .single();
      
      if (userData) setUserName(userData.nome.split(' ')[0]);

      // Get Tests assigned to this student
      // Note: We need to filter tests where idalunos array contains user.id
      // Supabase PostgREST syntax for array contains is 'cs' (contains)
      const { data: testesData, error: testesError } = await supabase
        .from('tbf_testes')
        .select('*')
        .contains('idalunos', [user.id])
        .order('created_at', { ascending: false });

      if (testesError) throw testesError;

      // Get Tests already taken by this student
      const { data: provasData, error: provasError } = await supabase
        .from('tbf_prova')
        .select('idteste, acerto')
        .eq('idaluno', user.id);

      if (provasError) throw provasError;

      setTestes(testesData || []);
      setTestesRealizados(provasData || []);

      // Get auxiliary data for display (Materias/Temas)
      const { data: matData } = await supabase.from('tbf_materias').select('id, materia');
      const { data: temaData } = await supabase.from('tbf_temas').select('id, nometema');

      setMaterias(matData || []);
      setTemas(temaData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar testes.');
      setToast({ message: 'Erro ao carregar testes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleStartTest = (teste: Teste) => {
    setSelectedTeste(teste);
    setSelectedOption(null);
    setShowResult(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedTeste || selectedOption === null) return;
    const attemptInfo = getAttemptInfo(selectedTeste.id);
    if (attemptInfo.hasCorrect) {
      setToast({ message: 'Você já acertou esta questão.', type: 'error' });
      return;
    }
    if (attemptInfo.count >= MAX_ATTEMPTS) {
      setToast({ message: 'Tentativas esgotadas para esta questão.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isCorrect = selectedOption === selectedTeste.resposta;

      const { error } = await supabase
        .from('tbf_prova')
        .insert([{
          idaluno: user.id,
          idteste: selectedTeste.id,
          acerto: isCorrect
        }]);

      if (error) throw error;

      setShowResult(true);
      setTestesRealizados(prev => [...prev, { idteste: selectedTeste.id, acerto: isCorrect }]);
      
      if (isCorrect) {
        setToast({ message: 'Resposta correta! Parabéns!', type: 'success' });
      } else {
        setToast({ message: 'Resposta incorreta.', type: 'error' });
      }

    } catch (error) {
      console.error('Error saving answer:', error);
      setToast({ message: 'Erro ao salvar resposta.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getMateriaName = (ids: string[]) => {
    if (!ids || ids.length === 0) return '';
    const found = materias.find(m => ids.includes(m.id));
    return found ? found.materia : '';
  };

  const getTemaName = (ids: string[]) => {
    if (!ids || ids.length === 0) return '';
    const found = temas.find(t => ids.includes(t.id));
    return found ? found.nometema : '';
  };

  const getStatus = (testeId: string) => {
    const attemptInfo = getAttemptInfo(testeId);
    if (attemptInfo.hasCorrect) return 'correct';
    if (attemptInfo.count === 0) return 'pending';
    if (attemptInfo.count >= MAX_ATTEMPTS) return 'incorrect';
    return 'pending';
  };

  const selectedAttemptInfo = selectedTeste ? getAttemptInfo(selectedTeste.id) : null;
  const isAttemptBlocked = selectedAttemptInfo
    ? selectedAttemptInfo.hasCorrect || selectedAttemptInfo.count >= MAX_ATTEMPTS
    : false;

  const filteredTestes = testes.filter(teste => {
    // Filter by Materia
    if (filterMateria && (!teste.idmat || !teste.idmat.includes(filterMateria))) return false;
    
    // Filter by Tema
    if (filterTema && (!teste.idtema || !teste.idtema.includes(filterTema))) return false;
    
    // Filter by Status
    const status = getStatus(teste.id);
    if (filterStatus === 'pending') return status === 'pending';
    if (filterStatus === 'correct') return status === 'correct';
    if (filterStatus === 'incorrect') return status === 'incorrect';
    
    return true;
  });

  const availableTemas = temas.filter(tema => {
    return testes.some(teste => {
      // If a materia is selected, only consider tests of that materia
      if (filterMateria && (!teste.idmat || !teste.idmat.includes(filterMateria))) return false;
      return teste.idtema?.includes(tema.id);
    });
  });

  const getCardFooter = (teste: Teste, attemptInfo: AttemptInfo) => {
    const isDone = attemptInfo.hasCorrect || attemptInfo.count >= MAX_ATTEMPTS;
    if (!isDone) {
      return (
        <button
          onClick={() => handleStartTest(teste)}
          className="px-4 py-2 bg-[#4318FF] text-white text-sm font-bold rounded-lg hover:bg-[#3311CC] transition-colors shadow-md shadow-[#4318FF]/20 group-hover:scale-105 transform duration-200"
        >
          Responder
        </button>
      );
    }

    const correctAnswer = (teste.alternativa || '').split(';')[teste.resposta - 1];
    
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
          Resp: {correctAnswer}
        </span>
        <button
          onClick={() => {
            setSelectedTeste(teste);
            setSelectedOption(attemptInfo.hasCorrect ? teste.resposta : -1); 
            setShowResult(true);
          }}
          className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Ver Detalhes
        </button>
      </div>
    );
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

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-8 flex flex-col md:block">
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <button 
                  onClick={() => setIsMobileOpen(true)}
                  className="md:hidden p-2 text-gray-600 hover:text-[#4318FF] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-2xl font-bold text-[#1B2559] flex items-center gap-2">
                  <FileCheck className="text-[#4318FF]" />
                  Meus Testes
                </h1>
              </div>
              <p className="text-gray-500 mt-1 md:ml-0 ml-12">Responda aos questionários atribuídos a você.</p>
            </div>

            {error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle size={48} className="text-red-500" />
                <p className="text-lg text-gray-700 font-medium text-center">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-[#4318FF] text-white rounded-xl hover:bg-[#3311CC] transition-colors font-bold shadow-lg shadow-[#4318FF]/20"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <>
            {!loading && !selectedTeste && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'correct', label: 'Acertos' },
                    { id: 'incorrect', label: 'Erros' }
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => setFilterStatus(status.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${filterStatus === status.id 
                          ? 'bg-[#4318FF] text-white shadow-lg shadow-[#4318FF]/20' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative group w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#4318FF] transition-colors" size={16} />
                    <select 
                      value={filterMateria} 
                      onChange={e => setFilterMateria(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#4318FF]/20 cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                    >
                      <option value="">Todas as Matérias</option>
                      {materias.map(m => <option key={m.id} value={m.id}>{m.materia}</option>)}
                    </select>
                  </div>

                  <div className="relative group w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#4318FF] transition-colors" size={16} />
                    <select 
                      value={filterTema} 
                      onChange={e => setFilterTema(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#4318FF]/20 cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                    >
                      <option value="">Todos os Temas</option>
                      {availableTemas.map(t => <option key={t.id} value={t.id}>{t.nometema}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : selectedTeste ? (
              // Test View
              <div className="bg-white rounded-3xl p-4 md:p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={() => setSelectedTeste(null)}
                  className="mb-6 text-sm font-bold text-[#A3AED0] hover:text-[#4318FF] flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft size={16} /> Voltar para lista
                </button>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {getMateriaName(selectedTeste.idmat)}
                  </span>
                  {getTemaName(selectedTeste.idtema) && (
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {getTemaName(selectedTeste.idtema)}
                    </span>
                  )}
                </div>
                {selectedAttemptInfo && (
                  <div className="text-xs text-gray-500 mb-6">
                    Tentativas: <span className="font-semibold">{selectedAttemptInfo.count}</span> / {MAX_ATTEMPTS}
                  </div>
                )}

                <div 
                  className="text-lg md:text-xl font-bold text-[#1B2559] mb-8 leading-relaxed break-words [&_img]:max-w-full [&_p]:break-words"
                  dangerouslySetInnerHTML={{ __html: decodeAndSanitize(selectedTeste.pergunta) }}
                />

                <div className="space-y-4 mb-8">
                  {selectedTeste.alternativa.split(';').map((alt, index) => {
                    const optionNum = index + 1;
                    const isSelected = selectedOption === optionNum;
                    const isCorrect = selectedTeste.resposta === optionNum;
                    
                    let className = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ";
                    
                    if (showResult) {
                      if (isCorrect) {
                        className += "border-green-500 bg-green-50 text-green-700 font-medium";
                      } else if (isSelected && !isCorrect) {
                        className += "border-red-500 bg-red-50 text-red-700 font-medium";
                      } else {
                        className += "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                      }
                    } else {
                      if (isSelected) {
                        className += "border-[#4318FF] bg-[#F4F7FE] text-[#4318FF] font-medium shadow-md";
                      } else {
                        className += "border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-600";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => !showResult && setSelectedOption(optionNum)}
                        disabled={showResult}
                        className={className}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
                          ${showResult && isCorrect ? 'border-green-500 bg-green-500 text-white' : 
                            showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                            isSelected ? 'border-[#4318FF] bg-[#4318FF] text-white' : 'border-gray-300 text-gray-400'}`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        {alt}
                        {showResult && isCorrect && <CheckCircle className="ml-auto text-green-600" size={20} />}
                        {showResult && isSelected && !isCorrect && <XCircle className="ml-auto text-red-600" size={20} />}
                      </button>
                    );
                  })}
                </div>

                {showResult && selectedTeste.justificativa && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                    <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Justificativa
                    </h4>
                    <div 
                      className="text-blue-700 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: decodeAndSanitize(selectedTeste.justificativa || '') }}
                    />
                  </div>
                )}

                {!showResult ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null || submitting || isAttemptBlocked}
                    className="w-full md:w-auto px-8 py-4 bg-[#4318FF] text-white font-bold rounded-xl shadow-lg shadow-[#4318FF]/20 hover:bg-[#3311CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Resposta'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedTeste(null)}
                    className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all"
                  >
                    Voltar para Testes
                  </button>
                )}
              </div>
            ) : (
              // Tests List
              <div className="space-y-4">
                {filteredTestes.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-gray-200/40">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileCheck className="text-gray-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      {testes.length === 0 ? 'Tudo em dia!' : 'Nenhum teste encontrado'}
                    </h3>
                    <p className="text-gray-400">
                      {testes.length === 0 ? 'Você não tem testes pendentes no momento.' : 'Tente ajustar os filtros de busca.'}
                    </p>
                  </div>
                ) : (
                  filteredTestes.map(teste => {
                    const attemptInfo = getAttemptInfo(teste.id);
                    const status = getStatus(teste.id);
                    const isDone = attemptInfo.hasCorrect || attemptInfo.count >= MAX_ATTEMPTS;

                    return (
                      <div 
                        key={teste.id}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-[#4318FF]/20 group flex flex-col md:flex-row md:items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                              {getMateriaName(teste.idmat) || 'Geral'}
                            </span>
                            {getTemaName(teste.idtema) && (
                              <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                {getTemaName(teste.idtema)}
                              </span>
                            )}
                            {isDone && (
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1
                                ${status === 'correct' ? 'bg-[#05CD99]/10 text-[#05CD99]' : 'bg-[#EE5D50]/10 text-[#EE5D50]'}`}>
                                {status === 'correct' ? (
                                  <> <CheckCircle size={10} /> Acertou </>
                                ) : (
                                  <> <XCircle size={10} /> Tentativas esgotadas </>
                                )}
                              </span>
                            )}
                            <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                              Tentativas {attemptInfo.count}/{MAX_ATTEMPTS}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium ml-auto md:ml-0">
                              <Clock size={12} />
                              {new Date(teste.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div 
                            className="font-bold text-[#1B2559] text-base md:text-lg line-clamp-1 group-hover:text-[#4318FF] transition-colors [&_*]:inline"
                            dangerouslySetInnerHTML={{ __html: decodeAndSanitize(teste.pergunta) }}
                          />
                        </div>

                        <div className="flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-50 md:pl-4 md:border-l md:border-gray-100 flex justify-end">
                          {getCardFooter(teste, attemptInfo)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            </>
            )}
          </div>
        </main>
      </div>

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
