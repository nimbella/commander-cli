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

const {
  addCommanderData,
  getCredentials,
  fileSystemPersister,
} = require('nimbella-deployer');

const workbenchURL = 'https://apigcp.nimbella.io/wb';

/**
 * Returns the client name based on the length of the token.
 * @param {string} token - The login token.
 * @returns {("slack"| "mattermost"|"teams"|"cli")} - The client name.
 */
const determineClient = token => {
  if (token.length === 19) {
    return 'slack';
  } else if (token.length === 53) {
    return 'mattermost';
  } else if (token.length === 127) {
    return 'teams';
  } else {
    return 'cli';
  }
};

const getUserCreds = async () => {
  const { namespace, ow } = await getCredentials(fileSystemPersister);
  const [username, password] = ow.api_key.split(':');
  return { username, password, namespace };
};

const setClientCreds = async ({ accountName, username, password, client }) => {
  const { commander = { clients: {} }, ow, namespace } = await getCredentials(
    fileSystemPersister
  );
  commander.clients[username] = {
    accountName,
    username,
    password,
    client,
  };
  commander.currentClient = username;

  return await addCommanderData(
    ow.apihost,
    namespace,
    commander,
    fileSystemPersister
  );
};

const getClientCreds = async () => {
  const creds = await getCredentials(fileSystemPersister);

  return creds.commander.clients[creds.commander.currentClient];
};

const getClients = async () => {
  return (await getCredentials(fileSystemPersister)).commander.clients;
};

const setCurrentClient = async user => {
  const { commander, ow, namespace } = await getCredentials(
    fileSystemPersister
  );
  commander.currentClient = user;

  return await addCommanderData(
    ow.apihost,
    namespace,
    commander,
    fileSystemPersister
  );
};

const getAuth = async () => {
  const { username, password } = await getClientCreds();
  return username + ':' + password;
};

const getWorkbenchURL = async () => {
  return `${workbenchURL}?command=auth login` + ` --auth=${await getAuth()}`;
};

const isFirstLogin = async () => {
  const { commander } = await getCredentials(fileSystemPersister);
  if (typeof commander === 'undefined') {
    return true;
  }

  return false;
};

module.exports = {
  getAuth,
  getWorkbenchURL,
  getUserCreds,
  setClientCreds,
  getClientCreds,
  setCurrentClient,
  isFirstLogin,
  getClients,
  determineClient,
};
