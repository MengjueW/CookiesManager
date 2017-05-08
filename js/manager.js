var domain_dic = {};
var name_dic = {};
var cookies_in_your_browser = [];
var black_list = [];

String.prototype.trimLeft = function() {
	return this.replace(/^[w]+/g, '');
};

String.prototype.trim = function() {
	var url = this.trimLeft();
	return url.replace(/^\./g, '');
};

function select(selector) {
	return document.querySelector(selector);
}

function deserialize(object) {
	return typeof object == 'string' ? JSON.parse(object) : object;
}

function removeCookie(cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
	chrome.cookies.remove({
		"url" : url,
		"name" : cookie.name
	});
}

function removeCookiesByList(cookieList) {
  for (i = 0; i < cookieList.length ; i++) {
    removeCookie(cookieList[i]);
  }
}

function removeCookiesForDomain(domain) {
  if (domain_dic[domain]) {
    for (i = 0; i < domain_dic[domain].length ; i++) {
      removeCookie(domain_dic[domain][i]);
    }
  } else {
		for (i = 0; i < cookies_in_your_browser.length; i++) {
			if (cookies_in_your_browser[i].domain == domain) {
				removeCookie(cookies_in_your_browser[i]);
			}
		}
	}
}

function removeAllCookies() {
	for (i = 0; i < cookies_in_your_browser.length; i++) {
		removeCookie(cookies_in_your_browser[i]);
	}
}

function removeCookiesForName(name) {
  if (name_dic[name]) {
    for (i = 0; i < name_dic[name].length ; i++) {
      removeCookie(name_dic[name][i]);
    }
  }
}

function removeCookieForDomainAndForName(domain, name) {
  if (domain_dic[domain]) {
    for (i = 0; i < domain_dic[domain].length ; i++) {
      if (domain_dic[domain][i].name === name) {
        removeCookie(domain_dic[domain][i]);
      }
    }
  }
}

function startListening() {
	chrome.cookies.onChanged.addListener(reloadPage);
}

function getJsonNoMatterWhat(url, callback) {
	//hack from chrollusion
	jQuery.ajax({
		url : url,
		dataType : "json",
		error : function(xhr, errText, err) {
			var trackers = JSON.parse(xhr.responseText);
			callback(trackers);
		},
		success : function(data, okText, xhr) {
			callback(data);
		}
	});
}

function createDataTable(cookies) {
	var dataSet = [];
	for(i = 0; i < cookies.length ; i++) {
		var cookie = cookies[i];
		var domain = cookie.domain.trim();
		var name = cookie.name;
		var temp = [];
		temp.push(cookie.domain);
		temp.push(cookie.name);
		temp.push(cookie.secure);
		temp.push(cookie.hostOnly)
		dataSet.push(temp);
	}
		$('#your_cookies_list').DataTable( {
				data: dataSet,
				columns: [
						{ title: "Domain" },
						{ title: "Name" },
						{ title: "Secure" },
						{ title: "Host Only" }
				]
		});
}

function createDomainCookiesTable() {
	var dataset = []
	for (var key in domain_dic) {
		if (domain_dic.hasOwnProperty(key) && domain_dic[key].length > 20) {
				var temp = [];
				temp.push(domain_dic[key].length);
				temp.push(key);
				dataset.push(temp);
		}
	}

	$('#domain_cookies_list').DataTable( {
			data: dataset,
			columns: [
					{ title: "Cookies count" },
					{ title: "Domain" },
			]
	});
}

function getData(cookies) {
	for(i = 0; i < cookies.length ; i++) {
		var cookie = cookies[i];
		var domain = cookie.domain.trim();
		var name = cookie.name;
		cookies_in_your_browser.push(cookie);
		if (!domain_dic[domain]) {
			domain_dic[domain] = [];
		}
		domain_dic[domain].push(cookie);

		if (!name_dic[name]) {
			name_dic[name] = [];
		}
		name_dic[name].push(cookie);
	}
}

function getNameContainsKeyList(key, cookies) {
	var list = [];
	for(i = 0; i < cookies.length ; i++) {
		var name = cookies[i].name;
		if (name.indexOf(key) !== -1) {
			list.push(cookies[i]);
		};
	}
	return list;
}

