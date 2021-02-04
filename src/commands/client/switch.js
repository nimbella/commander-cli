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

const { getClients, setCurrentClient } = require('../../credentials');
const { prompt } = require('inquirer');

module.exports = async () => {
  const clients = Object.values(await getClients());
  const choices = [];

  for (const client of clients) {
    choices.push({
      name: `${client.accountName} (${client.client})`,
      value: client,
    });
  }

  try {
    const { account } = await prompt([
      {
        type: 'list',
        name: 'account',
        message: 'Select the account:',
        choices: choices,
      },
    ]);

    await setCurrentClient(account.username);
    return {
      text: `Using ${account.accountName} now.`,
    };
  } catch (err) {
    return {
      text: err.message,
    };
  }
};
