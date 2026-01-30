import { describe, it, expect } from 'vitest';
import { validateDoubtSubmission } from './validation';

describe('validateDoubtSubmission', () => {
  it('should fail if userId is null', () => {
    const result = validateDoubtSubmission({
      userId: null,
      selectedMateria: 'uuid-materia',
      pergunta: 'Minha dúvida'
    });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('ID de usuário inválido');
  });

  it('should fail if userId is "undefined"', () => {
    const result = validateDoubtSubmission({
      userId: 'undefined',
      selectedMateria: '5a5e631b-5e17-4a49-85a7-6ab0cbc224c1',
      pergunta: 'Minha dúvida'
    });
    expect(result.valid).toBe(false);
  });

  it('should fail if selectedMateria is not a valid UUID', () => {
    const result = validateDoubtSubmission({
      userId: '5a5e631b-5e17-4a49-85a7-6ab0cbc224c1',
      selectedMateria: 'not-a-uuid',
      pergunta: 'Minha dúvida'
    });
    expect(result.valid).toBe(false);
  });

  it('should pass if all fields are valid UUIDs', () => {
    const result = validateDoubtSubmission({
      userId: '5a5e631b-5e17-4a49-85a7-6ab0cbc224c1',
      selectedMateria: '4618ca8f-bd8d-45ff-9ff7-6807f3b742bb',
      pergunta: 'Minha dúvida válida'
    });
    expect(result.valid).toBe(true);
  });
});
