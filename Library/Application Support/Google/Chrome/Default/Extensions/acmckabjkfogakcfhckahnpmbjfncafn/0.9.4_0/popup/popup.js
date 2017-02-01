(function(window, $) {
	
	/*** VARIABLES ***/
	var storage = chrome.storage.local;
	var hasTags = false;
	
	var playBtn = document.getElementById('play'),
		playUnblockedBtn = document.getElementById('playunblocked'),
		extensionSiteBtn = document.getElementById('extsite'),
		donateBtn = document.getElementById('donatesite'),
		toggleModBtn = document.getElementById('usefriends'),
		toggleTagsBtn = document.getElementById('broadcasttags'),
		disclaimerBtn = document.getElementById('disclaimer');
		
	var modBtnText = {
		'enabled': 'Slither Friends is Enabled',
		'disabled': 'Slither Friends is Disabled'
	};
	var tagsBtnText = {
		'enabled': 'Group Tags are Enabled',
		'disabled': 'Group Tags are Disabled'
	};
	
	/*** BEGIN ***/
	function init() {
		storage.get(null, function(data) {
			if (data['tagsToken'].length == 64) {
				hasTags = true;
				$('#container').css('height', '200px'); // enlarge popup for room
				$('#broadcasttags_holder').show();
			}
		});
		loadSettings();
		assignListeners();
	}
	
	function loadSettings() {
		storage.get(null, function(data) {
			setToggleBtn(toggleModBtn, data['isSlitherFriendsOn']);
			if (hasTags) {
				setToggleBtn(toggleTagsBtn, data['isBroadcastTagsOn']);
				if (!data['isSlitherFriendsOn']) setGrayedBtn(toggleTagsBtn);
			}
		});
	}
	
	/*** GENERIC FUNCTIONS ***/	
	function redirect(url) {
		chrome.tabs.update({'url': url});
	}
	
	function popup(url) {
		chrome.windows.create({'url': url, 'type': 'popup'});
	}
	
	function setGrayedBtn(btn) {
		btn.className = 'grayedout field';
	}
	
	function setToggleBtn(btn, enabled) {
		console.log('Set ' + btn.id + ' Btn: ' + enabled);
		var state = (enabled) ? 'enabled' : 'disabled';
		btn.className = state + ' field';
		switch (btn.id) {
			case 'usefriends':
				setBtnText(btn, modBtnText[state]);
				break;
			case 'broadcasttags':
				setBtnText(btn, tagsBtnText[state]);
				break;
		}
	}
	
	function setBtnText(btn, value) {
		$(btn).find('span').text(value);
	}
	
	function assignListeners() {
		$(playBtn).on('click', onPlayBtn);
		$(playUnblockedBtn).on('click', onPlayUnblockedBtn);
		$(extensionSiteBtn).on('click', onExtensionPageBtn);
		$(donateBtn).on('click', onDonateBtn);
		$(toggleModBtn).on('click', toggleMod);
		$(toggleTagsBtn).on('click', toggleTags);
		$(disclaimerBtn).on('click', onDisclaimerBtn);
	}
	
	/*** EVENT HANDLERS ***/
	function toggleMod(event) {
		storage.get(null, function(data) {
			console.log('Friends: ' + data['isSlitherFriendsOn']);
			storage.set({'isSlitherFriendsOn': !data['isSlitherFriendsOn']});
			loadSettings();
		});
	}
	
	function toggleTags(event) {
		storage.get(null, function(data) {
			if (!data['isSlitherFriendsOn']) {
				return;
			}
			console.log('Broadcast: ' + data['isBroadcastTagsOn']);
			storage.set({'isBroadcastTagsOn': !data['isBroadcastTagsOn']});
			loadSettings();
		});
	}
	
	function onPlayBtn(event) {
		redirect('http://slither.io');
	}
	
	function onPlayUnblockedBtn(event) {
		redirect('http://slitherfriends.pw/play/?v=2');
	}
	
	function onExtensionPageBtn(event) {
		redirect('http://slitherfriends.pw');
	}
	
	function onDonateBtn(event) {
		redirect('http://slitherfriends.pw/donate.php');
	}
	
	function onDisclaimerBtn(event) {
		popup('popup/disclaimer.html');
	}
	
	window.onload = init;
	
})(window, jQuery);