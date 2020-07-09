// Copyright (c) 2020-present, Nimbella, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const chalk = require('chalk');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer(),
});

const formatBlockElement = element => {
  const blockOutput = [];

  switch (element.type) {
    case 'context': {
      for (const item of element.elements) {
        blockOutput.push(item.text.replace(/\*/g, '**') + ' ');
      }
      break;
    }
    case 'section': {
      if (element.fields && element.fields.length > 0) {
        for (const field of element.fields) {
          blockOutput.push(field.text.replace(/\*/g, '**') + '\n');
        }
      } else if (element.text) {
        blockOutput.push(element.text.text.replace(/\*/g, '**'));
      }
      break;
    }
    case 'divider': {
      blockOutput.push('***');
      break;
    }
  }

  return blockOutput.join('');
};

const formatText = (text = '') => {
  return (
    text
      // Replace slack date element with actual date.
      // Ex: replaces <!date...|13 Apr> with "13 Apr"
      .replace(/<(!.+)\|(.+)>/g, '$2')
      // Replace slack link element with actual http link.
      // Ex: replaces <https://github.com| Github.com> with "https://github.com"
      .replace(/<(.+)\|(.+)>/g, '$1')
      .trim()
  );
};

const renderResult = (result = {}) => {
  const output = [];

  if (result === null) {
    return '';
  }

  if (result.body) {
    result = result.body;
  }

  const { text = '', attachments = [], blocks = [] } = result;

  if (text) {
    output.push(formatText(text));
  }

  if (blocks) {
    for (const element of blocks) {
      output.push(formatBlockElement(element));
    }
  }

  if (attachments) {
    for (const attachment of attachments) {
      if (attachment.title) {
        output.push(chalk.bold(attachment.title));
      }

      if (attachment.fields) {
        const fieldText = [];
        for (const field of attachment.fields) {
          if (field.value && !field.title) {
            fieldText.push(field.value);
          }

          if (field.title) {
            output.push(formatText(field.title));
            if (field.value) {
              output.push(formatText(field.value));
            }
          }
        }

        output.push(formatText(fieldText.join('\n')));
      }

      if (attachment.text) {
        if (attachment.color && attachment.color === 'danger') {
          output.push(chalk.redBright('Error: ') + formatText(attachment.text));
        } else {
          output.push(formatText(attachment.text));
        }
      }
    }
  }

  if (output.length === 0) {
    output.push(`\`\`\` ${JSON.stringify(result, null, 2)} \`\`\``);
  }

  return marked(output.join('\n')).trim();
};

module.exports = renderResult;
