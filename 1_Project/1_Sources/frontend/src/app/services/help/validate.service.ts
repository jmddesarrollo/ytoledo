import { Injectable } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

// Modulo de tiempo
import * as moment from 'moment';

@Injectable()
export class ValidateService {
  constructor() {

  }
  textMax05(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 5) {
      return { maxtext: true };
    }
    return null;
  }
  textMin06(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length < 6) {
      return { mintext: true };
    }
    return null;
  }
  textMax15(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 15) {
      return { maxtext: true };
    }
    return null;
  }
  textMax40(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 40) {
      return { maxtext: true };
    }
    return null;
  }
  textMax45(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 45) {
      return { maxtext: true };
    }
    return null;
  }
  textMax60(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 60) {
      return { maxtext: true };
    }
    return null;
  }
  textMax100(control: FormControl): { [s: string]: boolean } {
    if (control.value === null || control.value.trim().length > 100) {
      return { maxtext: true };
    }
    return null;
  }

  /**
   * Comprobar que las dos contraseñas son iguales
   */
  checkPasswords(group: FormGroup): { [s: string]: boolean } {
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPass').value;
  
    return pass === confirmPass ? null : { notSame: true }     
  }

  /**
   * Validar clave de acceso
   * Sin espacios, mínimo 6 caracteres, máximo 15 caracteres, al menos una letra alfabética en mayúscula y otra en minúscula, al menos un número 
   * y al menos un carácter especial: $€#%&_-
   */
  validatePassword(ePass: string) {
    const regexp = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[$€#%&_-])\S{6,15}$/

    if (!ePass.match(regexp)) { return false; }

    return true;
  }

  /**
   * Validación del formato de una URL
   */
  validateUrl(control: FormControl): { [s: string]: boolean }  {
    const urlRegex = new RegExp(
      '^((ht|f)tp(s?)|(file))\:\/\/'
    );
    if (control.value && !urlRegex.test(control.value.trim())) {
      return { formatoUrl: true };
    }

    return null;
  }

  /**
   * Validación del formato de una URL
   */
  validateUrlPlus(control: FormControl): { [s: string]: boolean }  {
    const urlRegex = new RegExp(
      '^((ht|f)tp(s?)|(file))\:\/\/[0-9a-zA-Z]([-./:\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)( [a-zA-Z0-9\-\.\?\,\’\/\\\+&amp;%\$#_]*)?$'
    );
    if (control.value && !urlRegex.test(control.value.trim())) {
      return { formatoUrlPlus: true };
    }

    return null;
  }

  /**
   * Validación del formato de una IP
   */
  validateIP(control: FormControl): { [s: string]: boolean } {
    const ipRegex = new RegExp(
      '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'
    );
    if (control.value && !ipRegex.test(control.value.trim())) {
      return { formatoIp: true };
    }

    return null;
  }

  /**
   * Validar si es numérico entero
   */
  validateNumericIntegral(num): boolean {
    const numRegex = new RegExp('[0-9]');
    const result = numRegex.test(num);

    return result;
  }

  /**
   * Validar si tiene formato de nombre común
   */
  validateUsualName(text: string): boolean {
    text = text.trim();

    const regexp = new RegExp('^([0-9A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$');
    if (!text.match(regexp)) { return false; }

    return true;
  }

  /**
   * Validar si es numérico
   */
  validateNumeric(num): boolean {
    num = num + '';

    const regexp = /^[+-]?\d+([.|,]\d+)?$/;
    if (!num.match(regexp)) {
      return false;
    }
    return true;
  }

  /**
   * Validar que una cadena no contiene caracteres no permitidos según guía usabilidad 1.0
   */
  validateValueInvalid(text: string, exceptions: string[] = []): any {
    let result = true;
    const lettersInvalid = [];

    const arrInvalids = ['\\', '/', '<', '>', '|', '*', ':', '”', '’', '[', ']', '=', '%', '$', '+',
                            '-', '~', '#', '&', '?', '¿', '^', '`', '´', '!', ';', ',', '{', '}'];
    for(const letter of text) {
      if (arrInvalids.indexOf(letter) >= 0) {
        // Validar si es considerado un caracter de excepción
        const idxExcetion = exceptions.indexOf(letter);
        if (idxExcetion < 0) {
          result = false;
          lettersInvalid.push(letter);
        }
      }
    }
    const response = {
        result,
        data: lettersInvalid
    };

    return response;
  }

  /**
   * Regresa caracteres no válidos según guía de usabilidad 1.0
   */
  getValueInvalid(arrExceptions = null): any {
    const arrInvalid = ['\\', '/', '<', '>', '|', '*', ':', '”', '’', '[', ']', '=', '%', '$', '+', '-',
                            '~', '#', '&', '?', '¿', '^', '`', '´', '!', ';', ',', '{', '}'];

    // Eliminar de la salida posibles excepciones de caracteres
    for (const exception of arrExceptions) {
      arrInvalid.splice(arrInvalid.indexOf(exception), 1);
    }

    return arrInvalid;
  }

  /**
   * Validar formato de fecha YYYY-MM-DD
   * Aunque más sencillo usar momment
   */
  validateDate(eDate: string) {
    eDate = eDate.trim();

    const regexp = /^(19|20)\d{2}-((0[1-9])|(1[0-2]))-((0[1-3])|(1[0-9]|(2[0-9])|3[0-1]))/

    if (!eDate.match(regexp)) { return false; }

    return true;
  }

  /**
   * Validar formato de tiempo HH:MM:SS
   * \1: Repite lo que existe en el primer paréntesis
   */
  validateTime(eTime: string) {
    eTime = eTime.trim();

    const regexp = /^\d\d:((0[0-9])|[1|2|3|4|5][0-9]):\1$/

    if (!eTime.match(regexp)) { return false; }

    return true;    
  }

  /**
   * Validar si la fecha editada es inferior a un año sobre una fecha origen dada
   */
  valSubtractOneYear(dateOrigin: string, dateEdit: string): boolean {
    if (!dateOrigin) {
      dateOrigin = moment().format('YYYY-MM-DD');
    }
    const dateMin = moment(dateOrigin).subtract(1, 'year').format('YYYY-MM-DD');

    const diff = moment(dateEdit).unix() - moment(dateMin).unix();

    if (!diff || diff < 0) {
      return false;
    }

    return true;
  }

  /**
   * Validar si la fecha editada es superior a una década sobre una fecha origen dada
   */
  valAddDecade(dateOrigin: string, dateEdit: string): boolean {
    if (!dateOrigin) {
      dateOrigin = moment().format('YYYY-MM-DD');
    }
    const dateMax = moment(dateOrigin).add(10, 'year').format('YYYY-MM-DD');

    const diff = moment(dateEdit).unix() - moment(dateMax).unix();

    if (!diff || diff > 0) {
      return false;
    }

    return true;
  }

  /**
   * Validar si la fecha final es superior a la fecha inicial
   */
  valDateHigher(dateIni: string, dateFin: string): boolean {
    const diff = moment(dateIni).unix() - moment(dateFin).unix();
    if (diff > 0) {
      return false;
    }
    return true;
  }

  /**
   * Validar valor porcentual
   */
  validateRange(numPorcent): boolean {
    if (!Number.isInteger(numPorcent) || numPorcent < 0 || numPorcent > 100) {
      return false;
    }

    return true;
  }

}
