module.exports = {
  levelType: "grid",

  validate(level, output) {
    return output === level.expectedOutput;
  },

  getDockerImage() {
    return "python:3.12";
  },
};
