// Constants
var config = {
	apiKey: "AIzaSyBJ8LRhty_5S6zRnLbcCeNWuox0fAX43ms",
	authDomain: "simplelistapp-cb37b.firebaseapp.com",
	databaseURL: "https://simplelistapp-cb37b.firebaseio.com",
	storageBucket: "simplelistapp-cb37b.appspot.com",
	messagingSenderId: "747144150123"
};
var colors = [
	"#FF3B30",
	"#FF9500",
	"#FFCC00",
	"#4CD964",
	"#5AC8FA",
	"#007AFF",
	"#5856D6",
	"#FF2D55"
];

// Variables
var database;
var auth;
var screenDom = {
	load: null,
	main: null,
	list: null
}
var inputDom = {
	id: null,
	enter: null,
	new: null
}
var listDom = {
	introPanel: null,
	infoPanel: null,
	closeIntroPanel: null,
	closeInfoPanel: null,
	titleText: null,
	titleInput: null,
	input: null,
	listItems: null,
	editTitleButton: null,
	showIntroButton: null,
	showInfoButton: null
}

var id = null;
var pass = null;

// Initialise Firebase Stuff
firebase.initializeApp(config);
database = firebase.database();
auth = firebase.auth();

auth.onAuthStateChanged(function(user){
	if(!user){
		auth.signInAnonymously().then(function(){
			postFirebaseLoad();
		}).catch(function(error){
			console.log(error);
		});
	}else{
		postFirebaseLoad();
	}
});

window.onload = function(){
	screenDom.load = document.getElementById("loadScreen");
	screenDom.main = document.getElementById("mainScreen");
	screenDom.list = document.getElementById("listScreen");

	inputDom.id = document.getElementById("idField");
	inputDom.enter = document.getElementById("enterInput");
	inputDom.new = document.getElementById("newInput");

	inputDom.id.addEventListener('keypress', mainEvents.enterTextField);
	inputDom.enter.addEventListener('click', mainEvents.enter);
	inputDom.new.addEventListener('click', mainEvents.new);

	listDom.introPanel = document.getElementById('introPanel');
	listDom.infoPanel = document.getElementById('infoPanel');
	listDom.closeIntroPanel = document.getElementById('closeIntroPanel');
	listDom.closeInfoPanel = document.getElementById('closeInfoPanel');
	listDom.titleText = document.getElementById('title');
	listDom.titleInput = document.getElementById('titleInput');
	listDom.input = document.getElementById('inputList');
	listDom.listItems = document.getElementById('listItems');
	listDom.editTitleButton = document.getElementById('editTitleButton');
	listDom.showIntroButton = document.getElementById('showIntroButton');
	listDom.showInfoButton = document.getElementById('showInfoButton');

	listDom.closeIntroPanel.addEventListener('click', listEvents.closeIntroPanel);
	listDom.closeInfoPanel.addEventListener('click', listEvents.closeInfoPanel);
	listDom.titleInput.addEventListener('keypress', listEvents.titleEnter);
	listDom.titleInput.addEventListener('blur', listEvents.titleDone);
	listDom.editTitleButton.addEventListener('click', listEvents.editTitle);
	listDom.showInfoButton.addEventListener('click', listEvents.showInfo);
	listDom.showIntroButton.addEventListener('click', listEvents.showIntro);

	listDom.input.addEventListener('keypress', listEvents.inputEnter);
	listDom.input.addEventListener('blur', listEvents.inputDone);
	listDom.input.addEventListener('focus', listEvents.inputBegan);
}

var finishedPostFirebaseLoad = false;
function postFirebaseLoad(){
	if(finishedPostFirebaseLoad)
		return;

	var fullId = getParameterByName("id");
	
	if(fullId && fullId.search(/^[A-Z]{10}$/i) == 0){
		fullId = fullId.toUpperCase();

		id = fullId.slice(0, 6);
		pass = fullId.slice(6, 10);
	}

	if(!id){
		screenDom.load.classList.add("hide");
		screenDom.main.classList.remove("hide");
	}else{
		database.ref("passes/" + id + "/" + auth.currentUser.uid + 
				"/pass").set(pass).then(function(){
			database.ref("lists/" + id.toUpperCase() + "/data").on('value', mainRefresh, 
				function(error){
					console.log("Invalid id");
					console.log(error);
					alert("The list you are trying to access does not exist!\n" +
						"You will now be returned to the homepage.");
					window.location.search = "";
			});
			database.ref("lists/" + id.toUpperCase() + "/list-items").on('child_added', 
				function(snap){
					addListItem(snap.key, snap.child('text').val());
				}, function(error){
					console.log("Invalid id");
					console.log(error);
			});
			database.ref("lists/" + id.toUpperCase() + "/list-items").on('child_removed', 
				function(snap){
					removeListItem(snap.key);
				}, function(error){
					console.log("Invalid id");
					console.log(error);
			});
			database.ref("lists/" + id.toUpperCase() + "/list-items").on('child_changed', 
				function(snap){
					changeListItem.update(snap.key, snap.child('text').val());
				}, function(error){
					console.log("Invalid id");
					console.log(error);
			});

			document.getElementById("idDisplay").innerHTML = id.toUpperCase() + pass.toUpperCase();
		});
	}

	finishedPostFirebaseLoad = true;
}

