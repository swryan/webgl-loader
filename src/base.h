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
#ifndef WEBGL_LOADER_BASE_H_
#define WEBGL_LOADER_BASE_H_

#include <stdio.h>

typedef unsigned short uint16;
typedef short int16;

#ifdef putc_unlocked
# define PutChar putc_unlocked
#else
# define PutChar putc
#endif  // putc_unlocked

#ifndef CHECK
# define CHECK(PRED) if (!(PRED)) {                             \
    fprintf(stderr, "%d: CHECK failed: " #PRED "\n", __LINE__); \
    exit(-1); } else
#endif  // CHECK

#endif  // WEBGL_LOADER_BASE_H_
