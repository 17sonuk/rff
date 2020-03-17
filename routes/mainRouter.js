/*jslint node: true, nomen: true*/
"use strict";

module.exports = function(express, logger, config) {
  var path = require("path"),
    router = express.Router(),
    mainController = require(path.join("..", "controllers", "mainController"))(
      logger,
      config
    );

  return router;
};
