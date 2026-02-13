import React, { useEffect, useMemo, useState } from 'react';
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
}

interface Pagamento {
  id: string;
  aluno_id: string;
  valor_pago: number;
  data_pagamento: string;
  periodo_referencia: string;
  created_at: string;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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
    conteudo_aula: ''
  });

  const [pagamentoForm, setPagamentoForm] = useState({
    aluno_id: '',
    valor_pago: '',
    data_pagamento: '',
    periodo_referencia: ''
  });

  const [reportAlunoId, setReportAlunoId] = useState('');
  const [reportPeriodo, setReportPeriodo] = useState('');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');

  const isStaff = userRole === 'admin' || userRole === 'professor';

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('tbf_controle_user')
          .select('nome, role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        if (userData?.nome) {
          setUserName(capitalizeWords(userData.nome.split(' ')[0]));
        }
        setUserRole(userData?.role ?? null);
        if (userData?.role !== 'admin' && userData?.role !== 'professor') {
          return;
        }
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
      setFrequencias((frequenciasRes.data as Frequencia[]) || []);
      setPagamentos((pagamentosRes.data as Pagamento[]) || []);
    } catch {
      showToast('Erro ao carregar dados. Verifique as tabelas do banco.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const alunoNome = (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return 'Aluno';
    return capitalizeWords(`${aluno.nome} ${aluno.sobrenome || ''}`.trim());
  };

  const openCreateFrequencia = () => {
    setCurrentFrequencia(null);
    setFrequenciaForm({ aluno_id: '', data_aula: '', conteudo_aula: '' });
    setIsFrequenciaModalOpen(true);
  };

  const openEditFrequencia = (item: Frequencia) => {
    setCurrentFrequencia(item);
    setFrequenciaForm({
      aluno_id: item.aluno_id,
      data_aula: item.data_aula ? item.data_aula.split('T')[0] : '',
      conteudo_aula: item.conteudo_aula || ''
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
      data_pagamento: item.data_pagamento ? item.data_pagamento.split('T')[0] : '',
      periodo_referencia: item.periodo_referencia || ''
    });
    setIsPagamentoModalOpen(true);
  };

  const handleSaveFrequencia = async () => {
    if (!frequenciaForm.aluno_id || !frequenciaForm.data_aula || !frequenciaForm.conteudo_aula.trim()) {
      showToast('Preencha aluno, data da aula e conteúdo.', 'error');
      return;
    }
    setSavingFrequencia(true);
    try {
      if (currentFrequencia) {
        const { error } = await supabase
          .from('tbf_frequencias')
          .update({
            aluno_id: frequenciaForm.aluno_id,
            data_aula: frequenciaForm.data_aula,
            conteudo_aula: frequenciaForm.conteudo_aula.trim()
          })
          .eq('id', currentFrequencia.id);
        if (error) throw error;
        showToast('Frequência atualizada.', 'success');
      } else {
        const { error } = await supabase
          .from('tbf_frequencias')
          .insert([{
            aluno_id: frequenciaForm.aluno_id,
            data_aula: frequenciaForm.data_aula,
            conteudo_aula: frequenciaForm.conteudo_aula.trim()
          }]);
        if (error) throw error;
        showToast('Frequência registrada.', 'success');
      }
      setIsFrequenciaModalOpen(false);
      await fetchInitialData();
    } catch {
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
      if (currentPagamento) {
        const { error } = await supabase
          .from('tbf_pagamentos')
          .update({
            aluno_id: pagamentoForm.aluno_id,
            valor_pago: valorPago,
            data_pagamento: pagamentoForm.data_pagamento,
            periodo_referencia: pagamentoForm.periodo_referencia.trim()
          })
          .eq('id', currentPagamento.id);
        if (error) throw error;
        showToast('Pagamento atualizado.', 'success');
      } else {
        const { error } = await supabase
          .from('tbf_pagamentos')
          .insert([{
            aluno_id: pagamentoForm.aluno_id,
            valor_pago: valorPago,
            data_pagamento: pagamentoForm.data_pagamento,
            periodo_referencia: pagamentoForm.periodo_referencia.trim()
          }]);
        if (error) throw error;
        showToast('Pagamento registrado.', 'success');
      }
      setIsPagamentoModalOpen(false);
      await fetchInitialData();
    } catch {
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
      if (reportAlunoId && item.aluno_id !== reportAlunoId) return false;
      if (reportStart) {
        const start = new Date(reportStart);
        if (new Date(item.data_aula) < start) return false;
      }
      if (reportEnd) {
        const end = new Date(reportEnd);
        if (new Date(item.data_aula) > end) return false;
      }
      return true;
    });
  }, [frequencias, reportAlunoId, reportStart, reportEnd]);

  const filteredPagamentos = useMemo(() => {
    return pagamentos.filter((item) => {
      if (reportAlunoId && item.aluno_id !== reportAlunoId) return false;
      if (reportPeriodo && !item.periodo_referencia?.toLowerCase().includes(reportPeriodo.toLowerCase())) return false;
      if (reportStart) {
        const start = new Date(reportStart);
        if (new Date(item.data_pagamento) < start) return false;
      }
      if (reportEnd) {
        const end = new Date(reportEnd);
        if (new Date(item.data_pagamento) > end) return false;
      }
      return true;
    });
  }, [pagamentos, reportAlunoId, reportPeriodo, reportStart, reportEnd]);

  const totalRecebido = filteredPagamentos.reduce((acc, item) => acc + toNumber(item.valor_pago), 0);

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
            ) : !isStaff ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-gray-200/40">
                <h3 className="text-xl font-bold text-gray-700 mb-2">Acesso restrito</h3>
                <p className="text-gray-400">Esta área é exclusiva para professores e administradores.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1B2559]">Frequência</h2>
                      <span className="text-sm text-gray-400">{frequencias.length} registros</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 uppercase text-xs">
                            <th className="py-2">Aluno</th>
                            <th className="py-2">Data</th>
                            <th className="py-2">Conteúdo</th>
                            <th className="py-2 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frequencias.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-400">
                                Nenhum registro de frequência.
                              </td>
                            </tr>
                          ) : (
                            frequencias.map((item) => (
                              <tr key={item.id} className="border-t border-gray-100">
                                <td className="py-3 font-medium text-[#1B2559]">{alunoNome(item.aluno_id)}</td>
                                <td className="py-3">{formatDate(item.data_aula)}</td>
                                <td className="py-3 text-gray-600 max-w-[240px] truncate">{item.conteudo_aula}</td>
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#1B2559]">Pagamentos</h2>
                      <span className="text-sm text-gray-400">{pagamentos.length} registros</span>
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
                          {pagamentos.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-gray-400">
                                Nenhum pagamento registrado.
                              </td>
                            </tr>
                          ) : (
                            pagamentos.map((item) => (
                              <tr key={item.id} className="border-t border-gray-100">
                                <td className="py-3 font-medium text-[#1B2559]">{alunoNome(item.aluno_id)}</td>
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-[#1B2559]">Relatório</h2>
                    <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                      <Printer size={18} />
                      Imprimir Relatório
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Aluno</label>
                      <select
                        value={reportAlunoId}
                        onChange={(e) => setReportAlunoId(e.target.value)}
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
                      <label className="text-xs font-semibold text-gray-500 uppercase">Período de referência</label>
                      <input
                        type="text"
                        value={reportPeriodo}
                        onChange={(e) => setReportPeriodo(e.target.value)}
                        placeholder="Ex: Março/2026"
                        className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Data início</label>
                      <input
                        type="date"
                        value={reportStart}
                        onChange={(e) => setReportStart(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Data fim</label>
                      <input
                        type="date"
                        value={reportEnd}
                        onChange={(e) => setReportEnd(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4318FF] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F4F7FE] rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Aulas registradas</p>
                      <p className="text-2xl font-bold text-[#1B2559]">{filteredFrequencias.length}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Pagamentos no período</p>
                      <p className="text-2xl font-bold text-[#1B2559]">{filteredPagamentos.length}</p>
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
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFrequencias.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-gray-400">
                                Nenhuma frequência para o filtro selecionado.
                              </td>
                            </tr>
                          ) : (
                            filteredFrequencias.map((item) => (
                              <tr key={item.id} className="border-t border-gray-100">
                                <td className="py-3 px-4 font-medium text-[#1B2559]">{alunoNome(item.aluno_id)}</td>
                                <td className="py-3 px-4">{formatDate(item.data_aula)}</td>
                                <td className="py-3 px-4 text-gray-600">{item.conteudo_aula}</td>
                              </tr>
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
                          {filteredPagamentos.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-400">
                                Nenhum pagamento para o filtro selecionado.
                              </td>
                            </tr>
                          ) : (
                            filteredPagamentos.map((item) => (
                              <tr key={item.id} className="border-t border-gray-100">
                                <td className="py-3 px-4 font-medium text-[#1B2559]">{alunoNome(item.aluno_id)}</td>
                                <td className="py-3 px-4">{formatDate(item.data_pagamento)}</td>
                                <td className="py-3 px-4 text-gray-600">{item.periodo_referencia}</td>
                                <td className="py-3 px-4 font-semibold text-[#1B2559]">{currencyFormatter.format(toNumber(item.valor_pago))}</td>
                              </tr>
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
              onChange={(e) => setFrequenciaForm(prev => ({ ...prev, aluno_id: e.target.value }))}
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
