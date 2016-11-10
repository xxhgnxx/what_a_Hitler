window.onload = function() {
    //建立到服务器的socket连接




};

document.getElementById('nickWrapper').style.display = 'block';
document.getElementById('nicknameInput').focus();
    var socket = io.connect();
    var socketName = null;



//文字消息处理器，isFrom来源，一般只传送文字信息，
socket.on('msgSystem', function(msg,where) {
// console.log(msg);
// console.log(where);
popMsgToHistory(msg,where);
});

//显示消息的函数，msg消息主体，where显示位置，user消息的发送人，color颜色
function popMsgToHistory (msg,where,user,color) {
    if (where=="msgPop"){
        document.getElementById(where).innerHTML=msg;
    }else{
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
socket.on('loginSuccess', function(msg) {
    document.title =document.getElementById('nicknameInput').value+ '送希特勒上天';
    document.getElementById('loginWrapper').style.display = 'none';
    document.getElementById('name').innerHTML=socketName+' 送希特勒上天-神TM希特勒';;
    // document.getElementById('messageInput').focus();
    if (msg) {
      document.getElementById('name').innerHTML=socketName+' 旁观送希特勒上天-神TM希特勒';;
      document.title =document.getElementById('nicknameInput').value+ '旁观希特勒上天';
      document.getElementById('controls').style.display = 'none';
      popMsgToHistory(msg,"msgPop");
    }
});

// 找个座位坐下，加入游戏
document.getElementById('joingame').onclick = function(a) {
    //本地直接切换了状态，有风险，一旦传输失败整个系统就会出问题
    if (document.getElementById('joingame').value=="找个座位坐下") {
        document.getElementById('joingame').value="离开座位"
        socket.emit('joingame', socketName);
        console.log("坐下");
    } else {
        document.getElementById('joingame').value="找个座位坐下"
        socket.emit('joingame', socketName);
        console.log("起身");

    }


}






// 开始游戏
document.getElementById('startgame').addEventListener('click', function() {
        socket.emit('startgame', socketName);
}, false);
