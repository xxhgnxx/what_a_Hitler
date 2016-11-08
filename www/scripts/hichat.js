window.onload = function() {
    //实例并初始化我们的hichat程序
    var hichat = new HiChat();
    hichat.init();

};
//定义我们的hichat类
var HiChat = function() {
    this.socket = null;
};
//向原型添加业务方法
HiChat.prototype = {
    init: function() {
        //此方法初始化程序
        var myName = null;
        var that = this;
        //建立到服务器的socket连接
        this.socket = io.connect();
        //监听socket的connect事件，此事件表示连接已经建立
        this.socket.on('connect', function() {
            //连接到服务器后，显示昵称输入框
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        //发送玩家状态变更通知
        this.socket.on('hgnsystem', function(nickName, type) {
            switch (type) {
                case "new":
                    var msg = nickName + ' 新加入';
                    break;
                case "back":
                    var msg = nickName + ' 回来了';
                    break;
                case "logout":
                    var msg = nickName + ' 退出';
                    break;
                case "startgame":
                    var msg = nickName + ' 点击了开始游戏';
                    break;
                default:
                    var msg = type;
                    break;
            };
            // document.getElementById('loginBtn').value="haha";
            // document.getElementById('player1').style.display = 'inline';

            // var p = document.createElement('p');
            // p.textContent = msg;
            // document.getElementById('historyMsg').appendChild(p);



            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;


        });
        //刷新玩家列表请求
        document.getElementById('showList').addEventListener('click', function() {
            //不为空，则发起一个login事件并将输入的昵称发送到服务器
            that.socket.emit('giveMelist');
            // console.log("go");
        }, false);
        //刷新玩家列表响应
        this.socket.on('refreshList', function(allPlayers) {
            var table = document.getElementById('playertable')
            for (i = table.rows.length - 1; i >= 0; i--) {
                table.deleteRow(i);
            }
            for (x in allPlayers) {
                var row = table.insertRow(0);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                cell1.innerHTML = allPlayers[x].name;
                cell2.innerHTML = allPlayers[x].isOline;
            }



        });


        //游戏开始后的通知
        this.socket.on('broadcastTo', function(msg) {
            console.log("接到通知");
            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;
        });


        //调查身份动作
        this.socket.on('invPlayer', function(myplayerList) {
            console.log("接到invPlayer通知");
            msg = "请选择你想调查的人";

            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;

            for (x in myplayerList) {
                document.getElementsByName("who")[x].style.display = 'inline';
                document.getElementsByName("who")[x].value = myplayerList[x].name;

                console.log("选人按钮" + myplayerList[x].name)

                document.getElementsByName("who")[x].onclick = function(a) {
                    that.socket.emit('invSelect', a);
                    for (x in myplayerList) {
                        document.getElementsByName("who")[x].style.display = 'none';
                    };
                }.bind(undefined, myplayerList[x]);


            };
        });

        //指定总统动作
        this.socket.on('nextPre', function(myplayerList) {
            console.log("接到nextPre通知");
            msg = "请选择你想指定的下一任总统";

            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;

            for (x in myplayerList) {
                document.getElementsByName("who")[x].style.display = 'inline';
                document.getElementsByName("who")[x].value = myplayerList[x].name;

                console.log("选人按钮" + myplayerList[x].name)

                document.getElementsByName("who")[x].onclick = function(a) {
                    that.socket.emit('nextPreSelect', a);
                    for (x in myplayerList) {
                        document.getElementsByName("who")[x].style.display = 'none';
                    };
                }.bind(undefined, myplayerList[x]);


            };
        });




        //枪决玩家动作
        this.socket.on('killPlayer', function(myplayerList) {
            console.log("接到killPlayer通知");
            msg = "请选择你想调查的人";

            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;

            for (x in myplayerList) {
                document.getElementsByName("who")[x].style.display = 'inline';
                document.getElementsByName("who")[x].value = myplayerList[x].name;

                console.log("选人按钮" + myplayerList[x].name)

                document.getElementsByName("who")[x].onclick = function(a) {
                    that.socket.emit('killSelect', a);
                    for (x in myplayerList) {
                        document.getElementsByName("who")[x].style.display = 'none';
                    };
                }.bind(undefined, myplayerList[x]);


            };
        });


        //调查结果通知
        this.socket.on('invRes', function(msg) {
            console.log("接到调查通知");
            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;
        });


        //选择总理动作
        this.socket.on('selectPrm', function(myplayerList) {
            console.log("接到selectPrm通知");
            msg = "你需要选择一名总理";

            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;

            for (x in myplayerList) {
                document.getElementsByName("who")[x].style.display = 'inline';
                document.getElementsByName("who")[x].value = myplayerList[x].name;

                console.log("选人按钮" + myplayerList[x].name)

                document.getElementsByName("who")[x].onclick = function(a) {
                    that.socket.emit('prmSelect', a);
                    for (x in myplayerList) {
                        document.getElementsByName("who")[x].style.display = 'none';
                    };
                }.bind(undefined, myplayerList[x]);


            };
        });


        //响应投票请求
        this.socket.on('vote', function() {

            document.getElementById('voteyes').style.display = 'inline';
            document.getElementById('voteno').style.display = 'inline';





        });
        //选择提案
        this.socket.on('choosePro', function(list,msg) {
            var proISee="蓝色法案"
            for (x in list) {
                if (list[x]>=5){
                    proISee= "红色法案";
                }else{
                    proISee="蓝色法案";
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
                    that.socket.emit('proSelect', a, list);
                    for (x in list) {
                        document.getElementsByName("pro")[x].style.display = 'none';
                    };
                }.bind(undefined, list[x]);


            };
            var container=document.getElementById('historyMsg');
            var msgToDisplay = document.createElement('p');
                msgToDisplay.innerHTML=msg;
                container.appendChild(msgToDisplay);
                container.scrollTop = container.scrollHeight;


        });

        //投票按钮
        document.getElementById('voteyes').addEventListener('click', function() {
            document.getElementById('voteyes').style.display = 'none';
            document.getElementById('voteno').style.display = 'none';
            that.socket.emit('playerVote', myName, "同意");
        }, false)

        document.getElementById('voteno').addEventListener('click', function() {
            document.getElementById('voteyes').style.display = 'none';
            document.getElementById('voteno').style.display = 'none';
            that.socket.emit('playerVote', myName, "反对");
        }, false)

        // 登陆按钮
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            nickName = String(nickName);
            //存储名称
            myName = String(nickName);
            //检查昵称输入框是否为空
            if (nickName.trim().length != 0) {
                //不为空，则发起一个login事件并将输入的昵称发送到服务器
                that.socket.emit('login', nickName);
            } else {
                //否则输入框获得焦点
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        // 开始游戏
        document.getElementById('startgame').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            nickName = String(nickName);
            //检查是否登陆
            if (myName) {
                //不为空，则发起一个login事件并将输入的昵称发送到服务器
                that.socket.emit('startgame', myName);
            } else {
                //否则提示登陆框获得焦点
                var p = document.createElement('p');
                p.textContent = "请先登录";
                document.getElementById('historyMsg').appendChild(p);
                document.getElementById('nicknameInput').focus();




            };
        }, false);
    }
};

function Refresh() {};

function displayPlayerButton(myplayerList) {



};
