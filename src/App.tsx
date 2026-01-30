import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AreaLogada } from './pages/AreaLogada';
import { Contato } from './pages/Contato';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Mensagens } from './pages/Mensagens';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { SetupInicial } from './pages/SetupInicial';
import { SignUp } from './pages/SignUp';
import Usuarios from './pages/Usuarios';
import { Materias } from './pages/Materias';
import { CentralDuvidasAdmin } from './pages/CentralDuvidasAdmin';
import { WaitingApproval } from './pages/WaitingApproval';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentMaterias } from './pages/StudentMaterias';
import { CentralDuvidas } from './pages/CentralDuvidas';
import { Temas } from './pages/Temas';
import { TesteAlunos } from './pages/TesteAlunos';
import AdminTestes from '@/pages/admintestes';
import ProtectedAdminRoute from '@/components/layout/ProtectedAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<SignUp />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/arealogada" element={<AreaLogada />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/setup-inicial" element={<SetupInicial />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/mensagens" element={<Mensagens />} />
        <Route path="/materias" element={<Materias />} />
        <Route path="/central-duvidas-admin" element={<CentralDuvidasAdmin />} />
        <Route path="/temas" element={<Temas />} />
        <Route
          path="/testes"
          element={
            <ProtectedAdminRoute>
              <AdminTestes />
            </ProtectedAdminRoute>
          }
        />
        
        {/* Rotas do Aluno */}
        <Route path="/aguardando-aprovacao" element={<WaitingApproval />} />
        <Route path="/aluno/dashboard" element={<StudentDashboard />} />
        <Route path="/aluno/materias" element={<StudentMaterias />} />
        <Route path="/aluno/testes" element={<TesteAlunos />} />
        <Route path="/aluno/central-duvidas" element={<CentralDuvidas />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

