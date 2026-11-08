import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Utilitário corporativo para validação, sanitização e aplicação de máscaras
 * em documentos fiscais brasileiros (CPF e CNPJ).
 */

/**
 * Remove todos os caracteres não numéricos do valor informado.
 */
export function limparDocumento(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.replace(/\D/g, '');
}

/**
 * Aplica máscara dinâmica de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00).
 */
export function formatarCpfCnpj(valor: string | null | undefined): string {
  const digitos = limparDocumento(valor);
  if (!digitos) return '';

  if (digitos.length <= 11) {
    // Formata como CPF: 000.000.000-00
    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // Formata como CNPJ: 00.000.000/0000-00 (limite 14 dígitos)
  return digitos
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Validação algorítmica matemática oficial de CPF (Módulo 11 com verificação de dígitos e bloqueio de sequências repetidas).
 */
export function validarCPF(cpf: string | null | undefined): boolean {
  const digitos = limparDocumento(cpf);
  if (digitos.length !== 11) return false;

  // Rejeita sequências de dígitos idênticos conhecidas (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação algorítmica matemática oficial de CNPJ (Módulo 11 com pesos decrescentes e bloqueio de sequências repetidas).
 */
export function validarCNPJ(cnpj: string | null | undefined): boolean {
  const digitos = limparDocumento(cnpj);
  if (digitos.length !== 14) return false;

  // Rejeita sequências de dígitos idênticos conhecidas
  if (/^(\d)\1{13}$/.test(digitos)) return false;

  // Validação do 1º dígito verificador
  let tamanho = digitos.length - 2;
  let numeros = digitos.substring(0, tamanho);
  const digitosVerificadores = digitos.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitosVerificadores.charAt(0), 10)) return false;

  // Validação do 2º dígito verificador
  tamanho = tamanho + 1;
  numeros = digitos.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitosVerificadores.charAt(1), 10)) return false;

  return true;
}

export interface ResultadoValidacaoDocumento {
  valido: boolean;
  tipo: 'CPF' | 'CNPJ' | 'INDETERMINADO';
  documentoFormatado: string;
  documentoLimpo: string;
  mensagemErro?: string;
}

/**
 * Avalia dinamicamente se o documento é CPF ou CNPJ válido e retorna status e formatação.
 */
export function validarDocumentoFiscal(documento: string | null | undefined, obrigatorio = true): ResultadoValidacaoDocumento {
  const limpo = limparDocumento(documento);

  if (!limpo) {
    if (!obrigatorio) {
      return { valido: true, tipo: 'INDETERMINADO', documentoFormatado: '', documentoLimpo: '' };
    }
    return {
      valido: false,
      tipo: 'INDETERMINADO',
      documentoFormatado: '',
      documentoLimpo: '',
      mensagemErro: 'Documento fiscal (CPF ou CNPJ) é obrigatório.'
    };
  }

  if (limpo.length === 11) {
    const cpfValido = validarCPF(limpo);
    return {
      valido: cpfValido,
      tipo: 'CPF',
      documentoFormatado: formatarCpfCnpj(limpo),
      documentoLimpo: limpo,
      mensagemErro: cpfValido ? undefined : 'CPF inválido. Verifique os dígitos verificadores digitados.'
    };
  }

  if (limpo.length === 14) {
    const cnpjValido = validarCNPJ(limpo);
    return {
      valido: cnpjValido,
      tipo: 'CNPJ',
      documentoFormatado: formatarCpfCnpj(limpo),
      documentoLimpo: limpo,
      mensagemErro: cnpjValido ? undefined : 'CNPJ inválido. Verifique a raiz e os dígitos verificadores.'
    };
  }

  return {
    valido: false,
    tipo: 'INDETERMINADO',
    documentoFormatado: limpo,
    documentoLimpo: limpo,
    mensagemErro: `Tamanho inválido (${limpo.length} dígitos). CPF requer 11 dígitos e CNPJ requer 14 dígitos.`
  };
}

/**
 * Validador síncrono para formulários reativos do Angular (Reactive Forms).
 */
export function cpfCnpjValidator(obrigatorio = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor && !obrigatorio) return null;

    const res = validarDocumentoFiscal(valor, obrigatorio);
    if (res.valido) return null;

    return {
      documentoInvalido: {
        tipo: res.tipo,
        mensagem: res.mensagemErro || 'Documento fiscal inválido.'
      }
    };
  };
}

export function cnpjValidator(obrigatorio = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor && !obrigatorio) return null;
    if (!validarCNPJ(valor)) {
      return { cnpjInvalido: true };
    }
    return null;
  };
}

export function cpfValidator(obrigatorio = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor && !obrigatorio) return null;
    if (!validarCPF(valor)) {
      return { cpfInvalido: true };
    }
    return null;
  };
}
