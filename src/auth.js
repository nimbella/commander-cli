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

const querystring = require('querystring');
const open = require('open');
const http = require('http');
const getPort = require('get-port');

async function authenticate() {
  const port = await getPort({ port: 3000 });
  let deferredResolve = null;
  let deferredReject = null;
  const deferredPromise = new Promise(function (resolve, reject) {
    deferredResolve = resolve;
    deferredReject = reject;
  });

  const server = http.createServer(function (req, res) {
    const parameters = querystring.parse(
      req.url.slice(req.url.indexOf('?') + 1)
    );
    if (parameters.token) {
      try {
        // the response is either a full profile including github token if available
        const buffer = Buffer.from(parameters.token, 'base64');
        const json = JSON.parse(buffer.toString('ascii'));
        deferredResolve(json);
      } catch (e) {
        // or just a github token
        deferredResolve(parameters.token);
      }

      res.end(
        '<html><head><style>html{font-family:sans-serif;background:#0e1e25}body{overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;width:100vw;}h3{margin:0}.card{position:relative;display:flex;flex-direction:column;width:75%;max-width:364px;padding:24px;background:white;color:rgb(14,30,37);border-radius:8px;box-shadow:0 2px 4px 0 rgba(14,30,37,.16);}</style></head>' +
          "<body><div class=card><h3>Logged In</h3><p>You're now logged into Nimbella CLI with your " +
          parameters.provider +
          ' credentials. Please close this window.</p></div>'
      );
      server.close();
      return;
    }
    res.end('BAD PARAMETERS');
    server.close();
    deferredReject(new Error('Got invalid parameters for CLI login'));
  });

  await new Promise(function (resolve, reject) {
    server.on('error', reject);
    server.listen(port, resolve);
  });

  const webUI = 'https://nimbella-apigcp.nimbella.io/api';

  const url =
    webUI +
    '/user/login?' +
    querystring.encode({
      redirect: true,
      port: port,
      //provider: 'github'
    });

  try {
    await open(url);
  } catch (err) {
    console.log(
      'Commander CLI could not open the browser for you.' +
        ' Please visit this URL in a browser on this device: ' +
        url
    );
  }

  return await deferredPromise;
}

module.exports = authenticate;
