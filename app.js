require('dotenv').config();
require('serve-favicon');
require('passport');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
console.log("Production? " + isProduction);

if(isProduction){
    const options = {
        user: process.env.MONGOU,
        pass: process.env.MONGOP,
        useNewUrlParser: true
    };

    mongoose.connect(process.env.MONGODB_URI, options);
} else {
  mongoose.connect('mongodb://localhost/portfolio', {useNewUrlParser:true});
  mongoose.set('debug', true);
}



require('./models/User');
require('./models/Article');
require('./models/Category');
require('./config/passport');

app.use(require('./routes'));

if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

const server = app.listen( process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});
