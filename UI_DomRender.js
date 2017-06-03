/**
 * 定制用户界面，可以选择dom实现或者 canvas实现 ，
 * 以下采用dom实现
 * @param selector
 * @param board
 * @constructor
 */
function DomRender(selector,board) {
    var self = this;

    this.ele = document.querySelector(selector);
    this.ele.innerHTML = "";
    this.board = board;
    this.commentaryBox = null;

    var frameWidth = this.ele.offsetWidth;
    var frameHeight = this.ele.offsetHeight;

    var cellWidth = frameWidth / board.size[0];
    var cellHeight = frameHeight / board.size[1];

    // 绘制棋盘
    board.roads.some(function (it ,x) {
        var line = document.createElement("div");
        line.style.height = cellHeight+'px';
        it.some(function (el , y) {
            var cell = document.createElement("span");
            cell.setAttribute("data-ps", JSON.stringify({x:x,y:y}) );
            cell.style.width = cellWidth +'px';
            cell.style.height = cellHeight +'px';
            cell.style.border =  "1px solid grey";
            cell.style.float = 'left';
            cell.style.margin = '-1px';
            cell.style.boxSizing = "border-box";
            cell.style.display ="flex";
            cell.style.justifyContent ="center";

            var store = document.createElement('i');
            store.style.borderRadius='100vw';
            store.style.alignSelf='center';
            store.style.display = 'none';
            store.style.height = '80%';
            store.style.width = '80%';
            store.style.backgroundColor = "none";
            store.style.border = "1px solid grey";

            cell.appendChild(store);
            line.appendChild(cell);
        });
        self.ele.appendChild(line);
    });


    // 绑定事件
    // this.ele.addEventListener('click',function (e) { // 简单写法，不用手动解绑
    this.ele.onclick = function (e) {
        var cell = e.target;
        // 没点中
        if(cell.tagName.toLocaleLowerCase() !='span')return false;
        // 位置被占
        if(!self.placing(cell)) return false;
        // 解说框为初始化
        if(!self.commentaryBox)return false;
        if(self.board.isOver)return false;
        var commentary = document.createElement("p");
        commentary.innerHTML = "<span style='font-weight: 900'>"+self.getPrevPlayer().name +"</span> 将落子在了 " + self.getPosText(cell);
        self.addCommentary(commentary);

    };

    this.setPeaceCB(); // 设置平局时的回调
    this.setWinCB(); //设置成功时的回调

}

DomRender.prototype = {

    placing : function (cell) {

        var leaf = cell.getElementsByTagName('i')[0];
        var _pos = cell.getAttribute('data-ps');
        if(!_pos)return false; // 点到隐藏的棋子

        var pos = JSON.parse(_pos);
        var primaryActor = this.board.actor;
        var flag = this.board.placing(pos.x, pos.y);
        if(flag){
            leaf.style.display = 'block';
            leaf.style.backgroundColor = primaryActor;
            return true
        }
        return false;
    },
    getPlayers :function () {
        return this.board.players
    },
    doRegret :function () {
        var pos = this.board.regret();
        if(!pos)return false;
        var leaf = document.querySelector("span[data-ps='"+JSON.stringify({x:pos[0],y:pos[1]})+"']");
        leaf = leaf.querySelector('i');
        leaf.style.display = "none";
    },
    doUndoRegret :function () {
        var pos = this.board.undoRegret();
        if(!pos)return false;
        var leaf = document.querySelector("span[data-ps='"+JSON.stringify({x:pos[0],y:pos[1]})+"']");
        leaf = leaf.querySelector('i');
        leaf.style.backgroundColor = pos[2];
        leaf.style.display = "block"
    },
    initPlayerBox :function (selector) {
        var playerBox = document.querySelector(selector);
        playerBox.innerHTML = '';

        var players = this.getPlayers();
        players.some(function (it) {
            var div = document.createElement("div");
            div.className = 'player';
            div.innerHTML = "<i style='background-color: "+it.type+"' class='leaf'></i>："+it.name+"<br>级别：" + it.level;
            playerBox.appendChild(div)
        });
    },
    initCommentaryBox :function (selector) {
        this.commentaryBox = document.querySelector(selector);
        this.commentaryBox.innerHTML = '';
    },
    addCommentary :function (commentary) {
        this.commentaryBox.children.length>0 ?
            this.commentaryBox.insertBefore(commentary, this.commentaryBox.children[0])
            :this.commentaryBox.appendChild(commentary)
    },
    addCommentaryText :function (text) {
        var commentary = document.createElement("p");
        commentary.innerHTML = text;
        this.addCommentary(commentary)
    },
    getPrevPlayer :function () {
        var player = null;
        var self = this;
        this.getPlayers().some(function (it) {
            var prevType = self.board.actor=='white'?"black":"white";
            if(it.type == prevType){
                player = it;
                return true;
            }
        });
        return player;
    },
    getPosText :function (cell) {
        var _pos = cell.getAttribute('data-ps');
        if(!_pos)return "未知区域";
        var pos = JSON.parse(_pos);
        return (1+pos.y)+"·"+(pos.x+1)

    },
    setPeaceCB :function () {
        var self = this;
        // 注册成功回调
        self.board.cb_peace = function () {
            self.addCommentaryText("<strong style='color: #e5323b'>"+self.getPlayers()[0].name +"和"+self.getPlayers()[1].name+" 下成了平局！</strong>")
        };
    },
    setWinCB :function () {
        var self = this;

        // 注册胜利回调
        self.board.cb_win = function (actor) {
            var player = null;
            self.getPlayers().some(function (it) {
                if(it.type == actor){
                    player = it;
                    return true;
                }
            });
            self.addCommentaryText("<strong style='color: #5ca3e8'>游戏结束！胜利者是："+player.name+"!</strong>")
        }
    }
};