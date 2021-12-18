// Routes for invoices

const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

let router = new express.Router();

//Get all invoices

router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, comp_code
            FROM invoices`
    );

    return res.json({ invoices: result.rows });
  } catch (e) {
    next(e);
  }
});

//Get details on specific invoice

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;

    const result = await db.query(
      `SELECT i.id,
            i.comp_code,
            i.amt,
            i.paid,
            i.add_date,
            i.paid_date,
            c.name,
            c.description
            FROM invoices AS i
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice ${id} doesn't exist`, 404);
    }

    const data = result.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };

    return res.json({ invoice: invoice });
  } catch (e) {
    next(e);
  }
});

// POST route for adding a new invoice

router.post('/', async function (req, res, next) {
  try {
    let { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

// Put route to update an invoice

router.put('/:id', async function (req, res, next) {
  try {
    let { amt, paid } = req.body;
    let id = req.params.id;
    let paidDate = null;

    const result = await db.query(
      `SELECT paid
            FROM invoices
            WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice ${id} doesn't exist`, 404);
    }

    const currPaidDate = result.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
    } else {
      paidDate = currPaidDate;
    }

    const updatedResult = await db.query(
      `UPDATE invoices
        SET amt=$1, paid=$2, paid_date=$3
        WHERE id=$4
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: updatedResult.rows[0] });
  } catch (e) {
    next(e);
  }
});

// Delete an invoice

router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;

    const result = await db.query(
      `DELETE FROM invoices
            WHERE id = $1
            RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice ${id} doesn't exist`, 404);
    }

    return res.json({ status: 'deleted' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
