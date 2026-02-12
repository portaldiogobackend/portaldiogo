import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, Image as ImageIcon, Menu, Send, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/layout/LogoutModal';
import { StudentSidebar } from '../components/layout/StudentSidebar';

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

interface DestinoDissertativa {
  questao_id: string;
}

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

export const StudentDissertativas: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Aluno');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoDissertativa[]>([]);
  const [envios, setEnvios] = useState<EnvioDissertativa[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userSerie, setUserSerie] = useState<string | null>(null);
  const [userMaterias, setUserMaterias] = useState<string[]>([]);

  const [respostasTexto, setRespostasTexto] = useState<Record<string, string>>({});
  const [respostasImagem, setRespostasImagem] = useState<Record<string, File | null>>({});
  const [respostasImagemUrl, setRespostasImagemUrl] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUserId(user.id);

      const { data: userData } = await supabase
        .from('tbf_controle_user')
        .select('nome, role, idserie, idmat')
        .eq('id', user.id)
        .single();
      if (userData?.nome) {
        setUserName(capitalizeWords(userData.nome.split(' ')[0]));
      }
      if (userData?.role && userData.role !== 'aluno') {
        navigate('/questoes-dissertativas', { replace: true });
        return;
      }
      setUserSerie(userData?.idserie || null);
      setUserMaterias(userData?.idmat || []);

      const [{ data: materiasData }, { data: seriesData }, { data: temasData }] = await Promise.all([
        supabase.from('tbf_materias').select('id, materia').order('materia'),
        supabase.from('tbf_serie').select('id, serie').order('serie'),
        supabase.from('tbf_temas').select('id, nometema').order('nometema')
      ]);
      setMaterias((materiasData as Materia[]) || []);
      setSeries((seriesData as Serie[]) || []);
      setTemas((temasData as Tema[]) || []);

      const { data: destinosData } = await supabase
        .from('tbf_questoes_dissertativas_destinos')
        .select('questao_id')
        .eq('aluno_id', user.id);

      const questaoIds = (destinosData as DestinoDissertativa[] | null)?.map(d => d.questao_id) || [];

      const generalQuery = supabase.from('tbf_questoes_dissertativas').select('*').order('created_at', { ascending: false });
      if (userData?.idserie) generalQuery.eq('idserie', userData.idserie);
      if (userData?.idmat && userData.idmat.length > 0) {
        generalQuery.in('idmat', userData.idmat);
      }

      const [generalRes, assignedRes] = await Promise.all([
        generalQuery,
        questaoIds.length > 0
          ? supabase.from('tbf_questoes_dissertativas').select('*').in('id', questaoIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] as QuestaoDissertativa[] | null })
      ]);

      const combined = [...(generalRes.data as QuestaoDissertativa[] | null || []), ...(assignedRes.data as QuestaoDissertativa[] | null || [])];
      const uniqueById = Array.from(new Map(combined.map(item => [item.id, item])).values());
      uniqueById.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setQuestoes(uniqueById);

      const { data: enviosData } = await supabase
        .from('tbf_questoes_dissertativas_envios')
        .select('*')
        .eq('aluno_id', user.id);
      setEnvios((enviosData as EnvioDissertativa[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const envioByQuestao = (id: string) => envios.find(envio => envio.questao_id === id);
  const materiaName = (id: string) => materias.find(m => m.id === id)?.materia || '—';
  const serieName = (id: string) => series.find(s => s.id === id)?.serie || '—';
  const temaName = (id?: string | null) => temas.find(t => t.id === id)?.nometema || '—';

  const handleFileChange = (questaoId: string, file: File | null) => {
    setRespostasImagem(prev => ({ ...prev, [questaoId]: file }));
    if (file) {
      setRespostasImagemUrl(prev => ({ ...prev, [questaoId]: '' }));
    }
  };

  const handleSubmit = async (questao: QuestaoDissertativa) => {
    if (!currentUserId) return;
    const existing = envioByQuestao(questao.id);
    if (existing) {
      showToast('Você já enviou essa questão.', 'error');
      return;
    }

    const texto = respostasTexto[questao.id]?.trim() || '';
    const imagem = respostasImagem[questao.id] || null;
    const imagemUrl = respostasImagemUrl[questao.id]?.trim() || '';
    const hasTexto = !!texto;
    const hasImagemFile = !!imagem;
    const hasImagemUrl = !!imagemUrl;
    const total = [hasTexto, hasImagemFile, hasImagemUrl].filter(Boolean).length;
    if (total === 0) {
      showToast('Envie uma resposta em texto ou imagem.', 'error');
      return;
    }
    if (total > 1) {
      showToast('Escolha apenas uma forma de resposta.', 'error');
      return;
    }

    setSendingId(questao.id);
    try {
      const { data: existingData } = await supabase
        .from('tbf_questoes_dissertativas_envios')
        .select('id')
        .eq('questao_id', questao.id)
        .eq('aluno_id', currentUserId)
        .maybeSingle();
      if (existingData) {
        showToast('Você já enviou essa questão.', 'error');
        setSendingId(null);
        return;
      }

      let payload: Partial<EnvioDissertativa> = {
        questao_id: questao.id,
        aluno_id: currentUserId,
        tipo_resposta: hasTexto ? 'texto' : 'imagem',
        enviado_em: new Date().toISOString()
      };

      if (hasTexto) {
        payload = { ...payload, resposta_texto: texto };
      } else if (hasImagemUrl) {
        payload = { ...payload, resposta_imagem_url: imagemUrl };
      } else if (imagem) {
        const bucket = 'dissertativas-respostas';
        const filePath = `${currentUserId}/${questao.id}/${Date.now()}-${imagem.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, imagem, {
          upsert: false,
          contentType: imagem.type
        });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
        payload = { ...payload, resposta_imagem_url: publicUrl?.publicUrl || '' };
      }

      const { data, error } = await supabase
        .from('tbf_questoes_dissertativas_envios')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      setEnvios(prev => [data as EnvioDissertativa, ...prev]);
      setRespostasTexto(prev => ({ ...prev, [questao.id]: '' }));
      setRespostasImagem(prev => ({ ...prev, [questao.id]: null }));
      setRespostasImagemUrl(prev => ({ ...prev, [questao.id]: '' }));
      showToast('Resposta enviada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      showToast('Erro ao enviar resposta.', 'error');
    } finally {
      setSendingId(null);
    }
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
              onClick={() => navigate('/aluno/dashboard')}
              className="flex items-center gap-2 text-[#A3AED0] hover:text-[#0061FF] font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden md:inline">Voltar ao Dashboard</span>
              <span className="md:hidden">Voltar</span>
            </button>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">Questões Dissertativas</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8">
              <h2 className="text-2xl font-bold mb-2">Responda às questões dissertativas</h2>
              <p className="text-gray-500">
                Série: <span className="font-medium text-gray-700">{userSerie ? serieName(userSerie) : '—'}</span> | 
                Disciplinas: <span className="font-medium text-gray-700">{userMaterias.length > 0 ? userMaterias.map(materiaName).join(', ') : '—'}</span>
              </p>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : questoes.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-10 text-center text-gray-400">
                  Nenhuma questão disponível no momento.
                </div>
              ) : (
                questoes.map(questao => {
                  const envio = envioByQuestao(questao.id);
                  return (
                    <div key={questao.id} className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none p-8 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Disciplina: <span className="font-medium text-gray-700">{materiaName(questao.idmat)}</span></p>
                          <p className="text-sm text-gray-500">Série: <span className="font-medium text-gray-700">{serieName(questao.idserie)}</span></p>
                          <p className="text-sm text-gray-500">Tema: <span className="font-medium text-gray-700">{temaName(questao.idtema)}</span></p>
                        </div>
                        {envio ? (
                          <div className="text-sm text-green-600 font-medium">
                            Enviado em {format(new Date(envio.enviado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        ) : (
                          <div className="text-sm text-orange-500 font-medium">Pendente</div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <MathContent html={questao.enunciado} />
                      </div>

                      {!envio && (
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Resposta em texto</label>
                            <textarea
                              value={respostasTexto[questao.id] || ''}
                              onChange={(e) => setRespostasTexto(prev => ({ ...prev, [questao.id]: e.target.value }))}
                              className="w-full min-h-[140px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                              placeholder="Digite sua resposta"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Ou envie uma imagem</label>
                            <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors border-gray-300 hover:border-[#4318FF]">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(questao.id, e.target.files?.[0] || null)}
                                className="hidden"
                                id={`imagem-${questao.id}`}
                              />
                              <label htmlFor={`imagem-${questao.id}`} className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload size={28} className="text-gray-400" />
                                {respostasImagem[questao.id] ? (
                                  <span className="text-xs font-bold text-[#4318FF]">{respostasImagem[questao.id]?.name}</span>
                                ) : (
                                  <span className="text-xs text-gray-500">Clique para selecionar uma imagem</span>
                                )}
                              </label>
                            </div>
                            <input
                              type="text"
                              value={respostasImagemUrl[questao.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setRespostasImagemUrl(prev => ({ ...prev, [questao.id]: value }));
                                if (value) {
                                  setRespostasImagem(prev => ({ ...prev, [questao.id]: null }));
                                }
                              }}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#4318FF] outline-none"
                              placeholder="Cole a URL de uma imagem"
                            />
                            {respostasImagem[questao.id] && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <ImageIcon size={14} />
                                <span>Imagem selecionada</span>
                              </div>
                            )}
                            {!respostasImagem[questao.id] && respostasImagemUrl[questao.id] && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <ImageIcon size={14} />
                                <span>Imagem da internet selecionada</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!envio ? (
                        <Button
                          onClick={() => handleSubmit(questao)}
                          className="bg-[#4318FF] hover:bg-[#3311CC]"
                          isLoading={sendingId === questao.id}
                        >
                          <Send size={18} className="mr-2" />
                          Enviar Resposta
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-blue-800 mb-2">Sua resposta</p>
                            {envio.tipo_resposta === 'texto' ? (
                              <p className="text-gray-700 whitespace-pre-wrap">{envio.resposta_texto}</p>
                            ) : (
                              <img src={envio.resposta_imagem_url || ''} alt="Resposta enviada" className="max-h-96 rounded-lg border border-blue-200" />
                            )}
                            {envio.corrigida && envio.comentario_professor && (
                              <div className="mt-3 text-sm text-blue-700">
                                <span className="font-medium">Comentário do professor:</span> {envio.comentario_professor}
                              </div>
                            )}
                            {envio.corrigida && (envio.nota !== null && envio.nota !== undefined) && (
                              <div className="mt-2 text-sm text-blue-700">
                                <span className="font-medium">Nota:</span> {envio.nota}
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-500 mb-2">Resolução comentada</p>
                            <MathContent html={questao.resposta_esperada} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
