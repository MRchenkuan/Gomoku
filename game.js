/**
 * Created by chenkuan on 2017/6/2.
 */

/**
 * 玩家类，可扩展
 * 目前只支持 white 和 black
 * @param options
 * @constructor
 */
function Player(options) {
    if(options.type!='white' && options.type!='black')throw "玩家初始化失败，玩家类型只能为 white 或者 black";
    this.name = options.name;
    this.level = options.level || 0
    this.type = options.type;
}
/**
 * 棋盘类
 * @param row
 * @param col
 * @constructor
 */
function Board(row, col) {
    if(row<5||col<5)throw '棋盘大小不符合要求，请设置至少大于5 x 5'
    this.roads = [];
    this.actor = 'black';
    this.size = [row, col];
    this.isOver = false;
    this.history = []; // 悔棋栈
    this.backOff = []; // 撤销栈
    this.players = []; // 玩家池
    this.cb_peace = null; // 和棋回调
    this.cb_win = null; // 胜利回调
    var self = this;
    /**
     * 棋盘初始化放在构造函数中
     */
    for(var i=0;i<row;i++){
        var _row = [];
        _row.length=row;
        for(var j=0;j<col;j++){
            _row[j] = 0
        }
        this.roads.push(_row);
    }
}
Board.prototype = {
    /**
     * 获胜判断
     */
    isSomeoneWin : function (x,y,actor) {
        var self = this;
        var w = this.size[0];
        var h = this.size[1];
        var i,j,k;


        // 横线上的结果
        var line = this.roads[x].slice(Math.max(0,y-4),Math.min(w,y+5));
        // 纵线上的结果
        var column = [];
        // 反斜线上的结果
        var backslash=[];
        // 正斜线上的结果
        var slash=[];
        for(i=-4;i<=4;i++){
            if(x+i>=0 && x+i<w && y+i>=0 && y+i<h){
                backslash.push(this.roads[x+i][y+i]);
            }

            if(x+i>=0 && x+i<w && y-i>=0 && y-i<h){
                slash.push(this.roads[x+i][y-i]);
            }

            if(x+i>=0 && x+i<w && y>=0 && y<h){
                column.push(this.roads[x+i][y])
            }
        }
        return this.has5link(line, actor)
            ||this.has5link(column, actor)
            ||this.has5link(backslash, actor)
            ||this.has5link(slash, actor);

    },
    /**
     * 获胜辅助方法
     */
    has5link :function (array, actor) {
        if(array.length<5)return false;
        var count = 0;

        // 连续4次与相邻一致则可以判定为5连
        return array.some(function (it,id) {
            if(it == array[id+1]){
                count++
            }else{
                count = 0;
            }

            if(count>=4)return true;
        })
    },
    /**
     * 和棋判断
     */
    isPeace : function (){
        var max = this.size[0] * this.size[1];
        return this.history.length>=max;
    },
    /**
     * 落子方法
     * @param x
     * @param y
     * @return boolean 成功落子返回true 落子失败返回false
     */
    placing : function (x,y) {
        var currentActor = this.actor;
        // 结束退出
        if(this.isOver) return false;
        // 占位退出
        if(this.roads[x][y] != 0 ) return false;

        // 落子
        this.roads[x][y] = this.actor;

        // 清空撤销栈
        this.backOff = [];

        // 交换落子方
        if(!this.isOver){
            this.history.push([x,y,currentActor]);
            this.turnRound();
        }


        // 获胜判断
        if(this.isSomeoneWin(x,y,currentActor)){
            this.playWin(currentActor);
            return true;
        }
        // 和棋判断
        if(this.isPeace()){
            this.playPeace();
            return true;
        }

        return true
    },
    /**
     * 悔棋
     */
    regret : function () {
        // 结束退出
        if(this.isOver) return false;
        if(this.history.length<=0)return false;
        var pos = this.history.pop();
        this.roads[pos[0]][pos[1]] = 0;

        // 入撤销栈
        this.backOff.push(pos);

        // 交换落子方
        this.turnRound();
        return pos;
    },
    /**
     * 撤销悔棋
     */
    undoRegret : function () {
        // 结束退出
        if(this.isOver) return false;
        if(this.backOff.length<=0)return false;
        var pos = this.backOff.pop();
        this.roads[pos[0]][pos[1]] = pos[2];

        // 重入历史栈
        this.history.push(pos);

        // 交换落子方
        this.turnRound();
        return pos;
    },
    playPeace : function () {
        if(this.cb_peace)this.cb_peace()
        this.isOver = true;
    },
    playWin : function(actor) {
        if(this.cb_win)this.cb_win(actor)
        this.isOver = true;
    },
    turnRound : function () {
        this.actor =="black"? this.actor = "white" : this.actor = "black"
    },
    addPlayer :function (player) {
        this.players.push(player);
    }

};




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
