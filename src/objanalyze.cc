#if 0  // A cute trick to making this .cc self-building from shell.
g++ $0 -O2 -Wall -Werror -o `basename $0 .cc`;
exit;
#endif
// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

#include "mesh.h"
#include "optimize.h"

void PrintCacheAnalysisRow(const IndexList& indices, const size_t cache_size,
                           const size_t num_verts, const size_t num_tris) {
  const size_t misses = CountFifoCacheMisses(indices, cache_size);
  const double misses_as_double = static_cast<double>(misses);
  printf("||%zu||%zu||%f||%f||\n", cache_size, misses,
         misses_as_double / num_verts, misses_as_double / num_tris);
}

void PrintCacheAnalysisTable(const size_t count, const char** args,
                             const IndexList& indices, 
                             const size_t num_verts, const size_t num_tris) {
  puts("||Cache Size||# misses||ATVR||ACMR||");
  for (size_t i = 0; i < count; ++i) {
    int cache_size = atoi(args[i]);
    if (cache_size > 1) {
      PrintCacheAnalysisRow(indices, cache_size, num_verts, num_tris);
    }
  }
}

int main(int argc, const char* argv[]) {
  if (argc < 2) {
    fprintf(stderr, "Usage: %s in.obj [list of cache sizes]\n\n"
            "\tPerform vertex cache analysis on in.obj using specified sizes.\n"
            "\tFor example: %s in.obj 6 16 24 32\n"
            "\tMaximum cache size is 32.\n\n",
            argv[0], argv[0]);
    return -1;
  }
  FILE* fp = fopen(argv[1], "r");
  WavefrontObjFile obj(fp);
  fclose(fp);
  std::vector<DrawMesh> meshes;
  obj.CreateDrawMeshes(&meshes);
  const DrawMesh& draw_mesh = meshes[0];
  const size_t num_verts = draw_mesh.attribs.size() / 8;
  const size_t num_tris = draw_mesh.indices.size() / 3;

  printf("%zu vertices, %zu triangles\n\n", num_verts, num_tris);

  size_t count = 4;
  const char* default_args[] = { "6", "16", "24", "32" };
  const char** args = &default_args[0];
  if (argc > 2) {
    count = argc - 1;
    args = argv + 1;
  }
  
  puts("Before:\n");
  PrintCacheAnalysisTable(count, args, draw_mesh.indices,
                          num_verts, num_tris);
  QuantizedAttribList attribs;
  AttribsToQuantizedAttribs(meshes[0].attribs, &attribs);
  QuantizedAttribList optimized_attribs;
  IndexList optimized_indices;
  VertexOptimizer vertex_optimizer(attribs, meshes[0].indices);
  vertex_optimizer.GetOptimizedMesh(&optimized_attribs, &optimized_indices);

  puts("\nAfter:\n");
  PrintCacheAnalysisTable(count, args, optimized_indices,
                          num_verts, num_tris);

  return 0;
}
