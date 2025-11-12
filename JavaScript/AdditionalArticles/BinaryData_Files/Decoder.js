// let uint8Array = new Uint8Array([72, 101, 108, 108, 111]);

// console.log(new TextDecoder().decode(uint8Array));



// let uint8Array = new Uint8Array([0, 72, 101, 108, 108, 111, 0]);

// the string is in the middle
// create a new view over it, without copying anything
// let binaryString = uint8Array.subarray(1, -1);

// console.log(new TextDecoder().decode(binaryString)); 





let encoder = new TextEncoder();

let uint8Array = encoder.encode("Hello");
console.log(uint8Array); // 72,101,108,108,111



