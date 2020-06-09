var firebaseRef; //Firebase object
var gameId; //Firebase game object

var id = "";
var playerPos = {
	"player1": {
		"builder1": {
			x: -1, y: -1
		},
		"builder2": {
			x: -1, y: -1
		}
	},
	"player2": {
		"builder1": {
			x: -1, y: -1
		},
		"builder2": {
			x: -1, y: -1
		}
	}
}
var cellHeight; //2d Array
var turn = {
	"player": 0,	// 1 = player1, 2 = player2
	"cycle": 0		// 1 = move, 2 = build
}
var players = {
	"player1": {
		initiated: false,
		active: false
	},
	"player2": {
		initiated: false,
		active: false
	}
};
var gamePhase = 0;
// 1 = placing builders, 2 = normal game, 3 = finished
var winner = 0;
// 1 = player1, 2 = player2
var initTime = 0;

var imageObject;
var selectedCell = null;
var initPanelInstantiated = false;
var gameBegan = false;
var localPlayer = 0;
//Independant from firebase, 1 = player1, 2 = player2

function newGame(){
	var generatedKey;

	firebaseRef.once("value", function(snapshot){
		var isUnique = false;

		while(!isUnique){
			generatedKey = generateRandomKey();
			isUnique = true;

			snapshot.forEach(function(child){
				if(child.key() == "availableGames"){
					child.forEach(function(child2){
						if(child2.val() < Date.now() - 259200000){
							firebaseRef.child(child.key() + "/" + child2.key()).remove();
							console.log("removed " + child.key());
						}
					});
				}
				if(child.child("game/initTime").val() < Date.now() - 259200000){
					firebaseRef.child(child.key()).remove();
					console.log("removed " + child.key());
				}
			});

			snapshot.forEach(function(child){
				if(generatedKey == child.child("game/id").val())
					isUnique = false;
			});
		}

		id = generatedKey;

		//Get info
		var d = new Date();
		var time = d.getTime();

		//Fix country selector
		var country = "N/A";

		initTime = d.getTime();

		//Initialize data structure
		var newRef = firebaseRef.push({
			game: {
				id: generatedKey,
				playerPos: playerPos,
				cellHeight: cellHeight,
				turn: turn,
				players: players,
				gamePhase: gamePhase,
				initTime: initTime
			}
		});
		gameId = newRef.key();

		var randomRef = firebaseRef.child("availableGames/" + gameId).set({
			id: generatedKey,
			time: time,
			country: country
		});

		newRef.child("game/players/player1").set({
			initiated: true,
			active: true
		});
		localPlayer = 1;
		logMessage(1, "Waiting for a player to join...", "Game");

		initGameUpdater();
		setInitPanel(generatedKey);
	});
}

function joinGame(e){
	e = e || window.event;
	if(e.keyCode != 13)
		return;
	
	var keyInput = document.getElementById("keyInput").value;
	var key = keyInput.trim().toUpperCase();
	
	joinExistingGame(key);
}

function joinExistingGame(key){
	var isKey = false;
	var refKey;
	document.getElementById("keyInput").value = "";

	firebaseRef.once("value", function(snapshot){
		snapshot.forEach(function(child){
			if(key == child.child("game/id").val()){
				isKey = true
				refKey = child.key();
			}
		});

		if(!isKey){
			document.getElementById("keyInput").style.border = "4px solid firebrick";
			document.getElementById("keyInput").placeholder = "Incorrent key";
			logMessage(1, "Incorrect Key, try again!", "Error");
			return;
		}
		
		//Test if good game
		var playerCount = 0;
		snapshot.child(refKey).child("game/players").forEach(function(child){
			if(child.child("initiated").val())
				playerCount++
		});
		if(playerCount > 1){
			document.getElementById("keyInput").style.border = "4px solid firebrick";
			document.getElementById("keyInput").placeholder = "Game is full";
			logMessage(1, "The game is full, there are too many players!", "Error");
			return;
		}

		//Join existing game
		gameId = refKey;
		id = key;

		firebaseRef.child("availableGames/" + gameId).remove();

		firebaseRef.child(refKey + "/game/players/player2").set({
			initiated: true,
			active: true
		});
		localPlayer = 2;

		initGameUpdater();
		setInitPanel(key);
	});
}

