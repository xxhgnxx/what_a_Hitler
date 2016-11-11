window.onload = function() {
	//建立到服务器的socket连接
};
document.getElementById('nickWrapper').style.display = 'block';
document.getElementById('nicknameInput').focus();
var socket = io.connect();
var socketName = null;
var whoAmI = null; //记录自己的神风
//文字消息处理器，isFrom来源，一般只传送文字信息，
socket.on('msgSystem', function(msg, where) {
	// console.log(msg);
	// console.log(where);
	popMsgToHistory(msg, where);
});
//显示消息的函数，msg消息主体，where显示位置，user消息的发送人，color颜色
function popMsgToHistory(msg, where, user, color) {
	if(where == "msgPop") {
		document.getElementById(where).innerHTML = msg;
	} else {
		var container = document.getElementById(where);
		var msgToDisplay = document.createElement('p');
		msgToDisplay.innerHTML = msg;
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	}
};
//登入，进入
document.getElementById('loginBtn').addEventListener('click', function() {
	//初始化，显示登陆界面
	socket.on('connect', function() {
		//连接到服务器后，显示昵称输入框
	});
	socketName = document.getElementById('nicknameInput').value;
	socketName = String(socketName);
	//检查昵称输入框是否为空
	if(socketName.trim().length != 0) {
		//不为空，则发起一个login事件并将输入的昵称发送到服务器
		socket.emit('login', socketName);
	} else {
		//否则输入框获得焦点
		document.getElementById('nicknameInput').focus();
	};
}, false);
//登陆成功
socket.on('loginSuccess', function(player, theGame) {
	whoAmI = player;
	document.title = document.getElementById('nicknameInput').value + '送希特勒上天';
	document.getElementById('loginWrapper').style.display = 'none';
	document.getElementById('name').innerHTML = socketName + ' 送希特勒上天-神TM希特勒';;
	// document.getElementById('messageInput').focus();
	if(theGame == "游戏已经开始") {
		document.getElementById('name').innerHTML = socketName + ' 旁观送希特勒上天-神TM希特勒';;
		document.title = document.getElementById('nicknameInput').value + '旁观希特勒上天';
		document.getElementById('joingame').style.display = 'none';
		document.getElementById('startgame').style.display = 'none';
		popMsgToHistory("游戏已经开始，您只能旁观", "msgPop");
	}
});
// 找个座位坐下，加入游戏
document.getElementById('joingame').onclick = function(a) {
		//本地直接切换了状态，有风险，一旦传输失败整个系统就会出问题
		if(document.getElementById('joingame').value == "找个座位坐下") {
			document.getElementById('joingame').value = "离开座位"
			whoAmI.inGame = "yes"
			socket.emit('joingame', socketName);
			console.log("坐下");
		} else {
			document.getElementById('joingame').value = "找个座位坐下"
			whoAmI.inGame = "no"
			socket.emit('joingame', socketName);
			console.log("起身");
		}
	}
	//选择总理动作
