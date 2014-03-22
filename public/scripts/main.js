function mainCtrl($scope) {
	var socket = io.connect();

	$scope.connectId = '';
	$scope.socketName = '';
	$scope.connectCount = 0;
	$scope.message = '';
	$scope.msgtext = '';
	$scope.loopCount = 0;
	$scope.loopTime = 0;
	$scope.loopAve = 0;
	$scope.redisCount = 0;

	var startTime;
	var currentTime;

	// 接続したとき
	socket.on('connect', function() {
		$scope.connectId = socket.socket.transport.sessid;
		$scope.socketName = socket.socket.transport.name;
		socket.emit('msg_connect', 0);
		$scope.$apply();
	});

	// 接続メッセージを受けたとき
	socket.on('msg_connect', function(msg) {
		$scope.connectCount = msg;
		$scope.$apply();
	});

	// メッセージを受けたとき
	socket.on('msg_message', function(msg) {
		$scope.message = msg;
		$scope.$apply();
	});

	// ループテストメッセージを受けたとき
	socket.on('msg_looptest', function(msg) {
		cuurentTime = new Date();
		var ave = $scope.loopCount / ((cuurentTime - startTime) / 1000);
		$scope.loopAve = Math.floor(ave * 10) / 10
		$scope.loopCount = msg;
		$scope.$apply();
		var btn = $("#loopButton").val();
		if (btn == "ストップ") {
			socket.emit('msg_looptest', $scope.loopCount);
		}
	});

	// redisテストメッセージを受けたとき
	socket.on('msg_redistest', function(msg) {
		$scope.redisCount = msg;
		$scope.$apply();
	});

	// メッセージを送る
	$scope.send = function send() {
		console.log('Sending message:', $scope.msgtext);
		socket.emit('msg_message', $scope.msgtext);
		$scope.msgtext = '';
	};

	// ループテスト開始
	$scope.LoopTestSatrt = function LoopTestSatrt() {
		var btn = $("#loopButton").val();
		if (btn == "スタート") {
			$("#loopButton").val("ストップ");
			startTime = new Date();
			$scope.loopCount = 0;
			socket.emit('msg_looptest', $scope.loopCount);
		} else {
			$("#loopButton").val("スタート");
		}
	};

	// RADISテスト開始
	$scope.RedisTestSatrt = function RedisTestSatrt() {
		socket.emit('msg_redistest', 0);
	};

}
