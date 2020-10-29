//引入express  就像script标签那样引入文件
var express=require('express');
//引入mysql
var mysql=require('mysql');
//引入post
var bodyParser=require('body-parser');
//搭建一个服务  让别人能访问到我
var server=express();
//配置浏览器能访问的文件夹 (配置能访问的静态文件地址)
// __dirname  当前的目录地址
server.use(express.static(__dirname+'/public'));
//配置post
server.use(bodyParser.json());//定义数据的格式是json格式
server.use(bodyParser.urlencoded({extended:false}));//把请求头配置成 application/x-www-form-urlencoded
//配置mysql
var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'opo'
});

//配置接口
/*
* 检测是否有这个用户
* url    /getUser
* 请求方式  post
* 参数   user   string
* 返回值  {error：0|1，msg:}
* */
server.post('/getUser',function (req,res) {
    var sql='select * from usertable where user="'+req.body.user+'"';

    db.query(sql,function (err,data) {
        if(err){
           console.log('数据库访问错误')
        }else{
            if(data.length==0){
                res.send({'error':0,msg:'没有此用户'})
            }else{
                res.send({'error':1,msg:'此用户已经注册'})
            }
        }
    })
});

/*
* 登录
* url   /login
    请求方式   post
    参数      user  string
             pass  string
    返回     {error：0|1，msg:}  error 是否有错误  0 没错 1有错                             msg 返回的信息
* */
server.post('/login',function (req,res) {
    var sql='select * from usertable where user="'+req.body.user+'" and pass="'+req.body.pass+'"';

    db.query(sql,function (err,data) {
        if(err){
            console.log('数据库有错'+err);
        }else{
            if(data.length==0){
                res.send({error:1,msg:'用户不存在'})
            }else{
                res.send({error:0,msg:'登录成功'})
            }
        }
    })
});

/*
    * 注册
    * url    /register
        请求方式   post
        参数    user  string       pass  string
        返回    {error：0|1，msg:}  error 是否有错误  0 没错 1有错
                          msg 返回的信息
    * */


server.post('/register',function (req,res) {
    var sql='insert into usertable(user,pass) values("'+req.body.user+'","'+req.body.pass+'")';

    db.query(sql,function (err,data) {
        if(err){
            console.log('数据库有错'+err);
        }else{
            res.send({error:0,msg:'注册成功'})
        }
    })

});

//创建一个监听 配置端口号
server.listen(888);