function searchRandomGame(){
	document.getElementById("initPanel").style.display = "none";
	document.getElementById("randomPanel").style.display = "block";

	var table = document.getElementById("randomTable");

	firebaseRef.child("availableGames").orderByKey().limitToLast(5).on("value", function(snapshot){
		table.innerHTML = "";
		var heading = document.createElement("tr");

		var id = document.createElement("th");
		id.innerHTML = "ID";
		heading.appendChild(id);
		var time = document.createElement("th");
		time.innerHTML = "Time Made";
		heading.appendChild(time);
		var location = document.createElement("th");
		location.innerHTML = "Location";
		heading.appendChild(location);

		table.appendChild(heading);
		snapshot.forEach(function(child){
			var row = document.createElement("tr");

			var date = new Date();
			var secondsSince = Math.floor((date.getTime() - child.child("time").val()) / 1000);
			var timeFormatted = "" + secondsSince + "s. ago";

			var id = document.createElement("td");
			id.innerHTML = child.child("id").val();
			row.appendChild(id);
			var time = document.createElement("td");
			time.innerHTML = timeFormatted;
			row.appendChild(time);
			var location = document.createElement("td");
			location.innerHTML = child.child("country").val();
			row.appendChild(location);
			var button = document.createElement("td");
			button.innerHTML = "Join Game";
			button.className = "joinButton";
			button.onclick = function(){
				joinRandomGame(child.child("id").val());
			};
			row.appendChild(button);

			table.appendChild(row);
		});
	});
}

function joinRandomGame(key){
	backToInitPanel();
	joinExistingGame(key);
}

function backToInitPanel(){
	document.getElementById("initPanel").style.display = "block";
	document.getElementById("randomPanel").style.display = "none";
}

function initializeGame(){
	//firebaseRef.child(gameId + "/game").child("gamePhase").set(1);
	gamePhase = 1;
	turn.player = 1;
	updateDatabase();
}

function initGameUpdater(){
	firebaseRef.child(gameId + "/game").on("value", function(snapshot){
		playerPos = snapshot.child("playerPos").val();
		cellHeight = snapshot.child("cellHeight").val();
		turn = snapshot.child("turn").val();
		players = snapshot.child("players").val();
		gamePhase = snapshot.child("gamePhase").val();
		winner = snapshot.child("winner").val();
		if(!gameBegan && players.player2.initiated){
			gameBegan = true;
			logMessage(1, "Player 1 place your builders (0/2)", "Game");
			if(localPlayer == 1)
				initializeGame();
		}
		if(players.player1.active == false && gamePhase != 3){
			winner = 2;
			gamePhase = 3;

			logMessage(1, "Player 1 has left the game like a coward", "Game");

			updateDatabase();
		}else if(players.player2.active == false && players.player2.initiated == true && gamePhase != 3){
			winner = 1;
			gamePhase = 3;

			logMessage(1, "Player 2 has left the game like a coward", "Game");

			updateDatabase();
		}
		if(gamePhase == 3){
			if((winner == 1 && localPlayer == 1)||(winner == 2 && localPlayer == 2)){
				swal({
					title: "You Won!",
					text: "Congratulations!",
					type: "success"
				});
			}else if((winner == 1 && localPlayer == 2)||(winner == 2 && localPlayer == 1)){
				swal({
					title: "You Lost.",
					text: "Better luck next time!",
					type: "error"
				});
			}
		}
		updateTurnIndicator();
		updateGrid();
	});
	firebaseRef.child(gameId + "/messages").on("child_added", function(snapshot){
		var author = snapshot.child("author").val();
		var text = snapshot.child("message").val();
		var type = snapshot.child("type").val();
		logMessage(type, text, author);
	});
}

function updateDatabase(){
	var ref = firebaseRef.child(gameId + "/game");
	ref.update({
		playerPos: playerPos,
		cellHeight: cellHeight,
		turn: turn,
		gamePhase: gamePhase,
		winner: winner
	});
}

