import { supabase } from '@/lib/supabase';

export interface DestinoInsertRow {
  questao_id?: string;
  aluno_id?: string;
  professor_id?: string;
  enviado_em?: string;
}

type ColumnVariant = {
  questao: string;
  aluno: string;
  professor?: string;
  enviado?: string;
};

const configuredTable = (import.meta.env.VITE_SUPABASE_DISSERTATIVAS_DESTINOS_TABLE as string | undefined)?.trim() || '';
const DESTINO_TABLES = [
  'tbf_questoes_dissertativas_destinos',
  'tbf_dissertativas_destinos',
  'tbf_questoes_dissertativas_alunos'
];
const FORBIDDEN_TABLES = new Set(['tbf_questoes_dissertativas_envios']);
const TABLE_CANDIDATES = Array.from(new Set([configuredTable, ...DESTINO_TABLES]))
  .map((table) => table.trim())
  .filter(Boolean)
  .filter((table) => !FORBIDDEN_TABLES.has(table));

const COLUMN_VARIANTS: ColumnVariant[] = [
  { questao: 'questao_id', aluno: 'aluno_id', professor: 'professor_id', enviado: 'enviado_em' },
  { questao: 'questao_id', aluno: 'aluno_id', professor: 'professor_id', enviado: 'created_at' },
  { questao: 'questao_id', aluno: 'aluno_id', professor: 'professor_id', enviado: 'data_envio' },
  { questao: 'idquestao', aluno: 'idaluno', professor: 'idprofessor', enviado: 'enviado_em' },
  { questao: 'idquestao', aluno: 'idaluno', professor: 'idprofessor', enviado: 'created_at' },
  { questao: 'idquestao', aluno: 'idaluno', professor: 'idprofessor', enviado: 'data_envio' },
  { questao: 'questao_id', aluno: 'aluno_id', professor: 'professor_id' },
  { questao: 'idquestao', aluno: 'idaluno', professor: 'idprofessor' },
  { questao: 'questao_id', aluno: 'aluno_id' },
  { questao: 'idquestao', aluno: 'idaluno' }
];

let resolvedTable: string | null = null;
let loggedResolvedKey: string | null = null;

const debugEnabled = (import.meta.env.VITE_DEBUG_DISSERTATIVAS_DESTINOS as string | undefined) === 'true';

const logDebug = (message: string, extra?: Record<string, unknown>) => {
  if (!debugEnabled) return;
  if (extra) {
    console.info(`[dissertativas-destinos] ${message}`, extra);
    return;
  }
  console.info(`[dissertativas-destinos] ${message}`);
};

const errorToText = (error: unknown) => {
  if (!error || typeof error !== 'object') return '';
  const err = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  return [err.message, err.details, err.hint, err.code]
    .filter((part) => typeof part === 'string' || typeof part === 'number')
    .join(' ')
    .toLowerCase();
};

const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const text = errorToText(error);
  return code === 'PGRST205' || code === '42P01' || text.includes('could not find the table') || (text.includes('relation') && text.includes('does not exist'));
};

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const text = errorToText(error);
  return code === '42703' || (text.includes('column') && (text.includes('does not exist') || text.includes('not found')));
};

const withKnownTableFirst = () => {
  if (!resolvedTable) return TABLE_CANDIDATES;
  return [resolvedTable, ...TABLE_CANDIDATES.filter((table) => table !== resolvedTable)];
};

const getTableCandidates = () => {
  const candidates = withKnownTableFirst();
  if (candidates.length > 0) return candidates;
  return DESTINO_TABLES;
};

const buildInsertPayload = (rows: DestinoInsertRow[], variant: ColumnVariant) => (
  rows.map((row) => {
    const payload: Record<string, string> = {};
    if (row.questao_id) payload[variant.questao] = row.questao_id;
    if (row.aluno_id) payload[variant.aluno] = row.aluno_id;
    if (variant.professor && row.professor_id) payload[variant.professor] = row.professor_id;
    if (variant.enviado && row.enviado_em) payload[variant.enviado] = row.enviado_em;
    return payload;
  })
);

export const insertDissertativaDestinos = async (rows: DestinoInsertRow[]) => {
  if (rows.length === 0) {
    return { data: [], error: null };
  }

  let lastError: unknown = null;

  for (const table of getTableCandidates()) {
    let relationMissing = false;

    for (const variant of COLUMN_VARIANTS) {
      const payload = buildInsertPayload(rows, variant);
      const result = await supabase.from(table).insert(payload);

      if (!result.error) {
        resolvedTable = table;
        const key = `${table}:${variant.questao}:${variant.aluno}:${variant.professor || '-'}:${variant.enviado || '-'}`;
        if (loggedResolvedKey !== key) {
          loggedResolvedKey = key;
          logDebug('resolved destination mapping for insert', { table, variant });
        }
        return result;
      }

      if (isMissingRelationError(result.error)) {
        relationMissing = true;
        lastError = result.error;
        break;
      }

      if (isMissingColumnError(result.error)) {
        lastError = result.error;
        continue;
      }

      return result;
    }

    if (!relationMissing && resolvedTable === table) {
      break;
    }
  }

  logDebug('failed to insert destinos with all candidates', {
    tableCandidates: getTableCandidates(),
    error: lastError
  });
  return { data: null, error: lastError };
};

