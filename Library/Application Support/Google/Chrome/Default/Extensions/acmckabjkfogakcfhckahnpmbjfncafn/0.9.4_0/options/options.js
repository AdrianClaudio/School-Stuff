(function(window, $) {
	
	var storage = chrome.storage.local;
	
	var sdResponseBox = document.getElementById("skindesigner-response"),
		sdTokenBox = document.getElementById("skindesigner-token"),
		sdValidateTokenBtn = document.getElementById("skindesigner-validatetoken"),
		gtResponseBox = document.getElementById("grouptags-response"),
		gtTokenBox = document.getElementById("grouptags-token"),
		gtValidateTokenBtn = document.getElementById("grouptags-validatetoken"),
		grouptagsBox = document.getElementById("grouptags"),
		deleteTagBtn = document.getElementById("deletetag"),
		deleteTagConfirm = document.getElementById("grouptags-deleteconfirmation"),
		toggleTagBtn = document.getElementById("toggletag"),
		newTagBox = document.getElementById("newtag"),
		addTagBtn = document.getElementById("addtag"),
		closeBtn = document.getElementById("closebtn");
	
	var storageTokens = {
		'skin': null,
		'tag': null
	};
	var groupTags = [];
	var removingTag = false;
	
	function init() {
		$(closeBtn).on('click', closeOptions);
		storage.get(null, function(data) {
			storageTokens['skin'] = data["skinsToken"];
			if (storageTokens['skin'] != null) {
				sdTokenBox.readOnly = true;
				sdTokenBox.disabled = true;
				sdTokenBox.value = storageTokens['skin'];
				// updateform
				updateForm(sdTokenBox, function(verified) {
					if (!verified) {
						resetSkinsTokenSetup();
						$(sdTokenBox).on('input', function() {
							checkTokenBox(sdTokenBox);
						});
						$(sdValidateTokenBtn).on('click', function() {
							validateToken(sdTokenBox);
						});
					}
				});
			} else {
				$(sdTokenBox).on('input', function() {
					checkTokenBox(sdTokenBox);
				});
				$(sdValidateTokenBtn).on('click', function() {
					validateToken(sdTokenBox);
				});
				resetSkinsTokenSetup();
			}
			
			storageTokens['tag'] = data["tagsToken"];
			if (storageTokens['tag'] != null) {
				// Set token box value
				gtTokenBox.readOnly = true;
				gtTokenBox.disabled = true;
				gtTokenBox.value = storageTokens['tag'];
				updateForm(gtTokenBox, function(verified) {
					if (!verified) {
						resetTagTokenSetup();
						$(gtTokenBox).on('input', function() {
							checkTokenBox(gtTokenBox);
						});
						$(gtValidateTokenBtn).on('click', function() {
							validateToken(gtTokenBox);
						});
					}
				});
			} else {
				// Enable entry for token
				$(gtTokenBox).on('input', function() {
					checkTokenBox(gtTokenBox);
				});
				$(gtValidateTokenBtn).on('click', function() {
					validateToken(gtTokenBox);
				});
				resetTagTokenSetup();
			}
			$(grouptagsBox).on('change', onTagSelected);
		});
	}
	
	function updateForm(tokenbox, callback) {
		var tokenbtn = null,
			storagetoken = null,
			responsebox = null,
			resetSetup = null,
			url = null;
		switch (tokenbox.id) {
			case 'skindesigner-token':
				tokenbtn = sdValidateTokenBtn;
				storagetoken = 'skin';
				responsebox = sdResponseBox;
				resetSetup = resetSkinsTokenSetup;
				url = 'http://slitherfriends.pw/extension/skindesigner/validateToken.php';
				break;
			case 'grouptags-token':
				tokenbtn = gtValidateTokenBtn;
				storagetoken = 'tag';
				responsebox = gtResponseBox;
				resetSetup = resetTagTokenSetup;
				url = 'http://slitherfriends.pw/extension/groups/getTags.php';
				break;
			default:
				return;
		}
		
		$(responsebox).hide();
		if (storageTokens[storagetoken] == null || storageTokens[storagetoken].length != 64) {
			resetSetup();
			return;
		}
		$.post(url, { 'token': storageTokens[storagetoken], 'v': '1' }, function(response) {
			response = JSON.parse(response);
			// Invalid Token
			if (response.success != '1') {
				$(responsebox).removeClass('success').addClass('error');
				responsebox.innerHTML = response.message;
				$(responsebox).slideDown('slow');
				resetSetup();
				if (typeof callback != "undefined") callback(false);
				return;
			}
			// Safety check
			if (response.data == null && response.data.length == 0) {
				$(responsebox).removeClass('success').addClass('error');
				responsebox.innerHTML = 'Data error occured. Contact support with error code: 2';
				$(responsebox).slideDown('slow');
				if (typeof callback != "undefined") callback(false);
				return;
			}
			// Valid token
			var data = JSON.parse(response.data);
			if (tokenbox.id == 'skindesigner-token') {
				// data = amt free skins, and addons enabled
				$("#skindesigner-activation").slideUp('slow');
				document.getElementById('amtfreeskins').innerHTML = 'You have ' + data.skins_left + ((data.skins_left == 1) ? ' skin' : ' skins') + ' left.';
				$("#skindesigner-form").slideDown('slow');
			} else if (tokenbox.id == 'grouptags-token') {
				// data = grouptags
				$("#grouptags-activation").slideUp('slow');
				$("#grouptags-form").slideDown('slow');
				setTags(data);
				enableRequestTags();
				addListeners();
			}
			
			if (typeof callback != "undefined") callback(true);
		});
	}
	
	function checkTokenBox(tokenbox) {
		var tokenbtn = null,
			storagetoken = null;
		switch (tokenbox.id) {
			case 'skindesigner-token':
				tokenbtn = sdValidateTokenBtn;
				storagetoken = 'skin';
				break;
			case 'grouptags-token':
				tokenbtn = gtValidateTokenBtn;
				storagetoken = 'tag';
				break;
			default:
				return;
		}
		if (tokenbox.value.length == 64) {
			$(tokenbtn).slideDown('slow', function() {
				storageTokens[storagetoken] = tokenbox.value;
				tokenbtn.disabled = false;
			});
		} else if ($(tokenbtn).is(":visible")) {
			$(tokenbtn).disabled = true;
			$(tokenbtn).slideUp('slow');
		}
	}
	
	function validateToken(tokenbox) {
		var tokenbtn = null,
			storagetoken = null,
			storagetokenkey = null;
		switch (tokenbox.id) {
			case 'skindesigner-token':
				tokenbtn = sdValidateTokenBtn;
				storagetoken = 'skin';
				storagetokenkey = 'skinsToken';
				break;
			case 'grouptags-token':
				tokenbtn = gtValidateTokenBtn;
				storagetoken = 'tag';
				storagetokenkey = 'tagsToken';
				break;
			default:
				return;
		}
		
		// Disable input to prevent change before submission
		tokenbtn.disabled = true;
		tokenbox.disabled = true;
		tokenbox.readOnly = true;
		
		// Simple modification check
		if (storageTokens[storagetoken].length != 64) {
			// wtf, probably modified through inspector
			$(tokenbtn).slideUp('slow');
			tokenbox.value = (storageTokens[storagetoken] != null) ? storageTokens[storagetoken] : '';
			console.log ('storage token:' + storageTokens[storagetoken] + '.')
			return;
		}
		
		// Proceed if modification check passed
		// Validation is checked serverside as well, don't waste your time.
		updateForm(tokenbox, function(verified) {
			console.log('verified:' + verified);
			if (verified) {
				var obj = {};
				obj[storagetokenkey] = storageTokens[storagetoken];
				storage.set(obj);
			} else {
				if (tokenbox.id == 'skindesigner-token')
					resetSkinsTokenSetup();
				else if (tokenbox.id == 'grouptags-token')
					resetTagTokenSetup();
			}
		});
	}
	
	function resetTagTokenSetup() {
		$(gtValidateTokenBtn).disabled = true;
		$(gtValidateTokenBtn).slideUp('slow');
		gtTokenBox.disabled = false;
		gtTokenBox.readOnly = false;
		
		grouptagsBox.disabled = true;
		deleteTagBtn.disabled = true;
		toggleTagBtn.disabled = true;
		addTagBtn.disabled = true;
		
		storage.set({"tagsToken": null});
		
		if ($("#grouptags-activation").is(":visible") == false) {
			$("#grouptags-activation").show();
		}
	}
	
	function resetSkinsTokenSetup() {
		$(sdValidateTokenBtn).disabled = true;
		$(sdValidateTokenBtn).slideUp('slow');
		sdTokenBox.disabled = false;
		sdTokenBox.readOnly = false;
		
		storage.set({"skinsToken": null});
		
		if ($("#skindesigner-activation").is(":visible") == false) {
			$("#skindesigner-activation").show();
		}
	}
	
	function setTags(tags, callback) {
		$(grouptagsBox).empty();
		groupTags = tags;
		for (var i = 0; i < tags.length; i++) {
			if (tags[i] == null) continue;
			var tagOption = document.createElement("option");
			tagOption.value = tags[i].tag;
			tagOption.innerHTML = "gt:" + tags[i].tag;
			if (tags[i].enabled == 'false') {
				tagOption.className = 'disabled';
			} else if (tags[i].enabled == 'required') {
				tagOption.innerHTML += ' (main)';
			}
			grouptagsBox.appendChild(tagOption);
		}
		grouptagsBox.disabled = false;
		console.log(groupTags);
		if (typeof callback != "undefined") {
			callback();
		}
	}
	
	function onTagSelected(event) {
		if (removingTag) resetTagDeletionPrompt();
		for (var i = 0; i < groupTags.length; i++) {
			if (groupTags[i].tag == this.value) {
				switch (groupTags[i].enabled) {
					case 'required':
						deleteTagBtn.disabled = true;
						toggleTagBtn.disabled = true;
						break;
					case 'true':
						deleteTagBtn.disabled = false;
						toggleTagBtn.innerHTML = 'Disable Tag';
						toggleTagBtn.disabled = false;
						break;
					case 'false':
						deleteTagBtn.disabled = false;
						toggleTagBtn.innerHTML = 'Enable Tag';
						toggleTagBtn.disabled = false;
						break;
					default:
						deleteTagBtn.disabled = true;
						toggleTagBtn.disabled = true;
						break;
				}
				break;
			}
		}
	}
	
	function ondeleteTagRequest(event) {
		if (removingTag) return;
		for (var i = 0; i < groupTags.length; i++) {
			if (groupTags[i].tag == grouptagsBox.value) {
				if (groupTags[i].enabled != 'required') {
					removingTag = true;
					var removedesc = document.createElement("p");
					removedesc.innerHTML = 'Are you sure you want to delete this group tag? You will have to submit a request again if you ever decide you want it back.';
					var yesRemoveBtn = document.createElement("button");
					yesRemoveBtn.innerHTML = 'Yes';
					yesRemoveBtn.onclick = function() {
						// delete tag;
						if (removingTag == true) {
							// Disable page
							 showDisabledOverlay();
							$(deleteTagConfirm).empty();
							deleteTagConfirm.innerHTML = '<p>Please wait...</p>';
							
							
							editTag(grouptagsBox.value, 'remove', function() {
								resetTagDeletionPrompt();
								hideDisabledOverlay();
							});
						}
					};
					var noRemoveBtn = document.createElement("button");
					noRemoveBtn.innerHTML = 'No';
					noRemoveBtn.onclick = resetTagDeletionPrompt;
					deleteTagConfirm.appendChild(removedesc);
					deleteTagConfirm.appendChild(yesRemoveBtn);
					deleteTagConfirm.appendChild(noRemoveBtn);
					$(deleteTagConfirm).slideDown('slow');
				}
				break;
			}
		}
	}
	
	function resetTagDeletionPrompt() {
		removingTag = false;
		$(deleteTagConfirm).slideUp('slow', function() {
			$(deleteTagConfirm).empty();
		});
	}
	
	function onToggleTagRequest(event) {
		for (var i = 0; i < groupTags.length; i++) {
			if (groupTags[i].tag == grouptagsBox.value) {
				if (groupTags[i].enabled != 'required') {
					showDisabledOverlay();
					var newState = '';
					if (groupTags[i].enabled === "true") {
						newState = 'disable';
					} else if (groupTags[i].enabled === "false") {
						newState = 'enable';
					} else {
						gtResponseBox.innerHTML = 'Invalid state. Contact support with error code: c1';
						$(gtResponseBox).removeClass('success').addClass('error');
						$(gtResponseBox).slideDown('slow');
						hideDisabledOverlay();
						return;
					}
					editTag(grouptagsBox.value, newState, function() {
						hideDisabledOverlay();
					});
				}
				break;
			}
		}
	}
	
	function editTag(tag, request, callback) {
		//chrome.permissions.request({origins: ['http://slitherfriends.pw/*']}, function(granted) {
			/*if (!granted) {
				$(gtResponseBox).removeClass('success').addClass('error');
				gtResponseBox.innerHTML = 'You must give the extension permission to communicate with the server in order to use group tags.';
				$(gtResponseBox).slideDown('slow');
				resetTagTokenSetup();
				return;
			}*/
			$(gtResponseBox).hide();
			if (storageTokens['tag'].length != 64) {
				resetTagTokenSetup();
				return;
			}
			if (request != "enable" && request != "disable" && request != "remove") return;
			$.post("http://slitherfriends.pw/extension/groups/manageTag.php", { 'tag': '{"tag":"' + tag + '","request":"' + request + '"}', 'token': storageTokens['tag'], 'v': '1' }, function(response) {
				response = JSON.parse(response);
				gtResponseBox.innerHTML = response.message;
				if (response.success != '1') {
					$(gtResponseBox).removeClass('success').addClass('error');
					$(gtResponseBox).slideDown('slow');
					callback();
					return;
				}
				clearAltTags(function(newGroupTags) {
					console.log(newGroupTags);
					newGroupTags = newGroupTags.concat(JSON.parse(response.data));
					console.log(newGroupTags);
					setTags(newGroupTags, function() {
						$(gtResponseBox).removeClass('error').addClass('success');
						$(gtResponseBox).slideDown('slow');
						callback()
					});
				});
			});
			//chrome.permissions.remove({origins: ['http://slitherfriends.pw/*']}, null);
		//});
	}
	
	function requestTag(event) {
		$(gtResponseBox).hide();
		if (storageTokens['tag'].length != 64) {
			resetTagTokenSetup();
			return;
		}
		if (newTagBox.value.length < 3) return;
		$.post("http://slitherfriends.pw/extension/groups/requestTag.php", { 'tag': newTagBox.value, 'token': storageTokens['tag'], 'v': '1' }, function(response) {
			response = JSON.parse(response);
			gtResponseBox.innerHTML = response.message;
			if (response.success != '1') {
				$(gtResponseBox).removeClass('success').addClass('error');
				$(gtResponseBox).slideDown('slow');
				return;
			}
			$(gtResponseBox).removeClass('error').addClass('success');
			$(gtResponseBox).slideDown('slow');
			//chrome.permissions.remove({origins: ['http://slitherfriends.pw/*']}, null);
		});
	}
	
	function checkNewTagBox(event) {
		if (newTagBox.value.length >= 3 && $(addTagBtn).is(":visible") != true) {
			$(addTagBtn).slideDown('fast', function() {
				addTagBtn.disabled = false;
			});
		} else if (newTagBox.value.length < 3 && $(addTagBtn).is(":visible") == true) {
			addTagBtn.disabled = true;
			$(addTagBtn).slideUp('fast');
		}
	}
	
	function enableRequestTags() {
		newTagBox.disabled = false;
		addTagBtn.disabled = false;
	}
	
	function clearAltTags(callback) {
		var requiredTags = groupTags.filter(isRequiredTag);
		if (typeof callback == "undefined") {
			return requiredTags;
		}
		callback(requiredTags);
	}
	
	function isRequiredTag(tag) {
		if (tag.enabled == 'required') {
			return true;
		} else {
			return false;
		}
	}
	
	function addListeners() {
		$(deleteTagBtn).on('click', ondeleteTagRequest);
		$(toggleTagBtn).on('click', onToggleTagRequest);
		$(addTagBtn).on('click', requestTag);
		$(newTagBox).on('input', checkNewTagBox);
	}
	
	function showDisabledOverlay() {
		$("body").append("<div id='overlay' style='background-color:grey;position:absolute;top:0;left:0;height:99%;width:100%;z-index:999;opacity:0.08;'></div>");
	}
	
	function hideDisabledOverlay() {
		$('#overlay').remove();
	}
	
	function closeOptions() {
		close();
	}
	
	window.onload = init();
	
})(window, jQuery);