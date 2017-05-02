var domain_dic = {};
var name_dic = {};

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

function onload() {
  startListening();
	if (localStorage.length == 0) {
		getJsonNoMatterWhat("../data/blackList.json", function(blackList) {
			localStorage.blacklist = JSON.stringify(blackList);
		});
	}
	chrome.cookies.getAll({}, function(cookies) {
    select("#total_count").innerText = cookies.length;

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

      if (!domain_dic[domain]) {
  			domain_dic[domain] = [];
  		}
  		domain_dic[domain].push(cookie);

      if (!name_dic[name]) {
        name_dic[name] = [];
      }
      name_dic[name].push(cookie);
    }
    select("#domain_count").innerText = Object.keys(domain_dic).length;
    select("#name_count").innerText = Object.keys(name_dic).length;
    $('#your_cookies_list').DataTable( {
        data: dataSet,
        columns: [
            { title: "Domain" },
            { title: "Name" },
            { title: "Secure" },
            { title: "Host Only" }
        ]
    });

		var blacklist = deserialize(localStorage.blacklist) || {};

		var trackers_count = 0;
		for (i = 0; i < blacklist[0]["data"].length; i++) {
			var dm = blacklist[0]["data"][i];
			if (domain_dic[dm]) {
				trackers_count = trackers_count + domain_dic[dm].length;
			}
		}
		select("#blacklist_trackers_count").innerText = trackers_count;

		var ads_count = 0;
		var ads_cookies_list = [];
		for(i = 0; i < cookies.length ; i++) {
      var dm = cookies[i].domain;
			if (dm.indexOf("ads.") !== -1) {
				ads_count = ads_count + 1;
				ads_cookies_list.push(cookies[i]);
			};
		}
		select("#blacklist_ads_count").innerText = ads_count;

		var google_count = 0;
		for (i = 0; i < blacklist[2]["data"].length; i++) {
			var name = blacklist[2]["data"][i];
			if (name_dic[name]) {
				google_count = google_count + name_dic[name].length;
			}
		}
		select("#blacklist_google_count").innerText = google_count;

		select("#blacklist_total_count").innerText = trackers_count + ads_count + google_count;
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
  console.log(name);
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

document.addEventListener('DOMContentLoaded', function() {
	onload();
  document.querySelector('#domain_button').addEventListener('click', pressDomainButton);
  document.querySelector('#name_button').addEventListener('click', pressNameButton);
  document.querySelector('#domain_name_button').addEventListener('click', pressDomainNameButton);
});