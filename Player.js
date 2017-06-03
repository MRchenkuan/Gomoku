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