/**
 * Created by chenkuan on 2017/6/2.
 */
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
