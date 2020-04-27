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

const shell = require('shelljs');
const chalk = require('chalk');

const config = require('./utils/config');
const workbenchURL = 'https://apigcp.nimbella.io/wb';

const isFirstTimeLogin = () => {
  return (
    config.get('userID') === 'ucommandercli' ||
    config.get('teamID') === 'tcommandercli'
  );
};

const firstTimeLogin = result => {
  if (result.startsWith('Registered successfully with Commander')) {
    const loginAuth = result.split('Auth=')[1];
    const res = shell.exec(`nim auth login --auth=${loginAuth}`, {
      silent: true,
    });
    if (!res.code) {
      shell.echo(res.output);
    } else {
      shell.echo('Failed to login to the namespace');
      shell.echo(res.output);
      shell.exit(1);
    }
    const secret = loginAuth.split(':');
    config.set('userID', secret[0]);
    config.set('teamID', secret[1]);
    console.log(
      chalk.white.bgBlack.bold(`Successfully registered with Commander\n`)
    );
  } else {
    console.log('Failed to register with Commander');
    shell.exit(1);
  }
};

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

const setUserCreds = (username, password) => {
  return config.set('accounts.platform', { username, password });
};

const getUserCreds = () => {
  return config.get('accounts.platform');
};

const setClientCreds = (user, team, client) => {
  const clients = config.get('accounts.clients');
  clients[user] = {
    user: user,
    password: team,
    client: client,
  };

  return config.set('accounts.clients', clients);
};

const getClientCreds = () => {
  const accounts = config.get('accounts');

  return accounts.clients[accounts.active];
};

const setActiveAccount = user => {
  return config.set('accounts.active', user);
};

const getAuth = () => {
  const { user, password } = getClientCreds();
  return user + ':' + password;
};

const login = async (args = []) => {
  const { prompt } = require('inquirer');

  const [arg] = args;
  if (args.length === 0) {
    const creds = getClientCreds();
    const output = [
      `Currently used credentials:`,
      `User: ${creds.user}`,
      `Password: ${creds.password}`,
      `Client: ${creds.client}`,
      '', // Empty line
    ];

    console.log(output.join('\n'));

    const clients = Object.values(config.get('accounts.clients'));
    const choices = [];

    for (const client of clients) {
      choices.push({
        name: `${client.client} (${client.user.slice(0, 5)}...)`,
        value: client.user,
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

      setActiveAccount(userId);
      return {
        text: `Using ${userId} now.`,
      };
    } catch (err) {
      return error(err.message);
    }
  }

  const [user, password] = arg.trim().split(':');
  if (!user || !password) {
    return error(`Failed to extract login creds from: ${arg}`);
  }

  setClientCreds(user, password, determineClient(arg.trim()));
  setActiveAccount(user);
  return { text: 'succesfully set your credentials' };
};

const register = interactive => {
  const res = shell.exec(`nim auth current --auth`, { silent: true });
  if (res.code) {
    shell.echo(
      'Type register or login userid:teamid to start working on your serverless commands!'
    );
    if (!interactive) {
      shell.exit(1);
    }
  } else {
    const secret = res.stdout.split(':');
    setClientCreds(secret[0], secret[1].trim(), 'cli');
    setUserCreds(secret[0], secret[1].trim());
    setActiveAccount(secret[0]);

    if (interactive) {
      const { user, client } = getClientCreds();
      console.log(`Your client: ${client} (${user.slice(0, 5)}...)`);
    }
  }
};

const getNs = () => {
  const res = shell.exec(`nim auth current`, { silent: true });
  return res.code ? null : res.stdout.trim();
};

const getWorkbenchURL = () => {
  return `${workbenchURL}?command=auth login` + ` --auth=${getAuth()}`;
};

module.exports = {
  getNs,
  login,
  getAuth,
  register,
  getClientCreds,
  firstTimeLogin,
  getWorkbenchURL,
  isFirstTimeLogin,
  getUserCreds,
  setUserCreds,
};
