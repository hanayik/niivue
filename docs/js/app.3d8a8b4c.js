(function(e){function t(t){for(var o,r,l=t[0],s=t[1],c=t[2],v=0,d=[];v<l.length;v++)r=l[v],Object.prototype.hasOwnProperty.call(a,r)&&a[r]&&d.push(a[r][0]),a[r]=0;for(o in s)Object.prototype.hasOwnProperty.call(s,o)&&(e[o]=s[o]);u&&u(t);while(d.length)d.shift()();return i.push.apply(i,c||[]),n()}function n(){for(var e,t=0;t<i.length;t++){for(var n=i[t],o=!0,l=1;l<n.length;l++){var s=n[l];0!==a[s]&&(o=!1)}o&&(i.splice(t--,1),e=r(r.s=n[0]))}return e}var o={},a={app:0},i=[];function r(t){if(o[t])return o[t].exports;var n=o[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=e,r.c=o,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="";var l=window["webpackJsonp"]=window["webpackJsonp"]||[],s=l.push.bind(l);l.push=t,l=l.slice();for(var c=0;c<l.length;c++)t(l[c]);var u=s;i.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var o=n("2b0e"),a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("v-app",[n("v-app-bar",{attrs:{app:""}},[n("v-tabs",{model:{value:e.tab,callback:function(t){e.tab=t},expression:"tab"}},[n("v-tabs-slider",{attrs:{color:"black"}}),e._l(e.appTabs,(function(t){return n("v-tab",{key:t},[e._v(" "+e._s(t)+" ")])}))],2),n("v-spacer"),n("v-btn",{on:{click:function(t){return e.setSliceType(0)}}},[e._v("A")]),n("v-btn",{on:{click:function(t){return e.setSliceType(2)}}},[e._v("S")]),n("v-btn",{on:{click:function(t){return e.setSliceType(1)}}},[e._v("C")]),n("v-btn",{on:{click:function(t){return e.setSliceType(4)}}},[e._v("R")]),n("v-btn",{on:{click:function(t){return e.setSliceType(3)}}},[e._v("MP")])],1),n("v-main",[n("v-row",{staticStyle:{height:"100%"}},[n("v-col",{attrs:{sm:"12",md:"12",lg:"4"}},[n("controls",{attrs:{overlays:e.overlayList}})],1),n("v-col",{attrs:{sm:"12",md:"12",lg:"8"}},[n("glviewer",{attrs:{overlays:e.overlayList}})],1)],1)],1),n("v-footer",{attrs:{app:""}},[n("v-row",[n("v-col",{attrs:{align:"center",justify:"center"}},[n("span",{staticClass:"text-caption"},[e._v(e._s(e.coordinateString))])])],1)],1)],1)},i=[],r=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"mt-5",attrs:{id:"controls"}},[n("v-row",{staticClass:"my-2 mx-2 align-center"},[n("h3",[e._v("Layers")]),n("v-spacer"),n("v-btn",{staticClass:"mx-2",attrs:{small:""},on:{click:e.onAddOverlay}},[e._v("Add overlay")])],1),n("v-row",{attrs:{"no-gutters":""}},[n("v-expansion-panels",[n("draggable",{staticClass:"row mx-2 my-2",attrs:{handle:".drag-handle"},model:{value:e.overlays,callback:function(t){e.overlays=t},expression:"overlays"}},e._l(e.overlays,(function(t,o){return n("v-expansion-panel",{key:o},[n("v-expansion-panel-header",[n("v-row",{staticClass:"align-center",attrs:{"no-gutters":""}},[n("v-icon",{staticClass:"mx-2 drag-handle"},[e._v(" mdi-drag-horizontal-variant ")]),n("v-icon",{staticClass:"mx-2",on:{click:function(t){return t.stopPropagation(),e.toggleEye(t)}}},[e._v(" "+e._s(e.eyeIcon)+" ")]),e._v(e._s(t.name)+" ")],1)],1),n("v-expansion-panel-content",[n("v-row",[n("v-select",{attrs:{items:e.colorMaps,label:"Color map"},on:{change:e.onColorChange},model:{value:e.selectedColorMap,callback:function(t){e.selectedColorMap=t},expression:"selectedColorMap"}})],1),n("v-row",[n("v-col",{staticClass:"px-4"},[n("p",[e._v("Intensity range")]),n("v-range-slider",{staticClass:"align-center",attrs:{max:t.intensityMax,min:t.intensityMin,"hide-details":""},scopedSlots:e._u([{key:"prepend",fn:function(){return[n("v-text-field",{staticClass:"mt-0 pt-0",staticStyle:{width:"60px"},attrs:{value:t.intensityRange[0],"hide-details":"","single-line":"",type:"number"},on:{input:function(n){return e.$set(t.intensityRange,0,n)}}})]},proxy:!0},{key:"append",fn:function(){return[n("v-text-field",{staticClass:"mt-0 pt-0",staticStyle:{width:"60px"},attrs:{value:t.intensityRange[1],"hide-details":"","single-line":"",type:"number"},on:{input:function(n){return e.$set(t.intensityRange,1,n)}}})]},proxy:!0}],null,!0),model:{value:t.intensityRange,callback:function(n){e.$set(t,"intensityRange",n)},expression:"overlay.intensityRange"}})],1)],1),n("v-row",[n("v-col",[n("p",[e._v("Opacity")]),n("v-slider",{attrs:{step:"0.01",max:"1",min:"0","thumb-label":"",ticks:""},on:{input:e.onOpacityChange},model:{value:e.opacity,callback:function(t){e.opacity=t},expression:"opacity"}})],1)],1)],1)],1)})),1)],1)],1)],1)},l=[],s=n("b76a"),c=n.n(s),u=new o["a"],v={props:{overlays:Array},name:"controls",components:{draggable:c.a},data:function(){return{colorSelected:"gray",colorMaps:["gray","Winter","Warm","Plasma","Viridis","Inferno"],selectedColorMap:"gray",eyeIcon:"mdi-eye",overlays_:this.overlays,draggable:!0,opacity:1}},methods:{toggleEye:function(){this.eyeIcon="mdi-eye"==this.eyeIcon?"mdi-eye-off":"mdi-eye"},onColorChange:function(){u.$emit("colormap-change",this.selectedColorMap)},onOpacityChange:function(){u.$emit("opacity-change",this.opacity)},onAddOverlay:function(){alert("adding overlays in this demo is not implemented yet! :)")}}},d=v,f=(n("f5fd"),n("2877")),m=n("6544"),h=n.n(m),p=n("8336"),g=n("62ad"),y=n("cd55"),x=n("49e2"),b=n("c865"),_=n("0393"),T=n("132d"),E=n("5963"),C=n("0fd9"),w=n("b974"),S=n("ba0d"),R=n("2fa4"),P=n("8654"),A=Object(f["a"])(d,r,l,!1,null,"0cd7d8e6",null),M=A.exports;h()(A,{VBtn:p["a"],VCol:g["a"],VExpansionPanel:y["a"],VExpansionPanelContent:x["a"],VExpansionPanelHeader:b["a"],VExpansionPanels:_["a"],VIcon:T["a"],VRangeSlider:E["a"],VRow:C["a"],VSelect:w["a"],VSlider:S["a"],VSpacer:R["a"],VTextField:P["a"]});var D=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"viewer",attrs:{id:"viewer"}},[n("v-dialog",{attrs:{"max-width":"400"},model:{value:e.dialog,callback:function(t){e.dialog=t},expression:"dialog"}},[n("v-color-picker",{attrs:{width:"400",mode:"rgba"},on:{input:e.onCrosshairColorChange},model:{value:e.crosshairColor,callback:function(t){e.crosshairColor=t},expression:"crosshairColor"}})],1),n("v-dialog",{attrs:{"max-width":"400"},model:{value:e.discoMode,callback:function(t){e.discoMode=t},expression:"discoMode"}},[n("v-card",{attrs:{color:"rgba(0, 0, 0, 0.4)"}},[n("v-row",{attrs:{"no-gutters":""}},[n("v-spacer"),n("h2",{staticStyle:{color:"white"}},[e._v("Disco mode")]),n("v-spacer")],1)],1)],1)],1)},W=[],H=(n("d81d"),n("fb6a"),n("b680"),n("d3b7"),n("cfc3"),n("8b09"),n("5cc6"),n("8a59"),n("84c3"),n("9a8c"),n("a975"),n("735e"),n("c1ac"),n("d139"),n("3a7b"),n("d5d6"),n("82f8"),n("e91f"),n("60bd"),n("5f96"),n("3280"),n("3fcc"),n("ca91"),n("25a1"),n("cd26"),n("3c5d"),n("2954"),n("649e"),n("219c"),n("170b"),n("b39a"),n("72f7"),n("0037")),L=(n("4160"),n("ac1f"),n("466d"),n("159b"),function(e,t,n){var o=this;this.program=I(e,t,n);var a=/uniform[^;]+[ ](\w+);/g,i=/uniform[^;]+[ ](\w+);/;this.uniforms={};var r=t.match(a),l=n.match(a);for(var s in r&&r.forEach((function(e){var t=e.match(i);o.uniforms[t[1]]=-1})),l&&l.forEach((function(e){var t=e.match(i);o.uniforms[t[1]]=-1})),this.uniforms)this.uniforms[s]=e.getUniformLocation(this.program,s)});L.prototype.use=function(e){e.useProgram(this.program)};var I=function(e,t,n){var o=e.createShader(e.VERTEX_SHADER);if(e.shaderSource(o,t),e.compileShader(o),!e.getShaderParameter(o,e.COMPILE_STATUS))return alert("Vertex shader failed to compile, see console for log"),console.log(e.getShaderInfoLog(o)),null;var a=e.createShader(e.FRAGMENT_SHADER);if(e.shaderSource(a,n),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))return alert("Fragment shader failed to compile, see console for log"),console.log(e.getShaderInfoLog(a)),null;var i=e.createProgram();return e.attachShader(i,o),e.attachShader(i,a),e.linkProgram(i),e.getProgramParameter(i,e.LINK_STATUS)?i:(alert("Shader failed to link, see console for log"),console.log(e.getProgramInfoLog(i)),null)},B=n("20e7"),V="#version 300 es\n#line 4\nlayout(location=0) in vec3 pos;\nuniform mat4 mvpMtx;\nout vec3 vColor;\nvoid main(void) {\n\tgl_Position = mvpMtx * vec4(2.0 * (pos.xyz - 0.5), 1.0);\n\tvColor = pos;\n}",U="#version 300 es\n#line 15\nprecision highp int;\nprecision highp float;\nuniform vec3 rayDir;\nuniform vec3 texVox;\nuniform highp sampler3D volume;\nuniform highp sampler2D colormap;\nin vec3 vColor;\nout vec4 fColor;\nvec3 GetBackPosition (vec3 startPosition) {\n vec3 invR = 1.0 / rayDir;\n vec3 tbot = invR * (vec3(0.0)-startPosition);\n vec3 ttop = invR * (vec3(1.0)-startPosition);\n vec3 tmax = max(ttop, tbot);\n vec2 t = min(tmax.xx, tmax.yz);\n return startPosition + (rayDir * min(t.x, t.y));\n}\nvoid main() {\n    fColor = vec4(0.0,0.0,0.0,0.0);\n\tvec3 start = vColor;\n\t//fColor = vec4(start, 1.0); return;\n\tvec3 backPosition = GetBackPosition(start);\n\t//fColor = vec4(backPosition, 1.0); return;\n    vec3 dir = backPosition - start;\n    float len = length(dir);\n\tfloat lenVox = length((texVox * start) - (texVox * backPosition));\n\tfloat sliceSize = len / lenVox; //e.g. if ray length is 1.0 and traverses 50 voxels, each voxel is 0.02 in unit cube\n\tfloat stepSize = sliceSize; //quality: larger step is faster traversal, but fewer samples\n\tfloat opacityCorrection = stepSize/sliceSize;\n    dir = normalize(dir);\n\tvec4 deltaDir = vec4(dir.xyz * stepSize, stepSize);\n\tvec4 samplePos = vec4(start.xyz, 0.0); //ray position\n\t//start: OPTIONAL fast pass: rapid traversal until first hit\n\tfloat stepSizeFast = sliceSize * 1.9;\n\tvec4 deltaDirFast = vec4(dir.xyz * stepSizeFast, stepSizeFast);\n\twhile (samplePos.a <= len) {\n\t\tfloat val = texture(volume, samplePos.xyz).r;\n\t\tif (val > 0.01) break;\n\t\tsamplePos += deltaDirFast; //advance ray position\n\t}\n\tif (samplePos.a > len) return;\n\tsamplePos -= deltaDirFast;\n\tif (samplePos.a < 0.0)\n\t\tvec4 samplePos = vec4(start.xyz, 0.0); //ray position\n\t//end: fast pass\n\tvec4 colAcc = vec4(0.0,0.0,0.0,0.0);\n\tconst float earlyTermination = 0.95;\n    float ran = fract(sin(gl_FragCoord.x * 12.9898 + gl_FragCoord.y * 78.233) * 43758.5453);\n    samplePos += deltaDir * ran; //jitter ray\n\twhile (samplePos.a <= len) {\n\t\tfloat val = texture(volume, samplePos.xyz).r;\n\t\tsamplePos += deltaDir; //advance ray position\n\t\tif (val < 0.01) continue;\n\t\tvec4 colorSample = texture(colormap, vec2(val, 0.5)).rgba;\n\t\tcolorSample.a = 1.0-pow((1.0 - colorSample.a), opacityCorrection);\n\t\tcolorSample.rgb *= colorSample.a;\n\t\tcolAcc= (1.0 - colAcc.a) * colorSample + colAcc;\n\t\tif ( colAcc.a > earlyTermination )\n\t\t\tbreak;\n\t}\n\tcolAcc.a = colAcc.a / earlyTermination;\n\tfColor = colAcc;\n}",k="#version 300 es\n#line 81\nlayout(location=0) in vec3 pos;\nuniform int axCorSag;\nuniform float slice;\nuniform vec2 canvasWidthHeight;\nuniform vec4 leftBottomWidthHeight;\nout vec3 texPos;\nvoid main(void) {\n\t//convert pixel x,y space 1..canvasWidth,1..canvasHeight to WebGL 1..-1,-1..1\n\tvec2 frac;\n\tfrac.x = (leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.z)) / canvasWidthHeight.x; //0..1\n\tfrac.y = 1.0 - ((leftBottomWidthHeight.y - leftBottomWidthHeight.w +((1.0 - pos.y) * leftBottomWidthHeight.w)) / canvasWidthHeight.y); //1..0\n\tfrac = (frac * 2.0) - 1.0;\n\tgl_Position = vec4(frac, 0.0, 1.0);\n\tif (axCorSag == 1)\n\t\ttexPos = vec3(pos.x, slice, pos.y);\n\telse if (axCorSag == 2)\n\t\ttexPos = vec3(slice, pos.x, pos.y);\n\telse\n\t\ttexPos = vec3(pos.xy, slice);\n}",F="#version 300 es\n#line 105\nprecision highp int;\nprecision highp float;\nuniform highp sampler3D volume;\nuniform highp sampler2D colormap;\nuniform float opacity;\nin vec3 texPos;\nout vec4 color;\nvoid main() {\n\tcolor = vec4(texture(colormap, vec2(texture(volume, texPos).r, 0.5)).rgb, opacity);\n}",z="#version 300 es\n#line 119\nprecision highp int;\nprecision highp float;\nuniform vec4 lineColor;\nout vec4 color;\nvoid main() {\n\tcolor = lineColor;\n}",O="#version 300 es\n#line 130\nlayout(location=0) in vec3 pos;\nuniform vec2 canvasWidthHeight;\nuniform vec4 leftBottomWidthHeight;\nout float vColor;\nvoid main(void) {\n\t//convert pixel x,y space 1..canvasWidth,1..canvasHeight to WebGL 1..-1,-1..1\n\tvec2 frac;\n\tfrac.x = (leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.z)) / canvasWidthHeight.x; //0..1\n\tfrac.y = 1.0 - ((leftBottomWidthHeight.y - leftBottomWidthHeight.w +((1.0 - pos.y) * leftBottomWidthHeight.w)) / canvasWidthHeight.y); //1..0\n\tfrac = (frac * 2.0) - 1.0;\n\tgl_Position = vec4(frac, 0.0, 1.0);\n\tvColor = pos.x;\n}",X="#version 300 es\n#line 147\nprecision highp int;\nprecision highp float;\nuniform highp sampler2D colormap;\nin float vColor;\nout vec4 color;\nvoid main() {\n\tcolor = vec4(texture(colormap, vec2(vColor, 0.5)).rgb, 1.0);\n}",N="#version 300 es\n#line 159\nlayout(location=0) in vec3 pos;\nuniform vec2 canvasWidthHeight;\nuniform vec4 leftBottomWidthHeight;\nvoid main(void) {\n\t//convert pixel x,y space 1..canvasWidth,1..canvasHeight to WebGL 1..-1,-1..1\n\tvec2 frac;\n\tfrac.x = (leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.z)) / canvasWidthHeight.x; //0..1\n\tfrac.y = 1.0 - ((leftBottomWidthHeight.y - leftBottomWidthHeight.w +((1.0 - pos.y) * leftBottomWidthHeight.w)) / canvasWidthHeight.y); //1..0\n\tfrac = (frac * 2.0) - 1.0;\n\tgl_Position = vec4(frac, 0.0, 1.0);\n}",G=.05,$=1,j=[0,0,0,1],Y=0,q=1,J=2,K=3,Q=4,Z=K,ee=120,te=15,ne=[1,0,0,1],oe=[.5,.5,.5],ae=1,ie=null,re=.05,le=null,se=null,ce=null,ue=null,ve=null,de=null,fe=[0,0],me=0,he=[{leftBottomWidthHeight:[1,0,0,1],axCorSag:Y},{leftBottomWidthHeight:[1,0,0,1],axCorSag:Y},{leftBottomWidthHeight:[1,0,0,1],axCorSag:Y},{leftBottomWidthHeight:[1,0,0,1],axCorSag:Y}],pe=1;function ge(e,t){Z==Q&&(fe=[e,t])}function ye(e,t){Z==Q&&(ee+=e-fe[0],te+=t-fe[1],fe=[e,t],Ue(Ee(),ie))}function xe(e){ne=e,Ue(Ee(),ie)}function be(e){Z=e,Ue(Ee(),ie)}function _e(e){pe=e,Ue(Ee(),ie)}function Te(e){ae=e,Ue(Ee(),ie)}function Ee(){var e=document.querySelector("#gl").getContext("webgl2");return e||null}function Ce(e,t){var n,o=t.volume,a=o.hdr.cal_min,i=o.hdr.cal_max,r=e.length,l=new Uint8ClampedArray(r),s=1;for(i>a&&(s=255/(i-a)),n=0;n<r-1;n++){var c=e[n];c=c*o.hdr.scl_slope+o.hdr.scl_inter,l[n]=(c-a)*s}return l}function we(e,t){var n,o=t.volume,a=e.length,i=1/0,r=-1/0;for(n=0;n<a-1;n++)isFinite(e[n])&&(e[n]<i&&(i=e[n]),e[n]>r&&(r=e[n]));isFinite(o.hdr.scl_slope)&&isFinite(o.hdr.scl_inter)&&0!==o.hdr.scl_slope?(i=i*o.hdr.scl_slope+o.hdr.scl_inter,r=r*o.hdr.scl_slope+o.hdr.scl_inter):(o.hdr.scl_slope=1,o.hdr.scl_inter=0),o.hdr.global_min=i,o.hdr.global_max=r,(!isFinite(o.hdr.cal_min)||!isFinite(o.hdr.cal_max)||o.hdr.cal_min>=o.hdr.cal_max)&&(o.hdr.cal_min=i,o.hdr.cal_max=r)}function Se(e){var t=null,n=null,o=e.volumeURL,a=new XMLHttpRequest;a.open("GET",o,!0),a.responseType="arraybuffer",a.onerror=function(){console.log="Error Loading Volume"},a.onload=function(){var o=a.response;o?(t=H["readHeader"](o),n=H["isCompressed"](o)?H["readImage"](t,H["decompress"](o)):H["readImage"](t,o)):(alert("Unable to load buffer properly from volume?"),console.log("no buffer?")),e.volume.hdr=t,e.volume.img=n,ie=e,Ae(Ee(),e.colorMap),Pe(Ee(),e)},a.send()}function Re(e){ce=new L(e,k,F),ce.use(e),e.uniform1i(ce.uniforms["volume"],0),e.uniform1i(ce.uniforms["colormap"],1),ue=new L(e,N,z),ve=new L(e,V,U),ve.use(e),e.uniform1i(ve.uniforms["volume"],0),e.uniform1i(ve.uniforms["colormap"],1),de=new L(e,O,X),de.use(e),e.uniform1i(de.uniforms["colormap"],1)}function Pe(e,t){var n=[0,1,0,1,1,0,0,1,1,1,1,1,1,0,1,1,1,0,1,0,0,0,1,0,0,0,0,0,1,1,0,0,1,1,0,1,0,0,0,1,0,0],o=e.createVertexArray();e.bindVertexArray(o);var a=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,new Float32Array(n),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0);var i=t.volume.hdr,r=t.volume.img,l=null;2===i.datatypeCode?l=new Uint8Array(r):4===i.datatypeCode?l=new Int16Array(r):16===i.datatypeCode?l=new Float32Array(r):512===i.datatypeCode&&(l=new Uint16Array(r)),we(l,t);var s=Ce(l,t);se&&e.deleteTexture(se),se=e.createTexture(),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_3D,se),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_WRAP_R,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_3D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texStorage3D(e.TEXTURE_3D,1,e.R8,i.dims[1],i.dims[2],i.dims[3]),e.texSubImage3D(e.TEXTURE_3D,0,0,0,0,i.dims[1],i.dims[2],i.dims[3],e.RED,e.UNSIGNED_BYTE,s),Ue(e,t)}function Ae(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=Me([0,255],[0,255],[0,255],[0,128],[0,255]);"Winter"===t&&(n=Me([0,0,0],[0,128,255],[255,196,128],[0,64,128],[0,128,255])),"Warm"===t&&(n=Me([255,255,255],[127,196,254],[0,0,0],[0,64,128],[0,128,255])),"Plasma"===t&&(n=Me([13,156,237,240],[8,23,121,249],[135,158,83,33],[0,56,80,88],[0,64,192,255])),"Viridis"===t&&(n=Me([68,49,53,253],[1,104,183,231],[84,142,121,37],[0,56,80,88],[0,65,192,255])),"Inferno"===t&&(n=Me([0,120,237,240],[0,28,105,249],[4,109,37,33],[0,56,80,88],[0,64,192,255])),null!==le&&e.deleteTexture(le),le=e.createTexture(),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,le),e.texStorage2D(e.TEXTURE_2D,1,e.RGBA8,256,1),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_R,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texSubImage2D(e.TEXTURE_2D,0,0,0,256,1,e.RGBA,e.UNSIGNED_BYTE,n),console.log("set colormap",t)}function Me(e,t,n,o,a){for(var i=new Uint8ClampedArray(1024),r=0;r<a.length-1;r++)for(var l=a[r],s=a[r+1],c=s-l,u=4*l,v=l;v<=s;v++){var d=(v-l)/c;i[u]=e[r]+d*(e[r+1]-e[r]),u++,i[u]=t[r]+d*(t[r+1]-t[r]),u++,i[u]=n[r]+d*(n[r+1]-n[r]),u++,i[u]=o[r]+d*(o[r+1]-o[r]),u++}return i}function De(e,t){var n=t.volume.hdr,o=[1,n.dims[1]*n.pixDims[1],n.dims[2]*n.pixDims[2],n.dims[3]*n.pixDims[3]],a=Math.max(o[1],Math.max(o[2],o[3])),i=[o[1]/a,o[2]/a,o[3]/a];i=i.map((function(e){return e*ae}));var r=[n.dims[1],n.dims[2],n.dims[3]];return{volScale:i,vox:r}}function We(e,t,n,o){if(Z!==Q&&!(me<1||e.canvas.height<1||e.canvas.width<1))for(var a=0;a<me;a++){var i=he[a].axCorSag;if(!(i>J)){var r=he[a].leftBottomWidthHeight,l=(n-r[0])/r[2],s=(r[1]-o)/r[3];if(l>=0&&l<1&&s>=0&&s<1)return i===Y&&(oe[0]=l,oe[1]=s),i===q&&(oe[0]=l,oe[2]=s),i===J&&(oe[1]=l,oe[2]=s),void Ue(e,t)}}}function He(e,t){if(!(t[2]<=0||t[3]<=0)){if($>0){ue.use(e),e.uniform4fv(ue.uniforms["lineColor"],ne),e.uniform2fv(ue.uniforms["canvasWidthHeight"],[e.canvas.width,e.canvas.height]);var n=[t[0]-1,t[1]+1,t[2]+2,t[3]+2];e.uniform4f(ue.uniforms["leftBottomWidthHeight"],n[0],n[1],n[2],n[3]),e.drawArrays(e.TRIANGLE_STRIP,5,4)}de.use(e),e.uniform2fv(de.uniforms["canvasWidthHeight"],[e.canvas.width,e.canvas.height]),e.uniform4f(de.uniforms["leftBottomWidthHeight"],t[0],t[1],t[2],t[3]),e.drawArrays(e.TRIANGLE_STRIP,5,4)}}function Le(e,t,n){var o=[oe[0],oe[1],oe[2]];if(1===n&&(o=[oe[0],oe[2],oe[1]]),2===n&&(o=[oe[1],oe[2],oe[0]]),ce.use(e),e.uniform1f(ce.uniforms["opacity"],pe),e.uniform1i(ce.uniforms["axCorSag"],n),e.uniform1f(ce.uniforms["slice"],o[2]),e.uniform2fv(ce.uniforms["canvasWidthHeight"],[e.canvas.width,e.canvas.height]),e.uniform4f(ce.uniforms["leftBottomWidthHeight"],t[0],t[1],t[2],t[3]),e.drawArrays(e.TRIANGLE_STRIP,5,4),he[me].leftBottomWidthHeight=t,he[me].axCorSag=n,me+=1,!($<=0)){ue.use(e),e.uniform4fv(ue.uniforms["lineColor"],ne),e.uniform2fv(ue.uniforms["canvasWidthHeight"],[e.canvas.width,e.canvas.height]);var a=t[0]+t[2]*o[0];e.uniform4f(ue.uniforms["leftBottomWidthHeight"],a-$,t[1],$,t[3]),e.drawArrays(e.TRIANGLE_STRIP,5,4);var i=t[1]-t[3]*o[1];e.uniform4f(ue.uniforms["leftBottomWidthHeight"],t[0],i-$,t[2],$),e.drawArrays(e.TRIANGLE_STRIP,5,4)}}function Ie(e,t){var n=De(e,t),o=n.volScale,a=n.vox;ve.use(e),e.canvas.width<e.canvas.height?e.viewport(0,.5*(e.canvas.height-e.canvas.width),e.canvas.width,e.canvas.width):e.viewport(.5*(e.canvas.width-e.canvas.height),0,e.canvas.height,e.canvas.height),e.clearColor(.2,0,0,1);var i=B["a"].create(),r=-.54;B["a"].translate(i,i,[0,0,r]);var l=(90-te-o[0])*Math.PI/180;B["a"].rotate(i,i,l,[-1,0,0]),l=ee*Math.PI/180,B["a"].rotate(i,i,l,[0,0,1]),B["a"].scale(i,i,o);var s=B["a"].create();B["a"].invert(s,i);var c=B["c"].fromValues(0,0,-1,1);B["c"].transformMat4(c,c,s);var v=B["b"].fromValues(c[0],c[1],c[2]);B["b"].normalize(v,v);var d=1e-5;Math.abs(v[0])<d&&(v[0]=d),Math.abs(v[1])<d&&(v[1]=d),Math.abs(v[2])<d&&(v[2]=d),e.uniformMatrix4fv(ve.uniforms["mvpMtx"],!1,i),e.uniform3fv(ve.uniforms["rayDir"],v),e.uniform3fv(ve.uniforms["texVox"],a),e.drawArrays(e.TRIANGLE_STRIP,0,14);var f="azimuth: "+ee.toFixed(0)+" elevation: "+te.toFixed(0);return u.$emit("crosshair-pos-change",f),f}function Be(e){var t=B["c"].fromValues(oe[0],oe[1],oe[2],1),n=e.volume.hdr.dims,o=B["c"].fromValues(n[1],n[2],n[3],1),a=e.volume.hdr.affine,i=B["a"].fromValues(a[0][0],a[1][0],a[2][0],a[3][0],a[0][1],a[1][1],a[2][1],a[3][1],a[0][2],a[1][2],a[2][2],a[3][2],a[0][3],a[1][3],a[2][3],a[3][3]);B["c"].mul(t,t,o);var r=B["c"].fromValues(-.5,-.5,-.5,0);return B["c"].add(t,t,r),B["c"].transformMat4(t,t,i),t}function Ve(e,t,n){var o=e.canvas.clientWidth/t;n*o>e.canvas.clientHeight&&(o=e.canvas.clientHeight/n);var a=t*o,i=n*o,r=[.5*(e.canvas.clientWidth-a),e.canvas.clientHeight-.5*(e.canvas.clientHeight-i),a,i];return r}function Ue(e,t){if(e.clearColor(j[0],j[1],j[2],j[3]),e.clear(e.COLOR_BUFFER_BIT),Z===Q)return Ie(e,t);var n=De(e,t),o=n.volScale;if(e.viewport(0,0,e.canvas.width,e.canvas.height),me=0,Z===Y){var a=Ve(e,o[0],o[1]);Le(e,a,0)}else if(Z===q){var i=Ve(e,o[0],o[2]);Le(e,i,1)}else if(Z===J){var r=Ve(e,o[1],o[2]);Le(e,r,2)}else{var l=Ve(e,o[0]+o[1],o[1]+o[2]),s=l[2]*o[0]/(o[0]+o[1]),c=l[2]-s,v=l[3]*o[1]/(o[1]+o[2]),d=l[3]-v;Le(e,[l[0],l[1],s,v],0),Le(e,[l[0],l[1]-v,s,d],1),Le(e,[l[0]+s,l[1]-v,c,d],2);var f=re*v;He(e,[l[0]+s+f,l[1]-f,c-f-f,v*G])}e.finish();var m=Be(t),h=m[0].toFixed(2)+"×"+m[1].toFixed(2)+"×"+m[2].toFixed(2);return u.$emit("crosshair-pos-change",h),h}u.$on("colormap-change",(function(e){Ae(Ee(),e),Ue(Ee(),ie)}));var ke={name:"glviewer",props:{overlays:Array,shader:String},created:function(){u.$on("slice-type-change",(function(e){be(e)}))},data:function(){return{selectedOverlay:0,mouseDown:!1,zDown:!1,discoMode:!1,discoModeColorMapTimer:null,discoModeCrosshairTimer:null,scale:1,dialog:!1,crosshairColor:{r:255,g:0,b:0,a:1},colorMaps:["Winter","Warm","Plasma","Viridis","Inferno"],selectedColorMap:"Winter"}},watch:{overlays:{deep:!0,handler:function(){}}},methods:{onWindowResize:function(){var e=100,t=document.querySelector("#gl"),n=document.querySelector("#viewer");t.width=n.clientWidth,t.height=n.clientHeight,n.getBoundingClientRect().bottom>document.documentElement.clientHeight&&(n.style.height=document.documentElement.clientHeight-e,t.height=document.documentElement.clientHeight-e),Ue(this.gl,this.overlays[this.selectedOverlay])},onCrosshairColorChange:function(){var e=[this.crosshairColor.r/255,this.crosshairColor.g/255,this.crosshairColor.b/255,this.crosshairColor.a];xe(e)}},mounted:function(){var e=this,t=document.createElement("canvas");t.classList.add("fillParent");var n=document.querySelector("#viewer");t.id="gl",t.width=n.clientWidth,t.height=n.clientHeight,n.appendChild(t);var o=document.querySelector("#gl"),a=o.getContext("webgl2");a.canvas.addEventListener("mousedown",(function(t){t.preventDefault(),e.dialog=!1,e.mouseDown=!0;var n=o.getBoundingClientRect();We(e.gl,e.overlays[0],t.clientX-n.left,t.clientY-n.top),ge(t.clientX-n.left,t.clientY-n.top)})),a.canvas.addEventListener("touchstart",(function(t){t.preventDefault(),e.dialog=!1,e.mouseDown=!0;var n=o.getBoundingClientRect();We(e.gl,e.overlays[0],t.touches[0].clientX-n.left,t.touches[0].clientY-n.top),ge(t.touches[0].clientX-n.left,t.touches[0].clientY-n.top)})),a.canvas.addEventListener("mousemove",(function(t){if(e.mouseDown){var n=o.getBoundingClientRect();We(e.gl,e.overlays[0],t.clientX-n.left,t.clientY-n.top),ye(t.clientX-n.left,t.clientY-n.top)}})),a.canvas.addEventListener("touchmove",(function(t){if(e.mouseDown){var n=o.getBoundingClientRect();We(e.gl,e.overlays[0],t.touches[0].clientX-n.left,t.touches[0].clientY-n.top),ye(t.touches[0].clientX-n.left,t.touches[0].clientY-n.top)}})),a.canvas.addEventListener("wheel",(function(t){e.zDown&&(t.preventDefault(),e.scale+=-.01*t.deltaY,Te(e.scale))})),a.canvas.addEventListener("mouseup",(function(){e.mouseDown=!1})),a.canvas.addEventListener("touchend",(function(){e.mouseDown=!1})),a.canvas.addEventListener("contextmenu",(function(t){t.preventDefault(),e.dialog=!0})),window.addEventListener("keypress",(function(t){"z"===t.key&&(e.zDown=!0),"d"===t.key&&(e.discoMode=0==e.discoMode,clearInterval(e.discoModeColorMapTimer),clearInterval(e.discoModeCrosshairTimer),e.discoMode?(e.discoModeColorMapTimer=setInterval((function(){u.$emit("colormap-change",e.colorMaps[Math.floor(Math.random()*e.colorMaps.length)])}),200),e.discoModeCrosshairTimer=setInterval((function(){xe([Math.random(),Math.random(),Math.random(),1])}),200)):(u.$emit("colormap-change","gray"),xe([1,0,0,1])))})),window.addEventListener("keyup",(function(t){"z"===t.key&&(e.zDown=!1)})),window.addEventListener("resize",this.onWindowResize),this.gl=a,this.gl.enable(this.gl.CULL_FACE),this.gl.cullFace(this.gl.FRONT),this.gl.enable(this.gl.BLEND),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA),Re(this.gl),Se(this.overlays[this.selectedOverlay]),u.$on("opacity-change",(function(e){_e(e)}))}},Fe=ke,ze=(n("ec3b"),n("b0af")),Oe=n("03a4"),Xe=n("169a"),Ne=Object(f["a"])(Fe,D,W,!1,null,"6a5c6257",null),Ge=Ne.exports;h()(Ne,{VCard:ze["a"],VColorPicker:Oe["a"],VDialog:Xe["a"],VRow:C["a"],VSpacer:R["a"]});var $e={name:"App",components:{controls:M,glviewer:Ge},created:function(){var e=this;u.$on("crosshair-pos-change",(function(t){e.coordinateString=t}))},data:function(){return{tab:null,appTabs:["Menu","Draw","Edit","Scripting"],coordinateString:"0x0x0",overlayList:[{volumeURL:"./mni152.nii.gz",volume:{hdr:null,img:null},name:"mni152.nii.gz",intensityMin:0,intensityMax:100,intensityRange:[0,100],colorMap:"gray",opacity:100}]}},methods:{setSliceType:function(e){u.$emit("slice-type-change",e)}}},je=$e,Ye=n("7496"),qe=n("40dc"),Je=n("553a"),Ke=n("f6c4"),Qe=n("71a3"),Ze=n("fe57"),et=n("9a96"),tt=Object(f["a"])(je,a,i,!1,null,null,null),nt=tt.exports;h()(tt,{VApp:Ye["a"],VAppBar:qe["a"],VBtn:p["a"],VCol:g["a"],VFooter:Je["a"],VMain:Ke["a"],VRow:C["a"],VSpacer:R["a"],VTab:Qe["a"],VTabs:Ze["a"],VTabsSlider:et["a"]});var ot=n("f309");n("bf40");o["a"].use(ot["a"]);var at=new ot["a"]({});o["a"].config.productionTip=!1,new o["a"]({vuetify:at,render:function(e){return e(nt)}}).$mount("#app")},a8bb:function(e,t,n){},dc92:function(e,t,n){},ec3b:function(e,t,n){"use strict";n("a8bb")},f5fd:function(e,t,n){"use strict";n("dc92")}});
//# sourceMappingURL=app.3d8a8b4c.js.map