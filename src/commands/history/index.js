// Copyright (c) 2020-present, Nimbella, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { join } = require('path');
const { nimbellaDir } = require('@nimbella/nimbella-deployer');

module.exports = async () => {
  const historyFile = join(
    nimbellaDir(),
    'inquirer-command-prompt-history.json'
  );

  // Delete cache
  delete require.cache[historyFile];
  const { histories } = require(historyFile);

  return { text: histories._default.join('\n') };
};
