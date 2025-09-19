const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatDate, formatCurrency, numberToWords } = require('./helpers');

// Traducciones para PDFs
const translations = {
  bg: {
    invoice: 'ФАКТУРА',
    quote: 'ОФЕРТА', 
    delivery: 'ДОСТАВНА РАЗПИСКА',
    proforma: 'ПРОФОРМА ФАКТУРА',
    client: 'Клиент',
    supplier: 'Доставчик',
    documentNumber: 'Номер',
    documentDate: 'Дата',
    dueDate: 'Падеж',
    description: 'Описание',
    quantity: 'Количество',
    unitPrice: 'Ед. цена',
    vatRate: 'ДДС %',
    amount: 'Сума',
    subtotal: 'Междинна сума',
    vat: 'ДДС',
    total: 'ОБЩО',
    totalInWords: 'С думи',
    paymentInfo: 'Информация за плащане',
    bankAccount: 'Банкова сметка',
    notes: 'Бележки',
    page: 'Стр.',
    of: 'от',
    currency: 'лв.',
    thankYou: 'Благодарим Ви за доверието!'
  },
  es: {
    invoice: 'FACTURA',
    quote: 'PRESUPUESTO',
    delivery: 'ALBARÁN',
    proforma: 'FACTURA PROFORMA',
    client: 'Cliente',
    supplier: 'Proveedor',
    documentNumber: 'Número',
    documentDate: 'Fecha',
    dueDate: 'Vencimiento',
    description: 'Descripción',
    quantity: 'Cantidad',
    unitPrice: 'Precio unit.',
    vatRate: 'IVA %',
    amount: 'Importe',
    subtotal: 'Subtotal',
    vat: 'IVA',
    total: 'TOTAL',
    totalInWords: 'En letras',
    paymentInfo: 'Información de pago',
    bankAccount: 'Cuenta bancaria',
    notes: 'Notas',
    page: 'Pág.',
    of: 'de',
    currency: '€',
    thankYou: '¡Gracias por su confianza!'
  },
  en: {
    invoice: 'INVOICE',
    quote: 'QUOTE',
    delivery: 'DELIVERY NOTE',
    proforma: 'PROFORMA INVOICE',
    client: 'Client',
    supplier: 'Supplier',
    documentNumber: 'Number',
    documentDate: 'Date',
    dueDate: 'Due Date',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    vatRate: 'VAT %',
    amount: 'Amount',
    subtotal: 'Subtotal',
    vat: 'VAT',
    total: 'TOTAL',
    totalInWords: 'In words',
    paymentInfo: 'Payment Information',
    bankAccount: 'Bank Account',
    notes: 'Notes',
    page: 'Page',
    of: 'of',
    currency: '€',
    thankYou: 'Thank you for your trust!'
  }
};

/**
 * Genera PDF de documento
 */
const generatePDF = async (document) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `${document.documentType.toUpperCase()} ${document.documentNumber}`,
          Author: document.company?.name || 'Sistema de Facturación',
          Subject: `${document.documentType} para ${document.client?.name}`,
          Keywords: 'factura, bulgaria, pdf'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      const lang = document.language || 'bg';
      const t = translations[lang] || translations.bg;

      // Configurar fuente
      const fontPath = path.join(__dirname, '../fonts');
      let regularFont = 'Helvetica';
      let boldFont = 'Helvetica-Bold';

      // Para textos en búlgaro, usar fuente que soporte cirílico
      if (lang === 'bg') {
        try {
          if (fs.existsSync(path.join(fontPath, 'DejaVuSans.ttf'))) {
            doc.registerFont('DejaVu', path.join(fontPath, 'DejaVuSans.ttf'));
            doc.registerFont('DejaVu-Bold', path.join(fontPath, 'DejaVuSans-Bold.ttf'));
            regularFont = 'DejaVu';
            boldFont = 'DejaVu-Bold';
          }
        } catch (error) {
          console.warn('Fuentes DejaVu no encontradas, usando Helvetica');
        }
      }

      // Header con logo y datos de empresa
      addHeader(doc, document, t, boldFont, regularFont);

      // Información del documento
      addDocumentInfo(doc, document, t, boldFont, regularFont);

      // Datos del cliente
      addClientInfo(doc, document, t, boldFont, regularFont);

      // Tabla de productos/servicios
      addItemsTable(doc, document, t, boldFont, regularFont);

      // Totales
      addTotals(doc, document, t, lang, boldFont, regularFont);

      // Información de pago
      addPaymentInfo(doc, document, t, boldFont, regularFont);

      // Notas
      if (document.notes) {
        addNotes(doc, document, t, boldFont, regularFont);
      }

      // Footer
      addFooter(doc, document, t, regularFont);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Agrega header con logo y datos de empresa
 */