function setInitPanel(key){
	if(!initPanelInstantiated)
		initPanelInstantiated = true;
	var initPanel = document.getElementById("initPanel");
	var html = "";
	var playerColor;
	if(localPlayer == 1)
		playerColor = "red";
	else if(localPlayer == 2)
		playerColor = "blue";
	else
		playerColor = "black";
	html += "<p class='panelElements panelTitles'>Current Game: </p>";
	html += "<h3 id='currentGameIndicator'>" + key + "</h3>";
	html += "<br><h2 class='panelElements panelTitles' style='color: " + playerColor + "'>";
	html += "Player: " + localPlayer + "</h2>";
	html += "<p style='display: inline;'>&nbsp;&nbsp;&nbsp;&nbsp;";
	html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>";
	html += "<h3 id='turnIndicator' class='panelElements'></h3>"
	initPanel.innerHTML = html;
	initPanel.setAttribute("class", "initPanelAFTER");
}

function updateTurnIndicator(){
	if(!initPanelInstantiated)
		return;
	var turnIndicator = document.getElementById("initPanel").lastChild;

	var text = "";
	var color = "black";
	if(turn.player == 1){
		text += "Player 1 ";
		color = "red";
	}
	else if(turn.player == 2){
		text += "Player 2 ";
		color = "blue";
	}
	if(gamePhase == 1){
		text += "(Place Builders)";
	}else if(gamePhase == 2){
		if(turn.cycle == 1)
			text += "(Move)";
		else if(turn.cycle == 2)
			text += "(Build)";
	}else if(gamePhase == 3 && winner == 1){
		text = "Player 1 Wins!"
		color = "red";
	}else if(gamePhase == 3 && winner == 2){
		text = "Player 2 Wins!"
		color = "blue";
	}
	
	turnIndicator.innerHTML = text;	
	turnIndicator.style.color = color;
}

function documentLoad(){
	var images = new Array();
	imageObject = new Image();
	images[0] = "0.png";
	images[1] = "01.png";
	images[2] = "02.png";
	images[3] = "1.png";
	images[4] = "11.png";
	images[5] = "12.png";
	images[6] = "2.png";
	images[7] = "21.png";
	images[8] = "22.png";
	images[9] = "3.png";
	images[10] = "31.png";
	images[11] = "32.png";
	images[12] = "4.png";
	for(var i = 0; i < 13; i++){
		imageObject.src = "assets/" + images[i];
	}

	firebaseRef = new Firebase("https://santorini-board-game.firebaseio.com/");

	cellHeight = new Array(5);
	for(var i = 0; i < 5; i++){
		cellHeight[i] = new Array(5);
		for(var j = 0; j < 5; j++){
			cellHeight[i][j] = 0;
		}
	}

	generateGrid(5);
}

function documentUnload(){
	if(gameId != null && gamePhase == 0){
		firebaseRef.child("availableGames/" + gameId).remove();
	}
	if(localPlayer == 1){
		firebaseRef.child(gameId + "/game/players/player1/active").set(false);
	}else if(localPlayer == 2){
		firebaseRef.child(gameId + "/game/players/player2/active").set(false);
	}
}

