/*
 * Nimbella CONFIDENTIAL
 * ---------------------
 *
 *   2018 - present Nimbella Corp
 *   All Rights Reserved.
 *
 * NOTICE:
 *
 * All information contained herein is, and remains the property of
 * Nimbella Corp and its suppliers, if any.  The intellectual and technical
 * concepts contained herein are proprietary to Nimbella Corp and its
 * suppliers and may be covered by U.S. and Foreign Patents, patents
 * in process, and are protected by trade secret or copyright law.
 *
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Nimbella Corp.
 */

const chalk = require('chalk');
const workbenchURL = 'https://apigcp.nimbella.io/wb';

const {
  addCommanderData,
  getCredentials,
  fileSystemPersister,
} = require('nimbella-cli/lib/deployer');

let creds = {};
async function getCurrentCreds() {
  creds = await getCredentials(fileSystemPersister);
}
getCurrentCreds().catch(err => console.error(err));

const error = msg => ({ attachments: [{ color: 'danger', text: msg }] });

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

const getUserCreds = () => {
  const { namespace, ow } = creds;
  const [username, password] = ow.api_key.split(':');
  return { username, password, namespace };
};

const setClientCreds = async (user, team, client) => {
  const commander = creds.commander || { clients: {} };
  commander.clients[user] = {
    username: user,
    password: team,
    client: client,
  };
  commander.currentClient = user;

  return await addCommanderData(
    creds.ow.apihost,
    creds.namespace,
    commander,
    fileSystemPersister
  );
};

const getClientCreds = () => {
  return creds.commander.clients[creds.commander.currentClient];
};

const getClients = () => {
  return creds.commander.clients;
};

const setCurrentClient = async user => {
  const commander = creds.commander;
  commander.currentClient = user;

  return await addCommanderData(
    creds.ow.apihost,
    creds.namespace,
    commander,
    fileSystemPersister
  );
};

const getAuth = () => {
  const { username, password } = getClientCreds();
  return username + ':' + password;
};

const login = async (args = []) => {
  const { prompt } = require('inquirer');

  const [arg] = args;
  if (args.length === 0) {
    const currentClient = getClientCreds();
    const output = [
      `Currently used credentials:`,
      `User: ${currentClient.username}`,
      `Client: ${currentClient.client}`,
      '', // Empty line
    ];

    console.log(output.join('\n'));

    const clients = Object.values(getClients());
    const choices = [];

    for (const client of clients) {
      choices.push({
        name: `${client.client} (${client.username.slice(0, 5)}...)`,
        value: client.username,
      });
    }

    try {
      const { userId } = await prompt([
        {
          type: 'list',
          name: 'userId',
          message: 'Select the account:',
          choices: choices,
        },
      ]);

      setCurrentClient(userId);
      return {
        text: `Using ${userId} now.`,
      };
    } catch (err) {
      return error(err.message);
    }
  }

  const user = arg.slice(0, arg.lastIndexOf(':'));
  const password = arg.slice(arg.lastIndexOf(':') + 1);
  if (!user || !password) {
    return error(`Failed to extract login creds from: ${arg}`);
  }

  const client = determineClient(arg.trim());
  setClientCreds(user, password, client);
  return { text: 'Logged in successfully to ' + chalk.green(client) };
};

const getWorkbenchURL = () => {
  return `${workbenchURL}?command=auth login` + ` --auth=${getAuth()}`;
};

const isFirstLogin = () => {
  if (typeof creds.commander === 'undefined') {
    return true;
  }

  return false;
};

module.exports = {
  login,
  getAuth,
  getWorkbenchURL,
  getUserCreds,
  setClientCreds,
  getClientCreds,
  setCurrentClient,
  isFirstLogin,
  getClients,
};
