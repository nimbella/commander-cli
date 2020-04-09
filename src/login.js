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

const shell = require("shelljs");
const chalk = require("chalk");

let userID = "ucommandercli";
let teamID = "tcommandercli";
const workbenchURL = "https://apigcp.nimbella.io/wb";

const isFirstTimeLogin = () => {
  return userID === "ucommandercli" || teamID === "tcommandercli";
};

const firstTimeLogin = result => {
  if (result.startsWith("Registered successfully with Commander")) {
    const loginAuth = result.split("Auth=")[1];
    const res = shell.exec(`nim auth login --auth=${loginAuth}`, {
      silent: true,
    });
    if (!res.code) {
      shell.echo(res.output);
    } else {
      shell.echo("Failed to login to the namespace");
      shell.echo(res.output);
      shell.exit(1);
    }
    const secret = loginAuth.split(":");
    userID = secret[0];
    teamID = secret[1];
    console.log(
      chalk.white.bgBlack.bold(`Successfully registered with Commander\n`)
    );
  } else {
    console.log("Failed to register with Commander");
    shell.exit(1);
  }
};

const login = creds => {
  if (!creds) {
    console.log("No credentials given");
    return;
  }
  const secret = creds.split(":");
  if (!secret || secret.length !== 2) {
    console.log("Failed to extract login creds from:", creds);
    return;
  }
  userID = secret[0];
  teamID = secret[1];
  console.log("Temporarily using the following creds: ", userID, teamID);
};

const register = interactive => {
  const res = shell.exec(`nim auth current --auth`, { silent: true });
  if (res.code) {
    shell.echo(
      "Type register or login userid:teamid to start working on your serverless commands!"
    );
    if (!interactive) {
      shell.exit(1);
    }
  } else {
    const secret = res.stdout.split(":");
    userID = secret[0];
    teamID = secret[1];
    if (interactive) {
      shell.echo(
        "Your namespace: ",
        shell.exec(`nim auth current`, { silent: true })
      );
      shell.echo("Your user id: ", userID);
      shell.echo("Your team id: ", teamID);
    }
  }
};

const getUser = () => {
  return userID;
};

const getTeam = () => {
  return teamID;
};

const getAuth = () => {
  return userID + ":" + teamID;
};

const getWorkbenchURL = () => {
  return `${workbenchURL}?command=auth login` + ` --auth=${getAuth()}`;
};

module.exports.register = register;
module.exports.firstTimeLogin = firstTimeLogin;
module.exports.getUser = getUser;
module.exports.getTeam = getTeam;
module.exports.getAuth = getAuth;
module.exports.getWorkbenchURL = getWorkbenchURL;
module.exports.isFirstTimeLogin = isFirstTimeLogin;
module.exports.login = login;
