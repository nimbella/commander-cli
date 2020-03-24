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

const firstTimeLogin = (result) => {
    let userID = null, teamID = null;

    if (result.startsWith("Registered successfully with Commander")) {
        const loginAuth = result.split('Auth=')[1];
        const res = shell.exec(`nim auth login --auth=${loginAuth}`, { silent: true });
        if (!res.code) {
            shell.echo(res.output);
        }
        const secret = result.split(":");
        userID = secret[0], teamID = secret[1];
        console.log(
            chalk.white.bgBlack.bold(
                `Successfully registered with Commander\n`)
        );
    } else {
        console.log("Failed to register with Commander");
        shell.exit(1);
    }
    return [userID, teamID];
};

const register = (interactive) => {
    let userID = null, teamID = null;
    const res = shell.exec(`nim auth current --auth`, { silent: true });
    if (res.code) {
        shell.echo("Type register <username> to start working on your serverless commands!");
        if (!interactive) {
            shell.exit(1);
        }
    } else {
        const secret = res.stdout.split(":");
        userID = secret[0], teamID = secret[1];
        if (interactive) {
            shell.echo("Your user id: ", userID);
            shell.echo("Your team id: ", teamID);
        }
    }
    return [userID, teamID];
};

module.exports.register = register;
module.exports.firstTimeLogin = firstTimeLogin;