function mainRefresh(snap){
	if(!screenDom.list.classList || screenDom.list.classList.contains("hide")){
		screenDom.load.classList.add("hide");
		screenDom.list.classList.remove("hide");
	}

	if(snap.child('new').val())
		listEvents.showIntro();

	var titleText = snap.child('title').val();
	listDom.titleText.innerHTML = titleText;
	window.document.title = titleText;

	var newColor = snap.child('color').val();
	if(newColor > -1){
		var mainElements = screenDom.list.getElementsByClassName("navMainColor");
		var whiteElements = screenDom.list.getElementsByClassName("navWhiteColor");

		for(var i = 0; i < mainElements.length; i++){
			mainElements[i].style.backgroundColor = colors[newColor];
			mainElements[i].style.borderColor = "white";
		}

		for(var i = 0; i < whiteElements.length; i++){
			whiteElements[i].style.color = "white";
		}
	}
}

var mainEvents = {
	new: function(){
		var generatedId = generateRandomString(6);
		var generatedPass = generateRandomString(4);
		
		database.ref("lists/" + generatedId + "/data").set({
			title: "New List",
			pass: generatedPass,
			new: true,
			color: -1
		}).then(function(){
			database.ref("passes/" + generatedId + "/" + auth.currentUser.uid + 
				"/pass").set(generatedPass).then(function(){
					window.location.assign(window.location.href + "?id=" + generatedId + generatedPass);
			});
		}).catch(function(error){
			console.log(error);
			mainEvents.new();
			return;
		});
	},
	enter: function(){
		var idVal = (inputDom.id.value).toUpperCase();

		if(idVal){
			if(idVal.search(/^[A-Z]{10}$/i) == 0){
				database.ref("passes/" + idVal.slice(0, 6) + "/" + auth.currentUser.uid + 
					"/pass").set(idVal.slice(6)).then(function(){
						window.location.assign(window.location.href + "?id=" + idVal);
				});
			}else{
				console.log('not real');
			}
		}
	},
	enterTextField: function(e){
		if(e.keyCode == 13)
			mainEvents.enter();
	}
}

var doTitleEnd = false;
var doInputEnterEnd = false;
var listEvents = {
	showInfo: function(){
		listDom.infoPanel.classList.remove('hide');
	},
	showIntro: function(){
		listDom.introPanel.classList.remove('hide');
	},
	closeIntroPanel: function(){
		database.ref('lists/' + id + '/data/new').set(false);
		listDom.introPanel.classList.add('hide');
	},
	closeInfoPanel: function(){
		listDom.infoPanel.classList.add('hide');
	},
	colorChange: function(color){
		database.ref("lists/" + id + "/data/color").set(color);

		if(color == -1){
			var mainElements = screenDom.list.getElementsByClassName("navMainColor");
			var whiteElements = screenDom.list.getElementsByClassName("navWhiteColor");

			for(var i = 0; i < mainElements.length; i++){
				mainElements[i].style.backgroundColor = "#F8F8F8";
				mainElements[i].style.borderColor = "#E7E7E7";
			}

			for(var i = 0; i < whiteElements.length; i++){
				whiteElements[i].style.color = "#777777";
			}
		}
	},
	editTitle: function(){
		listDom.titleInput.value = listDom.titleText.innerHTML;
		listDom.titleText.classList.add('hide');
		listDom.titleInput.parentElement.classList.remove('hide');
		listDom.titleInput.focus();

		doTitleEnd = true;
	},
	titleEnter: function(e){
		if(!doTitleEnd)
			return;

		var code = e.which || e.keyCode;
		if(code == 13)
			listEvents.titleDone();
	},
	titleDone: function(){
		if(!doTitleEnd)
			return;

		var title = listDom.titleInput.value;
		if(title.search(/\S/g) >= 0){
			database.ref("lists/" + id + "/data/title").set(listDom.titleInput.value);
			window.document.title = title;
		}
		listDom.titleText.classList.remove('hide');
		listDom.titleInput.parentElement.classList.add('hide');

		doTitleEnd = false;
	},
	inputEnter: function(e){
		if(!doInputEnterEnd)
			return;

		var code = e.which || e.keyCode;
		if(code == 13){
			listEvents.inputDone();
			listDom.input.blur();
		}
	},
	inputDone: function(){
		if(!doInputEnterEnd)
			return;

		var newText = listDom.input.value;
		if(newText.search(/\S/g) >= 0){
			var newKey = database.ref("lists/" + id + "/list-items").push().key;

			database.ref("lists/" + id + "/list-items/" + newKey).update({
				text: newText
			});
		}

		listDom.input.value = "";

		doInputEnterEnd = false;
	},
	inputBegan: function(){
		doInputEnterEnd = true;
	}

}

