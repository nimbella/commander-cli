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

const inquirer = require("inquirer");
const shell = require("shelljs");
const chalk = require("chalk");
const figlet = require("figlet");
const opn = require('opn');
const terminalLink = require('terminal-link');

let auth = null;
let user_id = null;
let team_id = null;

const knownCommands = [
    "run",
    "help",
    "--help",
    "-h"
];

const commandHelpOutput = "Some useful commands\n" +
    "General control: help    register     app_info\n" +
    "Command control: command_create <command-name>    command_list    command_info <command-name>\n" +
    "CSM control: csm_install <command-set>     csm_info <command-set>   csm_update <command-set>\n" +
    "Log control: app_log     command_log <command-name>  user_log <user-id>\n";

const helpOutput = {
    "What is Commander, what can I do with it?": "https://nimbella.com/resources-commander/overview#what-is-commander",
    "Commander command reference": "https://nimbella.com/resources-commander/reference#command-reference",
    "Creating and deploying custom commands": "https://www.youtube.com/watch?v=HxaLII_IGzY",
    "What are Command-sets and how do I build them?": "https://github.com/nimbella/command-sets",
    "Quick start on using Commander": "https://nimbella.com/resources-commander/quickstart#quickstart"
};

const setupAuth = (output) => {
    auth = output;
    const secret = auth.split(":");
    user_id = secret[0], team_id = secret[1];
};

const login = (interactive) => {
    const res = shell.exec(`nim auth current --auth`, { silent: true });
    if (res.code) {
        shell.echo("Type register <username> to start working on your serverless commands!");
        if (!interactive) {
            shell.exit(1);
        }
    } else {
        setupAuth(res.stdout);
        if (interactive) {
            shell.echo("Your user id: ", user_id);
            shell.echo("Your team id: ", team_id);
        }
    }
};

const init = () => {
    if (!shell.which('nim')) {
        shell.echo('Commander CLI requires nim. ' +
            'You can download and install it by running: ' +
            'npm install -g https://apigcp.nimbella.io/nimbella-cli.tgz');
        shell.exit(1);
    }

    console.log(
        chalk.green(
            figlet.textSync("Commander CLI", {
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
    console.log("CLI which allows you to create, run & publish your serverless functions as commands\n");
    const nimbella = terminalLink('Presented to you by Nimbella', 'https://nimbella.com');
    console.log(nimbella);
    login(true);
};

const getHelp = async(command) => {
    if (command === "help") {
        const help = [
            {
                type: "list",
                name: "HELP",
                message: "Commander-help: (Opens a browser)",
                choices: Object.keys(helpOutput),
                filter: function (val) {
                    return val;
                }
            }
        ];
        const {HELP} = await inquirer.prompt(help);
        console.log(HELP);
        opn(helpOutput[HELP]);
    } else {
        console.log(commandHelpOutput);
    }
};

const getCommand = () => {
    const commands = [
        {
            name: "COMMAND",
            type: "input",
            message: "nc>"
        }
    ];
    return inquirer.prompt(commands);
};

const renderResult = (result) => {
    if (result) {
        if (!user_id || !team_id) {
            if (result.startsWith("Successfully")) {
                setupAuth(result);
                console.log(
                    chalk.white.bgBlack.bold(
                        `Successfully registered with Commander\n`)
                );
            } else {
                console.log("Failed to register with commander");
                shell.exit(1);
            }
        }
        let hyperlink = result.substring(
            result.lastIndexOf("<") + 1,
            result.lastIndexOf(">")
        );
        if (hyperlink) {
           hyperlink = hyperlink.split("|")[0];
           opn(hyperlink);
        }
        console.log(
            chalk.white.bgBlack.bold(`${result}\n`)
        );
    }
};

const runCommand = async (command) => {
    try {
        if ((!user_id || !team_id) && command !== "register") {
            console.log("Type register to start working on Commander");
            return null;
        }
        if (command === "?" || command === "help") {
            getHelp(command);
            return null;
        }

        if (command.startsWith("/nc")) {
            command = command.substring(command.indexOf(" ") + 1);
        } else if (command.startsWith("nim")) {
            shell.exec(command);
            return null;
        }

        if (command.startsWith("app_add")) {
            console.log("Sorry app_add is not supported in the cli mode");
            return null;
        }

        const res = shell.exec(`nim action invoke ` +
            `--auth=72c9288f-bb74-4d41-aee0-a20d1539ab07:DMBuq9iZkSw0GDBC1C9PTl04megr3ycSHXr3k21zguP99mtoniNOlFpMDdtBmREF` +
            ` /nikhilni-5kbaqxyq6lj/portal/gateway ` +
            ` --result -p __ow_headers '{"accept": "application/json", ` +
            `"content-type": "application/x-www-form-urlencoded",` +
            ` "user-agent": "commander-cli" }'` +
            ` -p command /nc -p team_domain commander-cli` +
            ` -p syncRequest '"true"' -p text '${command}'` +
            ` -p user_id ${user_id} -p team_id ${team_id}`,
            { silent: true });
        if (res.code) {
            // TODO: Log to a debug file
            shell.echo('Error: Failed to execute the command');
            shell.exit(1);
        }
        // TODO: Log stdout to a log file
        return JSON.parse(res.stdout).body.text;
    } catch (e) {
        // TODO: Log to a logfile
        // console.log(e);
        return "Error (check logs): " + e.message;
    }
};

const run = async () => {
    let args = process.argv.slice(2);
    if (args.length && !knownCommands.includes(args[0])) {
        shell.echo("Unknown command");
        shell.exit(1);
    } else if (args.length > 1 && args[0] === "run") {
        args = process.argv.slice(3);
        login(false);
        const result = await runCommand(args.join(' '));
        renderResult(result);
    } else {
        init();
        while (true) {
            const command = await getCommand();
            const { COMMAND } = command;
            if (!COMMAND) {
                continue;
            }
            const result = await runCommand(COMMAND);
            renderResult(result);
        }
    }
};

process.on('SIGINT', function() {
    console.log("Shutting down gracefully");
    process.exit();
});

run();
