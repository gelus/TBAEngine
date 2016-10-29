## Text Based Adventure Engine 
 
What we have here is a _Text Based Adventure Engine_, built in JavaScript.  It can be used to create text based adventure games. ( Bet you didn't see that coming ) 
 
*** 
## Docs 
 
Currently The engine is set up to work in the browser via a regular script tag. In the future it may be adjusted to support other locations, such as node or AMD modules, but for now it is what it is. 
 
## Overview 
The engine is object oriented and works by creating objects for the game, Rooms, and items.  
 
## Game 
 
```javascript 
var Game = new TBAEngine(); 
``` 
Creates a new game instance. 
##### fields 
 
| property | type | description | 
| --- | --- | --- | 
| actions | Array of objects | A list global commands | 
| conditions | Array | a list of conditions that need to be met for a command to be processed | 
| currentRoom | Object | The room that the player is currently in. | 
| emptyInventory | String | The message returned from the default `inventory` command when the player checks an empty inventory | 
| invalidCommand | String | The message returned when the player enters an invalid command | 
| invalidExit | String | The message returned from the default `go` command when the player trys to _go_ somewhere invalid | 
| inventory | Object | The objects in the player's inventory | 
| inventoryList | Array of strings | List of keys in the inventory object | 
| regExpMatchs | Object | Information on the regular expression matches for the last global command | 
| roomList | Array of strings | List of keys in the rooms object | 
| rooms | Object | Rooms assigned in the current game. | 
 
##### Game.input(String command) 
  *_The command_* Inputs a text command, evaluates it and returns the output. 
  
##### Game.addCondition(Object conditionDescriptor) 
  Add condition for the game to evaluate before executing a command. 
   
  conditionDescriptor 
   
| property | type | description | 
| ---- | ---- | ---- | 
| check | Function | The condition fails if falsey is returned and passes if truethy is return | 
| failText | String | The Text returned if the condition fails | 
   
##### Game.addRoom(Object roomDescriptor) 
  Add a new room to the game. Room is added to Game.rooms 
 
  roomDescriptor 
 
| property | type | description | 
| --- | --- | --- | 
| actions | Array of commandDescriptors | A list of commands available when in the room | 
| description | String or Function | The value, or returned value of which will describe the room | 
| key |  String | The name of the room. This is the key the Room will be assigned under on `Game.rooms` | 
 
_ Any other fields will be directly assigned to the Room when created _ 
 
##### Game.createItem(Object itemDescriptor) 
  Create a new item. Item is returned but not added anywhere. 
  Returns: Item 
 
  itemDescriptor : see Room.addItem 

##### Game.findTargets(String commandInput, <Array targets>) 
  Checks passed in input against items in the current room, inventory to return an array of matching target.
  Returns: Array of targets 
  
##### Game.findTarget(String commandInput) 
  Uses Game.findTargets to get the first matching target in the current room or inventory
  Returns: Item 
   
##### Game.enterRoom(Room room) 
  Assigns the passed in room to the currentRoom and returns the new rooms description. 
  Returns: String room description 

##### Game.addGlobalCommand(Object commandDescriptor) 
  adds the passed in command go Game.actions

##### Game.removeGlobalCommand(String input) 
  removes the first matching command from Game.actions
 
 
## Room 
```javascript 
Game.addRoom(object roomDescriptor) 
``` 
 
Creates a room or area for your game and adds it under `descriptor.key` to `Game.rooms`. 
##### fields 
 
| property | type | description | 
| --- | --- | --- | 
| exitList | Array of strings | List of keys in the exits object | 
| exits | Object | Exits assigned to the room | 
| game | Game object | A reference to the Game the room was created on. | 
| itemList | Array of strings | List of keys in the items object | 
| items | Object | Items assigned to the room | 
| regExpMatchs | Object | Information on the regular expression matches for the last room level command | 
 
_all other fields on the descriptor will be directly assigned to the Room._ 
 
##### Room.addItem(Object itemDescriptor || Item ) 
  Assigns The passed in Item to the Room. Creates a new Item if passed in a descriptor. 
 
  itemDescriptor 
 
| property | type | description | 
| --- | --- | --- | 
| accessor | Regular Expression | Optional. The expression that inputs will be checked against. If not provided, one is created using the key. | 
| actions | Array of commandDescriptors | A list of commands available when in the room | 
| description | String or Function | The value, or returned value of which will describe the item | 
| detail | String or Function | The value, or returned value of which will describe the item in more detail | 
| init | Function | A initialization method, called when the item is added to a room. | 
| key |  String | The name of the item. This is the key the Item will be assigned under on `Room.items` | 
| name | String | A user friendly name for the item. If unprovided Item.name will be set to Item.key | 
 
 
_all other fields on the descriptor will be directly assigned to the Room._ 
 
#####  Room.addExit(Object exitDescriptor) 
  Creates a new exit on the Room. 
   
  exitDescriptor 
   
| property | type | description | 
| ---- | ---- | ---- | 
| accessor | regular expression | Optional. The expression that inputs will be checked against. If not provided, one is created using the direction. | 
| description | String | the description of the exit. | 
| key | String | The "direction" the exit is in. |
| room | Room | The Room the exit leads to | 
 
##### Room.takeItem(Item) 
  Convenience method. Adds Item to `Game.inventory` and removes it from the Room. 
 
##### Room.removeItem(Item) 
  Convenience method. Removes Item from the Room. Equivalent to `delete Room.items['key']` 
 
##### Room.getDescription() 
  Compiles and returns the full description for the room. This includes: 
    - The room description 
    - all items descriptions 
    - all exits descriptions 
  Returns : string 
   
## Item 
```javascript 
var myItem = Game.createItem(Object itemDescriptor); 
 
Room.addItem(Object itemDescriptor); 
``` 
##### fields 
 
| property | type | description | 
| --- | --- | --- | 
| game | Game | reference to the Game the item was created in. | 
| room | Room | reference to the Room the item is in ( `null` if item is in inventory, or not added to a room ) | 
| regExpMatchs | Object | Information on the regular expression matches for the last item command | 
 
##### Item.getDescription() 
  returns the description of the item 
  return : string 
 
##### Item.getCommand(string input) 
  returns the action object that matches the input string 
  return: Object 
   
##### Item.drop() 
  Convenience method. Removes the item from `Game.inventory` and adds it to the current room. 
 
## commandDescriptor 
 
  command descriptors are used when adding a global command, or adding a command to a room's or item's actions array. 
 
| property | type | description | 
| --- | --- | --- | 
| command | regular expression | The expression checked to see if the command should run| 
| method | Function | The method called when the command expression is match | 
 
 
## method Context 
 
Functions provided as descriptions, details, inits, commands or even just on the descriptor objects in general are assigned the context of that item. This means `this` will be the Item or Room you're working on and through it, you will have access to the Game and all that exists on it. 
