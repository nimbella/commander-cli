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

const { getClientCreds } = require('../../credentials');

module.exports = async args => {
  if (args[0] === 'switch') {
    return await require('./switch')(args);
  } else if (args[0] === 'login') {
    return await require('./login')(args);
  } else {
    const currentClient = await getClientCreds();
    const output = [
      `Currently used credentials:`,
      `Account Name: ${currentClient.accountName}`,
      `Username: ${currentClient.username}`,
      `Client: ${currentClient.client}`,
      '', // Empty line
    ];

    return { text: output.join('\n') };
  }
};
