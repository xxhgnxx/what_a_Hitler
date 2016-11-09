//服务器及页面部分
var express = require('express'),
    app = express(),
    nicknames = [],
    allPlayers = [],
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = []; //保存所有在线用户的昵称
var plyaerCount = 0; //游戏开始时在线玩家，本局玩家参与人数
var gamePlayer = []; //游戏开始后玩家的列表
var hitler = null, //一大堆乱七八糟的声明
    fascist = [],
    votemsg = "",
    voteCount = 0,
    voteYes = 0,
    pre = null,
    prenext = null,
    prm = null,
    failTimes = 0, //政府失败次数
    tmpPrm = null, //被提名的总理
    willprm = [], //总理候选人列表
    playerSeat = [],
    proList = [], //待选法案堆
    discard = [], //弃牌堆
    fascBroad = [], //法西斯提案
    liberBroad = [], //自由党提案
    proIndex = 16, //牌堆顶
    liberal = null;
var proEffBlue = 0, //法案生效数
    proEffRed = 0;
var skillList = []; //技能列表
//法案牌生成
for(i = 0; i <= 16; i++) {
    proList[i] = i;
}
//web部分
app.use('/', express.static(__dirname + '/www'));
server.listen(80);
//socket部分
io.on('connection', function(socket) {
    //登陆
    socket.on('login', function(nickname) {
        socket.name = nickname;
        nicknames[nickname] = socket;
        if(!findPlyaer(nickname)) {
            var tmp = new player(nickname);
            allPlayers.push(tmp);
            io.sockets.emit('hgnsystem', nickname, 'new');
        } else {
            io.sockets.emit('hgnsystem', nickname, 'back')
            findPlyaer(nickname).isOline = "true";
        }
    });
    //断线(刷新页面)
    socket.on('disconnect', function() {
        // console.log("触发断开事件");
        //将断开连接的用户从users中删除
        // users.splice(socket.userIndex, 1);
        // console.log(socket.name)
        if(findPlyaer(socket.name)) {
            findPlyaer(socket.name).isOline = "false";
            //通知除自己以外的所有人
            socket.broadcast.emit('hgnsystem', socket.name, 'logout');
            delete nicknames[socket.name];
            console.log(findPlyaer(socket.name));
            console.log(socket.name);
        } else {
            console.log("未登录断开");
        }
    });
    //响应显示玩家列表的请求
    socket.on('giveMelist', function() {
        console.log(allPlayers);
        // console.log(nicknames);
        if(allPlayers.length >= 1) {
            // socket.broadcast.emit('hgnsystem', socket.name, 'logout');
            // console.log("有人");
            io.sockets.emit('refreshList', allPlayers)
        } else {
            console.log("压根没人");
        }
    });
    //响应开始游戏
    socket.on('startgame', function(myName) {
        console.log(myName + "点击了开始游戏");
        //通知所有人
        io.sockets.emit('hgnsystem', socket.name, 'startgame');
        initGame()
    });
    //响应选择总统
    socket.on('nextPreSelect', function(player) {
        pre = player;
        msg = "本届总统是" + pre.name;
        io.sockets.emit('hgnsystem', pre.name, msg);
        nicknames[pre.name].emit('broadcastTo', "您是本届总统，请选择总理");
        //投票数归零
        voteCount = 0;
        voteYes = 0;
        votemsg = "";
        nicknames[pre.name].emit('selectPrm', selectPrm(gamePlayer, pre.name));
    });
    //响应选择了总理
    socket.on('prmSelect', function(player) {
        tmpPrm = player;
        console.log(socket.name + "选择了" + player.name);
        msg = socket.name + "选择了" + player.name + " 请投票"
            //通知所有人
        io.sockets.emit('hgnsystem', player.name, msg);
        //发出投票请求
        io.sockets.emit('vote', player.name, msg);
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
            io.sockets.emit('hgnsystem', "system", votemsg);
            if(voteYes > gamePlayer.length / 2) {
                msg = '全员投票完毕，同意过半，政府组建成功'
                io.sockets.emit('hgnsystem', "system", msg);
                if(proEffRed >= 3 && tmpPrm.role == "hitler") {
                    gameOver("法西斯阵营获胜！", "希特勒在国家危机时刻上任总理，")
                } else {
                    findPro1();
                }
                prm = tmpPrm;
            } else {
                var msg = '全员投票完毕，同意未过半，政府组建失败';
                io.sockets.emit('hgnsystem', "system", msg);
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
            msg = socket.name + "选择否决了" + proDiscard
                //通知所有人
            io.sockets.emit('hgnsystem', player.name, msg);
            //发出投票请求
            findPro2(list);
        } else {
            console.log(socket.name + "选择否决了" + proDiscard);
            list.splice(proList.indexOf(proDiscard), 1); //从待选牌堆删除该法案
            console.log("待选牌堆" + list);
            msg = socket.name + "选择否决了" + proDiscard
                //通知所有人
            io.sockets.emit('hgnsystem', player.name, msg);
            //发出投票请求
            proEff(list[0]) //法案生效
        }
    });
    //响应技能：身份调查
    socket.on('invSelect', function(player) {
        console.log(socket.name + "调查了" + player.name);
        var msg = socket.name + "调查了" + player.name;
        //通知所有人
        io.sockets.emit('hgnsystem', player.name, msg);
        //发出调查结果
        if(player.role == "hitler" || player.role == "fascist") {
            var msg = "他是法西斯阵营的人";
        } else {
            var msg = "他是自由党阵营的人";
        }
        nicknames[pre.name].emit('invRes', msg);
        selectPre(prenext) //切换总统 继续游戏
    });
    //响应技能：枪决
    socket.on('killSelect', function(player) {
        console.log(socket.name + "枪决" + player.name);
        var msg = socket.name + "枪决" + player.name;
        //通知所有人
        io.sockets.emit('hgnsystem', player.name, msg);
        //发出调查结果
        if(player.role == "hitler") {
            var msg = "被枪决的人是希特勒";
            gameOver("自由党阵营获胜", "被枪决的人是希特勒，");
        } else {
            //枪毙的是下届总统时，切换下届总统
            if(prenext.name == player.name) {
                if(playerSeat[playerSeat.indexOf(player.name) + 1]) {
                    prenext = playerSeat[playerSeat.indexOf(player.name) + 1];
                } else {
                    prenext = playerSeat[0];
                };
                //从座位上移开
                playerSeat.splice(playerSeat.indexOf(player.name), 1)
                    //从玩家列表移除
                gamePlayer.splice(gamePlayer.indexOf(player.name), 1)
            }
            prenext = findPlyaer(prenext);
            selectPre(prenext) //切换总统 继续游戏
        }
    });
});
// 查找特定玩家 返回名称为name的玩家对象
function findPlyaer(name) {
    return allPlayers.filter(function(t) {
        return t.name == name;
    })[0];
};
// 检查玩家数量
function countPlyaer() {
    console.log("检查玩家数量");
    plyaerCount = 0;
    gamePlayer = [];
    allPlayers.filter(function(t) {
        if(t.isOline == "true") {
            plyaerCount = plyaerCount + 1
            gamePlayer.push(t);
        }
    });
    return plyaerCount;
};
//3种游戏模式选择
function selectGame() {
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
    return plyaerCount;
};
//玩家的资料模型
function player(name) {
    this.name = name;
    // this.color = "black";
    this.id = 0;
    this.role = "no";
    this.canbeselect = "true";
    // this.survial = "no";
    // this.addPlyaer = function() {};
    this.isOline = "true";
};
// 通知玩家游戏开始
function broadcastTo() {
    console.log("通知玩家");
    gamePlayer.filter(function(t) {
        if(t.role == "hitler") {
            hitler = t;
            nicknames[t.name].emit('broadcastTo', "你是希特勒");
        };
        if(t.role == "fascist") {
            fascist.push(t);
            nicknames[t.name].emit('broadcastTo', "你是法西斯");
        };
        if(t.role == "liberal") {
            nicknames[t.name].emit('broadcastTo', "你是自由党");
        };
    });
    gamePlayer.filter(function(t) {
        var msg = " ";
        for(x in fascist) {
            msg = msg + fascist[x].name + " ";
        };
        msg = msg + "是法西斯 ";
        if(t.role == "hitler") {
            if(plyaerCount >= 7) {
                nicknames[t.name].emit('broadcastTo', "你啥也不知道");
            } else {
                nicknames[t.name].emit('broadcastTo', msg);
            };
        };
        msg = msg + hitler.name + " 是希特勒";
        if(t.role == "fascist") {
            nicknames[t.name].emit('broadcastTo', msg);
        };
        if(t.role == "liberal") {
            nicknames[t.name].emit('broadcastTo', "你啥也不知道");
        };
    });
};
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
//选总统，一轮结束后继续游戏的象征
function selectPre(player) {
    // if (pre) {pre.canbeselect="true";};
    pre = player;
    if(playerSeat[playerSeat.indexOf(player.name) + 1]) {
        prenext = playerSeat[playerSeat.indexOf(player.name) + 1];
    } else {
        prenext = playerSeat[0];
    };
    prenext = findPlyaer(prenext);
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
//准备3张待选提案，发给总统
function findPro1() {
    console.log("总统选提案");
    io.sockets.emit('hgnsystem', "system", "等待总统选择提案");
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
    nicknames[pre.name].emit('choosePro', proTmp, "总统先生，这是本次的三份提案，请选择您要否决掉的一份");
}
//将剩余提案列表list发给总理玩家，让其选择
function findPro2(list) {
    console.log("总理选提案");
    io.sockets.emit('hgnsystem', "system", "等待总理选择提案");
    nicknames[prm.name].emit('choosePro', list, "总理先生，这是本次的两份提案，请选择您要否决掉的一份");
}
//法案生效,pro为法案编号，t为空时，为正常政府流程，否则强制提案流程
function proEff(pro, t) {
    if(pro >= 6) {
        console.log("红色提案生效");
        proEffRed = proEffRed + 1;
        io.sockets.emit('hgnsystem', "system", "红色提案生效");
    } else {
        console.log("蓝色提案生效");
        proEffBlue = proEffBlue + 1;
        io.sockets.emit('hgnsystem', "system", "蓝色提案生效");
    }
    if(proEffRed == 6) {
        gameOver("法西斯阵营获胜", "6张独裁法案生效，")
    } else {
        if(proEffRed == 5) {
            gameOver("自由党阵营获胜", "5张民主法案生效,")
        } else {
            proList.splice(proList.indexOf(pro), 1); //从总牌堆删除生效法案
            for(n in gamePlayer) {
                gamePlayer[n].canbeselect = "true";
            } //上届政府标记归零
            if(!t) {
                if(gamePlayer.length != 5) {
                    pre.canbeselect = "x";
                };
                findPlyaer(prm.name).canbeselect = "x";
                // console.log(pre);
                // console.log(findPlyaer(prm.name));
                //添加上届政府标记
            } else {
                proIndex = proIndex - 1;
            }
            if(skillList[proEffRed - 1] == "x") {
                selectPre(prenext); //切换总统 继续游戏
            } else {
                skillList[proEffRed - 1]()
            }
        }
    }
}
//发牌、记录
function dealCard(plyaerCount) {
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
    io.sockets.emit('hgnsystem', "system", msg);
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
//排座位
function regPlayer() {
    for(x in gamePlayer) {
        playerSeat.push(gamePlayer[x].name)
    }
};
//技能：调查身份
function invPlayer() {
    console.log("总统 调查身份");
    var list = gamePlayer.filter(function(t) {
        return t.name != pre.name
    });
    io.sockets.emit('hgnsystem', "system", "等待总统进行身份调查");
    nicknames[pre.name].emit('invPlayer', list);
}
//技能：指定总统
function setPre() {
    console.log("总统 指定总统");
    var list = gamePlayer.filter(function(t) {
        return t.name != pre.name
    });
    io.sockets.emit('hgnsystem', "system", "等待总统指定下一任总统");
    nicknames[pre.name].emit('nextPre', list);
}
//技能：枪决
function toKill() {
    console.log("总统 枪决一人");
    var list = gamePlayer.filter(function(t) {
        return t.name != pre.name
    });
    io.sockets.emit('hgnsystem', "system", "等待总统决定枪决目标");
    nicknames[pre.name].emit('killPlayer', list);
    console.log("被枪决玩家需要取消操作权限..待添加");
}
//技能：查看法案
function toLookPro() {
    console.log("总统 查看三张法案");
    var msg = "法案牌堆顶依次是: ";
    for(i = 0; i <= 2; i++) {
        if(proList[proIndex - i] >= 6) {
            msg = msg + "红色法案 "
        } else {
            msg = msg + "蓝色法案 "
        }
    }
    nicknames[pre.name].emit('invRes', msg);
    selectPre(prenext);
}
//政府组建失败处理，调用proEff，t=1
function failSystem() {
    failTimes = failTimes + 1;
    if(failTimes == 3) {
        var msg = '连续三次组建政府失败，强行执行法案牌的第一张法案,';
        proEff(proList[proIndex], 1)
    }
}
//游戏结束，获胜方wingroup，获胜原因reason
function gameOver(wingroup, reason) {
    var msg = reason + wingroup
    io.sockets.emit('hgnsystem', "system", msg);
}