function cellClick(cell){
	if(cell == null)
		return;
	var cellNum = getCellNumber(cell);
	switch(gamePhase){
		case 0:
			return;
		case 1:
			if(localPlayer != turn.player){
				logMessage(1, "It's not your turn yet!", "Game");
				return;
			}
			if(getPlayerAtCell(cell) != null){
				logMessage(1, "There is already a player in that tile!", "Game");
				return;
			}
			if(localPlayer == 1){
				if(playerPos.player1.builder1.x < 0){
					playerPos.player1.builder1.x = cellNum.row;
					playerPos.player1.builder1.y = cellNum.cell;
					broadcastMessage(1, "Player 1 place your builders (1/2)", "Game");
				}else{
					playerPos.player1.builder2.x = cellNum.row;
					playerPos.player1.builder2.y = cellNum.cell;
					turn.player = 2;
					broadcastMessage(1, "Player 2 place your builders (0/2)", "Game");
				}
			}else if(localPlayer == 2){
				if(playerPos.player2.builder1.x < 0){
					playerPos.player2.builder1.x = cellNum.row;
					playerPos.player2.builder1.y = cellNum.cell;
					broadcastMessage(1, "Player 2 place your builders (1/2)", "Game");
				}else{
					playerPos.player2.builder2.x = cellNum.row;
					playerPos.player2.builder2.y = cellNum.cell;
					gamePhase = 2;
					turn.player = 1;
					turn.cycle = 1;
					broadcastMessage(1, "Player 1 move one of your builders", "Game");
				}
			}
			updateDatabase();
			break;
		case 2:
			if(localPlayer != turn.player){
				logMessage(1, "Its not your turn yet!", "Game");
				return;
			}
			if(turn.cycle == 1 && selectedCell == null && getPlayerAtCell(cell) == null){
				logMessage(1, "You must select one of your builders first!", "Game");
				return;
			}
			if(turn.cycle == 2 && getPlayerAtCell(cell) != null){
				logMessage(1, "You must choose an empty tile!", "Game");
				return;
			}

			if(turn.cycle == 1){
				if(selectedCell == null){
					var playerCell = getPlayerAtCell(cell);
					if((playerCell.player == 1 && localPlayer == 2)
						|| (playerCell.player == 2 && localPlayer == 1)){
						logMessage(1, "You must choose one of your own builders!", "Game");
						return;
					}

					selectedCell = cell;
					cell.style.border = "3px dashed green";
				}else{
					var oldCellNum = getCellNumber(selectedCell);
					var newCellNum = getCellNumber(cell);
					var playerCell = getPlayerAtCell(selectedCell);

					//TODO Check if legal move
					if(oldCellNum.row == newCellNum.row && oldCellNum.cell == newCellNum.cell){
						selectedCell.style.border = "2px solid darkgrey";
						selectedCell = null;
						return;
					}
					if(!isTileWithinRange(cell, selectedCell)){
						logMessage(1, "The tile must be within range of the other!", "Game");
						return;
					}
					if(cellHeight[oldCellNum.row][oldCellNum.cell] + 1
						< cellHeight[newCellNum.row][newCellNum.cell]){
						logMessage(1, "The tile is too tall to move up!", "Game");
						return;
					}
					if(turn.cycle == 1 && selectedCell != null && getPlayerAtCell(cell) != null){
						logMessage(1, "You must choose an empty tile!", "Game");
						return;
					}

					if(playerCell.player == 1){
						if(playerCell.builder == 1){
							playerPos.player1.builder1.x = newCellNum.row;
							playerPos.player1.builder1.y = newCellNum.cell;
						}else if(playerCell.builder == 2){
							playerPos.player1.builder2.x = newCellNum.row;
							playerPos.player1.builder2.y = newCellNum.cell;
						}
					}else if(playerCell.player == 2){
						if(playerCell.builder == 1){
							playerPos.player2.builder1.x = newCellNum.row;
							playerPos.player2.builder1.y = newCellNum.cell;
						}else if(playerCell.builder == 2){
							playerPos.player2.builder2.x = newCellNum.row;
							playerPos.player2.builder2.y = newCellNum.cell;
						}
					}

					selectedCell.style.border = "2px solid darkgrey";
					selectedCell = cell;
					selectedCell.style.border = "3px dashed green";

					//Test for win
					if(cellHeight[newCellNum.row][newCellNum.cell] == 3){
						winner = localPlayer;
						gamePhase = 3;
					}

					turn.cycle = 2;
					broadcastMessage(1, "Player " + localPlayer + " choose a tile to build upon", "Game");

					updateDatabase();
				}
			}else if(turn.cycle == 2){
				var cellNum = getCellNumber(cell);

				//TODO Check if legal build
				if(!isTileWithinRange(cell, selectedCell)){
					logMessage(1, "The tile must be within range of the other!", "Game");
					return;
				}
				if(cellHeight[cellNum.row][cellNum.cell] == 4){
					logMessage(1, "The tile height is too tall to build upon!", "Game");
				}

				cellHeight[cellNum.row][cellNum.cell] += 1;

				selectedCell.style.border = "2px solid darkgrey";
				selectedCell = null;

				var newPlayerNum = 0;
				if(localPlayer == 1){
					newPlayerNum = 2;
				}else{
					newPlayerNum = 1;
				}
				turn.player = newPlayerNum;
				turn.cycle = 1;
				broadcastMessage(1, "Player " + newPlayerNum + " move one of your builders", "Game");

				updateDatabase();
			}
			break;
		case 3:
			break;
		default:
			alert("[Error] Incorrect game phase!");
			return;
	}
}

