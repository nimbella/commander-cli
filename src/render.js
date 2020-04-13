const chalk = require('chalk');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer(),
});

const renderBlockElement = element => {
  const output = [];
  switch (element.type) {
    case 'context': {
      for (const item of element.elements) {
        output.push(item.text.replace(/\*/g, '**'));
      }
      break;
    }
    case 'section': {
      if (element.fields && element.fields.length > 0) {
        for (const field of element.fields) {
          output.push(field.text.replace(/\*/g, '**') + '\n');
        }
      } else if (element.text) {
        output.push(element.text.text.replace(/\*/g, '**'));
      }
      break;
    }
    case 'divider': {
      output.push('***');
      break;
    }
  }

  return marked(output.join(' '));
};

const renderText = (text = '') => {
  return marked(text);
};

const renderResult = (result = {}) => {
  if (result === null) {
    return result;
  }

  if (result.startsWith('Error')) {
    return console.log(result);
  }

  const {
    body: { text = '', attachments = [], blocks = [] },
  } = JSON.parse(result);

  if (text !== null) {
    console.log(renderText(text));
  }

  if (blocks) {
    for (const element of blocks) {
      console.log(renderBlockElement(element));
    }
  }

  if (attachments) {
    for (const attachment of attachments) {
      if (attachment.title !== null) {
        console.log(chalk.bold(attachment.title));
      }

      const fieldText = [];
      for (const field of attachment.fields) {
        if (field.value && !field.title) {
          fieldText.push(field.value.replace(/<(.+)\|(.+)>/g, '$2'));
        }

        if (field.title) {
          console.log(renderText(field.title));
          if (field.value) {
            console.log(renderText(field.value.replace(/<(.+)\|(.+)>/g, '$2')));
          }
        }
      }

      console.log(renderText(fieldText.join('\n')));

      if (attachment.text) {
        console.log(renderText(attachment.text));
      }
    }
  }

  return '';
};

module.exports = renderResult;
