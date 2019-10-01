# MatHub: web-based data viz platform for MATSim outputs

This experimental platform for storing and visualizing MATSim model outputs is being developed by the Institute for Sea and Land Transport at the Technische Universität Berlin.

It is not generally useful just yet; so if you're here, you're probably interested in helping build and develop it! Thanks for your interest!

# Setting up your developer environment

This is a browser application which uses the following techniques:

- [Typescript](http://www.typescriptlang.org/docs/home.html) as programming language
- [VueJS](https://vuejs.org/) as a view framework
- [Pug](https://pugjs.org/api/getting-started.html) for templating language

The recommended editor is [Visual Studio Code](https://code.visualstudio.com/Download). To make it play nicely whith the above techniques the following plugins should be installed:

- Vetur for VueJS components
- TSLint for TS-Lint support (also lints Javascript files)
- TSLint Vue for linting VueJS-Components written in Typescript
- Prettier to auto format code according to the linting rules.
- To enable auto formatting on save add `"editor.formatOnSave": true` in the user settings

## 1. Install development tools

You'll need to install Node.js and `yarn` to build locally. Instructions for each platform are below.

##### 1a. windows/linux

We've found that using the WSL "Windows 10 Subsystem for Linux" makes web development easiest on Windows. So first, install WSL following instructions here:

- https://docs.microsoft.com/en-us/windows/wsl/install-win10
- I installed Ubuntu but if you have a linux of choice, use that.

Now you can install node:

```
sudo apt update
sudo apt install nodejs git yarn
```

and then follow the instructions for getting the viz code, below.

##### 1b. macports

Install MacPorts - https://www.macports.org/

- Note that MacPorts requires XCode! Which can take a long time to install.

and then:

```
sudo port install nodejs8
sudo port install npm6
```

## 2. Get the code and dependencies

Yarn is a javascript dependency manager, very similar to maven in the Java universe. Yarn uses the `npm` package manager internally, which is part of Node. The `yarn install` command below will fetch all js dependencies and place them in the `node_modules` project folder, which you should never need to delve into.

```
git clone https://github.com/matsim-org/viz
cd viz
yarn install
```

## 3. Build and run!

You can build the site and run a local copy for development with one command:

```
yarn serve
```

and then open your browser to `https://localhost:8080`
