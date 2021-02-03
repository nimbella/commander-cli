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

const chalk = require('chalk');
const shell = require('shelljs');
const { setClientCreds, determineClient } = require('../../credentials');
const { invokeCommand } = require('../../utils');
const error = msg => ({ attachments: [{ color: 'danger', text: msg }] });

module.exports = async args => {
  const [, token] = args;
  if (!token) {
    return {
      text:
        'Please provide valid arguments.\n ex: nim commander client login <cli_login_token>',
    };
  }

  const username = token.slice(0, token.lastIndexOf(':'));
  const password = token.slice(token.lastIndexOf(':') + 1);
  if (!username || !password) {
    return error(`Failed to extract login creds from: ${token}`);
  }

  const res = await invokeCommand('cli_login ' + token, token);
  if (!res.data || !res.data.text) {
    return error(`Failed to login using creds: ${token}`);
  }
  const cmd = shell.exec('nim auth login --auth ' + res.data.text);
  if (cmd.code) {
    return error(`Failed to login to the accountName`);
  }
  const accountName = shell
    .exec('nim auth current', { silent: true })
    .stdout.replace(/\r?\n|\r/g, ' ');
  const client = determineClient(token.trim());
  await setClientCreds({ accountName, username, password, client });
  return { text: 'Logged in successfully to ' + chalk.green(accountName) };
};
