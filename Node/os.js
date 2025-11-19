const os = require('os')

// const user = os.userInfo();
// console.log(user);

// console.log(`This system uptime is ${os.uptime()} second`);


const currentOS= {
    name: os.type(),
    totalMem: os.totalmem(),
    release: os.release(),
    freeMem: os.freemem()
}

console.log(currentOS);
