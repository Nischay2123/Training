// abort in 1 second
let controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

try {
  let response = await fetch('/article/fetch-abort/demo/hang', {
    signal: controller.signal
  });
} catch(err) {
//   if (err.name == 'AbortError') { // handle abort()
//     console.log("Aborted!");
//   } else {
//     throw err;
    //   }
    console.log("Aborted");
    
}