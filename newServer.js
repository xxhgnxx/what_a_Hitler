var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
app.use('/', express.static(__dirname + '/www'));
server.listen(80);
var socketlist = []; //用户链接列表
//socket部分，响应事件
io.on('connection', function(socket) {
	//登陆
	socket.on('login', function(socketName) {
		//注册玩家
		user[socketName] = new player(socketName);
		user[socketName].socket = socketName;
		socket.name = socketName;
		//本地存了一个连接列表，这个方法感觉很屎，但够用
		socketlist[socketName] = socket;
		sthToDo(user, 'msgSystem', "玩家 " + socketName + " 进入房间", "sysMsg")
			// if(theGame == "游戏已经开始") {
			// 	socket.emit("loginSuccess",user[socketName], "哎呀，游戏已经开始,您只能在旁观看");
			// }
		socket.emit("loginSuccess", user[socketName], theGame);
	});
	//响应开始游戏
	socket.on('startgame', function(myName) {
		console.log(myName + "点击了开始游戏");
		sthToDo(user, 'msgSystem', myName + " 想要开始游戏", "sysMsg")
		var tmp = [];
		for(var name in user) {
			if(user[name].inGame == "yes") {
				tmp.push(user[name]);
			}
		}
		//判断参与游戏的人数
		if(tmp.length >= 5) {
			//通知所有人
			sthToDo(user, 'msgSystem', "玩家就位，游戏开始", "gameMsg")
				//记录游戏状态
			theGame = "游戏已经开始";
			gamePlayer = tmp;
			startgame(gamePlayer);
		} else {
			socket.emit("msgSystem", "游戏人数不足！，请等待玩家入座", "msgPop");
			sthToDo(user, 'msgSystem', "游戏人数不足！ 无法开始游戏，请等待玩家入座", "sysMsg")
		}
		// initGame()
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
			user[socketName].inGame = "no"
		}
	});
	//响应选择了总理
	socket.on('prmSelect', function(player) {
		tmpPrm = user[player.name];
		console.log(socket.name + "选择了" + player.name);
		msg = socket.name + "选择了" + player.name + " 请投票"
			//通知所有人
		sthToDo(user, "msgSystem", msg, "gameMsg");
		//发出投票请求
		sthToDo(gamePlayer, "vote");
	});
	//响应投票结果
	socket.on('playerVote', function(name, res) {
		voteCount = voteCount + 1
		votemsg = votemsg + name + "表示" + res
		if(res == "同意") {
			voteYes = voteYes + 1
		};
		// console.log("投票数" + voteCount);
		//全部投票通知所有人
		if(voteCount >= gamePlayer.length) {
			sthToDo(user, "msgSystem", votemsg, "gameMsg");
			if(voteYes > gamePlayer.length / 2) {
				msg = '全员投票完毕，同意过半，政府组建成功'
				sthToDo(user, "msgSystem", msg, "gameMsg");
				if(proEffRed >= 3 && tmpPrm.role == "hitler") {
					gameOver("法西斯阵营获胜！", "希特勒在国家危机时刻上任总理，")
				} else {
					//选法案
					findPro();
				}
				prm = tmpPrm;
				console.log(prm.name);
			} else {
				var msg = '全员投票完毕，同意未过半，政府组建失败';
				sthToDo(user, "msgSystem", msg, "gameMsg");
				failSystem();
			};
		}
	});
	//响应选择法案
	socket.on('proSelect', function(proDiscard, list) {
		console.log("待选牌堆" + list.length + "张");
		if(list.length == 3) {
			console.log(socket.name + "选择否决了" + proDiscard);
			list.splice(list.indexOf(proDiscard), 1); //从待选牌堆删除该法案
			console.log("待选牌堆" + list);
			msg = "总统" + socket.name + "选择否决了一张法案，等待总理选择法案"
				//通知所有人
			sthToDo(user, "msgSystem", msg, "gameMsg");
			//发出投票请求
			findPro(list);
		} else {
			console.log(socket.name + "选择否决了" + proDiscard);
			list.splice(list.indexOf(proDiscard), 1); //从待选牌堆删除该法案
			console.log("待选牌堆" + list);
			msg = "总理" + socket.name + "选择否决了一张法案，法案生效"
				//通知所有人
			sthToDo(user, "msgSystem", msg, "gameMsg");
			//发出投票请求
			proEff(list[0]) //法案生效
		}
	});
	//响应技能：身份调查
	socket.on('invSelect', function(player) {
		console.log(socket.name + "调查了" + player.name);
		var msg = socket.name + "调查了" + player.name;
		//通知所有人
		sthToDo(user, "msgSystem", msg, "gameMsg");
		//发出调查结果
		if(player.role == "hitler" || player.role == "fascist") {
			var msg = "他是法西斯阵营的人";
		} else {
			var msg = "他是自由党阵营的人";
		}
		socketlist[pre.name].emit('invRes', msg);
		selectPre(prenext) //切换总统 继续游戏
	});
	//响应技能选择总统
	socket.on('nextPreSelect', function(player) {
		pre = user[player.name];
		msg = socket.name + "指定了总统：" + pre.name;
		sthToDo(user, "msgSystem", msg, "gameMsg");
		socketlist[pre.name].emit('msgSystem', "请从下列玩家中选择一名作为总理", "msgPop");
		//投票数归零
		voteCount = 0;
		voteYes = 0;
		votemsg = "";
		socketlist[pre.name].emit('selectPrm', selectPrm(gamePlayer, pre.name));
	});
	//响应技能：枪决
	socket.on('killSelect', function(player) {
		console.log(socket.name + "枪决了" + player.name);
		var msg = socket.name + "代表政府枪决了" + player.name;
		//通知所有人
		sthToDo(user, "msgSystem", msg, "gameMsg");
		//发出调查结果
		if(player.role == "hitler") {
			var msg = "被枪决的人是希特勒";
			gameOver("自由党阵营获胜", "被枪决的人是希特勒，");
		} else {
			//枪毙的是下届总统时，切换下届总统
			if(prenext.name == player.name) {
				console.log(prenext);
				console.log("被枪决的玩家是下届总统");
				console.log(gamePlayer.indexOf(user[player.name]));
				if(gamePlayer[gamePlayer.indexOf(user[player.name]) + 1]) {
					console.log("被枪决的玩家不是队列末位");
					prenext = gamePlayer[gamePlayer.indexOf(user[player.name]) + 1];
					console.log(prenext);
				} else {
					console.log("被枪决的玩家是队列末位");
					prenext = gamePlayer[0];
					console.log(prenext);
				};
			}
			//从玩家列表移除
			gamePlayer.splice(gamePlayer.indexOf(user[player.name]), 1)
			prenext = user[prenext.name];
			selectPre(prenext) //切换总统 继续游戏
		}
		socketlist[player.name].emit('msgSystem', "你已经上天了！老老实实旁边看着吧", "msgPop");
	});
});
//玩家列表，旁观列表？(是否有意义？)
var user = [],
	gamePlayer = [];
