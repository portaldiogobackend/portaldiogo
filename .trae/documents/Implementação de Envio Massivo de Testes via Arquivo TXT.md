# Plano de Implementação de Envio Massivo de Testes

## 1. Documentação
- Criar arquivo `IMPORTACAO_TESTES.md` na raiz do projeto.
- Explicar o formato do arquivo `.txt` (delimitador `|`).
- Incluir exemplo prático com 5 linhas de dados.

## 2. Alterações no Frontend (`src/pages/admintestes.tsx`)

### A. Novos Estados e Controle
- Adicionar estado `isMassiveModalOpen` para controlar a visibilidade do novo modal.
- Adicionar estado `massiveFile` para armazenar o arquivo selecionado.
- Adicionar estado `importLog` para armazenar o feedback do processamento.

### B. Interface de Usuário (UI)
- **Botão no Header**: Adicionar botão "Envio Massivo" ao lado de "Cadastrar Testes" com ícone de Upload.
- **Novo Modal**: Criar um modal específico para envio em massa contendo:
  - Seletores de **Matéria**, **Série**, **Tema** e **Alunos** (reutilizando o componente `MultiSelect` existente para garantir consistência).
  - Área de upload para arquivo `.txt`.
  - Instruções breves sobre o formato esperado.

### C. Lógica de Processamento (`handleMassiveSubmit`)
1. **Validação Inicial**:
   - Verificar se as categorias obrigatórias (Matéria, Série) foram selecionadas.
   - Verificar se um arquivo `.txt` foi carregado.
2. **Leitura e Parsing**:
   - Ler o arquivo usando `FileReader`.
   - Separar linhas e colunas usando o delimitador `|`.
   - Validar se cada linha possui as 4 colunas obrigatórias: `pergunta`, `alternativas` (separadas por `;`), `resposta` (número), `justificativa`.
3. **Envio para Supabase**:
   - Iterar sobre as linhas válidas.
   - Inserir cada registro na tabela `tbf_testes`, combinando os dados do arquivo com os IDs selecionados no modal (Matéria, Série, etc.).
   - Processar inserções individualmente para garantir que falhas pontuais não impeçam o sucesso total.
4. **Feedback**:
   - Exibir mensagem de sucesso/erro ao final.
   - Mostrar detalhes dos erros caso ocorram.
   - Logar eventos no console.

## 3. Validação
- Testar o fluxo com o arquivo de exemplo gerado.
- Verificar se os filtros (Matéria/Série) são aplicados corretamente a todos os registros importados.
