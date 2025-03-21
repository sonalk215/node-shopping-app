const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();

const products = [];

router.get('/add-product', (req, res, next) => {
  // res.sendFile(path.join(__dirname, '../', 'views', 'add-product.html'));
  // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
  res.render('add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    activeAddProduct: true,
    productCSS: true,
    formsCSS: true,
  })
});

router.post('/add-product', (req, res, next) => {
  console.log('--------', req.body);
  products.push({title: req.body.title})
  res.redirect('/');
});

exports.routes = router;
exports.products = products;