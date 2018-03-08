exmp__data = {
  "#username": {
    rules: {require: true, complex: {message: ""}, different: "#simple", remote: {url: '', handler: null}},
    elements: null,
    stat: ""
  }
}
exmp_options = {
  debug: true,
  focusout: true,
  custom: {
    "#username": {
      getValue: function () {

      },
      rangeMessage: function () {

      },
      handler: function () {

      },
      focusout: true
    }
  },
  rangeMessage: function () {

  },
  message: {
    require: "请填写用户名",
    require: "请填写用户名",
    require: "请填写用户名"
  }
}

var Validator = (function () {

  /**
   * 构造函数
   * @param rules
   * @param opt
   * @returns {_validator}
   * @private
   */
  var _validator = function (nodes, opt) {
    if (!(this instanceof _validator)) {
      return new _validator(nodes, opt)
    }
    this.nodes = nodes;
    _data = buildData(nodes)
    config(opt);
  }

  //总节点树
  _data = {}

  //默认配置参数
  var options = {
    debug: false,
    focusout: false,
    custom: null,
    message: null,
    rangeMsg: null,
    block: true
  }

  /**
   * 获取节点
   * @param selector
   * @returns {*}
   */
  var getNodeValue = function (selector) {
    var nodeList = document.querySelectorAll(selector);
    if (nodeList.length == 0)
      return null;
    var values = [];
    var type = nodeList[0].getAttribute('type');
    return {nodeList: nodeList, type: type};
  }

  /**
   * 构建节点树
   * @param nodes
   * @returns {{}}
   */
  var buildData = function (nodes) {
    var data = {}
    for(var selector in nodes) {
      var rules = nodes[selector]
      var elements = getNodeValue(selector)
      if (elements == null) {
        break
      } else {
        for(var ruleName in rules){
          var ruleParams = rules[ruleName]
          if(typeof ruleParams != 'object'){
            rules[ruleName] = ruleParams = {param: ruleParams}
          }
        }

        data[selector] = {
          rules: rules,
          elements: elements,
          stat: Validator.prototype.CONST.UNCHECK
        }
      }
    }
    return data
  }

  /**
   * 加载配置参数
   * @param options
   */
  var config = function (opt) {
    //覆盖默认配置
    for(var pname in opt){
      options[pname] = opt[pname]
    }
    //配置参数custom参数复制到_data下
    if(options.custom){
      for(var selector in options.custom){
        if(_data[selector]){
          for(var op in options.custom[selector]){
            _data[selector][op] = options.custom[selector][op]
          }
          updateNodesListener(selector, "focusout")
        }
      }
    }
  }

  /**
   * 添加监听事件
   * @param nodeList
   * @param evType
   * @param func
   */
  var addEventListener = function (nodeList, evType, func) {
    var foo = typeof func == "function" ? func : eventHandler
    for(var i = 0; i < nodeList.length; i++){
      if(nodeList[i].eventListener){
        if(nodeList[i].eventListener[evType]){
          nodeList[i].removeEventListener(evType, nodeList[i].eventListener[evType])
        }else{
          nodeList[i].addEventListener(evType, foo)
        }
      }
    }
  }

  /**
   * 默认事件处理程序
   * @param ev
   */
  var eventHandler = function (ev) {
    alert("event")
  }

  /**
   * 更新节点事件
   * @param selector
   * @param evType
   */
  var updateNodesListener = function (selector, evType) {
    if(_data[selector][evType]){
      if(typeof _data[selector][evType] == "function")
        addEventListener(evType, options.custom[selector][evType])
      else
        addEventListener(evType)
    }else if(options.focusout){
      if(typeof options[evType] == "function")
        addEventListener(evType, options[evType])
      else
        addEventListener(evType)
    }
  }

  /**
   * 默认渲染错误信息方法
   * @param node
   * @param message
   */
  var rangeMessage = function (node, message) {
    console.log("default message ranger")
  }

  /**
   * 校验函数
   * @returns {{success: boolean, result: Array}}
   */
  _validator.prototype.validate = function () {
    var result = []
    var ruleHandler = this.rules

    for(var selector in _data){
      var nodeRules = _data[selector]["rules"]
      var nodeList = _data[selector]["elements"]["nodeList"]
      var nodeType = _data[selector]["elements"]["type"]
      var ruleParams = error = null;

      for(var ruleName in nodeRules){
        //规则库中是否已定义目标规则
        if(ruleHandler[ruleName] == undefined){
          throw new Error("rule "+ruleName+" handler is not implement")
        }
        ruleParams = nodeRules[ruleName];

        //单节点校验
        for(var n in nodeList){
          nodeList[n]["stat"] = this.CONST.ONCHECK
          var check = true;
          if(typeof _data[selector]["handler"] == 'function'){
            check = _data[selector]["handler"](nodeList[n], ruleParams)
          }else{
            check = ruleHandler[ruleName](nodeList[n], ruleParams)
          }
          var message = ""
          if(ruleParams.message){
            message = ruleParams.message
          }else if(options.message[ruleName]){
            message = options.message[ruleName]
          }
          //始终调用渲染函数
          if(_data[selector]["rangeMessage"] && typeof _data[selector]["rangeMessage"] == "function"){
            _data[selector]["rangeMessage"](nodeList[n], message)
          }if(options["rangeMessage"] && typeof options["rangeMessage"] == "function"){
            options["rangeMessage"](check, nodeList[n], message)
          }else{
            rangeMessage(check, nodeList[n], message)
          }

          if(!check){
            error = {success: false, selector: selector, node: nodeList[n], errRule: ruleName, message: message }
            result.push(error)
            nodeList[n]["stat"] = this.CONST.FAILURE
            break
          }else{
            nodeList[n]["stat"] = this.CONST.SUCCESS
          }
        }
      }

      if(error)
        if(options.block == true)
          return {success: result.length == 0 ? true : false, result: result};
    }
    return {success: result.length == 0 ? true : false, result: result};
  }

  _validator.prototype.rules = {
    require: function (node) {
      return !(node.value === undefined || node.value === null || node.value.replace(/\s/, "") === "")
    },
    complex: function (node) {
      return (node.value.length >= 6)
    }
  }

  _validator.prototype.setMessage = function (msg) {
    options.message = msg
    return this
  }

  _validator.prototype.CONST = {
    SUCCESS: "success",
    FAILURE: "failure",
    ONCHECK: "oncheck",
    UNCHECK: "uncheck"
  }

  _validator.prototype.TRIGGER = {
    keyup: "keyup",
    focusout: "focusout"
  }

  /**
   * 单独设置校验逻辑
   * @param selector
   * @param rule
   * @param handler
   * @returns {Validator}
   */
  _validator.prototype.setHandler = function (selector, rule, handler) {
    try{
      _data[selector][rule]["handler"] = handler
    }catch(e){
      console.log(e)
    }
    return this;
  }

  /**
   * 节点有变化
   * @param selector
   */
  _validator.prototype.updateNode = function (selector) {
    if(_data[selector]){
      var elements = getNodeValue(selector)
      if (elements == null) {
        return false;
      } else {
        if(_data[selector]){
          updateNodesListener(selector, "focusout")
        }
      }
    }
  }

  /**
   * ajax简单封装
   * @param param
   */
  _validator.prototype.ajax = function (param) {
    $.ajax(param)
  }

  Object.defineProperty(_validator.prototype, "interface", {configurable: false, writable: false})
  return _validator
})()

