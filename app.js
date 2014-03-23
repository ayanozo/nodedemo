
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var routeslogin = require('./routes/login');
var http = require('http');
var path = require('path');
var redis = require('redis').createClient();

//ハッシュ値を求めるために必要なもの
var crypto = require("crypto");
var secretKey = "some_random_secret";   // シークレットは適当に変えてください
var getHash = function(target){
        var sha = crypto.createHmac("sha256", secretKey);
            sha.update(target);
                return sha.digest("hex");
};
 
// passportで必要なもの
var flash = require("connect-flash")
  , passport = require("passport")
  , LocalStrategy = require("passport-local").Strategy;
 
// MongoDBを使うのに必要なもの
var mongoose = require("mongoose");
 
//ユーザーのモデルを作成
var db = mongoose.createConnection("mongodb://localhost/passporttest", function(error, res){});
var UserSchema = new mongoose.Schema({
    email: {type: String, required: true},
    password: {type: String, requird: true}
});
var User = db.model("User", UserSchema);
 
// サーバー起動時にユーザーが無ければ、テスト用のデータを投入します。
// 間違っても本番用のサーバーにこんなコードを入れちゃ駄目です。
//console.log("db user :" + User.count({}));
//if(User.count({}) == 0){
/**
	console.log("db user create!!");
    var aaaUser = new User();
    aaaUser.email = "aaa@example.com";
    aaaUser.password = getHash("aaa");
    aaaUser.save();
**/
//}

//LOcalStrategyを使う設定
passport.use(new LocalStrategy(
  // フォームの名前をオプションとして渡す。
  // 今回はusernameの代わりにemailを使っているので、指定が必要
  {usernameField: "email", passwordField: "password"},
  function(email, password, done){
    // 非同期で処理させるといいらしいです
    process.nextTick(function(){
        User.findOne({email: email}, function(err, user){
            if(err)
                return done(err);
            if(!user)
                return done(null, false, {message: "ユーザーが見つかりませんでした。"});
            var hashedPassword = getHash(password);
            if(user.password !== hashedPassword)
                return done(null, false, {message: "パスワードが間違っています。"});
            return done(null, user);
        });
    });
}));
 
// リクエストがあったとき、ログイン済みかどうか確認する関数
var isLogined = function(req, res, next){
    if(req.isAuthenticated())
        return next();  // ログイン済み
    // ログインしてなかったらログイン画面に飛ばす
    res.redirect("/login");
};
 

var app = express();

//all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: "another_random_sevret_again"}));  // こちらにも別のシークレットが必要です
 
//app.router を使う前にpassportの設定が必要です
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
 

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

var connectCounter = 0;//接続数のカウンタ


app.get('/', routes.index);
app.get('/users', user.list);
//app.get('/login', routeslogin.index);
/**/
app.get("/login", function(req, res){
	req.flash("test");
    res.render("login", {user: req.user, message: req.flash("error")});
});
/**/

app.post("/login",
	    passport.authenticate("local", {failureRedirect: '/login', failureFlash: true}),
	    function(req, res){
			console.log("authenticate ok");
	        // ログインに成功したらトップへリダイレクト
	        res.redirect("/");
	    });

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});
app.get("/member_only", isLogined, function(req, res){
    res.render("member_only", {user: req.user});
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
	connectCounter++;
	console.log("connection");
	
	// クライアントが切断したときの処理
	socket.on('disconnect', function(){
		connectCounter--;
		io.sockets.emit('msg_connect', connectCounter);
	});

	// メッセージを受けたときの処理
	socket.on('msg_message', function(data) {
		// クライアント全員に送信
		socket.emit('msg_message', data);
	});
	
	// メッセージを受けたときの処理
	socket.on('msg_connect', function(data) {
		// つながっているクライアント全員に送信
		console.log("connection:" + connectCounter);
		io.sockets.emit('msg_connect', connectCounter);
	});
	
	// ループテストメッセージを受けたときの処理
	socket.on('msg_looptest', function(data) {
		// クライアント全員に送信
		data++;
		socket.emit('msg_looptest', data);
	});
	
	// REDISテストメッセージを受けたときの処理
	socket.on('msg_redistest', function(data) {
		var key = 'redis:count';
		//カウントアップ
		redis.incr(key, function(err, val){
			// コールバック
			if (err) {
				return console.log(err);
			}
			// エラーが無ければデータを取得できたということ
			socket.emit('msg_redistest', val);
		});
	});
	
});

