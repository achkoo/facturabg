const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/settings - Obtener configuración
router.get('/', auth, async (req, res) => {
  try {
    // Por ahora devolver configuración básica
    const settings = {
      company: {
        name: 'Mi Empresa EOOD',
        eik: '123456789',
        vatNumber: 'BG123456789',
        address: 'ул. Витоша 1',
        city: 'София',
        email: 'empresa@test.bg',
        phone: '+359888123456'
      },
      invoice: {
        nextNumber: 1,
        prefix: 'INV-2024-',
        vatRates: [0, 9, 20],
        defaultVatRate: 20,
        currency: 'BGN'
      },
      system: {
        language: 'bg',
        timezone: 'Europe/Sofia',
        dateFormat: 'DD/MM/YYYY'
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

// PUT /api/settings - Actualizar configuración
router.put('/', auth, async (req, res) => {
  try {
    // Por ahora solo responder con éxito
    res.json({
      success: true,
      data: req.body,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
});

module.exports = router;