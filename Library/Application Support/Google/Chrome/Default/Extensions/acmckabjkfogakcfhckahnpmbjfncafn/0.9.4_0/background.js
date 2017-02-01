chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		if (request) {
			switch (request.type) {
				case 'groupplay':
					if (request.tag.length > 0) {
						sendResponse({success: true, message: 'Please wait...'});
						chrome.storage.local.set({'groupplay_tag': request.tag});
						chrome.tabs.update({'url': 'http://slither.io'});
						
					} else if (request.id.length > 0) {
						sendResponse({success: true, message: 'Please wait...'});
						chrome.storage.local.set({'groupplay_id': request.id});
						chrome.tabs.update({'url': 'http://slither.io'});
					} else {
						sendResponse({success: false, message: 'Invalid Link'});
					}
					break;
				case 'skindesigner':
					var responseData = {};
					chrome.storage.local.get(null, function(data) {
						if (data["skinsToken"] == null || data["skinsToken"].length < 1) {
							sendResponse({success: false, message: 'Token not provided.'});
						} else {
							if (request.needToken) {
								responseData['token'] = data["skinsToken"];
							}
							if (request.needSkinsLeft || request.needAddons) {
								$.post('http://slitherfriends.pw/extension/skindesigner/validateToken.php', { 'token': data["skinsToken"], 'v': '1' }, function(tokenResponse) {
									tokenResponse = JSON.parse(tokenResponse);
									if (tokenResponse.success != '1') {
										sendResponse({success: false, message: 'Token not valid.'});
									} else if (tokenResponse.data == null && tokenResponse.data.length == 0) {
										sendResponse({success: false, message: 'Data error occured. Contact support.'});
									} else {
										tokenResponse = JSON.parse(tokenResponse['data']);
										if (request.needSkinsLeft)
											responseData['skinsLeft'] = tokenResponse['skins_left'];
										if (request.needAddons) {
											responseData['customColors'] = tokenResponse['colors'];
											responseData['customTextures'] = tokenResponse['textures'];
										}
										sendResponse({success: true, message: responseData});
									}
								});
							} else {
								sendResponse({success: true, message: responseData});
							}
						}
					});
					return true;
				default:
					sendResponse({success: false, message: 'Invalid Request'});
					break;
			}
		}
	}
);

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	chrome.storage.local.set({'isSlitherFriendsOn': true});
	if (details.reason == "install") {
		alert('Welcome to Slither Friends. With this extension you can connect to the same server as your buddies by sharing a link or your id, connect to a YouTuber\'s/Streamer\'s server using their group tag, design your own skins and use them in-game, use custom antennas, play with a gamepad, and more! To get started go to slither.io by clicking on \'Play Slither.io\' in the Slither Friends\' menu at the top right of your screen. If you like the extension, please rate us 5 stars on the Chrome Web Store!');
	} else if(details.reason == "update") {
		chrome.storage.local.get(null, function(data) {
			if (data["token"] != null) {
				chrome.storage.local.set({'tagsToken': data["token"]});
			}
		});
		alert('Slither Friends just updated! In the new version, you can now see your friend\'s id in the tab title on our custom play page.');
	}
});