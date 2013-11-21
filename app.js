﻿/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

var server = http.createServer(app);

var io = require('socket.io').listen(server);
io.sockets.on('connection',function(socket){
socket.on('online',function(data){
  //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
  socket.name = data.user;
  //数组中不存在该用户名则插入该用户名
  if(users.indexOf(data.user) == -1){
    users.unshift(data.user);
  }
  //向所有用户广播该用户上线信息
  io.sockets.emit('online',{users:users,user:data.user});
});
socket.on('say',function(data){
  if(data.to == 'all'){
    //向其他所有用户广播该用户发话信息
    socket.broadcast.emit('say',data);
  } else {
    //向特定用户发送该用户发话信息
    //clients 为存储所有连接对象的数组
    var clients = io.sockets.clients();
    //遍历找到该用户
    clients.forEach(function(client){
      if(client.name == data.to){
        //触发该用户客户端的 say 事件
        client.emit('say',data);
      }
    });
  }
});
socket.on('disconnect',function(){
  //若 users 数组中保存了该用户名
  if(users.indexOf(socket.name) != -1){
    //从 users 数组中删除该用户名
    users.splice(users.indexOf(socket.name),1);
    //向其他所有用户广播该用户下线信息
    socket.broadcast.emit('offline',{users:users,user:socket.name});
  }
});
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


var users = [];//存储在线用户列表
app.get('/', function(req,res){
  if(req.cookies.user == null){
    //注意要有 return
    return res.redirect('/signin');
  }
  res.sendfile('views/index.html');
});
app.get('/signin',function(req,res){
  res.sendfile('views/signin.html');
});
app.post('/signin',function(req,res){
  //检测该用户名是否已经存在于 users 数组中
  if(users.indexOf(req.body.name) != -1){
    //存在，则不允许登陆
    res.redirect('/signin');
  } else {
    //不存在，把用户名存入 cookie 并跳转到主页
    res.cookie("user",req.body.name,{maxAge:1000*60*60*24*30});
    res.redirect('/');
  }
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
