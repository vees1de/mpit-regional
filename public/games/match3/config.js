export const gameConfig = {
  id: "match3",
  name: "Match-3",
  handlesSwipe: true,
  swipeDirections: ["left", "right", "up", "down"],
};

export const gameSettings = {
  boardSize: 8,
  gemTypes: 5,
  scoreValues: {
    3: 10,
    4: 20,
    5: 50,
  },
  comboStep: 0.1,
  seed: null,
};
