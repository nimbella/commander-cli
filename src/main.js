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
const figlet = require('figlet');
const open = require('open');
const terminalLink = require('terminal-link');
const login = require('./login');
const renderResult = require('./render');

const init = () => {
  if (!shell.which('nim')) {
    console.log(
      'Commander CLI requires nim. You can install it by following the instructions at https://nimbella.io/downloads/nim/nim.html#install-the-nimbella-command-line-tool-nim'
    );
    process.exit(1);
  }

  console.log(
    chalk.green(
      figlet.textSync('Commander CLI', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );
  console.log(
    'CLI which allows you to create, run & publish your serverless functions as commands\n'
  );
  const nimbella = terminalLink(
    'Presented to you by Nimbella\n',
    'https://nimbella.com'
  );
  console.log(nimbella);
  login.register(true);
};

const getHelp = () => {
  const helpOutput = [
    `${chalk.bold('Commander CLI')}`,
    `A CLI to interact with Commander from your terminal.`,
    '', // Empty line
    `${chalk.bold('USAGE')}`,
    `$ ${chalk.green('nc')} - launch Commander REPL`,
    `$ ${chalk.green('nc help')} - display help for Commander CLI.`,
    `$ ${chalk.green(
      'nc <command> [command_params/command_options]'
    )} - run commander commands`,
    '', // Empty line
    `${chalk.bold('REPL Commands')}`,
    `${chalk.green('.exit')} - exit the repl`,
    `${chalk.green('.clear')} - clear the repl`,
    `${chalk.green('.help')} - display help in repl`,
    '', // Empty line
    `${chalk.bold('Commander Commands')}`,
    `${chalk.green(
      'command_create <command> [<parameters>] ...'
    )} - Creates a command & opens online source editor`,
    `${chalk.green(
      'csm_install <command-set> ...'
    )} - Install from Nimbella Command Set Registry: https://github.com/nimbella/command-sets`,
    '', // Empty line
    `Please refer https://nimbella.com/resources-commander/reference to learn about Commander commands.`,
  ];

  return helpOutput.join('\n');
};

const runCommand = async command => {
  let misc_data = {};
  let ns = null;

  try {
    if (login.isFirstTimeLogin() && command !== 'register') {
      console.log('Type register to start working on Commander');
      return null;
    }
    if (command === '?' || command === 'help') {
      getHelp(command);
      return null;
    }

    if (command.startsWith('login')) {
      login.login(command.substring(command.indexOf(' ') + 1));
      return null;
    }

    if (command === 'workbench') {
      open(login.getWorkbenchURL());
      return null;
    }

    if (command.startsWith('/nc')) {
      command = command.substring(command.indexOf(' ') + 1);
    } else if (command.startsWith('nim')) {
      shell.exec(command);
      return null;
    }

    if (command.startsWith('app_add') || command.startsWith('app_delete')) {
      console.log(
        'Sorry app addition/deletion is not supported in the cli mode'
      );
      return null;
    }

    if (command === 'register' && (ns = login.getNs())) {
      misc_data = Object.assign(misc_data, { '"namespace"': `"${ns}"` });
    }
    misc_data = JSON.stringify(misc_data);

    const res = shell.exec(
      `nim action invoke ` +
        `--auth=3d4d42c1-700e-4806-a267-dc633c68d174:f1LSnYE61RuqMuHg4Ac8TlrNBrKjE5C0CO0Q5NQzscmSLOWMCf5jsXUKitgdnCi7` +
        ` /nc-dev/portal/gateway ` +
        ` --result -p __ow_headers "{\\"accept\\": \\"application/json\\", ` +
        `\\"content-type\\": \\"application/x-www-form-urlencoded\\",` +
        ` \\"user-agent\\": \\"commander-cli\\" }"` +
        ` -p command /nc -p team_domain commander-cli` +
        ` -p syncRequest \\"true\\" -p text \"${command}\"` +
        ` -p user_id ${login.getUser()} -p team_id ${login.getTeam()} -p misc "${misc_data}"`,
      { silent: true }
    );

    if (res.code) {
      // TODO: Log to a debug file
      shell.echo(res.stdout);
      return 'Error: Failed to execute the command';
    }
    // TODO: Log stdout to a log file
    // console.log(res.stdout);
    return res.stdout;
  } catch (e) {
    // TODO: Log to a logfile
    // console.log(e);
    return 'Error (check logs): ' + e.message;
  }
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    if (['help', '--help', '-h'].includes(args[0])) {
      console.log(getHelp());
      process.exit();
    } else {
      login.register(false);
      const result = await runCommand(args.join(' '));
      console.log(renderResult(result));
    }
  } else {
    init();
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: 'nc> ',
      removeHistoryDuplicates: true,
    });

    rl.prompt();

    rl.on('line', async line => {
      const command = line.trim();
      switch (command) {
        case '.exit':
          process.exit();
          break;
        case '':
          rl.prompt();
          break;
        case '.clear':
          console.clear();
          break;
        case 'write':
          process.stdout.write('coolshit\n');
          break;
        case '.help':
        case '?':
          console.log(getHelp());
          break;
        default: {
          const result = await runCommand(command);

          const browserDependentCommands = [
            'command_create',
            'command_code',
            'secret_create',
          ];

          if (browserDependentCommands.includes(command.split(/\s/)[0])) {
            const link = JSON.parse(result).body.text.match(/<(.+)\|(.+)>/)[1];
            console.log('Opening your default browser...');
            await open(link);
          } else {
            const output = renderResult(result);
            console.log(output);
          }
          break;
        }
      }

      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Bye!');
      process.exit();
    });
  }
}

main().catch(error => console.log(`nc> ${error.message}`));
