'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TBAEngine;
var validGetters = ['detail', 'description', 'accessor', 'name'];

function TBAEngine() {

  this.actions = [];
  this.conditions = [];
  this.currentRoom = null;
  this.emptyInventory = "Empy inventory";
  this.invalidCommand = "Invalid Command";
  this.invalidExit = "Cannot go there";
  this.inventory = {};
  this.rooms = {};
};

TBAEngine.prototype = {
  input: function input(input) {
    var ret = [];
    var output;

    for (var i = 0, l = this.conditions.length; i < l; i++) {
      var condition = this.conditions[i];
      if (!condition.check.call(this)) ret.push(condition.failText);
    }
    if (ret.length) return ret.join(" ");

    var input = input.toLocaleLowerCase();

    // get a list of targets including the game and current room
    var targets = this.findTargets(input, [this, this.currentRoom]);

    // call commands on targets
    for (var _i = 0, il = targets.length; _i < il; _i++) {
      var target = targets[_i];
      if (!target.actions) continue;
      for (var j = 0, jl = target.actions.length; j < jl; j++) {
        var action = target.actions[j];
        if (action.command.test(input)) {
          target.regExpMatchs = {
            target: target.accessor ? target.accessor.exec(input) : null,
            command: action.command.exec(input)
          };
          ret.push(action.method.call(target));
        }
      }
    }

    var output = ret.filter(function (n) {
      return !!n;
    }).join(" ");
    return output.length ? output : this.invalidCommand;
  },
  addCondition: function addCondition(condition) {
    this.conditions.push(condition);
  },
  addRoom: function addRoom(descriptor) {
    this.rooms[descriptor.key] = new Room(descriptor, this);
  },
  createItem: function createItem(descriptor) {
    return new Item(descriptor, null, this);
  },
  findTargets: function findTargets(input, targets) {
    var _this = this;

    return (targets || []).concat(this.currentRoom.itemList.filter(function (e) {
      return _this.currentRoom.items[e].accessor.test(input);
    }).map(function (e) {
      return _this.currentRoom.items[e];
    }), this.inventoryList.filter(function (e) {
      return _this.inventory[e].accessor.test(input);
    }).map(function (e) {
      return _this.inventory[e];
    }));
  },
  findTarget: function findTarget(input) {
    return this.findTargets(input)[0];
  },
  enterRoom: function enterRoom(room) {
    this.currentRoom = room;
    return room.getDescription();
  },
  addGlobalCommand: function addGlobalCommand(descriptor) {
    this.actions.push(descriptor);
  },
  removeGlobalCommand: function removeGlobalCommand(input) {
    var index = this.actions.findIndex(function (e) {
      return e.command.test(input);
    });
    this.actions.splice(index, 1);
  }
};

Object.defineProperty(TBAEngine.prototype, "inventoryList", {
  get: function get() {
    return Object.keys(this.inventory);
  }
});

Object.defineProperty(TBAEngine.prototype, "roomList", {
  get: function get() {
    return Object.keys(this.rooms);
  }
});

// Room construction -------------

function Room(descriptor, game) {
  Object.assign(this, descriptor);
  this.exits = {};
  this.game = game || null;
  this.items = {};

  for (var i = 0, l = validGetters.length; i < l; i++) {
    var e = validGetters[i];
    if (typeof this[e] === 'function') Object.defineProperty(this, e, { get: this[e] });
  }
}

Room.prototype = {
  addItem: function addItem(descriptor) {
    this.items[descriptor.key] = descriptor instanceof Item ? descriptor : new Item(descriptor, this, this.game);
    this.items[descriptor.key].room = this;
    if (descriptor.init) descriptor.init.call(this.items[descriptor.key]);
  },
  addExit: function addExit(discriptor) {
    discriptor.accessor = discriptor.accessor || new RegExp(discriptor.key, "i");
    this.exits[discriptor.key] = discriptor;
  },
  takeItem: function takeItem(item) {
    this.game.inventory[item.key] = item;
    delete item.room;
    this.removeItem(item.key);
  },
  removeItem: function removeItem(key) {
    delete this.items[key];
  },
  getDescription: function getDescription() {
    var _this2 = this;

    var ret = [this.description];
    ret = ret.concat(this.itemList.map(function (x) {
      return _this2.items[x].description;
    }));
    ret = ret.concat(this.exitList.map(function (x) {
      return _this2.exits[x].description;
    }));
    return ret.join(" ");
  }
};

Object.defineProperty(Room.prototype, 'itemList', {
  get: function get() {
    return Object.keys(this.items);
  }
});

Object.defineProperty(Room.prototype, 'exitList', {
  get: function get() {
    return Object.keys(this.exits);
  }
});

// Object construction --------------

function Item(descriptor, room, game) {
  Object.assign(this, descriptor);

  this.accessor = this.accessor || new RegExp(this.key);
  this.actions = this.actions || [];
  this.game = game || null;
  this.name = this.name || this.key;
  this.room = room || null;

  for (var i = 0, l = validGetters.length; i < l; i++) {
    var e = validGetters[i];
    if (typeof this[e] === 'function') Object.defineProperty(this, e, { get: this[e].bind(this) });
  }
}

Item.prototype = {
  getDescription: function getDescription() {
    return this.description;
  },
  getCommand: function getCommand(input) {
    return this.actions[this.actions.findIndex(function (e) {
      return e.command.test(input);
    })];
  },
  drop: function drop() {
    if (this.game.inventory[this.key]) {
      this.game.currentRoom.addItem(this);
      delete this.game.inventory[this.key];
    }
  }
};

//# sourceMappingURL=TBAEngine.js.map