const addHeader = (doc, document, t, boldFont, regularFont) => {
  const company = document.company || {};
  
  // Logo (si existe)
  if (company.logo) {
    try {
      const logoPath = path.join(__dirname, '../uploads', company.logo);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
      }
    } catch (error) {
      console.warn('Error cargando logo:', error);
    }
  }

  // Título del documento
  doc.font(boldFont)
     .fontSize(24)
     .fillColor('#2563eb')
     .text(t[document.documentType] || t.invoice, 350, 50, { align: 'right' });

  // Datos de la empresa
  doc.font(boldFont)
     .fontSize(14)
     .fillColor('#000000')
     .text(company.name || 'Mi Empresa EOOD', 50, 120);

  doc.font(regularFont)
     .fontSize(10)
     .text(`ЕИК: ${company.eik || ''}`, 50, 140)
     .text(`ДДС №: ${company.vatNumber || ''}`, 50, 155)
     .text(company.address || '', 50, 170)
     .text(`${company.city || ''}, България`, 50, 185)
     .text(`Тел: ${company.phone || ''}`, 50, 200)
     .text(`Email: ${company.email || ''}`, 50, 215);

  // Línea separadora
  doc.moveTo(50, 240)
     .lineTo(550, 240)
     .stroke('#cccccc');
};

/**
 * Agrega información del documento
 */
const addDocumentInfo = (doc, document, t, boldFont, regularFont) => {
  const startY = 260;
  
  doc.font(boldFont)
     .fontSize(12)
     .text(`${t.documentNumber}:`, 350, startY)
     .text(`${t.documentDate}:`, 350, startY + 20);

  if (document.dueDate) {
    doc.text(`${t.dueDate}:`, 350, startY + 40);
  }

  doc.font(regularFont)
     .text(document.documentNumber, 450, startY)
     .text(formatDate(document.documentDate), 450, startY + 20);

  if (document.dueDate) {
    doc.text(formatDate(document.dueDate), 450, startY + 40);
  }
};

/**
 * Agrega información del cliente
 */
const addClientInfo = (doc, document, t, boldFont, regularFont) => {
  const client = document.client || {};
  const startY = 260;

  doc.font(boldFont)
     .fontSize(12)
     .text(`${t.client}:`, 50, startY);

  doc.font(boldFont)
     .fontSize(11)
     .text(client.name || '', 50, startY + 20);

  doc.font(regularFont)
     .fontSize(10)
     .text(`ЕИК: ${client.eik || ''}`, 50, startY + 40)
     .text(`ДДС №: ${client.vatNumber || ''}`, 50, startY + 55)
     .text(client.address || '', 50, startY + 70)
     .text(client.city || '', 50, startY + 85);
};

/**
 * Agrega tabla de productos/servicios
 */
