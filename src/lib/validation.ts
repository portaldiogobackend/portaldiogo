const isInvalidUUID = (uuid: string | null | undefined) => {
  if (!uuid) return true;
  if (uuid === 'undefined' || uuid === 'null') return true;
  // Basic UUID format check (8-4-4-4-12 hex)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(uuid);
};

export const validateDoubtSubmission = (data: {
  userId: string | null;
  selectedMateria: string;
  pergunta: string;
  editingId?: string;
}) => {
  if (isInvalidUUID(data.userId)) {
    return { valid: false, message: 'ID de usuário inválido. Por favor, faça login novamente.' };
  }

  if (isInvalidUUID(data.selectedMateria)) {
    return { valid: false, message: 'Por favor, selecione uma matéria válida.' };
  }

  if (!data.pergunta.trim()) {
    return { valid: false, message: 'A pergunta não pode estar vazia.' };
  }

  if (data.editingId !== undefined && isInvalidUUID(data.editingId)) {
    return { valid: false, message: 'ID da dúvida inválido para edição.' };
  }

  return { valid: true };
};
