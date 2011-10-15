'use strict';

var BUDDHA_DECODE_PARAMS = {
  decodeOffsets: [-4095, -4095, -4095, 0, 0, -511, -511, -511],
  decodeScales: [1/8191, 1/8191, 1/8191, 0, 0, 1/1023, 1/1023, 1/1023]
};


function LoaderExample() { }

LoaderExample.prototype = {

num_indices : 0,

load : function(gl)
{
  this.xform = new SglTransformStack();
  this.angle = 0.0;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  var simpleVsrc = id("SIMPLE_VERTEX_SHADER").text;
  var simpleFsrc = id("SIMPLE_FRAGMENT_SHADER").text;
  var program = new Program(gl, [vertexShader(gl, simpleVsrc),
                                 fragmentShader(gl, simpleFsrc)]);
  this.program = program;
  program.use();
  program.enableVertexAttribArrays(NO_TEXCOORD_VERTEX_FORMAT);

  var meshes = [];
  downloadMeshes('', {
    "happy.utf8": [
      { material: "",
        attribRange: [0, 55294],
        indexRange: [442352, 107195],
      },
      { material: "",
        attribRange: [763937, 55294],
        indexRange: [1206289, 107742],
      },
      { material: "",
        attribRange: [1529515, 55294],
        indexRange: [1971867, 107160],
      },
      { material: "",
        attribRange: [2293347, 55294],
        indexRange: [2735699, 106284],
      },
      { material: "",
        attribRange: [3054551, 55294],
        indexRange: [3496903, 107142],
      },
      { material: "",
        attribRange: [3818329, 55294],
        indexRange: [4260681, 107062],
      },
      { material: "",
        attribRange: [4581867, 55294],
        indexRange: [5024219, 105773],
      },
      { material: "",
        attribRange: [5341538, 55294],
        indexRange: [5783890, 107983],
      },
      { material: "",
        attribRange: [6107839, 55294],
        indexRange: [6550191, 104468],
      },
      { material: "",
        attribRange: [6863595, 55294],
        indexRange: [7305947, 102345],
      },
      { material: "",
        attribRange: [7612982, 13733],
        indexRange: [7722846, 24562],
      },
    ],
  }, BUDDHA_DECODE_PARAMS, function(attribArray, indexArray) {
    meshes.push(new Mesh(gl, attribArray, indexArray,
                         NO_TEXCOORD_VERTEX_FORMAT));
  });

  this.meshes = meshes;
},

update : function(gl, dt)
{
  this.angle += 90.0 * dt;
},

draw : function(gl)
{
  // Move some of this (viewport, projection) to a reshape function.
  var w = this.ui.width;
  var h = this.ui.height;

  gl.clearColor(0.4, 0.4, 0.4, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  gl.viewport(0, 0, w, h);

  this.xform.projection.loadIdentity();
  this.xform.projection.perspective(sglDegToRad(60.0), w/h, 0.1, 100.0);

  this.xform.view.loadIdentity();
  this.xform.view.lookAt(0.0, 2.0, 3.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  this.xform.model.loadIdentity();
  this.xform.model.rotate(sglDegToRad(this.angle), 0.0, 1.0, 0.0);

  gl.uniformMatrix4fv(this.program.set_uniform["u_mvp"], false,
                      this.xform.modelViewProjectionMatrix);

  for (var i = 0; i < this.meshes.length; ++i) {
    var mesh = this.meshes[i];
    if (mesh) {
      mesh.bindAndDraw(this.program);
    }
  }
}

};

sglRegisterCanvas("webgl_canvas", new LoaderExample(), 60.0);