export const findDissertativaDestino = async (questaoId: string, alunoId: string) => {
  let lastError: unknown = null;

  for (const table of getTableCandidates()) {
    let relationMissing = false;

    for (const variant of COLUMN_VARIANTS) {
      const result = await supabase
        .from(table)
        .select(variant.questao)
        .eq(variant.questao, questaoId)
        .eq(variant.aluno, alunoId)
        .limit(1);

      if (!result.error) {
        resolvedTable = table;
        const key = `${table}:${variant.questao}:${variant.aluno}`;
        if (loggedResolvedKey !== key) {
          loggedResolvedKey = key;
          logDebug('resolved destination mapping for find', { table, variant });
        }
        const data = Array.isArray(result.data) ? result.data : [];
        return { exists: data.length > 0, error: null };
      }

      if (isMissingRelationError(result.error)) {
        relationMissing = true;
        lastError = result.error;
        break;
      }

      if (isMissingColumnError(result.error)) {
        lastError = result.error;
        continue;
      }

      return { exists: false, error: result.error };
    }

    if (!relationMissing && resolvedTable === table) {
      break;
    }
  }

  logDebug('failed to find destino with all candidates', {
    tableCandidates: getTableCandidates(),
    error: lastError
  });
  return { exists: false, error: lastError };
};

export const listDissertativaDestinoPairs = async (questaoIds: string[], alunoIds: string[]) => {
  if (questaoIds.length === 0 || alunoIds.length === 0) {
    return { pairs: new Set<string>(), error: null };
  }

  let lastError: unknown = null;

  for (const table of getTableCandidates()) {
    let relationMissing = false;

    for (const variant of COLUMN_VARIANTS) {
      const result = await supabase
        .from(table)
        .select(`${variant.questao}, ${variant.aluno}`)
        .in(variant.questao, questaoIds)
        .in(variant.aluno, alunoIds);

      if (!result.error) {
        resolvedTable = table;
        const key = `${table}:${variant.questao}:${variant.aluno}`;
        if (loggedResolvedKey !== key) {
          loggedResolvedKey = key;
          logDebug('resolved destination mapping for pair list', { table, variant });
        }
        const pairs = new Set<string>();
        const rows = Array.isArray(result.data) ? result.data : [];
        rows.forEach((row) => {
          if (!row || typeof row !== 'object') return;
          const questao = (row as Record<string, unknown>)[variant.questao];
          const aluno = (row as Record<string, unknown>)[variant.aluno];
          if (typeof questao === 'string' && typeof aluno === 'string') {
            pairs.add(`${questao}-${aluno}`);
          }
        });
        return { pairs, error: null };
      }

      if (isMissingRelationError(result.error)) {
        relationMissing = true;
        lastError = result.error;
        break;
      }

      if (isMissingColumnError(result.error)) {
        lastError = result.error;
        continue;
      }

      return { pairs: new Set<string>(), error: result.error };
    }

    if (!relationMissing && resolvedTable === table) {
      break;
    }
  }

  logDebug('failed to list destino pairs with all candidates', {
    tableCandidates: getTableCandidates(),
    error: lastError
  });
  return { pairs: new Set<string>(), error: lastError };
};

export const listDissertativaQuestaoIdsByAluno = async (alunoId: string) => {
  let lastError: unknown = null;

  for (const table of getTableCandidates()) {
    let relationMissing = false;

    for (const variant of COLUMN_VARIANTS) {
      const result = await supabase
        .from(table)
        .select(variant.questao)
        .eq(variant.aluno, alunoId);

      if (!result.error) {
        resolvedTable = table;
        const key = `${table}:${variant.questao}:${variant.aluno}`;
        if (loggedResolvedKey !== key) {
          loggedResolvedKey = key;
          logDebug('resolved destination mapping for aluno list', { table, variant });
        }
        const rows = Array.isArray(result.data) ? result.data : [];
        const questaoIds = rows
          .map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>)[variant.questao] : null))
          .filter((value): value is string => typeof value === 'string');
        return { questaoIds, error: null };
      }

      if (isMissingRelationError(result.error)) {
        relationMissing = true;
        lastError = result.error;
        break;
      }

      if (isMissingColumnError(result.error)) {
        lastError = result.error;
        continue;
      }

      return { questaoIds: [] as string[], error: result.error };
    }

    if (!relationMissing && resolvedTable === table) {
      break;
    }
  }

  logDebug('failed to list questao ids by aluno with all candidates', {
    tableCandidates: getTableCandidates(),
    error: lastError
  });
  return { questaoIds: [] as string[], error: lastError };
};
