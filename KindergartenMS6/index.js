//引入express,
var express=require('express');
//引入MySQL
var mysql=require('mysql');
//引入配置post的模块
var bodyParse=require('body-Parser');
//搭建服务器,让别人能访问我
var server=express();
console.log(__dirname)
//监听静态文件
server.use(express.static(__dirname+'/public'));
//配置post
server.use(bodyParse.json())//定义数据格式json格式
server.use(bodyParse.urlencoded());//请求头类型
//配置数据库
var db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'opo2020',
    timezone:'+08:00'
});
/* 1、查询部门列表
接口地址：/getDepList
数据不需要
返回{state:0,data:[{id,name,msg,pos:[{pId,pName,pNum},{}...]},{},{}...]}
id 数据主键id
name  部门名称
msg   部门描述
* */

function find(id,res) {
    if(res.length){
        for(var i=0;i<res.length;i++){
            if(res[i].id==id){
                return i //找到相同的了，返回对应的下标
            }
        }
    }
    return -1//没有找到相同的
}

function changeData(data){
    var res=[];

    for(var i=0;i<data.length;i++){
        //data[i] --->{d_id: 1,d_name:'教育部',d_msg:'主要负责面向全体幼儿1',p_name:'老师'}

        var n=find(data[i].d_id,res);//查找有没有相同的部门id
        a:
            if(n!=-1){//找到相同部门的了
                for(var j=0;j<res[n].pos.length;j++){
                    if(res[n].pos[j].pName==data[i].p_name){ //判断有没有相同的职位
                        res[n].pos[j].pNum+=1;
                        break a;
                    }
                }
                if(data[i].w_id){  //判断有没有空职位，没人
                    res[n].pos.push({
                        pName:data[i].p_name,
                        pNum:1,
                        pId:data[i].p_id
                    })
                }else{
                    res[n].pos.push({
                        pName:data[i].p_name,
                        pNum:0,
                        pId:data[i].p_id
                    })
                }

            }else{//没有找到相同的部门
                var json={
                    id:data[i].d_id,
                    name:data[i].d_name,
                    msg:data[i].d_msg,
                    pos:[]
                };
                if(data[i].w_id){  //判断这个职位有没有人
                    json.pos.push({
                        pName:data[i].p_name,
                        pNum:1,
                        pId:data[i].p_id
                    });
                }else{
                    json.pos.push({
                        pName:data[i].p_name,
                        pNum:0,
                        pId:data[i].p_id
                    });
                }

                res.push(json);
            }


    }

    return res;
}

server.get('/getDepList',function (request,response) {
    //request 前端给后台的内容，
    //response 后台给前端的内容
    var sql='SELECT * FROM t_dep LEFT JOIN t_position ON t_position.p_dep_id=t_dep.d_id LEFT JOIN t_worker ON t_worker.w_pos_id=t_position.p_id';

    db.query(sql,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err});
        }else{
            //data--->  [{d_id部门id，d_name部门名称，d_msg部门描述，p_name职位},{},{}]
            response.send({state:0,data:changeData(data)})
        }
    })

});
//配置服务器的端口 1-65535 80是默认端口,在地址栏中不用写


/*
* 3、删除部门
    接口地址 /delDep
    数据{id}
    返回{state}
* */
server.post('/delDep',function (request,response) {
    console.log(request.body.id);
    /*DELETE FROM t_position WHERE p_dep_id=7;
DELETE FROM t_dep WHERE d_id=7;*/
    var sql1='DELETE FROM t_position WHERE p_dep_id='+request.body.id;
    var sql2='DELETE FROM t_dep WHERE d_id='+request.body.id;
    console.log(sql1,sql2);
    db.query(sql1,function (err,data) {
        if(!err){
            db.query(sql2,function (err,data) {
                if(err){
                    response.send({state:1,msg:err});
                    console.log(err);
                }else{
                    response.send({state:0});
                }
            })
        }else{
            console.log(err);
            response.send({state:1,msg:err});
        }
    })
});

/*4编辑部门*/
/*
* 4、改
    接口地址 /editDep
    数据{id,name,msg,pos:[{p_id:1,pName:'老师1'}]}
    返回{state}
* */
/*
* INSERT INTO t_position VALUES(NULL,'111',15),
(NULL,'222',15)
* */

