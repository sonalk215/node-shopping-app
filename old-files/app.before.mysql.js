//node packages
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
//own files
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
// 3rd party packages
const express = require('express');

const errorController = require('./controllers/error');

const app = express();  //valid request handler

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404)

app.listen(3000);