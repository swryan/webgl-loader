'use strict';

var out = window.document.getElementById('output');
var progress = window.document.getElementById('progress');

var decode_ms = 0;

var start_drawing = false;

function updateDecode(ms) {
  decode_ms += ms;
}

function updateTotal(ms) {
  start_drawing = true;
  out.innerHTML = 'Decode time: ' + decode_ms +
      ' ms, Total time: ' + ms + ' ms';
}

var DEFAULT_ATTRIB_ARRAYS = [
  {
    name: 'a_position',
    size: 3,
    stride: 8,
    offset: 0,
    decodeOffset: -4095,
    decodeScale: 1/8191
  },
  {
    name: 'a_texcoord',
    size: 2,
    stride: 8,
    offset: 3,
    decodeOffset: 0,
    decodeScale: 1/1023
  },
  {
    name: 'a_normal',
    size: 3,
    stride: 8,
    offset: 5,
    decodeOffset: -511,
    decodeScale: 1/1023
  }
];

function decompressInner_(str, inputStart, inputEnd,
                          output, outputStart, stride,
                          decodeOffset, decodeScale) {
  var prev = 0;
  for (var j = inputStart; j < inputEnd; j++) {
    var code = str.charCodeAt(j);
    prev += (code >> 1) ^ (-(code & 1));
    output[outputStart] = decodeScale * (prev + decodeOffset);
    outputStart += stride;
  }
}

// This isn't really the correct algorithm anymore, but the inner loop
// is the same.
function decompressSimpleMesh(str, attribArrays) {
  var numVerts = str.charCodeAt(0);
  if (numVerts >= 0xE000) numVerts -= 0x0800;
  numVerts++;

  // Extract conversion parmaters from attribArrays.
  var stride = attribArrays[0].stride;
  var decodeOffsets = new Float32Array(stride);
  var decodeScales = new Float32Array(stride);
  var numArrays = attribArrays.length;
  for (var i = 0; i < numArrays; i++) {
    var attribArray = attribArrays[i];
    var end = attribArray.offset + attribArray.size;
    for (var j = attribArray.offset; j < end; j++) {
      decodeOffsets[j] = attribArray.decodeOffset;
      decodeScales[j] = attribArray.decodeScale;
    }
  }

  // Decode attributes.
  var inputOffset = 1;
  var attribsOut = new Float32Array(stride * numVerts);
  for (var i = 0; i < stride; i++) {
    var end = inputOffset + numVerts;
    var decodeScale = decodeScales[i];
    if (decodeScale) {
      // Assume if decodeScale is never set, simply ignore the
      // attribute.
      decompressInner_(str, inputOffset, end,
                       attribsOut, i, stride,
                       decodeOffsets[i], decodeScale);
    }
    inputOffset = end;
  }

  // Decode indices.
  var numIndices = str.length - inputOffset;
  var indicesOut = new Uint16Array(numIndices);
  var highest = 0;
  for (var i = 0; i < numIndices; i++) {
    var code = str.charCodeAt(i + inputOffset);
    indicesOut[i] = highest - code;
    if (code == 0) {
      highest++;
    }
  }

  return [attribsOut, indicesOut];
}

var meshes = [];
var start_time = Date.now();
var req = new XMLHttpRequest();
req.onload = function(e) {
  if (this.status === 200 || this.status === 0) {
    var decodeStart = Date.now();
    meshes[meshes.length] =
        decompressSimpleMesh(this.responseText, DEFAULT_ATTRIB_ARRAYS);
    updateDecode(Date.now() - decodeStart);
    updateTotal(Date.now() - start_time);
    progress.value = progress.max;
  }
};
req.onprogress = function(e) {
  progress.value = e.loaded;
  progress.max = e.total;
};
req.open('GET', 'happy.utf8', true);
req.send(null);
