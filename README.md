# Commander CLI

A CLI to interact with Commander from your terminal.

## Installation

```sh
nim plugins install commander
```

## Usage

```
$ nim commander help

Commander CLI
A CLI to interact with Commander from your terminal.

USAGE
$ nim commander - launch Commander REPL
$ nim commander help - display help for Commander CLI.
$ nim commander <command> [command_params/command_options] - run commander commands

REPL Commands
.exit - exit the repl
.clear - clear the repl
.help - display help in repl

Commander Commands
command_create <command> [<parameters>] ... - Creates a command & opens online source editor
csm_install <command-set> ... - Install from Nimbella Command Set Registry: https://github.com/nimbella/command-sets

Please refer https://nimbella.com/resources-commander/reference to learn about Commander commands.
```
