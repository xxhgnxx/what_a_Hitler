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
        sthToDo(user, 'msgSystem', "玩家 " + socketName + " 进入房间", "sysMsg")
        if(theGame == "游戏已经开始") {
            socket.emit("loginSuccess", "游戏已经开始,您只能在旁观看");
        }
        socket.emit("loginSuccess");
    });
    //响应开始游戏
    socket.on('startgame', function(myName) {
        console.log(myName + "点击了开始游戏");
        var tmp = [];
        for(var name in user) {
            if(user[name].inGame == "yes") {
                tmp.push(user[name]);
            }
            //判断参与游戏的人数
            if(tmp.length >= 5) {
                //通知所有人
                sthToDo(user, 'msgSystem', myName + " 点击了开始游戏", "sysMsg")
                sthToDo(tmp, 'gameMsg', "游戏开始", "sysMsg")
                    //记录游戏状态
                theGame = "游戏已经开始";
                gamePlayer = tmp;
                startgame(gamePlayer);
            }
        } else {
            socket.emit("msgSystem", "游戏人数不足！", "msgPop");
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
var    proList = []; //待选法案堆
var proIndex = 16; //牌堆顶
//事件处理,todo动作内容,sth中包含需要传输的数据，where显示位置
function sthToDo(toWho, toDo, sth, where) {
    for(var n in toWho) {
        toWho[n].socket.emit(toDo, sth, where);
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
    dealCard(plyaerCount);
    Shuffle();
    broadcastTo();
    selectPre(gamePlayer[parseInt(Math.random() * plyaerCount)])
}

function startgame(gamePlayer) {
    hitler = null;
    fascist = [];
    liberal = [];
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
    io.sockets.emit('hgnsystem', pre.name, msg);


    nicknames[pre.name].emit('broadcastTo', "您是本届总统，请选择总理");
    //投票数归零
    voteCount = 0;
    voteYes = 0;
    votemsg = "";
    nicknames[pre.name].emit('selectPrm', selectPrm(gamePlayer, pre.name));
}


//发牌、记录
function dealCard(gamePlayer) {
    console.log("发身份牌");
    this.fascistCount = 0;
    if(plyaerCount >= 9) {
        this.fascistCount = 3;
    } else {
        if(plyaerCount >= 7) {
            this.fascistCount = 2;
        } else {
            if(plyaerCount >= 5) {
                this.fascistCount = 1;
            } else {
                console.log("人数不足");
            }
        }
    }
    this.liberalCount = plyaerCount - 1 - this.fascistCount;
    var msg = "本局游戏，希特勒1名，法西斯" + this.fascistCount + "名，自由党" + this.liberalCount + "名";
    console.log(msg);
    sthToDo(socketList, 'msgSystem', msg, "gameMsg");
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
            nicknames[t.name].socket.emit('msgSystem', "你是希特勒", "gameMsg");
        };
        if(t.role == "fascist") {
            fascist.push(t);
            nicknames[t.name].socket.emit('msgSystem', "你是法西斯", "gameMsg");
        };
        if(t.role == "liberal") {
            liberal.push(t);
            nicknames[t.name].socket.emit('msgSystem', "你是自由党", "gameMsg");
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
                nicknames[t.name].socket.emit('msgSystem', "你啥也不知道", "gameMsg");
            } else {
                nicknames[t.name].socket.emit('msgSystem', msg, "gameMsg");
            };
        };
        msg = msg + hitler.name + " 是希特勒";
        if(t.role == "fascist") {
            nicknames[t.name].socket.emit('msgSystem', msg, "gameMsg");
        };
        if(t.role == "liberal") {
            nicknames[t.name].socket.emit('msgSystem', "你啥也不知道", "gameMsg");
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
//游戏结束，获胜方wingroup，获胜原因reason
function gameOver(wingroup, reason) {
    var msg = reason + wingroup
    io.sockets.emit('hgnsystem', "system", msg);
}
