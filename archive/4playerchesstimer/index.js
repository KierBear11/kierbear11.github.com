var maxSet = false;
var currentPlayer;

var timeLoop;
var maxTime;

var playerTime = [0, 0, 0, 0];

function maxTime(){
	maxSet = true;
	maxTime = parseInt(document.getElementById("maxTimeInput").value) * 60;

	for(i = 0; i < playerTime.length; i++){
		playerTime[i] = maxTime;
		document.getElementById("p" + i).innerHTML = getTimeString(maxTime);
	}

	document.getElementById("maxButton").style.display = "none";
}

function startTimer(){
	if(maxSet == true){
		document.getElementById("bigButton").style.display = "none";
		document.getElementById("sepLine").style.display = "none";
		document.getElementById("maxTimeInput").style.display = "none";
		document.getElementById("descMaxTime").style.display = "none";
		document.getElementById("sepLine2").style.display = "none";

		currentPlayer = 0;
		document.getElementById("p" + currentPlayer).style.border = "2px groove red";
		document.getElementById("p" + currentPlayer).style.color = "black";
		document.getElementById("p" + currentPlayer + "button").style.backgroundColor = "red";
		document.getElementById("p" + currentPlayer + "button").style.padding = "10px";

		timeLoop = window.setInterval(function(){
			if(playerTime[currentPlayer] != 0){
				playerTime[currentPlayer] = playerTime[currentPlayer] - 1;
				document.getElementById("p" + currentPlayer).innerHTML = getTimeString(playerTime[currentPlayer]);
			}
		},1000);
	}
}

function getTimeString(seconds){
	var minutesResult = Math.floor(seconds / 60);
	var secondsResult = seconds - (minutesResult * 60);

	if(minutesResult < 10){
		minutesResult = "0" + minutesResult;
	}

	if(secondsResult < 10){
		secondsResult = "0" + secondsResult;
	}

	return minutesResult + ":" + secondsResult;
}

function stopTime(player){
	if(currentPlayer == player){
		if(currentPlayer < 3){
			document.getElementById("p" + currentPlayer).style.border = "";
			document.getElementById("p" + currentPlayer).style.color = "gray";
			document.getElementById("p" + currentPlayer + "button").style.backgroundColor = "lightgreen";
			document.getElementById("p" + currentPlayer + "button").style.padding = "5px";
			currentPlayer++;
			document.getElementById("p" + currentPlayer).style.border = "2px groove red";
			document.getElementById("p" + currentPlayer).style.color = "black";
			document.getElementById("p" + currentPlayer + "button").style.backgroundColor = "red";
			document.getElementById("p" + currentPlayer + "button").style.padding = "10px";
		}else{
			document.getElementById("p" + currentPlayer).style.border = "";
			document.getElementById("p" + currentPlayer).style.color = "gray";
			document.getElementById("p" + currentPlayer + "button").style.backgroundColor = "lightgreen";
			document.getElementById("p" + currentPlayer + "button").style.padding = "5px";
			currentPlayer = 0;
			document.getElementById("p" + currentPlayer).style.border = "2px groove red";
			document.getElementById("p" + currentPlayer).style.color = "black";
			document.getElementById("p" + currentPlayer + "button").style.backgroundColor = "red";
			document.getElementById("p" + currentPlayer + "button").style.padding = "10px";
		}
	}
}