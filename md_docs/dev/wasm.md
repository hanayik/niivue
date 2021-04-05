## Introduction

JavaScript is an inherently inefficient task for some numerical operations. One alternative is to use WebGL for compute functions, using the parallel nature of the graphics processing unit (GPU). However, WebGL is only well suited for embarassingly parallel tasks, and also typically suffers from penalties associated with transferring data between the CPU and the GPU. A complementary option is Web Assembly (WASM). WASM provides several performance [benefits](https://dzone.com/articles/webassembly-vs-javascript-is-wasm-faster-than-js-w) for many tasks including smaller file size (faster loading), binary data (for faster compilation and strong typing allowing compiler optimizations. However, implementing Web Assembly into browser-based Vue components can be [fiddly](https://medium.com/@brockreece/vue-webassembly-1a09e38d0389). Here we describe the rationale and method used by niivue.

## A simple example

Here we expand on a simple [WASM example](https://www.freecodecamp.org/news/get-started-with-webassembly-using-only-14-lines-of-javascript-b37b6aaca1e4/). Consider the minimal C program:
```
int squarer(int num) {  return num * num;}
```
We can compile this with an online compiler like [WebAssembly Explorer](https://mbebenita.github.io/WasmExplorer/),  [WasmFiddle](https://wasdk.github.io/WasmFiddle/) or a command line compiler like [llvm](https://richardanaya.medium.com/write-web-assembly-with-llvm-fbee788b2817). These will create a binary file that you can download, here I have named this file `sqr.wasm`. Be aware that the compiler may rename your function, for example WebAssembly Explorer renames the function C function `squarer` as `_Z7squareri`, while WasmFiddle does not change the function name. You can optionally save a text format of the compilation (e.g. `sqr.wat`). We will want to use the binary format for our program, but the human readable text format can help remind you of the function name.

It is possible to load binary files into JavaScript, but the implementation is a bit finicky for browser-based javascript and Vue. Here we will convert the binary to base64 encoding, which allows us to insert the code directly into our JavaScript (though it increases file size and requires decoding to binary). From the Unix command line, one can convert binary into base64 with the command:
```
openssl base64 -in sqr.wasm -out sqr.txt
```
We can now copy this text string into our javascript. Here I call this string `wasmB64`, also note that I am assuming that our C function got renamed `_Z7squareri`: 

```
var wasmB64 =
`AGFzbQEAAAABjICAgAACYAF/AX9gAn9/AX0Dg4CAgAACAAEEhICAgAABcAAABYOA
gIAAAQABBoGAgIAAAAengICAAAMGbWVtb3J5AgALX1o3c3F1YXJlcmkAAAxfWjZz
dW1fdXBQZmkAAQrGgICAAAKHgICAAAAgACAAbAu0gICAAAEBfUMAAAAAIQICQCAB
QQFIDQADQCACIAAqAgCSIQIgAEEEaiEAIAFBf2oiAQ0ACwsgAgs=`
var url57 = 'data:application/wasm;base64,' + wasmB64;
let squarer;
function loadWebAssembly(fileName) {
return fetch(fileName)
	.then(response => response.arrayBuffer())
	.then(buffer => WebAssembly.compile(buffer))
	.then(module => {return new WebAssembly.Instance(module) });
}
await loadWebAssembly(url57)
.then(instance => {
	squarer = instance.exports._Z7squareri;
	console.log('Finished compiling! Ready when you are...');
}); 
console.log("2*2=",squarer(2)) 
console.log("3*3=",squarer(3)) 
console.log("9*9=",squarer(9))
```

Note that one C program can contain multiple functions. Also, note that the WebAssembly is only loaded and compiled once, but can be subsequently used many times.

## Handling Arrays

The toy example above is not computationally slow, and therefore does not require WASM. We will employ WASM for dealing with huge datasets saved as arrays. C functions only return a single value, whereas for many functions we will want to compute several parameters simultaneously (for example, we may want to compute the minimum, 2nd percentile, 98th percentile, and maximum). Therefore, we must either return an array or pass variables by reference. Passing arrays between JavaScript and WASM uses a [shared heap](https://medium.com/@tdeniffel/c-to-webassembly-pass-and-arrays-to-c-86e0cb0464f5). Here we use a simple [wrapper](https://becominghuman.ai/passing-and-returning-webassembly-array-parameters-a0f572c65d97) for handling WASM arrays (for code, see the [Github repository](https://github.com/DanRuta/wasm-arrays).

