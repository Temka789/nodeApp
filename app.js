var express = require('express');
var app = express();

// setting up handlebars
var handlebars = require('express-handlebars')
  .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');



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
app.post('/load-file', function(req, res){
  var form = new formidabl.IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err) return res.redirect(303, '/error');
    console.log('received fields:');
    console.log(fields);
    console.log('received files:');
    console.log(files);
    res.redirect(303, '/thank-you')
  })
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

app.listen(app.get('port'), function(){
  console.log('Listening ' + app.get('port'));
});