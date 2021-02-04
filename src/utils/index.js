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

const axios = require('axios');
const {
  getClientCreds,
  getUserCreds,
  setClientCreds,
} = require('../credentials');

const invokeCommand = async (command, body = {}) => {
  const { username, password, namespace } = await getUserCreds();
  const clientCreds = await getClientCreds();
  const gateway = 'https://apigcp.nimbella.io/api/v1/web/nc/portal/cli-gateway';

  const __ow_headers = {
    accept: 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const messageBody = {
    command: '/nc',
    team_domain: 'commander-cli',
    syncRequest: 'true',
    user_id: clientCreds.username,
    team_id: clientCreds.password,
    text: command,
    ...body,
  };

  if (command === 'register' && clientCreds.client === 'cli') {
    messageBody.misc = Object.assign({}, { namespace: namespace });
  }

  return await axios.post(gateway, messageBody, {
    headers: {
      'user-agent': 'commander-cli',
      __ow_headers,
      ...messageBody,
    },
    auth: {
      username,
      password,
    },
  });
};

const register = async () => {
  const { username, password } = await getUserCreds();
  await setClientCreds({
    accountName: 'Commander CLI',
    username,
    password,
    client: 'cli',
  });

  process.stdout.write(
    "Please wait, we're registering your account with commander..."
  );

  try {
    const res = await invokeCommand('register');
    const text = res.data.attachments
      ? res.data.attachments[0].text
      : res.data.text;
    if (
      !text.startsWith('Registered successfully with Commander') &&
      !text.startsWith("You've already registered with Commander")
    ) {
      console.log(text);
      console.log('Failed to register with Commander');
      process.exit(1);
    } else {
      process.stdout.write(' done\n\n');
      console.log("Type 'help' anytime for tips and guidance.");
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error(
        '\nInvalid credentials. Please run `nim auth refresh` or login again using `nim auth login`.'
      );
      process.exit(1);
    }

    console.error(error.message);
    console.log(
      'If you are unsure what to do next please raise an issue at https://github.com/nimbella/commander-cli/issues'
    );
    process.exit(1);
  }

  const { username: user, client } = await getClientCreds();
  const { namespace } = await getUserCreds();
  console.log(`Your client: ${client} (${user.slice(0, 5)}...)`);
  console.log('Your namespace: ' + namespace);
};

module.exports = {
  invokeCommand,
  register,
};
