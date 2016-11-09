var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
app.use('/', express.static(__dirname + '/www'));
server.listen(80);
var socketList = []; //链接列表
//socket部分，响应事件
io.on('connection', function(socket) {
	//登陆
	socket.on('login', function(socketName) {
		//注册玩家
		user[socketName] = new player(socketName);
		user[socketName].socket = socket;
		//本地存了一个连接列表，这个方法感觉很屎，但够用
		socketList[socketName] = socket;
		socket.emit("loginSuccess");
		sthToDo(user, 'msgSystem', "玩家 " + socketName + " 进入房间", "sysMsg")
	});
    //响应开始游戏
    socket.on('startgame', function(myName) {
        console.log(myName + "点击了开始游戏");
        //通知所有人
        sthToDo(user, 'msgSystem', myName + " 点击了开始游戏", "sysMsg")
        var tmp =[];
        for (var name in user) {
            if (user[name].inGame=="yes") {
                tmp.push(user[name]);
            }
        }



        sthToDo(tmp, 'gameMsg', "游戏开始", "sysMsg")
        sthToDo(tmp, 'gameMsg', "游戏开始", "sysMsg")

        initGame()
    });
    //断线处理
	socket.on('disconnect', function() {});
	//响应加入游戏
	socket.on('joingame', function(socketName) {
		if(user[socketName].inGame == "no") {
			console.log(socketName + "要求坐下");
			sthToDo(user, 'msgSystem', socketName + " 找了个位子坐下", "sysMsg")
			socket.emit("msgSystem", "您已经找了个舒适的座位坐下，请等待游戏开始", "msgPop");
			user[socketName].inGame = "yes"
		} else {
			console.log(socketName + "要求离开");
			sthToDo(user, 'msgSystem', socketName + " 离开了座位", "sysMsg")
			socket.emit("msgSystem", "如果您想加入游戏，请找个座位坐下", "msgPop");
			user[socketName].inGame = "no"
		}
	});
});
//用户链接列表,玩家列表，旁观列表？(是否有意义？)
var user = [],
	gamePlayer = [];
//玩家的资料模型
function player(name) {
	this.name = name;
	this.inGame = "no";
	this.socket = 0;
	this.role = "no";
	this.canbeselect = "true";
	// this.survial = "no";
	// this.addPlyaer = function() {};
	this.isOline = "true";
};
theGame = null; //游戏状态，是否开始，影响到能否加入游戏等
//事件处理,todo动作内容,sth中包含需要传输的数据，where显示位置
function sthToDo(toWho, toDo, sth, where) {
	for(var n in toWho) {
		toWho[n].socket.emit(toDo, sth, where);
	}
}