server.post('/editDep',function (request,response) {
    console.log(request.body);

    var sql1='UPDATE t_dep SET d_name="'+request.body.name+'",d_msg="'+request.body.msg+'" WHERE d_id='+request.body.id;

    var str='';
    var arr=[];
    var posArr=[];//去放职位信息

    for(var i=0;i<request.body.pos.length;i++){
        if(request.body.pos[i].pId!=0){  //判断职位的id是不是0
            str+='WHEN '+request.body.pos[i].pId+' THEN "'+request.body.pos[i].nName+'" ';
            arr.push(request.body.pos[i].pId);
        }else{
            posArr.push('(NULL,"'+request.body.pos[i].nName+'",'+request.body.id+')')
        }

    }
    var sql2=`UPDATE t_position
                SET p_name=CASE p_id
                    ${str}
                end
                WHERE p_id IN(${arr.join(',')})`;

    console.log(sql2)

    db.query(sql1,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err})
        }else{
            db.query(sql2,function (err,data) {
                if(err){
                    console.log(err);
                    response.send({state:1,msg:err})
                }else{
                    if(posArr.length){
                        var sql3=`INSERT INTO t_position VALUES${posArr.join(',')}`;
                        db.query(sql3,function (err,data) {
                            if(err){
                                console.log(err);
                                response.send({state:1,msg:err})
                            }else{
                                response.send({state:0})
                            }
                        })
                    }else{
                        response.send({state:0})
                    }
                }
            })
        }
    })
});

/*
* 新增部门
    接口地址 /addDep
    数据{name,msg,pos:['aaa','bbb']}
    pos  职位名称
* */
server.get('/addDep',function (request,response) {
    //先增加部门。就会有部门id  去增加职位
    console.log(request.query);
    var sql1='INSERT INTO t_dep VALUES(NULL,"'+request.query.name+'","'+request.query.msg+'")';

    db.query(sql1,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err});
        }else{
            /*INSERT INTO t_position VALUES(NULL,'111',15),
(NULL,'222',15)*/
            var id=data.insertId;
            var arr=[];
            for(var i=0;i<request.query.pos.length;i++){
                arr.push('(NULL,"'+request.query.pos[i]+'",'+id+')');
            }
            var sql2=`INSERT INTO t_position VALUES${arr.join(',')}`;

            db.query(sql2,function (err,data) {
                if(err){
                    console.log(err);
                    response.send({state:1,msg:err});
                }else{
                    response.send({state:0,id:id});
                }
            })
        }
    })
});


/*删除职位的接口*/
server.get('/delPos',function (request,response) {
    console.log(request.query.id);
    var sql='DELETE FROM t_position WHERE p_id='+request.query.id+';'

    db.query(sql,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err})
        }else{
            response.send({state:0})
        }
    })
});


/*获取员工页面一共有多少条数据*/
/*
* 1、查有多少条数据
        /getWorkerNum
        返回{state:0,num}   num 表示条数
* */

server.get('/getWorkerNum',function (request,response) {
    var sql='SELECT COUNT(*) as "num" FROM t_worker';

    db.query(sql,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err})
        }else{
            response.send({state:0,num:data[0].num})
        }
    })
});

/*2查看默认第一页的所有数据*/
/*
* /getPageCon
数据{page}  page是页数
返回{state,data:[{id,name,sex,tel,dep,pos,pState，date,email，urgent，idCard,birthday},{},....]}
* */
server.get('/getPageCon',function (request,response){
    console.log(request.query.page)
    var sql=`SELECT *
            FROM t_worker JOIN t_position JOIN t_dep
            ON t_worker.w_pos_id=t_position.p_id AND t_position.p_dep_id=t_dep.d_id
            ORDER BY w_id
            LIMIT ${(request.query.page-1)*5},5`;

    db.query(sql,function (err,data) {
        if(err){
            console.log(err);
            response.send({state:1,msg:err})
        }else{
            response.send({state:0,data:data})
        }
    })

});

/*删除职工的接口*/
server.get('/delWorker',function (request,response) {
    console.log(request.query);
    var arr=[];
    for (var i =0;i<request.query.id.length;i++){
        arr.push(request.query.id[i]);
    }
    var sql=`delete from t_worker where w_id in(${arr.join(',')})`;
    
    db.query(sql,function (err,data) {
        if (err){
            console.log(err);
            response.send({state:1,msg:err})
        }else{
            response.send({state:0})
        }

    })
})
server.listen(8000);








