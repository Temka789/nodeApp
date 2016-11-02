var express = require('express');
var app = express();

// setting up handlebars
var handlebars = require('express-handlebars')
  .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret
}));

// DB
var mongoose = require('mongoose');
var opts = {
  server: {
    socketOptions: {keepAlive: 1}
  }
};

switch(app.get('env')) {
  case 'development':
    mongoose.connect('mongodb://localhost:27017/test', opts);
    break;
  case 'production':
    mongoose.connect('mongodb://localhost:27017/test', opts);
    break;
  default:
    throw new Error('Неизвестная среда выполнения: ' + app.get('env'));
}


app.use(function(req, res, next){
// создаем домен для этого запроса
  var domain = require('domain').create();
  // обрабатываем ошибки на этом домене
  domain.on('error', function(err){
    console.error('ПЕРЕХВАЧЕНА ОШИБКА ДОМЕНА\n', err.stack);
    try {
      // Отказобезопасный останов через 5 секунд
      setTimeout(function(){
        console.error(' Отказобезопасный останов.');
        process.exit(1);
      }, 5000);
      // Отключение от кластера
      var worker = require('cluster').worker;
      if(worker) worker.disconnect();
      // Прекращение принятия новых запросов
      server.close();
      try {
        // Попытка использовать маршрутизацию
        // ошибок Express
        next(err);
      } catch(err){
        // Если маршрутизация ошибок Express не сработала,
        // пробуем выдать текстовый ответ Node
        console.error('Сбой механизма обработки ошибок ' +
          'Express .\n', err.stack);
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Ошибка сервера.');
      }
    } catch(err){
      console.error('Не могу отправить ответ 500.\n', err.stack);
    }
  });
// Добавляем объекты запроса и ответа в домен
  domain.add(req);
  domain.add(res);
// Выполняем оставшуюся часть цепочки запроса в домене
  domain.run(next);
});

app.set('port', process.env.PORT || 3000);

// setting up static folder for CSS/JS/IMG
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('home');
});

app.get('/load', function(req, res){
  res.render('load');
});
// loading files
var formidable = require('formidable');
var fileDir = __dirname + '/public/';

var fs = require('fs');
fs.existsSync(fileDir) || fs.mkdirSync(fileDir);

app.post('/load-file', function(req, res){
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files){
    if(err){
      res.session.flash = {
        type: 'danger',
        intro: 'Ooops',
        message: 'Error is occurred.'
      };
      return res.redirect(303, '/error');
    }

    var image = files.image;
    var DirLoad = fileDir + '/userImages/';
    // creating image upload directory
    fs.existsSync(DirLoad) || fs.mkdirSync(DirLoad);

    var pathN = require('path');
    var path = DirLoad + '/' + Date.now() + pathN.extname(image.name);

    var is = fs.createReadStream(image.path);
    var os = fs.createWriteStream(path);
    is.pipe(os);
    is.on('end',function() {
      fs.unlinkSync(image.path);
    });


    res.redirect(303, '/thank-you');
  })
});
app.get('/registration', function(req, res){
  res.render('registration');
});
app.get('/login', function(req, res){
  res.render('login');
});


app.post('/register-user', function(req, res){
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if (err) {
      res.session.flash = {
        type: 'danger',
        intro: 'Ooops',
        message: 'Error occurred.'
      };
      return res.redirect(303, '/error');
    }
    if(!fields.name || !fields.lastName || !fields.email || !files.pass1 || !files.pass2 ){
      res.session.flash = {
        type: 'danger',
        intro: 'Ooops',
        message: 'Error occurred.'
      }
      return res.redirect(303, '/registration');
    }

    if( files.pass1 != files.pass2 ) {
      res.session.flash = {
        type: 'danger',
        intro: 'Ooops',
        message: 'Error occurred.'
      };
      return res.redirect(303, '/registration');

    }
    var User = require('./models/vacation');
    new User({
      name: fields.name,
      lastName: fields.lastName,
      email: fields.email,
      pass: files.pass1
    }).save(function(err, product, numAffected){
      if(err){
        // if some error
      }
      if(numAffected === 1){
        // inserteds
      }
    });
  });
  res.redirect(303, '/registration')
});


// 404
app.use(function(req, res){
  res.status(404);
  res.render('404')
});
// 500
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.send('500');
});

function startServer(){
  app.listen(app.get('port'), function(){
    console.log('Listening ' + app.get('port'));
  });
}
if(require.main === module){
  // if started fron this file
  startServer();
}else{
  // if started from cluster
  module.exports = startServer;
}