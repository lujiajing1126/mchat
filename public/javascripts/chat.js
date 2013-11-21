$(document).ready(function(){
var socket = io.connect();
var to = "all";
var from = $.cookie('user');
var isOpen = 0;
var fontcolor = 'black';
var isbold = 0;
var isitalic = 0;
var fontfamiliy = "SumSong";
//隐藏工具栏
$("#fontbar").hide();
//发送用户上线信号
socket.emit('online',{user:from});
socket.on('online',function(data){
  //显示系统消息
  if(data.user != from){
    var sys = '<div style="color:#f00">系统(' + now() + '):' + '用户 ' + data.user + ' 上线了！</div>';
  } else {
    var sys = '<div style="color:#f00">系统(' + now() + '):你进入了聊天室！</div>';
  }
  $("#contents").append(sys + "<br/>");
  //刷新用户在线列表
  flushUsers(data.users);
  //显示正在对谁说话
  showSayTo();
});
socket.on('say',function(data){
  //对所有人说
  if(data.to == 'all'){
    $("#contents").append('<div class="words-wrap"><div class="words-pre">'+ data.from + '  ' + now() +'</div><div class="words">'+data.msg+'</div></div>');
  }
  //对你密语
  if(data.to == from){
    $("#contents").append('<div class="words-wrap-private" style="color:#00f" ><div class="words-pre private">'+data.from+'  ' + now() + '  对 你 说：</div><div class="words private">'+data.msg+'</div></div>');
  }
  $("#contents").scrollTop(document.getElementById('contents').scrollHeight);
});
socket.on('offline',function(data){
  //显示系统消息
  var sys = '<div style="color:#f00">系统(' + now() + '):' + '用户 ' + data.user + ' 下线了！</div>';
  $("#contents").append(sys + "<br/>");
  //刷新用户在线列表
  flushUsers(data.users);
  //如果正对某人聊天，该人却下线了
  if(data.user == to){
    to = "all";
  }
  //显示正在对谁说话
  showSayTo();
});
$(document).keypress(function(e){
  if(e.ctrlKey && e.which == 13||e.which == 10)  {
    sendmessage();
  }
});
$("#say").click(function(){
  sendmessage();
});

$("#source-code").click(function(){
  var mess = $("#input_content").html();
  $("div.modal-body").html(mess);
});

$("#font-tools").click(function () {
  $("#fontbar").slideToggle("fast");
  var height = $("div#contents").height();
  console.log(height);
  if(isOpen == 0)  {
    $("div#contents").height(height-30);
    isOpen = 1;
  } else if (isOpen == 1)  {
    $("div#contents").height(height+30);
    isOpen = 0;
  }
});

$("#fontcolor").click(function(){
  if(fontcolor == 'black')  {
    fontcolor = 'red';
  }else {
    fontcolor = 'black';
  }
  reset();
});

$("#isBold").click(function(){
  if(isbold == 0)  {
    isbold = 1;
  } else isbold = 0;
  reset();
});

$("#isItalic").click(function(){
  if(isitalic == 0)  {
    isitalic = 1;
  } else isitalic = 0;
  reset();
});

function reset()  {
  $("#input_content").css("color",fontcolor);
  var fontWeightValue = isbold==1 ? 'bold':'normal';
  $("#input_content").css("font-weight",fontWeightValue);
  var fontStyleValue = isitalic==1 ? 'italic':'normal';
  $("#input_content").css("font-style",fontStyleValue);
}

function sendmessage()  {
  //获取要发送的信息
  var $msg = $.trim($("#input_content").text());
  var regexconfig= new RegExp("^/config");
  if($msg == "")  {
    $("#input_content").empty();
    return;
  }
  if($msg.match(regexconfig))  {
    console.log("进入配置模式！显示工具栏！");
    $("#input_content").empty();
    $("div.left_part").css("display", "block");
    return;
  }
  var fontWeightValue =  isbold==1 ? 'bold':'normal';
  var fontStyleValue = isitalic==1 ? 'italic':'normal';
  //打包消息内容$msg，以便发送到服务器端，在各个Client显示
  $msg = '<a style="color:'+fontcolor+';font-weight:'+fontWeightValue+';font-style:'+fontStyleValue+';">'+$msg+'</a>';
  if(to == "all"){
    $("#contents").append('<div class="words-wrap"><div class="words-pre">'+ from + '  ' + now() +'</div><div class="words">'+$msg+'</div></div>');
  } else {
    $("#contents").append('<div class="words-wrap-private" style="color:#00f" ><div class="words-pre private">你  ' + now() + '  对 ' + to + ' 说：</div><div class="words private">'+$msg+'</div></div>');
  }
  //发送发话信息
  socket.emit('say',{from:from,to:to,msg:$msg});
  //清空输入框并获得焦点
  $("#input_content").html("").focus();
  $("#contents").scrollTop(document.getElementById('contents').scrollHeight);
}

function flushUsers(users){
  //清空之前用户列表，添加 "所有人" 选项并默认为灰色选中效果
  $("#list").empty().append('<li title="双击聊天" alt="all" class="sayingto" onselectstart="return false">所有人</li>');
  //遍历生成用户在线列表
  for(var i in users){
    $("#list").append('<li alt="' + users[i] + '" title="双击聊天" onselectstart="return false">' + users[i] + '</li>');
  }
  //双击对某人聊天
  $("#list > li").dblclick(function(){
    //如果不是双击的自己的名字
    if($(this).attr('alt') != from){
      //设置被双击的用户为说话对象
      to = $(this).attr('alt');
      //清除之前的选中效果
      $("#list > li").removeClass('sayingto');
      //给被双击的用户添加选中效果
      $(this).addClass('sayingto');
      //刷新正在对谁说话
      showSayTo();
    }
  });
}

function showSayTo(){
  $("#from").html(from);
  $("#to").html(to == "all" ? "所有人" : to);
}

function now(){//获取当前时间
  var date = new Date();
  var weekday=new Array(7);
  weekday[0]="星期日";
  weekday[1]="星期一";
  weekday[2]="星期二";
  weekday[3]="星期三";
  weekday[4]="星期四";
  weekday[5]="星期五";
  weekday[6]="星期六";
  var time = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '  '+ weekday[date.getDay()]+ ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
  return time;
}
//清空对话框内容
$("div#clear").click(function(){
  $("div#contents").empty();
});
});