'use strict';

// Contains objects like:
// name: { 
//   materials: { 'material_name': { ... } ... },
//   decodeParams: {
//     decodeOffsets: [ ... ],
//     decodeScales: [ ... ],
//   },
//   urls: {
//     url: [
//       { material: 'material_name',
//         attribRange: [#, #],
//         indexRange: [#, #],
//         names: [ 'object names' ... ],
//         lengths: [#, #, # ... ]
//       }
//     ],
//     ...
//   }
// }
var MODELS = {};

var DEFAULT_ATTRIB_ARRAYS = [
  { name: "a_position",
    size: 3,
    stride: 8,
    offset: 0
  }, 
  { name: "a_texcoord",
    size: 2,
    stride: 8,
    offset: 3
  },
  { name: "a_normal",
    size: 3,
    stride: 8,
    offset: 5
  }
];

var DEFAULT_DECODE_PARAMS = {
  decodeOffsets: [-4095, -4095, -4095, 0, 0, -511, -511, -511],
  decodeScales: [1/8191, 1/8191, 1/8191, 1/1023, 1/1023, 1/1023, 1/1023, 1/1023]
};

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

function decompressMeshes(str, meshRanges, decodeParams) {
  // Extract conversion parameters from attribArrays.
  var stride = decodeParams.decodeScales.length;
  var decodeOffsets = decodeParams.decodeOffsets;
  var decodeScales = decodeParams.decodeScales;

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

function downloadMeshes(meshUrlMap, decodeParams, callback) {
  // TODO: Needs an Object.forEach or somesuch.
  for (var url in meshUrlMap) {
    var meshEntry = meshUrlMap[url];
    getHttpRequest(url, (function(meshEntry) {
      return function(xhr) {
        if (xhr.status === 200 || xhr.status === 0) {
          var meshes = decompressMeshes(xhr.responseText,
                                        meshEntry, decodeParams);
          var numMeshes = meshes.length;
          for (var i = 0; i < numMeshes; i++) {
            callback(meshes[i][0], meshes[i][1], meshEntry[i]);
          }
        }  // TODO: handle errors.
      };
    })(meshUrlMap[url]));
  }
}

function downloadModel(model, callback) {
  var model = MODELS[model];
  downloadMeshes(model.urls, model.decodeParams, callback);
}