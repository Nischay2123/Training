// let buffer = new ArrayBuffer(16);
// let view = new Uint32Array(buffer); // 4 integers
// view[0] = 123456;

// console.log(view[0]);

// let buffer = new ArrayBuffer(16); // 16 bytes
// let uint32 = new Uint32Array(buffer); // 4 elements of 4 bytes each

// uint32[0] = 123;
// uint32[1] = 456;

// console.log(uint32); // Uint32Array(4) [123, 456, 0, 0]
// uint32[5] = 8;

// console.log(uint32.buffer);           // underlying ArrayBuffer
// console.log(uint32.byteLength);       // 16
// console.log(uint32.BYTES_PER_ELEMENT);// 4



// let int8 = new Int8Array(buffer);
// console.log(int8[0]); // 123 (first byte of 123 in Uint32)


// let buffer = new ArrayBuffer(16); // create a buffer of length 16
// console.log(buffer.byteLength); // 16


// let buffer = new ArrayBuffer(16); // create a buffer of length 16

// let view = new Uint32Array(buffer); // treat buffer as a sequence of 32-bit integers

// console.log(Uint32Array.BYTES_PER_ELEMENT); // 4 bytes per integer

// console.log(view.length); // 4, it stores that many integers
// console.log(view.byteLength); // 16, the size in bytes

// // let's write a value
// view[0] = 123456;

// // iterate over values
// for(let num of view) {
//   console.log(num); // 123456, then 0, 0, 0 (4 values total)
// }

// binary array of 4 bytes, all have the maximal value 255
let buffer = new Uint8Array([255, 255, 255, 255]).buffer;

let dataView = new DataView(buffer);

// get 8-bit number at offset 0
console.log( dataView.getUint8(0) ); // 255

// now get 16-bit number at offset 0, it consists of 2 bytes, together interpreted as 65535
console.log( dataView.getUint16(0) ); // 65535 (biggest 16-bit unsigned int)

// get 32-bit number at offset 0
console.log( dataView.getUint32(0) ); // 4294967295 (biggest 32-bit unsigned int)

dataView.setUint32(0, 0);

console.log(dataView.getUint32(0));
