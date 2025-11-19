const logger = (req,res,next)=>{
    const method = req.method;
    const url = req.url;
    const time = new Date().getFullYear()
    console.log(method, url , time);
    
    next();
}

const authorize = (req,res,next)=>{
    const {user} = req.query;
    if(user=="john") {
        req.user= {name:user,id:2}
        console.log("authorized");
        return next();
    }
    res.send("Unauthorized")
}
module.exports={logger,authorize}