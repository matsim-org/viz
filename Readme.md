# Set up development environment

The project is a browser application which uses the following techniques:

- [Typescript](http://www.typescriptlang.org/docs/home.html) as programming language
- [VueJS](https://vuejs.org/) as a view framework
- [Pug](https://pugjs.org/api/getting-started.html) for templating language

The recommended editor is [Visual Studio Code](https://code.visualstudio.com/Download). To make it play nicely whith the above techniques the following plugins should be installed:

- Vetur for VueJS components
- TSLint for TS-Lint support (also lints Javascript files)
- TSLint Vue for linting VueJS-Components written in Typescript
- Prettier to auto format code according to the linting rules.
- To enable auto formatting on save add `"editor.formatOnSave": true` in the user settings

# install

You'll need to install Node.js and NPM to build locally. Instructions for each platform are below.

##### windows

We've found that using the WSL "Windows 10 Subsystem for Linux" makes web development easiest on Windows. So first, install WSL following instructions here:

- https://docs.microsoft.com/en-us/windows/wsl/install-win10
- I installed Ubuntu but if you have a linux of choice, use that.

Now you can install node:

```
sudo apt update
sudo apt install nodejs npm git
```

and then follow the instructions for getting the viz code, below.

##### macports

Install MacPorts - https://www.macports.org/

- Note that MacPorts requires XCode! Which can take a long time to install.

and then:

```
sudo port install nodejs8
sudo port install npm6
```

### Get the code from GitHub

```
git clone https://github.com/matsim-org/viz
cd viz
npm install
npm run serve
```

open browser at `https://localhost:8080`
