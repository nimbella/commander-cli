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

const login = creds => {
  if (!creds) {
    console.log('No credentials given');
    return;
  }
  const secret = creds.split(':');
  if (!secret || secret.length !== 2) {
    console.log('Failed to extract login creds from:', creds);
    return;
  }
  config.set('userID', secret[0]);
  config.set('teamID', secret[1]);

  console.log(
    'Temporarily using the following creds: ',
    config.get('userID'),
    config.get('teamID')
  );
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
    config.set('userID', secret[0]);
    config.set('teamID', secret[1]);

    if (interactive) {
      shell.echo(
        'Your namespace: ',
        shell.exec(`nim auth current`, { silent: true })
      );
      shell.echo('Your user id: ', config.get('userID'));
      shell.echo('Your team id: ', config.get('teamID'));
    }
  }
};

const getUser = () => {
  return config.get('userID');
};

const getTeam = () => {
  return config.get('teamID');
};

const getAuth = () => {
  return config.get('userID') + ':' + config.get('teamID');
};

const getWorkbenchURL = () => {
  return `${workbenchURL}?command=auth login` + ` --auth=${getAuth()}`;
};

module.exports = {
  register,
  firstTimeLogin,
  getUser,
  getTeam,
  getAuth,
  getWorkbenchURL,
  isFirstTimeLogin,
  login,
};
