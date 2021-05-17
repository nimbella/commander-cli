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
  getCurrentNamespace,
  fileSystemPersister,
} = require('@nimbella/nimbella-deployer');

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

// this function will throw if there is no current namespace
const getUserCreds = async () => {
  const { namespace, ow } = await getCredentials(fileSystemPersister);
  const [username, password] = ow.api_key.split(':');
  return { username, password, namespace };
};

// this function will throw if there is no current namespace
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

const getApiHost = async () => {
  const creds = await getCredentials(fileSystemPersister);
  return creds.ow
    ? creds.ow.apihost
      ? creds.ow.apihost
      : 'https://apigcp.nimbella.io'
    : 'https://apigcp.nimbella.io';
};

const getWorkbenchHost = async () => {
  // eslint-disable-next-line no-extra-parens
  return (await getApiHost()) + '/wb';
};

// this function will throw if there is no current namespace
const getClientCreds = async () => {
  const creds = await getCredentials(fileSystemPersister);
  return creds.commander.clients[creds.commander.currentClient];
};

// this function will throw if there is no current namespace
const getClients = async () => {
  return (await getCredentials(fileSystemPersister)).commander.clients;
};

// this function will throw if there is no current namespace
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

// this function will throw if there is no current namespace
const getAuth = async () => {
  const { username, password } = await getClientCreds();
  return username + ':' + password;
};

// FIXME: this function will not work for all deployments because the url is hardcoded
const getWorkbenchURL = async () => {
  return (
    `${await getWorkbenchHost()}?command=auth login` +
    ` --auth=${await getAuth()}`
  );
};

/**
 * Determines if this is the first time a namespace is loging in to the commander runtime.
 * @returns {Boolean} or {null} return true or false only if there is an active namespace otherwise null
 */
const isFirstLogin = async () => {
  const hasNamespace = await getCurrentNamespace(fileSystemPersister);
  if (hasNamespace) {
    const { commander } = await getCredentials(fileSystemPersister);
    return typeof commander === 'undefined';
  } else {
    return null;
  }
};

module.exports = {
  getApiHost,
  getAuth,
  getWorkbenchURL,
  getUserCreds,
  setClientCreds,
  getClientCreds,
  setCurrentClient,
  isFirstLogin,
  getClients,
  determineClient,
  currentNamespace: () => getCurrentNamespace(fileSystemPersister),
};
