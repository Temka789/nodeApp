var cluster = require('cluster');

function startWorker(){
  var worker = cluster.fork();
  console.log('КЛАСТЕР: Исполнитель %d запущен', worker.id);
}
if(cluster.isMaster){
  require('os').cpus().forEach(function(){
    startWorker();
  });
  // Recording all disconnected workers
  cluster.on('disconnect', function(worker){
    console.log('КЛАСТЕР: Исполнитель %d отключился от кластера.', worker.id);
  });

  // when worker ends works - creating new worker
  cluster.on('exit', function(worker,code,signal){
    console.log('КЛАСТЕР: Исполнитель %d завершил работу' + ' с кодом завершения %d (%s)', worker.id, code, signal);
    startWorker();
  })
}else {
  // starting app
  require('./app.js')();
}