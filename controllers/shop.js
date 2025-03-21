const fs = require('fs');
const stripe = require('stripe')
('sk_test_51POcaaLkOK0qJ8e1a1USgCYnbLxuUNlscqZ50Co3SqMCbhrV7bd280cdxy6oyZDvHxzR4xMdJ6qi8YNcuJEVaCOJ00heitdKxn');
const PDFDocument = require('pdfkit');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

//mongoose
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find().countDocuments()
  .then(numProducts=> {
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then(products=> {
    res.render('shop/product-list', {
      pageTitle: 'All products',
      path: '/products',
      prods: products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

//mongoose
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  
  Product.findById(prodId)
  .then(product => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
      // isAuthenticated: req.session.isLoggedIn,
    });
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

// mongoose
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find().countDocuments()
  .then(numProducts=> {
    console.log('-----', numProducts);
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then(products=> {
    res.render('shop/index', {
      pageTitle: 'Shop',
      path: '/',
      prods: products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

//mongoose
exports.getCart = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  // .execPopulate()
  .then(user=> {
    const products=user.cart.items;
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
    });
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

//mongoose
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product=> {
    return req.user.addToCart(product);
  })
  .then(result=> {
    res.redirect('/cart');
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  })
}

//mongoose
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
  .removeFromCart(prodId)
  .then(result=>{
    res.redirect('/cart');
  })
  .catch(err=>console.log(err));
}

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
  .populate('cart.items.productId')
  .then(user=> {
    products=user.cart.items;
    products.forEach(p=> {
       total += +p.quantity * +p.productId.price;
    });

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map(p => {
        return {
          price_data: {
            currency: "usd",
            unit_amount: parseInt(Math.ceil(p.productId.price * 100)),
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
          },
          quantity: p.quantity,
        }
      }),
      mode: "payment",
      success_url: req.protocol+'://'+ req.get('host') + '/checkout/success',  //=> http://localhost:3000
      cancel_url: req.protocol+'://'+ req.get('host') + '/checkout/cancel',
    })
  })
  .then(session => {
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: products,
      totalSum: total,
      sessionId: session.id,
    });
  })
  .catch(err=>{
    const error= new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .then(user=> {
    const products=user.cart.items.map(i=>{
      return {quantity: i.quantity, product: {...i.productId._doc}}
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products: products,
    });
    return order.save();
  })
  .then(result=> {
    return req.user.clearCart();
  })
  .then(() =>{
    res.redirect('/orders');
  })
  .catch(err=>console.log(err))
}



//mongoose
exports.postOrder = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .then(user=> {
    const products=user.cart.items.map(i=>{
      return {quantity: i.quantity, product: {...i.productId._doc}}
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products: products,
    });
    return order.save();
  })
  .then(result=> {
    return req.user.clearCart();
  })
  .then(() =>{
    res.redirect('/orders');
  })
  .catch(err=>console.log(err))
}
//mongoose
exports.getOrders = (req, res, next) => {
  Order.find({
    'user.userId': req.user._id
  })
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  })
  .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if (!order) {
      return next(new Error('No order found!'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized!'));
    }
    const invoiceName = 'invoice-' + orderId+'.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    const pdfDoc = new PDFDocument();  //readable steam
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true,
    });
    pdfDoc.text('---------------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += totalPrice + prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' * ' + '$' + prod.product.price);
    })
    pdfDoc.text('-----');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

    pdfDoc.end();

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next();
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
    //   res.send(data);
    // })
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
    // file.pipe(res)
  })
  .catch(err=> next(err))
}