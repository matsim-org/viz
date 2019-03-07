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

### prerequisites

##### macports

```
sudo port install nodejs8
sudo port install npm6
```

### code itself

```
git clone https://github.com/matsim-org/viz
cd viz
npm install
npm run serve
```

open browser at `https://localhost:8080`
