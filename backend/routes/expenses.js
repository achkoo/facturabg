const express = require('express');
const router = express.Router();
const { Expense, Company, Client } = require('../models');
const auth = require('../middleware/auth');

// GET /api/expenses - Obtener todos los gastos
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { companyId: req.user.companyId },
      include: [
        {
          model: Client,
          as: 'supplier',
          attributes: ['id', 'name']
        }
      ],
      order: [['expenseDate', 'DESC']]
    });

    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gastos'
    });
  }
});

// GET /api/expenses/:id - Obtener un gasto específico
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { 
        id: req.params.id,
        companyId: req.user.companyId 
      },
      include: [
        {
          model: Client,
          as: 'supplier',
          attributes: ['id', 'name', 'eik', 'address']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el gasto'
    });
  }
});

// POST /api/expenses - Crear nuevo gasto
router.post('/', auth, async (req, res) => {
  try {
    const {
      description,
      amount,
      vatAmount,
      total,
      expenseDate,
      category,
      supplierId,
      status = 'pending'
    } = req.body;

    const expense = await Expense.create({
      companyId: req.user.companyId,
      description,
      amount,
      vatAmount: vatAmount || 0,
      total,
      expenseDate,
      category,
      supplierId,
      status
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Gasto creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el gasto'
    });
  }
});

// PUT /api/expenses/:id - Actualizar gasto
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { 
        id: req.params.id,
        companyId: req.user.companyId 
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    await expense.update(req.body);

    res.json({
      success: true,
      data: expense,
      message: 'Gasto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el gasto'
    });
  }
});

// DELETE /api/expenses/:id - Eliminar gasto
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { 
        id: req.params.id,
        companyId: req.user.companyId 
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el gasto'
    });
  }
});

module.exports = router;