function addListItem(key, text){
	var listItem = document.createElement("LI");
	listItem.className = "list-group-item";
	listItem.id = key;

		var rowDiv = document.createElement("DIV");
		rowDiv.className = "row"

			var mainColDiv = document.createElement("DIV");
			mainColDiv.className = "col-xs-9";

				var para = document.createElement("P");
				para.className = "itemText";
				para.innerHTML = text;

				mainColDiv.appendChild(para);

				var input = document.createElement("INPUT");
				input.className = "listEditInput hide";
				input.type = "text";
				input.addEventListener('blur', function(){
					changeListItem.done(key);
				});
				input.addEventListener('keypress', function(event){
					changeListItem.enter(key, event);
				});

				mainColDiv.appendChild(input);

			rowDiv.appendChild(mainColDiv);

			var subColDiv = document.createElement("DIV");
			subColDiv.className = "col-xs-2 col-sm-offset-1 itemIcons";

				var editSpan = document.createElement("SPAN");
				editSpan.className = "fa fa-edit fa-lg editIcon";
				editSpan.addEventListener('click', function(){
					changeListItem.begin(key);
				});

				subColDiv.appendChild(editSpan);

				var closeSpan = document.createElement("SPAN");
				closeSpan.className = "fa fa-times fa-2x closeIcon";
				closeSpan.addEventListener('click', function(){
					database.ref("lists/" + id + "/list-items/" + key).set(null);
				});

				subColDiv.appendChild(closeSpan);

			rowDiv.appendChild(subColDiv);

		listItem.appendChild(rowDiv);

	listDom.listItems.appendChild(listItem);
}

function removeListItem(key){
	var node = document.getElementById(key);
	node.parentElement.removeChild(node);
}

var doChangeListItem = {};
var changeListItem = {
	begin: function(key){
		var para = document.getElementById(key).getElementsByClassName("itemText")[0];
		var input = document.getElementById(key).getElementsByClassName("listEditInput")[0];

		para.classList.add('hide');
		input.classList.remove('hide');
		input.value = para.textContent;
		input.focus();

		doChangeListItem[key] = true;
	},
	enter: function(key, event){
		console.log(doChangeListItem[key]);
		if(!(doChangeListItem[key] == undefined || !doInputEnterEnd[key]))
			return;

		var code = event.which || event.keyCode;
		if(code == 13){
			listEvents.inputDone();
			document.getElementById(key).getElementsByClassName("listEditInput")[0].blur();
		}
	},
	done: function(key){
		if(!(doChangeListItem[key] == undefined || !doInputEnterEnd[key]))
			return;

		var para = document.getElementById(key).getElementsByClassName("itemText")[0];
		var input = document.getElementById(key).getElementsByClassName("listEditInput")[0];

		var newText = input.value;
		if(newText.search(/\S/g) >= 0){
			database.ref("lists/" + id + "/list-items/" + key).update({
				text: newText
			});
		}

		para.classList.remove('hide');
		input.classList.add('hide')

		doInputEnterEnd.key = false;
	},
	update: function(key, text){
		var para = document.getElementById(key).getElementsByClassName("itemText")[0];

		para.innerHTML = text;
	}
}

function generateRandomString(size){
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var output = "";

	for(var i = 0; i < size; i++){
		output += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return output;
}

function getParameterByName(name, url){
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(window.location.href);

	if (!results) return null;
	if (!results[2]) return '';

	return decodeURIComponent(results[2].replace(/\+/g, " "));
}