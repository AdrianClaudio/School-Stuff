/*Copyright (c) 2016 ksoft http://www.dummysoftware.com*/function validateForm(){var e=document.querySelector("#interval");e.classList.remove("error");var t=e.value;return t=t.replace("?",""),!(t.length<1||t<1||!isNumeric(t))||(e.classList.add("error"),e.focus(),!1)}function validateRegistrationForm(){var e=document.querySelector("#txtCode"),t=e.value.trim();return e.classList.remove("error"),!(t.length<6||0==/^[a-zA-Z0-9_]+$/.test(t))||(e.classList.add("error"),e.focus(),!1)}function isNumeric(e){return!isNaN(parseFloat(e))&&isFinite(e)}function fadeIn(e){e.style.opacity=0,e.style.display="block";var t=+new Date,a=function(){e.style.opacity=+e.style.opacity+(new Date-t)/200,t=+new Date,+e.style.opacity<1&&(window.requestAnimationFrame&&requestAnimationFrame(a)||setTimeout(a,16))};a()}function fadeOut(e){var t=+new Date,a=function(){e.style.opacity=+e.style.opacity-(new Date-t)/200,t=+new Date,+e.style.opacity>0?window.requestAnimationFrame&&requestAnimationFrame(a)||setTimeout(a,16):e.style.display="none"};a()}function slide(e,t){t=t||"18px";var a=e.classList.contains("visible");a?(e.classList.remove("visible"),e.style.maxHeight="0px"):(e.classList.add("visible"),e.style.maxHeight=t)}function getDomain(e){var t=document.createElement("a");t.href=e;var a=t.hostname.replace("www.","");return a}function getRandomInt(e,t){return Math.floor(Math.random()*(t-e+1))+e}function cleanArray(e){var t=e;if(t&&(t=t.map(Function.prototype.call,String.prototype.trim)),t&&(t=t.filter(function(e){return/\S/.test(e)})),t)for(var a in t)t[a].toLowerCase().indexOf("http")==-1&&t[a].toLowerCase().indexOf(":/")==-1&&(t[a]="http://"+t[a]);return t}function updateLastRefresh(e,t){var a=new Date,i=new Date(a.getTime()+1e3*t);return e.lastRefresh=formatDate(a,"M/d/yyyy h:mm:ss a"),e.nextRefresh=formatDate(i,"M/d/yyyy h:mm:ss a"),e}function getOptions(e){var t=null;if(e){var a=getDomain(e.url),i=!0;t=localStorage[a],t||(a=e.url,i=!1,t=localStorage[a])}if(t)t=JSON.parse(t);else{var t={};t.interval=10,t.refresh=!1,t.random=null,t.isDomain=!1,t.isCache=!1,t.isTimer=!1,t.isAllTabs=!1,t.isAutoClick=!1,t.autoClickId=null,t.autoClickIdValid=null,t.isAutoClickAfterRefresh=!1,t.isNotify=!1,t.notifyText=null,t.isUrlList=!1,t.urlList=[]}return t}function saveOptions(e,t){var a=getDomain(e.url);t.isDomain=!0,localStorage[a]||(a=e.url,t.isDomain=!1),localStorage[a]=JSON.stringify(t)}