//玩家的资料模型
function player(name) {
	this.name = name;
	this.id = 0;
	this.inGame = "no";
	this.socket = 0;
	this.role = "no";
	this.canbeselect = "true";
	// this.survial = "no";
	// this.addPlyaer = function() {};
	this.isOline = "true";
};
theGame = null; //游戏状态，是否开始，影响到能否加入游戏等
var skillList = []; //技能列表
var proList = []; //待选法案堆
//法案牌生成
for(i = 0; i <= 16; i++) {
	proList[i] = i;
}
var proIndex = 16; //牌堆顶
var proEffBlue = 0, //法案生效数
	proEffRed = 0;
var failTimes = 0; //政府组件失败次数
//事件处理,todo动作内容,sth中包含需要传输的数据，where显示位置
function sthToDo(toWho, toDo, sth, where) {
	for(var n in toWho) {
		socketlist[toWho[n].name].emit(toDo, sth, where);
	}
}
//游戏开始入口
function initGame() {
	hitler = null;
	fascist = [];
	liberal = null;
	console.log(countPlyaer() + "名玩家");
	regPlayer();
	selectGame();
	dealCard(gamePlayer.length);
	Shuffle();
	broadcastTo();
	selectPre(gamePlayer[parseInt(Math.random() * gamePlayer.length)])
}

