var express = require('express');
var app = express();

// setting up handlebars
var handlebars = require('express-handlebars')
  .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


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
var fileDir = __dirname + '/data';

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
    }

    var image = files.image;
    var dir = fileDir + '/' + Date.now();
    var path = dir + '/' + image.name;

    console.log(fs.mkdirSync(dir));
    fs.renameSync(image.path, dir + '/'+image.name);
    return res.redirect(303, '/error');
    // console.log('received fields:');
    // console.log(fields);
    // console.log('received files:');
    // console.log(files);
    res.redirect(303, '/thank-you')
  })
});
app.get('/thank-you', function(req, res){
  res.render('thank-you');
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