function isTileWithinRange(cell1, cell2){
	var cellNum1 = getCellNumber(cell1);
	var cellNum2 = getCellNumber(cell2);
	for(var i = -1; i < 2; i++){
		for(var j = -1; j < 2; j++){
			if((cellNum1.row + i) == cellNum2.row && (cellNum1.cell + j) == cellNum2.cell)
				return true;
		}
	}
	return false;
}

function updateGrid(){
	var grid = document.getElementById("grid");
	for(var i = 0; i < 5; i++){
		var row = grid.children[i];
		for(var j = 0; j < 5; j++){
			var cell = row.children[j];
			updateCell(cell);
		}
	}
}

function updateCell(cell){
	var cellNum = getCellNumber(cell);
	var height = cellHeight[cellNum.row][cellNum.cell];
	var playerSuffix = "";
	var filename = "assets/";

	var playerInCell = getPlayerAtCell(cell);
	if(playerInCell && playerInCell.player == 1){
		playerSuffix = "1";
	}else if(playerInCell && playerInCell.player == 2){
		playerSuffix = "2";
	}

	filename += height;
	filename += playerSuffix;
	filename += ".png";

	cell.firstChild.src = filename;

	/* OLD TEXT METHOD
	var player = "";
	var playerInCell = getPlayerAtCell(cell);
	if(playerInCell && playerInCell.player == 1)
		player = "Player 1";
	else if(playerInCell && playerInCell.player == 2)
		player = "Player 2";

	cell.firstChild.innerHTML = height + "<br>" + player
	*/
}

function getCellNumber(cell){
	var row = parseInt(cell.parentElement.id);
	var cell = parseInt(cell.id);
	return {"row": row, "cell": cell};
}

function getPlayerAtCell(cell){
	var cn = getCellNumber(cell);

	if(playerPos.player1.builder1.x == cn.row)
		if(playerPos.player1.builder1.y == cn.cell)
			return {player: 1, builder: 1};
	if(playerPos.player1.builder2.x == cn.row)
		if(playerPos.player1.builder2.y == cn.cell)
			return {player: 1, builder: 2};
	if(playerPos.player2.builder1.x == cn.row)
		if(playerPos.player2.builder1.y == cn.cell)
			return {player: 2, builder: 1};
	if(playerPos.player2.builder2.x == cn.row)
		if(playerPos.player2.builder2.y == cn.cell)
			return {player: 2, builder: 2};
	return null;
}

function generateGrid(num){
	var table = document.getElementById("grid");
	for(var i = 0; i < num; i++){
		var row = document.createElement("tr");
		row.setAttribute("class", "row");
		row.setAttribute("id", "" + i);
		for(var j = 0; j < num; j++){
			var cell = document.createElement("td");
			cell.setAttribute("class", "cell");
			cell.setAttribute("id", "" + j);
			cell.onclick = function(){
				cellClick(this);
			};
			/*OLD TEXT METHOD
			var textBody = document.createElement("p");
			textBody.setAttribute("class", "cellText");*/
			var image = document.createElement("img");
			image.setAttribute("class", "gridImage");
			cell.appendChild(image);
			row.appendChild(cell);
		}
		table.appendChild(row);
	}
	updateGrid();
}

function logMessage(type, message, author){
	var fullMessage = "";
	fullMessage += "[" + author + "] ";
	fullMessage += message;
	if(type == 1)
		document.getElementById("gameLog").innerHTML = fullMessage + "<br />" + 
		document.getElementById("gameLog").innerHTML;
	else if(type == 2)
		document.getElementById("messageLog").innerHTML = fullMessage + "<br />" + 
		document.getElementById("messageLog").innerHTML;
}

function sendMessage(e){
	e = e || window.event;
	if(e.keyCode == 13){
		var text = document.getElementById("textInput").value;
		document.getElementById("textInput").value = "";

		if(!players.player2.initiated){
			logMessage(2, "You need another player to send a message!", "Error");
			return;
		}

		var author = "Player " + localPlayer;
		broadcastMessage(2, text, author);
	}
}

function broadcastMessage(type, text, author){
	firebaseRef.child(gameId + "/messages").push({
		type: type,
		message: text,
		author: author
	})
}

function generateRandomKey(){
	var randomString = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	for(var i = 0; i < 4; i++){
		randomString += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	
	return randomString;
}