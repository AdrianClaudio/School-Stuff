(function(window) {
	chrome.storage.local.get(null, function(data) {
		var enabled = data["isSlitherFriendsOn"];
		if (typeof enabled == "undefined") {
			chrome.storage.local.set({'isSlitherFriendsOn': true});
			enabled = true;
		}
		if (enabled) {
			showLoadOverlay('Please wait...');
			setTimeout(function() {
				if (document.getElementById('gameload-overlay') != null) {
					hideLoadOverlay();
					showLoadOverlay('Slither Friends Took Too Long to Load<br/>Giving up...', '#D6A100');
					setTimeout(hideLoadOverlay, 2000);
				}
			}, 10000);
			loadScript(chrome.extension.getURL("jquery-2.2.0.min.js"), function() {
				loadScript(chrome.extension.getURL("slitherfriends.min.js"), function() {
					if (typeof data["groupplay_id"] != "undefined" && data["groupplay_id"] != null) {
						var groupPlayLink = document.createEvent("CustomEvent");
						groupPlayLink.initCustomEvent("initGroupPlayId", true, true, data["groupplay_id"]);
						document.dispatchEvent(groupPlayLink);
						chrome.storage.local.set({'groupplay_id': null});
					} else if (typeof data["groupplay_tag"] != "undefined" && data["groupplay_tag"] != null) {
						var groupPlayLink = document.createEvent("CustomEvent");
						groupPlayLink.initCustomEvent("initGroupPlayTag", true, true, data["groupplay_tag"]);
						document.dispatchEvent(groupPlayLink);
						chrome.storage.local.set({'groupplay_tag': null}); // clear
					}
					if (data["isBroadcastTagsOn"] && data["tagsToken"].length == 64) {
						var startTagBroadcaster = document.createEvent("CustomEvent");
						startTagBroadcaster.initCustomEvent("startTagBroadcaster", true, true, data["tagsToken"]);
						document.dispatchEvent(startTagBroadcaster);
					}
					if (data["skinsToken"] != null && data["skinsToken"].length == 64) {
						var initSkinsToken = document.createEvent("CustomEvent");
						initSkinsToken.initCustomEvent("initSkinsToken", true, true, data["skinsToken"]);
						document.dispatchEvent(initSkinsToken);
					}
					loadScript(chrome.extension.getURL("gamepad.min.js"), function(){
						var initGamepad = document.createEvent("CustomEvent");
						initGamepad.initCustomEvent("initGamepad", true, true, true);
						document.dispatchEvent(initGamepad);
					});
				});
			});
		}
	});

	function loadScript(url, callback) {

		var script = document.createElement("script")
		script.type = "text/javascript";

		if (script.readyState) { //IE
			script.onreadystatechange = function() {
				if (script.readyState == "loaded" || script.readyState == "complete") {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else { //Others
			script.onload = function() {
				callback();
			};
		}

		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	
	function showLoadOverlay(msg, color) {
		var overlay = document.createElement('div');
		overlay.id = 'gameload-overlay';
		overlay.style.overflow = 'hidden';
		overlay.style.margin = '0';
		overlay.style.padding= '0';
		overlay.style.backgroundColor = 'rgba(20, 25, 30, 0.7)';
		overlay.style.position = 'absolute';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.height = '100%';
		overlay.style.width = '100%';
		overlay.style.zIndex = '999';
		overlay.style.fontFamily = '"Arial", Verdana, sans-serif';
		overlay.style.color = 'white';
		overlay.style.textAlign = 'center';
		var overlayText = document.createElement('h1');
		overlayText.style.zIndex = '1000';
		overlayText.style.marginTop = '12%';
		overlayText.style.lineHeight = '50px';
		overlay.style.color = (typeof color != "undefined") ? color : 'white';
		overlayText.innerHTML = msg;
		
		overlay.appendChild(overlayText);
		document.body.appendChild(overlay);
	}
	
	function hideLoadOverlay() {
		var overlayElem = document.getElementById('gameload-overlay');
		overlayElem.parentNode.removeChild(overlayElem);
	}

})(window);