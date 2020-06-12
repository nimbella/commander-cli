async function getSignedUrl(filename) {
  const nimbella = require('nim');
  const bucket = await nimbella.storage();

  const file = bucket.file(filename);
  const expiration = 15 * 60 * 1000; // 15 minutes

  const getOptions = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiration,
  };

  const [fileUrl] = await file.getSignedUrl(getOptions);

  return {
    body: fileUrl,
  };
}

const main = args => {
  if (args.filename) {
    return getSignedUrl(args.filename);
  } else {
    return errorResponse('filename required');
  }
};

function errorResponse(msg) {
  return {
    statusCode: 400,
    body: {
      error: msg,
    },
  };
}

exports.main = main;