function getDomainContainsKeyList(key, cookies) {
	var list = [];
	for(i = 0; i < cookies.length ; i++) {
		var dm = cookies[i].domain;
		if (dm.indexOf(key) !== -1) {
			list.push(cookies[i]);
		};
	}
	return list;
}

function ghost(isDeactivated) {

  options.style.color = isDeactivated ? 'graytext' : 'black';
                                              // The label color.
  options.frequency.disabled = isDeactivated; // The control manipulability.
}

window.addEventListener('load', function() {
  // Initialize the option controls.
  options.isActivated.checked = JSON.parse(localStorage.isActivated);
                                         // The display activation.
  options.frequency.value = localStorage.frequency;
                                         // The display frequency, in minutes.

  if (!options.isActivated.checked) { ghost(true); }

  // Set the display activation and frequency.
  options.isActivated.onchange = function() {
    localStorage.isActivated = options.isActivated.checked;
    ghost(!options.isActivated.checked);
  };

  options.frequency.onchange = function() {
    localStorage.frequency = options.frequency.value;
  };
});

function onload() {
  startListening();
	if (localStorage.length == 0) {
		getJsonNoMatterWhat("../data/blackList.json", function(blackList) {
			localStorage.blacklist = JSON.stringify(blackList);
		});
	}
	chrome.cookies.getAll({}, function(cookies) {
		createDataTable(cookies);
		getData(cookies);
		createDomainCookiesTable();

    select("#total_count").innerText = cookies.length;
    select("#domain_count").innerText = Object.keys(domain_dic).length;
    select("#name_count").innerText = Object.keys(name_dic).length;

		var blacklist = deserialize(localStorage.blacklist) || {};

		var trackers_count = 0;
		var trackers_list = [];
		for (i = 0; i < blacklist[0]["data"].length; i++) {
			var dm = blacklist[0]["data"][i];
			if (domain_dic[dm]) {
				trackers_count = trackers_count + domain_dic[dm].length;
				trackers_list = trackers_list.concat(domain_dic[dm]);
			}
		}
		select("#blacklist_trackers_count").innerText = trackers_count;

		var ads_cookies_list = getDomainContainsKeyList("ads.", cookies_in_your_browser);
		select("#blacklist_ads_count").innerText = ads_cookies_list.length;

		var google_count = 0;
		var google_list = [];
		for (i = 0; i < blacklist[2]["data"].length; i++) {
			var name = blacklist[2]["data"][i];
			if (name_dic[name]) {
				google_count = google_count + name_dic[name].length;
				google_list = google_list.concat(name_dic[name]);
			}
		}
		select("#blacklist_google_count").innerText = google_count;

		black_list = black_list.concat(trackers_list);
		black_list = black_list.concat(ads_cookies_list);
		black_list = black_list.concat(google_list);
		select("#blacklist_total_count").innerText = black_list.length;
	});
}

function reloadPage() {
  location.reload();
}

function pressDomainButton() {
  var domain = select("#domain_input").value;
  if (domain == "") {
    return;
  }
  removeCookiesForDomain(domain);
}

function pressNameButton() {
  var name = select("#name_input").value;
  if (name == "") {
    return;
  }
  removeCookiesForName(name);
}

function pressDomainNameButton() {
  var domain = select("#domain_name_input1").value;
  var name = select("#domain_name_input2").value;
  console.log(domain, name);
  if (domain == "" && name == "") {
    return;
  } else if (domain == "") {
    return pressDomainButton();
  } else if (name == "") {
    return pressNameButton();
  } else {
    removeCookieForDomainAndForName(domain, name);
  }
}

function pressBlacklistDeleteButton() {
	removeCookiesByList(black_list);
}

document.addEventListener('DOMContentLoaded', function() {
	onload();
  document.querySelector('#domain_button').addEventListener('click', pressDomainButton);
  document.querySelector('#name_button').addEventListener('click', pressNameButton);
  document.querySelector('#domain_name_button').addEventListener('click', pressDomainNameButton);
	document.querySelector('#blacklist_delete_button').addEventListener('click', pressBlacklistDeleteButton);
});
