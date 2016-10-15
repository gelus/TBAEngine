"use strict";

(function () {

  window.TBAEngine = function TBAEngine() {

    this.currentRoom = null;
    this.rooms = {};
    this.invalidCommand = "Invalid Command";
  };

  TBAEngine.prototype = {
    input: function input(input) {
      var ret = [];
      var input = input.toLocaleLowerCase();
      var globalCommand = this.globalCommands[this.globalCommands.findIndex(function (e) {
        return e.command.test(input);
      })];
      var target = this.findTarget(input);
      var targetCommand = target ? target.actions[target.actions.findIndex(function (e) {
        return e.command.test(input);
      })] : undefined;

      if (globalCommand) ret.push(globalCommand.method.call(this, target));
      if (targetCommand) ret.push(targetCommand.method.call(target, this));

      if (ret.length) return ret.join(" ");else return this.invalidCommand;
    },
    addRoom: function addRoom(descriptor) {
      this.rooms[descriptor.title] = new Room(descriptor);
    },
    findTarget: function findTarget(input) {
      var targetKey = this.currentRoom.itemList[this.currentRoom.itemList.findIndex(function (e) {
        return this.items[e].regEx.test(input);
      }.bind(this.currentRoom))];

      return this.currentRoom.items[targetKey];
    },


    globalCommands: [{ command: /look/, method: function method() {
        var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.currentRoom;

        return target.detail || target.getDescription();
      }
    }]

  };

  // Room construction -------------

  function Room(descriptor) {
    Object.assign(this, descriptor);
    this.items = {};
  }

  Room.prototype = {
    addItem: function addItem(descriptor) {
      this.items[descriptor.key] = new Item(descriptor);
    },
    getDescription: function getDescription() {
      var _this = this;

      return this.description + " " + this.itemList.map(function (x) {
        return _this.items[x].description;
      }).join(" ");
    }
  };

  Object.defineProperty(Room.prototype, 'itemList', {
    get: function get() {
      return Object.keys(this.items);
    }
  });

  // Object construction --------------

  function Item(descriptor) {
    Object.assign(this, descriptor);
    this.regEx = new RegExp(descriptor.key);
    this.actions = this.actions || [];

    if (typeof this.detail === 'function') Object.defineProperty(this, 'detail', { get: this.detail });
    if (typeof this.description === 'function') Object.defineProperty(this, 'description', { get: this.description });
  }

  Item.prototype = {
    getDescription: function getDescription() {
      return this.description;
    }
  };
})();

//# sourceMappingURL=TBAEngine.js.map