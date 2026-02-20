import { supabase } from '@/lib/supabase';

export interface ProvaRow {
  idteste: string;
  acerto: boolean;
  tempoSegundos: number;
  realizadoEm: string | null;
}

interface RawProvaRow {
  idteste?: unknown;
  acerto?: unknown;
  [key: string]: unknown;
}

const TEMPO_COLUMNS = [
  'tempo_segundos',
  'tempo_gasto_segundos',
  'tempo_gasto',
  'duracao_segundos',
  'duracao',
  'tempo_resposta_segundos'
] as const;

const DATE_COLUMNS = [
  'created_at',
  'data_hora',
  'respondido_em'
] as const;

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || '';
  return code === '42703' || /column/i.test(message);
};

const toSeconds = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    const numeric = Number(trimmed.replace(',', '.'));
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.round(numeric));
    }

    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const first = Number(timeMatch[1]);
      const second = Number(timeMatch[2]);
      const third = Number(timeMatch[3] || 0);
      if (timeMatch[3]) {
        return Math.max(0, first * 3600 + second * 60 + third);
      }
      return Math.max(0, first * 60 + second);
    }
  }

  return 0;
};

export const fetchProvaRowsByAluno = async (alunoId: string): Promise<ProvaRow[]> => {
  const tempoAttempts: Array<(typeof TEMPO_COLUMNS)[number] | null> = [...TEMPO_COLUMNS, null];
  const dateAttempts: Array<(typeof DATE_COLUMNS)[number] | null> = [...DATE_COLUMNS, null];

  for (const tempoColumn of tempoAttempts) {
    for (const dateColumn of dateAttempts) {
      const fields = ['idteste', 'acerto'];
      if (tempoColumn) fields.push(tempoColumn);
      if (dateColumn) fields.push(dateColumn);
      const selectClause = fields.join(', ');

      const result = await supabase
        .from('tbf_prova')
        .select(selectClause)
        .eq('idaluno', alunoId);

      if (!result.error) {
        const rows = (((result.data as unknown) as RawProvaRow[] | null) || [])
          .map((row) => {
            const idteste = row.idteste;
            if (typeof idteste !== 'string') return null;
            const acerto = Boolean(row.acerto);
            const tempoSegundos = tempoColumn ? toSeconds(row[tempoColumn]) : 0;
            const dateValue = dateColumn ? row[dateColumn] : null;
            const realizadoEm = typeof dateValue === 'string' ? dateValue : null;
            return { idteste, acerto, tempoSegundos, realizadoEm };
          })
          .filter((row): row is ProvaRow => row !== null);

        return rows;
      }

      if (isMissingColumnError(result.error)) {
        continue;
      }

      throw result.error;
    }
  }

  return [];
};

export const insertProvaWithTempo = async (params: {
  alunoId: string;
  testeId: string;
  acerto: boolean;
  tempoSegundos: number;
}) => {
  const basePayload = {
    idaluno: params.alunoId,
    idteste: params.testeId,
    acerto: params.acerto
  };

  const roundedTempo = Math.max(0, Math.round(params.tempoSegundos || 0));
  const attempts: Array<(typeof TEMPO_COLUMNS)[number] | null> = [...TEMPO_COLUMNS, null];

  for (const column of attempts) {
    const payload = column
      ? { ...basePayload, [column]: roundedTempo }
      : basePayload;

    const { error } = await supabase
      .from('tbf_prova')
      .insert([payload]);

    if (!error) return;
    if (column && isMissingColumnError(error)) continue;
    throw error;
  }
};
