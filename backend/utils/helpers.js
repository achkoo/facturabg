const { Document } = require('../models');

/**
 * Genera número automático de documento
 */
const generateDocumentNumber = async (companyId, documentType) => {
  try {
    // Obtener el último documento del mismo tipo
    const lastDocument = await Document.findOne({
      where: { 
        companyId,
        documentType 
      },
      order: [['createdAt', 'DESC']]
    });

    // Prefijos por tipo de documento
    const prefixes = {
      invoice: 'INV',
      quote: 'QUO',
      delivery: 'DEL',
      proforma: 'PRO'
    };

    const currentYear = new Date().getFullYear();
    const prefix = prefixes[documentType] || 'DOC';
    
    let nextNumber = 1;
    
    if (lastDocument) {
      // Extraer número del último documento
      const lastNumber = lastDocument.documentNumber.split('-').pop();
      nextNumber = parseInt(lastNumber) + 1;
    }

    // Formatear número con ceros a la izquierda
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    
    return `${prefix}-${currentYear}-${formattedNumber}`;
  } catch (error) {
    console.error('Error generating document number:', error);
    // Fallback con timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `DOC-${new Date().getFullYear()}-${timestamp}`;
  }
};

/**
 * Calcula totales de documento
 */
const calculateTotals = (items) => {
  let subtotal = 0;
  let vatAmount = 0;

  items.forEach(item => {
    const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    const lineVat = lineSubtotal * (parseFloat(item.vatRate) / 100);
    
    subtotal += lineSubtotal;
    vatAmount += lineVat;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round((subtotal + vatAmount) * 100) / 100
  };
};

/**
 * Formatea números para mostrar
 */
const formatCurrency = (amount, currency = 'BGN') => {
  const formatter = new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Formatea fecha en formato búlgaro
 */
const formatDate = (date, locale = 'bg-BG') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Valida EIK búlgaro
 */
const validateEIK = (eik) => {
  if (!eik) return false;
  
  // Remover espacios y guiones
  const cleanEIK = eik.replace(/[\s-]/g, '');
  
  // EIK debe tener 9 o 13 dígitos
  if (!/^\d{9}$|^\d{13}$/.test(cleanEIK)) {
    return false;
  }

  // Algoritmo de validación para EIK de 9 dígitos
  if (cleanEIK.length === 9) {
    const weights = [1, 2, 3, 4, 5, 6, 7, 8];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cleanEIK[i]) * weights[i];
    }
    
    let remainder = sum % 11;
    if (remainder === 10) {
      const alternativeWeights = [3, 4, 5, 6, 7, 8, 9, 10];
      sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanEIK[i]) * alternativeWeights[i];
      }
      remainder = sum % 11;
      if (remainder === 10) remainder = 0;
    }
    
    return remainder === parseInt(cleanEIK[8]);
  }

  return true; // Simplified validation for 13-digit EIK
};

/**
 * Valida IBAN búlgaro
 */
const validateIBAN = (iban) => {
  if (!iban) return false;
  
  // Remover espacios
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  
  // IBAN búlgaro debe tener 22 caracteres y empezar con BG
  if (!/^BG\d{20}$/.test(cleanIBAN)) {
    return false;
  }

  // Algoritmo de validación IBAN mod-97
  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);
  const numericString = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  );
  
  let remainder = '';
  for (let i = 0; i < numericString.length; i += 9) {
    remainder = (parseInt(remainder + numericString.substr(i, 9)) % 97).toString();
  }
  
  return parseInt(remainder) === 1;
};

/**
 * Obtiene configuración de moneda por país
 */
const getCurrencyByLanguage = (language) => {
  const currencies = {
    'bg': 'BGN',
    'es': 'EUR',
    'en': 'EUR'
  };
  
  return currencies[language] || 'BGN';
};

/**
 * Obtiene tasas de IVA por país
 */
const getVATRatesByLanguage = (language) => {
  const vatRates = {
    'bg': [0, 9, 20],
    'es': [0, 10, 21],
    'en': [0, 5, 20] // UK rates as example
  };
  
  return vatRates[language] || [0, 9, 20];
};

/**
 * Convierte números a palabras (para PDFs)
 */
const numberToWords = (amount, language = 'bg') => {
  // Implementación básica - se puede expandir
  const translations = {
    'bg': {
      currency: 'лева',
      cents: 'стотинки',
      zero: 'нула'
    },
    'es': {
      currency: 'euros',
      cents: 'céntimos',
      zero: 'cero'
    },
    'en': {
      currency: 'euros',
      cents: 'cents',
      zero: 'zero'
    }
  };
  
  const t = translations[language] || translations['bg'];
  const wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);
  
  // Implementación simplificada
  return `${wholePart} ${t.currency} ${decimalPart} ${t.cents}`;
};

module.exports = {
  generateDocumentNumber,
  calculateTotals,
  formatCurrency,
  formatDate,
  validateEIK,
  validateIBAN,
  getCurrencyByLanguage,
  getVATRatesByLanguage,
  numberToWords
};