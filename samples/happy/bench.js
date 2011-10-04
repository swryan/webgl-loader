var out = window.document.getElementById('output');

var decode_ms = 0;

var start_drawing = false;

function updateDecode(ms) {
  decode_ms += ms;
}

function updateTotal(ms) {
  start_drawing = true;
  out.innerHTML = "Decode time: " + decode_ms +
      " ms, Total time: " + ms + " ms";
}

var URLS = [ 'happy.A.utf8',
             'happy.B.utf8',
             'happy.C.utf8',
             'happy.D.utf8',
             'happy.E.utf8',
             'happy.F.utf8',
             'happy.G.utf8',
             'happy.H.utf8',
             'happy.I.utf8',
             'happy.J.utf8',
             'happy.K.utf8' ];

var DEFAULT_ATTRIB_ARRAYS = {
  a_position: {
    size: 3,
    stride: 8,
    offset: 0,
    decodeOffset: -4095,
    decodeScale: 1/8191
  },
  a_texcoord: {
    size: 2,
    stride: 8,
    offset: 3,
    decodeOffset: 0,
    decodeScale: 1/1023
  },
  a_normal: {
    size: 3,
    stride: 8,
    offset: 5,
    decodeOffset: -511,
    decodeScale: 1/1023
  }
};

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

function decompressSimpleMesh(str, attribArrays) {
  var numVerts = str.charCodeAt(0);
  if (numVerts >= 0xE000) numVerts -= 0x0800;
  numVerts++;

  // Extract conversion parmaters from attribArrays.
  var stride = attribArrays.a_position.stride;  // TODO: generalize.
  var decodeOffsets = new Float32Array(stride);
  var decodeScales = new Float32Array(stride);
  for (var key in attribArrays) {
    var attribArray = attribArrays[key];
    var end = attribArray.offset + attribArray.size;
    for (var i = attribArray.offset; i < end; i++) {
      decodeOffsets[i] = attribArray.decodeOffset;
      decodeScales[i] = attribArray.decodeScale;
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
for (var i = 0; i < URLS.length; ++i) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    if (this.status === 200 || this.status === 0) {
      var decodeStart = Date.now();
      meshes[meshes.length] =
        decompressSimpleMesh(this.responseText, DEFAULT_ATTRIB_ARRAYS);
      updateDecode(Date.now() - decodeStart);
      if (meshes.length === URLS.length) {
        updateTotal(Date.now() - start_time);
      }
    }
  };
  req.open('GET', URLS[i], true);
  req.send(null);
}
