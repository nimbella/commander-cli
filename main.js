#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const terminalLink = require('terminal-link');
const commanderApi = "https://apigcp.nimbella.io/api/v1/web/nikhilni-5kbaqxyq6lj/portal/gateway";
let auth = null;
let user_id = null;
let team_id = null;

const init = () => {
    if (!shell.which('nim')) {
        shell.echo('Commander CLI requires nim. ' +
            'You can download and install it by running: ' +
            'npm install -g https://apigcp.nimbella.io/nimbella-cli.tgz');
        shell.exit(1);
    }

    const res = shell.exec(`nim auth current --auth`, { silent: true });
    if (res.code) {
        shell.echo("Failed to fetch any auth:", res.stdout);
        shell.exit(1);
    }
    auth = res.stdout;
    const secret = auth.split(":");
    user_id = secret[0], team_id = secret[1];
    console.log("USer id, team id", user_id, team_id);

    console.log(
        chalk.green(
            figlet.textSync("Commander CLI", {
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
    const nimbella = terminalLink('Presented to you by Nimbella', 'https://nimbella.com');
    console.log(nimbella);
}

const getCommand = () => {
    const commands = [
        {
            name: "COMMAND",
            type: "input",
            message: ">"
        }
        /*
        {
            type: "list",
            name: "PARAMS",
            message: "Which command would you like to run?",
            choices: ["nc help", "nc command_create", "nc test", "nc exit"],
            filter: function (val) {
                return val;
            }
        }
        */
    ];
    return inquirer.prompt(commands);
};

const renderResult = (result) => {
    if (result) {
        console.log(
            chalk.white.bgBlack.bold(`${result}\n`)
        );
    }
};

const runCommand = (command) => {
    try {
        if (command === "?") {
            shell.echo('Help output');
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
            { silent: true })
        if (!res) {
            shell.echo('Error: nim command failed');
            shell.exit(1);
        }
        return JSON.parse(res.stdout).body.text;
    } catch (e) {
        // TODO: Log to a logfile
        // console.log(e);
        return "Error (check logs): " + e.message;
    }
}

const run = async () => {
    init();
    while (1) {
        const command = await getCommand();
        const { COMMAND } = command;
        if (!COMMAND) {
            continue;
        }
        const result = runCommand(COMMAND);
        renderResult(result);
    }
};

run();