const addItemsTable = (doc, document, t, boldFont, regularFont) => {
  const items = document.items || [];
  let currentY = 360;

  // Headers de tabla
  const tableHeaders = [
    { text: '№', x: 50, width: 30 },
    { text: t.description, x: 80, width: 200 },
    { text: t.quantity, x: 280, width: 60 },
    { text: t.unitPrice, x: 340, width: 60 },
    { text: t.vatRate, x: 400, width: 50 },
    { text: t.amount, x: 450, width: 100 }
  ];

  // Fondo del header
  doc.rect(50, currentY, 500, 25)
     .fill('#f3f4f6');

  // Texto del header
  doc.fillColor('#000000')
     .font(boldFont)
     .fontSize(9);

  tableHeaders.forEach(header => {
    doc.text(header.text, header.x, currentY + 8, {
      width: header.width,
      align: header.x > 300 ? 'right' : 'left'
    });
  });

  currentY += 25;

  // Filas de items
  doc.font(regularFont)
     .fontSize(9);

  items.forEach((item, index) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const lineTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    const vatAmount = lineTotal * (parseFloat(item.vatRate) / 100);
    const totalWithVat = lineTotal + vatAmount;

    // Fondo alternado
    if (index % 2 === 1) {
      doc.rect(50, currentY, 500, 20)
         .fill('#f9fafb');
    }

    doc.fillColor('#000000')
       .text((index + 1).toString(), 50, currentY + 5, { width: 30, align: 'center' })
       .text(item.description, 80, currentY + 5, { width: 200 })
       .text(parseFloat(item.quantity).toFixed(2), 280, currentY + 5, { width: 60, align: 'right' })
       .text(parseFloat(item.unitPrice).toFixed(2), 340, currentY + 5, { width: 60, align: 'right' })
       .text(`${parseFloat(item.vatRate).toFixed(0)}%`, 400, currentY + 5, { width: 50, align: 'right' })
       .text(totalWithVat.toFixed(2), 450, currentY + 5, { width: 100, align: 'right' });

    currentY += 20;
  });

  // Línea final de tabla
  doc.moveTo(50, currentY)
     .lineTo(550, currentY)
     .stroke('#cccccc');

  return currentY + 10;
};

/**
 * Agrega totales
 */
const addTotals = (doc, document, t, lang, boldFont, regularFont) => {
  const startY = doc.y + 20;
  const subtotal = parseFloat(document.subtotal || 0);
  const vatAmount = parseFloat(document.vatAmount || 0);
  const total = parseFloat(document.total || 0);

  // Subtotal
  doc.font(regularFont)
     .fontSize(11)
     .text(`${t.subtotal}:`, 350, startY)
     .text(`${subtotal.toFixed(2)} ${t.currency}`, 450, startY, { align: 'right' });

  // IVA
  doc.text(`${t.vat}:`, 350, startY + 20)
     .text(`${vatAmount.toFixed(2)} ${t.currency}`, 450, startY + 20, { align: 'right' });

  // Total
  doc.font(boldFont)
     .fontSize(14)
     .fillColor('#2563eb')
     .text(`${t.total}:`, 350, startY + 45)
     .text(`${total.toFixed(2)} ${t.currency}`, 450, startY + 45, { align: 'right' });

  // Total en palabras
  doc.font(regularFont)
     .fontSize(10)
     .fillColor('#666666')
     .text(`${t.totalInWords}: ${numberToWords(total, lang)}`, 50, startY + 70, { width: 500 });
};

/**
 * Agrega información de pago
 */
const addPaymentInfo = (doc, document, t, boldFont, regularFont) => {
  const company = document.company || {};
  const startY = doc.y + 30;

  if (company.bankName && company.iban) {
    doc.font(boldFont)
       .fontSize(11)
       .fillColor('#000000')
       .text(`${t.paymentInfo}:`, 50, startY);

    doc.font(regularFont)
       .fontSize(10)
       .text(`${t.bankAccount}: ${company.bankName}`, 50, startY + 20)
       .text(`IBAN: ${company.iban}`, 50, startY + 35)
       .text(`BIC: ${company.bic || ''}`, 50, startY + 50);
  }
};

/**
 * Agrega notas
 */
const addNotes = (doc, document, t, boldFont, regularFont) => {
  const startY = doc.y + 30;

  doc.font(boldFont)
     .fontSize(11)
     .text(`${t.notes}:`, 50, startY);

  doc.font(regularFont)
     .fontSize(10)
     .text(document.notes, 50, startY + 20, { width: 500 });
};

/**
 * Agrega footer
 */
const addFooter = (doc, document, t, regularFont) => {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Mensaje de agradecimiento
    doc.font(regularFont)
       .fontSize(10)
       .fillColor('#666666')
       .text(t.thankYou, 50, 750, { align: 'center', width: 500 });

    // Número de página
    doc.text(`${t.page} ${i + 1} ${t.of} ${pageCount}`, 0, 780, { align: 'center' });
  }
};

module.exports = {
  generatePDF
};