// Routes for industry

const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');
const slugify = require('slugify');

let router = new express.Router();

router.get('/', async function (req, res, next) {
  try {
    const industries = await db.query(`SELECT code, name FROM industries`);
    const industriesData = await Promise.all(
      industries.rows.map(async function (r) {
        const singleIndustry = await db.query(
          `SELECT i.code, i.name, ic.comp_code 
          FROM industries AS i
            LEFT JOIN comp_ind AS ic
              ON i.code = ic.ind_code
          WHERE i.code = $1`,
          [r.code]
        );
        r.companies = singleIndustry.rows.map((c) => c.comp_code);
        return r;
      })
    );
    return res.json({ industries: industriesData });
  } catch (e) {
    next(e);
  }
});

router.post('/', async function (req, res, next) {
  try {
    let { code, name } = req.body;
    if (!code) {
      code = slugify(name, { lower: true });
    }

    const result = await db.query(
      `INSERT INTO industries (code, name)
            VALUES ($1, $2)
            RETURNING code, name`,
      [code, name]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
