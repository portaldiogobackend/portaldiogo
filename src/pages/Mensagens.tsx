import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ChevronLeft,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Menu,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { LogoutModal } from "../components/layout/LogoutModal";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn, capitalizeWords } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: string; // Changed from number to string to match UUID
  created_at: string;
  nome: string;
  email: string;
  celular: string;
  mensagem: string;
  respondido: "S" | "N";
}

export const Mensagens: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>("Admin");
  const [loading, setLoading] = useState(true);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mensagensPerPage] = useState(10);

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "S" | "N">(
    () =>
      (sessionStorage.getItem("msg_status_filter_v2") as "all" | "S" | "N") ||
      "all"
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>(() => {
    const saved = sessionStorage.getItem("msg_sort_config_v2");
    return saved ? JSON.parse(saved) : { key: "created_at", direction: "desc" };
  });

  useEffect(() => {
    sessionStorage.setItem("msg_status_filter_v2", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    sessionStorage.setItem("msg_sort_config_v2", JSON.stringify(sortConfig));
  }, [sortConfig]);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchMensagens();

      // Set up real-time subscription
      const channel = supabase
        .channel("tbf_mensagens_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tbf_mensagens",
          },
          () => {
            fetchMensagens();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (userRole && userRole !== "admin") {
      setLoading(false);
    }
  }, [userRole]);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Usando RPC para evitar recursão de RLS e erros de conexão
        const { data, error } = await supabase.rpc('get_user_profile');

        if (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setLoading(false);
          return;
        }

        if (data) {
          setUserName(capitalizeWords((data.nome || "Admin").split(" ")[0]));
          setUserRole(data.role);
          console.log("Role do usuário logado:", data.role);
          
          // Se não for admin, o useEffect cuidará do loading, mas podemos garantir aqui
          if (data.role !== 'admin') {
             setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const fetchMensagens = async () => {
    try {
      setLoading(true);
      console.log("Iniciando busca de mensagens...");
      const { data, error, status, statusText } = await supabase
        .from("tbf_mensagens")
        .select("*");

      console.log("Resultado da busca Supabase:", {
        dataLength: data?.length,
        error,
        status,
        statusText,
        data,
      });

      if (error) {
        console.error("Erro detalhado Supabase:", error);
        throw error;
      }

      console.log("Mensagens recebidas e definidas no state:", data);
      setMensagens(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (msg: Mensagem) => {
    try {
      setIsUpdating(msg.id);
      const newStatus = msg.respondido === "S" ? "N" : "S";

      const { error } = await supabase
        .from("tbf_mensagens")
        .update({ respondido: newStatus })
        .eq("id", msg.id);

      if (error) throw error;

      setMensagens(
        mensagens.map((m) =>
          m.id === msg.id ? { ...m, respondido: newStatus } : m
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status da mensagem.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTempSearchQuery("");
    setStatusFilter("all");
    setSortConfig({ key: "created_at", direction: "desc" });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Logic for filtering and sorting
  const filteredMensagens = mensagens.filter((msg) => {
    const matchesSearch =
      (msg.nome || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.mensagem || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || msg.respondido === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedMensagens = [...filteredMensagens].sort((a, b) => {
    if (sortConfig.key === "created_at") {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    // Para colunas de texto (nome, email, etc), usa localeCompare para ordem alfabética correta
    const aValue = (a[sortConfig.key as keyof Mensagem] || "").toString();
    const bValue = (b[sortConfig.key as keyof Mensagem] || "").toString();

    return sortConfig.direction === "asc"
      ? aValue.localeCompare(bValue, "pt-BR", { sensitivity: "base" })
      : bValue.localeCompare(aValue, "pt-BR", { sensitivity: "base" });
  });

  const indexOfLastMsg = currentPage * mensagensPerPage;
  const indexOfFirstMsg = indexOfLastMsg - mensagensPerPage;
  const currentMensagens = sortedMensagens.slice(
    indexOfFirstMsg,
    indexOfLastMsg
  );
  const totalPages = Math.ceil(sortedMensagens.length / mensagensPerPage);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    } catch (e) {
      return dateStr;
    }
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
              <span className="hidden md:inline">Voltar</span>
            </button>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] truncate">
            Gerenciamento de Mensagens
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-0 md:pt-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden border-none">
              <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#F4F7FE] text-[#0061FF] rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1B2559]">
                        Mensagens Recebidas
                      </h2>
                      <p className="text-sm text-[#A3AED0] line-clamp-1">
                        Visualize e gerencie o contato dos usuários
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]"
                      />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={tempSearchQuery}
                        onChange={(e) => setTempSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-11 pr-4 py-2.5 bg-[#F4F7FE] border-none rounded-xl text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none w-full md:w-80 text-sm"
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleSearch} className="w-full md:w-auto">
                      Buscar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4 md:gap-8 bg-gray-50/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-[#A3AED0]" />
                      <span className="text-sm font-bold text-[#1B2559]">
                        Status:
                      </span>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as "all" | "S" | "N")
                      }
                      className="bg-white border-none rounded-lg px-3 py-1.5 text-sm text-[#2B3674] focus:ring-2 focus:ring-[#0061FF]/20 outline-none shadow-sm font-medium flex-1 md:flex-none"
                    >
                      <option value="N">Não Lidas (Novas)</option>
                      <option value="S">Lidas / Respondidas</option>
                      <option value="all">Todas as Mensagens</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <>
                      <div className="hidden md:block h-6 w-px bg-gray-200"></div>
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50 w-full md:w-auto justify-center md:justify-start"
                      >
                        <X size={16} />
                        Limpar Filtros
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[#A3AED0] text-sm border-b border-gray-50">
                      <th className="px-8 py-6 font-semibold w-16">Lido</th>
                      <th
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center gap-2">
                          Data/Hora
                          <div
                            className={cn(
                              "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                              sortConfig.key === "created_at" && "opacity-100"
                            )}
                          >
                            <ChevronUp
                              size={12}
                              className={cn(
                                sortConfig.key === "created_at" &&
                                  sortConfig.direction === "asc"
                                  ? "text-[#0061FF]"
                                  : "text-[#CBD5E0]"
                              )}
                            />
                            <ChevronDown
                              size={12}
                              className={cn(
                                sortConfig.key === "created_at" &&
                                  sortConfig.direction === "desc"
                                  ? "text-[#0061FF]"
                                  : "text-[#CBD5E0]"
                              )}
                            />
                          </div>
                        </div>
                      </th>
                      <th
                        className="px-8 py-6 font-semibold cursor-pointer hover:text-[#0061FF] transition-colors group"
                        onClick={() => handleSort("nome")}
                      >
                        <div className="flex items-center gap-2">
                          Nome
                          <div
                            className={cn(
                              "flex flex-col opacity-0 group-hover:opacity-100 transition-opacity",
                              sortConfig.key === "nome" && "opacity-100"
                            )}
                          >
                            <ChevronUp
                              size={12}
                              className={cn(
                                sortConfig.key === "nome" &&
                                  sortConfig.direction === "asc"
                                  ? "text-[#0061FF]"
                                  : "text-[#CBD5E0]"
                              )}
                            />
                            <ChevronDown
                              size={12}
                              className={cn(
                                sortConfig.key === "nome" &&
                                  sortConfig.direction === "desc"
                                  ? "text-[#0061FF]"
                                  : "text-[#CBD5E0]"
                              )}
                            />
                          </div>
                        </div>
                      </th>
                      <th className="px-8 py-6 font-semibold">Contato</th>
                      <th className="px-8 py-6 font-semibold">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Spinner size="lg" />
                            <p className="text-[#A3AED0] font-medium">
                              Carregando mensagens...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : userRole !== "admin" && !loading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-300">
                              <Shield size={32} />
                            </div>
                            <p className="text-[#1B2559] font-bold">
                              Acesso Restrito
                            </p>
                            <p className="text-[#A3AED0] font-medium">
                              Apenas administradores podem visualizar mensagens.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : currentMensagens.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                              <MessageSquare size={32} />
                            </div>
                            <p className="text-[#A3AED0] font-medium">
                              Nenhuma mensagem encontrada.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentMensagens.map((msg) => (
                        <tr
                          key={msg.id}
                          className={cn(
                            "border-b border-gray-50 transition-colors hover:bg-[#F4F7FE]/30",
                            msg.respondido === "N" && "bg-[#0061FF]/[0.02]"
                          )}
                        >
                          <td className="px-8 py-5">
                            <label className="relative flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={msg.respondido === "S"}
                                onChange={() => toggleStatus(msg)}
                                disabled={isUpdating === msg.id}
                                className="peer hidden"
                              />
                              <div
                                className={cn(
                                  "w-6 h-6 border-2 rounded-lg transition-all flex items-center justify-center",
                                  msg.respondido === "S"
                                    ? "bg-green-500 border-green-500 shadow-lg shadow-green-200"
                                    : "border-[#CBD5E0] bg-white hover:border-[#0061FF]",
                                  isUpdating === msg.id &&
                                    "opacity-50 cursor-wait"
                                )}
                              >
                                {msg.respondido === "S" && (
                                  <CheckCircle2
                                    size={16}
                                    className="text-white"
                                  />
                                )}
                                {msg.respondido === "N" &&
                                  isUpdating === msg.id && (
                                    <Spinner size="sm" />
                                  )}
                              </div>
                            </label>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-[#1B2559] font-bold text-sm">
                                <Calendar
                                  size={14}
                                  className="text-[#A3AED0]"
                                />
                                {formatDateTime(msg.created_at)}
                              </div>
                              <div className="flex items-center gap-2 text-[#A3AED0] text-xs">
                                <Clock size={12} />
                                {msg.respondido === "S" ? "Lida" : "Não lida"}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0061FF] to-[#422AFB] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200 uppercase">
                                {msg.nome.charAt(0)}
                              </div>
                              <span className="text-[#1B2559] font-bold">
                                {msg.nome}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-sm text-[#2B3674] font-medium">
                                <Mail size={14} className="text-[#A3AED0]" />
                                {msg.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#2B3674] font-medium">
                                <Phone size={14} className="text-[#A3AED0]" />
                                {msg.celular || "Não informado"}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 max-w-md">
                            <div className="bg-[#F4F7FE] p-4 rounded-2xl border border-gray-100">
                              <p className="text-sm text-[#2B3674] line-clamp-3 leading-relaxed italic">
                                "{msg.mensagem}"
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                  <p className="text-sm text-[#A3AED0] font-medium">
                    Mostrando{" "}
                    <span className="text-[#1B2559] font-bold">
                      {indexOfFirstMsg + 1}
                    </span>{" "}
                    a{" "}
                    <span className="text-[#1B2559] font-bold">
                      {Math.min(indexOfLastMsg, sortedMensagens.length)}
                    </span>{" "}
                    de{" "}
                    <span className="text-[#1B2559] font-bold">
                      {sortedMensagens.length}
                    </span>{" "}
                    mensagens
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="rounded-xl px-4"
                    >
                      Anterior
                    </Button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                          currentPage === i + 1
                            ? "bg-[#0061FF] text-white shadow-lg shadow-blue-200"
                            : "text-[#A3AED0] hover:bg-white hover:text-[#0061FF]"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="rounded-xl px-4"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Mensagens;
