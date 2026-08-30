/**
 * Validación de contraseña — misma regex que el backend
 * Requisitos: 7.1, 7.2, 7.3, 7.4
 *
 * Reglas:
 *  - Sin espacios
 *  - Entre 6 y 15 caracteres
 *  - Al menos una mayúscula (incluye Ñ)
 *  - Al menos una minúscula (incluye ñ)
 *  - Al menos un número
 *  - Al menos un carácter especial: $ € # % & _ -
 */

export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[A-ZÑ])(?=.*[a-zñ])(?=.*[$€#%&_-])\S{6,15}$/;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('La contraseña es obligatoria');
    return { valid: false, errors };
  }

  if (/\s/.test(password)) {
    errors.push('La contraseña no puede contener espacios');
  }

  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (password.length > 15) {
    errors.push('La contraseña no puede superar 15 caracteres');
  }

  if (!/[A-ZÑ]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[a-zñ]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[$€#%&_-]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial: $ € # % & _ -');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
