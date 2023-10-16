# React Pokedex APP
A React pokedex APP that is built on [PokéAPI](https://pokeapi.co/docs/v2).  

Side tangent:  
You may see some [discouraged pattern](https://redux.js.org/usage/writing-logic-thunks#dispatching-actions) used in the codebase, e.g. dispatching other action in a thunk function, dispatching the fulfilled action of a thunk. I realized those patterns are not recommended, but as I was working on performance(actually I do spend quite a lot of effort and time working on reducing unnecessary re-render), I found those patterns pretty useful.  
It'd be appreciated if you can spend some time going through my code and let me know what you think.

## Features
- Search Pokemon through type, generation, id or name.
- Sort Pokemon through multiple ways.
- Support Multiple languages.
- Displayed as table or cards.
- Rich information, including evolution chains, moves...
- Infinite scroll.
- Caching.
- Routing.

## Tech Stack
- [React](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/en/main)
- [Material UI](https://mui.com/material-ui/)
- [React Data Table Component](https://react-data-table-component.netlify.app/?path=/story/getting-started-intro--page)
- [Bootstrap](https://getbootstrap.com/)

## Installation
1. Clone the repo: `git clone https://github.com/alveifbklsiu259/Pokedex.git`  
2. Change directory: `cd Pokedex`  
3. Install dependencies: `npm install`  
4. Start dev mode: `npm start`  

## Demonstration
live demo: 

![Cards](/src/assets/demo_1.jpg)
![Search](/src/assets/demo_2.jpg)
![Table](/src/assets/demo_3.jpg)
![Moves](/src/assets/demo_4.jpg)
![Evolutions](/src/assets/demo_5.jpg)
![multi Language](/src/assets/demo_6.jpg)

## Image credits:

[https://freepngimg.com/png/37466-pokeball-image](https://freepngimg.com/png/37466-pokeball-image)  
[https://en.wikipedia.org/wiki/File:Pok%C3%A9_Ball_icon.svg](https://en.wikipedia.org/wiki/File:Pok%C3%A9_Ball_icon.svg)  
**License: Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**