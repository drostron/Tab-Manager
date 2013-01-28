function TabManager(){
	var This = Div();

	var console = chrome.extension.getBackgroundPage().console

	This.Dragging = false;
	This.LastClicked = null;
	This.Restart = function(){
		console.log("restarting");
		This.Layout = localStorage["layout"];
		if(!This.Layout){
			This.Layout = "horizontal";
		}
		This.innerHTML = "";
		chrome.windows.getAll({populate:true},function(windows){
			for(var i = 0; i < windows.length; i++){
				This.appendChild(Window(windows[i],This));
			}

			if(This.Layout == "blocks"){
				var wins = This.getElementsByClassName("window");
				var highest = 0;
				for(var i = 0; i < wins.length; i++){
					console.log(wins[i].clientHeight);
					if(wins[i].clientHeight > highest){
						highest = wins[i].clientHeight;
					}
				}
				for(var i = 0; i < wins.length; i++){
					wins[i].style.height = highest+"px";
					wins[i].style.width = "auto";
				}
			}

			var addwindow;
			var deletetabs;
			var pintabs;
			var search;
			var layout;
			This.appendChild(
				Div("window",
					search = Txt(),
					layout = Div("icon windowaction "+This.Layout),
					deletetabs = Div("icon windowaction trash"),
					pintabs = Div("icon windowaction pin"),
					addwindow = Div("icon windowaction new")
				)
			);

			search.focus();
			search.select();

			deletetabs.on("click",function(){
				var tabs = This.getElementsByClassName("tab selected");
				if(tabs.length){
					var t = [];
					for(var i = 0; i < tabs.length; i++){
						t.push(tabs[i].Tab);
					}
					chrome.extension.sendRequest({action:"delete",tabs:t},function(){
						setTimeout(This.Restart,100);
					});
				}else{
					chrome.windows.getCurrent(function(w){
						console.log(w);
						chrome.tabs.getSelected(w.id,function(t){
							chrome.tabs.remove(t.id,This.Restart);
						});
					});
				}
			});
			function addWindow(shiftKey){
				var tabs = This.getElementsByClassName("tab selected");
				var t = [];
				for(var i = 0; i < tabs.length; i++){
					t.push(tabs[i].Tab);
				}
				if (t.length == 1 && !shiftKey) {
					chrome.windows.update(t[0].windowId,{focused:true});
					chrome.tabs.update(t[0].id,{selected:true});
					This.restart();
				}
				else if(t.length > 0) {
					chrome.extension.sendRequest({action:"new",tabs:t},function(){
						This.Restart();
					});
				}
			}
			// direction: (up|down)
			function selectTab(direction, shiftKey) {
				var tabs = This.getElementsByClassName("tab");
				var selectedIndices = [];
				var selectedIndex;
				for(var i = 0; i < tabs.length; i++) {
					var classes = tabs[i].className;
					var selected = classes.indexOf("selected");
					if (selected >= 0) {
						selectedIndices.push(i);
					}
					if (!shiftKey) {
						tabs[i].removeClass("selected");
					}
				}
				if (selectedIndices.length <= 0) {
					selectedIndices = [-1];
				}
				if (direction == "up") {
					selectedIndex = selectedIndices[0] - 1;
					if (selectedIndex < 0) {
						selectedIndex = tabs.length - 1;
					}
				}
				else {
					selectedIndex = (selectedIndices[selectedIndices.length - 1] + 1) % tabs.length;
				}
				var selected = tabs[selectedIndex];
				selected.addClass("selected");
				selected.scrollIntoView(true);
			}
			// TODO: add scroll to view, fix and persist search field at bottom of popup
			function selectTabsSearch() {
				var tabs = This.getElementsByClassName("tab");
				for(var i = 0; i < tabs.length; i++){
					var tab = tabs[i];
					if(search.value && (tab.Tab.title+'\n'+tab.Tab.url).toLowerCase().indexOf(search.value.toLowerCase()) >= 0){
						tab.addClass("selected");
					}else{
						tab.removeClass("selected");
					}
				}
			}

			addwindow.on("click",addWindow);
			pintabs.on("click",function(){
				var tabs = This.getElementsByClassName("tab selected");
				if(tabs.length ){
					for(var i = 0; i < tabs.length; i++){
						chrome.tabs.update(tabs[i].ID,{pinned:!tabs[i].Pinned},i==0?This.Restart:function(){});
					}
				}else{
					chrome.windows.getCurrent(function(w){
						console.log(w);
						chrome.tabs.getSelected(w.id,function(t){
							chrome.tabs.update(t.id,{pinned:!t.pinned},This.Restart);
						});
					});
				}
			});
			search.on("keyup",function(e){
				switch (e.keyCode) {
					case 38: // up
					case 40: // down
					case 16: // shift
						break;
					default:
						selectTabsSearch();
				}
			});
			search.on("keydown",function(e){
				switch (e.keyCode) {
					case 13: // enter
						e.preventDefault();
						addWindow(e.shiftKey);
					case 38: // up
						selectTab("up", e.shiftKey);
						break;
					case 40: // down
						selectTab("down", e.shiftKey);
						break;
				}
			});

			layout.on("click",function(){
				if(This.Layout == "blocks"){
					localStorage["layout"] = "horizontal";
				}else if(This.Layout == "horizontal"){
					localStorage["layout"] = "vertical";
				}else{
					localStorage["layout"] = "blocks";
				}
				This.Restart();
			});
		});
	}
	This.Restart();

	return This;
}
