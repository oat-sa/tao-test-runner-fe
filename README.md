# tao-test-runner-fe

TAO Test Runner API

## Install

```
npm i --save @oat-sa/tao-test-runner
```

## Development

Available scripts in the project:

- `npm run test <testname>`: run test suite
  - `testname` (optional): Specific test to run. If it is not provided, all will be ran.
  - `HOST` (optional environment variable, default: 127.0.0.1): Test server listen host
  - `PORT` (optional environment variable): Test server listen port
- `npm run test:keepAlive`: start test server
- `npm run test:cov`: start test server
- `npm run coverage`: show coverage report in terminal
- `npm run coverage:html`: show coverage report in browser
- `npm run test:dev`: test in development mode (watch changes and source maps)
- `npm run build`: build for production into `dist` directory
- `npm run build:watch`: same as `build`, but watch changes
- `npm run build:dev`: watch changes and build with source maps
- `npm run lint`: check syntax of code