function startgame(gamePlayer) {
	hitler = null;
	fascist = [];
	liberal = [];
	sthToDo(user, "msgSystem", gamePlayer.length + "名玩家开始游戏", "gameMsg");
	sthToDo(user, "gameStarted");
	console.log(gamePlayer.length + "名玩家开始游戏");
	selectGame(gamePlayer.length);
	dealCard(gamePlayer);
	broadcastTo();
	Shuffle();
	selectPre(gamePlayer[parseInt(Math.random() * gamePlayer.length)])
}
//提案牌洗牌
function Shuffle() {
	console.log("提案洗牌");
	proIndex = proList.length - 1; //牌堆顶
	var mytmp = [];
	console.log("提案牌堆" + proList.length + "张");
	for(i = 0; i <= proList.length - 1; i++) {
		mytmp[i] = Math.random();
		proList[i] = mytmp[i];
		mytmp.sort();
	}
	for(i in mytmp) {
		proList[proList.indexOf(mytmp[i])] = i
	}
	console.log("洗牌结果" + proList);
}
//选总统，一轮结束后继续游戏的象征
function selectPre(player) {
	// if (pre) {pre.canbeselect="true";};
	pre = player;
	if(gamePlayer[gamePlayer.indexOf(player) + 1]) {
		prenext = gamePlayer[gamePlayer.indexOf(player) + 1];
	} else {
		prenext = gamePlayer[0];
	};
	msg = "本届总统是" + pre.name;
	// console.log(msg);
	// console.log("下届总统是" + prenext.name);
	sthToDo(user, "msgSystem", msg, "gameMsg");
	socketlist[pre.name].emit('msgSystem', "您是本届总统，请选择总理", "gameMsg");
	//投票数归零
	socketlist[pre.name].emit('msgSystem', "请从下列玩家中选择一名作为总理", "msgPop");
	voteCount = 0;
	voteYes = 0;
	votemsg = "";
	socketlist[pre.name].emit('selectPrm', selectPrm(gamePlayer, pre.name));
	// console.log("命令结束");
}
//制作总统可选列表，输入玩家总表和当前总统
function selectPrm(gamePlayer, pre) {
	var list = gamePlayer.filter(function(t) {
		return t.name != pre
	});
	list = list.filter(function(t) {
		return t.canbeselect == "true"
	});
	// console.log(list);
	console.log("选择总理");
	console.log("红牌生效" + proEffRed + "张");
	return list
}
//选法案，list为空则为总统，list有内容则为总理
function findPro(list) {
	if(!list) {
		console.log("总统选提案");
		sthToDo(user, "msgSystem", "等待总统选择提案", "gameMsg");
		var proTmp = [];
		console.log("牌堆顶位置编号" + proIndex);
		if(proIndex < 2) {
			Shuffle();
		}
		//摸牌
		for(n = proIndex; n >= proIndex - 2; n--) {
			proTmp.push(proList[n]);
			// console.log("摸牌"+n);
		};
		proIndex = proIndex - 3 //摸三张后牌堆顶变换
		console.log("摸牌之后牌堆顶位置编号" + proIndex);
		console.log("待选法案堆" + proTmp);
		socketlist[pre.name].emit('choosePro', proTmp, "总统先生，这是本次的三份提案，请选择您要否决掉的一份");
	} else {
		console.log("总理选提案");
		sthToDo(user, "msgSystem", "等待总理选择提案", "gameMsg");
		console.log(prm);
		socketlist[prm.name].emit('choosePro', list, "总理先生，这是本次的两份提案，请选择您要否决掉的一份");
	}
}
//法案生效,pro为法案编号，t为空时，为正常政府流程，否则强制提案流程
function proEff(pro, force) {
	failTimes = 0;
	console.log(pro);
	if(pro >= 6) {
		console.log("红色提案生效");
		proEffRed = proEffRed + 1;
		sthToDo(user, "msgSystem", "红色提案生效", "gameMsg");
	} else {
		console.log("蓝色提案生效");
		proEffBlue = proEffBlue + 1;
		sthToDo(user, "msgSystem", "蓝色提案生效", "gameMsg");
	}
	if(proEffRed == 6) {
		gameOver("法西斯阵营获胜", "6张独裁法案生效，")
	} else {
		if(proEffBlue == 5) {
			gameOver("自由党阵营获胜", "5张民主法案生效,")
		} else {
			proList.splice(proList.indexOf(pro), 1); //从总牌堆删除生效法案
			for(n in gamePlayer) {
				gamePlayer[n].canbeselect = "true";
			} //上届政府标记归零
			if(!force) {
				if(gamePlayer.length >= 6) {
					pre.canbeselect = "x";
					// console.log(pre);
				};
				prm.canbeselect = "x";
				// console.log(prm);
				// console.log(pre);
				// console.log(findPlyaer(prm.name));
				//添加上届政府标记
			} else {
				//强制生效时，牌堆顶摸走一张
				proIndex = proIndex - 1;
			}
			//红色法案生效，执行技能
			if(pro >= 6) {
				// console.log("执行技能");
				if(skillList[proEffRed - 1] == "x") {
					// console.log("没技能");
					selectPre(prenext); //切换总统 继续游戏
				} else {
					// console.log("有技能");
					skillList[proEffRed - 1]()
				}
			} else {
				selectPre(prenext);
			}
		}
	}
}
//发牌、记录
function dealCard(gamePlayer) {
	console.log("发身份牌");
	this.fascistCount = 0;
	if(gamePlayer.length >= 9) {
		this.fascistCount = 3;
	} else {
		if(gamePlayer.length >= 7) {
			this.fascistCount = 2;
		} else {
			if(gamePlayer.length >= 5) {
				this.fascistCount = 1;
			} else {
				console.log("人数不足");
			}
		}
	}
	this.liberalCount = gamePlayer.length - 1 - this.fascistCount;
	var msg = "本局游戏，希特勒1名，法西斯" + this.fascistCount + "名，自由党" + this.liberalCount + "名";
	console.log(msg);
	sthToDo(user, 'msgSystem', msg, "gameMsg");
	var myRank = [];
	gamePlayer.filter(function(t) {
		t.id = Math.random();
		myRank.push(t.id);
		t.role = "liberal";
	});
	myRank.sort();
	gamePlayer.filter(function(t) {
		return t.id == myRank[0];
	})[0].role = "hitler";
	for(i = 1; i <= this.fascistCount; i++) {
		gamePlayer.filter(function(t) {
			return t.id == myRank[i];
		})[0].role = "fascist";
	};
};
// 通知玩家游戏开始
function
broadcastTo() {
	console.log("通知玩家");
	gamePlayer.filter(function(t) {
		if(t.role == "hitler") {
			hitler = t;
			socketlist[t.name].emit('msgSystem', "你是希特勒", "gameMsg");
		};
		if(t.role == "fascist") {
			fascist.push(t);
			socketlist[t.name].emit('msgSystem', "你是法西斯", "gameMsg");
		};
		if(t.role == "liberal") {
			liberal.push(t);
			socketlist[t.name].emit('msgSystem', "你是自由党", "gameMsg");
		};
	});
	gamePlayer.filter(function(t) {
		var msg = " ";
		for(x in fascist) {
			msg = msg + fascist[x].name + " ";
		};
		msg = msg + "是你的法西斯队友 ";
		if(t.role == "hitler") {
			if(gamePlayer.length >= 7) {
				socketlist[t.name].emit('msgSystem', "你啥也不知道", "gameMsg");
			} else {
				socketlist[t.name].emit('msgSystem', msg, "gameMsg");
			};
		};
		msg = msg + hitler.name + " 是希特勒";
		if(t.role == "fascist") {
			socketlist[t.name].emit('msgSystem', msg, "gameMsg");
		};
		if(t.role == "liberal") {
			socketlist[t.name].emit('msgSystem', "你啥也不知道", "gameMsg");
		};
	});
};
//3种游戏模式选择
function selectGame(plyaerCount) {
	console.log("根据人数选择本局游戏规则");
	if(plyaerCount >= 9) {
		console.log("选择9-10人游戏");
		skillList[0] = invPlayer
		skillList[1] = invPlayer
		skillList[2] = setPre
		skillList[3] = toKill
		skillList[4] = toKill
	} else {
		if(plyaerCount >= 7) {
			console.log("选择7-8人游戏");
			skillList[0] = "x"
			skillList[1] = invPlayer
			skillList[2] = setPre
			skillList[3] = toKill
			skillList[4] = toKill
		} else {
			if(plyaerCount >= 5) {
				console.log("选择5-6人游戏");
				skillList[0] = "x"
				skillList[1] = "x"
				skillList[2] = toLookPro
				skillList[3] = toKill
				skillList[4] = toKill
			} else {
				console.log("人数不足");
			}
		}
	}
};
//技能：调查身份
function invPlayer() {
	console.log("总统 调查身份");
	var list = gamePlayer.filter(function(t) {
		return t.name != pre.name
	});
	sthToDo(user, "msgSystem", "等待总统进行身份调查", "gameMsg");
	socketlist[pre.name].emit('invPlayer', list);
}
//技能：指定总统
function setPre() {
	console.log("总统 指定总统");
	var list = gamePlayer.filter(function(t) {
		return t.name != pre.name
	});
	sthToDo(user, "msgSystem", "等待总统指定下一任总统", "gameMsg");
	socketlist[pre.name].emit('nextPre', list);
}
//技能：枪决
function toKill() {
	console.log("总统 枪决一人");
	var list = gamePlayer.filter(function(t) {
		return t.name != pre.name
	});
	sthToDo(user, "msgSystem", "等待总统决定枪决目标", "gameMsg");
	socketlist[pre.name].emit('killPlayer', list);
	console.log("被枪决玩家需要取消操作权限..待添加");
}
//技能：查看法案
function toLookPro() {
	console.log("总统 查看三张法案");
	sthToDo(user, "msgSystem", "总统查看了接下来的三张法案", "gameMsg");
	var msg = "法案牌堆顶依次是: ";
	for(i = 0; i <= 2; i++) {
		if(proList[proIndex - i] >= 6) {
			msg = msg + "红色法案 "
		} else {
			msg = msg + "蓝色法案 "
		}
	}
	socketlist[pre.name].emit('invRes', msg);
	selectPre(prenext);
}
//政府组建失败处理，调用proEff，t=1
function failSystem() {
	failTimes = failTimes + 1;
	if(failTimes == 3) {
		var msg = '连续三次组建政府失败，强行执行法案牌的第一张法案,';
		sthToDo(user, "msgSystem", msg, "gameMsg");
		proEff(proList[proIndex], 1);
	} else {
		selectPre(prenext);
	}
}
//游戏结束，获胜方wingroup，获胜原因reason
function gameOver(wingroup, reason) {
	var msg = reason + wingroup
	sthToDo(user, "msgSystem", msg, "gameMsg");
}
