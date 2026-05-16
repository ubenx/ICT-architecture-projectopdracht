module.exports = {
  levelType: "sorting",

  validate(level, output) {
    return output === level.expectedOutput;
  },

  getDockerImage() {
    return "node:20";
  },
};
