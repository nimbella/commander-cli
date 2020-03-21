#!/usr/bin/env node

const inquirer = require("inquirer");
const shell = require("shelljs");
const chalk = require("chalk");
const figlet = require("figlet");
const opn = require('opn');
const terminalLink = require('terminal-link');

let auth = null;
let user_id = null;
let team_id = null;

const helpOutput = {
    "What is Commander, what can I do with it?": "https://nimbella.com/resources-commander/overview#what-is-commander",
    "Commander command reference": "https://nimbella.com/resources-commander/reference#command-reference",
    "Creating and deploying custom commands": "https://www.youtube.com/watch?v=HxaLII_IGzY",
    "What are Command-sets and how do I build them?": "https://github.com/nimbella/command-sets",
    "Quick start on using Commander": "https://nimbella.com/resources-commander/quickstart#quickstart"
}

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
    console.log("Your user id: ", user_id);
    console.log("Your team id: ", team_id);
}

const getHelp = () => {
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
    return inquirer.prompt(help);
};

const getCommand = () => {
    const commands = [
        {
            name: "COMMAND",
            type: "input",
            message: ">"
        }
    ];
    return inquirer.prompt(commands);
};

const renderResult = (result) => {
    if (result) {
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
        if (command === "?" || command === "help") {
            const { HELP } = await getHelp();
            console.log(HELP);
            opn(helpOutput[HELP]);
            return null;
        }

        if (command.startsWith("/nc")) {
            command = command.substring(command.indexOf(" ") + 1);
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
        if (res.code) {
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
        const result = await runCommand(COMMAND);
        renderResult(result);
    }
};

process.on('SIGINT', function() {
    console.log("Shutting down gracefully");
    process.exit();
});

run();