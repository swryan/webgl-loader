'use strict';

var DEFAULT_ATTRIB_ARRAYS = [
  { name: "a_position",
    size: 3,
    stride: 8,
    offset: 0,
    decodeOffset: -4095,
    decodeScale: 1/8191
  }, 
  { name: "a_texcoord",
    size: 2,
    stride: 8,
    offset: 3,
    decodeOffset: 0,
    decodeScale: 1/1023
  },
  { name: "a_normal",
    size: 3,
    stride: 8,
    offset: 5,
    decodeOffset: -511,
    decodeScale: 1/1023
  }
];

// TODO: will it be an optimization to specialize this method at
// runtime for different combinations of stride, decodeOffset and
// decodeScale?
function decompressAttribsInner_(str, inputStart, inputEnd,
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

function decompressIndices_(str, inputStart, numIndices,
                            output, outputStart) {
  var highest = 0;
  for (var i = 0; i < numIndices; i++) {
    var code = str.charCodeAt(inputStart++);
    output[outputStart++] = highest - code;
    if (code == 0) {
      highest++;
    }
  }
}

function getDecodeParameters_(attribArrays, decodeOffsets, decodeScales) {
  var numArrays = attribArrays.length;
  for (var i = 0; i < numArrays; i++) {
    var attribArray = attribArrays[i];
    var end = attribArray.offset + attribArray.size;
    for (var j = attribArray.offset; j < end; j++) {
      decodeOffsets[j] = attribArray.decodeOffset;
      decodeScales[j] = attribArray.decodeScale;
    }
  }
}

function decompressSimpleMesh(str, attribArrays) {
  var numVerts = str.charCodeAt(0);
  if (numVerts >= 0xE000) numVerts -= 0x0800;
  numVerts++;

  // Extract conversion parameters from attribArrays.
  var stride = attribArrays[0].stride;  // TODO: generalize.
  var decodeOffsets = new Float32Array(stride);
  var decodeScales = new Float32Array(stride);
  getDecodeParameters_(attribArrays, decodeOffsets, decodeScales);

  // Decode attributes.
  var inputOffset = 1;
  var attribsOut = new Float32Array(stride * numVerts);
  for (var i = 0; i < stride; i++) {
    var end = inputOffset + numVerts;
    var decodeScale = decodeScales[i];
    if (decodeScale) {
      // Assume if decodeScale is never set, simply ignore the
      // attribute.
      decompressAttribsInner_(str, inputOffset, end,
                              attribsOut, i, stride,
                              decodeOffsets[i], decodeScale);
    }
    inputOffset = end;
  }

  // Decode indices.
  var numIndices = str.length - inputOffset;
  var indicesOut = new Uint16Array(numIndices);
  decompressIndices_(str, inputOffset, numIndices, indicesOut, 0);

  return [attribsOut, indicesOut];
}

function decompressMeshes(str, meshRanges, attribArrays) {
  // Extract conversion parameters from attribArrays.
  var stride = attribArrays[0].stride;  // TODO: generalize.
  var decodeOffsets = new Int32Array(stride);
  var decodeScales = new Float32Array(stride);
  getDecodeParameters_(attribArrays, decodeOffsets, decodeScales);

  var meshes = [];
  var numMeshes = meshRanges.length;
  for (var i = 0; i < numMeshes; i++) {
    var meshParams = meshRanges[i];
    var attribStart = meshParams.attribRange[0];
    var numVerts = meshParams.attribRange[1];

    // Decode attributes.
    var inputOffset = attribStart;
    var attribsOut = new Float32Array(stride * numVerts);
    for (var j = 0; j < stride; j++) {
      var end = inputOffset + numVerts;
      var decodeScale = decodeScales[j];
      if (decodeScale) {
        // Assume if decodeScale is never set, simply ignore the
        // attribute.
        decompressAttribsInner_(str, inputOffset, end,
                                attribsOut, j, stride,
                                decodeOffsets[j], decodeScale);
      }
      inputOffset = end;
    }

    var indexStart = meshParams.indexRange[0];
    var numIndices = 3*meshParams.indexRange[1];
    var indicesOut = new Uint16Array(numIndices);
    decompressIndices_(str, inputOffset, numIndices, indicesOut, 0);
    meshes.push([attribsOut, indicesOut]);
  }

  return meshes;
}

function downloadMeshes(meshUrlMap, attribArrays, callback) {
  // TODO: Needs an Object.forEach or somesuch.
  for (var url in meshUrlMap) {
    var meshEntry = meshUrlMap[url];
    getHttpRequest(url, (function(meshEntry) {
      return function(xhr) {
        if (xhr.status === 200 || xhr.status === 0) {
          var meshes = decompressMeshes(xhr.responseText,
                                        meshEntry,
                                        attribArrays);
          var numMeshes = meshes.length;
          for (var i = 0; i < numMeshes; i++) {
            callback(meshes[i][0], meshes[i][1], meshEntry[i]);
          }
        }  // TODO: handle errors.
      };
    })(meshUrlMap[url]));
  }
}
