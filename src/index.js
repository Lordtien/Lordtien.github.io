import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

var score = 0;
var levelUpCounter = 0;
var level = 1;
var food = 0;
var tickRate = 10;
const GRID_SIZE = 30;
const GRID = [];

for (let i = 0; i <= GRID_SIZE; i++) {
  GRID.push(i);
}

const DIRECTIONS = {
  UP: 'UP',
  BOTTOM: 'BOTTOM',
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
};

const DIRECTION_TICKS = {
  UP: (x, y) => ({ x, y: y - 1 }),
  BOTTOM: (x, y) => ({ x, y: y + 1 }),
  RIGHT: (x, y) => ({ x: x + 1, y }),
  LEFT: (x, y) => ({ x: x - 1, y }),
};

const KEY_CODES_MAPPER = {
  38: 'UP',
  39: 'RIGHT',
  37: 'LEFT',
  40: 'BOTTOM',
};

const getRandomNumberFromRange = (min, max) =>
  Math.floor(Math.random() * (max - min +1 ) + min);

const getRandomCoordinate = () =>
  ({
    x: getRandomNumberFromRange(1, GRID_SIZE - 1),
    y: getRandomNumberFromRange(1, GRID_SIZE - 1),
  });

const isBorder = (x, y) =>
  x === 0 || y === 0 || x === GRID_SIZE || y === GRID_SIZE;

const isPosition = (x, y, diffX, diffY) =>
  x === diffX && y === diffY;

const isSnake = (x, y, snakeCoordinates) =>
  snakeCoordinates.filter(coordinate => isPosition(coordinate.x, coordinate.y, x, y)).length;

const getSnakeHead = (snake) =>
  snake.coordinates[0];

const getSnakeWithoutStub = (snake) =>
  snake.coordinates.slice(0, snake.coordinates.length - 1);

const getSnakeTail = (snake) =>
  snake.coordinates.slice(1);

const getIsSnakeOutside = (snake) =>
  getSnakeHead(snake).x >= GRID_SIZE ||
  getSnakeHead(snake).y >= GRID_SIZE ||
  getSnakeHead(snake).x <= 0 ||
  getSnakeHead(snake).y <= 0;

const getIsSnakeClumy = (snake) =>
  isSnake(getSnakeHead(snake).x, getSnakeHead(snake).y, getSnakeTail(snake));

const checkLevelUp = (levelCheck) => {
  if (levelCheck > 9) {
    levelUpCounter = 0;
    tickRate += 50;
    level += 1;
  };
}

const getIsSnakeEating = ({ snake, snack }) => {
  if (isPosition(getSnakeHead(snake).x, getSnakeHead(snake).y, snack.coordinate.x, snack.coordinate.y)) {
    score += 10;
    food += 1;
    levelUpCounter += 1;
    checkLevelUp(levelUpCounter);
    return true;
  };
}

const getIsSnakeEatingScoreBoost = ({ snake, scoreBoost }) => {
  if (isPosition(getSnakeHead(snake).x, getSnakeHead(snake).y, scoreBoost.coordinate.x, scoreBoost.coordinate.y)) {
    score += 50;
    levelUpCounter += 5;
    checkLevelUp(levelUpCounter);
    return true;    
  };
}

const spawnScoreBoost = ({snake, scoreBoost}) => {
  if (food > 4) {
    console.log(food);
    food = 0;
    return 1;
  };

  if (getIsSnakeEatingScoreBoost({snake, scoreBoost})) {
    return 0;
  };
  return -1;
}

const cs = (classA, classGroup) => {
 for (var className in classGroup) {
  if (classGroup[className]) {
    classA += ' ' + className;
  };
 };
 return classA;
};

const getCellCs = (isGameOver, snake, snack, scoreBoost, x, y) =>
  cs(
    'grid-cell',
    {
      'grid-cell-border': isBorder(x, y),
      'grid-cell-snake': isSnake(x, y, snake.coordinates),
      'grid-cell-snack': isPosition(x, y, snack.coordinate.x, snack.coordinate.y),
      'grid-cell-scoreBoost': isPosition(x, y, scoreBoost.coordinate.x, scoreBoost.coordinate.y),
      'grid-cell-hit': isGameOver && isPosition(x, y, getSnakeHead(snake).x, getSnakeHead(snake).y),
    }
  );

