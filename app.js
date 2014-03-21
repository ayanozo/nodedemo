
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var redis = require('redis').createClient();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var key = 'hoge:fuga';
var value = 'piyo';

// 文字列を保存する
redis.set(key, value, function(){
  // コールバック
});
//文字列を取得する
redis.get(key, function(err, val){
  // コールバック
  if (err) {
	return console.log(err);
  }
  // エラーが無ければデータを取得できたということ
  console.log(val);
});

//http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});

var server = http.createServer(app);
server.listen(app.get('port'), function(){ //add
	console.log("Express server listening on port " + app.get('port'));
});

var socketIO = require('socket.io');
// クライアントの接続を待つ(IPアドレスとポート番号を結びつけます)
var io = socketIO.listen(server);

// クライアントが接続してきたときの処理
io.sockets.on('connection', function(socket) {
	console.log("connection");
	// メッセージを受けたときの処理
	socket.on('message', function(data) {
		// つながっているクライアント全員に送信
		console.log("message:" + data);
		io.sockets.emit('message', { value: data });
	});
	
	// クライアントが切断したときの処理
	socket.on('disconnect', function(){
		console.log("disconnect");
	});
});
