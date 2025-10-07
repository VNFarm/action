
export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export type Coordinates = {
  x: number;
  y: number;
};

export enum GameState {
  IDLE,
  RUNNING,
  GAME_OVER,
}
