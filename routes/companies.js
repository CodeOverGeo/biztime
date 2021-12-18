// Routes for /companies

const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

let router = new express.Router();

//Get list of companies

router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT code, name
            FROM companies`
    );

    return res.json({ companies: result.rows });
  } catch (e) {
    next(e);
  }
});

//Get specific detail on company using company code

router.get('/:code', async function (req, res, next) {
  try {
    let code = req.params.code;

    const companyResult = await db.query(
      `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
      [code]
    );

    const invoiceResult = await db.query(
      `SELECT id
            FROM invoices
            WHERE comp_code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Company ${code} doesn't exist`, 404);
    }

    const company = companyResult.rows[0];
    const invoices = invoiceResult.rows;

    company.invoices = invoices.map((inv) => inv.id);

    return res.json({ company: company });
  } catch (e) {
    next(e);
  }
});

//Post route for adding companies

router.post('/', async function (req, res, next) {
  try {
    let { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

//Put route for updating existing company

router.put('/:code', async function (req, res, next) {
  try {
    let { name, description } = req.body;
    let code = req.params.code;

    const result = await db.query(
      `UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Company ${code} doesn't exist`, 404);
    } else {
      return res.json({ company: result.rows[0] });
    }
  } catch (e) {
    next(e);
  }
});

//Delete a company

router.delete('/:code', async function (req, res, next) {
  try {
    let code = req.params.code;

    const result = await db.query(
      `DELETE FROM companies
            WHERE code=$1
            RETURNING code`,
      [code]
    );

    if (result.rows.length == 0) {
      throw new ExpressError(`Company ${code} doesn't exist`, 404);
    } else {
      return res.json({ status: 'deleted' });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
