# Importação Massiva de Testes

Este documento descreve o formato necessário para realizar a importação massiva de testes no sistema.

## Formato do Arquivo

O arquivo deve ser um texto plano com extensão `.txt`.
Cada linha representa um teste e deve conter os seguintes campos separados por `|` (pipe):

1. **Pergunta**: O texto da pergunta (pode conter HTML básico).
2. **Alternativas**: As opções de resposta separadas por `;` (ponto e vírgula).
3. **Resposta Correta**: O número correspondente à alternativa correta (1 para a primeira, 2 para a segunda, etc.).
4. **Justificativa**: Explicação da resposta correta.

### Estrutura da Linha

```text
Pergunta|Alternativa1;Alternativa2;Alternativa3;Alternativa4|IndiceResposta|Justificativa
```

## Regras Importantes

1. O arquivo deve ser salvo com codificação **UTF-8** para garantir que acentos e caracteres especiais sejam processados corretamente.
2. Não deve haver cabeçalho no arquivo.
3. As colunas **Matéria**, **Série**, **Tema** e **Alunos** são selecionadas na interface antes do envio e serão aplicadas a **todos** os testes do arquivo.
4. O caractere `|` não deve ser usado dentro do texto das perguntas ou justificativas, pois é o separador de colunas.
5. O caractere `;` não deve ser usado dentro do texto das alternativas, pois é o separador de opções.

## Exemplo de Arquivo (5 linhas)

```text
Qual é a capital do Brasil?|São Paulo;Rio de Janeiro;Brasília;Salvador|3|Brasília é a capital federal do Brasil desde 1960.
Quanto é 2 + 2?|3;4;5;6|2|A soma de 2 mais 2 é igual a 4.
Qual o símbolo químico da água?|H2O;CO2;O2;NaCl|1|A água é composta por dois átomos de hidrogênio e um de oxigênio.
Quem descobriu o Brasil?|Pedro Álvares Cabral;Cristóvão Colombo;Vasco da Gama;Dom Pedro I|1|Pedro Álvares Cabral chegou ao Brasil em 1500.
Qual é o maior planeta do Sistema Solar?|Terra;Marte;Júpiter;Saturno|3|Júpiter é o maior planeta do nosso sistema solar.
```