socket.on('selectPrm', function(myplayerList) {
	console.log("接到selectPrm通知");
	msg = "请从下列玩家中选择一名作为总理";
	popMsgToHistory(msg, "msgPop");
	for(x in myplayerList) {
		document.getElementsByName("who")[x].style.display = 'inline';
		document.getElementsByName("who")[x].value = myplayerList[x].name;
		console.log("选人按钮" + myplayerList[x].name)
		document.getElementsByName("who")[x].onclick = function(a) {
			socket.emit('prmSelect', a);
			for(x in myplayerList) {
				document.getElementsByName("who")[x].style.display = 'none';
			};
		}.bind(undefined, myplayerList[x]);
	};
});
//游戏开始，隐藏ui
socket.on('gameStarted', function() {
	document.getElementById('joingame').style.display = 'none';
	document.getElementById('startgame').style.display = 'none';
	msg = "游戏已经开始，请注意查看自己的身份信息，等待第一届总统行动";
	if(whoAmI.inGame != "yes") {
		document.getElementById('name').innerHTML = socketName + ' 旁观送希特勒上天-神TM希特勒';;
		document.title = document.getElementById('nicknameInput').value + '旁观希特勒上天';
		document.getElementById('joingame').style.display = 'none';
		document.getElementById('startgame').style.display = 'none';
		msg = "游戏已经开始,您只能在旁观看";
	}
	popMsgToHistory(msg, "msgPop");
});
//响应投票请求
socket.on('vote', function() {
	document.getElementById('voteyes').style.display = 'inline';
	document.getElementById('voteno').style.display = 'inline';
});
//选择提案
socket.on('choosePro', function(list, msg) {
	var proISee = "蓝色法案"
	for(x in list) {
		if(list[x] >= 6) {
			proISee = "红色法案";
		} else {
			proISee = "蓝色法案";
		};
		document.getElementsByName("pro")[x].style.display = 'inline';
		document.getElementsByName("pro")[x].value = proISee;
		console.log("选法案按钮" + list[x])
			// document.getElementsByName("who")[x].addEventListener('click', function(a) {
			//
			//     console.log("传参" + a.name);
			//     that.socket.emit('prmSelect', a);
			//     for (x in myplayerList) {
			//         document.getElementsByName("who")[x].style.display = 'none';
			//     };
			// }.bind(undefined, myplayerList[x]), false)
			//
		document.getElementsByName("pro")[x].onclick = function(a) {
			socket.emit('proSelect', a, list);
			for(x in list) {
				document.getElementsByName("pro")[x].style.display = 'none';
			};
		}.bind(undefined, list[x]);
	};
	popMsgToHistory(msg, "msgPop");
});
//调查身份动作
socket.on('invPlayer', function(myplayerList) {
	console.log("接到invPlayer通知");
	msg = "请选择你想调查的人";
	popMsgToHistory(msg, "msgPop");
	for(x in myplayerList) {
		document.getElementsByName("who")[x].style.display = 'inline';
		document.getElementsByName("who")[x].value = myplayerList[x].name;
		console.log("选人按钮" + myplayerList[x].name)
		document.getElementsByName("who")[x].onclick = function(a) {
			socket.emit('invSelect', a);
			for(x in myplayerList) {
				document.getElementsByName("who")[x].style.display = 'none';
			};
		}.bind(undefined, myplayerList[x]);
	};
});
//指定总统动作
socket.on('nextPre', function(myplayerList) {
	console.log("接到nextPre通知");
	msg = "请选择你想指定的下一任总统";
	popMsgToHistory(msg, "msgPop");
	for(x in myplayerList) {
		document.getElementsByName("who")[x].style.display = 'inline';
		document.getElementsByName("who")[x].value = myplayerList[x].name;
		console.log("选人按钮" + myplayerList[x].name)
		document.getElementsByName("who")[x].onclick = function(a) {
			socket.emit('nextPreSelect', a);
			for(x in myplayerList) {
				document.getElementsByName("who")[x].style.display = 'none';
			};
		}.bind(undefined, myplayerList[x]);
	};
});
//枪决玩家动作
socket.on('killPlayer', function(myplayerList) {
	console.log("接到killPlayer通知");
	msg = "请选择你想枪决的人";
	popMsgToHistory(msg, "msgPop");
	for(x in myplayerList) {
		document.getElementsByName("who")[x].style.display = 'inline';
		document.getElementsByName("who")[x].value = myplayerList[x].name;
		console.log("选人按钮" + myplayerList[x].name)
		document.getElementsByName("who")[x].onclick = function(a) {
			socket.emit('killSelect', a);
			for(x in myplayerList) {
				document.getElementsByName("who")[x].style.display = 'none';
			};
		}.bind(undefined, myplayerList[x]);
	};
});
//调查结果通知
socket.on('invRes', function(msg) {
	console.log("接到调查通知");
	popMsgToHistory(msg, "gameMsg");
});
//投票按钮
document.getElementById('voteyes').addEventListener('click', function() {
	document.getElementById('voteyes').style.display = 'none';
	document.getElementById('voteno').style.display = 'none';
	socket.emit('playerVote', socketName, "同意");
}, false)
document.getElementById('voteno').addEventListener('click', function() {
		document.getElementById('voteyes').style.display = 'none';
		document.getElementById('voteno').style.display = 'none';
		socket.emit('playerVote', socketName, "反对");
	}, false)
	// 开始游戏
document.getElementById('startgame').addEventListener('click', function() {
	socket.emit('startgame', socketName);
}, false);