const applySnakePosition = (prevState) => {
  const isSnakeEating = getIsSnakeEating(prevState);
  const isSnakeEatingScoreBoost = spawnScoreBoost(prevState);

  console.log(DIRECTION_TICKS[prevState.playground.direction], prevState.playground);
  const snakeHead = DIRECTION_TICKS[prevState.playground.direction](
    getSnakeHead(prevState.snake).x,
    getSnakeHead(prevState.snake).y,
  );

  const snakeTail = isSnakeEating
    ? prevState.snake.coordinates
    : getSnakeWithoutStub(prevState.snake);

  const snackCoordinate = isSnakeEating
    ? getRandomCoordinate()
    : prevState.snack.coordinate;

  var scoreBoostCoordinate = {x: -1, y: -1};
  if (isSnakeEatingScoreBoost === 1) {
    scoreBoostCoordinate = getRandomCoordinate();
  }
  else if (isSnakeEatingScoreBoost === -1) {
    scoreBoostCoordinate = prevState.scoreBoost.coordinate;
  }

  return {
    snake: {
      coordinates: [snakeHead, ...snakeTail],
    },
    snack: {
      coordinate: snackCoordinate,
    },
    scoreBoost: {
      coordinate: scoreBoostCoordinate,
    }
  };
};

const applyGameOver = (prevState) => ({
  playground: {
    isGameOver: true
  },
});

const doChangeDirection = (prevState, direction) => () => {
  let curDirection = prevState.playground.direction;
  console.log(curDirection);
  let upBottom = ['UP', 'BOTTOM'];
  let leftRight = ['LEFT', 'RIGHT'];
  if ((upBottom.includes(direction) && upBottom.includes(curDirection)) || (leftRight.includes(direction) && leftRight.includes(curDirection))) {
    return {
      playground: {
        direction: curDirection,
      }
    };
  }
  else {
    return {
      playground: {
        direction,
      },
    };
  }
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playground: {
        direction: DIRECTIONS.RIGHT,
        isGameOver: false,
      },
      snake: {
        coordinates: [({x: GRID_SIZE/2, y: GRID_SIZE/2})],
      },
      snack: {
        coordinate: getRandomCoordinate(),
      },
      scoreBoost: {
        coordinate: {x: -1, y: -1},
      },  
    };
  }

  componentDidMount() {
    this.interval = setInterval(this.onTick, tickRate);

    window.addEventListener('keyup', this.onChangeDirection, false);
  }

  componentWillUnmount() {
    clearInterval(this.interval);

    window.removeEventListener('keyup', this.onChangeDirection, false);
  }

  onChangeDirection = (event) => {
    if (KEY_CODES_MAPPER[event.keyCode]) {
      this.setState(doChangeDirection(this.state, KEY_CODES_MAPPER[event.keyCode]));
    }
  }

  onTick = () => {
    getIsSnakeOutside(this.state.snake) || getIsSnakeClumy(this.state.snake)
      ? this.setState(applyGameOver)
      : this.setState(applySnakePosition);
  }

  render() {
    const {
      snake,
      snack,
      scoreBoost,
      playground,
    } = this.state;

    return (
      <div className="app">
        <h1>Score: {score} Speed: {level}</h1>
        <Grid
          snake={snake}
          snack={snack}
          scoreBoost={scoreBoost}
          isGameOver={playground.isGameOver}
        />
      </div>
    );
  }
}

const Grid = ({ isGameOver, snake, snack, scoreBoost }) =>
  <div>
    {GRID.map(y =>
      <Row
        y={y}
        key={y}
        snake={snake}
        snack={snack}
        scoreBoost={scoreBoost}
        isGameOver={isGameOver}
      />
    )}
  </div>

const Row = ({ isGameOver, snake, snack, scoreBoost, y }) =>
  <div className="grid-row">
    {GRID.map(x =>
      <Cell
        x={x}
        y={y}
        key={x}
        snake={snake}
        snack={snack}
        scoreBoost={scoreBoost}
        isGameOver={isGameOver}
      />
    )}
  </div>

const Cell = ({ isGameOver, snake, snack, scoreBoost, x, y }) =>
  <div className={getCellCs(isGameOver, snake, snack, scoreBoost, x, y)} />

// ========================================

ReactDOM.render(<App />, document.getElementById("root"));
